import GameplayShell from "../_components/gameplay-shell";
import TurfWarsGame from "./_components/turf-wars-game";

export default function TurfWarsPage() {
  return <GameplayShell gameId="turf-wars"><TurfWarsGame isActive /></GameplayShell>;
}
