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

-- ===================== Per-player and school statistics =====================
-- Leaderboards rank by TOTAL points per game (gross points earned): T Guesser, Stople and Turf Wars
-- award fixed points per round, so ranking by best score makes nearly everyone tie.
-- Change the username in the WHERE clauses to look at another player.

-- 8. One game's leaderboard by total points (change the game name)
SELECT u.username, u.school, t.total_points, t.best_score, t.plays,
       RANK() OVER (ORDER BY t.total_points DESC) AS rank
FROM player_game_totals t JOIN users u USING(user_id) JOIN games g USING(game_id)
WHERE g.name = 'charlie-run'
ORDER BY rank, u.username
LIMIT 10;

-- 9. One player's stats in every game: plays, total, best, rank, "ahead of X% of players"
WITH ranked AS (
    SELECT user_id, game_id, plays, total_points, best_score,
           RANK() OVER (PARTITION BY game_id ORDER BY total_points DESC)          AS rank,
           ROUND(PERCENT_RANK() OVER (PARTITION BY game_id ORDER BY total_points) * 100, 1) AS better_than_pct,
           COUNT(*) OVER (PARTITION BY game_id)                                  AS players
    FROM player_game_totals
)
SELECT g.name AS game, COALESCE(r.plays, 0) AS plays, COALESCE(r.total_points, 0) AS total_points,
       r.best_score, r.rank, r.players, r.better_than_pct
FROM games g
LEFT JOIN ranked r ON r.game_id = g.game_id
                  AND r.user_id = (SELECT user_id FROM users WHERE username = 'rider007')
ORDER BY g.game_id;

-- 10. One player's totals across all games
SELECT u.username, u.school, COUNT(p.score_id) AS plays,
       COALESCE(SUM(p.score), 0) AS total_points,
       COALESCE(SUM(CASE WHEN p.school IS NOT NULL THEN p.score END), 0) AS points_for_school,
       ROUND(COALESCE(SUM(p.duration_sec), 0) / 60, 1) AS minutes_played
FROM users u LEFT JOIN finished_plays p USING(user_id)
WHERE u.username = 'rider007'
GROUP BY u.user_id;

-- 11. School leaderboard: Turf Wars points by school (only school-email players' Turf Wars plays carry a school)
WITH s(school) AS (VALUES ('BU'), ('MIT'), ('Harvard'), ('Northeastern'), ('BC'))
SELECT s.school,
       COALESCE(SUM(p.score), 0)  AS points,
       COUNT(p.score_id)          AS captures,
       COUNT(DISTINCT p.user_id)  AS players,
       RANK() OVER (ORDER BY COALESCE(SUM(p.score), 0) DESC) AS rank
FROM s LEFT JOIN finished_plays p ON p.school = s.school
GROUP BY s.school
ORDER BY rank, s.school;

-- 12. Each school's top contributors
SELECT * FROM (
    SELECT p.school, u.username, SUM(p.score) AS points_for_school,
           RANK() OVER (PARTITION BY p.school ORDER BY SUM(p.score) DESC) AS rank
    FROM finished_plays p JOIN users u USING(user_id)
    WHERE p.school IS NOT NULL
    GROUP BY p.school, p.user_id
)
WHERE rank <= 3
ORDER BY school, rank;

-- 13. Combined leaderboard on totals: average per-game percentile, plus gross points (2+ games played)
WITH ranked AS (
    SELECT user_id, game_id, total_points,
           PERCENT_RANK() OVER (PARTITION BY game_id ORDER BY total_points) * 100 AS pct
    FROM player_game_totals
)
SELECT u.username, u.school, ROUND(AVG(pct), 1) AS t_score,
       SUM(total_points) AS total_points, COUNT(*) AS games_played
FROM ranked JOIN users u USING(user_id)
GROUP BY u.user_id
HAVING COUNT(*) >= 2
ORDER BY t_score DESC, total_points DESC
LIMIT 10;

-- 14. Stats by difficulty: does the menu difficulty change how players score?
SELECT g.name AS game, p.difficulty, COUNT(*) AS plays,
       ROUND(AVG(p.score), 1) AS avg_score, ROUND(AVG(p.duration_sec), 1) AS avg_round_sec
FROM finished_plays p JOIN games g USING(game_id)
GROUP BY g.game_id, p.difficulty
ORDER BY g.game_id, CASE p.difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 WHEN 'hard' THEN 3 ELSE 4 END;
