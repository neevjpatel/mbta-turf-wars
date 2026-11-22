import GameplayShell from "../_components/gameplay-shell";
import CharlieRunGame from "@/app/CharlieRunGame";

export default function CharlieRunPage() {
  return (
    <GameplayShell gameId="charlie-run">
      <CharlieRunGame />
    </GameplayShell>
  );
}
