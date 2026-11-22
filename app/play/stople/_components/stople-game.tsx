"use client";

import { TRANSIT_STATIONS } from "@/app/_data/transit/stations";
import type { TransitStation } from "@/app/_data/transit/types";
import { getStationHint } from "@/app/_lib/station-hints";
import { useAppState } from "@/app/_state/app-state";
import ConfettiBurst from "@/app/play/_components/confetti-burst";
import { useMemo, useState } from "react";
import { useEffect } from "react";
import { usePlay } from "@/app/_stats/player";
import { stoplePoints } from "@/lib/scoring";

type GuessResult = { won: boolean; answer: string };
type GuessEntry = { station: TransitStation; distance: string; direction: string; correct: boolean };

function randomStation(excludedId?: string): TransitStation {
  const pool = TRANSIT_STATIONS.filter((station) => station.id !== excludedId);
  return pool[Math.floor(Math.random() * pool.length)];
}

function normalizeName(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").trim();
}

function editDistance(first: string, second: string) {
  const row = Array.from({ length: second.length + 1 }, (_, index) => index);
  for (let i = 1; i <= first.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= second.length; j += 1) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (first[i - 1] === second[j - 1] ? 0 : 1));
      previous = above;
    }
  }
  return row[second.length];
}

export default function StopleGame() {
  const { difficulty } = useAppState();
  const maxGuesses = { easy: 6, medium: 4, hard: 3, extreme: 2 }[difficulty];
  const [target, setTarget] = useState<TransitStation>(() => randomStation());
  const [guessId, setGuessId] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<GuessEntry[]>([]);
  const [result, setResult] = useState<GuessResult | null>(null);
  const [hintShown, setHintShown] = useState(false);
  const [feedbackPulse, setFeedbackPulse] = useState(0);
  const [guessFeedback, setGuessFeedback] = useState<"wrong" | "correct" | null>(null);
  const guessesLeft = Math.max(0, maxGuesses - guesses.length);
  const play = usePlay("stople");
  useEffect(() => play.start(), [play, target]);

  const submitGuess = () => {
    if (!guessId || result) return;
    const guess = TRANSIT_STATIONS.find((station) => station.id === guessId);
    if (!guess || guesses.some((entry) => entry.station.id === guess.id)) return;

    if (guess.id === target.id) {
      setGuesses((previous) => [...previous, { station: guess, distance: "0.00", direction: "Target", correct: true }]);
      setResult({ won: true, answer: target.name });
      play.end(stoplePoints(difficulty, true, maxGuesses - guesses.length - 1), { won: true, guesses: guesses.length + 1, station: target.id, hint: hintShown });
      setGuessId(null);
      setFeedbackPulse((previous) => previous + 1);
      setGuessFeedback("correct");
      return;
    }

    const hint = getStationHint(guess, target);
    const updated = [...guesses, { station: guess, distance: hint.distance, direction: hint.direction, correct: false }];
    setGuesses(updated);
    setGuessId(null);
    setFeedbackPulse((previous) => previous + 1);
    setGuessFeedback("wrong");
    if (updated.length >= maxGuesses) setResult({ won: false, answer: target.name });
    if (updated.length >= maxGuesses) play.end(0, { won: false, guesses: updated.length, station: target.id, hint: hintShown });
  };

  const startNewGame = () => {
    setTarget(randomStation(target.id));
    setGuessId(null);
    setGuesses([]);
    setResult(null);
    setHintShown(false);
    setGuessFeedback(null);
  };

  const lineHint = target.lines.map((targetLine) => `${targetLine} Line`).join(" · ");

  return (
    <section className="stople-game" aria-label="Stople station guessing game">
      {result?.won && <ConfettiBurst key={target.id} />}
      <svg className="stople-map-decoration" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <g fill="none" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M-20 80 L760 860" stroke="#00843D" />
          <path d="M-20 416 L1000 110" stroke="#ED8B00" />
          <path d="M-20 570 L1020 570" stroke="#003DA5" />
          <path d="M950 -50 L770 850" stroke="#DA291C" />
        </g>
        <g fill="#e7e5d8" strokeWidth="5">
          <circle cx="100" cy="200" r="12" stroke="#00843D" />
          <circle cx="350" cy="450" r="12" stroke="#00843D" />
          <circle cx="600" cy="700" r="12" stroke="#00843D" />
          <circle cx="100" cy="380" r="12" stroke="#ED8B00" />
          <circle cx="400" cy="290" r="12" stroke="#ED8B00" />
          <circle cx="700" cy="200" r="12" stroke="#ED8B00" />
          <circle cx="150" cy="570" r="12" stroke="#003DA5" />
          <circle cx="500" cy="570" r="12" stroke="#003DA5" />
          <circle cx="850" cy="570" r="12" stroke="#003DA5" />
          <circle cx="920" cy="100" r="12" stroke="#DA291C" />
          <circle cx="860" cy="400" r="12" stroke="#DA291C" />
          <circle cx="800" cy="700" r="12" stroke="#DA291C" />
        </g>
      </svg>
      <header className="stople-toolbar">
        <div className="stople-actions" role="group" aria-label="Game actions">
          <button type="button" onClick={startNewGame}>New game</button>
          <button type="button" onClick={() => setHintShown(true)} disabled={hintShown || Boolean(result)} aria-pressed={hintShown}>Hint</button>
        </div>
        <div key={feedbackPulse} className={`stople-retries${guessFeedback ? ` stople-retries-${guessFeedback}` : ""}`} role="status" aria-live="polite">
          <strong>{guessesLeft}</strong> {guessesLeft === 1 ? "guess" : "guesses"} left
        </div>
      </header>

      <div className="stople-content">
        <h1 className="stople-title">Stople</h1>
        <form className="stople-entry" onSubmit={(event) => { event.preventDefault(); submitGuess(); }}>
          <label htmlFor="stople-station-search" className="sr-only">Search MBTA stations</label>
          <div>
            <StationSearch
              selectedId={guessId}
              excludedIds={guesses.map((entry) => entry.station.id)}
              disabled={Boolean(result)}
              onSelect={(id) => {
                setGuessId(id);
                setGuessFeedback(null);
              }}
            />
            <button type="submit" disabled={!guessId || Boolean(result)}>Submit</button>
          </div>
        </form>

        {hintShown && !result && <p className="stople-hint" role="status">Line: {lineHint}</p>}

        <section className="stople-guesses" aria-label="Guess results" aria-live="polite">
          <div className="stople-guess-heading"><span>Guesses</span><span>{guesses.length} / {maxGuesses}</span></div>
          <div className="stople-results-list">
            {guesses.length === 0 ? <p className="stople-empty">Station, distance, and direction appear here.</p> : [...guesses].reverse().map((entry, index) => (
              <div className={`stople-guess-row${entry.correct ? " correct" : ""}`} key={`${entry.station.id}-${index}`}>
                <strong>{entry.station.name}</strong>
                <span>{entry.correct ? "0.00 mi" : `${entry.distance} mi`}</span>
                <b>{entry.direction}</b>
              </div>
            ))}
            {result && <p className={`stople-answer${result.won ? " won" : " lost"}`} role="status">{result.won ? "Correct" : "Station"}: <strong>{result.answer}</strong></p>}
          </div>
        </section>
      </div>
    </section>
  );
}

