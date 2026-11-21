// GET /api/stats  -> per-game plays started, quit rate, average round length
import { gameTimeSummary } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(gameTimeSummary());
}
