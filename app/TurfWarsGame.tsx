"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { BOSTON_TRIVIA, INITIAL_STOPS, SCHOOL_COLORS, StopData } from "./mbtaData";

const BostonMap = dynamic(() => import("./BostonMap"), {
  ssr: false,
  loading: () => <div className="map-loading">Connecting to the live MBTA map…</div>,
});

type Difficulty = { label: string; line: string; color: string; code: string };

export default function TurfWarsGame({ difficulty, isActive }: { difficulty: Difficulty; isActive: boolean }) {
  const [selectedSchool, setSelectedSchool] = useState("BU");
  const [isDelayed, setIsDelayed] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState<string[]>([]);
  const [activeTriviaStop, setActiveTriviaStop] = useState<StopData | null>(null);
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [triviaFeedback, setTriviaFeedback] = useState<string | null>(null);
  const [stops, setStops] = useState<StopData[]>(INITIAL_STOPS);
  const [activityFeed, setActivityFeed] = useState<string[]>(["BU captured Kenmore (+25 pts)", "Northeastern captured Ruggles (+25 pts)", "MIT captured Kendall/MIT (+25 pts)"]);
  const [scores, setScores] = useState<Record<string, number>>({ BU: 140, Northeastern: 135, MIT: 120, Harvard: 110, BC: 105 });

  useEffect(() => {
    const controller = new AbortController();
    const fetchAlerts = async () => {
      try {
        const response = await fetch("https://api-v3.mbta.com/alerts?filter[route_type]=0,1&filter[lifecycle]=NEW,ONGOING", { signal: controller.signal });
        const json = await response.json();
        setLiveAlerts((json.data || []).slice(0, 3).map((alert: { attributes?: { short_header?: string } }) => alert.attributes?.short_header).filter(Boolean));
      } catch (error) {
        if ((error as Error).name !== "AbortError") console.error("Failed to fetch MBTA alerts:", error);
      }
    };
    void fetchAlerts();
    return () => controller.abort();
  }, []);

  const ranking = useMemo(() => Object.entries(scores).sort(([, a], [, b]) => b - a), [scores]);

  const handleStartClaim = (stop: StopData) => {
    setTriviaFeedback(null);
    setTriviaIndex(Math.floor(Math.random() * BOSTON_TRIVIA.length));
    setActiveTriviaStop(stop);
  };

  const handleAnswerTrivia = (chosenOption: string) => {
    if (!activeTriviaStop) return;
    const currentQuestion = BOSTON_TRIVIA[triviaIndex];
    if (chosenOption !== currentQuestion.answer) {
      setTriviaFeedback("Not quite. Try again to lock in this station.");
      return;
    }
    const earned = 10 * (isDelayed ? 3 : 1);
    setScores((previous) => ({ ...previous, [selectedSchool]: (previous[selectedSchool] || 0) + earned }));
    setStops((previous) => previous.map((stop) => stop.id === activeTriviaStop.id ? { ...stop, owner: selectedSchool, points: stop.points + earned } : stop));
    setActivityFeed((previous) => [`${selectedSchool} captured ${activeTriviaStop.name} (+${earned} pts${isDelayed ? " · delay bonus" : ""})`, ...previous.slice(0, 4)]);
    setActiveTriviaStop(null);
  };

  return (
    <section className="turf-game" aria-label="Turf Capture game" data-active={isActive}>
      <div className="game-hud">
        <div><p className="eyebrow">Live strategy · Turf Capture</p><h2>Own the line.</h2></div>
        <div className="campus-picker" aria-label="Choose your campus">
          {Object.keys(SCHOOL_COLORS).filter((school) => school !== "Unclaimed").map((school) => (
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
          <BostonMap selectedSchool={selectedSchool} isDelayed={isDelayed} onStartClaim={handleStartClaim} stops={stops} isActive={isActive} />
          <div className="map-overlay top-left"><span className="live-pulse" /> LIVE VEHICLES</div>
          <div className="map-overlay bottom-right">Click a station to capture</div>
        </div>
      </div>
      <div className="difficulty-disclaimer"><span style={{ backgroundColor: difficulty.color }}>{difficulty.code}</span><p><strong>{difficulty.label} · {difficulty.line}</strong> changes the train presentation only. This game has no implemented difficulty rules yet.</p></div>

      {activeTriviaStop && (
        <div className="trivia-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveTriviaStop(null); }}>
          <div className="trivia-modal" role="dialog" aria-modal="true" aria-labelledby="trivia-title">
            <span className="eyebrow">Station check-in · {activeTriviaStop.name}</span>
            <h3 id="trivia-title">{BOSTON_TRIVIA[triviaIndex].question}</h3>
            <div className="trivia-options">{BOSTON_TRIVIA[triviaIndex].options.map((option) => <button type="button" key={option} onClick={() => handleAnswerTrivia(option)}>{option}</button>)}</div>
            {triviaFeedback && <p className="trivia-feedback" role="alert">{triviaFeedback}</p>}
            <button type="button" className="modal-cancel" onClick={() => setActiveTriviaStop(null)}>Cancel check-in</button>
          </div>
        </div>
      )}
    </section>
  );
}
