-- ═══════════════════════════════════════════════════════════════
-- WIPE ALL DATA + RESEED WITH GROUP STAGE (played) + QF (upcoming)
-- Current date: 2026-05-30
-- ═══════════════════════════════════════════════════════════════

-- 1. Wipe existing data (FK-safe order)
DELETE FROM match_predictions;
DELETE FROM votes;
DELETE FROM matches;
DELETE FROM players;
DELETE FROM teams;
DELETE FROM seasons;
DELETE FROM settings;

-- 2. Teams (16 teams, 4 groups)
INSERT INTO teams (slug, title, color, "group") VALUES
  ('alnour',    'النور',    '#22c55e', 'A'),
  ('aytam',     'الأيتام',  '#3b82f6', 'A'),
  ('alqadsia',  'القادسية', '#ef4444', 'A'),
  ('alhilal',   'الهلال',   '#8b5cf6', 'A'),
  ('alahli',    'الأهلي',   '#14b8a6', 'B'),
  ('alraed',    'الرائد',   '#6366f1', 'B'),
  ('alwehdah',  'الوحدة',   '#a855f7', 'B'),
  ('alokhdood', 'الأخدود',  '#dc2626', 'B'),
  ('alnasr',    'النصر',    '#eab308', 'C'),
  ('alittihad', 'الاتحاد',  '#f97316', 'C'),
  ('alshabab',  'الشباب',   '#ec4899', 'C'),
  ('alfateh',   'الفتح',    '#06b6d4', 'C'),
  ('altaawoun', 'التعاون',  '#84cc16', 'D'),
  ('altai',     'الطائي',   '#f59e0b', 'D'),
  ('alkhaleej', 'الخليج',   '#0ea5e9', 'D'),
  ('alriyadh',  'الرياض',   '#64748b', 'D');

