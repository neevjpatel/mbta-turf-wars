// Stats database for MBTA Turf Wars (server-side only).
// SQLite file lives at db/t_games.db and is created from db/schema.sql on first use.
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

import { GAMES, type GameName } from "./games";
import { SCHOOL_GAMES, SCHOOLS, schoolForEmail, type School } from "./schools";

export { GAMES };

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

export type PlayerRow = { user_id: number; username: string; email: string | null; school: School | null };

function gameId(game: string): number {
  const row = getDb().prepare("SELECT game_id FROM games WHERE name = ?").get(game) as { game_id: number } | undefined;
  if (!row) throw new Error(`Unknown game: ${game}`);
  return row.game_id;
}

export function isGame(game: unknown): game is GameName {
  return typeof game === "string" && (GAMES as readonly string[]).includes(game);
}

// ---------- players ----------

export function findPlayerByAuthId(authUserId: string): PlayerRow | undefined {
  return getDb()
    .prepare("SELECT user_id, username, email, school FROM users WHERE auth_user_id = ?")
    .get(authUserId) as PlayerRow | undefined;
}

export const USERNAME_RULE = /^[A-Za-z0-9_.-]{3,20}$/;

/** First sign-in: create the stats player. School comes only from a verified school email. */
export function createPlayer(authUserId: string, email: string, emailVerified: boolean, username: string) {
  if (!USERNAME_RULE.test(username)) return { error: "Username must be 3–20 letters, numbers, _ . or -" } as const;
  const school = emailVerified ? schoolForEmail(email) : null;
  try {
    getDb()
      .prepare("INSERT INTO users(username, email, auth_user_id, school) VALUES (?, ?, ?, ?)")
      .run(username, email.toLowerCase(), authUserId, school);
  } catch (e) {
    if (String(e).includes("users.username")) return { error: "That username is taken" } as const;
    if (String(e).includes("UNIQUE")) return { error: "This account already has a username" } as const;
    throw e;
  }
  return { player: findPlayerByAuthId(authUserId)! } as const;
}

// ---------- writing data (what the games call, through /api/start and /api/end) ----------

/** Call when a game starts. Returns playId; the DB stamps started_at itself. */
export function startGame(player: PlayerRow, game: GameName, difficulty: string | null): number {
  // Only Turf Wars counts for a school, and only for players with a school email.
  const school = (SCHOOL_GAMES as readonly string[]).includes(game) ? player.school : null;
  const res = getDb()
    .prepare("INSERT INTO scores(user_id, game_id, difficulty, school) VALUES (?, ?, ?, ?)")
    .run(player.user_id, gameId(game), difficulty, school);
  return Number(res.lastInsertRowid);
}

/** Call when a game ends. Only the player who started the play can end it, and only once. */
export function endGame(player: PlayerRow, playId: number, score: number, details: string | null) {
  const res = getDb()
    .prepare(
      `UPDATE scores SET score = ?, details = ?, ended_at = strftime('%Y-%m-%d %H:%M:%f','now')
       WHERE score_id = ? AND user_id = ? AND ended_at IS NULL`
    )
    .run(score, details, playId, player.user_id);
  const owns = getDb().prepare("SELECT 1 FROM scores WHERE score_id = ? AND user_id = ?").get(playId, player.user_id);
  if (!owns) return undefined;
  return { ...playStats(playId), already_recorded: res.changes === 0 };
}

// ---------- stats ----------

/** Everything to show right after one play ("game over" toast). */
export function playStats(playId: number) {
  return getDb()
    .prepare(
      `WITH me AS (
         SELECT user_id, game_id, score, duration_sec FROM finished_plays WHERE score_id = ?
       ),
       ranked AS (
         SELECT user_id, total_points, best_score,
                RANK() OVER (ORDER BY total_points DESC)          AS rank,
                PERCENT_RANK() OVER (ORDER BY total_points) * 100 AS pct,
                COUNT(*) OVER ()                                  AS players
         FROM player_game_totals WHERE game_id = (SELECT game_id FROM me)
       )
       SELECT me.score, me.duration_sec, r.total_points, r.best_score, r.rank, r.players,
              -- this player has more points in this game than X% of the other players
              ROUND(r.pct, 1) AS better_than_pct,
              -- this round was quicker than X% of rounds
              ROUND(100.0 * (SELECT COUNT(*) FROM finished_plays o WHERE o.game_id = me.game_id AND o.duration_sec > me.duration_sec)
                / MAX((SELECT COUNT(*) FROM finished_plays o WHERE o.game_id = me.game_id) - 1, 1), 1) AS quicker_than_pct
       FROM me JOIN ranked r ON r.user_id = me.user_id`
    )
    .get(playId) as
    | { score: number; duration_sec: number; total_points: number; best_score: number; rank: number; players: number; better_than_pct: number; quicker_than_pct: number }
    | undefined;
}

