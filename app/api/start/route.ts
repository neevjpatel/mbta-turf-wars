// POST /api/start   body: { "username": "joselo", "game": "Game 1" }
// returns: { "playId": 123 }
import { startGame } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { username, game } = await req.json();
  if (!username || !game) return Response.json({ error: "username and game required" }, { status: 400 });
  try {
    return Response.json({ playId: startGame(username, game) });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 400 });
  }
}
