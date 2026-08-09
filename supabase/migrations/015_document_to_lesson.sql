create type public.source_document_status as enum (
  'uploaded',
  'extracting',
  'extracted',
  'generating',
  'ready_for_review',
  'failed',
  'archived'
);

create type public.lesson_draft_status as enum (
  'pending_review',
  'needs_revision',
  'rejected',
  'approved',
  'published'
);

create type public.lesson_draft_review_decision as enum (
  'approved',
  'rejected',
  'needs_revision'
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lesson-sources',
  'lesson-sources',
  false,
  10485760,
  array[
    'text/plain',
    'text/markdown',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table public.source_documents (
  id bigint generated always as identity primary key,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  original_filename varchar(255) not null,
  storage_bucket text not null default 'lesson-sources',
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null,
  sha256 char(64),
  status public.source_document_status not null default 'uploaded',
  extracted_char_count integer,
  error_code varchar(100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint source_documents_filename_not_blank
    check (char_length(trim(original_filename)) between 1 and 255),
  constraint source_documents_bucket_fixed
    check (storage_bucket = 'lesson-sources'),
  constraint source_documents_size_valid
    check (size_bytes > 0 and size_bytes <= 10485760),
  constraint source_documents_mime_supported
    check (mime_type in (
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )),
  constraint source_documents_sha256_format
    check (sha256 is null or sha256 ~ '^[0-9a-f]{64}$'),
  constraint source_documents_extracted_char_count_valid
    check (extracted_char_count is null or extracted_char_count between 1 and 200000)
);

create table public.document_chunks (
  id bigint generated always as identity primary key,
  source_document_id bigint not null references public.source_documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  start_offset integer not null,
  end_offset integer not null,
  content_hash char(64) not null,
  created_at timestamptz not null default now(),
  constraint document_chunks_document_index_unique unique (source_document_id, chunk_index),
  constraint document_chunks_index_nonnegative check (chunk_index >= 0),
  constraint document_chunks_content_not_blank check (char_length(trim(content)) > 0),
  constraint document_chunks_offsets_valid
    check (start_offset >= 0 and end_offset > start_offset),
  constraint document_chunks_hash_format check (content_hash ~ '^[0-9a-f]{64}$')
);

create table public.lesson_drafts (
  id bigint generated always as identity primary key,
  source_document_id bigint not null references public.source_documents(id) on delete restrict,
  course_id bigint not null references public.courses(id) on delete restrict,
  chapter_id bigint not null references public.chapters(id) on delete restrict,
  target_lesson_id bigint not null references public.lessons(id) on delete restrict,
  requested_by uuid not null references public.profiles(id) on delete restrict,
  title varchar(150) not null,
  summary text not null,
  estimated_minutes integer not null,
  sections jsonb not null,
  status public.lesson_draft_status not null default 'pending_review',
  revision integer not null default 1,
  approved_revision integer,
  provider varchar(50) not null,
  model varchar(100),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_drafts_title_not_blank check (char_length(trim(title)) between 1 and 150),
  constraint lesson_drafts_summary_not_blank check (char_length(trim(summary)) > 0),
  constraint lesson_drafts_estimated_minutes_valid check (estimated_minutes between 1 and 180),
  constraint lesson_drafts_sections_array
    check (jsonb_typeof(sections) = 'array' and jsonb_array_length(sections) between 1 and 12),
  constraint lesson_drafts_revision_positive check (revision > 0),
  constraint lesson_drafts_approved_revision_valid
    check (approved_revision is null or approved_revision between 1 and revision),
  constraint lesson_drafts_publish_state_consistent check (
    (status = 'published' and published_at is not null)
    or (status <> 'published' and published_at is null)
  )
);

create table public.lesson_draft_citations (
  id bigint generated always as identity primary key,
  lesson_draft_id bigint not null references public.lesson_drafts(id) on delete cascade,
  revision integer not null,
  section_index integer not null,
  document_chunk_id bigint not null references public.document_chunks(id) on delete restrict,
  quote text not null,
  created_at timestamptz not null default now(),
  constraint lesson_draft_citations_unique
    unique (lesson_draft_id, revision, section_index, document_chunk_id),
  constraint lesson_draft_citations_revision_positive check (revision > 0),
  constraint lesson_draft_citations_section_nonnegative check (section_index >= 0),
  constraint lesson_draft_citations_quote_not_blank
    check (char_length(trim(quote)) between 1 and 500)
);

create table public.lesson_draft_reviews (
  id bigint generated always as identity primary key,
  lesson_draft_id bigint not null references public.lesson_drafts(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  revision integer not null,
  decision public.lesson_draft_review_decision not null,
  comment text,
  reviewed_at timestamptz not null default now(),
  constraint lesson_draft_reviews_revision_positive check (revision > 0),
  constraint lesson_draft_reviews_comment_length
    check (comment is null or char_length(comment) <= 2000)
);

create table public.lesson_draft_publications (
  id bigint generated always as identity primary key,
  lesson_draft_id bigint not null unique references public.lesson_drafts(id) on delete restrict,
  source_document_id bigint not null references public.source_documents(id) on delete restrict,
  course_id bigint not null references public.courses(id) on delete restrict,
  lesson_id bigint not null references public.lessons(id) on delete restrict,
  published_revision integer not null,
  published_by uuid not null references public.profiles(id) on delete restrict,
  published_at timestamptz not null default now(),
  constraint lesson_draft_publications_revision_positive check (published_revision > 0)
);

create index source_documents_status_created_idx
  on public.source_documents (status, created_at desc);
create index document_chunks_source_idx
  on public.document_chunks (source_document_id, chunk_index);
create index lesson_drafts_status_created_idx
  on public.lesson_drafts (status, created_at desc);
create index lesson_drafts_course_idx
  on public.lesson_drafts (course_id, chapter_id, target_lesson_id);
create index lesson_draft_citations_draft_revision_idx
  on public.lesson_draft_citations (lesson_draft_id, revision, section_index);
create index lesson_draft_reviews_draft_idx
  on public.lesson_draft_reviews (lesson_draft_id, reviewed_at desc);

create trigger set_source_documents_updated_at
  before update on public.source_documents
  for each row execute function public.set_updated_at();
create trigger set_lesson_drafts_updated_at
  before update on public.lesson_drafts
  for each row execute function public.set_updated_at();

alter table public.source_documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.lesson_drafts enable row level security;
alter table public.lesson_draft_citations enable row level security;
alter table public.lesson_draft_reviews enable row level security;
alter table public.lesson_draft_publications enable row level security;

-- Projects created after the 2026 Data API default change do not automatically
-- expose new tables. Keep grants narrower than the RLS policies and write through
-- transactional RPCs where multiple rows must change together.
revoke all on table public.generated_exercises from anon, authenticated;
revoke all on table public.exercise_reviews from anon, authenticated;
revoke all on table public.admin_logs from anon, authenticated;
grant select, insert, update on table public.generated_exercises to authenticated;
grant select, insert on table public.exercise_reviews to authenticated;
grant select on table public.admin_logs to authenticated;

revoke all on table public.source_documents from anon, authenticated;
revoke all on table public.document_chunks from anon, authenticated;
revoke all on table public.lesson_drafts from anon, authenticated;
revoke all on table public.lesson_draft_citations from anon, authenticated;
revoke all on table public.lesson_draft_reviews from anon, authenticated;
revoke all on table public.lesson_draft_publications from anon, authenticated;
grant select, insert, update on table public.source_documents to authenticated;
grant select on table public.document_chunks to authenticated;
grant select on table public.lesson_drafts to authenticated;
grant select on table public.lesson_draft_citations to authenticated;
grant select on table public.lesson_draft_reviews to authenticated;
grant select on table public.lesson_draft_publications to authenticated;

create policy "Active admins manage source documents"
  on public.source_documents for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'
    )
  );

create policy "Active admins manage document chunks"
  on public.document_chunks for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'
    )
  );

