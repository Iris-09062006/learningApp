create or replace function public.create_content_curriculum(
  p_course_title text,
  p_course_slug text,
  p_chapter_title text
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
  v_lesson public.lessons%rowtype;
  v_course_title text := trim(p_course_title);
  v_course_slug text := trim(p_course_slug);
  v_chapter_title text := trim(p_chapter_title);
begin
  if v_actor_id is null or not exists (
    select 1
    from public.profiles p
    where p.id = v_actor_id and p.is_active and p.role = 'admin'
  ) then
    raise exception 'FORBIDDEN' using errcode = 'P0003';
  end if;

  if v_course_title is null or char_length(v_course_title) < 1 or char_length(v_course_title) > 150 then
    raise exception 'INVALID_COURSE_TITLE' using errcode = 'P0001';
  end if;
  if v_chapter_title is null or char_length(v_chapter_title) < 1 or char_length(v_chapter_title) > 150 then
    raise exception 'INVALID_CHAPTER_TITLE' using errcode = 'P0001';
  end if;
  if v_course_slug is null
    or char_length(v_course_slug) < 1
    or char_length(v_course_slug) > 160
    or v_course_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  then
    raise exception 'INVALID_COURSE_SLUG' using errcode = 'P0001';
  end if;

  insert into public.courses (title, slug, is_published)
  values (v_course_title, v_course_slug, false)
  returning * into v_course;

  insert into public.chapters (course_id, title, chapter_order, is_published)
  values (v_course.id, v_chapter_title, 1, false)
  returning * into v_chapter;

  insert into public.lessons (chapter_id, title, lesson_order, is_published)
  values (v_chapter.id, v_chapter_title, 1, false)
  returning * into v_lesson;

  insert into public.admin_logs (actor_id, action, target_type, target_id, metadata)
  values (
    v_actor_id,
    'content_course_target.created',
    'lesson',
    v_lesson.id::text,
    jsonb_build_object('course_id', v_course.id, 'chapter_id', v_chapter.id)
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

revoke all on function public.create_content_curriculum(text, text, text) from public, anon;
grant execute on function public.create_content_curriculum(text, text, text) to authenticated;

create or replace function public.create_content_target_in_course(
  p_course_id bigint,
  p_chapter_title text
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
  v_lesson public.lessons%rowtype;
  v_chapter_title text := trim(p_chapter_title);
  v_next_chapter_order integer;
begin
  if v_actor_id is null or not exists (
    select 1
    from public.profiles p
    where p.id = v_actor_id and p.is_active and p.role = 'admin'
  ) then
    raise exception 'FORBIDDEN' using errcode = 'P0003';
  end if;

  if v_chapter_title is null or char_length(v_chapter_title) < 1 or char_length(v_chapter_title) > 150 then
    raise exception 'INVALID_CHAPTER_TITLE' using errcode = 'P0001';
  end if;

  select * into v_course
  from public.courses
  where id = p_course_id
  for update;
  if not found then
    raise exception 'COURSE_NOT_FOUND' using errcode = 'P0002';
  end if;

  select coalesce(max(ch.chapter_order), 0) + 1
  into v_next_chapter_order
  from public.chapters ch
  where ch.course_id = v_course.id;

  insert into public.chapters (course_id, title, chapter_order, is_published)
  values (v_course.id, v_chapter_title, v_next_chapter_order, false)
  returning * into v_chapter;

  insert into public.lessons (chapter_id, title, lesson_order, is_published)
  values (v_chapter.id, v_chapter_title, 1, false)
  returning * into v_lesson;

  insert into public.admin_logs (actor_id, action, target_type, target_id, metadata)
  values (
    v_actor_id,
    'content_course_target.appended',
    'lesson',
    v_lesson.id::text,
    jsonb_build_object('course_id', v_course.id, 'chapter_id', v_chapter.id)
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

revoke all on function public.create_content_target_in_course(bigint, text) from public, anon;
grant execute on function public.create_content_target_in_course(bigint, text) to authenticated;
