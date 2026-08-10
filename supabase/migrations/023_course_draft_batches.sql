create or replace function public.create_course_lesson_drafts(
  p_source_document_id bigint,
  p_course_title text,
  p_course_slug text,
  p_course_description text,
  p_lessons jsonb,
  p_provider text,
  p_model text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_course public.courses%rowtype;
  v_chapter public.chapters%rowtype;
  v_target_lesson public.lessons%rowtype;
  v_lesson_draft_id bigint;
  v_lesson jsonb;
  v_citation jsonb;
  v_lesson_order integer := 0;
  v_draft_ids jsonb := '[]'::jsonb;
begin
  if v_actor_id is null or not exists (
    select 1 from public.profiles p
    where p.id = v_actor_id and p.is_active and p.role = 'admin'
  ) then
    raise exception 'FORBIDDEN' using errcode = 'P0003';
  end if;

  perform 1 from public.source_documents
  where id = p_source_document_id and status = 'generating'
  for update;
  if not found then
    raise exception 'SOURCE_NOT_GENERATING' using errcode = 'P0006';
  end if;

  if char_length(trim(p_course_title)) not between 1 and 150
    or char_length(trim(p_course_slug)) not between 1 and 160
    or trim(p_course_slug) !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    or p_course_description is null
    or char_length(trim(p_course_description)) < 1
    or jsonb_typeof(p_lessons) <> 'array'
    or jsonb_array_length(p_lessons) not between 2 and 20
  then
    raise exception 'COURSE_DRAFT_INVALID' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.lesson_drafts d
    where d.source_document_id = p_source_document_id
  ) then
    raise exception 'SOURCE_ALREADY_GENERATED' using errcode = 'P0004';
  end if;

  insert into public.courses (title, slug, description, is_published)
  values (trim(p_course_title), trim(p_course_slug), trim(p_course_description), false)
  returning * into v_course;

  insert into public.chapters (course_id, title, description, chapter_order, is_published)
  values (v_course.id, 'Nội dung chính', trim(p_course_description), 1, false)
  returning * into v_chapter;

  for v_lesson in select * from jsonb_array_elements(p_lessons)
  loop
    v_lesson_order := v_lesson_order + 1;
    if char_length(trim(v_lesson->>'title')) not between 1 and 150
      or char_length(trim(v_lesson->>'summary')) < 1
      or coalesce((v_lesson->>'estimatedMinutes')::integer, 0) not between 1 and 180
      or jsonb_typeof(v_lesson->'sections') <> 'array'
      or jsonb_array_length(v_lesson->'sections') not between 1 and 12
      or exists (
        select 1
        from jsonb_array_elements(v_lesson->'sections') as section(value)
        where jsonb_typeof(section.value) <> 'object'
          or coalesce(char_length(trim(section.value->>'heading')), 0) < 1
          or coalesce(char_length(trim(section.value->>'bodyMarkdown')), 0) < 1
          or case
            when jsonb_typeof(section.value->'citationChunkIndexes') = 'array'
              then jsonb_array_length(section.value->'citationChunkIndexes') < 1
            else true
          end
      )
    then
      raise exception 'LESSON_DRAFT_INVALID' using errcode = 'P0001';
    end if;

    insert into public.lessons (chapter_id, title, lesson_order, is_published)
    values (v_chapter.id, trim(v_lesson->>'title'), v_lesson_order, false)
    returning * into v_target_lesson;

    insert into public.lesson_drafts (
      source_document_id, course_id, chapter_id, target_lesson_id, requested_by,
      title, summary, estimated_minutes, sections, provider, model
    ) values (
      p_source_document_id, v_course.id, v_chapter.id, v_target_lesson.id, v_actor_id,
      trim(v_lesson->>'title'), trim(v_lesson->>'summary'),
      (v_lesson->>'estimatedMinutes')::integer, v_lesson->'sections',
      p_provider, p_model
    ) returning id into v_lesson_draft_id;

    for v_citation in
      select jsonb_build_object(
        'sectionIndex', section.ordinality - 1,
        'chunkIndex', citation.value
      )
      from jsonb_array_elements(v_lesson->'sections') with ordinality as section(value, ordinality)
      cross join jsonb_array_elements(section.value->'citationChunkIndexes') as citation(value)
    loop
      insert into public.lesson_draft_citations (
        lesson_draft_id, revision, section_index, document_chunk_id, quote
      )
      select
        v_lesson_draft_id,
        1,
        (v_citation->>'sectionIndex')::integer,
        chunk.id,
        left(chunk.content, 500)
      from public.document_chunks chunk
      where chunk.source_document_id = p_source_document_id
        and chunk.chunk_index = (v_citation->>'chunkIndex')::integer;
      if not found then
        raise exception 'CITATION_INVALID' using errcode = 'P0007';
      end if;
    end loop;

    v_draft_ids := v_draft_ids || jsonb_build_array(v_lesson_draft_id);
  end loop;

  update public.source_documents
  set status = 'ready_for_review', error_code = null
  where id = p_source_document_id;

  insert into public.admin_logs (actor_id, action, target_type, target_id, metadata)
  values (
    v_actor_id,
    'course_draft.generated',
    'course',
    v_course.id::text,
    jsonb_build_object(
      'source_document_id', p_source_document_id,
      'chapter_id', v_chapter.id,
      'lesson_draft_ids', v_draft_ids
    )
  );

  return jsonb_build_object(
    'sourceDocumentId', p_source_document_id,
    'courseId', v_course.id,
    'chapterId', v_chapter.id,
    'lessonDraftIds', v_draft_ids,
    'status', 'pending_review'
  );
