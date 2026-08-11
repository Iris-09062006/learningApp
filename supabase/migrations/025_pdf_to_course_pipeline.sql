create type public.course_import_status as enum (
  'uploaded',
  'processing',
  'outline_review',
  'generating_content',
  'content_review',
  'ready_to_publish',
  'published',
  'failed',
  'rejected'
);

create type public.lesson_content_draft_status as enum ('ready', 'failed');

create table public.course_import_jobs (
  id bigint generated always as identity primary key,
  source_document_id bigint not null unique references public.source_documents(id) on delete restrict,
  requested_by uuid not null references public.profiles(id) on delete restrict,
  status public.course_import_status not null default 'uploaded',
  current_outline_revision integer not null default 0,
  approved_outline_revision integer,
  error_code varchar(100),
  published_course_id bigint unique references public.courses(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_import_outline_revision_valid check (
    current_outline_revision >= 0
    and (approved_outline_revision is null or approved_outline_revision between 1 and current_outline_revision)
  ),
  constraint course_import_publication_state_valid check (
    (status = 'published' and published_course_id is not null)
    or (status <> 'published' and published_course_id is null)
  )
);

create table public.course_drafts (
  id bigint generated always as identity primary key,
  job_id bigint not null references public.course_import_jobs(id) on delete cascade,
  revision integer not null,
  title varchar(150) not null,
  description text not null,
  provider varchar(50) not null,
  model varchar(100),
  created_at timestamptz not null default now(),
  constraint course_drafts_job_revision_unique unique (job_id, revision),
  constraint course_drafts_revision_positive check (revision > 0),
  constraint course_drafts_title_not_blank check (char_length(trim(title)) between 1 and 150),
  constraint course_drafts_description_not_blank check (char_length(trim(description)) > 0)
);

create table public.course_draft_objectives (
  id bigint generated always as identity primary key,
  course_draft_id bigint not null references public.course_drafts(id) on delete cascade,
  objective_order integer not null,
  objective text not null,
  constraint course_draft_objectives_order_unique unique (course_draft_id, objective_order),
  constraint course_draft_objectives_order_positive check (objective_order > 0),
  constraint course_draft_objectives_not_blank check (char_length(trim(objective)) between 1 and 300)
);

create table public.course_outline_lessons (
  id bigint generated always as identity primary key,
  course_draft_id bigint not null references public.course_drafts(id) on delete cascade,
  client_key varchar(80) not null,
  lesson_order integer not null,
  title varchar(150) not null,
  summary text not null,
  constraint course_outline_lessons_key_unique unique (course_draft_id, client_key),
  constraint course_outline_lessons_order_unique unique (course_draft_id, lesson_order),
  constraint course_outline_lessons_order_positive check (lesson_order > 0),
  constraint course_outline_lessons_title_not_blank check (char_length(trim(title)) between 1 and 150),
  constraint course_outline_lessons_summary_not_blank check (char_length(trim(summary)) > 0)
);

create table public.course_outline_lesson_objectives (
  id bigint generated always as identity primary key,
  outline_lesson_id bigint not null references public.course_outline_lessons(id) on delete cascade,
  objective_order integer not null,
  objective text not null,
  constraint course_outline_lesson_objectives_order_unique unique (outline_lesson_id, objective_order),
  constraint course_outline_lesson_objectives_order_positive check (objective_order > 0),
  constraint course_outline_lesson_objectives_not_blank check (char_length(trim(objective)) between 1 and 300)
);

create table public.course_outline_lesson_sources (
  outline_lesson_id bigint not null references public.course_outline_lessons(id) on delete cascade,
  document_chunk_id bigint not null references public.document_chunks(id) on delete restrict,
  source_order integer not null,
  primary key (outline_lesson_id, document_chunk_id),
  constraint course_outline_lesson_sources_order_unique unique (outline_lesson_id, source_order),
  constraint course_outline_lesson_sources_order_nonnegative check (source_order >= 0)
);

create table public.lesson_content_drafts (
  id bigint generated always as identity primary key,
  outline_lesson_id bigint not null references public.course_outline_lessons(id) on delete cascade,
  revision integer not null,
  title varchar(150) not null,
  summary text not null,
  estimated_minutes integer not null,
  sections jsonb not null,
  status public.lesson_content_draft_status not null default 'ready',
  provider varchar(50) not null,
  model varchar(100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_content_drafts_lesson_revision_unique unique (outline_lesson_id, revision),
  constraint lesson_content_drafts_revision_positive check (revision > 0),
  constraint lesson_content_drafts_title_not_blank check (char_length(trim(title)) between 1 and 150),
  constraint lesson_content_drafts_summary_not_blank check (char_length(trim(summary)) > 0),
  constraint lesson_content_drafts_minutes_valid check (estimated_minutes between 1 and 180),
  constraint lesson_content_drafts_sections_valid check (
    jsonb_typeof(sections) = 'array' and jsonb_array_length(sections) between 1 and 12
  )
);

create table public.lesson_content_draft_citations (
  id bigint generated always as identity primary key,
  lesson_content_draft_id bigint not null references public.lesson_content_drafts(id) on delete cascade,
  section_index integer not null,
  document_chunk_id bigint not null references public.document_chunks(id) on delete restrict,
  quote text not null,
  constraint lesson_content_draft_citations_unique unique (
    lesson_content_draft_id, section_index, document_chunk_id
  ),
  constraint lesson_content_draft_citations_section_nonnegative check (section_index >= 0),
  constraint lesson_content_draft_citations_quote_not_blank check (char_length(trim(quote)) between 1 and 500)
);

create table public.course_import_reviews (
  id bigint generated always as identity primary key,
  job_id bigint not null references public.course_import_jobs(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  outline_revision integer not null,
  decision varchar(30) not null,
  comment text,
  reviewed_at timestamptz not null default now(),
  constraint course_import_reviews_decision_valid check (
    decision in ('needs_revision', 'ready_to_publish', 'rejected', 'published')
  ),
  constraint course_import_reviews_comment_length check (comment is null or char_length(comment) <= 2000)
);

create table public.course_import_publications (
  id bigint generated always as identity primary key,
  job_id bigint not null unique references public.course_import_jobs(id) on delete restrict,
  course_id bigint not null unique references public.courses(id) on delete restrict,
  chapter_id bigint not null unique references public.chapters(id) on delete restrict,
  outline_revision integer not null,
  published_by uuid not null references public.profiles(id) on delete restrict,
  published_at timestamptz not null default now()
);

create table public.course_import_lesson_publications (
  publication_id bigint not null references public.course_import_publications(id) on delete restrict,
  outline_lesson_id bigint not null unique references public.course_outline_lessons(id) on delete restrict,
  lesson_content_draft_id bigint not null unique references public.lesson_content_drafts(id) on delete restrict,
  lesson_id bigint not null unique references public.lessons(id) on delete restrict,
  primary key (publication_id, outline_lesson_id)
);

create index course_import_jobs_status_created_idx on public.course_import_jobs(status, created_at desc);
create index course_drafts_job_revision_idx on public.course_drafts(job_id, revision desc);
create index course_outline_lessons_draft_order_idx on public.course_outline_lessons(course_draft_id, lesson_order);
create index lesson_content_drafts_outline_revision_idx on public.lesson_content_drafts(outline_lesson_id, revision desc);
create index lesson_content_draft_citations_draft_idx on public.lesson_content_draft_citations(lesson_content_draft_id, section_index);

create trigger set_course_import_jobs_updated_at before update on public.course_import_jobs
  for each row execute function public.set_updated_at();
create trigger set_lesson_content_drafts_updated_at before update on public.lesson_content_drafts
  for each row execute function public.set_updated_at();

create or replace function public.initialize_course_import_job()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.course_import_jobs (source_document_id, requested_by, status)
  values (new.id, new.uploaded_by, 'uploaded') on conflict (source_document_id) do nothing;
  return new;
end; $$;

revoke all on function public.initialize_course_import_job() from public, anon, authenticated;

create trigger initialize_course_import_job_after_source
  after insert on public.source_documents
  for each row execute function public.initialize_course_import_job();

insert into public.course_import_jobs (source_document_id, requested_by, status)
select source.id, source.uploaded_by,
  case when source.status in ('uploaded', 'extracting') then 'uploaded'::public.course_import_status
       else 'failed'::public.course_import_status end
from public.source_documents source
where not exists (select 1 from public.course_import_jobs job where job.source_document_id = source.id)
  and not exists (select 1 from public.lesson_drafts draft where draft.source_document_id = source.id);

alter table public.course_import_jobs enable row level security;
alter table public.course_drafts enable row level security;
alter table public.course_draft_objectives enable row level security;
alter table public.course_outline_lessons enable row level security;
alter table public.course_outline_lesson_objectives enable row level security;
alter table public.course_outline_lesson_sources enable row level security;
alter table public.lesson_content_drafts enable row level security;
alter table public.lesson_content_draft_citations enable row level security;
alter table public.course_import_reviews enable row level security;
alter table public.course_import_publications enable row level security;
alter table public.course_import_lesson_publications enable row level security;

revoke all on table public.course_import_jobs, public.course_drafts,
  public.course_draft_objectives, public.course_outline_lessons,
  public.course_outline_lesson_objectives, public.course_outline_lesson_sources,
  public.lesson_content_drafts, public.lesson_content_draft_citations,
  public.course_import_reviews, public.course_import_publications,
  public.course_import_lesson_publications from anon, authenticated;
grant select on table public.course_import_jobs, public.course_drafts,
  public.course_draft_objectives, public.course_outline_lessons,
  public.course_outline_lesson_objectives, public.course_outline_lesson_sources,
  public.lesson_content_drafts, public.lesson_content_draft_citations,
  public.course_import_reviews, public.course_import_publications,
  public.course_import_lesson_publications to authenticated;

create policy "Active admins view course import jobs" on public.course_import_jobs for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'));
create policy "Active admins view course drafts" on public.course_drafts for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'));
create policy "Active admins view course draft objectives" on public.course_draft_objectives for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'));
create policy "Active admins view course outline lessons" on public.course_outline_lessons for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'));
create policy "Active admins view course outline lesson objectives" on public.course_outline_lesson_objectives for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'));
create policy "Active admins view course outline lesson sources" on public.course_outline_lesson_sources for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'));
create policy "Active admins view lesson content drafts" on public.lesson_content_drafts for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'));
create policy "Active admins view lesson content citations" on public.lesson_content_draft_citations for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'));
create policy "Active admins view course import reviews" on public.course_import_reviews for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'));
create policy "Active admins view course import publications" on public.course_import_publications for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'));
create policy "Active admins view course import lesson publications" on public.course_import_lesson_publications for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'));

create or replace function public.create_course_outline(
  p_source_document_id bigint,
  p_outline jsonb,
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
  v_job public.course_import_jobs%rowtype;
  v_draft_id bigint;
  v_revision integer;
  v_item jsonb;
  v_lesson jsonb;
  v_outline_lesson_id bigint;
  v_order integer;
begin
  if v_actor_id is null or not exists (
    select 1 from public.profiles p where p.id = v_actor_id and p.is_active and p.role = 'admin'
  ) then raise exception 'FORBIDDEN' using errcode = 'P0003'; end if;

  perform 1 from public.source_documents
  where id = p_source_document_id and status = 'generating' for update;
  if not found then raise exception 'SOURCE_NOT_GENERATING' using errcode = 'P0006'; end if;

  if jsonb_typeof(p_outline) <> 'object'
    or char_length(trim(p_outline->>'title')) not between 1 and 150
    or coalesce(char_length(trim(p_outline->>'description')), 0) < 1
    or jsonb_typeof(p_outline->'learningObjectives') <> 'array'
    or jsonb_array_length(p_outline->'learningObjectives') < 1
    or jsonb_typeof(p_outline->'lessons') <> 'array'
    or jsonb_array_length(p_outline->'lessons') not between 2 and 20
  then raise exception 'OUTLINE_INVALID' using errcode = 'P0001'; end if;

  select * into v_job from public.course_import_jobs
  where source_document_id = p_source_document_id for update;
  if not found then
    insert into public.course_import_jobs (source_document_id, requested_by, status)
    values (p_source_document_id, v_actor_id, 'processing') returning * into v_job;
  elsif v_job.status in ('published', 'rejected', 'generating_content', 'ready_to_publish') then
    raise exception 'JOB_STATE_INVALID' using errcode = 'P0004';
  end if;

  v_revision := v_job.current_outline_revision + 1;
  insert into public.course_drafts (job_id, revision, title, description, provider, model)
  values (v_job.id, v_revision, trim(p_outline->>'title'), trim(p_outline->>'description'), p_provider, p_model)
  returning id into v_draft_id;

  v_order := 0;
  for v_item in select value from jsonb_array_elements(p_outline->'learningObjectives')
  loop
    v_order := v_order + 1;
    insert into public.course_draft_objectives (course_draft_id, objective_order, objective)
    values (v_draft_id, v_order, trim(v_item #>> '{}'));
  end loop;

  v_order := 0;
  for v_lesson in select value from jsonb_array_elements(p_outline->'lessons')
  loop
    v_order := v_order + 1;
    if jsonb_typeof(v_lesson) <> 'object'
      or char_length(trim(v_lesson->>'clientKey')) not between 1 and 80
      or char_length(trim(v_lesson->>'title')) not between 1 and 150
      or coalesce(char_length(trim(v_lesson->>'summary')), 0) < 1
      or jsonb_typeof(v_lesson->'learningObjectives') <> 'array'
      or jsonb_array_length(v_lesson->'learningObjectives') < 1
      or jsonb_typeof(v_lesson->'sourceChunkIndexes') <> 'array'
      or jsonb_array_length(v_lesson->'sourceChunkIndexes') < 1
    then raise exception 'OUTLINE_LESSON_INVALID' using errcode = 'P0001'; end if;

    insert into public.course_outline_lessons (
      course_draft_id, client_key, lesson_order, title, summary
    ) values (
      v_draft_id, trim(v_lesson->>'clientKey'), v_order,
      trim(v_lesson->>'title'), trim(v_lesson->>'summary')
    ) returning id into v_outline_lesson_id;

    insert into public.course_outline_lesson_objectives (outline_lesson_id, objective_order, objective)
    select v_outline_lesson_id, ordinality::integer, trim(value #>> '{}')
    from jsonb_array_elements(v_lesson->'learningObjectives') with ordinality;

    insert into public.course_outline_lesson_sources (outline_lesson_id, document_chunk_id, source_order)
    select v_outline_lesson_id, chunk.id, source.ordinality::integer - 1
    from jsonb_array_elements(v_lesson->'sourceChunkIndexes') with ordinality as source(value, ordinality)
    join public.document_chunks chunk
      on chunk.source_document_id = p_source_document_id
     and chunk.chunk_index = (source.value #>> '{}')::integer;
    if (select count(*) from public.course_outline_lesson_sources where outline_lesson_id = v_outline_lesson_id)
       <> jsonb_array_length(v_lesson->'sourceChunkIndexes')
    then raise exception 'OUTLINE_SOURCE_INVALID' using errcode = 'P0007'; end if;
  end loop;

  update public.course_import_jobs
  set status = 'outline_review', current_outline_revision = v_revision,
      approved_outline_revision = null, error_code = null
  where id = v_job.id;
  update public.source_documents set status = 'ready_for_review', error_code = null
  where id = p_source_document_id;
  insert into public.admin_logs (actor_id, action, target_type, target_id, metadata)
  values (v_actor_id, 'course_import.outline_generated', 'course_import_job', v_job.id::text,
    jsonb_build_object('source_document_id', p_source_document_id, 'outline_revision', v_revision));
  return jsonb_build_object('jobId', v_job.id, 'sourceDocumentId', p_source_document_id,
    'outlineRevision', v_revision, 'status', 'outline_review');
end;
$$;

create or replace function public.prepare_course_lesson_generation(p_job_id bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_actor_id uuid := auth.uid(); v_job public.course_import_jobs%rowtype;
begin
  if v_actor_id is null or not exists (select 1 from public.profiles p where p.id = v_actor_id and p.is_active and p.role = 'admin')
  then raise exception 'FORBIDDEN' using errcode = 'P0003'; end if;
  select * into v_job from public.course_import_jobs where id = p_job_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if v_job.status not in ('outline_review', 'content_review', 'ready_to_publish', 'failed')
    or v_job.current_outline_revision < 1
    or not exists (
      select 1 from public.course_drafts d
      where d.job_id = v_job.id and d.revision = v_job.current_outline_revision
    )
  then raise exception 'JOB_STATE_INVALID' using errcode = 'P0004'; end if;
  update public.course_import_jobs set status = 'generating_content',
    approved_outline_revision = current_outline_revision, error_code = null where id = p_job_id;
  return jsonb_build_object('jobId', p_job_id, 'status', 'generating_content',
    'outlineRevision', v_job.current_outline_revision);
end; $$;

create or replace function public.persist_lesson_content_draft(
  p_job_id bigint, p_outline_lesson_id bigint, p_title text, p_summary text,
  p_estimated_minutes integer, p_sections jsonb, p_provider text, p_model text
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_actor_id uuid := auth.uid(); v_job public.course_import_jobs%rowtype;
  v_draft_id bigint; v_revision integer; v_citation jsonb; v_expected integer; v_actual integer;
begin
  if v_actor_id is null or not exists (select 1 from public.profiles p where p.id = v_actor_id and p.is_active and p.role = 'admin')
  then raise exception 'FORBIDDEN' using errcode = 'P0003'; end if;
  select * into v_job from public.course_import_jobs where id = p_job_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if v_job.status <> 'generating_content' then raise exception 'JOB_STATE_INVALID' using errcode = 'P0004'; end if;
  if not exists (
    select 1 from public.course_outline_lessons l join public.course_drafts d on d.id = l.course_draft_id
    where l.id = p_outline_lesson_id and d.job_id = p_job_id and d.revision = v_job.approved_outline_revision
  ) then raise exception 'OUTLINE_LESSON_MISMATCH' using errcode = 'P0005'; end if;
  if char_length(trim(p_title)) not between 1 and 150 or char_length(trim(p_summary)) < 1
    or p_estimated_minutes not between 1 and 180 or jsonb_typeof(p_sections) <> 'array'
    or jsonb_array_length(p_sections) not between 1 and 12
  then raise exception 'LESSON_CONTENT_INVALID' using errcode = 'P0001'; end if;
  select coalesce(max(revision), 0) + 1 into v_revision from public.lesson_content_drafts
  where outline_lesson_id = p_outline_lesson_id;
  insert into public.lesson_content_drafts (
    outline_lesson_id, revision, title, summary, estimated_minutes, sections, provider, model
  ) values (p_outline_lesson_id, v_revision, trim(p_title), trim(p_summary),
    p_estimated_minutes, p_sections, p_provider, p_model) returning id into v_draft_id;

  for v_citation in
    select jsonb_build_object('sectionIndex', section.ordinality - 1, 'chunkIndex', citation.value)
    from jsonb_array_elements(p_sections) with ordinality as section(value, ordinality)
    cross join jsonb_array_elements(section.value->'citationChunkIndexes') citation(value)
  loop
    insert into public.lesson_content_draft_citations (
      lesson_content_draft_id, section_index, document_chunk_id, quote
    )
    select v_draft_id, (v_citation->>'sectionIndex')::integer, chunk.id, left(chunk.content, 500)
    from public.course_outline_lessons outline_lesson
    join public.course_drafts course_draft on course_draft.id = outline_lesson.course_draft_id
    join public.course_import_jobs job on job.id = course_draft.job_id
    join public.document_chunks chunk on chunk.source_document_id = job.source_document_id
    join public.course_outline_lesson_sources allowed_source
      on allowed_source.outline_lesson_id = outline_lesson.id
     and allowed_source.document_chunk_id = chunk.id
    where outline_lesson.id = p_outline_lesson_id
      and chunk.chunk_index = (v_citation->>'chunkIndex')::integer;
    if not found then raise exception 'CITATION_INVALID' using errcode = 'P0007'; end if;
  end loop;
  select jsonb_array_length(p_sections), count(distinct section_index)
    into v_expected, v_actual from public.lesson_content_draft_citations
    where lesson_content_draft_id = v_draft_id;
  if v_actual <> v_expected then raise exception 'CITATIONS_INCOMPLETE' using errcode = 'P0007'; end if;

  if not exists (
    select 1 from public.course_outline_lessons l
    join public.course_drafts d on d.id = l.course_draft_id
    where d.job_id = p_job_id and d.revision = v_job.approved_outline_revision
      and not exists (select 1 from public.lesson_content_drafts content where content.outline_lesson_id = l.id and content.status = 'ready')
  ) then update public.course_import_jobs set status = 'content_review', error_code = null where id = p_job_id; end if;
  return jsonb_build_object('lessonContentDraftId', v_draft_id, 'outlineLessonId', p_outline_lesson_id,
    'revision', v_revision, 'status', 'ready');
end; $$;

create or replace function public.fail_course_import_job(p_job_id bigint, p_error_code text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null or not exists (select 1 from public.profiles p where p.id = v_actor_id and p.is_active and p.role = 'admin')
  then raise exception 'FORBIDDEN' using errcode = 'P0003'; end if;
  update public.course_import_jobs set status = 'failed', error_code = left(p_error_code, 100)
  where id = p_job_id and status in ('processing', 'generating_content');
end; $$;

create or replace function public.revise_lesson_content_draft(
  p_lesson_content_draft_id bigint, p_title text, p_summary text,
  p_estimated_minutes integer, p_sections jsonb
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_actor_id uuid := auth.uid();
  v_current public.lesson_content_drafts%rowtype;
  v_job public.course_import_jobs%rowtype;
  v_new_id bigint;
begin
  if v_actor_id is null or not exists (select 1 from public.profiles p where p.id = v_actor_id and p.is_active and p.role = 'admin')
  then raise exception 'FORBIDDEN' using errcode = 'P0003'; end if;
  select * into v_current from public.lesson_content_drafts where id = p_lesson_content_draft_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  select job.* into v_job
  from public.course_import_jobs job
  join public.course_drafts draft
    on draft.job_id = job.id and draft.revision = job.approved_outline_revision
  join public.course_outline_lessons lesson on lesson.course_draft_id = draft.id
  where lesson.id = v_current.outline_lesson_id
  for update of job;
  if not found or v_job.status not in ('content_review', 'ready_to_publish')
  then raise exception 'JOB_STATE_INVALID' using errcode = 'P0004'; end if;
  if char_length(trim(p_title)) not between 1 and 150 or char_length(trim(p_summary)) < 1
    or p_estimated_minutes not between 1 and 180 or jsonb_typeof(p_sections) <> 'array'
    or jsonb_array_length(p_sections) <> jsonb_array_length(v_current.sections)
    or exists (
      select 1
      from jsonb_array_elements(p_sections) with ordinality as revised_item(section, position)
      join jsonb_array_elements(v_current.sections) with ordinality as current_item(section, position)
        using (position)
      where revised_item.section->'citationChunkIndexes' is distinct from current_item.section->'citationChunkIndexes'
    )
  then raise exception 'LESSON_CONTENT_INVALID' using errcode = 'P0001'; end if;
  insert into public.lesson_content_drafts (
    outline_lesson_id, revision, title, summary, estimated_minutes, sections, provider, model
  ) values (v_current.outline_lesson_id, v_current.revision + 1, trim(p_title), trim(p_summary),
    p_estimated_minutes, p_sections, 'admin_edit', null) returning id into v_new_id;
  insert into public.lesson_content_draft_citations (
    lesson_content_draft_id, section_index, document_chunk_id, quote
  ) select v_new_id, section_index, document_chunk_id, quote
  from public.lesson_content_draft_citations where lesson_content_draft_id = v_current.id;
  update public.course_import_jobs set status = 'content_review' where id = v_job.id;
  return jsonb_build_object('lessonContentDraftId', v_new_id, 'revision', v_current.revision + 1, 'status', 'ready');
end; $$;

create or replace function public.review_course_import_job(
  p_job_id bigint, p_decision text, p_comment text default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_actor_id uuid := auth.uid(); v_job public.course_import_jobs%rowtype; v_next public.course_import_status;
begin
  if v_actor_id is null or not exists (select 1 from public.profiles p where p.id = v_actor_id and p.is_active and p.role = 'admin')
  then raise exception 'FORBIDDEN' using errcode = 'P0003'; end if;
  select * into v_job from public.course_import_jobs where id = p_job_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if p_decision = 'rejected' and v_job.status in ('outline_review', 'content_review', 'ready_to_publish', 'failed') then v_next := 'rejected';
  elsif p_decision = 'needs_revision' and v_job.status in ('content_review', 'ready_to_publish') then v_next := 'content_review';
  elsif p_decision = 'ready_to_publish' and v_job.status = 'content_review' then v_next := 'ready_to_publish';
  else raise exception 'DECISION_INVALID_FOR_STATE' using errcode = 'P0004'; end if;
  update public.course_import_jobs set status = v_next, error_code = null where id = p_job_id;
  insert into public.course_import_reviews (job_id, reviewer_id, outline_revision, decision, comment)
  values (p_job_id, v_actor_id, v_job.current_outline_revision, p_decision, nullif(trim(p_comment), ''));
  return jsonb_build_object('jobId', p_job_id, 'status', v_next);
end; $$;

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

revoke all on function public.create_course_outline(bigint, jsonb, text, text) from public, anon;
revoke all on function public.prepare_course_lesson_generation(bigint) from public, anon;
revoke all on function public.persist_lesson_content_draft(bigint, bigint, text, text, integer, jsonb, text, text) from public, anon;
revoke all on function public.fail_course_import_job(bigint, text) from public, anon;
revoke all on function public.revise_lesson_content_draft(bigint, text, text, integer, jsonb) from public, anon;
revoke all on function public.review_course_import_job(bigint, text, text) from public, anon;
revoke all on function public.publish_course_import_job(bigint, text) from public, anon;
grant execute on function public.create_course_outline(bigint, jsonb, text, text) to authenticated;
grant execute on function public.prepare_course_lesson_generation(bigint) to authenticated;
grant execute on function public.persist_lesson_content_draft(bigint, bigint, text, text, integer, jsonb, text, text) to authenticated;
grant execute on function public.fail_course_import_job(bigint, text) to authenticated;
grant execute on function public.revise_lesson_content_draft(bigint, text, text, integer, jsonb) to authenticated;
grant execute on function public.review_course_import_job(bigint, text, text) to authenticated;
grant execute on function public.publish_course_import_job(bigint, text) to authenticated;
