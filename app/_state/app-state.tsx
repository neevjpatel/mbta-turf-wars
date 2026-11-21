"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { DifficultyId, GameId } from "@/app/_data/game-catalog";

type AppStateValue = {
  difficulty: DifficultyId;
  setDifficulty: (difficulty: DifficultyId) => void;
  muted: boolean;
  setMuted: (muted: boolean) => void;
  selectedGame: GameId;
  setSelectedGame: (game: GameId) => void;
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [difficulty, setDifficultyState] = useState<DifficultyId>("medium");
  const [muted, setMutedState] = useState(true);
  const [selectedGame, setSelectedGameState] = useState<GameId>("turf-wars");

  useEffect(() => {
    const savedDifficulty = window.localStorage.getItem("mbta-difficulty") as DifficultyId | null;
    const savedMuted = window.localStorage.getItem("mbta-muted");
    const hydrationTimer = window.setTimeout(() => {
      if (savedDifficulty && ["easy", "medium", "hard", "extreme"].includes(savedDifficulty)) setDifficultyState(savedDifficulty);
      if (savedMuted !== null) setMutedState(savedMuted === "true");
    }, 80);
    return () => window.clearTimeout(hydrationTimer);
  }, []);

  const setDifficulty = (value: DifficultyId) => {
    setDifficultyState(value);
    window.localStorage.setItem("mbta-difficulty", value);
  };
  const setMuted = (value: boolean) => {
    setMutedState(value);
    window.localStorage.setItem("mbta-muted", String(value));
  };
  const setSelectedGame = (value: GameId) => {
    setSelectedGameState(value);
  };

  const value = useMemo(() => ({ difficulty, setDifficulty, muted, setMuted, selectedGame, setSelectedGame }), [difficulty, muted, selectedGame]);
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppState must be used inside AppStateProvider");
  return context;
}
