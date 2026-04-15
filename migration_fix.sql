-- ─────────────────────────────────────────────────────────────────────────────
-- migration_fix.sql
-- Run this in the Supabase SQL editor to bring the live DB up to schema.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. plans — add missing columns ───────────────────────────────────────────
-- Live DB has an old `datetime` column; we keep it and add the new date columns.
ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS added_by_emoji   text,
  ADD COLUMN IF NOT EXISTS date_type        text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS date_single      timestamptz,
  ADD COLUMN IF NOT EXISTS date_range_start timestamptz,
  ADD COLUMN IF NOT EXISTS date_range_end   timestamptz,
  ADD COLUMN IF NOT EXISTS date_multi       text[];

-- ── 2. participants — add missing unique constraint (needed for upsert) ───────
-- Error 42P10 fires because ON CONFLICT (session_id, name) has no backing index.
ALTER TABLE participants
  ADD CONSTRAINT IF NOT EXISTS participants_session_id_name_key
  UNIQUE (session_id, name);

-- ── 3. availability — table is completely missing, create it ──────────────────
CREATE TABLE IF NOT EXISTS availability (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  participant_name    text NOT NULL,
  participant_emoji   text,
  free_dates          text[] NOT NULL DEFAULT '{}',
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, participant_name)
);

-- Enable realtime for availability
ALTER PUBLICATION supabase_realtime ADD TABLE availability;

-- Enable RLS
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read availability"
  ON availability FOR SELECT USING (true);

CREATE POLICY "public insert availability"
  ON availability FOR INSERT WITH CHECK (true);

CREATE POLICY "public update availability"
  ON availability FOR UPDATE USING (true);
