// Stats database for MBTA Turf Wars (server-side only).
// SQLite file lives at db/t_games.db and is created from db/schema.sql on first use.
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

export const GAMES = ["Game 1", "Game 2", "Game 3"]; // rename to your real game names

const DB_DIR = path.join(process.cwd(), "db");
const DB_PATH = process.env.STATS_DB_PATH ?? path.join(DB_DIR, "t_games.db");

let _db: Database.Database | null = null;

export function getDb() {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma("foreign_keys = ON");
  _db.exec(fs.readFileSync(path.join(DB_DIR, "schema.sql"), "utf8"));
  const addGame = _db.prepare("INSERT OR IGNORE INTO games(name) VALUES (?)");
  for (const g of GAMES) addGame.run(g);
  return _db;
}

// ---------- helpers ----------

function userId(username: string): number {
  const db = getDb();
  db.prepare("INSERT OR IGNORE INTO users(username) VALUES (?)").run(username);
  return (db.prepare("SELECT user_id FROM users WHERE username = ?").get(username) as { user_id: number }).user_id;
}

function gameId(game: string): number {
  const row = getDb().prepare("SELECT game_id FROM games WHERE name = ?").get(game) as { game_id: number } | undefined;
  if (!row) throw new Error(`Unknown game: ${game}`);
  return row.game_id;
}

// ---------- writing data (what the games call) ----------

/** Call when a game starts. Returns playId; the DB stamps started_at itself. */
export function startGame(username: string, game: string): number {
  const res = getDb()
    .prepare("INSERT INTO scores(user_id, game_id) VALUES (?, ?)")
    .run(userId(username), gameId(game));
  return Number(res.lastInsertRowid);
}

/** Call when a game ends. The DB stamps ended_at itself. */
export function endGame(playId: number, score: number) {
  getDb()
    .prepare(
      `UPDATE scores SET score = ?, ended_at = strftime('%Y-%m-%d %H:%M:%f','now')
       WHERE score_id = ? AND ended_at IS NULL`
    )
    .run(score, playId);
  return playStats(playId);
}

// ---------- stats ----------

/** Everything to show on the "game over" screen for one play. */
export function playStats(playId: number) {
  return getDb()
    .prepare(
      `WITH me AS (
         SELECT p.*, b.best_score FROM finished_plays p
         JOIN best_scores b ON b.user_id = p.user_id AND b.game_id = p.game_id
         WHERE p.score_id = ?
       )
       SELECT me.score, me.best_score, me.duration_sec,
         -- better than X% of players (best vs best, ties half)
         ROUND(100.0 * (
           (SELECT COUNT(*) FROM best_scores o WHERE o.game_id = me.game_id AND o.best_score < me.best_score)
           + 0.5 * ((SELECT COUNT(*) FROM best_scores o WHERE o.game_id = me.game_id AND o.best_score = me.best_score) - 1)
         ) / MAX((SELECT COUNT(*) FROM best_scores o WHERE o.game_id = me.game_id) - 1, 1), 1) AS better_than_pct,
         -- this round was quicker than X% of rounds
         ROUND(100.0 * (SELECT COUNT(*) FROM finished_plays o WHERE o.game_id = me.game_id AND o.duration_sec > me.duration_sec)
           / MAX((SELECT COUNT(*) FROM finished_plays o WHERE o.game_id = me.game_id) - 1, 1), 1) AS quicker_than_pct,
         (SELECT COUNT(*) FROM best_scores o WHERE o.game_id = me.game_id) AS players
       FROM me`
    )
    .get(playId);
}

export function gameLeaderboard(game: string, limit = 10) {
  return getDb()
    .prepare(
      `SELECT u.username, b.best_score, RANK() OVER (ORDER BY b.best_score DESC) AS rank
       FROM best_scores b JOIN users u USING(user_id)
       WHERE b.game_id = ? ORDER BY rank LIMIT ?`
    )
    .all(gameId(game), limit);
}

/** Average percentile across games (raw scores have different scales). */
export function overallLeaderboard(limit = 10, minGames = 2) {
  return getDb()
    .prepare(
      `WITH ranked AS (
         SELECT user_id, game_id,
                PERCENT_RANK() OVER (PARTITION BY game_id ORDER BY best_score) * 100 AS pct
         FROM best_scores
       )
       SELECT u.username, ROUND(AVG(pct), 1) AS t_score, COUNT(*) AS games_played
       FROM ranked JOIN users u USING(user_id)
       GROUP BY u.user_id HAVING COUNT(*) >= ?
       ORDER BY t_score DESC LIMIT ?`
    )
    .all(minGames, limit);
}

export function gameTimeSummary() {
  return getDb()
    .prepare(
      `SELECT g.name AS game, COUNT(*) AS started, SUM(s.ended_at IS NOT NULL) AS finished,
              ROUND(100.0 * SUM(s.ended_at IS NULL) / COUNT(*), 1) AS quit_pct,
              ROUND(AVG((julianday(s.ended_at) - julianday(s.started_at)) * 86400), 1) AS avg_round_sec
       FROM scores s JOIN games g USING(game_id) GROUP BY g.game_id`
    )
    .all();
}
