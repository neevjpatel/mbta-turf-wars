// POST /api/end   body: { "playId": 123, "score": 720, "details": { ... optional game-specific data } }
// returns the game-over stats: score, total_points, best_score, rank, players, better_than_pct, quicker_than_pct
import { endGame } from "@/lib/db";
import { getCurrentPlayer } from "@/lib/session";

export async function POST(req: Request) {
  const me = await getCurrentPlayer();
  if (me.status !== "ready") return Response.json({ error: "Sign in to save scores" }, { status: 401 });
  const { playId, score, details } = await req.json().catch(() => ({}));
  const points = Number(score);
  if (!Number.isInteger(Number(playId)) || !Number.isFinite(points) || points < 0 || points > 100_000) {
    return Response.json({ error: "playId and a score from 0 to 100000 required" }, { status: 400 });
  }
  const json = details == null ? null : JSON.stringify(details);
  if (json && json.length > 2000) return Response.json({ error: "details too large" }, { status: 400 });
  const stats = endGame(me.player, Number(playId), points, json);
  return stats ? Response.json(stats) : Response.json({ error: "play not found" }, { status: 404 });
}
