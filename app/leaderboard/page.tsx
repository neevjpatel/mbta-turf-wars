import Link from "next/link";
import { CAMPUS_COLORS, INITIAL_CAMPUS_STANDINGS } from "../_data/campuses";

const STANDINGS = Object.entries(INITIAL_CAMPUS_STANDINGS).sort(([, first], [, second]) => second - first);

export default function LeaderboardPage() {
  return <main className="utility-page leaderboard-page"><p className="eyebrow">Turf Wars demo standings</p><h1>Campus leaderboard</h1><p className="utility-intro">These are the current demo standings. Captures made during a run stay in that game session.</p><div className="leaderboard-board">{STANDINGS.map(([campus, score], index) => <div key={campus}><span className="leaderboard-rank">{String(index + 1).padStart(2, "0")}</span><i style={{ backgroundColor: CAMPUS_COLORS[campus] }} /><strong>{campus}</strong><b>{score} PTS</b></div>)}</div><Link className="primary-action" href="/play/turf-wars">Play Turf Wars</Link></main>;
}
