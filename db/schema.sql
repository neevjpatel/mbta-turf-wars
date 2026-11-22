-- MBTA Turf Wars: stats database (SQLite; also runs on Postgres with minor tweaks)
-- Sign-in accounts live separately in db/auth.db (managed by Better Auth); users.auth_user_id links the two.

CREATE TABLE IF NOT EXISTS users (
    user_id      INTEGER PRIMARY KEY,
    username     TEXT NOT NULL UNIQUE COLLATE NOCASE,
    email        TEXT UNIQUE,              -- from Google sign-in; NULL for fake seed riders
    auth_user_id TEXT UNIQUE,              -- Better Auth user id; NULL for fake seed riders
    school       TEXT,                     -- BU / MIT / Harvard / Northeastern / BC from a verified school email, else NULL
    created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS games (
    game_id     INTEGER PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE       -- game id from app/_data/game-model.mjs, e.g. 'turf-wars'
);

-- One row per play. Every game goes in this table; game_id says which one.
-- Row is created when the game STARTS (score/ended_at empty) and filled in when it ENDS.
-- Times come from the database clock, so the game itself never needs a timer.
CREATE TABLE IF NOT EXISTS scores (
    score_id    INTEGER PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(user_id),
    game_id     INTEGER NOT NULL REFERENCES games(game_id),
    score       REAL,                       -- NULL until the game ends
    started_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    ended_at    TEXT,                       -- NULL = still playing or quit early
    difficulty  TEXT,                       -- menu difficulty: easy / medium / hard / extreme
    school      TEXT,                       -- school credited with this play: only Turf Wars plays by school-email players
    details     TEXT                        -- JSON with game-specific data (station, coins, distance_km, guesses, delayed, ...)
);

CREATE INDEX IF NOT EXISTS idx_scores_game_score ON scores(game_id, score);
CREATE INDEX IF NOT EXISTS idx_scores_user ON scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_school ON scores(school);

-- Finished plays only, with duration in seconds computed from the two timestamps
CREATE VIEW IF NOT EXISTS finished_plays AS
SELECT score_id, user_id, game_id, score, started_at, ended_at, difficulty, school, details,
       ROUND((julianday(ended_at) - julianday(started_at)) * 86400, 2) AS duration_sec
FROM scores
WHERE ended_at IS NOT NULL AND score IS NOT NULL;

-- Each user's best score in each game
CREATE VIEW IF NOT EXISTS best_scores AS
SELECT user_id, game_id, MAX(score) AS best_score
FROM finished_plays
GROUP BY user_id, game_id;

-- Each user's totals in each game. Leaderboards rank by total_points (gross points earned),
-- because three of the four games award fixed points per round, so almost everyone ties on best_score.
CREATE VIEW IF NOT EXISTS player_game_totals AS
SELECT user_id, game_id, COUNT(*) AS plays, SUM(score) AS total_points, MAX(score) AS best_score
FROM finished_plays
GROUP BY user_id, game_id;
