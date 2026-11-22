"use client";

import { LINE_DIFFICULTIES } from "@/app/_data/transit/lines";
import { INITIAL_STOPS } from "@/app/_data/transit/stops";
import { useState } from "react";
import { DIFFICULTIES } from "@/app/_data/game-catalog";
import { getStationHint } from "@/app/_lib/station-hints";
import type { StopData, TransitLine } from "@/app/_data/transit/types";
import { useAppState } from "@/app/_state/app-state";
import { useEffect } from "react";
import { usePlay } from "@/app/_stats/player";

type GuessResult = { won: boolean; answer: string };
type GuessEntry = { stop: StopData; distance: string; direction: string; sameLine: boolean };

function randomStation(excludedId?: string) {
  const pool = INITIAL_STOPS.filter((stop) => stop.id !== excludedId);
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function StopleGame() {
  const { difficulty } = useAppState();
  const line = DIFFICULTIES[difficulty].lineShort as TransitLine;
  const lineConfig = LINE_DIFFICULTIES[line];
  const [target, setTarget] = useState<StopData>(INITIAL_STOPS[0]);
  const [guessId, setGuessId] = useState(INITIAL_STOPS[1].id);
  const [guesses, setGuesses] = useState<GuessEntry[]>([]);
  const [result, setResult] = useState<GuessResult | null>(null);
  const [points, setPoints] = useState(0);
  const play = usePlay("stople");
  useEffect(() => play.start(), [play, target]);

  const submitGuess = () => {
    if (result) return;
    const guess = INITIAL_STOPS.find((stop) => stop.id === guessId);
    if (!guess || guesses.some((entry) => entry.stop.id === guess.id)) return;
    if (guess.id === target.id) {
      setResult({ won: true, answer: target.name });
      setPoints((previous) => previous + lineConfig.basePoints);
      play.end(lineConfig.basePoints, { won: true, guesses: guesses.length + 1, station: target.id });
      return;
    }
    const hint = getStationHint(guess, target);
    const updated = [...guesses, { stop: guess, distance: hint.distance, direction: hint.direction, sameLine: hint.sameLine }];
    setGuesses(updated);
    if (updated.length >= lineConfig.maxStopleGuesses) setResult({ won: false, answer: target.name });
    if (updated.length >= lineConfig.maxStopleGuesses) play.end(0, { won: false, guesses: updated.length, station: target.id });
  };

  const startNextRound = () => {
    const next = randomStation(target.id);
    setTarget(next);
    setGuessId(INITIAL_STOPS.find((stop) => stop.id !== next.id)?.id ?? next.id);
    setGuesses([]);
    setResult(null);
  };

  return (
    <section className="stople-game" aria-label="Stople station guessing game">
      <div className="stople-topline"><span className="stople-mark">T</span><span>STOPLE · MBTA STATION PUZZLE</span><strong>{points} PTS</strong></div>
      <div className="stople-content">
        <p className="eyebrow">Distance and direction clues</p>
        <h1>Guess the mystery station.</h1>
        <p className="stople-intro">Choose an MBTA stop. Each guess tells you how far away the answer is and which direction to travel.</p>
        <div className="stople-line-info"><span style={{ backgroundColor: lineConfig.color }}>{line[0]}</span><div><strong>{line} Line challenge</strong><small>{lineConfig.maxStopleGuesses} guesses · {lineConfig.difficulty}</small></div></div>

        {!result ? (
          <div className="stople-entry">
            <label htmlFor="stople-guess">Your station guess</label>
            <div><select id="stople-guess" value={guessId} onChange={(event) => setGuessId(event.target.value)}>{INITIAL_STOPS.map((stop) => <option key={stop.id} value={stop.id} disabled={guesses.some((entry) => entry.stop.id === stop.id)}>{stop.name} · {stop.line} Line</option>)}</select><button type="button" onClick={submitGuess}>Guess</button></div>
          </div>
        ) : (
          <div className={`stople-result ${result.won ? "won" : "lost"}`} role="status">
            <p>{result.won ? `Correct! +${lineConfig.basePoints} points` : "Out of guesses"}</p>
            <strong>{result.answer}</strong>
            <button type="button" onClick={startNextRound}>Next station</button>
          </div>
        )}

        <div className="stople-guesses" aria-live="polite">
          <div className="stople-guess-heading"><span>Guesses</span><span>{guesses.length} / {lineConfig.maxStopleGuesses}</span></div>
          {guesses.length === 0 ? <p className="stople-empty">Your clues will appear here.</p> : guesses.map((entry, index) => <div className="stople-guess-row" key={`${entry.stop.id}-${index}`}><strong>{entry.stop.name}</strong><span>{entry.distance} mi</span><b>{entry.direction}</b><small>{entry.sameLine ? "Same line" : "Different line"}</small></div>)}
        </div>
      </div>
    </section>
  );
}
