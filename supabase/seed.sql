-- ============================================================
-- SEED DATA — run AFTER supabase-migration.sql in SQL Editor
-- ============================================================

-- Teams
INSERT INTO teams (slug, title, color, founded, "group") VALUES
  ('alnour',    'النور',    '#22c55e', 2018, 'A'),
  ('aytam',     'الأيتام',   '#3b82f6', 2019, 'A'),
  ('alqadsia',  'القادسية',  '#ef4444', 2020, 'B'),
  ('alnasr',    'النصر',     '#eab308', 2017, 'B')
ON CONFLICT (slug) DO NOTHING;

-- Players
INSERT INTO players (slug, title, team, number, position, goals, assists, appearances) VALUES
  ('ahmed-hassan',      'أحمد حسن',    'alnour',   10, 'مهاجم', 5, 2, 4),
  ('khaled-omar',       'خالد عمر',    'alnour',   7,  'وسط',   2, 1, 4),
  ('yasser-ali',        'ياسر علي',    'alnour',   5,  'مدافع',  0, 0, 4),
  ('nour-saeed',        'نور سعيد',    'alnour',   1,  'حارس',   0, 0, 4),
  ('faris-nour',        'فارس نور',    'aytam',    9,  'مهاجم', 3, 1, 4),
  ('hadi-mahmoud',      'هادي محمود',  'aytam',    8,  'وسط',   1, 2, 4),
  ('sami-ibrahim',      'سامي إبراهيم','aytam',    4,  'مدافع',  0, 0, 4),
  ('marwan-hassan',     'مروان حسن',   'aytam',    1,  'حارس',   0, 0, 4),
  ('badr-shamari',      'بدر الشمري',  'alqadsia', 10, 'مهاجم', 4, 1, 4),
  ('abdullah-mohammed', 'عبدالله محمد','alqadsia', 6,  'وسط',   1, 2, 4),
  ('faisal-ahmed',      'فيصل أحمد',   'alqadsia', 3,  'مدافع',  0, 0, 4),
  ('lama-saad',         'لمى سعد',     'alqadsia', 1,  'حارس',   0, 0, 4),
  ('omar-abdullah',     'عمر عبدالله', 'alnasr',   9,  'مهاجم', 2, 3, 4),
  ('zakaria-youssef',   'زكريا يوسف',  'alnasr',   7,  'وسط',   0, 1, 4),
  ('tamer-hassan',      'تامر حسن',    'alnasr',   5,  'مدافع',  1, 0, 4),
  ('mohammed-ali',      'محمد علي',    'alnasr',   1,  'حارس',   0, 0, 4)
ON CONFLICT (slug) DO NOTHING;

