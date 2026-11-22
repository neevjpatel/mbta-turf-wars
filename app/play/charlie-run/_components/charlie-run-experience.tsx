"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { useAppState } from "@/app/_state/app-state";
import type { DifficultyId } from "@/app/_data/game-catalog";
import { usePlay } from "@/app/_stats/player";

const CharlieRunScene = dynamic(() => import("./charlie-run-scene"), {
  ssr: false,
  loading: () => <section className="charlie-run-scene" aria-label="Charlie Run loading" />,
});

type RunStats = { score: number; distance: number; coins: number };
type RunResult = RunStats & { points: number };
const RUN_SPEED: Record<DifficultyId, number> = { easy: 15, medium: 30, hard: 50, extreme: 80 };

export default function CharlieRunExperience() {
  const { difficulty } = useAppState();
  return <CharlieRunRun key={difficulty} difficulty={difficulty} />;
}

function CharlieRunRun({ difficulty }: { difficulty: DifficultyId }) {
  const play = usePlay("charlie-run");
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [coins, setCoins] = useState(0);
  const [result, setResult] = useState<RunResult | null>(null);

  useEffect(() => play.start(), [play]);

  const finishRun = useCallback((runStats: RunStats) => {
    const runResult = { ...runStats, points: Math.round(runStats.score / 20) };
    setResult(runResult);
    play.end(runResult.points, {
      run_score: runResult.score,
      distance_m: runResult.distance,
      coins: runResult.coins,
    });
  }, [play]);

  const updateHud = useCallback((nextScore: number, nextDistance: number, nextCoins: number) => {
    setScore(nextScore);
    setDistance(nextDistance);
    setCoins(nextCoins);
  }, []);

  return (
    <div className="charlie-run-game">
      <CharlieRunScene speed={RUN_SPEED[difficulty]} onScoreChange={updateHud} onGameOver={finishRun} />
      <div className="charlie-run-score" aria-live="polite" aria-atomic="true">
        <strong>SCORE&nbsp; {score.toLocaleString()}</strong>
        <span>{distance.toLocaleString()} m&nbsp; · &nbsp;{coins} coins</span>
      </div>
      {result && (
        <div className="charlie-run-result-backdrop">
          <section className="charlie-run-result" role="dialog" aria-modal="true" aria-labelledby="charlie-run-result-title">
            <p className="charlie-run-result-kicker">End of run</p>
            <h2 id="charlie-run-result-title">Run over</h2>
            <p>Score <strong>{result.score.toLocaleString()}</strong></p>
            <p>Distance <strong>{result.distance.toLocaleString()} m</strong></p>
            <p>Coins <strong>{result.coins}</strong></p>
            <p className="charlie-run-points-result">Points awarded <strong>{result.points}</strong></p>
            <button type="button" onClick={() => window.location.reload()}>Run again</button>
          </section>
        </div>
      )}
    </div>
  );
}
