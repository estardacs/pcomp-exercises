-- Add 'alumno' role, student linkage, deadlines, sync tracking, and role helpers.

-- 1. Allow 'alumno' role on profiles
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('profesor', 'ayudante', 'alumno'));

-- 2. Link a profile to a student via RUT (graders keep this null)
alter table public.profiles add column if not exists rut text;
create index if not exists profiles_rut_idx on public.profiles (rut);

-- 3. nota_synced_at (migration 002 was never applied to this project)
alter table public.submissions add column if not exists nota_synced_at timestamptz;

-- 4. Optional self-upload deadline per exercise
alter table public.exercises add column if not exists due_date timestamptz;

-- 5. Role helpers (SECURITY DEFINER -> bypass RLS, no recursion)
create or replace function public.is_grader()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('profesor', 'ayudante')
  );
$$;

create or replace function public.is_profesor()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'profesor'
  );
$$;

create or replace function public.my_rut()
returns text language sql stable security definer set search_path = public as $$
  select rut from public.profiles where id = auth.uid();
$$;

-- 6. Least-privilege default for auto-created profiles.
-- New auth users (e.g. student magic-link signups) default to 'alumno'.
-- Graders are created via the admin API which sets role explicitly.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'alumno')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