create policy "Active admins manage lesson drafts"
  on public.lesson_drafts for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'
    )
  );

create policy "Active admins manage lesson draft citations"
  on public.lesson_draft_citations for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'
    )
  );

create policy "Active admins manage lesson draft reviews"
  on public.lesson_draft_reviews for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'
    )
  )
  with check (
    reviewer_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'
    )
  );

create policy "Active admins view lesson draft publications"
  on public.lesson_draft_publications for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'
    )
  );

create policy "Active admins upload lesson sources"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'lesson-sources'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'
    )
  );

create policy "Active admins read lesson sources"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'lesson-sources'
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'
    )
  );

create policy "Active admins update lesson sources"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'lesson-sources'
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'
    )
  )
  with check (
    bucket_id = 'lesson-sources'
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'
    )
  );

create policy "Active admins delete lesson sources"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'lesson-sources'
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'
    )
  );

create or replace function public.replace_document_chunks(
  p_source_document_id bigint,
  p_sha256 text,
  p_extracted_char_count integer,
  p_chunks jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_chunk jsonb;
  v_count integer := 0;
begin
  if v_actor_id is null or not exists (
    select 1 from public.profiles p
    where p.id = v_actor_id and p.is_active and p.role = 'admin'
  ) then
    raise exception 'FORBIDDEN' using errcode = 'P0003';
  end if;
  if jsonb_typeof(p_chunks) <> 'array' or jsonb_array_length(p_chunks) < 1 then
    raise exception 'CHUNKS_INVALID' using errcode = 'P0004';
  end if;

  perform 1 from public.source_documents
  where id = p_source_document_id and status = 'extracting'
  for update;
  if not found then
    raise exception 'SOURCE_NOT_EXTRACTING' using errcode = 'P0005';
  end if;

  delete from public.document_chunks where source_document_id = p_source_document_id;
  for v_chunk in select * from jsonb_array_elements(p_chunks)
  loop
    insert into public.document_chunks (
      source_document_id, chunk_index, content, start_offset, end_offset, content_hash
    ) values (
      p_source_document_id,
      (v_chunk->>'chunkIndex')::integer,
      v_chunk->>'content',
      (v_chunk->>'startOffset')::integer,
      (v_chunk->>'endOffset')::integer,
      v_chunk->>'contentHash'
    );
    v_count := v_count + 1;
  end loop;

  update public.source_documents
  set status = 'extracted', sha256 = p_sha256,
      extracted_char_count = p_extracted_char_count, error_code = null
  where id = p_source_document_id;
  return v_count;
end;
$$;

create or replace function public.create_lesson_draft(
  p_source_document_id bigint,
  p_course_id bigint,
  p_chapter_id bigint,
  p_target_lesson_id bigint,
  p_title text,
  p_summary text,
  p_estimated_minutes integer,
  p_sections jsonb,
  p_provider text,
  p_model text,
  p_citations jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_draft_id bigint;
  v_citation jsonb;
begin
  if v_actor_id is null or not exists (
    select 1 from public.profiles p
    where p.id = v_actor_id and p.is_active and p.role = 'admin'
  ) then
    raise exception 'FORBIDDEN' using errcode = 'P0003';
  end if;
  if not exists (
    select 1 from public.lessons l
    join public.chapters c on c.id = l.chapter_id
    where l.id = p_target_lesson_id and c.id = p_chapter_id and c.course_id = p_course_id
  ) then
    raise exception 'TARGET_MISMATCH' using errcode = 'P0005';
  end if;
  perform 1 from public.source_documents
  where id = p_source_document_id and status = 'generating'
  for update;
  if not found then
    raise exception 'SOURCE_NOT_GENERATING' using errcode = 'P0006';
  end if;

  insert into public.lesson_drafts (
    source_document_id, course_id, chapter_id, target_lesson_id, requested_by,
    title, summary, estimated_minutes, sections, provider, model
  ) values (
    p_source_document_id, p_course_id, p_chapter_id, p_target_lesson_id, v_actor_id,
    p_title, p_summary, p_estimated_minutes, p_sections, p_provider, p_model
  ) returning id into v_draft_id;

  for v_citation in select * from jsonb_array_elements(p_citations)
  loop
    insert into public.lesson_draft_citations (
      lesson_draft_id, revision, section_index, document_chunk_id, quote
    )
    select
      v_draft_id, 1, (v_citation->>'sectionIndex')::integer, ch.id,
      left(ch.content, 500)
    from public.document_chunks ch
    where ch.source_document_id = p_source_document_id
      and ch.chunk_index = (v_citation->>'chunkIndex')::integer;
    if not found then
      raise exception 'CITATION_INVALID' using errcode = 'P0007';
    end if;
  end loop;

  update public.source_documents
  set status = 'ready_for_review', error_code = null
  where id = p_source_document_id;
  return v_draft_id;
end;
$$;

create or replace function public.review_lesson_draft(
  p_lesson_draft_id bigint,
  p_decision public.lesson_draft_review_decision,
  p_comment text default null
)
returns public.lesson_draft_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_draft public.lesson_drafts%rowtype;
  v_status public.lesson_draft_status;
begin
  if v_actor_id is null or not exists (
    select 1 from public.profiles p
    where p.id = v_actor_id and p.is_active and p.role = 'admin'
  ) then
    raise exception 'FORBIDDEN' using errcode = 'P0003';
  end if;
  select * into v_draft from public.lesson_drafts
  where id = p_lesson_draft_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if v_draft.status = 'published' then
    raise exception 'ALREADY_PUBLISHED' using errcode = 'P0004';
  end if;

  v_status := case p_decision
    when 'approved' then 'approved'::public.lesson_draft_status
    when 'rejected' then 'rejected'::public.lesson_draft_status
    else 'needs_revision'::public.lesson_draft_status
  end;
  insert into public.lesson_draft_reviews (
    lesson_draft_id, reviewer_id, revision, decision, comment
  ) values (v_draft.id, v_actor_id, v_draft.revision, p_decision, nullif(trim(p_comment), ''));
  update public.lesson_drafts
  set status = v_status,
      approved_revision = case when p_decision = 'approved' then revision else null end
  where id = v_draft.id;
  return v_status;
end;
$$;

create or replace function public.revise_lesson_draft(
  p_lesson_draft_id bigint,
  p_title text,
  p_summary text,
  p_estimated_minutes integer,
  p_sections jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_draft public.lesson_drafts%rowtype;
  v_next_revision integer;
begin
  if v_actor_id is null or not exists (
    select 1 from public.profiles p
    where p.id = v_actor_id and p.is_active and p.role = 'admin'
  ) then
    raise exception 'FORBIDDEN' using errcode = 'P0003';
  end if;
  select * into v_draft from public.lesson_drafts
  where id = p_lesson_draft_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if v_draft.status = 'published' then
    raise exception 'ALREADY_PUBLISHED' using errcode = 'P0004';
  end if;
  if jsonb_typeof(p_sections) <> 'array'
     or jsonb_array_length(p_sections) <> jsonb_array_length(v_draft.sections) then
    raise exception 'SECTION_STRUCTURE_CHANGED' using errcode = 'P0005';
  end if;

  v_next_revision := v_draft.revision + 1;
  insert into public.lesson_draft_citations (
    lesson_draft_id, revision, section_index, document_chunk_id, quote
  )
  select lesson_draft_id, v_next_revision, section_index, document_chunk_id, quote
  from public.lesson_draft_citations
  where lesson_draft_id = v_draft.id and revision = v_draft.revision;

  update public.lesson_drafts
  set title = p_title, summary = p_summary,
      estimated_minutes = p_estimated_minutes, sections = p_sections,
      revision = v_next_revision, approved_revision = null,
      status = 'pending_review'
  where id = v_draft.id;
  return v_next_revision;
end;
$$;

revoke all on function public.replace_document_chunks(bigint, text, integer, jsonb) from public, anon;
revoke all on function public.create_lesson_draft(bigint, bigint, bigint, bigint, text, text, integer, jsonb, text, text, jsonb) from public, anon;
revoke all on function public.review_lesson_draft(bigint, public.lesson_draft_review_decision, text) from public, anon;
revoke all on function public.revise_lesson_draft(bigint, text, text, integer, jsonb) from public, anon;
grant execute on function public.replace_document_chunks(bigint, text, integer, jsonb) to authenticated;
grant execute on function public.create_lesson_draft(bigint, bigint, bigint, bigint, text, text, integer, jsonb, text, text, jsonb) to authenticated;
grant execute on function public.review_lesson_draft(bigint, public.lesson_draft_review_decision, text) to authenticated;
grant execute on function public.revise_lesson_draft(bigint, text, text, integer, jsonb) to authenticated;

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
      'publishedAt', v_publication.published_at
    );
  end if;

  if v_draft.status <> 'approved' or v_draft.approved_revision <> v_draft.revision then
    raise exception 'DRAFT_NOT_APPROVED' using errcode = 'P0004';
  end if;

  perform 1
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

-- Migration 013 predates the explicit function exposure default. Harden it while
-- deploying the operational migrations to a fresh Cloud project.
revoke all on function public.publish_generated_exercise(bigint) from public, anon;
grant execute on function public.publish_generated_exercise(bigint) to authenticated;