-- 3. Players (4 per team = 64) with updated goals/appearances from group stage
INSERT INTO players (slug, title, team, number, position, goals, appearances) VALUES
  -- النور
  ('ahmed-hassan',    'أحمد حسن',    'alnour',   10, 'مهاجم', 3, 3),
  ('khaled-omar',     'خالد عمر',    'alnour',    7, 'وسط',   2, 3),
  ('yasser-ali',      'ياسر علي',    'alnour',    5, 'مدافع', 1, 3),
  ('nour-saeed',      'نور سعيد',    'alnour',    1, 'حارس',  0, 3),
  -- الأيتام
  ('faris-nour',      'فارس نور',    'aytam',     9, 'مهاجم', 1, 3),
  ('hadi-mahmoud',    'هادي محمود',  'aytam',     8, 'وسط',   1, 3),
  ('sami-ibrahim',    'سامي إبراهيم','aytam',     4, 'مدافع', 1, 3),
  ('marwan-hassan',   'مروان حسن',   'aytam',     1, 'حارس',  0, 3),
  -- القادسية
  ('badr-shamari',    'بدر الشمري',  'alqadsia',  10, 'مهاجم', 2, 3),
  ('abdullah-mohammed','عبدالله محمد','alqadsia',  6, 'وسط',   1, 3),
  ('faisal-ahmed',    'فيصل أحمد',   'alqadsia',   3, 'مدافع', 1, 3),
  ('lama-saad',       'لمى سعد',     'alqadsia',   1, 'حارس',  0, 3),
  -- الهلال
  ('hasan-ali',       'حسن علي',     'alhilal',   11, 'مهاجم', 1, 3),
  ('mohammed-saad',   'محمد سعد',    'alhilal',    8, 'وسط',   1, 3),
  ('omar-hassan',     'عمر حسن',     'alhilal',    5, 'مدافع', 0, 3),
  ('saed-ahmed',      'سعيد أحمد',   'alhilal',    1, 'حارس',  0, 3),
  -- الأهلي
  ('ali-nour',        'علي نور',     'alahli',     9, 'مهاجم', 3, 3),
  ('fahd-saeed',      'فهد سعيد',    'alahli',     7, 'وسط',   2, 3),
  ('naser-mohammed',  'ناصر محمد',   'alahli',     4, 'مدافع', 1, 3),
  ('khaled-ibrahim',  'خالد إبراهيم','alahli',     1, 'حارس',  0, 3),
  -- الرائد
  ('majed-fahd',      'ماجد فهد',    'alraed',    10, 'مهاجم', 1, 3),
  ('sultan-isa',      'سلطان عيسى',  'alraed',     6, 'وسط',   1, 3),
  ('abdulrahman-ali', 'عبدالرحمن علي','alraed',    3, 'مدافع', 0, 3),
  ('faisal-omar',     'فيصل عمر',    'alraed',     1, 'حارس',  0, 3),
  -- الوحدة
  ('mohammed-nour',   'محمد نور',    'alwehdah',  10, 'مهاجم', 2, 3),
  ('khaled-raed',     'خالد رائد',   'alwehdah',   7, 'وسط',   2, 3),
  ('abdullah-fahd',   'عبدالله فهد', 'alwehdah',   5, 'مدافع', 1, 3),
  ('saeed-mohammed',  'سعيد محمد',   'alwehdah',   1, 'حارس',  0, 3),
  -- الأخدود
  ('nawaf-mohammed',  'نواف محمد',   'alokhdood', 10, 'مهاجم', 2, 3),
  ('fahd-sultan',     'فهد سلطان',   'alokhdood',  7, 'وسط',   1, 3),
  ('yasser-naser',    'ياسر ناصر',   'alokhdood',  4, 'مدافع', 0, 3),
  ('majed-ali',       'ماجد علي',    'alokhdood',  1, 'حارس',  0, 3),
  -- النصر
  ('omar-abdullah',   'عمر عبدالله', 'alnasr',     9, 'مهاجم', 4, 3),
  ('zakaria-youssef', 'زكريا يوسف',  'alnasr',     7, 'وسط',   3, 3),
  ('tamer-hassan',    'تامر حسن',    'alnasr',     5, 'مدافع', 2, 3),
  ('mohammed-ali',    'محمد علي',    'alnasr',     1, 'حارس',  0, 3),
  -- الاتحاد
  ('abdullah-saad',   'عبدالله سعد', 'alittihad', 10, 'مهاجم', 3, 3),
  ('yousef-nour',     'يوسف نور',    'alittihad',  8, 'وسط',   1, 3),
  ('hasan-fahd',      'حسن فهد',     'alittihad',  4, 'مدافع', 1, 3),
  ('ali-mohammed',    'علي محمد',    'alittihad',  1, 'حارس',  0, 3),
  -- الشباب
  ('nawaf-isa',       'نواف عيسى',   'alshabab',  11, 'مهاجم', 2, 3),
  ('saad-ali',        'سعد علي',     'alshabab',   6, 'وسط',   0, 3),
  ('mohammed-omar',   'محمد عمر',    'alshabab',   3, 'مدافع', 0, 3),
  ('fahd-ahmed',      'فهد أحمد',    'alshabab',   1, 'حارس',  0, 3),
  -- الفتح
  ('ahmed-saeed',     'أحمد سعيد',   'alfateh',    9, 'مهاجم', 1, 3),
  ('khaled-fahd',     'خالد فهد',    'alfateh',    7, 'وسط',   0, 3),
  ('abdulrahman-nour','عبدالرحمن نور','alfateh',   5, 'مدافع', 0, 3),
  ('saeed-ali',       'سعيد علي',    'alfateh',    1, 'حارس',  0, 3),
  -- التعاون
  ('faisal-mohammed', 'فيصل محمد',   'altaawoun', 10, 'مهاجم', 2, 3),
  ('omar-saad',       'عمر سعد',     'altaawoun',  8, 'وسط',   2, 3),
  ('nour-hassan',     'نور حسن',     'altaawoun',  4, 'مدافع', 1, 3),
  ('mishaal-hasan',   'مشعل حسن',    'altaawoun',  1, 'حارس',  0, 3),
  -- الطائي
  ('saad-fahd',       'سعد فهد',     'altai',     11, 'مهاجم', 2, 3),
  ('rakan-ali',       'راكان علي',   'altai',      7, 'وسط',   1, 3),
  ('mohammed-ahmed',  'محمد أحمد',   'altai',      5, 'مدافع', 1, 3),
  ('abdullah-omar',   'عبدالله عمر', 'altai',      1, 'حارس',  0, 3),
  -- الخليج
  ('hasan-ahmed',     'حسن أحمد',    'alkhaleej', 10, 'مهاجم', 1, 3),
  ('fahd-abdullah',   'فهد عبدالله', 'alkhaleej',  8, 'وسط',   1, 3),
  ('mohammed-isa',    'محمد عيسى',   'alkhaleej',  4, 'مدافع', 0, 3),
  ('khaled-saeed',    'خالد سعيد',   'alkhaleej',  1, 'حارس',  0, 3),
  -- الرياض
  ('abdulaziz-nour',  'عبدالعزيز نور','alriyadh',  9, 'مهاجم', 0, 3),
  ('majed-saad',      'ماجد سعد',    'alriyadh',   6, 'وسط',   0, 3),
  ('faisal-hasan',    'فيصل حسن',    'alriyadh',   3, 'مدافع', 0, 3),
  ('nasser-ali',      'ناصر علي',    'alriyadh',   1, 'حارس',  0, 3);

