-- Fix settings so each league has its own row
ALTER TABLE settings DROP CONSTRAINT settings_pkey CASCADE;
ALTER TABLE settings ADD PRIMARY KEY (league_id);
