import GameplayShell from "../_components/gameplay-shell";
import CharlieRunGame from "./_components/charlie-run-experience";

export default function CharlieRunPage() {
  return (
    <GameplayShell gameId="charlie-run">
      <CharlieRunGame />
    </GameplayShell>
  );
}
