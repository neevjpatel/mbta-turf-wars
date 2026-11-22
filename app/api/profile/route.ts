// GET  /api/profile                          -> the signed-in player's stats (per game + totals + school standing)
// POST /api/profile  { "username": "joselo" } -> first sign-in: pick a username (school comes from the email)
import { createPlayer, playerProfile } from "@/lib/db";
import { getCurrentPlayer } from "@/lib/session";

export async function GET() {
  const me = await getCurrentPlayer();
  if (me.status !== "ready") return Response.json({ error: "Sign in to see your stats", status: me.status }, { status: 401 });
  return Response.json(playerProfile(me.player));
}

export async function POST(req: Request) {
  const me = await getCurrentPlayer();
  if (me.status === "guest") return Response.json({ error: "Sign in first" }, { status: 401 });
  if (me.status === "ready") return Response.json({ error: "This account already has a username" }, { status: 409 });
  const { username } = await req.json().catch(() => ({}));
  const res = createPlayer(me.authUserId, me.email, me.emailVerified, String(username ?? "").trim());
  if ("error" in res) return Response.json({ error: res.error }, { status: 400 });
  return Response.json({ username: res.player.username, school: res.player.school });
}
