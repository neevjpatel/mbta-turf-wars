"use client";

// Leaderboard page (schools, overall, per game) and the signed-in player's profile stats.
// Data comes from /api/leaderboard and /api/profile; styles reuse the existing .utility-page / .leaderboard-board classes.
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { CAMPUS_COLORS } from "@/app/_data/campuses";
import { GAME_LABELS, GAME_ORDER } from "@/app/_data/game-model.mjs";
import { PlayerProvider, usePlayer, usePlayerActions } from "./player";

type SchoolRow = { school: string; points: number; captures: number; players: number; rank: number };
type OverallRow = { username: string; school: string | null; t_score: number; total_points: number; games_played: number };
type GameRow = { username: string; school: string | null; total_points: number; best_score: number; plays: number; rank: number };
type Boards = { schools: SchoolRow[]; overall: OverallRow[]; games: Record<string, GameRow[]> };

type Profile = {
  username: string;
  school: string | null;
  totals: { plays: number; total_points: number; school_points: number; minutes_played: number };
  games: { game: string; plays: number; total_points: number; best_score: number | null; rank: number | null; players: number | null; better_than_pct: number | null; avg_round_sec: number | null; compare: Compare | null }[];
  schoolStanding: SchoolRow | null;
  history: HistoryRow[];
};
type HistoryRow = { ended_at: string; game: string; score: number; duration_sec: number; cumulative: number };
type Compare = {
  median_total: number; top_total: number; top_username: string;
  next_username: string | null; points_to_next: number | null;
  my_avg_round: number; all_avg_round: number; my_avg_sec: number; all_avg_sec: number;
  my_scoring_pct: number; all_scoring_pct: number;
};

const page: CSSProperties = { justifyContent: "flex-start" };
const pad = (n: number) => String(n).padStart(2, "0");
const label = (game: string) => GAME_LABELS[game as keyof typeof GAME_LABELS] ?? game;

function useJson<T>(url: string, enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    fetch(url, { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (!alive) return;
        if (!res.ok) setError(json.error ?? `Error ${res.status}`);
        else setData(json);
      })
      .catch(() => alive && setError("Couldn't reach the stats service"));
    return () => {
      alive = false;
    };
  }, [url, enabled]);
  return { data, error };
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mt-10">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="text-3xl font-black uppercase tracking-tight text-[#fffdf1]">{title}</h2>
    </div>
  );
}

export function Leaderboards() {
  const { data, error } = useJson<Boards>("/api/leaderboard");

  return (
    <main className="utility-page leaderboard-page [&>*]:shrink-0" style={page}>
      <p className="eyebrow">Live standings</p>
      <h1>Leaderboards</h1>
      <p className="utility-intro">Only signed-in players are ranked. Schools earn points from their students&apos; Turf Wars captures; every other game is personal.</p>
      {error && <p className="utility-intro" role="alert">{error}</p>}
      {!data && !error && <p className="utility-intro">Loading standings…</p>}
      {data && (
        <>
          <SectionTitle eyebrow="Turf Wars · school email players" title="School leaderboard" />
          <div className="leaderboard-board">
            {data.schools.map((s) => (
              <div key={s.school}>
                <span className="leaderboard-rank">{pad(s.rank)}</span>
                <i style={{ backgroundColor: CAMPUS_COLORS[s.school] }} />
                <strong>{s.school} <small className="font-normal text-slate-500">· {s.players} players · {s.captures} captures</small></strong>
                <b>{s.points} PTS</b>
              </div>
            ))}
          </div>

          <SectionTitle eyebrow="Average percentile across games · 2+ games played" title="Overall players" />
          <Board
            rows={data.overall.map((r, i) => ({ key: r.username, rank: i + 1, name: r.username, school: r.school, value: `${r.t_score} T-SCORE`, sub: `${r.total_points} pts · ${r.games_played} games` }))}
            empty="No one has played two games yet."
          />

          <SectionTitle eyebrow="Total points per game" title="Game leaderboards" />
          <div className="grid w-full max-w-[1100px] gap-x-6 md:grid-cols-2">
            {GAME_ORDER.map((game) => (
              <div key={game}>
                <h3 className="mt-6 text-left text-lg font-black uppercase text-[#fffdf1]">{label(game)}</h3>
                <Board
                  compact
                  rows={(data.games[game] ?? []).map((r) => ({ key: r.username, rank: r.rank, name: r.username, school: r.school, value: `${r.total_points} PTS`, sub: `${r.plays} plays · best ${r.best_score}` }))}
                  empty="No scores yet."
                />
              </div>
            ))}
          </div>
        </>
      )}
      <Link className="primary-action mt-8" href="/profile">My stats</Link>
    </main>
  );
}

