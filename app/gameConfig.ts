import { DIFFICULTY_DESTINATIONS, GAME_LABELS, gameRoute } from "./gameModel.mjs";

export type DifficultyId = "easy" | "medium" | "hard" | "extreme";
export type GameId = "turf" | "signal" | "charlie" | "charlierun";

export const DIFFICULTIES = {
  easy: { label: "Easy", line: "Green Line", code: "G", ...DIFFICULTY_DESTINATIONS.easy },
  medium: { label: "Medium", line: "Blue Line", code: "B", ...DIFFICULTY_DESTINATIONS.medium },
  hard: { label: "Hard", line: "Orange Line", code: "O", ...DIFFICULTY_DESTINATIONS.hard },
  extreme: { label: "Extreme", line: "Red Line", code: "R", ...DIFFICULTY_DESTINATIONS.extreme },
} satisfies Record<DifficultyId, { label: string; line: string; lineShort: string; color: string; code: string; destination: string }>;

export const GAMES = [
  {
    id: "turf",
    name: GAME_LABELS.turf,
    shortName: "Turf Wars",
    subtitle: "Campus territory strategy",
    description: "Capture real transit stops, answer MBTA trivia, and lead your campus across Boston.",
    instructions: "Choose a campus, select a station on the live map, and answer its trivia challenge.",
    route: gameRoute("turf"),
    availability: "playable",
  },
  {
    id: "signal",
    name: GAME_LABELS.signal,
    shortName: "Guess the T",
    subtitle: "MBTA photo guessing game",
    description: "Use real Boston location photos and the map to identify the closest MBTA station.",
    instructions: "Choose the nearest station on the map and submit your guess.",
    route: gameRoute("signal"),
    availability: "playable",
  },
  {
    id: "charlie",
    name: GAME_LABELS.charlie,
    shortName: "Stationle",
    subtitle: "MBTA station guessing game",
    description: "Use route, neighborhood, and station clues to identify a mystery stop in a Worldle-inspired challenge.",
    instructions: "Guess the mystery station using distance and direction clues.",
    route: gameRoute("charlie"),
    availability: "playable",
  },
  {
    id: "charlierun",
    name: GAME_LABELS.charlierun,
    shortName: "Charlie Run",
    subtitle: "Endless MBTA runner",
    description: "Dodge the T, collect Charlie Coins, and earn a station capture for your campus.",
    instructions: "Choose your campus and station, then use the controls to outrun the train.",
    route: gameRoute("charlierun"),
    availability: "playable",
  },
] as const;

export type GameDefinition = (typeof GAMES)[number];

export function isGameId(value: string | null): value is GameId {
  return GAMES.some((game) => game.id === value);
}

