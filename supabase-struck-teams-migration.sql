-- =============================================================================
-- Strike off a team (شطب): keeps the team + matches, but its results no longer
-- count in group standings. Group effectively continues with the remaining teams.
-- =============================================================================

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS is_struck BOOLEAN DEFAULT false;