end;
$$;

create or replace function public.review_course_draft_batch(
  p_source_document_id bigint,
  p_decision public.lesson_draft_review_decision,
  p_comment text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_course_id bigint;
  v_course_count integer;
  v_draft public.lesson_drafts%rowtype;
  v_publication jsonb;
  v_lesson_ids jsonb := '[]'::jsonb;
begin
  if v_actor_id is null or not exists (
    select 1 from public.profiles p
    where p.id = v_actor_id and p.is_active and p.role = 'admin'
  ) then
    raise exception 'FORBIDDEN' using errcode = 'P0003';
  end if;

  perform 1 from public.source_documents
  where id = p_source_document_id and status = 'ready_for_review'
  for update;
  if not found then
    raise exception 'SOURCE_NOT_READY' using errcode = 'P0006';
  end if;

  select min(course_id), count(distinct course_id)
  into v_course_id, v_course_count
  from public.lesson_drafts
  where source_document_id = p_source_document_id
    and status in ('pending_review', 'needs_revision');
  if v_course_id is null or v_course_count <> 1 then
    raise exception 'COURSE_DRAFT_NOT_FOUND' using errcode = 'P0002';
  end if;

  if p_decision = 'rejected' then
    insert into public.lesson_draft_reviews (
      lesson_draft_id, reviewer_id, revision, decision, comment
    )
    select id, v_actor_id, revision, p_decision, nullif(trim(p_comment), '')
    from public.lesson_drafts
    where source_document_id = p_source_document_id
      and status in ('pending_review', 'needs_revision');

    update public.lesson_drafts
    set status = 'rejected', approved_revision = null
    where source_document_id = p_source_document_id
      and status in ('pending_review', 'needs_revision');
    update public.source_documents set status = 'archived'
    where id = p_source_document_id;
  elsif p_decision = 'needs_revision' then
    insert into public.lesson_draft_reviews (
      lesson_draft_id, reviewer_id, revision, decision, comment
    )
    select id, v_actor_id, revision, p_decision, nullif(trim(p_comment), '')
    from public.lesson_drafts
    where source_document_id = p_source_document_id
      and status in ('pending_review', 'needs_revision');

    update public.lesson_drafts
    set status = 'needs_revision', approved_revision = null
    where source_document_id = p_source_document_id
      and status in ('pending_review', 'needs_revision');
  elsif p_decision = 'approved' then
    for v_draft in
      select * from public.lesson_drafts
      where source_document_id = p_source_document_id
        and status in ('pending_review', 'needs_revision')
      order by id
      for update
    loop
      insert into public.lesson_draft_reviews (
        lesson_draft_id, reviewer_id, revision, decision, comment
      ) values (
        v_draft.id, v_actor_id, v_draft.revision, p_decision, nullif(trim(p_comment), '')
      );
      update public.lesson_drafts
      set status = 'approved', approved_revision = revision
      where id = v_draft.id;
      v_publication := public.publish_lesson_draft(v_draft.id);
      v_lesson_ids := v_lesson_ids || jsonb_build_array((v_publication->>'lessonId')::bigint);
    end loop;
    update public.source_documents set status = 'archived'
    where id = p_source_document_id;
  else
    raise exception 'DECISION_INVALID' using errcode = 'P0001';
  end if;

  insert into public.admin_logs (actor_id, action, target_type, target_id, metadata)
  values (
    v_actor_id,
    'course_draft.reviewed',
    'course',
    v_course_id::text,
    jsonb_build_object(
      'source_document_id', p_source_document_id,
      'decision', p_decision,
      'lesson_ids', v_lesson_ids
    )
  );

  return jsonb_build_object(
    'sourceDocumentId', p_source_document_id,
    'courseId', v_course_id,
    'status', case when p_decision = 'approved' then 'published' else p_decision::text end,
    'lessonIds', v_lesson_ids
  );
end;
$$;

revoke all on function public.create_course_lesson_drafts(bigint, text, text, text, jsonb, text, text) from public, anon;
revoke all on function public.review_course_draft_batch(bigint, public.lesson_draft_review_decision, text) from public, anon;
grant execute on function public.create_course_lesson_drafts(bigint, text, text, text, jsonb, text, text) to authenticated;
grant execute on function public.review_course_draft_batch(bigint, public.lesson_draft_review_decision, text) to authenticated;
