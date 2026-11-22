// POST /api/start   body: { "game": "turf-wars", "difficulty": "medium" }
// returns: { "playId": 123 }. The player comes from the sign-in cookie; guests get 401 (their scores aren't saved).
import { isGame, startGame } from "@/lib/db";
import { getCurrentPlayer } from "@/lib/session";

const DIFFICULTIES = ["easy", "medium", "hard", "extreme"];

export async function POST(req: Request) {
  const me = await getCurrentPlayer();
  if (me.status !== "ready") return Response.json({ error: "Sign in to save scores" }, { status: 401 });
  const { game, difficulty } = await req.json().catch(() => ({}));
  if (!isGame(game)) return Response.json({ error: "Unknown game" }, { status: 400 });
  return Response.json({ playId: startGame(me.player, game, DIFFICULTIES.includes(difficulty) ? difficulty : null) });
}
