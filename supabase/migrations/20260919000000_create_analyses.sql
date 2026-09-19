-- ULIONG Phase 1: authoritative analysis persistence and ownership boundary.
-- Supabase Auth is the identity authority; browser clients must never supply
-- another user's ownership value successfully because RLS enforces auth.uid().

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  scan_type text not null,
  input_content text,
  risk_score integer not null,
  risk_level text not null,
  threat_indicators jsonb not null default '[]'::jsonb,
  ai_explanation text,
  recommended_action text,
  confidence_level double precision,
  pipeline_stages jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),

  constraint analyses_scan_type_check
    check (scan_type in ('text', 'url', 'image', 'file')),
  constraint analyses_risk_score_check
    check (risk_score between 0 and 100),
  constraint analyses_risk_level_check
    check (risk_level in ('safe', 'suspicious', 'high_risk')),
  constraint analyses_confidence_level_check
    check (confidence_level is null or confidence_level between 0 and 1),
  constraint analyses_threat_indicators_array_check
    check (jsonb_typeof(threat_indicators) = 'array'),
  constraint analyses_pipeline_stages_object_check
    check (jsonb_typeof(pipeline_stages) = 'object')
);

create index if not exists analyses_user_created_at_idx
  on public.analyses (user_id, created_at desc);

alter table public.analyses enable row level security;
alter table public.analyses force row level security;

drop policy if exists analyses_select_own on public.analyses;
create policy analyses_select_own
  on public.analyses
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists analyses_insert_own on public.analyses;
create policy analyses_insert_own
  on public.analyses
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists analyses_update_own on public.analyses;
create policy analyses_update_own
  on public.analyses
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists analyses_delete_own on public.analyses;
create policy analyses_delete_own
  on public.analyses
  for delete
  to authenticated
  using (user_id = (select auth.uid()));
