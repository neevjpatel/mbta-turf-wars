import Link from "next/link";
import { SCHOOL_COLORS } from "../mbtaData";

const STANDINGS = [["BU", 140], ["Northeastern", 135], ["MIT", 120], ["Harvard", 110], ["BC", 105]] as const;

export default function LeaderboardPage() {
  return <main className="utility-page leaderboard-page"><p className="eyebrow">Turf Capture demo standings</p><h1>Campus leaderboard</h1><p className="utility-intro">These are the existing local demo standings. Captures made during a run currently live only in that game session.</p><div className="leaderboard-board">{STANDINGS.map(([school, score], index) => <div key={school}><span className="leaderboard-rank">{String(index + 1).padStart(2, "0")}</span><i style={{ backgroundColor: SCHOOL_COLORS[school] }} /><strong>{school}</strong><b>{score} PTS</b></div>)}</div><Link className="primary-action" href="/play/turf">Play Turf Capture</Link></main>;
}
