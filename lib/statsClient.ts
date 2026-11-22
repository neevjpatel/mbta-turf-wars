// Browser-side fetch helpers for /api/start and /api/end. Games don't call these directly:
// they use `usePlay(game)` from app/_stats/player.tsx, which skips recording for guests.
// Never throws: if the stats API is down, the game keeps working and these return null.
import type { GameName } from "./games";

export type { GameName };

/** What /api/end returns, shown in the game-over toast. */
export type PlayStats = {
  score: number;
  duration_sec: number;
  total_points: number;     // this player's points in this game so far
  best_score: number;
  rank: number;             // rank among players in this game, by total points
  players: number;
  better_than_pct: number;  // more points in this game than X% of the other players
  quicker_than_pct: number; // this round was quicker than X% of rounds
  already_recorded: boolean;
};

async function post<T>(url: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok || json?.error) {
      console.warn(`[stats] ${url}:`, json?.error ?? res.status);
      return null;
    }
    return json as T;
  } catch (e) {
    console.warn(`[stats] ${url} failed:`, e);
    return null;
  }
}

/** Starts a play for the signed-in player. Resolves to the playId to pass to recordEnd, or null. */
export async function recordStart(game: GameName, difficulty: string | null): Promise<number | null> {
  const res = await post<{ playId: number }>("/api/start", { game, difficulty });
  return res?.playId ?? null;
}

/** Ends a play. Calling it again for the same play is harmless: only the first score counts. */
export async function recordEnd(playId: number | null, score: number, details?: Record<string, unknown>): Promise<PlayStats | null> {
  if (playId == null) return null;
  return post<PlayStats>("/api/end", { playId, score, details });
}
