-- Keep JSON extraction grouped before Markdown concatenation. Without the
-- parentheses PostgreSQL can resolve || against jsonb first and try to parse
-- the leading Markdown "#" as JSON.
create or replace function public.publish_course_import_job(p_job_id bigint, p_course_slug text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_actor_id uuid := auth.uid(); v_job public.course_import_jobs%rowtype;
  v_draft public.course_drafts%rowtype; v_course public.courses%rowtype; v_chapter public.chapters%rowtype;
  v_outline_lesson public.course_outline_lessons%rowtype; v_content public.lesson_content_drafts%rowtype;
  v_lesson public.lessons%rowtype; v_publication_id bigint; v_content_text text; v_lesson_ids jsonb := '[]'::jsonb;
begin
  if v_actor_id is null or not exists (select 1 from public.profiles p where p.id = v_actor_id and p.is_active and p.role = 'admin')
  then raise exception 'FORBIDDEN' using errcode = 'P0003'; end if;
  select * into v_job from public.course_import_jobs where id = p_job_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if v_job.status = 'published' then
    return jsonb_build_object('jobId', v_job.id, 'sourceDocumentId', v_job.source_document_id,
      'courseId', v_job.published_course_id, 'status', 'published',
      'lessonIds', (select coalesce(jsonb_agg(lesson_id order by lesson_id), '[]'::jsonb)
        from public.course_import_lesson_publications lp join public.course_import_publications p on p.id = lp.publication_id where p.job_id = v_job.id));
  end if;
  if v_job.status <> 'ready_to_publish' then raise exception 'JOB_NOT_READY' using errcode = 'P0004'; end if;
  select * into v_draft from public.course_drafts where job_id = v_job.id and revision = v_job.approved_outline_revision;
  if not found then raise exception 'OUTLINE_NOT_APPROVED' using errcode = 'P0005'; end if;
  if char_length(trim(p_course_slug)) not between 1 and 160 or trim(p_course_slug) !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  then raise exception 'SLUG_INVALID' using errcode = 'P0001'; end if;
  insert into public.courses (title, slug, description, is_published)
  values (v_draft.title, trim(p_course_slug), v_draft.description, true) returning * into v_course;
  insert into public.chapters (course_id, title, description, chapter_order, is_published)
  values (v_course.id, 'Nội dung chính', v_draft.description, 1, true) returning * into v_chapter;
  insert into public.course_import_publications (job_id, course_id, chapter_id, outline_revision, published_by)
  values (v_job.id, v_course.id, v_chapter.id, v_draft.revision, v_actor_id) returning id into v_publication_id;

  for v_outline_lesson in select * from public.course_outline_lessons
    where course_draft_id = v_draft.id order by lesson_order for update
  loop
    select * into v_content from public.lesson_content_drafts
    where outline_lesson_id = v_outline_lesson.id and status = 'ready'
    order by revision desc limit 1;
    if not found then raise exception 'LESSON_CONTENT_MISSING' using errcode = 'P0006'; end if;
    select string_agg('## ' || (section->>'heading') || E'\n\n' || (section->>'bodyMarkdown'), E'\n\n' order by ordinality)
    into v_content_text from jsonb_array_elements(v_content.sections) with ordinality as item(section, ordinality);
    insert into public.lessons (chapter_id, title, content, lesson_order, estimated_minutes, is_published)
    values (v_chapter.id, v_content.title, v_content_text, v_outline_lesson.lesson_order,
      v_content.estimated_minutes, true) returning * into v_lesson;
    insert into public.course_import_lesson_publications (
      publication_id, outline_lesson_id, lesson_content_draft_id, lesson_id
    ) values (v_publication_id, v_outline_lesson.id, v_content.id, v_lesson.id);
    v_lesson_ids := v_lesson_ids || jsonb_build_array(v_lesson.id);
  end loop;

  update public.course_import_jobs set status = 'published', published_course_id = v_course.id,
    error_code = null where id = v_job.id;
  update public.source_documents set status = 'archived', error_code = null where id = v_job.source_document_id;
  insert into public.course_import_reviews (job_id, reviewer_id, outline_revision, decision)
  values (v_job.id, v_actor_id, v_draft.revision, 'published');
  insert into public.admin_logs (actor_id, action, target_type, target_id, metadata)
  values (v_actor_id, 'course_import.published', 'course_import_job', v_job.id::text,
    jsonb_build_object('course_id', v_course.id, 'lesson_ids', v_lesson_ids));
  return jsonb_build_object('jobId', v_job.id, 'sourceDocumentId', v_job.source_document_id,
    'courseId', v_course.id, 'status', 'published', 'lessonIds', v_lesson_ids);
end; $$;

revoke all on function public.publish_course_import_job(bigint, text) from public, anon;
grant execute on function public.publish_course_import_job(bigint, text) to authenticated;
