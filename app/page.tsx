"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { BOSTON_TRIVIA, SCHOOL_COLORS, StopData } from "./mbtaData";

const BostonMap = dynamic(() => import("./BostonMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-slate-400">
      Loading live Boston MBTA map...
    </div>
  ),
});

export default function Home() {
  const [selectedSchool, setSelectedSchool] = useState("BU");
  const [isDelayed, setIsDelayed] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState<string[]>([]);
  const [activeTriviaStop, setActiveTriviaStop] = useState<StopData | null>(null);
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [triviaFeedback, setTriviaFeedback] = useState<string | null>(null);

  const [claimedStopTrigger, setClaimedStopTrigger] = useState<{
    stopId: string;
    school: string;
    pointsAdded: number;
  } | null>(null);

  const [activityFeed, setActivityFeed] = useState<string[]>([
    "BU captured Kenmore (+25 pts)",
    "Northeastern captured Ruggles (+25 pts)",
    "MIT captured Kendall/MIT (+25 pts)",
  ]);

  const [scores, setScores] = useState<Record<string, number>>({
    BU: 140,
    Northeastern: 135,
    MIT: 120,
    Harvard: 110,
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
          .map((alert: any) => alert.attributes.short_header)
          .filter(Boolean);

        setLiveAlerts(headlines);
      } catch (err) {
        console.error("Failed to fetch MBTA alerts:", err);
      }
    };

    fetchAlerts();
  }, []);

  const handleStartClaim = (stop: StopData) => {
    setTriviaFeedback(null);
    setTriviaIndex(Math.floor(Math.random() * BOSTON_TRIVIA.length));
    setActiveTriviaStop(stop);
  };

  const handleAnswerTrivia = (chosenOption: string) => {
    if (!activeTriviaStop) return;
    const currentQ = BOSTON_TRIVIA[triviaIndex];

    if (chosenOption === currentQ.answer) {
      const multiplier = isDelayed ? 3 : 1;
      const earned = 10 * multiplier;

      setScores((prev) => ({
        ...prev,
        [selectedSchool]: (prev[selectedSchool] || 0) + earned,
      }));

      setClaimedStopTrigger({
        stopId: activeTriviaStop.id,
        school: selectedSchool,
        pointsAdded: earned,
      });

      setActivityFeed((prev) => [
        `${selectedSchool} captured ${activeTriviaStop.name} (+${earned} pts${isDelayed ? " 🔥" : ""})`,
        ...prev.slice(0, 4),
      ]);

      setActiveTriviaStop(null);
    } else {
      setTriviaFeedback("Wrong answer! Try again to lock in your station capture.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-6 flex flex-col gap-4">
      <header className="flex flex-wrap justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">🚇 T-Line Turf Wars</h1>
          <p className="text-sm text-slate-400">
            Turn MBTA waits into campus territory. Delays = 3x points.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase text-slate-400 font-bold mr-1">Your Campus:</span>
          {["BU", "Northeastern", "MIT", "Harvard", "BC"].map((school) => (
            <button
              key={school}
              onClick={() => setSelectedSchool(school)}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition cursor-pointer flex items-center gap-1.5 ${
                selectedSchool === school
                  ? "bg-white text-slate-950 ring-2 ring-blue-400"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: SCHOOL_COLORS[school] }}
              />
              {school}
            </button>
          ))}
        </div>
      </header>

      <div className="bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-xl flex items-center gap-3 text-xs">
        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold shrink-0">
          LIVE MBTA FEED
        </span>
        <p className="text-slate-300 truncate">
          {liveAlerts.length > 0
            ? liveAlerts.join("  •  ")
            : "Subway lines running normally right now (use Judge Simulator below to test 3x delay bonuses)."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-5">
          <div>
            <h2 className="text-base font-bold mb-3">🏆 Campus Leaderboard</h2>
            <div className="space-y-2">
              {Object.entries(scores)
                .sort(([, a], [, b]) => b - a)
                .map(([school, score], index) => (
                  <div
                    key={school}
                    className="flex justify-between items-center bg-slate-800/80 p-2.5 rounded-lg"
                  >
                    <span className="font-semibold text-sm flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: SCHOOL_COLORS[school] }}
                      />
                      #{index + 1} {school}
                    </span>
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      {score} pts
                    </span>
                  </div>
                ))}
            </div>

            <h3 className="text-xs font-bold uppercase text-slate-400 mt-5 mb-2">
              Recent Turf Captures
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {activityFeed.map((item, i) => (
                <li
                  key={i}
                  className="bg-slate-950/60 px-2.5 py-1.5 rounded border border-slate-800/80"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-lg">
            <p className="text-xs font-bold text-amber-300 uppercase mb-1">
              ⚡ Judge Demo Simulator
            </p>
            <p className="text-xs text-slate-300 mb-3">
              Simulate an MBTA signal delay to trigger the 3x Delay Multiplier.
            </p>
            <button
              onClick={() => setIsDelayed(!isDelayed)}
              className={`w-full py-2 rounded-lg font-bold text-sm transition cursor-pointer ${
                isDelayed
                  ? "bg-amber-500 text-black animate-pulse"
                  : "bg-slate-800 text-amber-400 border border-amber-500/50 hover:bg-slate-700"
              }`}
            >
              {isDelayed ? "🚨 DELAY ACTIVE: 3X POINTS!" : "Simulate T Delay (3x)"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-3 h-[580px] bg-slate-900 rounded-xl border border-slate-800 overflow-hidden relative">
          <BostonMap
            selectedSchool={selectedSchool}
            isDelayed={isDelayed}
            onStartClaim={handleStartClaim}
            claimedStopTrigger={claimedStopTrigger}
          />
        </div>
      </div>

      {activeTriviaStop && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <span className="text-xs font-bold uppercase text-blue-400">
              Station Check-In Challenge • {activeTriviaStop.name}
            </span>
            <h3 className="text-lg font-bold mt-1 mb-4">
              {BOSTON_TRIVIA[triviaIndex].question}
            </h3>

            <div className="space-y-2">
              {BOSTON_TRIVIA[triviaIndex].options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswerTrivia(option)}
                  className="w-full text-left px-4 py-3 rounded-xl bg-slate-800 hover:bg-blue-600 transition text-sm font-medium cursor-pointer"
                >
                  {option}
                </button>
              ))}
            </div>

            {triviaFeedback && (
              <p className="text-xs text-red-400 mt-3 font-semibold">{triviaFeedback}</p>
            )}

            <button
              onClick={() => setActiveTriviaStop(null)}
              className="mt-4 text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}