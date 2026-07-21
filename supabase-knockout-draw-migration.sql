-- Knockout Draw migration
-- Adds knockout_draw JSONB column to settings
-- Run in Supabase SQL Editor before deploying

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS knockout_draw JSONB DEFAULT NULL;

-- Example shape:
-- {
--   "published": false,
--   "startingRound": "QF",
--   "slots": [
--     {
--       "id": "qf-1",
--       "round": "QF",
--       "order": 0,
--       "home": { "type": "seed", "group": "A", "pos": 1 },
--       "away": { "type": "seed", "group": "C", "pos": 2 }
--     }
--   ]
-- }
