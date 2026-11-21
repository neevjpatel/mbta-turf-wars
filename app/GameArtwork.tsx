import type { GameId } from "./gameConfig";

export default function GameArtwork({ game }: { game: GameId }) {
  return (
    <span className={`game-art game-art-${game}`} aria-hidden="true">
      {game === "turf" && <><i className="map-river" /><i className="map-route route-a" /><i className="map-route route-b" /><b>T</b></>}
      {game === "signal" && <><i className="guesser-map" /><i className="guesser-route" /><i className="guesser-pin" /><b className="guesser-question">?</b></>}
      {game === "charlie" && <><i className="stationle-board"><b>T</b><b /><b>A</b><b /><b /></i><i className="stationle-sign">STATION?</i></>}
      {game === "charlierun" && <><i className="runner-track" /><i className="runner-charlie">🏃</i><i className="runner-train">🚇</i><b>$</b></>}
    </span>
  );
}
