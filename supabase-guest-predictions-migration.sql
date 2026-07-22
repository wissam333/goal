-- Guest predictions: one vote per device (voter_id) per match per league.
-- Run in Supabase SQL Editor once.
-- Safe to re-run.
--
-- App also has /api/predictions/submit (service key) so guests work even if
-- RLS is still strict — but you SHOULD run this for correct unique + policies.

-- 1) Ensure voter_id is always present
UPDATE match_predictions
SET voter_id = COALESCE(voter_id, user_id::text, id::text)
WHERE voter_id IS NULL OR voter_id = '';

ALTER TABLE match_predictions
  ALTER COLUMN voter_id SET NOT NULL;

-- 2) Drop old uniques that block guests or only key on user_id
ALTER TABLE match_predictions
  DROP CONSTRAINT IF EXISTS match_predictions_match_slug_user_id_key;

ALTER TABLE match_predictions
  DROP CONSTRAINT IF EXISTS match_predictions_match_slug_voter_id_key;

ALTER TABLE match_predictions
  DROP CONSTRAINT IF EXISTS match_predictions_league_match_voter_key;

-- 3) Remove duplicate guest/user rows keeping the oldest
DELETE FROM match_predictions a
USING match_predictions b
WHERE a.league_id IS NOT DISTINCT FROM b.league_id
  AND a.match_slug = b.match_slug
  AND a.voter_id = b.voter_id
  AND a.ctid > b.ctid;

-- 4) One prediction per voter per match per league
ALTER TABLE match_predictions
  ADD CONSTRAINT match_predictions_league_match_voter_key
  UNIQUE (league_id, match_slug, voter_id);

-- 5) Keep optional uniqueness for logged-in users when user_id is set
--    (NULLs are distinct in Postgres unique indexes — guests OK)
CREATE UNIQUE INDEX IF NOT EXISTS match_predictions_league_match_user_uidx
  ON match_predictions (league_id, match_slug, user_id)
  WHERE user_id IS NOT NULL;

-- 6) Anon insert already allowed; ensure select stays open for counts
DROP POLICY IF EXISTS "anon_select_match_predictions" ON match_predictions;
CREATE POLICY "anon_select_match_predictions"
  ON match_predictions FOR SELECT USING (true);

DROP POLICY IF EXISTS "anon_insert_match_predictions" ON match_predictions;
CREATE POLICY "anon_insert_match_predictions"
  ON match_predictions FOR INSERT WITH CHECK (true);
