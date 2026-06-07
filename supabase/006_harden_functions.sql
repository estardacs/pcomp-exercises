-- Trigger functions must never be callable via the REST RPC surface.
revoke all on function public.handle_new_user() from public, anon, authenticated;
-- (recompute_submission_total is revoked in 004_total_score_trigger.sql)

-- Note: is_grader(), is_profesor() and my_rut() intentionally remain EXECUTABLE
-- by the authenticated role: they are evaluated inside RLS policies and only
-- ever expose the calling user's own role/rut.
