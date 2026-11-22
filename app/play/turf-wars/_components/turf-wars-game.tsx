"use client";

// Turf Wars: a full-screen light map of stations to conquer.
//  - Title card (top-left) with a "More info" panel: your campus, pin/ring keys, line filter, delay bonus, live alerts, activity.
//  - Campus standings (top-right) as a horizontal bar chart, leader on top.
//  - Pins are colored by the campus that currently owns each station (last saved capture wins).
import { CAMPUS_COLORS as SCHOOL_COLORS } from "@/app/_data/campuses";
import { TRIVIA_BANK, type TriviaItem } from "@/app/_data/trivia/trivia-bank";
import { LINE_DIFFICULTIES } from "@/app/_data/transit/lines";
import { INITIAL_STOPS } from "@/app/_data/transit/stops";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { StopData, TransitLine } from "@/app/_data/transit/types";
import { DIFFICULTIES } from "@/app/_data/game-catalog";
import { useAppState } from "@/app/_state/app-state";
import { usePlay, usePlayer, usePlayerActions } from "@/app/_stats/player";
import type { StationStats } from "@/lib/db";

// Stations answered wrong are locked: one try per station. The real rule would be "until tomorrow";
// for the demo the lock lasts until the page is refreshed (this list lives only in this browser tab).
const missedStations = new Set<string>();

const BostonMap = dynamic(() => import("./boston-map"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 grid place-items-center bg-slate-100 text-sm font-semibold text-slate-500">Loading the map…</div>,
});

const LINES: TransitLine[] = ["Green", "Orange", "Blue", "Red"];
type SchoolStanding = { school: string; points: number; captures: number; players: number };

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

const card = "rounded-2xl bg-white/95 text-slate-900 shadow-[0_8px_30px_rgba(15,23,42,0.14)] ring-1 ring-slate-200 backdrop-blur";

