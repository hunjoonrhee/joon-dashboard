-- Backs src/lib/rate-limit.ts (issue #38, item 1). Not yet applied to the
-- live project as of this migration's creation - run this file's contents
-- via the Supabase dashboard SQL editor (or `supabase db push` once the CLI
-- is linked) to activate rate limiting; until then, checkRateLimit() fails
-- open (allows every request) rather than blocking the app.

create table if not exists api_usage (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  endpoint text not null,
  usage_date date not null default current_date,
  count int not null default 0,
  unique (identifier, endpoint, usage_date)
);

alter table api_usage enable row level security;
-- Only ever touched via the service-role key from server routes, so no
-- client-facing RLS policies are needed - RLS just needs to be ON so the
-- table isn't left wide open if the anon/publishable key were ever pointed
-- at it by mistake.

create index if not exists api_usage_lookup_idx on api_usage (identifier, endpoint, usage_date);

create or replace function increment_api_usage(p_identifier text, p_endpoint text, p_limit int)
returns table(allowed boolean, current_count int)
language plpgsql
as $$
declare
  v_count int;
begin
  insert into api_usage (identifier, endpoint, usage_date, count)
  values (p_identifier, p_endpoint, current_date, 1)
  on conflict (identifier, endpoint, usage_date)
  do update set count = api_usage.count + 1
  returning api_usage.count into v_count;

  return query select (v_count <= p_limit), v_count;
end;
$$;
