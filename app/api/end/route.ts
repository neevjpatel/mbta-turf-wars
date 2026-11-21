// POST /api/end   body: { "playId": 123, "score": 720 }
// returns the game-over stats: score, best_score, duration_sec, better_than_pct, quicker_than_pct, players
import { endGame } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { playId, score } = await req.json();
  if (playId == null || score == null) return Response.json({ error: "playId and score required" }, { status: 400 });
  return Response.json(endGame(Number(playId), Number(score)) ?? { error: "play not found" });
}
