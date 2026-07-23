-- Run this AFTER supabase-separator-migration.sql
-- Fixes data broken by the migration's -% branch (false positives for slugs starting with league slug)
BEGIN;
SET session_replication_role = replica;

-- 1. FIX mangled team slugs (biemra league only — adapt for other leagues if needed)
-- False-negative teams: original slug starts with league slug, so old migration skipped them,
-- new migration's -% branch incorrectly stripped the prefix
--
-- Detect: team slug = {ls}::{rest} where there's a match reference {ls}::{ls}-{rest}
-- Fix: insert correct slug, update all FK references, delete old slug

-- Team "biemra-b": slug was "biemra::b", should be "biemra::biemra-b"
INSERT INTO teams (slug, title, color, logo, "group", league_id)
SELECT 'biemra::biemra-b', title, color, logo, "group", league_id
FROM teams WHERE slug = 'biemra::b' AND league_id = (SELECT id FROM leagues WHERE slug = 'biemra')
ON CONFLICT DO NOTHING;
UPDATE managers SET team_slug = 'biemra::biemra-b' WHERE team_slug = 'biemra::b';
UPDATE matches SET "homeTeam" = 'biemra::biemra-b' WHERE "homeTeam" = 'biemra::b';
UPDATE matches SET "awayTeam" = 'biemra::biemra-b' WHERE "awayTeam" = 'biemra::b';
UPDATE players SET team = 'biemra::biemra-b' WHERE team = 'biemra::b';
DELETE FROM teams WHERE slug = 'biemra::b' AND league_id = (SELECT id FROM leagues WHERE slug = 'biemra');

-- Team "biemra-club": slug was "biemra::club", should be "biemra::biemra-club"
INSERT INTO teams (slug, title, color, logo, "group", league_id)
SELECT 'biemra::biemra-club', title, color, logo, "group", league_id
FROM teams WHERE slug = 'biemra::club' AND league_id = (SELECT id FROM leagues WHERE slug = 'biemra')
ON CONFLICT DO NOTHING;
UPDATE managers SET team_slug = 'biemra::biemra-club' WHERE team_slug = 'biemra::club';
UPDATE matches SET "homeTeam" = 'biemra::biemra-club' WHERE "homeTeam" = 'biemra::club';
UPDATE matches SET "awayTeam" = 'biemra::biemra-club' WHERE "awayTeam" = 'biemra::club';
UPDATE players SET team = 'biemra::biemra-club' WHERE team = 'biemra::club';
DELETE FROM teams WHERE slug = 'biemra::club' AND league_id = (SELECT id FROM leagues WHERE slug = 'biemra');

-- 2. FIX double-prefixed JSON data (goalScorers, cards, motmWinner)
-- Migration step 7-9 blindly added {ls}:: to values that already had {ls}- prefix
-- Creating {ls}::{ls}-{clean} instead of {ls}::{clean}

-- Strip: {ls}::{ls}- (double) → {ls}- (old) → {ls}:: (new) then re-add {ls}::
-- This makes the fix idempotent regardless of input format
-- goalScorers
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

-- cards
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

-- motmWinner
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
