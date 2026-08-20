-- Already applied manually via the Supabase dashboard SQL editor earlier this
-- session (Phase 6, pronunciation scoring). Recorded here retroactively as
-- the first tracked migration so the schema has a git history going
-- forward - guarded with `if not exists` so re-running this file is safe
-- even though the table already exists in the live project.

create table if not exists pronunciation_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  score numeric(5,2) not null,
  created_at timestamptz not null default now()
);

alter table pronunciation_attempts enable row level security;

drop policy if exists "pronunciation_attempts_select_own" on pronunciation_attempts;
create policy "pronunciation_attempts_select_own" on pronunciation_attempts
  for select using (auth.uid() = user_id);

drop policy if exists "pronunciation_attempts_insert_own" on pronunciation_attempts;
create policy "pronunciation_attempts_insert_own" on pronunciation_attempts
  for insert with check (auth.uid() = user_id);

create index if not exists pronunciation_attempts_user_score_idx
  on pronunciation_attempts (user_id, score desc);
