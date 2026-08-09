create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table if not exists private.rate_limit_buckets (
  scope text not null,
  identifier_hash text not null,
  request_count integer not null check (request_count > 0),
  window_started_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (scope, identifier_hash)
);

alter table private.rate_limit_buckets enable row level security;

revoke all on table private.rate_limit_buckets from public, anon, authenticated;
grant select, insert, update, delete on table private.rate_limit_buckets to service_role;

create index if not exists rate_limit_buckets_updated_at_idx
  on private.rate_limit_buckets (updated_at);

create or replace function public.consume_rate_limit(
  p_scope text,
  p_identifier_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := statement_timestamp();
  v_bucket private.rate_limit_buckets%rowtype;
begin
  if p_scope is null or length(p_scope) = 0
    or p_identifier_hash is null
    or p_identifier_hash !~ '^[0-9a-f]{64}$'
    or p_limit <= 0
    or p_window_seconds <= 0 then
    raise exception 'INVALID_RATE_LIMIT_ARGUMENTS' using errcode = '22023';
  end if;

  -- About 1% of identifiers perform indexed cleanup, avoiding a full delete on
  -- every request while keeping inactive buckets bounded without pg_cron.
  if get_byte(decode(p_identifier_hash, 'hex'), 0) < 3 then
    delete from private.rate_limit_buckets
    where updated_at < v_now - interval '24 hours';
  end if;

  insert into private.rate_limit_buckets as bucket (
    scope,
    identifier_hash,
    request_count,
    window_started_at,
    updated_at
  )
  values (p_scope, p_identifier_hash, 1, v_now, v_now)
  on conflict (scope, identifier_hash) do update
  set request_count = case
        when v_now - bucket.window_started_at
          >= make_interval(secs => p_window_seconds)
        then 1
        else bucket.request_count + 1
      end,
      window_started_at = case
        when v_now - bucket.window_started_at
          >= make_interval(secs => p_window_seconds)
        then v_now
        else bucket.window_started_at
      end,
      updated_at = v_now
  returning * into v_bucket;

  allowed := v_bucket.request_count <= p_limit;
  retry_after_seconds := case
    when allowed then 0
    else greatest(
      1,
      ceil(extract(epoch from (
        v_bucket.window_started_at
        + make_interval(secs => p_window_seconds)
        - v_now
      )))::integer
    )
  end;
  return next;
end;
$$;

revoke execute on function public.consume_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, text, integer, integer)
  to service_role;
