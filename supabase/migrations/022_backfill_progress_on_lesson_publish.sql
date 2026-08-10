create or replace function public.publish_lesson_draft(p_lesson_draft_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_draft public.lesson_drafts%rowtype;
  v_publication public.lesson_draft_publications%rowtype;
  v_section_count integer;
  v_cited_section_count integer;
  v_invalid_citation_count integer;
  v_content text;
  v_chapter_ready boolean;
  v_course_ready boolean;
  v_target_chapter_order integer;
  v_target_lesson_order integer;
begin
  if v_actor_id is null or not exists (
    select 1 from public.profiles p
    where p.id = v_actor_id and p.is_active and p.role = 'admin'
  ) then
    raise exception 'FORBIDDEN' using errcode = 'P0003';
  end if;

  select * into v_draft
  from public.lesson_drafts
  where id = p_lesson_draft_id
  for update;

  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_draft.status = 'published' then
    select * into v_publication
    from public.lesson_draft_publications
    where lesson_draft_id = v_draft.id;

    return jsonb_build_object(
      'lessonDraftId', v_draft.id,
      'lessonId', v_publication.lesson_id,
      'courseId', v_publication.course_id,
      'status', 'published',
      'coursePublished', (
        select c.is_published from public.courses c where c.id = v_publication.course_id
      ),
      'publishedAt', v_publication.published_at
    );
  end if;

  if v_draft.status <> 'approved' or v_draft.approved_revision <> v_draft.revision then
    raise exception 'DRAFT_NOT_APPROVED' using errcode = 'P0004';
  end if;

  select c.chapter_order, l.lesson_order
  into v_target_chapter_order, v_target_lesson_order
  from public.lessons l
  join public.chapters c on c.id = l.chapter_id
  where l.id = v_draft.target_lesson_id
    and c.id = v_draft.chapter_id
    and c.course_id = v_draft.course_id
  for update of l, c;

  if not found then
    raise exception 'TARGET_MISMATCH' using errcode = 'P0005';
  end if;

  perform 1 from public.courses where id = v_draft.course_id for update;

  if not exists (
    select 1 from public.source_documents d
    where d.id = v_draft.source_document_id
      and d.status = 'ready_for_review'
  ) then
    raise exception 'SOURCE_NOT_READY' using errcode = 'P0006';
  end if;

  v_section_count := jsonb_array_length(v_draft.sections);

  select count(distinct c.section_index),
         count(*) filter (where ch.source_document_id <> v_draft.source_document_id)
  into v_cited_section_count, v_invalid_citation_count
  from public.lesson_draft_citations c
  join public.document_chunks ch on ch.id = c.document_chunk_id
  where c.lesson_draft_id = v_draft.id
    and c.revision = v_draft.revision;

  if v_cited_section_count <> v_section_count or v_invalid_citation_count > 0 then
    raise exception 'CITATIONS_INVALID' using errcode = 'P0007';
  end if;

  select string_agg(
    '## ' || (section->>'heading') || E'\n\n' || (section->>'bodyMarkdown'),
    E'\n\n' order by ordinal
  ) into v_content
  from jsonb_array_elements(v_draft.sections) with ordinality as item(section, ordinal);

  update public.lessons
  set
    title = v_draft.title,
    content = v_content,
    estimated_minutes = v_draft.estimated_minutes,
    is_published = true
  where id = v_draft.target_lesson_id;

  insert into public.user_progress (user_id, lesson_id, status)
  select
    enrollment.user_id,
    v_draft.target_lesson_id,
    case
      when not exists (
        select 1
        from public.lessons prior_lesson
        join public.chapters prior_chapter on prior_chapter.id = prior_lesson.chapter_id
        where prior_chapter.course_id = v_draft.course_id
          and prior_chapter.is_published
          and prior_lesson.is_published
          and (prior_chapter.chapter_order, prior_lesson.lesson_order)
            < (v_target_chapter_order, v_target_lesson_order)
          and not exists (
            select 1
            from public.user_progress prior_progress
            where prior_progress.user_id = enrollment.user_id
              and prior_progress.lesson_id = prior_lesson.id
              and prior_progress.status = 'completed'
          )
      ) then 'unlocked'::public.progress_status
      else 'locked'::public.progress_status
    end
  from public.course_enrollments enrollment
  where enrollment.course_id = v_draft.course_id
    and enrollment.status <> 'cancelled'
  on conflict (user_id, lesson_id) do nothing;

  update public.course_enrollments enrollment
  set status = 'active', completed_at = null
  where enrollment.course_id = v_draft.course_id
    and enrollment.status = 'completed'
    and exists (
      select 1 from public.user_progress progress
      where progress.user_id = enrollment.user_id
        and progress.lesson_id = v_draft.target_lesson_id
        and progress.status <> 'completed'
    );

  select not exists (
    select 1 from public.lessons l
    where l.chapter_id = v_draft.chapter_id and not l.is_published
  ) into v_chapter_ready;

  if v_chapter_ready then
    update public.chapters set is_published = true where id = v_draft.chapter_id;
  end if;

  select not exists (
    select 1
    from public.chapters c
    left join public.lessons l on l.chapter_id = c.id
    where c.course_id = v_draft.course_id
      and (not c.is_published or l.id is null or not l.is_published)
  ) into v_course_ready;

  update public.courses
  set is_published = v_course_ready
  where id = v_draft.course_id;

  update public.lesson_drafts
  set status = 'published', published_at = now()
  where id = v_draft.id;

  insert into public.lesson_draft_publications (
    lesson_draft_id,
    source_document_id,
    course_id,
    lesson_id,
    published_revision,
    published_by
  ) values (
    v_draft.id,
    v_draft.source_document_id,
    v_draft.course_id,
    v_draft.target_lesson_id,
    v_draft.revision,
    v_actor_id
  )
  returning * into v_publication;

  insert into public.admin_logs (actor_id, action, target_type, target_id, metadata)
  values (
    v_actor_id,
    'lesson_draft.published',
    'lesson_draft',
    v_draft.id::text,
    jsonb_build_object(
      'lesson_id', v_draft.target_lesson_id,
      'course_id', v_draft.course_id,
      'revision', v_draft.revision,
      'course_published', v_course_ready
    )
  );

  return jsonb_build_object(
    'lessonDraftId', v_draft.id,
    'lessonId', v_draft.target_lesson_id,
    'courseId', v_draft.course_id,
    'status', 'published',
    'coursePublished', v_course_ready,
    'publishedAt', v_publication.published_at
  );
end;
$$;

revoke all on function public.publish_lesson_draft(bigint) from public, anon;
grant execute on function public.publish_lesson_draft(bigint) to authenticated;
