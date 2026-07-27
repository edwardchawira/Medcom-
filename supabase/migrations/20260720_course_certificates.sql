-- Server-issued course certificates and assessment attempt records

create table if not exists public.user_course_certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_key text not null,
  course_title text not null,
  learner_name text not null,
  score_percent integer not null check (score_percent between 0 and 100),
  score_label text not null,
  pass_mark integer not null check (pass_mark between 0 and 100),
  certificate_id text not null unique,
  answers_json jsonb not null default '[]'::jsonb,
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, course_key)
);

create index if not exists idx_user_course_certificates_user
  on public.user_course_certificates(user_id, issued_at desc);

alter table public.user_course_certificates enable row level security;

drop policy if exists user_course_certificates_select on public.user_course_certificates;
drop policy if exists user_course_certificates_insert on public.user_course_certificates;

create policy user_course_certificates_select
  on public.user_course_certificates
  for select
  using (user_id = auth.uid());

create policy user_course_certificates_insert
  on public.user_course_certificates
  for insert
  with check (user_id = auth.uid());

