-- ============================================================
-- DNO1063 Corrector — Initial Schema
-- Run this in the Supabase SQL editor
-- ============================================================

-- Profiles (extends auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  role text not null check (role in ('profesor', 'ayudante')),
  created_at timestamptz default now()
);

-- Exercises (seeded from rubrica.json)
create table if not exists exercises (
  id text primary key,              -- 'E01', 'E02', ...
  title text not null,
  module text not null,             -- 'M01', 'M02', 'M03'
  total_points numeric not null default 0,
  is_optional boolean not null default false,
  rubrica jsonb not null default '{}',
  created_at timestamptz default now()
);

-- Submissions (one row per student × exercise)
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  exercise_id text not null references exercises(id),
  student_apellido text not null,
  student_nombre text not null,
  student_rut text not null,
  rut_last_digit text not null,     -- '0'–'9' | 'K'
  filename text not null,
  notebook_storage_path text,       -- path in Supabase Storage
  notebook_json jsonb not null default '{}',
  uploaded_at timestamptz default now(),
  uploaded_by uuid references profiles(id),
  assigned_to uuid references profiles(id),
  status text not null default 'unassigned'
    check (status in ('unassigned', 'pending', 'in_progress', 'done')),
  total_score numeric,
  general_comment text,
  graded_at timestamptz,
  unique(exercise_id, student_rut)
);

-- Question grades (one row per question × submission)
create table if not exists question_grades (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  question_n integer not null,
  question_title text,
  max_points numeric not null default 1,
  score numeric,
  comment text,
  is_empty boolean not null default false,
  graded_by uuid references profiles(id),
  graded_at timestamptz default now(),
  unique(submission_id, question_n)
);

-- ============================================================
-- RLS
-- ============================================================

alter table profiles enable row level security;
alter table exercises enable row level security;
alter table submissions enable row level security;
alter table question_grades enable row level security;

-- Helper: get current user role
create or replace function current_user_role()
returns text language sql stable security definer as $$
  select role from profiles where id = auth.uid()
$$;

-- profiles: users see their own profile; profesor sees all
create policy "users see own profile"
  on profiles for select using (id = auth.uid() or current_user_role() = 'profesor');

create policy "users update own profile"
  on profiles for update using (id = auth.uid());

-- exercises: everyone can read
create policy "everyone reads exercises"
  on exercises for select using (true);

create policy "profesor manages exercises"
  on exercises for all using (current_user_role() = 'profesor');

-- submissions: ayudante sees only assigned; profesor sees all
create policy "ayudante sees assigned submissions"
  on submissions for select
  using (assigned_to = auth.uid() or current_user_role() = 'profesor');

create policy "profesor manages submissions"
  on submissions for all using (current_user_role() = 'profesor');

create policy "ayudante updates assigned submissions"
  on submissions for update
  using (assigned_to = auth.uid())
  with check (assigned_to = auth.uid());

-- question_grades: ayudante can grade their submissions
create policy "ayudante reads their grades"
  on question_grades for select
  using (
    current_user_role() = 'profesor' or
    exists (select 1 from submissions s
            where s.id = submission_id and s.assigned_to = auth.uid())
  );

create policy "ayudante upserts their grades"
  on question_grades for insert
  with check (
    exists (select 1 from submissions s
            where s.id = submission_id and s.assigned_to = auth.uid())
  );

create policy "ayudante updates their grades"
  on question_grades for update
  using (
    exists (select 1 from submissions s
            where s.id = submission_id and s.assigned_to = auth.uid())
  );

create policy "profesor manages all grades"
  on question_grades for all using (current_user_role() = 'profesor');

-- ============================================================
-- Storage bucket for notebooks
-- ============================================================
insert into storage.buckets (id, name, public)
values ('notebooks', 'notebooks', false)
on conflict do nothing;

create policy "authenticated users read notebooks"
  on storage.objects for select
  using (bucket_id = 'notebooks' and auth.role() = 'authenticated');

create policy "profesor uploads notebooks"
  on storage.objects for insert
  with check (bucket_id = 'notebooks' and current_user_role() = 'profesor');

-- ============================================================
-- Auto-create profile on signup
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'ayudante')
  )
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
