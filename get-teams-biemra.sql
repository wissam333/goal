-- Run this in Supabase SQL Editor to get team slugs for 'biemra' league
SELECT slug, title, "group"
FROM teams
WHERE league_id = (SELECT id FROM leagues WHERE slug = 'biemra' LIMIT 1)
ORDER BY "group", title;
