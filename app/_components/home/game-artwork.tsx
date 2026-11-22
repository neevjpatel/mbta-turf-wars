import Image from "next/image";
import type { GameId } from "@/app/_data/game-catalog";

const THUMBNAILS: Record<GameId, string> = {
  "turf-wars": "/games/thumbnails/turf_wars_boston_transit_showdown.png",
  "t-guesser": "/games/thumbnails/mbta_mystery_map_challenge.png",
  stople: "/games/thumbnails/boston_subway_stop_03_puzzle.png",
  "charlie-run": "/games/thumbnails/boston_mbta_runner_adventure.png",
};

export default function GameArtwork({ game }: { game: GameId }) {
  return (
    <span className={`game-art game-art-${game}`} aria-hidden="true">
      <Image
        className="game-thumbnail"
        src={THUMBNAILS[game]}
        alt=""
        fill
        sizes="(max-width: 1450px) 40vw, 42vw"
      />
    </span>
  );
}
