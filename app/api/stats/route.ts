// GET /api/stats  -> per-game plays started, quit rate, average round length
import { connection } from "next/server";
import { gameTimeSummary } from "@/lib/db";

export async function GET() {
  // cacheComponents is on: a sync better-sqlite3 query would otherwise be prerendered at build time
  await connection();
  return Response.json(gameTimeSummary());
}
