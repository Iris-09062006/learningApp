create or replace function public.start_lesson(p_lesson_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_course_id bigint;
  v_enrollment public.course_enrollments%rowtype;
  v_progress public.user_progress%rowtype;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.profiles as profile
    where profile.id = v_user_id
      and profile.role = 'learner'
      and profile.is_active = true
  ) then
    raise exception using errcode = '42501', message = 'Active learner profile required';
  end if;

  select chapter.course_id
  into v_course_id
  from public.lessons as lesson
  join public.chapters as chapter on chapter.id = lesson.chapter_id
  join public.courses as course on course.id = chapter.course_id
  where lesson.id = p_lesson_id
    and lesson.is_published = true
    and chapter.is_published = true
    and course.is_published = true;

  if not found then
    raise exception using errcode = 'P0002', message = 'Published lesson not found';
  end if;

  select enrollment.*
  into v_enrollment
  from public.course_enrollments as enrollment
  where enrollment.user_id = v_user_id
    and enrollment.course_id = v_course_id
    and enrollment.status <> 'cancelled'
  for update;

  if not found then
    raise exception using errcode = '42501', message = 'Course enrollment required';
  end if;

  select progress.*
  into v_progress
  from public.user_progress as progress
  where progress.user_id = v_user_id
    and progress.lesson_id = p_lesson_id
  for update;

  if not found then
    raise exception using errcode = '42501', message = 'Lesson access required';
  end if;

  if v_progress.status = 'locked' then
    raise exception using errcode = '42501', message = 'Lesson is locked';
  end if;

  update public.user_progress as progress
  set
    status = case
      when progress.status = 'unlocked' then 'in_progress'::public.progress_status
      else progress.status
    end,
    started_at = case
      when progress.status = 'unlocked' then coalesce(progress.started_at, now())
      else progress.started_at
    end,
    last_accessed_at = now(),
    updated_at = now()
  where progress.id = v_progress.id
  returning progress.* into v_progress;

  return jsonb_build_object(
    'lesson_id', v_progress.lesson_id,
    'status', v_progress.status,
    'started_at', v_progress.started_at
  );
end;
$$;

revoke all on function public.start_lesson(bigint) from public, anon, authenticated;
grant execute on function public.start_lesson(bigint) to authenticated;
