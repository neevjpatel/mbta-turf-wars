// GET /api/leaderboard?game=Game%201   -> that game's top 10
// GET /api/leaderboard                 -> combined leaderboard across all games
import { connection } from "next/server";
import { gameLeaderboard, overallLeaderboard } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  // cacheComponents is on: `export const dynamic` is not allowed; this keeps the query at request time
  await connection();
  const game = new URL(req.url).searchParams.get("game");
  try {
    return Response.json(game ? gameLeaderboard(game) : overallLeaderboard());
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 400 });
  }
}