-- Matches (only played ones with full data; upcoming ones with null scores)
INSERT INTO matches (slug, title, date, "group", venue, status, homeTeam, awayTeam, homeScore, awayScore, goalScorers, motmCandidates, motmWinner, videos) VALUES
  (
    'ga-alnour-vs-aytam',
    'النور vs الأيتام',
    '2026-05-02T17:00:00+00:00',
    'A', 'الملعب الرئيسي', 'played',
    'alnour', 'aytam', 3, 1,
    '[{"player":"ahmed-hassan","team":"alnour","minute":12},{"player":"khaled-omar","team":"alnour","minute":34},{"player":"khaled-omar","team":"alnour","minute":67},{"player":"faris-nour","team":"aytam","minute":55}]'::jsonb,
    '["ahmed-hassan","khaled-omar","yasser-ali"]'::jsonb,
    'ahmed-hassan',
    '[]'::jsonb
  ),
  (
    'gb-alqadsia-vs-alnasr',
    'القادسية vs النصر',
    '2026-05-03T19:00:00+00:00',
    'B', 'الملعب الرئيسي', 'played',
    'alqadsia', 'alnasr', 2, 2,
    '[{"player":"badr-shamari","team":"alqadsia","minute":23},{"player":"badr-shamari","team":"alqadsia","minute":45},{"player":"omar-abdullah","team":"alnasr","minute":30},{"player":"tamer-hassan","team":"alnasr","minute":78}]'::jsonb,
    '["badr-shamari","omar-abdullah"]'::jsonb,
    'badr-shamari',
    '[]'::jsonb
  ),
  (
    'ga-alnour-vs-alqadsia',
    'النور vs القادسية',
    '2026-05-09T17:00:00+00:00',
    'A', 'الملعب الرئيسي', 'played',
    'alnour', 'alqadsia', 1, 0,
    '[{"player":"ahmed-hassan","team":"alnour","minute":63}]'::jsonb,
    '["ahmed-hassan","nour-saeed"]'::jsonb,
    'nour-saeed',
    '[]'::jsonb
  ),
  (
    'gb-aytam-vs-alnasr',
    'الأيتام vs النصر',
    '2026-05-10T19:00:00+00:00',
    'B', 'الملعب الرئيسي', 'played',
    'aytam', 'alnasr', 2, 3,
    '[{"player":"faris-nour","team":"aytam","minute":15},{"player":"hadi-mahmoud","team":"aytam","minute":44},{"player":"omar-abdullah","team":"alnasr","minute":22},{"player":"omar-abdullah","team":"alnasr","minute":60}]'::jsonb,
    '["omar-abdullah","faris-nour"]'::jsonb,
    'omar-abdullah',
    '[]'::jsonb
  ),
  (
    'ga-alnour-vs-alnasr',
    'النور vs النصر',
    '2026-05-16T17:00:00+00:00',
    'A', 'الملعب الرئيسي', 'upcoming',
    'alnour', 'alnasr', NULL, NULL,
    '[]'::jsonb, '[]'::jsonb, NULL,
    '[]'::jsonb
  ),
  (
    'gb-aytam-vs-alqadsia',
    'الأيتام vs القادسية',
    '2026-05-17T19:00:00+00:00',
    'B', 'الملعب الرئيسي', 'upcoming',
    'aytam', 'alqadsia', NULL, NULL,
    '[]'::jsonb, '[]'::jsonb, NULL,
    '[]'::jsonb
  ),
  (
    'ga-alnour-vs-aytam-2',
    'النور vs الأيتام',
    '2026-05-23T17:00:00+00:00',
    'A', 'الملعب الرئيسي', 'upcoming',
    'alnour', 'aytam', NULL, NULL,
    '[]'::jsonb, '[]'::jsonb, NULL,
    '[]'::jsonb
  ),
  (
    'gb-alqadsia-vs-alnasr-2',
    'القادسية vs النصر',
    '2026-05-24T19:00:00+00:00',
    'B', 'الملعب الرئيسي', 'upcoming',
    'alqadsia', 'alnasr', NULL, NULL,
    '[]'::jsonb, '[]'::jsonb, NULL,
    '[]'::jsonb
  ),
  (
    'sf-alnour-vs-alqadsia',
    'نصف النهائي: النور vs القادسية',
    '2026-05-30T17:00:00+00:00',
    'SF', 'الملعب الرئيسي', 'upcoming',
    'alnour', 'alqadsia', NULL, NULL,
    '[]'::jsonb, '[]'::jsonb, NULL,
    '[]'::jsonb
  ),
  (
    'sf-alnasr-vs-aytam',
    'نصف النهائي: النصر vs الأيتام',
    '2026-05-31T19:00:00+00:00',
    'SF', 'الملعب الرئيسي', 'upcoming',
    'alnasr', 'aytam', NULL, NULL,
    '[]'::jsonb, '[]'::jsonb, NULL
  ),
  (
    'f-alnour-vs-alnasr',
    'النهائي',
    '2026-06-06T20:00:00+00:00',
    'F', 'الملعب الرئيسي', 'upcoming',
    'alnour', 'alnasr', NULL, NULL,
    '[]'::jsonb, '[]'::jsonb, NULL,
    '[]'::jsonb
  )
ON CONFLICT (slug) DO NOTHING;
