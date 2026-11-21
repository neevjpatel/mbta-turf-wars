-- Stats queries for Gamifying the T. Run against t_games.db (built from schema.sql).
-- Try them in a SQLite viewer (e.g. VS Code "SQLite" extension, DB Browser for SQLite)
-- or the terminal:  sqlite3 t_games.db < queries.sql

-- 1. Leaderboard for ONE game (change game_id)
SELECT u.username, b.best_score,
       RANK() OVER (ORDER BY b.best_score DESC) AS rank
FROM best_scores b JOIN users u USING(user_id)
WHERE b.game_id = 1
ORDER BY rank
LIMIT 10;

-- 2. Leaderboards for ALL games at once (top 3 per game)
SELECT * FROM (
    SELECT g.name AS game, u.username, b.best_score,
           RANK() OVER (PARTITION BY b.game_id ORDER BY b.best_score DESC) AS rank
    FROM best_scores b JOIN users u USING(user_id) JOIN games g USING(game_id)
)
WHERE rank <= 3
ORDER BY game, rank;

-- 3. Combined leaderboard: average percentile across games (2+ games played)
WITH ranked AS (
    SELECT user_id, game_id,
           PERCENT_RANK() OVER (PARTITION BY game_id ORDER BY best_score) * 100 AS pct
    FROM best_scores
)
SELECT u.username, ROUND(AVG(pct), 1) AS t_score, COUNT(*) AS games_played
FROM ranked JOIN users u USING(user_id)
GROUP BY u.user_id
HAVING COUNT(*) >= 2
ORDER BY t_score DESC
LIMIT 10;

-- 4. "You scored better than X%": every player's percentile in every game
SELECT g.name AS game, u.username, b.best_score,
       ROUND(PERCENT_RANK() OVER (PARTITION BY b.game_id ORDER BY b.best_score) * 100, 1) AS better_than_pct
FROM best_scores b JOIN users u USING(user_id) JOIN games g USING(game_id)
ORDER BY game, better_than_pct DESC;

-- 5. Time stats per game: plays started, quit rate, average round length
SELECT g.name AS game,
       COUNT(*)                                                   AS started,
       SUM(s.ended_at IS NOT NULL)                                AS finished,
       ROUND(100.0 * SUM(s.ended_at IS NULL) / COUNT(*), 1)       AS quit_pct,
       ROUND(AVG((julianday(s.ended_at) - julianday(s.started_at)) * 86400), 1) AS avg_round_sec
FROM scores s JOIN games g USING(game_id)
GROUP BY g.game_id;

-- 6. "Your round was quicker than X% of rounds": percentile of every finished play by duration
SELECT g.name AS game, u.username, p.duration_sec,
       ROUND((1 - PERCENT_RANK() OVER (PARTITION BY p.game_id ORDER BY p.duration_sec)) * 100, 1) AS quicker_than_pct
FROM finished_plays p JOIN users u USING(user_id) JOIN games g USING(game_id)
ORDER BY game, quicker_than_pct DESC
LIMIT 20;

-- 7. Total time each user has played, across all games
SELECT u.username, COUNT(*) AS plays, ROUND(SUM(p.duration_sec) / 60, 1) AS minutes_played
FROM finished_plays p JOIN users u USING(user_id)
GROUP BY u.user_id
ORDER BY minutes_played DESC
LIMIT 10;
