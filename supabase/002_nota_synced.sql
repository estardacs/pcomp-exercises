-- Add tracking for Excel/CSV grade sync
alter table submissions add column if not exists nota_synced_at timestamptz;
