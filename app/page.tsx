"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import CharlieRunGame from "./CharlieRunGame";
import {
  GEOGUESSR_SCENES,
  GeoScene,
  getStationHint,
  INITIAL_STOPS,
  LINE_DIFFICULTIES,
  SCHOOL_COLORS,
  StopData,
  TransitLine,
  TRIVIA_BANK,
  TriviaItem,
  GameMode,
} from "./mbtaData";

const BostonMap = dynamic(() => import("./BostonMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-slate-400">
      Loading live Boston MBTA command map...
    </div>
  ),
});

export default function Home() {
  const [selectedSchool, setSelectedSchool] = useState("BU");
  const [lineFilter, setLineFilter] = useState<string>("ALL");
  const [preferredMode, setPreferredMode] = useState<GameMode>("charlierun");
  const [isDelayed, setIsDelayed] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState<string[]>([]);

  const [activeStop, setActiveStop] = useState<StopData | null>(null);
  const [activeMode, setActiveMode] = useState<GameMode>("charlierun");
  const [feedback, setFeedback] = useState<string | null>(null);

  const [currentTrivia, setCurrentTrivia] = useState<TriviaItem>(TRIVIA_BANK[0]);

  const [worldleTarget, setWorldleTarget] = useState<StopData>(INITIAL_STOPS[0]);
  const [worldleGuessId, setWorldleGuessId] = useState<string>(INITIAL_STOPS[0].id);
  const [worldleHistory, setWorldleHistory] = useState<
    { name: string; distance: string; direction: string; sameLine: boolean }[]
  >([]);

  const [currentGeo, setCurrentGeo] = useState<GeoScene>(GEOGUESSR_SCENES[0]);

  const [claimedStopTrigger, setClaimedStopTrigger] = useState<{
    stopId: string;
    school: string;
    pointsAdded: number;
  } | null>(null);

  const [activityFeed, setActivityFeed] = useState<string[]>([
    "BU won Charlie Run at Kenmore (Green • +45 pts)",
    "Northeastern captured Ruggles (Orange • Med • +25 pts)",
    "MIT captured Kendall/MIT (Red • Expert • +60 pts)",
  ]);

  const [scores, setScores] = useState<Record<string, number>>({
    BU: 140,
    Northeastern: 135,
    MIT: 150,
    Harvard: 120,
    BC: 105,
  });

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch(
          "https://api-v3.mbta.com/alerts?filter[route_type]=0,1&filter[lifecycle]=NEW,ONGOING"
        );
        const json = await res.json();
        const headlines = (json.data || [])
          .slice(0, 3)
          .map((alert: { attributes?: { short_header?: string } }) => alert.attributes?.short_header)
          .filter((h: string | undefined): h is string => Boolean(h));
        setLiveAlerts(headlines);
      } catch (err) {
        console.error("Failed to fetch MBTA alerts:", err);
      }
    };
    fetchAlerts();
  }, []);

  const setupChallengeForStop = (stop: StopData, mode: GameMode) => {
    const difficulty = LINE_DIFFICULTIES[stop.line].difficulty;
    setFeedback(null);
    setActiveMode(mode);

    const matchingTrivia = TRIVIA_BANK.filter((t) => t.difficulty === difficulty);
    const triviaPool = matchingTrivia.length > 0 ? matchingTrivia : TRIVIA_BANK;
    setCurrentTrivia(triviaPool[Math.floor(Math.random() * triviaPool.length)]);

    const randomTarget =
      INITIAL_STOPS[Math.floor(Math.random() * INITIAL_STOPS.length)];
    setWorldleTarget(randomTarget);
    setWorldleHistory([]);
    setWorldleGuessId(INITIAL_STOPS[0].id);

    const matchingGeo = GEOGUESSR_SCENES.filter((g) => g.difficulty === difficulty);
    const geoPool = matchingGeo.length > 0 ? matchingGeo : GEOGUESSR_SCENES;
    setCurrentGeo(geoPool[Math.floor(Math.random() * geoPool.length)]);
  };

  const handleStartClaim = (stop: StopData) => {
    setActiveStop(stop);
    setupChallengeForStop(stop, preferredMode);
  };

  const handleSwitchModalMode = (mode: GameMode) => {
    if (!activeStop) return;
    setupChallengeForStop(activeStop, mode);
  };

  const completeCapture = (customPoints?: number, captureOwnership = true) => {
    if (!activeStop) return;
    const cfg = LINE_DIFFICULTIES[activeStop.line];
    const earned = customPoints ?? cfg.basePoints * (isDelayed ? 3 : 1);

    setScores((prev) => ({
      ...prev,
      [selectedSchool]: (prev[selectedSchool] || 0) + earned,
    }));

    if (captureOwnership) {
      setClaimedStopTrigger({
        stopId: activeStop.id,
        school: selectedSchool,
        pointsAdded: earned,
      });
    }

    const modeLabel =
      activeMode === "charlierun"
        ? "Charlie Run"
        : activeMode === "trivia"
        ? "Trivia"
        : activeMode === "worldle"
        ? "T-Worldle"
        : "GeoGuessr";

    setActivityFeed((prev) => [
      `${selectedSchool} ${captureOwnership ? "captured" : "scored at"} ${
        activeStop.name
      } in ${modeLabel} (+${earned} pts${isDelayed ? " 🔥" : ""})`,
      ...prev.slice(0, 4),
    ]);

    setActiveStop(null);
  };

  const handleWorldleGuess = () => {
    if (!activeStop) return;
    const cfg = LINE_DIFFICULTIES[activeStop.line];
    const guessedStop = INITIAL_STOPS.find((s) => s.id === worldleGuessId);
    if (!guessedStop) return;

    if (guessedStop.id === worldleTarget.id) {
      completeCapture();
      return;
    }

    const hint = getStationHint(guessedStop, worldleTarget);
    const nextHistory = [
      ...worldleHistory,
      {
        name: guessedStop.name,
        distance: hint.distance,
        direction: hint.direction,
        sameLine: hint.sameLine,
      },
    ];
    setWorldleHistory(nextHistory);

    if (nextHistory.length >= cfg.maxWorldleGuesses) {
      setFeedback(
        `Out of guesses! The mystery stop was ${worldleTarget.name}. New target loaded!`
      );
      setTimeout(() => {
        setupChallengeForStop(activeStop, "worldle");
      }, 1500);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white p-4 md:p-6 flex flex-col gap-4">
      <header className="flex flex-wrap justify-between items-center bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-lg gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 via-blue-500 to-red-500 flex items-center justify-center text-2xl shadow-md">
            🏃
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Charlie Run • MBTA Turf Wars
            </h1>
            <p className="text-xs text-slate-400">
              Outrun the T, grab Charlie Coins ($), and capture Boston stations
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mr-1">
            Team:
          </span>
          {["BU", "Northeastern", "MIT", "Harvard", "BC"].map((school) => (
            <button
              key={school}
              onClick={() => setSelectedSchool(school)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                selectedSchool === school
                  ? "bg-white text-slate-950 shadow-md scale-105"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: SCHOOL_COLORS[school] }}
              />
              {school}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        <div className="xl:col-span-6 bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase text-slate-400 px-1">
            Mode:
          </span>
          {[
            { id: "charlierun", label: "🏃 Charlie Run" },
            { id: "trivia", label: "🧠 Trivia" },
            { id: "worldle", label: "🧭 T-Worldle" },
            { id: "geoguessr", label: "📸 GeoGuessr" },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setPreferredMode(m.id as GameMode)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                preferredMode === m.id
                  ? "bg-sky-500 text-slate-950 shadow"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="xl:col-span-6 bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase text-slate-400 px-1">
            Line Difficulty:
          </span>
          <button
            onClick={() => setLineFilter("ALL")}
            className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer ${
              lineFilter === "ALL"
                ? "bg-slate-200 text-slate-950"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            All
          </button>
          {(["Green", "Orange", "Blue", "Red"] as TransitLine[]).map((line) => {
            const cfg = LINE_DIFFICULTIES[line];
            return (
              <button
                key={line}
                onClick={() => setLineFilter(line)}
                className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer text-white flex items-center gap-1 ${
                  lineFilter === line ? "ring-2 ring-white" : "opacity-85 hover:opacity-100"
                }`}
                style={{ backgroundColor: cfg.color }}
              >
                <span>{line}</span>
                <span className="bg-black/30 px-1 rounded text-[10px]">
                  {cfg.difficulty}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-900/70 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-3 text-xs">
        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold shrink-0">
          LIVE MBTA FEED
        </span>
        <p className="text-slate-300 truncate">
          {liveAlerts.length > 0
            ? liveAlerts.join("  •  ")
            : "All subway lines operating normally • Trigger Delay Surge below for 3x Charlie Coins & points."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1">
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between gap-4 shadow-xl">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-200 mb-3">
              🏆 Campus Leaderboard
            </h2>
            <div className="space-y-2">
              {Object.entries(scores)
                .sort(([, a], [, b]) => b - a)
                .map(([school, score], index) => (
                  <div
                    key={school}
                    className={`flex justify-between items-center p-2.5 rounded-xl border ${
                      school === selectedSchool
                        ? "bg-slate-800 border-slate-600"
                        : "bg-slate-800/50 border-slate-800"
                    }`}
                  >
                    <span className="font-bold text-sm flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-4">
                        #{index + 1}
                      </span>
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: SCHOOL_COLORS[school] }}
                      />
                      {school}
                    </span>
                    <span className="font-mono font-extrabold text-amber-400 text-sm">
                      {score} pts
                    </span>
                  </div>
                ))}
            </div>

            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-5 mb-2">
              Recent Activity
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {activityFeed.map((item, i) => (
                <li
                  key={i}
                  className="bg-slate-950/70 px-2.5 py-2 rounded-lg border border-slate-800"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-amber-950/50 to-slate-900 border border-amber-500/40 p-3.5 rounded-xl">
            <p className="text-xs font-extrabold text-amber-300 uppercase mb-1">
              ⚡ Delay Surge Simulator
            </p>
            <p className="text-[11px] text-slate-300 mb-3">
              Simulate an MBTA delay to triple all Charlie Coins ($) & station rewards.
            </p>
            <button
              onClick={() => setIsDelayed(!isDelayed)}
              className={`w-full py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                isDelayed
                  ? "bg-amber-400 text-slate-950 animate-pulse"
                  : "bg-slate-800 text-amber-300 border border-amber-500/50 hover:bg-slate-700"
              }`}
            >
              {isDelayed
                ? "🚨 DELAY ACTIVE: 3X POINTS!"
                : "Trigger T Delay Surge (3x)"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-3 h-[600px] bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden relative shadow-xl">
          <BostonMap
            selectedSchool={selectedSchool}
            isDelayed={isDelayed}
            onStartClaim={handleStartClaim}
            claimedStopTrigger={claimedStopTrigger}
            lineFilter={lineFilter}
          />
        </div>
      </div>

      {activeStop && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl">
            {(() => {
              const cfg = LINE_DIFFICULTIES[activeStop.line];
              const reward = cfg.basePoints * (isDelayed ? 3 : 1);

              return (
                <>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: cfg.color }}
                    >
                      {activeStop.line} Line • {cfg.difficulty}
                    </span>
                    <span className="text-xs font-extrabold text-amber-400">
                      Base: +{reward} pts {isDelayed ? "🔥" : ""}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-white mb-2.5">
                    Challenge: {activeStop.name}
                  </h3>

                  <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 mb-4">
                    {[
                      { id: "charlierun", label: "🏃 Run" },
                      { id: "trivia", label: "🧠 Trivia" },
                      { id: "worldle", label: "🧭 Worldle" },
                      { id: "geoguessr", label: "📸 Geo" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => handleSwitchModalMode(tab.id as GameMode)}
                        className={`py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                          activeMode === tab.id
                            ? "bg-white text-slate-950 shadow"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {activeMode === "charlierun" && (
                    <CharlieRunGame
                      stationName={activeStop.name}
                      line={activeStop.line}
                      isDelayed={isDelayed}
                      selectedSchool={selectedSchool}
                      onCompleteRun={(earned, captured) =>
                        completeCapture(earned, captured)
                      }
                    />
                  )}

                  {activeMode === "trivia" && (
                    <div className="space-y-2.5">
                      <p className="text-sm font-semibold text-slate-200 mb-3">
                        {currentTrivia.question}
                      </p>
                      {currentTrivia.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() =>
                            opt === currentTrivia.answer
                              ? completeCapture()
                              : setFeedback("Not quite! Try another answer.")
                          }
                          className="w-full text-left px-4 py-3 rounded-xl bg-slate-800 hover:bg-sky-600 transition text-sm font-semibold cursor-pointer border border-slate-700"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeMode === "worldle" && (
                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                        <span>Guess the mystery MBTA station!</span>
                        <span className="font-bold text-slate-200">
                          Guesses: {worldleHistory.length} / {cfg.maxWorldleGuesses}
                        </span>
                      </div>

                      <div className="flex gap-2 mb-3">
                        <select
                          value={worldleGuessId}
                          onChange={(e) => setWorldleGuessId(e.target.value)}
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-white"
                        >
                          {INITIAL_STOPS.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.name} ({st.line} Line)
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleWorldleGuess}
                          className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs uppercase cursor-pointer"
                        >
                          Guess
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-44 overflow-y-auto">
                        {worldleHistory.length === 0 && (
                          <p className="text-xs text-slate-500 text-center py-4 bg-slate-950/60 rounded-xl border border-slate-800">
                            Pick any T station above for distance & direction hints.
                          </p>
                        )}
                        {worldleHistory.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-xs"
                          >
                            <span className="font-bold text-white">{item.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-amber-300 font-mono font-bold">
                                {item.distance} mi
                              </span>
                              <span className="bg-slate-800 px-2 py-0.5 rounded font-bold text-sky-300">
                                {item.direction}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeMode === "geoguessr" && (
                    <div>
                      <div
                        className={`rounded-xl p-4 bg-gradient-to-br ${currentGeo.visualGradient} border border-white/15 mb-3`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase tracking-widest font-bold text-white/70">
                            📸 Street Exit View
                          </span>
                          <span className="text-2xl">{currentGeo.landmarkEmoji}</span>
                        </div>
                        <h4 className="font-extrabold text-base text-white mb-1">
                          {currentGeo.sceneTitle}
                        </h4>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {currentGeo.sceneDescription}
                        </p>
                      </div>

                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 mb-3">
                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                          Intel Clues ({cfg.geoHintsShown} unlocked):
                        </p>
                        <ul className="text-xs text-slate-300 space-y-1">
                          {currentGeo.clues
                            .slice(0, cfg.geoHintsShown)
                            .map((clue, idx) => (
                              <li key={idx}>• {clue}</li>
                            ))}
                        </ul>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {currentGeo.choices.map((choice) => (
                          <button
                            key={choice}
                            onClick={() =>
                              choice === currentGeo.targetStop
                                ? completeCapture()
                                : setFeedback("Wrong exit! Look closely at the landmarks.")
                            }
                            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-emerald-600 text-xs font-bold text-white border border-slate-700 cursor-pointer transition"
                          >
                            🚉 {choice}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {feedback && (
                    <p className="text-xs text-amber-400 mt-3 font-bold text-center">
                      {feedback}
                    </p>
                  )}

                  <div className="mt-4 flex justify-between items-center border-t border-slate-800 pt-2.5">
                    <span className="text-[11px] text-slate-500">
                      Playing for <b>{selectedSchool}</b>
                    </span>
                    <button
                      onClick={() => setActiveStop(null)}
                      className="text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </main>
  );
}
import TrainExperience from "./TrainExperience";

export default function Home() {
  return <TrainExperience />;
}
