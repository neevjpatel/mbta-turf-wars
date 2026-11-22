// GET /api/turf  -> { stations: { [stationId]: { owner, schools, attempts, correct, last_capture } }, schools: [...] }
// Who owns each Turf Wars station (from saved captures) plus the school standings, in one request for the map.
import { connection } from "next/server";
import { schoolLeaderboard, turfStations } from "@/lib/db";

export async function GET() {
  await connection();
  return Response.json({ stations: turfStations(), schools: schoolLeaderboard() });
}
