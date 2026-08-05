-- =============================================================================
-- Match description text (optional info shown on a match page)
-- =============================================================================

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';