function Board({ rows, empty, compact }: { rows: { key: string; rank: number; name: string; school: string | null; value: string; sub: string }[]; empty: string; compact?: boolean }) {
  return (
    <div className="leaderboard-board" style={compact ? { width: "100%", margin: "10px 0 0" } : undefined}>
      {rows.length === 0 ? (
        <div><span /><span /><strong className="font-normal text-slate-500">{empty}</strong><span /></div>
      ) : (
        rows.map((r) => (
          <div key={r.key}>
            <span className="leaderboard-rank">{pad(r.rank)}</span>
            <i style={{ backgroundColor: r.school ? CAMPUS_COLORS[r.school] : "#9aa7ab" }} />
            <strong>{r.name} <small className="font-normal text-slate-500">· {r.school ?? "no school"} · {r.sub}</small></strong>
            <b>{r.value}</b>
          </div>
        ))
      )}
    </div>
  );
}

export function ProfileView() {
  return (
    <PlayerProvider>
      <ProfileContent />
    </PlayerProvider>
  );
}

function ProfileContent() {
  const player = usePlayer();
  const actions = usePlayerActions();
  const { data, error } = useJson<Profile>("/api/profile", player.status === "ready");

  if (player.status === "loading") return <main className="utility-page profile-page"><p className="utility-intro">Loading…</p></main>;

  if (player.status !== "ready") {
    return (
      <main className="utility-page profile-page">
        <span className="large-avatar">?</span>
        <p className="eyebrow">Guest rider</p>
        <h1>Sign in to keep your scores.</h1>
        <p className="utility-intro">You can play every game as a guest, but scores are only saved for signed-in players. Sign in with Google; a BU, MIT, Harvard, Northeastern or BC email also lets your Turf Wars points count for your school.</p>
        <button type="button" className="primary-action mt-6" onClick={actions?.signIn} disabled={!actions?.googleConfigured}>
          {actions?.googleConfigured ? "Sign in with Google" : "Google sign-in not set up yet"}
        </button>
      </main>
    );
  }

  return (
    <main className="utility-page profile-page [&>*]:shrink-0" style={page}>
      <span className="large-avatar" style={player.school ? { backgroundColor: CAMPUS_COLORS[player.school] } : undefined}>
        {player.username!.slice(0, 2).toUpperCase()}
      </span>
      <p className="eyebrow">{player.school ? `${player.school} rider` : "Independent rider"}</p>
      <h1>@{player.username}</h1>
      {error && <p className="utility-intro" role="alert">{error}</p>}
      {data && (
        <>
          <p className="utility-intro">
            {data.totals.total_points} points from {data.totals.plays} plays · {data.totals.minutes_played} minutes played
            {data.schoolStanding && <> · {data.totals.school_points} points for {data.school}, which is #{data.schoolStanding.rank} of 5 schools</>}
          </p>
          <div className="leaderboard-board">
            {data.games.map((g) => (
              <div key={g.game}>
                <span className="leaderboard-rank">{g.rank ? `#${g.rank}` : "–"}</span>
                <i style={{ backgroundColor: "#9aa7ab" }} />
                <strong>
                  {label(g.game)}{" "}
                  <small className="font-normal text-slate-500">
                    {g.plays === 0
                      ? "· not played yet"
                      : `· ${g.plays} plays · best ${g.best_score} · ${g.avg_round_sec ?? "–"}s avg · ahead of ${g.better_than_pct}% of ${g.players} players`}
                  </small>
                </strong>
                <b>{g.total_points} PTS</b>
              </div>
            ))}
          </div>
          <SectionTitle eyebrow="You vs everyone else" title="How you compare" />
          <Comparisons games={data.games} />
          <SectionTitle eyebrow="Your personal growth" title="Points over time" />
          <GrowthChart history={data.history} />
          <RecentPlays history={data.history} />
        </>
      )}
      <div className="mt-8 flex gap-3">
        <Link className="primary-action" href="/leaderboard">Leaderboards</Link>
        <button type="button" className="primary-action" onClick={actions?.signOut}>Sign out</button>
      </div>
    </main>
  );
}

// ---------- personal growth ----------

const card: CSSProperties = { width: "min(720px, 90vw)", border: "4px solid #07151b", borderRadius: 18, background: "#f7f5e9", color: "#1b2d34", boxShadow: "0 8px 0 #07151b" };
const INK_MUTED = "#52656b";
const GRID = "#d6dcd8";
const SERIES = "#2a78d6"; // single series: running total of your points

/** Running total of points, one step per finished round. Hover (or tap) a round to read it. */
function GrowthChart({ history }: { history: HistoryRow[] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (history.length === 0) {
    return <div style={card} className="mt-4 p-6 text-sm">Finish a round to start your growth chart.</div>;
  }

  const W = 640, H = 220, L = 44, R = 16, T = 16, B = 30;
  const max = Math.max(...history.map((h) => h.cumulative), 1);
  const n = history.length;
  const x = (i: number) => L + (n === 1 ? (W - L - R) / 2 : (i / (n - 1)) * (W - L - R));
  const y = (v: number) => T + (1 - v / max) * (H - T - B);
  const path = history.map((h, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(h.cumulative).toFixed(1)}`).join(" ");
  const ticks = [0, Math.round(max / 2), max];
  const active = hover == null ? null : history[hover];

  const pick = (clientX: number, rect: DOMRect) => {
    const px = ((clientX - rect.left) / rect.width) * W;
    const i = n === 1 ? 0 : Math.round(((px - L) / (W - L - R)) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  };

  return (
    <figure style={card} className="mt-4 p-4 text-left">
      <figcaption className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-black uppercase">Total points</span>
        <span style={{ color: INK_MUTED }}>
          {active
            ? `Round ${hover! + 1} · ${label(active.game)} +${active.score} · ${active.cumulative} total`
            : `${history[n - 1].cumulative} points over ${n} rounds`}
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-2 block w-full touch-none"
        role="img"
        aria-label={`Running total of points: ${history[n - 1].cumulative} after ${n} rounds`}
        onPointerMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerDown={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={INK_MUTED}>{t}</text>
          </g>
        ))}
        <text x={L} y={H - 8} fontSize={11} fill={INK_MUTED}>Round 1</text>
        <text x={W - R} y={H - 8} textAnchor="end" fontSize={11} fill={INK_MUTED}>Round {n}</text>
        <path d={path} fill="none" stroke={SERIES} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(n - 1)} cy={y(history[n - 1].cumulative)} r={4} fill={SERIES} stroke="#f7f5e9" strokeWidth={2} />
        {active && (
          <g pointerEvents="none">
            <line x1={x(hover!)} x2={x(hover!)} y1={T} y2={H - B} stroke={INK_MUTED} strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={x(hover!)} cy={y(active.cumulative)} r={5} fill={SERIES} stroke="#f7f5e9" strokeWidth={2} />
          </g>
        )}
      </svg>
    </figure>
  );
}

/** Your last 50 rounds, newest first, in a box that shows about 5 at a time and scrolls (also the chart's table view). */
function RecentPlays({ history }: { history: HistoryRow[] }) {
  if (history.length === 0) return null;
  const recent = history.slice(-50).reverse();
  const th = "sticky top-0 bg-[#f7f5e9] py-1.5 font-semibold";
  return (
    <div style={card} className="mt-6 p-4 text-left">
      <p className="mb-2 flex justify-between text-sm font-black uppercase">
        <span>Recent rounds</span>
        <span className="font-semibold normal-case" style={{ color: INK_MUTED }}>{recent.length} shown · scroll for more</span>
      </p>
      <div className="max-h-[14.5rem] overflow-y-auto overflow-x-auto" tabIndex={0} aria-label="Recent rounds, scrollable">
        <table className="w-full text-sm">
          <thead style={{ color: INK_MUTED }}>
            <tr>
              <th className={`${th} text-left`}>When</th>
              <th className={`${th} text-left`}>Game</th>
              <th className={`${th} text-right`}>Points</th>
              <th className={`${th} text-right`}>Round time</th>
              <th className={`${th} text-right`}>Total</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((h, i) => (
              <tr key={`${h.ended_at}-${i}`} className="border-t" style={{ borderColor: GRID }}>
                <td className="py-2 pr-2">{new Date(`${h.ended_at.replace(" ", "T")}Z`).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
                <td className="pr-2">{label(h.game)}</td>
                <td className="text-right font-bold">+{h.score}</td>
                <td className="text-right">{formatSeconds(h.duration_sec)}</td>
                <td className="text-right">{h.cumulative}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatSeconds(s: number | null) {
  if (s == null) return "–";
  if (s < 60) return `${s.toFixed(1)}s`;
  return `${Math.floor(s / 60)}m ${String(Math.round(s % 60)).padStart(2, "0")}s`;
}

/** Per game: where your total sits between 0 and the top player, plus your per-round numbers vs everyone's. */
function Comparisons({ games }: { games: Profile["games"] }) {
  const played = games.filter((g) => g.plays > 0 && g.compare);
  if (played.length === 0) {
    return <div style={card} className="mt-4 p-6 text-sm">Play a round of any game to see how you compare.</div>;
  }
  return (
    <div className="mt-4 grid w-[min(720px,90vw)] gap-4">
      {played.map((g) => {
        const c = g.compare!;
        const scale = Math.max(c.top_total, g.total_points, 1);
        const pos = (v: number) => `${Math.min(100, (v / scale) * 100)}%`;
        const isTop = g.rank === 1;
        return (
          <section key={g.game} style={card} className="p-4 text-left" aria-label={`${label(g.game)} comparison`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-lg font-black uppercase">{label(g.game)}</h3>
              <p className="text-sm font-bold">#{g.rank} of {g.players} players</p>
            </div>
            <p className="mt-1 text-sm" style={{ color: INK_MUTED }}>
              {isTop
                ? "You're the top player in this game."
                : c.next_username && c.points_to_next != null
                  ? `${c.points_to_next} pts to catch @${c.next_username} · top player @${c.top_username} has ${c.top_total}`
                  : `Top player @${c.top_username} has ${c.top_total}`}
            </p>

            {/* Strip: 0 -> top player's total, with the median player and you marked */}
            <div className="relative mt-5 mb-7 h-2 rounded-full" style={{ background: GRID }} role="img"
              aria-label={`Your ${g.total_points} points vs median ${Math.round(c.median_total)} and top ${c.top_total}`}>
              <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: pos(g.total_points), background: SERIES }} />
              <Marker at={pos(c.median_total)} label={`median ${Math.round(c.median_total)}`} below />
              <Marker at={pos(c.top_total)} label={`top ${c.top_total}`} below align="end" />
              <span className="absolute -top-1.5 h-5 w-5 -translate-x-1/2 rounded-full border-2" style={{ left: pos(g.total_points), background: SERIES, borderColor: "#f7f5e9" }} />
              <span className="absolute -top-6 -translate-x-1/2 whitespace-nowrap text-xs font-bold" style={{ left: pos(g.total_points) }}>you {g.total_points}</span>
            </div>

            <dl className="grid grid-cols-3 gap-2 text-sm">
              <Stat label="Points per round" you={`+${c.my_avg_round}`} all={`+${c.all_avg_round}`} />
              <Stat label="Round time" you={formatSeconds(c.my_avg_sec)} all={formatSeconds(c.all_avg_sec)} />
              <Stat label="Rounds that scored" you={`${c.my_scoring_pct}%`} all={`${c.all_scoring_pct}%`} />
            </dl>
          </section>
        );
      })}
    </div>
  );
}

function Marker({ at, label: text, below, align }: { at: string; label: string; below?: boolean; align?: "end" }) {
  return (
    <>
      <span className="absolute -top-1 h-4 w-0.5" style={{ left: at, background: INK_MUTED }} />
      <span className={`absolute ${below ? "top-4" : "-top-6"} whitespace-nowrap text-xs ${align === "end" ? "-translate-x-full" : "-translate-x-1/2"}`} style={{ left: at, color: INK_MUTED }}>{text}</span>
    </>
  );
}

function Stat({ label: text, you, all }: { label: string; you: string; all: string }) {
  return (
    <div className="rounded-lg bg-white/70 p-2">
      <dt className="text-xs" style={{ color: INK_MUTED }}>{text}</dt>
      <dd><b>{you}</b> <span className="text-xs" style={{ color: INK_MUTED }}>you</span></dd>
      <dd className="text-xs" style={{ color: INK_MUTED }}>{all} everyone</dd>
    </div>
  );
}
