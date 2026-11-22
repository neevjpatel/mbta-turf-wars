"use client";

import { INITIAL_STOPS } from "@/app/_data/transit/stops";
import { useState } from "react";
import CharlieRunGame from "./charlie-run-game";
import { DIFFICULTIES } from "@/app/_data/game-catalog";
import type { TransitLine } from "@/app/_data/transit/types";
import { useAppState } from "@/app/_state/app-state";

type RunResult = { points: number; captured: boolean; station: string };

export default function CharlieRunExperience() {
  const { difficulty } = useAppState();
  const line = DIFFICULTIES[difficulty].lineShort as TransitLine;
  const lineStops = INITIAL_STOPS.filter((stop) => stop.line === line);
  const [selectedStopId, setSelectedStopId] = useState(lineStops[0]?.id ?? INITIAL_STOPS[0].id);
  const selectedSchool = "you"; // Charlie Run is personal: no campus, points go to the player only
  const [isDelayed, setIsDelayed] = useState(false);
  const [runNumber, setRunNumber] = useState(0);
  const [result, setResult] = useState<RunResult | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const station = lineStops.find((stop) => stop.id === selectedStopId) ?? lineStops[0] ?? INITIAL_STOPS[0];

  const finishRun = (points: number, captured: boolean) => {
    setTotalPoints((previous) => previous + points);
    setResult({ points, captured, station: station.name });
  };

  const startAgain = () => {
    setResult(null);
    setRunNumber((previous) => previous + 1);
  };

  return (
    <section className="charlie-run-experience" aria-label="Charlie Run game">
      <div className="runner-game-header">
        <div><p className="eyebrow">Endless runner · collect Charlie Coins</p><h1>Outrun the T.</h1></div>
        <div className="runner-total"><small>RUN TOTAL</small><strong>{totalPoints} pts</strong></div>
      </div>
      <div className="runner-game-controls">
        <label>Station · {line} Line
          <select value={station.id} onChange={(event) => setSelectedStopId(event.target.value)}>
            {lineStops.map((stop) => <option key={stop.id} value={stop.id}>{stop.name}</option>)}
          </select>
        </label>
        <button type="button" className={`runner-delay-toggle ${isDelayed ? "active" : ""}`} onClick={() => setIsDelayed((value) => !value)} aria-pressed={isDelayed}>{isDelayed ? "3× Delay bonus on" : "Enable 3× Delay bonus"}</button>
      </div>
      <div className="runner-play-area">
        {result ? (
          <div className="runner-result" role="status">
            <span className="runner-result-icon">{result.captured ? "🏆" : "💰"}</span>
            <p>{result.captured ? `${result.station} captured for ${selectedSchool}!` : `Coins banked for ${selectedSchool}.`}</p>
            <strong>+{result.points} pts</strong>
            <button type="button" onClick={startAgain}>Run again</button>
          </div>
        ) : (
          <CharlieRunGame key={`${station.id}-${selectedSchool}-${runNumber}`} stationName={station.name} line={line} isDelayed={isDelayed} selectedSchool={selectedSchool} onCompleteRun={finishRun} />
        )}
      </div>
      <p className="runner-instructions">Use ← → to switch lanes, ↑ to jump, and ↓ to slide. On touch screens, swipe or use the on-screen controls.</p>
    </section>
  );
}