export default function TurfWarsGame({ isActive }: { isActive: boolean }) {
  const { difficulty: difficultyId } = useAppState();
  const difficulty = DIFFICULTIES[difficultyId];
  const player = usePlayer();
  const play = usePlay("turf-wars");
  const actions = usePlayerActions();
  // Your campus comes from your school email. Everyone else plays for themselves (personal points only).
  const selectedSchool = player.school ?? "you";
  const [isDelayed, setIsDelayed] = useState(false);
  const [lineFilter, setLineFilter] = useState<"ALL" | TransitLine>("ALL");
  const [liveAlerts, setLiveAlerts] = useState<string[]>([]);
  const [activeStop, setActiveStop] = useState<StopData | null>(null);
  const [trivia, setTrivia] = useState<TriviaItem>(TRIVIA_BANK[0]);
  const [lockedStopIds, setLockedStopIds] = useState<ReadonlySet<string>>(() => new Set(missedStations));
  const [activityFeed, setActivityFeed] = useState<string[]>([]);
  const [toolkitOpen, setToolkitOpen] = useState(false);
  // Saved state of the turf: owners per station + school standings (from /api/turf)
  const [stationStats, setStationStats] = useState<Record<string, StationStats>>({});
  const [standings, setStandings] = useState<SchoolStanding[]>([]);
  // Captures made in this tab show immediately, before the saved data catches up
  const [localOwners, setLocalOwners] = useState<Record<string, string>>({});

  const loadTurf = useCallback(async () => {
    try {
      const res = await fetch("/api/turf", { cache: "no-store" });
      const json = (await res.json()) as { stations?: Record<string, StationStats>; schools?: SchoolStanding[] };
      if (json.stations) setStationStats(json.stations);
      if (json.schools) setStandings(json.schools);
    } catch {
      // keep what we have; the map still works with the starting owners
    }
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("/api/turf", { cache: "no-store" })
      .then((res) => res.json())
      .then((json: { stations?: Record<string, StationStats>; schools?: SchoolStanding[] }) => {
        if (!alive) return;
        if (json.stations) setStationStats(json.stations);
        if (json.schools) setStandings(json.schools);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchAlerts = async () => {
      try {
        const response = await fetch("https://api-v3.mbta.com/alerts?filter[route_type]=0,1&filter[lifecycle]=NEW,ONGOING", { signal: controller.signal });
        const json = await response.json();
        setLiveAlerts((json.data || []).slice(0, 3).map((alert: { attributes?: { short_header?: string } }) => alert.attributes?.short_header).filter((headline: string | undefined): headline is string => Boolean(headline)));
      } catch (error) {
        if ((error as Error).name !== "AbortError") console.error("Failed to fetch MBTA alerts:", error);
      }
    };
    void fetchAlerts();
    return () => controller.abort();
  }, []);

  // Owner shown on the map: a capture in this tab > last saved capture > the station's starting owner
  const stops = useMemo(
    () => INITIAL_STOPS.map((stop) => ({ ...stop, owner: localOwners[stop.id] ?? stationStats[stop.id]?.owner ?? stop.owner })),
    [localOwners, stationStats]
  );
  const lineConfig = activeStop ? LINE_DIFFICULTIES[activeStop.line] : null;

  const handleStartTrivia = useCallback(
    (stop: StopData) => {
      if (missedStations.has(stop.id)) {
        actions?.notify(`You already missed ${stop.name}. It unlocks tomorrow (for the demo: refresh the page). Try another station!`);
        return;
      }
      const matching = TRIVIA_BANK.filter((item) => item.difficulty === LINE_DIFFICULTIES[stop.line].difficulty);
      setTrivia(pickRandom(matching.length ? matching : TRIVIA_BANK));
      setActiveStop(stop);
      play.start();
    },
    [actions, play]
  );

  const handleAnswer = (answer: string) => {
    if (!activeStop || !lineConfig) return;
    if (answer !== trivia.answer) {
      // One try per station: a wrong answer scores 0 and locks this station.
      missedStations.add(activeStop.id);
      setLockedStopIds(new Set(missedStations));
      play.end(0, { station: activeStop.id, line: activeStop.line, delayed: isDelayed, correct: false });
      setActivityFeed((previous) => [`Missed ${activeStop.name} · locked until tomorrow`, ...previous.slice(0, 4)]);
      actions?.notify(`Not quite: the answer was "${trivia.answer}". ${activeStop.name} is locked until tomorrow (for the demo: refresh the page).`);
      setActiveStop(null);
      return;
    }
    const earned = lineConfig.basePoints * (isDelayed ? 3 : 1);
    play.end(earned, { station: activeStop.id, line: activeStop.line, delayed: isDelayed, correct: true });
    if (!player.school) {
      // No school: the capture counts only toward your personal score, so standings and station owners don't change.
      setActivityFeed((previous) => [`You answered ${activeStop.name} (+${earned} personal pts${isDelayed ? " · delay bonus" : ""})`, ...previous.slice(0, 4)]);
      setActiveStop(null);
      return;
    }
    const school = player.school;
    setLocalOwners((previous) => ({ ...previous, [activeStop.id]: school }));
    setStandings((previous) => previous.map((s) => (s.school === school ? { ...s, points: s.points + earned, captures: s.captures + 1 } : s)));
    setActivityFeed((previous) => [`${school} captured ${activeStop.name} (+${earned} pts${isDelayed ? " · delay bonus" : ""})`, ...previous.slice(0, 4)]);
    setActiveStop(null);
    // Pick up the saved result once the server has recorded it
    window.setTimeout(() => void loadTurf(), 1200);
  };

  return (
    <section className="relative h-full w-full overflow-hidden bg-slate-100 text-slate-900" aria-label="Turf Wars trivia game" data-active={isActive}>
      <BostonMap
        selectedSchool={selectedSchool}
        isDelayed={isDelayed}
        onStartClaim={handleStartTrivia}
        stops={stops}
        lineFilter={lineFilter}
        isActive={isActive}
        lockedStopIds={lockedStopIds}
        stationStats={stationStats}
      />

      {/* Title + toolkit */}
      <div className="pointer-events-none absolute left-3 top-3 z-[1100] flex max-h-[calc(100%-1.5rem)] w-[min(340px,calc(100%-1.5rem))] flex-col gap-2">
        <div className={`${card} pointer-events-auto p-4`}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Turf Wars{isDelayed ? " · 3× delay bonus on" : ""}</p>
          <h2 className="text-2xl font-black leading-tight tracking-tight">Conquer the turfs!</h2>
          <p className="mt-1 text-sm text-slate-600">Tap a pin, answer its question, and claim the station{player.school ? ` for ${player.school}` : ""}. One try per station.</p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <CampusChip school={player.school} status={player.status} />
            <button
              type="button"
              onClick={() => setToolkitOpen((open) => !open)}
              aria-expanded={toolkitOpen}
              aria-controls="turf-toolkit"
              className="shrink-0 whitespace-nowrap rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold leading-none text-white hover:bg-slate-700"
            >
              ⓘ More info {toolkitOpen ? "▴" : "▾"}
            </button>
          </div>
        </div>

        {toolkitOpen && (
          <div id="turf-toolkit" className={`${card} pointer-events-auto space-y-4 overflow-y-auto p-4 text-sm`}>
            <ToolSection title="Pin color · who owns the turf">
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {Object.entries(SCHOOL_COLORS).map(([school, color]) => (
                  <span key={school} className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />{school}</span>
                ))}
                <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-slate-400" />Unclaimed / locked</span>
              </div>
            </ToolSection>

            <ToolSection title="Pin ring · question difficulty and points">
              <div className="grid grid-cols-2 gap-1">
                {LINES.map((line) => (
                  <span key={line} className="inline-flex items-center gap-1.5">
                    <i className="h-3 w-3 rounded-full border-[3px] bg-white" style={{ borderColor: LINE_DIFFICULTIES[line].color }} />
                    {line} · {LINE_DIFFICULTIES[line].difficulty} · +{LINE_DIFFICULTIES[line].basePoints}
                  </span>
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-500">Your menu setting ({difficulty.label} · {difficulty.line}) only changes the train look; each station&apos;s line sets its question and points.</p>
            </ToolSection>

            <ToolSection title="Show stations on">
              <div className="flex flex-wrap gap-1" role="group" aria-label="Filter stations by line">
                {(["ALL", ...LINES] as const).map((line) => (
                  <button
                    type="button"
                    key={line}
                    aria-pressed={lineFilter === line}
                    onClick={() => setLineFilter(line)}
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${lineFilter === line ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-100"}`}
                  >
                    {line === "ALL" ? "All lines" : line}
                  </button>
                ))}
              </div>
            </ToolSection>

            <ToolSection title="Live MBTA">
              <button
                type="button"
                onClick={() => setIsDelayed((value) => !value)}
                aria-pressed={isDelayed}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold ring-1 ${isDelayed ? "bg-amber-100 text-amber-900 ring-amber-300" : "bg-slate-50 text-slate-700 ring-slate-200"}`}
              >
                <span>Simulate a delay (judge demo): 3× points</span>
                <span>{isDelayed ? "ON" : "OFF"}</span>
              </button>
              <p className="mt-1.5 text-xs text-slate-500">{liveAlerts.length ? liveAlerts.join(" • ") : "No active rapid-transit alerts right now."}</p>
            </ToolSection>

            <ToolSection title="Your activity">
              {activityFeed.length ? (
                <ul className="space-y-0.5 text-xs text-slate-600">{activityFeed.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
              ) : (
                <p className="text-xs text-slate-500">Nothing yet. Pick a pin to start.</p>
              )}
            </ToolSection>
          </div>
        )}
      </div>

      {/* Campus standings */}
      <div className={`${card} absolute right-3 top-3 z-[1100] w-[min(300px,calc(100%-1.5rem))] p-4 max-sm:hidden`}>
        <StandingsChart standings={standings} mySchool={player.school} />
      </div>

      {/* Trivia challenge */}
      {activeStop && lineConfig && (
        <div className="fixed inset-0 z-[2500] grid place-items-center bg-slate-900/40 p-6 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveStop(null); }}>
          <div className="w-full max-w-lg rounded-2xl border-t-8 bg-white p-6 text-slate-900 shadow-2xl" style={{ borderTopColor: lineConfig.color }} role="dialog" aria-modal="true" aria-labelledby="trivia-title">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: lineConfig.color }}>{activeStop.line} Line · {lineConfig.difficulty} · {activeStop.name}</p>
            <h3 id="trivia-title" className="mt-2 text-xl font-black leading-snug">{trivia.question}</h3>
            <p className="mt-1 text-xs text-slate-500">One try: a wrong answer locks this station until tomorrow.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {trivia.options.map((option) => (
                <button type="button" key={option} onClick={() => handleAnswer(option)} className="rounded-xl bg-slate-50 px-4 py-3 text-left text-sm font-semibold ring-1 ring-slate-200 hover:bg-slate-100 hover:ring-slate-400">
                  {option}
                </button>
              ))}
            </div>
            <button type="button" className="mt-4 text-sm font-semibold text-slate-500 underline" onClick={() => setActiveStop(null)}>Cancel challenge</button>
          </div>
        </div>
      )}
    </section>
  );
}

function ToolSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</h3>
      {children}
    </section>
  );
}

function CampusChip({ school, status }: { school: string | null; status: string }) {
  if (school) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold">
        <i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SCHOOL_COLORS[school] }} />Playing for {school}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
      {status === "ready" ? "Solo · personal points" : "Guest · not playing for a school"}
    </span>
  );
}

/** Horizontal bars, leader on top. Each bar is labeled with its school and points, so color is never the only cue. */
function StandingsChart({ standings, mySchool }: { standings: SchoolStanding[]; mySchool: string | null }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const sorted = [...standings].sort((a, b) => b.points - a.points || a.school.localeCompare(b.school));
  const max = Math.max(1, ...sorted.map((s) => s.points));
  const active = sorted.find((s) => s.school === hovered);

  return (
    <figure>
      <figcaption className="mb-2 flex items-baseline justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Campus standings</span>
        <span className="text-[11px] text-slate-500">Turf Wars points</span>
      </figcaption>
      {sorted.length === 0 ? (
        <p className="text-xs text-slate-500">Loading standings…</p>
      ) : (
        <ol className="space-y-1.5">
          {sorted.map((s, index) => (
            <li
              key={s.school}
              className="grid cursor-default grid-cols-[5.5rem_1fr_auto] items-center gap-2 rounded-md px-1 py-0.5 hover:bg-slate-50"
              onMouseEnter={() => setHovered(s.school)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className={`truncate text-xs ${s.school === mySchool ? "font-black" : "font-semibold"}`}>
                {index === 0 ? "👑 " : ""}{s.school === "Northeastern" ? "NEU" : s.school}{s.school === mySchool ? " (you)" : ""}
              </span>
              <span className="h-3 rounded-r" aria-hidden="true" style={{ width: `${Math.max(2, (s.points / max) * 100)}%`, backgroundColor: SCHOOL_COLORS[s.school] }} />
              <span className="text-right text-xs font-bold tabular-nums">{s.points}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-2 min-h-4 text-[11px] text-slate-500">
        {active ? `${active.school}: ${active.points} pts · ${active.captures} captures · ${active.players} players` : "Hover a bar for details"}
      </p>
    </figure>
  );
}
