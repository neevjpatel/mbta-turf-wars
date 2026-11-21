"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useAppState } from "@/app/_state/app-state";
import { DIFFICULTIES, GAMES, type GameId } from "@/app/_data/game-catalog";

export default function GameplayShell({ gameId, children }: { gameId: GameId; children: ReactNode }) {
  const router = useRouter();
  const { difficulty, setSelectedGame } = useAppState();
  useEffect(() => setSelectedGame(gameId), [gameId, setSelectedGame]);
  const game = GAMES.find((entry) => entry.id === gameId)!;
  const difficultyConfig = DIFFICULTIES[difficulty];

  const leaveGame = () => {
    if ((gameId === "turf-wars" || gameId === "charlie-run")
      && !window.confirm("Exit this run and return to the station? Current unsaved progress will reset.")) return;
    router.push(`/?station=${gameId}`);
  };

  return (
    <main className="gameplay-shell" style={{ "--line-color": difficultyConfig.color, "--line-glow": `${difficultyConfig.color}66` } as CSSProperties}>
      <div className="gameplay-toolbar">
        <div><span className="line-badge" style={{ backgroundColor: difficultyConfig.color }}>{difficultyConfig.code}</span><span><strong>{game.name}</strong><small>{difficultyConfig.line} · {difficultyConfig.label}</small></span></div>
        <button type="button" className="exit-game-button" onClick={leaveGame}>Back to Station</button>
      </div>
      <div className="full-game-viewport">{children}</div>
    </main>
  );
}
