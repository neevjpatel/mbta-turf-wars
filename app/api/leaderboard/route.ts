// GET /api/leaderboard?game=turf-wars   -> that game's top 10
// GET /api/leaderboard                  -> everything: { schools, overall, games: { "turf-wars": [...], ... } }
import { connection } from "next/server";
import { GAMES, gameLeaderboard, overallLeaderboard, schoolLeaderboard } from "@/lib/db";

export async function GET(req: Request) {
  // cacheComponents is on: `export const dynamic` is not allowed; this keeps the query at request time
  await connection();
  const game = new URL(req.url).searchParams.get("game");
  try {
    if (game) return Response.json(gameLeaderboard(game));
    return Response.json({
      schools: schoolLeaderboard(),
      overall: overallLeaderboard(),
      games: Object.fromEntries(GAMES.map((g) => [g, gameLeaderboard(g)])),
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 400 });
  }
}
