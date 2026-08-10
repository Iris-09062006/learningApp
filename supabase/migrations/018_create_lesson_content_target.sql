create or replace function public.create_lesson_content_target(
  p_chapter_id bigint,
  p_title text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_chapter public.chapters%rowtype;
  v_course public.courses%rowtype;
  v_lesson public.lessons%rowtype;
  v_title text := trim(p_title);
  v_next_order integer;
begin
  if v_actor_id is null or not exists (
    select 1
    from public.profiles p
    where p.id = v_actor_id and p.is_active and p.role = 'admin'
  ) then
    raise exception 'FORBIDDEN' using errcode = 'P0003';
  end if;

  if v_title is null or char_length(v_title) < 1 or char_length(v_title) > 150 then
    raise exception 'INVALID_TITLE' using errcode = 'P0001';
  end if;

  select * into v_chapter
  from public.chapters
  where id = p_chapter_id
  for update;
  if not found then
    raise exception 'CHAPTER_NOT_FOUND' using errcode = 'P0002';
  end if;

  select * into v_course
  from public.courses
  where id = v_chapter.course_id;

  select coalesce(max(l.lesson_order), 0) + 1
  into v_next_order
  from public.lessons l
  where l.chapter_id = v_chapter.id;

  insert into public.lessons (chapter_id, title, lesson_order, is_published)
  values (v_chapter.id, v_title, v_next_order, false)
  returning * into v_lesson;

  insert into public.admin_logs (actor_id, action, target_type, target_id, metadata)
  values (
    v_actor_id,
    'lesson_content_target.created',
    'lesson',
    v_lesson.id::text,
    jsonb_build_object('chapter_id', v_chapter.id, 'course_id', v_course.id)
  );

  return jsonb_build_object(
    'lessonId', v_lesson.id,
    'lessonTitle', v_lesson.title,
    'chapterId', v_chapter.id,
    'chapterTitle', v_chapter.title,
    'courseId', v_course.id,
    'courseTitle', v_course.title
  );
end;
$$;

revoke all on function public.create_lesson_content_target(bigint, text) from public, anon;
grant execute on function public.create_lesson_content_target(bigint, text) to authenticated;
