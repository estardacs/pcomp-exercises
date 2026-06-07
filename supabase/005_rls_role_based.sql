-- Replace catch-all "any authenticated" policies with role-based access.
-- Graders (profesor + ayudante) keep FULL access (collaborative grading UX).
-- Students (alumno) get read-only access to their OWN graded submissions.

-- Drop catch-all policies (live) and any legacy 001 policies, if present.
drop policy if exists "auth full access profiles" on public.profiles;
drop policy if exists "users see own profile" on public.profiles;
drop policy if exists "users update own profile" on public.profiles;

drop policy if exists "auth full access exercises" on public.exercises;
drop policy if exists "everyone reads exercises" on public.exercises;
drop policy if exists "profesor manages exercises" on public.exercises;

drop policy if exists "auth full access submissions" on public.submissions;
drop policy if exists "ayudante sees assigned submissions" on public.submissions;
drop policy if exists "profesor manages submissions" on public.submissions;
drop policy if exists "ayudante updates assigned submissions" on public.submissions;

drop policy if exists "auth full access grades" on public.question_grades;
drop policy if exists "ayudante reads their grades" on public.question_grades;
drop policy if exists "ayudante upserts their grades" on public.question_grades;
drop policy if exists "ayudante updates their grades" on public.question_grades;
drop policy if exists "profesor manages all grades" on public.question_grades;

drop policy if exists "authenticated_all" on public.students;

-- profiles -------------------------------------------------------------
create policy "profiles_select" on public.profiles
  for select using (public.is_grader() or id = auth.uid());
create policy "profiles_grader_write" on public.profiles
  for all using (public.is_grader()) with check (public.is_grader());

-- exercises ------------------------------------------------------------
create policy "exercises_select" on public.exercises
  for select using (auth.role() = 'authenticated');
create policy "exercises_grader_write" on public.exercises
  for all using (public.is_grader()) with check (public.is_grader());

-- submissions ----------------------------------------------------------
-- Students see their own submissions in any status; per-question grades stay
-- hidden until the submission is marked done (see question_grades policy).
create policy "submissions_select" on public.submissions
  for select using (
    public.is_grader()
    or student_rut = public.my_rut()
  );
create policy "submissions_grader_write" on public.submissions
  for all using (public.is_grader()) with check (public.is_grader());

-- question_grades ------------------------------------------------------
create policy "question_grades_select" on public.question_grades
  for select using (
    public.is_grader()
    or exists (
      select 1 from public.submissions s
      where s.id = submission_id
        and s.student_rut = public.my_rut()
        and s.status = 'done'
    )
  );
create policy "question_grades_grader_write" on public.question_grades
  for all using (public.is_grader()) with check (public.is_grader());

-- students -------------------------------------------------------------
create policy "students_grader_all" on public.students
  for all using (public.is_grader()) with check (public.is_grader());

-- storage: notebooks bucket is graders-only. Students read notebook content
-- from submissions.notebook_json, never from storage directly.
drop policy if exists "authenticated users read notebooks" on storage.objects;
drop policy if exists "profesor uploads notebooks" on storage.objects;
create policy "notebooks_grader_read" on storage.objects
  for select using (bucket_id = 'notebooks' and public.is_grader());
create policy "notebooks_grader_write" on storage.objects
  for all using (bucket_id = 'notebooks' and public.is_grader())
  with check (bucket_id = 'notebooks' and public.is_grader());

-- Legacy helper from 001, no longer referenced (replaced by is_grader()).
drop function if exists public.current_user_role();
