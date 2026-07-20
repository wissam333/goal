-- Extra time & penalty shootout support for matches
-- Run this in the Supabase SQL Editor before deploying the app changes.

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS "homeScoreAET" INTEGER,
  ADD COLUMN IF NOT EXISTS "awayScoreAET" INTEGER,
  ADD COLUMN IF NOT EXISTS "homePenalties" INTEGER,
  ADD COLUMN IF NOT EXISTS "awayPenalties" INTEGER;

-- resultMethod: how the match was decided
--   ft  = full time (regulation)
--   aet = after extra time
--   pen = penalty shootout
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'resultMethod'
  ) THEN
    ALTER TABLE matches
      ADD COLUMN "resultMethod" TEXT DEFAULT 'ft'
      CHECK ("resultMethod" IS NULL OR "resultMethod" IN ('ft', 'aet', 'pen'));
  END IF;
END $$;

-- Backfill existing played matches
UPDATE matches
SET "resultMethod" = 'ft'
WHERE status = 'played' AND ("resultMethod" IS NULL OR "resultMethod" = '');
