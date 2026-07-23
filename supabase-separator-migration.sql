BEGIN;

SET session_replication_role = replica;

-- 1. TEAMS: convert {ls}- -> {ls}::, also fix false negatives
UPDATE teams
SET slug = l.slug || '::' ||
  CASE
    WHEN teams.slug LIKE l.slug || '::%' THEN substring(teams.slug FROM length(l.slug) + 3)
    WHEN teams.slug LIKE l.slug || '-%'  THEN substring(teams.slug FROM length(l.slug) + 2)
    ELSE teams.slug
  END
FROM leagues l
WHERE teams.league_id = l.id;

-- 2. MANAGERS: prefix team_slug
UPDATE managers
SET team_slug = l.slug || '::' ||
  CASE
    WHEN managers.team_slug LIKE l.slug || '::%' THEN substring(managers.team_slug FROM length(l.slug) + 3)
    WHEN managers.team_slug LIKE l.slug || '-%'  THEN substring(managers.team_slug FROM length(l.slug) + 2)
    ELSE managers.team_slug
  END
FROM leagues l
WHERE managers.league_id = l.id;

-- 3. PLAYERS: prefix slug + team
UPDATE players
SET
  slug = l.slug || '::' ||
    CASE
      WHEN players.slug LIKE l.slug || '::%' THEN substring(players.slug FROM length(l.slug) + 3)
      WHEN players.slug LIKE l.slug || '-%'  THEN substring(players.slug FROM length(l.slug) + 2)
      ELSE players.slug
    END,
  team = l.slug || '::' ||
    CASE
      WHEN players.team LIKE l.slug || '::%' THEN substring(players.team FROM length(l.slug) + 3)
      WHEN players.team LIKE l.slug || '-%'  THEN substring(players.team FROM length(l.slug) + 2)
      ELSE players.team
    END
FROM leagues l
WHERE players.league_id = l.id;

-- 4. VOTES: join via matches (no league_id column)
UPDATE votes
SET match_slug  = l.slug || '::' ||
    CASE
      WHEN votes.match_slug LIKE l.slug || '::%' THEN substring(votes.match_slug FROM length(l.slug) + 3)
      WHEN votes.match_slug LIKE l.slug || '-%'  THEN substring(votes.match_slug FROM length(l.slug) + 2)
      ELSE votes.match_slug
    END,
    player_slug = l.slug || '::' ||
    CASE
      WHEN votes.player_slug LIKE l.slug || '::%' THEN substring(votes.player_slug FROM length(l.slug) + 3)
      WHEN votes.player_slug LIKE l.slug || '-%'  THEN substring(votes.player_slug FROM length(l.slug) + 2)
      ELSE votes.player_slug
    END
FROM matches m
JOIN leagues l ON l.id = m.league_id
WHERE m.slug = votes.match_slug;

-- 5. MATCH_PREDICTIONS: join via matches
UPDATE match_predictions
SET match_slug = l.slug || '::' ||
    CASE
      WHEN match_predictions.match_slug LIKE l.slug || '::%' THEN substring(match_predictions.match_slug FROM length(l.slug) + 3)
      WHEN match_predictions.match_slug LIKE l.slug || '-%'  THEN substring(match_predictions.match_slug FROM length(l.slug) + 2)
      ELSE match_predictions.match_slug
    END,
    team_slug  = l.slug || '::' ||
    CASE
      WHEN match_predictions.team_slug LIKE l.slug || '::%' THEN substring(match_predictions.team_slug FROM length(l.slug) + 3)
      WHEN match_predictions.team_slug LIKE l.slug || '-%'  THEN substring(match_predictions.team_slug FROM length(l.slug) + 2)
      ELSE match_predictions.team_slug
    END
FROM matches m
JOIN leagues l ON l.id = m.league_id
WHERE m.slug = match_predictions.match_slug;

-- 6. MATCHES: prefix slug + homeTeam + awayTeam
UPDATE matches
SET
  slug = l.slug || '::' ||
    CASE
      WHEN matches.slug LIKE l.slug || '::%' THEN substring(matches.slug FROM length(l.slug) + 3)
      WHEN matches.slug LIKE l.slug || '-%'  THEN substring(matches.slug FROM length(l.slug) + 2)
      ELSE matches.slug
    END,
  "homeTeam" = l.slug || '::' ||
    CASE
      WHEN matches."homeTeam" LIKE l.slug || '::%' THEN substring(matches."homeTeam" FROM length(l.slug) + 3)
      WHEN matches."homeTeam" LIKE l.slug || '-%'  THEN substring(matches."homeTeam" FROM length(l.slug) + 2)
      ELSE matches."homeTeam"
    END,
  "awayTeam" = l.slug || '::' ||
    CASE
      WHEN matches."awayTeam" LIKE l.slug || '::%' THEN substring(matches."awayTeam" FROM length(l.slug) + 3)
      WHEN matches."awayTeam" LIKE l.slug || '-%'  THEN substring(matches."awayTeam" FROM length(l.slug) + 2)
      ELSE matches."awayTeam"
    END
FROM leagues l
WHERE matches.league_id = l.id;

-- 7. MATCHES.goalScorers JSON
-- Strip: {ls}::{ls}- → {ls}- → {ls}:: → then re-add {ls}::
-- 3-layer regexp makes this idempotent for any input format
UPDATE matches
SET "goalScorers" = (
  SELECT jsonb_agg(
    jsonb_set(
      jsonb_set(elem, '{player}',
        to_jsonb(l.slug || '::' ||
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(elem->>'player', '^' || l.slug || '::' || l.slug || '-', ''),
            '^' || l.slug || '-', ''),
          '^(' || l.slug || '::)+', '')
        )
      ),
    '{team}',
      to_jsonb(l.slug || '::' ||
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(elem->>'team', '^' || l.slug || '::' || l.slug || '-', ''),
          '^' || l.slug || '-', ''),
        '^(' || l.slug || '::)+', '')
      )
    )
  )
  FROM jsonb_array_elements(matches."goalScorers") AS elem
)
FROM leagues l
WHERE matches.league_id = l.id
  AND matches."goalScorers" IS NOT NULL
  AND matches."goalScorers"::text <> '[]';

-- 8. MATCHES.cards JSON
UPDATE matches
SET cards = (
  SELECT jsonb_agg(
    jsonb_set(
      jsonb_set(elem, '{player}',
        to_jsonb(l.slug || '::' ||
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(elem->>'player', '^' || l.slug || '::' || l.slug || '-', ''),
            '^' || l.slug || '-', ''),
          '^(' || l.slug || '::)+', '')
        )
      ),
    '{team}',
      to_jsonb(l.slug || '::' ||
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(elem->>'team', '^' || l.slug || '::' || l.slug || '-', ''),
          '^' || l.slug || '-', ''),
        '^(' || l.slug || '::)+', '')
      )
    )
  )
  FROM jsonb_array_elements(matches.cards) AS elem
)
FROM leagues l
WHERE matches.league_id = l.id
  AND matches.cards IS NOT NULL
  AND matches.cards::text <> '[]';

-- 9. MATCHES.motmWinner
UPDATE matches
SET "motmWinner" = l.slug || '::' ||
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(matches."motmWinner", '^' || l.slug || '::' || l.slug || '-', ''),
    '^' || l.slug || '-', ''),
  '^(' || l.slug || '::)+', '')
FROM leagues l
WHERE matches.league_id = l.id
  AND matches."motmWinner" IS NOT NULL
  AND matches."motmWinner" <> '';

SET session_replication_role = origin;

COMMIT;