-- 4. Settings
INSERT INTO settings (id, season, "groups", "teamsPerGroup")
VALUES (1, '2026', '["A","B","C","D"]', 4)
ON CONFLICT (id) DO NOTHING;

-- 5. Active season
INSERT INTO seasons (name, slug, is_active, started_at)
VALUES ('2026', '2026', true, '2026-02-15T00:00:00Z')
ON CONFLICT (slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- GROUP STAGE — all played (MD1, MD2, MD3)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO matches (slug, title, date, "group", venue, status, "homeTeam", "awayTeam", "homeScore", "awayScore", "goalScorers") VALUES

-- ── GROUP A ──
-- MD1
('ga-alnour-vs-aytam',    'النور vs الأيتام',    '2026-02-15T14:00:00Z', 'A', 'الملعب الرئيسي', 'played', 'alnour', 'aytam',    2, 1, '[{"player":"ahmed-hassan","team":"alnour","minute":23},{"player":"yasser-ali","team":"alnour","minute":67},{"player":"faris-nour","team":"aytam","minute":45}]'),
('ga-alqadsia-vs-alhilal', 'القادسية vs الهلال',  '2026-02-16T14:00:00Z', 'A', 'الملعب الرئيسي', 'played', 'alqadsia', 'alhilal', 1, 0, '[{"player":"badr-shamari","team":"alqadsia","minute":59}]'),
-- MD2
('ga-alnour-vs-alqadsia', 'النور vs القادسية',   '2026-02-22T14:00:00Z', 'A', 'الملعب الرئيسي', 'played', 'alnour', 'alqadsia', 1, 1, '[{"player":"khaled-omar","team":"alnour","minute":55},{"player":"abdullah-mohammed","team":"alqadsia","minute":72}]'),
('ga-aytam-vs-alhilal',   'الأيتام vs الهلال',   '2026-02-23T14:00:00Z', 'A', 'الملعب الرئيسي', 'played', 'aytam', 'alhilal',  2, 2, '[{"player":"hadi-mahmoud","team":"aytam","minute":12},{"player":"sami-ibrahim","team":"aytam","minute":88},{"player":"hasan-ali","team":"alhilal","minute":41},{"player":"mohammed-saad","team":"alhilal","minute":63}]'),
-- MD3
('ga-alnour-vs-alhilal',  'النور vs الهلال',     '2026-03-01T14:00:00Z', 'A', 'الملعب الرئيسي', 'played', 'alnour', 'alhilal',  3, 0, '[{"player":"ahmed-hassan","team":"alnour","minute":17},{"player":"khaled-omar","team":"alnour","minute":34},{"player":"ahmed-hassan","team":"alnour","minute":71}]'),
('ga-aytam-vs-alqadsia',  'الأيتام vs القادسية', '2026-03-02T14:00:00Z', 'A', 'الملعب الرئيسي', 'played', 'aytam', 'alqadsia', 0, 2, '[{"player":"badr-shamari","team":"alqadsia","minute":31},{"player":"faisal-ahmed","team":"alqadsia","minute":78}]'),

-- ── GROUP B ──
-- MD1
('gb-alahli-vs-alraed',    'الأهلي vs الرائد',    '2026-02-15T16:00:00Z', 'B', 'الملعب الرئيسي', 'played', 'alahli', 'alraed',    2, 0, '[{"player":"ali-nour","team":"alahli","minute":28},{"player":"fahd-saeed","team":"alahli","minute":64}]'),
('gb-alwehdah-vs-alokhdood','الوحدة vs الأخدود',  '2026-02-16T16:00:00Z', 'B', 'الملعب الرئيسي', 'played', 'alwehdah', 'alokhdood', 3, 2, '[{"player":"mohammed-nour","team":"alwehdah","minute":9},{"player":"khaled-raed","team":"alwehdah","minute":48},{"player":"abdullah-fahd","team":"alwehdah","minute":90},{"player":"nawaf-mohammed","team":"alokhdood","minute":22},{"player":"fahd-sultan","team":"alokhdood","minute":39}]'),
-- MD2
('gb-alahli-vs-alwehdah',  'الأهلي vs الوحدة',    '2026-02-22T16:00:00Z', 'B', 'الملعب الرئيسي', 'played', 'alahli', 'alwehdah',  3, 1, '[{"player":"ali-nour","team":"alahli","minute":15},{"player":"fahd-saeed","team":"alahli","minute":42},{"player":"naser-mohammed","team":"alahli","minute":76},{"player":"khaled-raed","team":"alwehdah","minute":89}]'),
('gb-alraed-vs-alokhdood', 'الرائد vs الأخدود',  '2026-02-23T16:00:00Z', 'B', 'الملعب الرئيسي', 'played', 'alraed', 'alokhdood', 2, 0, '[{"player":"majed-fahd","team":"alraed","minute":33},{"player":"sultan-isa","team":"alraed","minute":51}]'),
-- MD3
('gb-alahli-vs-alokhdood', 'الأهلي vs الأخدود',   '2026-03-01T16:00:00Z', 'B', 'الملعب الرئيسي', 'played', 'alahli', 'alokhdood', 1, 1, '[{"player":"ali-nour","team":"alahli","minute":44},{"player":"nawaf-mohammed","team":"alokhdood","minute":77}]'),
('gb-alraed-vs-alwehdah',  'الرائد vs الوحدة',    '2026-03-02T16:00:00Z', 'B', 'الملعب الرئيسي', 'played', 'alraed', 'alwehdah',  0, 1, '[{"player":"mohammed-nour","team":"alwehdah","minute":83}]'),

-- ── GROUP C ──
-- MD1
('gc-alnasr-vs-alittihad',  'النصر vs الاتحاد',  '2026-02-15T18:00:00Z', 'C', 'الملعب الرئيسي', 'played', 'alnasr', 'alittihad',  2, 2, '[{"player":"omar-abdullah","team":"alnasr","minute":19},{"player":"zakaria-youssef","team":"alnasr","minute":56},{"player":"abdullah-saad","team":"alittihad","minute":38},{"player":"yousef-nour","team":"alittihad","minute":73}]'),
('gc-alshabab-vs-alfateh',  'الشباب vs الفتح',   '2026-02-16T18:00:00Z', 'C', 'الملعب الرئيسي', 'played', 'alshabab', 'alfateh',  1, 1, '[{"player":"nawaf-isa","team":"alshabab","minute":44},{"player":"ahmed-saeed","team":"alfateh","minute":90}]'),
-- MD2
('gc-alnasr-vs-alshabab',   'النصر vs الشباب',   '2026-02-22T18:00:00Z', 'C', 'الملعب الرئيسي', 'played', 'alnasr', 'alshabab',  3, 1, '[{"player":"omar-abdullah","team":"alnasr","minute":11},{"player":"tamer-hassan","team":"alnasr","minute":47},{"player":"zakaria-youssef","team":"alnasr","minute":80},{"player":"nawaf-isa","team":"alshabab","minute":62}]'),
('gc-alittihad-vs-alfateh', 'الاتحاد vs الفتح',   '2026-02-23T18:00:00Z', 'C', 'الملعب الرئيسي', 'played', 'alittihad', 'alfateh',  2, 0, '[{"player":"abdullah-saad","team":"alittihad","minute":25},{"player":"hasan-fahd","team":"alittihad","minute":54}]'),
-- MD3
('gc-alnasr-vs-alfateh',    'النصر vs الفتح',    '2026-03-01T18:00:00Z', 'C', 'الملعب الرئيسي', 'played', 'alnasr', 'alfateh',   4, 0, '[{"player":"omar-abdullah","team":"alnasr","minute":5},{"player":"zakaria-youssef","team":"alnasr","minute":30},{"player":"omar-abdullah","team":"alnasr","minute":58},{"player":"tamer-hassan","team":"alnasr","minute":85}]'),
('gc-alittihad-vs-alshabab','الاتحاد vs الشباب', '2026-03-02T18:00:00Z', 'C', 'الملعب الرئيسي', 'played', 'alittihad', 'alshabab', 1, 0, '[{"player":"abdullah-saad","team":"alittihad","minute":66}]'),

-- ── GROUP D ──
-- MD1 (Feb 15–16)
('gd-altaawoun-vs-altai',    'التعاون vs الطائي',    '2026-02-15T20:00:00Z', 'D', 'الملعب الرئيسي', 'played', 'altaawoun', 'altai',     2, 1, '[{"player":"faisal-mohammed","team":"altaawoun","minute":37},{"player":"omar-saad","team":"altaawoun","minute":68},{"player":"saad-fahd","team":"altai","minute":82}]'),
('gd-altai-vs-alkhaleej',    'الطائي vs الخليج',     '2026-02-16T20:00:00Z', 'D', 'الملعب الرئيسي', 'played', 'altai', 'alkhaleej',    1, 1, '[{"player":"rakan-ali","team":"altai","minute":14},{"player":"hasan-ahmed","team":"alkhaleej","minute":61}]'),
-- MD2 (Feb 22–23)
('gd-altaawoun-vs-alkhaleej','التعاون vs الخليج',    '2026-02-22T20:00:00Z', 'D', 'الملعب الرئيسي', 'played', 'altaawoun', 'alkhaleej', 3, 0, '[{"player":"faisal-mohammed","team":"altaawoun","minute":26},{"player":"nour-hassan","team":"altaawoun","minute":49},{"player":"omar-saad","team":"altaawoun","minute":74}]'),
('gd-altai-vs-alriyadh',     'الطائي vs الرياض',     '2026-02-23T20:00:00Z', 'D', 'الملعب الرئيسي', 'played', 'altai', 'alriyadh',     2, 0, '[{"player":"saad-fahd","team":"altai","minute":33},{"player":"mohammed-ahmed","team":"altai","minute":77}]'),
-- MD3 (Mar 1–2)
('gd-altaawoun-vs-alriyadh', 'التعاون vs الرياض',    '2026-03-01T20:00:00Z', 'D', 'الملعب الرئيسي', 'played', 'altaawoun', 'alriyadh',  0, 0, '[]'),
('gd-alkhaleej-vs-alriyadh', 'الخليج vs الرياض',     '2026-03-02T20:00:00Z', 'D', 'الملعب الرئيسي', 'played', 'alkhaleej', 'alriyadh', 1, 0, '[{"player":"fahd-abdullah","team":"alkhaleej","minute":53}]');

-- ═══════════════════════════════════════════════════════════════
-- QUARTER FINALS — upcoming (next week: June 1–4, 2026)
-- ═══════════════════════════════════════════════════════════════
-- Pairings: 1A vs 2B · 1B vs 2A · 1C vs 2D · 1D vs 2C
-- 1A=alnour, 2B=alwehdah, 1B=alahli, 2A=alqadsia
-- 1C=alnasr, 2D=altai, 1D=altaawoun, 2C=alittihad

INSERT INTO matches (slug, title, date, "group", venue, status, "homeTeam", "awayTeam") VALUES
('qf-alnour-vs-alwehdah',  'النور vs الوحدة',  '2026-06-01T18:00:00Z', 'QF', 'الملعب الرئيسي', 'upcoming', 'alnour', 'alwehdah'),
('qf-alahli-vs-alqadsia',  'الأهلي vs القادسية','2026-06-02T18:00:00Z', 'QF', 'الملعب الرئيسي', 'upcoming', 'alahli', 'alqadsia'),
('qf-alnasr-vs-altai',     'النصر vs الطائي',  '2026-06-03T18:00:00Z', 'QF', 'الملعب الرئيسي', 'upcoming', 'alnasr', 'altai'),
('qf-altaawoun-vs-alittihad','التعاون vs الاتحاد','2026-06-04T18:00:00Z','QF', 'الملعب الرئيسي', 'upcoming', 'altaawoun', 'alittihad');
