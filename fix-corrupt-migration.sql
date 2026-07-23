-- Fix 1: Replace biemra::club -> biemra::biemra-club in goalScorers and cards
UPDATE matches
SET "goalScorers" = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'team' = 'biemra::club' THEN
        jsonb_set(elem, '{team}', '"biemra::biemra-club"'::jsonb)
      ELSE elem
    END
  )
  FROM jsonb_array_elements("goalScorers") AS elem
)
WHERE league_id = (SELECT id FROM leagues WHERE slug = 'biemra')
  AND "goalScorers" IS NOT NULL
  AND "goalScorers"::text <> '[]';

UPDATE matches
SET cards = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'team' = 'biemra::club' THEN
        jsonb_set(elem, '{team}', '"biemra::biemra-club"'::jsonb)
      ELSE elem
    END
  )
  FROM jsonb_array_elements(cards) AS elem
)
WHERE league_id = (SELECT id FROM leagues WHERE slug = 'biemra')
  AND cards IS NOT NULL
  AND cards::text <> '[]';

-- Fix 2: Replace biemra::b -> biemra::biemra-b in goalScorers and cards
UPDATE matches
SET "goalScorers" = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'team' = 'biemra::b' THEN
        jsonb_set(elem, '{team}', '"biemra::biemra-b"'::jsonb)
      ELSE elem
    END
  )
  FROM jsonb_array_elements("goalScorers") AS elem
)
WHERE league_id = (SELECT id FROM leagues WHERE slug = 'biemra')
  AND "goalScorers" IS NOT NULL
  AND "goalScorers"::text <> '[]';

UPDATE matches
SET cards = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'team' = 'biemra::b' THEN
        jsonb_set(elem, '{team}', '"biemra::biemra-b"'::jsonb)
      ELSE elem
    END
  )
  FROM jsonb_array_elements(cards) AS elem
)
WHERE league_id = (SELECT id FROM leagues WHERE slug = 'biemra')
  AND cards IS NOT NULL
  AND cards::text <> '[]';

-- Fix 3: Remove goalScorer entries with unknown player
UPDATE matches
SET "goalScorers" = (
  SELECT jsonb_agg(elem)
  FROM jsonb_array_elements("goalScorers") AS elem
  WHERE elem->>'player' <> 'unknown'
    AND NOT elem->>'player' LIKE '%::unknown'
)
WHERE ("goalScorers") IS NOT NULL
  AND "goalScorers"::text <> '[]';

-- Fix 4: Remove duplicate goalScorer entries (same team+player+minute)
UPDATE matches
SET "goalScorers" = (
  SELECT jsonb_agg(x.elem)
  FROM (
    SELECT DISTINCT ON (elem->>'team', elem->>'player', COALESCE(elem->>'minute', ''))
      elem
    FROM jsonb_array_elements("goalScorers") AS elem
    ORDER BY elem->>'team', elem->>'player', COALESCE(elem->>'minute', '')
  ) x
)
WHERE "goalScorers" IS NOT NULL
  AND "goalScorers"::text <> '[]';
