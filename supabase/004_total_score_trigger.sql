-- Keep submissions.total_score as the authoritative sum of its question_grades,
-- recomputed automatically on any grade change (insert/update/delete).
create or replace function public.recompute_submission_total()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  sid uuid := coalesce(new.submission_id, old.submission_id);
begin
  update public.submissions s
    set total_score = (
      select coalesce(sum(g.score), 0)
      from public.question_grades g
      where g.submission_id = sid
    )
  where s.id = sid;
  return null;
end;
$$;

drop trigger if exists trg_recompute_total on public.question_grades;
create trigger trg_recompute_total
  after insert or update or delete on public.question_grades
  for each row execute function public.recompute_submission_total();

revoke all on function public.recompute_submission_total() from public, anon, authenticated;
