import type { GameId } from "@/app/_data/game-catalog";

export default function GameArtwork({ game }: { game: GameId }) {
  return (
    <span className={`game-art game-art-${game}`} aria-hidden="true">
      {game === "turf-wars" && <><i className="map-river" /><i className="map-route route-a" /><i className="map-route route-b" /><b>T</b></>}
      {game === "t-guesser" && <><i className="t-guesser-map" /><i className="t-guesser-route" /><i className="t-guesser-pin" /><b className="t-guesser-question">?</b></>}
      {game === "stople" && <><i className="stople-board"><b>T</b><b /><b>A</b><b /><b /></i><i className="stople-sign">STATION?</i></>}
      {game === "charlie-run" && <><i className="runner-track" /><i className="runner-charlie">🏃</i><i className="runner-train">🚇</i><b>$</b></>}
    </span>
  );
}
