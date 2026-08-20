-- Already applied manually via the Supabase dashboard SQL editor earlier
-- this session. project_skills.tags saving had been silently 400'ing since
-- the feature was first built, because ProjectSkillModal's upsert uses
-- onConflict: 'project_id' with no matching UNIQUE constraint on the
-- table - the exact kind of silent, un-versioned schema gap this migrations
-- setup exists to prevent going forward. Guarded so re-running is safe.

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'project_skills_project_id_key'
  ) then
    alter table project_skills
      add constraint project_skills_project_id_key unique (project_id);
  end if;
end $$;
