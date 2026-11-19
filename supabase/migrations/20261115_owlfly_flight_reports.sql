-- OwlFly Flight Report: private-first database foundation.
-- Migration is reviewed in GitHub only until separately applied to an approved Supabase project.
-- All access is server-only; there are intentionally NO client RLS policies.

begin;

create table if not exists public.owlfly_feedback_reports (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('praise', 'problem', 'suggestion')),
  rating smallint check (rating between 1 and 5),
  area text check (area in ('controls', 'difficulty', 'visibility', 'audio', 'performance', 'menu', 'other')),
  notes text check (char_length(notes) <= 1500),
  app_version text not null check (char_length(app_version) between 1 and 64),
  android_version_code integer check (android_version_code > 0),
  platform text not null check (platform in ('android', 'web')),
  build_commit text check (build_commit ~ '^[0-9a-f]{7,40}$'),
  run_score integer check (run_score >= 0),
  run_duration_ms integer check (run_duration_ms >= 0),
  screenshot_path text,
  screenshot_mime text,
  screenshot_size_bytes integer,
  screenshot_consent boolean not null default false,
  review_state text not null default 'new'
    check (review_state in ('new', 'triaged', 'investigating', 'fixed', 'verified', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owlfly_feedback_screenshot_bundle_check check (
    (
      screenshot_path is null
      and screenshot_mime is null
      and screenshot_size_bytes is null
    )
    or (
      screenshot_consent = true
      and screenshot_path is not null
      and char_length(screenshot_path) between 9 and 240
      and screenshot_path like 'reports/%'
      and screenshot_mime in ('image/png', 'image/jpeg', 'image/webp')
      and screenshot_size_bytes between 1 and 2097152
    )
  )
);

create index if not exists owlfly_feedback_reports_recent_idx
  on public.owlfly_feedback_reports (created_at desc);
create index if not exists owlfly_feedback_reports_review_idx
  on public.owlfly_feedback_reports (review_state, created_at desc);
create unique index if not exists owlfly_feedback_screenshot_path_uidx
  on public.owlfly_feedback_reports (screenshot_path)
  where screenshot_path is not null;

create table if not exists public.owlfly_feedback_review_events (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.owlfly_feedback_reports(id) on delete cascade,
  event_type text not null
    check (event_type in ('received', 'triaged', 'investigating', 'fix_committed', 'verified', 'closed', 'reopened')),
  actor_type text not null check (actor_type in ('owner', 'automation')),
  note text check (char_length(note) <= 1500),
  commit_sha text check (commit_sha ~ '^[0-9a-f]{7,40}$'),
  created_at timestamptz not null default now()
);

create index if not exists owlfly_feedback_review_events_report_idx
  on public.owlfly_feedback_review_events (report_id, created_at desc);

-- Deny browser, publishable-key, and signed-in clients by default.
alter table public.owlfly_feedback_reports enable row level security;
alter table public.owlfly_feedback_review_events enable row level security;
revoke all privileges on table public.owlfly_feedback_reports, public.owlfly_feedback_review_events
  from public, anon, authenticated;
grant select, insert, update, delete
  on table public.owlfly_feedback_reports, public.owlfly_feedback_review_events
  to service_role;

-- Storage is private and requires a trusted backend for writes/reads.
-- No permissive storage.objects policies are installed.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'owlfly-flight-report-screenshots',
  'owlfly-flight-report-screenshots',
  false,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']::text[]
)
on conflict (id) do nothing;

do $$
begin
  if exists (
    select 1 from storage.buckets
    where id = 'owlfly-flight-report-screenshots' and public is true
  ) then
    raise exception 'OwlFly feedback screenshot bucket must remain private';
  end if;
end
$$;

commit;