function StationSearch({ selectedId, excludedIds, disabled, onSelect }: { selectedId: string | null; excludedIds: string[]; disabled: boolean; onSelect: (id: string | null) => void }) {
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const selectedStation = TRANSIT_STATIONS.find((station) => station.id === selectedId);
  const suggestions = useMemo(() => {
    const query = normalizeName(search);
    if (!query) return [];
    return TRANSIT_STATIONS
      .filter((station) => !excludedIds.includes(station.id))
      .map((station) => {
        const name = normalizeName(station.name);
        const words = name.split(" ");
        const distance = Math.min(editDistance(query, name), ...words.map((word) => editDistance(query, word)));
        const threshold = Math.max(1, Math.floor(query.length * 0.35));
        const startsWith = name.startsWith(query);
        const contains = name.includes(query);
        return { station, score: contains ? (startsWith ? 0 : 1) : 2 + distance, matches: contains || distance <= threshold };
      })
      .filter((entry) => entry.matches)
      .sort((a, b) => a.score - b.score || a.station.name.localeCompare(b.station.name))
      .slice(0, 5);
  }, [excludedIds, search]);

  const chooseStation = (station: TransitStation) => {
    onSelect(station.id);
    setSearch(station.name);
    setSearchOpen(false);
  };

  return (
    <div className="stople-search-wrap">
      <input
        id="stople-station-search"
        type="search"
        role="combobox"
        aria-label="Search MBTA stations"
        aria-autocomplete="list"
        aria-expanded={searchOpen && suggestions.length > 0}
        aria-controls="stople-station-results"
        autoComplete="off"
        disabled={disabled}
        value={searchOpen ? search : selectedStation?.name ?? ""}
        placeholder="Search station…"
        onChange={(event) => {
          setSearch(event.target.value);
          setSearchOpen(true);
          onSelect(null);
        }}
        onFocus={() => {
          setSearch("");
          setSearchOpen(true);
        }}
        onBlur={() => setSearchOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && suggestions[0]) {
            event.preventDefault();
            chooseStation(suggestions[0].station);
          }
          if (event.key === "Escape") setSearchOpen(false);
        }}
      />
      {searchOpen && suggestions.length > 0 && !disabled && (
        <ul id="stople-station-results" role="listbox" className="stople-search-results">
          {suggestions.map(({ station }) => (
            <li key={station.id} role="option" aria-selected={selectedId === station.id}>
              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => chooseStation(station)}>
                {station.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {searchOpen && search.trim() && suggestions.length === 0 && !disabled && <p className="stople-no-results">No stations found</p>}
    </div>
  );
}
