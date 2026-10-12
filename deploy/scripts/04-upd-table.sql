DO $$ BEGIN
  CREATE TYPE game_mode_enum AS ENUM ('versus', 'solo');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE games ADD COLUMN IF NOT EXISTS mode game_mode_enum NOT NULL DEFAULT 'versus';

ALTER TABLE games DROP CONSTRAINT IF EXISTS chk_games_winner;
ALTER TABLE games ADD CONSTRAINT chk_games_winner
  CHECK (mode = 'solo' OR ((status = 'finished') = (winner IS NOT NULL)));

ALTER TABLE games DROP CONSTRAINT IF EXISTS chk_games_solo;
ALTER TABLE games ADD CONSTRAINT chk_games_solo
  CHECK (mode = 'versus' OR (rival_id IS NULL AND status <> 'created' AND winner IS NULL));
