import type { GameId } from "./gameConfig";

export default function GameArtwork({ game }: { game: GameId }) {
  return (
    <span className={`game-art game-art-${game}`} aria-hidden="true">
      {game === "turf" && <><i className="map-river" /><i className="map-route route-a" /><i className="map-route route-b" /><b>T</b></>}
      {game === "signal" && <><i className="signal-post" /><i className="signal-lamp red" /><i className="signal-lamp amber" /><i className="signal-lamp green" /></>}
      {game === "charlie" && <><i className="charlie-card" /><i className="gate-arm" /></>}
    </span>
  );
}
