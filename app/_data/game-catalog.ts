import { DIFFICULTY_DESTINATIONS, GAME_LABELS, gameRoute, type GameModelId } from "./game-model.mjs";

export type DifficultyId = "easy" | "medium" | "hard" | "extreme";
export type GameId = GameModelId;

export const DIFFICULTIES = {
  easy: { label: "Easy", line: "Green Line", code: "G", ...DIFFICULTY_DESTINATIONS.easy },
  medium: { label: "Medium", line: "Blue Line", code: "B", ...DIFFICULTY_DESTINATIONS.medium },
  hard: { label: "Hard", line: "Orange Line", code: "O", ...DIFFICULTY_DESTINATIONS.hard },
  extreme: { label: "Extreme", line: "Red Line", code: "R", ...DIFFICULTY_DESTINATIONS.extreme },
} satisfies Record<DifficultyId, { label: string; line: string; lineShort: string; color: string; code: string; destination: string }>;

export const GAMES = [
  {
    id: "turf-wars",
    name: GAME_LABELS["turf-wars"],
    shortName: "Turf Wars",
    subtitle: "Campus territory strategy",
    description: "Capture real transit stops, answer MBTA trivia, and lead your campus across Boston.",
    instructions: "Choose a campus, select a station on the live map, and answer its trivia challenge.",
    route: gameRoute("turf-wars"),
    availability: "playable",
  },
  {
    id: "guess-the-t",
    name: GAME_LABELS["guess-the-t"],
    shortName: "Guess the T",
    subtitle: "MBTA photo guessing game",
    description: "Use real Boston location photos and the map to identify the closest MBTA station.",
    instructions: "Choose the nearest station on the map and submit your guess.",
    route: gameRoute("guess-the-t"),
    availability: "playable",
  },
  {
    id: "stationle",
    name: GAME_LABELS.stationle,
    shortName: "Stationle",
    subtitle: "MBTA station guessing game",
    description: "Use route, neighborhood, and station clues to identify a mystery stop in a Wordle-inspired challenge.",
    instructions: "Guess the mystery station using distance and direction clues.",
    route: gameRoute("stationle"),
    availability: "playable",
  },
  {
    id: "charlie-run",
    name: GAME_LABELS["charlie-run"],
    shortName: "Charlie Run",
    subtitle: "Endless MBTA runner",
    description: "Dodge the T, collect Charlie Coins, and earn a station capture for your campus.",
    instructions: "Choose your campus and station, then use the controls to outrun the train.",
    route: gameRoute("charlie-run"),
    availability: "playable",
  },
] as const;

export type GameDefinition = (typeof GAMES)[number];

export function isGameId(value: string | null): value is GameId {
  return GAMES.some((game) => game.id === value);
}