/** One game's top players by total points earned in that game. */
export function gameLeaderboard(game: string, limit = 10) {
  return getDb()
    .prepare(
      `SELECT u.username, u.school, t.total_points, t.best_score, t.plays,
              RANK() OVER (ORDER BY t.total_points DESC) AS rank
       FROM player_game_totals t JOIN users u USING(user_id)
       WHERE t.game_id = ? ORDER BY rank, u.username LIMIT ?`
    )
    .all(gameId(game), limit);
}

/** Combined leaderboard: average percentile across games (raw scores have different scales). */
export function overallLeaderboard(limit = 10, minGames = 2) {
  return getDb()
    .prepare(
      `WITH ranked AS (
         SELECT user_id, game_id, total_points,
                PERCENT_RANK() OVER (PARTITION BY game_id ORDER BY total_points) * 100 AS pct
         FROM player_game_totals
       )
       SELECT u.username, u.school, ROUND(AVG(pct), 1) AS t_score,
              SUM(total_points) AS total_points, COUNT(*) AS games_played
       FROM ranked JOIN users u USING(user_id)
       GROUP BY u.user_id HAVING COUNT(*) >= ?
       ORDER BY t_score DESC, total_points DESC LIMIT ?`
    )
    .all(minGames, limit);
}

/** School leaderboard: Turf Wars points earned by each school's players. Every school is listed, even at 0. */
export function schoolLeaderboard() {
  const values = SCHOOLS.map(() => "(?)").join(", ");
  return getDb()
    .prepare(
      `WITH s(school) AS (VALUES ${values})
       SELECT s.school,
              COALESCE(SUM(p.score), 0)   AS points,
              COUNT(p.score_id)           AS captures,
              COUNT(DISTINCT p.user_id)   AS players,
              RANK() OVER (ORDER BY COALESCE(SUM(p.score), 0) DESC) AS rank
       FROM s LEFT JOIN finished_plays p ON p.school = s.school
       GROUP BY s.school
       ORDER BY rank, s.school`
    )
    .all(...SCHOOLS) as { school: School; points: number; captures: number; players: number; rank: number }[];
}

/** A player's own statistics: one row per game, plus totals. */
export function playerProfile(player: PlayerRow) {
  const db = getDb();
  const games = db
    .prepare(
      `WITH ranked AS (
         SELECT user_id, game_id, plays, total_points, best_score,
                RANK() OVER (PARTITION BY game_id ORDER BY total_points DESC)          AS rank,
                PERCENT_RANK() OVER (PARTITION BY game_id ORDER BY total_points) * 100 AS pct,
                COUNT(*) OVER (PARTITION BY game_id)                                  AS players
         FROM player_game_totals
       )
       SELECT g.name AS game,
              COALESCE(r.plays, 0)        AS plays,
              COALESCE(r.total_points, 0) AS total_points,
              r.best_score, r.rank, r.players,
              ROUND(r.pct, 1)             AS better_than_pct,
              (SELECT ROUND(AVG(f.duration_sec), 1) FROM finished_plays f
                WHERE f.user_id = ? AND f.game_id = g.game_id) AS avg_round_sec
       FROM games g LEFT JOIN ranked r ON r.game_id = g.game_id AND r.user_id = ?
       ORDER BY g.game_id`
    )
    .all(player.user_id, player.user_id);
  const totals = db
    .prepare(
      `SELECT COUNT(*) AS plays,
              COALESCE(SUM(score), 0) AS total_points,
              COALESCE(SUM(CASE WHEN school IS NOT NULL THEN score END), 0) AS school_points,
              ROUND(COALESCE(SUM(duration_sec), 0) / 60, 1) AS minutes_played
       FROM finished_plays WHERE user_id = ?`
    )
    .get(player.user_id);
  // Personal growth: every finished round in order, with a running total of points
  const history = db
    .prepare(
      `SELECT p.ended_at, g.name AS game, p.score,
              SUM(p.score) OVER (ORDER BY p.ended_at, p.score_id ROWS UNBOUNDED PRECEDING) AS cumulative
       FROM finished_plays p JOIN games g USING(game_id)
       WHERE p.user_id = ?
       ORDER BY p.ended_at, p.score_id`
    )
    .all(player.user_id) as { ended_at: string; game: string; score: number; cumulative: number }[];
  const school = player.school ? schoolLeaderboard().find((s) => s.school === player.school) ?? null : null;
  return { username: player.username, school: player.school, totals, games, schoolStanding: school, history: history.slice(-500) };
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
