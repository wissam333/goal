-- =============================================================================
-- Configurable group-stage tie-breakers
-- Rules (ordered, first rule with a difference decides):
--   pts      → points (desc)
--   gd       → goal difference (desc)
--   gf       → goals scored (desc)
--   h2h      → head-to-head: winner of the direct match ranks higher
--   fairplay → fair play points (yellow=1, red=3, asc)
-- Default: Points → Goal Difference → Goals Scored
-- =============================================================================

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS tie_breakers JSONB DEFAULT '["pts","gd","gf"]'::jsonb;