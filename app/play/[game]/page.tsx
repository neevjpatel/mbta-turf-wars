import { notFound } from "next/navigation";
import { Suspense } from "react";
import GameplayView from "../../GameplayView";
import { GAMES, isGameId } from "../../gameConfig";

export function generateStaticParams() {
  return GAMES.map((game) => ({ game: game.id }));
}

async function GamePageContent({ params }: PageProps<"/play/[game]">) {
  const { game } = await params;
  if (!isGameId(game)) notFound();
  return <GameplayView gameId={game} />;
}

export default function GamePage(props: PageProps<"/play/[game]">) {
  return <Suspense fallback={<main className="utility-page"><p>Preparing game service…</p></main>}><GamePageContent {...props} /></Suspense>;
}
