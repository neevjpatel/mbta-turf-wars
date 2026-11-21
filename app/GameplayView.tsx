"use client";

import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import CharlieRunExperience from "./CharlieRunExperience";
import GeoGuessrGame from "./geoguesser/GeoGuessrGame";
import StationleGame from "./StationleGame";
import TurfWarsGame from "./TurfWarsGame";
import { useAppState } from "./AppState";
import { DIFFICULTIES, GAMES, type GameId } from "./gameConfig";

export default function GameplayView({ gameId }: { gameId: GameId }) {
  const router = useRouter();
  const { difficulty, setSelectedGame } = useAppState();
  const game = GAMES.find((entry) => entry.id === gameId);
  const difficultyConfig = DIFFICULTIES[difficulty];

  const leaveGame = () => {
    if ((gameId === "turf" || gameId === "charlierun") && !window.confirm("Exit this run and return to the station? Current unsaved progress will reset.")) return;
    setSelectedGame(gameId);
    router.push(`/?station=${gameId}`);
  };

  if (!game || game.availability !== "playable") {
    return <main className="utility-page game-unavailable"><p className="eyebrow">Station unavailable</p><h1>Game service has not opened.</h1><button type="button" className="primary-action" onClick={leaveGame}>Back to Station</button></main>;
  }

  return (
    <main className="gameplay-shell" style={{ "--line-color": difficultyConfig.color, "--line-glow": `${difficultyConfig.color}66` } as CSSProperties}>
      <div className="gameplay-toolbar"><div><span className="line-badge" style={{ backgroundColor: difficultyConfig.color }}>{difficultyConfig.code}</span><span><strong>{game.name}</strong><small>{difficultyConfig.line} · {difficultyConfig.label}</small></span></div><button type="button" className="exit-game-button" onClick={leaveGame}>Back to Station</button></div>
      <div className="full-game-viewport">
        {gameId === "turf" && <TurfWarsGame difficulty={difficultyConfig} isActive />}
        {gameId === "signal" && <GeoGuessrGame key={difficulty} difficulty={difficulty} embedded onExit={leaveGame} />}
        {gameId === "charlie" && <StationleGame difficulty={difficulty} />}
        {gameId === "charlierun" && <CharlieRunExperience difficulty={difficulty} />}
      </div>
    </main>
  );
}
