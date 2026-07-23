-- Run this in Supabase SQL Editor once.
-- Adds missing indexes to speed up common queries.
-- Safe to re-run (uses IF NOT EXISTS).

-- Speeds up fetchPlayers({team:}) and match detail page (players by team)
CREATE INDEX IF NOT EXISTS idx_players_team_league ON players(league_id, team);

-- Speeds up fetchMatches({team:}) — OR filter on homeTeam/awayTeam
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON matches(league_id, "homeTeam");
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON matches(league_id, "awayTeam");

-- Speeds up getVotes(matchSlug) on match detail page
CREATE INDEX IF NOT EXISTS idx_votes_match ON votes(league_id, match_slug);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(league_id, user_id);

-- Speeds up getPredictions(matchSlug) on match detail page
CREATE INDEX IF NOT EXISTS idx_predictions_match ON match_predictions(league_id, match_slug);
CREATE INDEX IF NOT EXISTS idx_predictions_user ON match_predictions(league_id, user_id);

-- Speeds up recalculate_player_goals RPC (jsonb_array_elements on goalScorers)
CREATE INDEX IF NOT EXISTS idx_matches_goalScorers_gin ON matches USING GIN ("goalScorers");