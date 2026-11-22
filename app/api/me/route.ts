// GET /api/me  -> who is playing: { status: "guest" | "needs-username" | "ready", username?, email?, school?, googleConfigured }
import { googleConfigured } from "@/lib/auth";
import { getCurrentPlayer } from "@/lib/session";

export async function GET() {
  const me = await getCurrentPlayer();
  if (me.status === "guest") return Response.json({ status: "guest", school: null, googleConfigured });
  if (me.status === "needs-username") return Response.json({ status: me.status, email: me.email, school: me.school, googleConfigured });
  const { username, email, school } = me.player;
  return Response.json({ status: "ready", username, email, school, googleConfigured });
}
