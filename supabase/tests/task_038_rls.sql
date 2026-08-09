begin;

do $$
declare
  unprotected_tables integer;
begin
  select count(*) into unprotected_tables
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
    and not c.relrowsecurity;
  if unprotected_tables <> 0 then
    raise exception 'public tables without RLS: %', unprotected_tables;
  end if;

  if has_table_privilege('anon', 'public.exercise_solutions', 'select')
    or has_table_privilege('authenticated', 'public.exercise_solutions', 'select') then
    raise exception 'exercise_solutions must not be selectable by client roles';
  end if;

  if has_function_privilege(
      'anon',
      'public.consume_rate_limit(text,text,integer,integer)',
      'execute'
    )
    or has_function_privilege(
      'authenticated',
      'public.consume_rate_limit(text,text,integer,integer)',
      'execute'
    )
    or not has_function_privilege(
      'service_role',
      'public.consume_rate_limit(text,text,integer,integer)',
      'execute'
    ) then
    raise exception 'consume_rate_limit execute grants are unsafe';
  end if;
end;
$$;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'rls-one@example.test', '', now(),
    '{}'::jsonb, '{"username":"rls-one"}'::jsonb, now(), now()
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'rls-two@example.test', '', now(),
    '{}'::jsonb, '{"username":"rls-two"}'::jsonb, now(), now()
  );

insert into public.courses (id, title, slug, is_published)
values (9001, 'RLS Course', 'rls-course', true);
insert into public.chapters (id, course_id, title, chapter_order, is_published)
values (9001, 9001, 'RLS Chapter', 1, true);
insert into public.lessons (id, chapter_id, title, lesson_order, is_published)
values (9001, 9001, 'RLS Lesson', 1, true);
insert into public.exercises (
  id, lesson_id, title, exercise_type, exercise_order, is_published
) values (9001, 9001, 'RLS Exercise', 'predict_output', 1, true);
insert into public.exercise_solutions (exercise_id, solution)
values (9001, '{"answer":"secret"}'::jsonb);

insert into public.course_enrollments (user_id, course_id)
values
  ('10000000-0000-4000-8000-000000000001', 9001),
  ('20000000-0000-4000-8000-000000000002', 9001);
insert into public.user_progress (user_id, lesson_id, status)
values
  ('10000000-0000-4000-8000-000000000001', 9001, 'in_progress'),
  ('20000000-0000-4000-8000-000000000002', 9001, 'in_progress');
insert into public.submissions (
  id, user_id, exercise_id, answer, is_correct, attempt_number
) values
  (9001, '10000000-0000-4000-8000-000000000001', 9001, '{}'::jsonb, false, 1),
  (9002, '20000000-0000-4000-8000-000000000002', 9001, '{}'::jsonb, false, 1);
insert into public.ai_explanations (
  submission_id, response, provider, status
) values
  (9001, 'one', 'test', 'success'),
  (9002, 'two', 'test', 'success');

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000001',
  true
);

select 1 / (count(*) = 1)::integer from public.profiles;
select 1 / (count(*) = 1)::integer from public.course_enrollments;
select 1 / (count(*) = 1)::integer from public.user_progress;
select 1 / (count(*) = 1)::integer from public.submissions;
select 1 / (count(*) = 1)::integer from public.ai_explanations;

reset role;
set local role service_role;
select * from public.consume_rate_limit(
  'task-038-test',
  repeat('a', 64),
  1,
  3600
);
select 1 / (not allowed)::integer
from public.consume_rate_limit(
  'task-038-test',
  repeat('a', 64),
  1,
  3600
);

rollback;
