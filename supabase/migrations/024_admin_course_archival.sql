alter table public.courses
  add column archived_at timestamptz;

alter table public.courses
  add constraint courses_archived_not_published
  check (archived_at is null or not is_published);

create index idx_courses_active_created
  on public.courses(created_at desc)
  where archived_at is null;

create or replace function public.admin_archive_course(p_course_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_course public.courses%rowtype;
  v_archived_at timestamptz := now();
  v_audit_log_id bigint;
begin
  if v_actor_id is null then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = v_actor_id and role = 'admin' and is_active = true
  ) then
    raise exception 'FORBIDDEN' using errcode = 'P0003';
  end if;

  select * into v_course
  from public.courses
  where id = p_course_id and archived_at is null
  for update;

  if v_course.id is null then
    raise exception 'COURSE_NOT_FOUND' using errcode = 'P0002';
  end if;

  update public.exercises
  set is_published = false, updated_at = v_archived_at
  where lesson_id in (
    select l.id
    from public.lessons l
    join public.chapters c on c.id = l.chapter_id
    where c.course_id = p_course_id
  );

  update public.lessons
  set is_published = false, updated_at = v_archived_at
  where chapter_id in (
    select id from public.chapters where course_id = p_course_id
  );

  update public.chapters
  set is_published = false, updated_at = v_archived_at
  where course_id = p_course_id;

  update public.courses
  set is_published = false, archived_at = v_archived_at, updated_at = v_archived_at
  where id = p_course_id;

  insert into public.admin_logs (actor_id, action, target_type, target_id, metadata)
  values (
    v_actor_id,
    'course.archived',
    'course',
    p_course_id::text,
    jsonb_build_object(
      'title', v_course.title,
      'previous_is_published', v_course.is_published,
      'deletion_mode', 'archive'
    )
  )
  returning id into v_audit_log_id;

  return jsonb_build_object(
    'courseId', p_course_id,
    'archivedAt', v_archived_at,
    'auditLogId', v_audit_log_id
  );
end;
$$;

revoke all on function public.admin_archive_course(bigint) from public;
revoke all on function public.admin_archive_course(bigint) from anon;
grant execute on function public.admin_archive_course(bigint) to authenticated;
