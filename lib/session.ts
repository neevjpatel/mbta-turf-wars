// Who is playing right now? Server-side only (route handlers).
// Games never send a username: the server reads it from the sign-in cookie, so scores can't be posted for someone else.
import { headers } from "next/headers";
import { getAuth } from "./auth";
import { findPlayerByAuthId, type PlayerRow } from "./db";
import { schoolForEmail, type School } from "./schools";

export type CurrentPlayer =
  | { status: "guest" }
  | { status: "needs-username"; authUserId: string; email: string; emailVerified: boolean; school: School | null }
  | { status: "ready"; player: PlayerRow };

export async function getCurrentPlayer(): Promise<CurrentPlayer> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { status: "guest" };
  const { id, email, emailVerified } = session.user;
  const player = findPlayerByAuthId(id);
  if (player) return { status: "ready", player };
  return { status: "needs-username", authUserId: id, email, emailVerified, school: emailVerified ? schoolForEmail(email) : null };
}
