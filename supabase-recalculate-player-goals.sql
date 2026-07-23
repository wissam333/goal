-- Run this in Supabase SQL Editor once.
-- Creates a function to recalculate player goals from match goalScorers.
-- Call via: supabase.rpc('recalculate_player_goals', { p_league_id: 'uuid' })

CREATE OR REPLACE FUNCTION recalculate_player_goals(p_league_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Count goals from all matches for this league
  WITH goal_counts AS (
    SELECT gs->>'player' AS player_slug, COUNT(*)::INT AS g
    FROM matches m, jsonb_array_elements(m."goalScorers") gs
    WHERE m.league_id = p_league_id
      AND m."goalScorers" IS NOT NULL
      AND m."goalScorers"::text <> '[]'
    GROUP BY gs->>'player'
  )
  UPDATE players p
  SET goals = gc.g
  FROM goal_counts gc
  WHERE p.slug = gc.player_slug
    AND p.league_id = p_league_id;

  -- Zero out players who have no goals
  UPDATE players
  SET goals = 0
  WHERE league_id = p_league_id
    AND goals != 0
    AND slug NOT IN (
      SELECT DISTINCT gs->>'player'
      FROM matches m, jsonb_array_elements(m."goalScorers") gs
      WHERE m.league_id = p_league_id
        AND m."goalScorers" IS NOT NULL
    );
END;
$$;