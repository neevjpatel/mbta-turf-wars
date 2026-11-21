// GET /api/leaderboard?game=Game%201   -> that game's top 10
// GET /api/leaderboard                 -> combined leaderboard across all games
import { gameLeaderboard, overallLeaderboard } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const game = new URL(req.url).searchParams.get("game");
  try {
    return Response.json(game ? gameLeaderboard(game) : overallLeaderboard());
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 400 });
  }
}
