import GeoGuessrGame, { type GameDifficulty } from "./GeoGuessrGame";
import { Suspense } from "react";

export const metadata = {
  title: "GeoGuessr | T Games",
  description: "Find the MBTA station closest to the pictured place.",
};

const difficultyAliases: Record<string, GameDifficulty> = {
  easy: "easy",
  medium: "medium",
  hard: "hard",
  extreme: "extreme",
  green: "easy",
  orange: "medium",
  blue: "hard",
  red: "extreme",
};

type GeoGuessrPageProps = {
  searchParams: Promise<{ difficulty?: string | string[] }>;
};

export default function GeoGuessrPage(props: GeoGuessrPageProps) {
  return (
    <Suspense fallback={<main className="fixed inset-0 grid place-items-center bg-[#07111c] text-white">Loading GeoGuessr…</main>}>
      <GameFromQuery {...props} />
    </Suspense>
  );
}

async function GameFromQuery({ searchParams }: GeoGuessrPageProps) {
  const query = (await searchParams).difficulty;
  const requestedDifficulty = Array.isArray(query) ? query[0] : query;
  const difficulty = difficultyAliases[requestedDifficulty?.toLowerCase() ?? ""] ?? "easy";

  return <GeoGuessrGame key={difficulty} difficulty={difficulty} />;
}
