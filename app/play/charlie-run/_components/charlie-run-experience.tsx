"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { usePlay } from "@/app/_stats/player";

const CharlieRunScene = dynamic(() => import("./charlie-run-scene"), {
  ssr: false,
  loading: () => <section className="charlie-run-scene" aria-label="Charlie Run loading" />,
});

type RunResult = { score: number; distance: number; coins: number };

export default function CharlieRunExperience() {
  const play = usePlay("charlie-run");
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [coins, setCoins] = useState(0);
  const [result, setResult] = useState<RunResult | null>(null);

  useEffect(() => play.start(), [play]);

  const finishRun = useCallback((runResult: RunResult) => {
    setResult(runResult);
    play.end(runResult.score, {
      distance_m: runResult.distance,
      coins: runResult.coins,
      credits: runResult.score / 20,
    });
  }, [play]);

  const updateHud = useCallback((nextScore: number, nextDistance: number, nextCoins: number) => {
    setScore(nextScore);
    setDistance(nextDistance);
    setCoins(nextCoins);
  }, []);

  return (
    <div className="charlie-run-game">
      <CharlieRunScene onScoreChange={updateHud} onGameOver={finishRun} />
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
            <p className="charlie-run-credit-result">Final credit <strong>{(result.score / 20).toFixed(2)}</strong></p>
            <button type="button" onClick={() => window.location.reload()}>Run again</button>
          </section>
        </div>
      )}
    </div>
  );
}
