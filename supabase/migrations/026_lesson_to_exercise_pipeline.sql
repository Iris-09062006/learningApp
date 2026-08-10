create or replace function private.generated_exercise_content_is_valid(p_content jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_option jsonb;
  v_option_count integer;
  v_distinct_count integer;
begin
  if p_content is null
    or jsonb_typeof(p_content) <> 'object'
    or not (p_content ?& array['title', 'description', 'codeSnippet', 'options', 'correctAnswer', 'explanation'])
    or p_content - array['title', 'description', 'codeSnippet', 'options', 'correctAnswer', 'explanation'] <> '{}'::jsonb
    or jsonb_typeof(p_content->'title') <> 'string'
    or char_length(trim(p_content->>'title')) not between 1 and 150
    or jsonb_typeof(p_content->'description') <> 'string'
    or char_length(trim(p_content->>'description')) not between 1 and 2000
    or jsonb_typeof(p_content->'codeSnippet') <> 'string'
    or char_length(p_content->>'codeSnippet') > 10000
    or jsonb_typeof(p_content->'options') <> 'array'
    or jsonb_array_length(p_content->'options') not between 2 and 6
    or jsonb_typeof(p_content->'correctAnswer') <> 'string'
    or char_length(trim(p_content->>'correctAnswer')) not between 1 and 500
    or jsonb_typeof(p_content->'explanation') <> 'string'
    or char_length(trim(p_content->>'explanation')) not between 1 and 5000
  then return false; end if;

  for v_option in select value from jsonb_array_elements(p_content->'options')
  loop
    if jsonb_typeof(v_option) <> 'string'
      or char_length(trim(v_option #>> '{}')) not between 1 and 500
    then return false; end if;
  end loop;

  select count(*), count(distinct trim(value #>> '{}'))
  into v_option_count, v_distinct_count
  from jsonb_array_elements(p_content->'options');

  return v_option_count = v_distinct_count
    and exists (
      select 1 from jsonb_array_elements_text(p_content->'options') option_text
      where trim(option_text) = trim(p_content->>'correctAnswer')
    );
end;
$$;

revoke all on function private.generated_exercise_content_is_valid(jsonb)
  from public, anon, authenticated;

create or replace function public.get_lesson_exercise_generation_context(p_lesson_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_context jsonb;
begin
  if v_actor_id is null or not exists (
    select 1 from public.profiles p
    where p.id = v_actor_id and p.is_active and p.role in ('moderator', 'admin')
  ) then raise exception 'FORBIDDEN' using errcode = 'P0003'; end if;

  select jsonb_build_object(
    'lessonId', lesson.id,
    'lessonTitle', lesson.title,
    'lessonContent', coalesce(lesson.content, ''),
    'learningObjectives', coalesce((
      select jsonb_agg(objective.objective order by objective.objective_order)
      from public.course_import_lesson_publications publication
      join public.course_outline_lesson_objectives objective
        on objective.outline_lesson_id = publication.outline_lesson_id
      where publication.lesson_id = lesson.id
    ), '[]'::jsonb),
    'courseTitle', course.title,
    'courseDescription', course.description
  ) into v_context
  from public.lessons lesson
  join public.chapters chapter on chapter.id = lesson.chapter_id
  join public.courses course on course.id = chapter.course_id
  where lesson.id = p_lesson_id
    and lesson.is_published and chapter.is_published and course.is_published
    and course.archived_at is null;

  if v_context is null then raise exception 'LESSON_NOT_PUBLISHED' using errcode = 'P0002'; end if;
  return v_context;
end;
$$;

create or replace function public.create_generated_exercise_draft(
  p_lesson_id bigint,
  p_exercise_type public.exercise_type,
  p_difficulty public.difficulty_level,
  p_content jsonb,
  p_provider text,
  p_model text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_id bigint;
  v_created_at timestamptz;
begin
  if v_actor_id is null or not exists (
    select 1 from public.profiles p
    where p.id = v_actor_id and p.is_active and p.role in ('moderator', 'admin')
  ) then raise exception 'FORBIDDEN' using errcode = 'P0003'; end if;

  if not exists (
    select 1 from public.lessons lesson
    join public.chapters chapter on chapter.id = lesson.chapter_id
    join public.courses course on course.id = chapter.course_id
    where lesson.id = p_lesson_id and lesson.is_published and chapter.is_published
      and course.is_published and course.archived_at is null
  ) then raise exception 'LESSON_NOT_PUBLISHED' using errcode = 'P0002'; end if;

  if not private.generated_exercise_content_is_valid(p_content)
    or char_length(trim(p_provider)) not between 1 and 50
    or (p_model is not null and char_length(trim(p_model)) not between 1 and 100)
  then raise exception 'EXERCISE_DRAFT_INVALID' using errcode = 'P0001'; end if;

  insert into public.generated_exercises (
    lesson_id, requested_by, title, description, exercise_type, difficulty,
    content, status, provider, model
  ) values (
    p_lesson_id, v_actor_id, trim(p_content->>'title'), trim(p_content->>'description'),
    p_exercise_type, p_difficulty, p_content, 'pending', trim(p_provider), nullif(trim(p_model), '')
  ) returning id, created_at into v_id, v_created_at;

  return jsonb_build_object(
    'id', v_id, 'lessonId', p_lesson_id, 'exerciseType', p_exercise_type,
    'difficulty', p_difficulty, 'title', trim(p_content->>'title'),
    'description', trim(p_content->>'description'), 'content', p_content,
    'status', 'pending', 'provider', trim(p_provider), 'model', nullif(trim(p_model), ''),
    'requestedBy', v_actor_id, 'publishedExerciseId', null, 'publishedAt', null,
    'createdAt', v_created_at, 'updatedAt', v_created_at
  );
end;
$$;

create or replace function public.review_generated_exercise_draft(
  p_generated_exercise_id bigint,
  p_decision public.review_status,
  p_comment text default null,
  p_edited_draft jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_draft public.generated_exercises%rowtype;
  v_review_id bigint;
  v_reviewed_at timestamptz;
  v_title text;
  v_description text;
  v_content jsonb;
  v_type public.exercise_type;
  v_difficulty public.difficulty_level;
begin
  if v_actor_id is null or not exists (
    select 1 from public.profiles p
    where p.id = v_actor_id and p.is_active and p.role in ('moderator', 'admin')
  ) then raise exception 'FORBIDDEN' using errcode = 'P0003'; end if;
  if p_comment is not null and char_length(p_comment) > 2000
  then raise exception 'COMMENT_INVALID' using errcode = 'P0001'; end if;
  if p_decision is null then raise exception 'DECISION_INVALID' using errcode = 'P0001'; end if;

  select * into v_draft from public.generated_exercises
  where id = p_generated_exercise_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if v_draft.status = 'published' or v_draft.published_exercise_id is not null
  then raise exception 'ALREADY_PUBLISHED' using errcode = 'P0004'; end if;

  v_title := v_draft.title;
  v_description := coalesce(v_draft.description, '');
  v_content := v_draft.content;
  v_type := v_draft.exercise_type;
  v_difficulty := v_draft.difficulty;

  if p_edited_draft is not null then
    if jsonb_typeof(p_edited_draft) <> 'object'
      or not (p_edited_draft ?& array['title', 'description', 'exerciseType', 'difficulty', 'content'])
      or p_edited_draft - array['title', 'description', 'exerciseType', 'difficulty', 'content'] <> '{}'::jsonb
      or jsonb_typeof(p_edited_draft->'title') <> 'string'
      or char_length(trim(p_edited_draft->>'title')) not between 1 and 150
      or jsonb_typeof(p_edited_draft->'description') <> 'string'
      or char_length(trim(p_edited_draft->>'description')) not between 1 and 2000
      or (p_edited_draft->>'exerciseType') not in ('predict_output', 'fix_the_bug')
      or (p_edited_draft->>'difficulty') not in ('easy', 'medium', 'hard')
      or not private.generated_exercise_content_is_valid(p_edited_draft->'content')
      or trim(p_edited_draft->>'title') <> trim(p_edited_draft->'content'->>'title')
      or trim(p_edited_draft->>'description') <> trim(p_edited_draft->'content'->>'description')
    then raise exception 'EXERCISE_DRAFT_INVALID' using errcode = 'P0001'; end if;
    v_title := trim(p_edited_draft->>'title');
    v_description := trim(p_edited_draft->>'description');
    v_content := p_edited_draft->'content';
    v_type := (p_edited_draft->>'exerciseType')::public.exercise_type;
    v_difficulty := (p_edited_draft->>'difficulty')::public.difficulty_level;
  end if;

  if p_decision = 'approved' and not private.generated_exercise_content_is_valid(v_content)
  then raise exception 'EXERCISE_DRAFT_INVALID' using errcode = 'P0001'; end if;

  insert into public.exercise_reviews (
    generated_exercise_id, reviewer_id, status, comment, edited_snapshot
  ) values (
    p_generated_exercise_id, v_actor_id, p_decision, nullif(trim(p_comment), ''), p_edited_draft
  ) returning id, reviewed_at into v_review_id, v_reviewed_at;

  update public.generated_exercises set
    title = v_title, description = v_description, content = v_content,
    exercise_type = v_type, difficulty = v_difficulty,
    status = p_decision::text::public.generated_exercise_status, updated_at = now()
  where id = p_generated_exercise_id;

  return jsonb_build_object(
    'id', v_review_id, 'generatedExerciseId', p_generated_exercise_id,
    'reviewerId', v_actor_id, 'status', p_decision,
    'feedback', nullif(trim(p_comment), ''), 'createdAt', v_reviewed_at
  );
end;
$$;

create or replace function public.publish_generated_exercise(p_generated_exercise_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_draft public.generated_exercises%rowtype;
  v_exercise_id bigint;
  v_next_order integer;
  v_option record;
  v_option_id bigint;
  v_correct_option_id bigint;
  v_published_at timestamptz := now();
begin
  if v_actor_id is null or not exists (
    select 1 from public.profiles p
    where p.id = v_actor_id and p.is_active and p.role in ('moderator', 'admin')
  ) then raise exception 'FORBIDDEN' using errcode = 'P0003'; end if;

  select * into v_draft from public.generated_exercises
  where id = p_generated_exercise_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if v_draft.status = 'published' and v_draft.published_exercise_id is not null then
    return jsonb_build_object(
      'generatedExerciseId', v_draft.id, 'publishedExerciseId', v_draft.published_exercise_id,
      'status', 'published', 'publishedAt', v_draft.published_at
    );
  end if;
  if v_draft.status <> 'approved' then raise exception 'NOT_APPROVED' using errcode = 'P0004'; end if;
  if not private.generated_exercise_content_is_valid(v_draft.content)
  then raise exception 'EXERCISE_DRAFT_INVALID' using errcode = 'P0001'; end if;

  perform 1 from public.lessons lesson
  join public.chapters chapter on chapter.id = lesson.chapter_id
  join public.courses course on course.id = chapter.course_id
  where lesson.id = v_draft.lesson_id and lesson.is_published and chapter.is_published
    and course.is_published and course.archived_at is null
  for update of lesson;
  if not found then raise exception 'LESSON_NOT_PUBLISHED' using errcode = 'P0005'; end if;

  perform pg_advisory_xact_lock(v_draft.lesson_id);
  select coalesce(max(exercise_order), 0) + 1 into v_next_order
  from public.exercises where lesson_id = v_draft.lesson_id;

  insert into public.exercises (
    lesson_id, title, description, exercise_type, difficulty, code_snippet,
    exercise_order, is_required, is_published, source
  ) values (
    v_draft.lesson_id, v_draft.title, v_draft.description, v_draft.exercise_type,
    v_draft.difficulty, v_draft.content->>'codeSnippet', v_next_order,
    true, true, 'ai_generated'
  ) returning id into v_exercise_id;

  for v_option in
    select trim(value) as content, ordinality::integer as option_order
    from jsonb_array_elements_text(v_draft.content->'options') with ordinality
  loop
    insert into public.exercise_options (exercise_id, content, option_order, metadata)
    values (v_exercise_id, v_option.content, v_option.option_order, '{}'::jsonb)
    returning id into v_option_id;
    if v_option.content = trim(v_draft.content->>'correctAnswer') then
      v_correct_option_id := v_option_id;
    end if;
  end loop;
  if v_correct_option_id is null then raise exception 'CORRECT_OPTION_MISSING' using errcode = 'P0001'; end if;

  insert into public.exercise_solutions (exercise_id, solution, static_explanation)
  values (
    v_exercise_id, jsonb_build_object('correctOptionId', v_correct_option_id),
    trim(v_draft.content->>'explanation')
  );

  update public.generated_exercises set
    status = 'published', published_exercise_id = v_exercise_id,
    published_at = v_published_at, updated_at = v_published_at
  where id = v_draft.id;

  insert into public.admin_logs (actor_id, action, target_type, target_id, metadata)
  values (
    v_actor_id, 'generated_exercise.published', 'generated_exercise', v_draft.id::text,
    jsonb_build_object('published_exercise_id', v_exercise_id, 'lesson_id', v_draft.lesson_id)
  );

  return jsonb_build_object(
    'generatedExerciseId', v_draft.id, 'publishedExerciseId', v_exercise_id,
    'status', 'published', 'publishedAt', v_published_at
  );
end;
$$;

drop policy if exists "Moderators and admins can insert generated exercises" on public.generated_exercises;
drop policy if exists "Moderators and admins can update generated exercises" on public.generated_exercises;
drop policy if exists "Moderators and admins can insert exercise reviews" on public.exercise_reviews;
revoke insert, update, delete on table public.generated_exercises from anon, authenticated;
revoke insert, update, delete on table public.exercise_reviews from anon, authenticated;

revoke all on function public.get_lesson_exercise_generation_context(bigint) from public, anon;
revoke all on function public.create_generated_exercise_draft(bigint, public.exercise_type, public.difficulty_level, jsonb, text, text) from public, anon;
revoke all on function public.review_generated_exercise_draft(bigint, public.review_status, text, jsonb) from public, anon;
revoke all on function public.publish_generated_exercise(bigint) from public, anon;
grant execute on function public.get_lesson_exercise_generation_context(bigint) to authenticated;
grant execute on function public.create_generated_exercise_draft(bigint, public.exercise_type, public.difficulty_level, jsonb, text, text) to authenticated;
grant execute on function public.review_generated_exercise_draft(bigint, public.review_status, text, jsonb) to authenticated;
grant execute on function public.publish_generated_exercise(bigint) to authenticated;
