// Google sign-in endpoints (Better Auth): /api/auth/sign-in/social, /api/auth/callback/google, /api/auth/sign-out, ...
import { getAuth } from "@/lib/auth";

export async function GET(req: Request) {
  return (await getAuth()).handler(req);
}

export async function POST(req: Request) {
  return (await getAuth()).handler(req);
}
