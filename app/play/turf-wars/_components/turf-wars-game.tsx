"use client";

import { CAMPUS_COLORS as SCHOOL_COLORS } from "@/app/_data/campuses";
import { TRIVIA_BANK, type TriviaItem } from "@/app/_data/trivia/trivia-bank";
import { LINE_DIFFICULTIES } from "@/app/_data/transit/lines";
import { INITIAL_STOPS } from "@/app/_data/transit/stops";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { StopData, TransitLine } from "@/app/_data/transit/types";
import { DIFFICULTIES } from "@/app/_data/game-catalog";
import { useAppState } from "@/app/_state/app-state";

const BostonMap = dynamic(() => import("./boston-map"), {
  ssr: false,
  loading: () => <div className="map-loading">Connecting to the live MBTA map…</div>,
});

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export default function TurfWarsGame({ isActive }: { isActive: boolean }) {
  const { difficulty: difficultyId } = useAppState();
  const difficulty = DIFFICULTIES[difficultyId];
  const [selectedSchool, setSelectedSchool] = useState("BU");
  const [isDelayed, setIsDelayed] = useState(false);
  const [lineFilter, setLineFilter] = useState<"ALL" | TransitLine>("ALL");
  const [liveAlerts, setLiveAlerts] = useState<string[]>([]);
  const [activeStop, setActiveStop] = useState<StopData | null>(null);
  const [trivia, setTrivia] = useState<TriviaItem>(TRIVIA_BANK[0]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [stops, setStops] = useState<StopData[]>(INITIAL_STOPS);
  const [activityFeed, setActivityFeed] = useState<string[]>([
    "BU captured Kenmore (+25 pts)",
    "Northeastern captured Ruggles (+25 pts)",
    "MIT captured Kendall/MIT (+60 pts)",
  ]);
  const [scores, setScores] = useState<Record<string, number>>({ BU: 140, Northeastern: 135, MIT: 120, Harvard: 110, BC: 105 });

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

  const ranking = useMemo(() => Object.entries(scores).sort(([, a], [, b]) => b - a), [scores]);
  const lineConfig = activeStop ? LINE_DIFFICULTIES[activeStop.line] : null;

  const handleStartTrivia = (stop: StopData) => {
    const matching = TRIVIA_BANK.filter((item) => item.difficulty === LINE_DIFFICULTIES[stop.line].difficulty);
    setTrivia(pickRandom(matching.length ? matching : TRIVIA_BANK));
    setFeedback(null);
    setActiveStop(stop);
  };

  const handleAnswer = (answer: string) => {
    if (!activeStop || !lineConfig) return;
    if (answer !== trivia.answer) {
      setFeedback("Not quite. Try another answer to capture this station.");
      return;
    }
    const earned = lineConfig.basePoints * (isDelayed ? 3 : 1);
    setScores((previous) => ({ ...previous, [selectedSchool]: (previous[selectedSchool] || 0) + earned }));
    setStops((previous) => previous.map((stop) => stop.id === activeStop.id
      ? { ...stop, owner: selectedSchool, points: stop.points + earned }
      : stop));
    setActivityFeed((previous) => [`${selectedSchool} captured ${activeStop.name} (+${earned} pts${isDelayed ? " · delay bonus" : ""})`, ...previous.slice(0, 4)]);
    setActiveStop(null);
  };

  return (
    <section className="turf-game" aria-label="Turf Wars trivia game" data-active={isActive}>
      <div className="game-hud">
        <div><p className="eyebrow">Live strategy · Campus Turf Capture</p><h2>Own the line.</h2></div>
        <div className="campus-picker" aria-label="Choose your campus">
          {Object.keys(SCHOOL_COLORS).map((school) => (
            <button type="button" key={school} onClick={() => setSelectedSchool(school)} className={selectedSchool === school ? "active" : ""} aria-pressed={selectedSchool === school}>
              <span style={{ backgroundColor: SCHOOL_COLORS[school] }} />{school === "Northeastern" ? "NEU" : school}
            </button>
          ))}
        </div>
      </div>
      <div className="alert-ticker"><span>LIVE MBTA</span><p>{liveAlerts.length ? liveAlerts.join("  •  ") : "Live service connected. No active rapid-transit alerts returned."}</p></div>
      <div className="game-grid">
        <aside className="game-sidebar">
          <div className="score-panel">
            <div className="panel-heading"><span>Campus standings</span><small>PTS</small></div>
            {ranking.map(([school, score], index) => (
              <div className="score-row" key={school}><span className="rank">{String(index + 1).padStart(2, "0")}</span><i style={{ backgroundColor: SCHOOL_COLORS[school] }} /><strong>{school}</strong><b>{score}</b></div>
            ))}
          </div>
          <button type="button" className={`delay-control ${isDelayed ? "active" : ""}`} onClick={() => setIsDelayed((value) => !value)}>
            <span><small>JUDGE DEMO</small><strong>{isDelayed ? "3× DELAY ACTIVE" : "SIMULATE DELAY"}</strong></span><i>{isDelayed ? "ON" : "OFF"}</i>
          </button>
          <div className="activity-panel"><span className="panel-heading">Recent captures</span>{activityFeed.slice(0, 3).map((item, index) => <p key={`${item}-${index}`}>{item}</p>)}</div>
        </aside>
        <div className="map-panel">
          <BostonMap selectedSchool={selectedSchool} isDelayed={isDelayed} onStartClaim={handleStartTrivia} stops={stops} lineFilter={lineFilter} isActive={isActive} />
          <div className="map-overlay top-left"><span className="live-pulse" /> LIVE VEHICLES</div>
          <div className="map-line-filter" role="group" aria-label="Filter stations by line">
            {(["ALL", "Green", "Orange", "Blue", "Red"] as const).map((line) => <button type="button" key={line} className={lineFilter === line ? "active" : ""} aria-pressed={lineFilter === line} onClick={() => setLineFilter(line)}>{line === "ALL" ? "All" : line}</button>)}
          </div>
          <div className="map-overlay bottom-right">Select a station to answer trivia</div>
        </div>
      </div>
      <div className="difficulty-disclaimer"><span style={{ backgroundColor: difficulty.color }}>{difficulty.code}</span><p><strong>{difficulty.label} · {difficulty.line}</strong> sets the train presentation. Station line determines trivia difficulty and capture reward.</p></div>

      {activeStop && lineConfig && (
        <div className="trivia-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveStop(null); }}>
          <div className="trivia-modal" role="dialog" aria-modal="true" aria-labelledby="trivia-title">
            <span className="eyebrow" style={{ color: lineConfig.color }}>{activeStop.line} Line · {lineConfig.difficulty} · {activeStop.name}</span>
            <h3 id="trivia-title">{trivia.question}</h3>
            <div className="trivia-options">{trivia.options.map((option) => <button type="button" key={option} onClick={() => handleAnswer(option)}>{option}</button>)}</div>
            {feedback && <p className="trivia-feedback" role="alert">{feedback}</p>}
            <button type="button" className="modal-cancel" onClick={() => setActiveStop(null)}>Cancel challenge</button>
          </div>
        </div>
      )}
    </section>
  );
}
