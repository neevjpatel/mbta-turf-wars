import { DIFFICULTY_DESTINATIONS, gameRoute } from "./gameModel.mjs";

export type DifficultyId = "easy" | "medium" | "hard" | "extreme";
export type GameId = "turf" | "signal" | "charlie";

export const DIFFICULTIES = {
  easy: { label: "Easy", line: "Green Line", code: "G", ...DIFFICULTY_DESTINATIONS.easy },
  medium: { label: "Medium", line: "Blue Line", code: "B", ...DIFFICULTY_DESTINATIONS.medium },
  hard: { label: "Hard", line: "Orange Line", code: "O", ...DIFFICULTY_DESTINATIONS.hard },
  extreme: { label: "Extreme", line: "Red Line", code: "R", ...DIFFICULTY_DESTINATIONS.extreme },
} satisfies Record<DifficultyId, { label: string; line: string; lineShort: string; color: string; code: string; destination: string }>;

export const GAMES = [
  {
    id: "turf",
    name: "Turf Capture",
    shortName: "Turf Capture",
    subtitle: "Boston trivia strategy",
    description: "Answer Boston transit trivia, capture real MBTA stops, and lead your campus across the city.",
    instructions: "Choose a campus, select a station on the live map, then answer its trivia challenge.",
    route: gameRoute("turf"),
    availability: "playable",
  },
  {
    id: "signal",
    name: "Signal Scramble",
    shortName: "Signal",
    subtitle: "Railway switching challenge",
    description: "A future timing challenge built around signals, switches, and keeping Boston moving.",
    instructions: "This station is under construction; no gameplay has been fabricated.",
    route: gameRoute("signal"),
    availability: "coming-soon",
  },
  {
    id: "charlie",
    name: "Charlie Run",
    shortName: "Charlie Run",
    subtitle: "Fare-gate movement challenge",
    description: "A future transit run inspired by CharlieCards, platforms, and quick route decisions.",
    instructions: "This station is under construction; no gameplay has been fabricated.",
    route: gameRoute("charlie"),
    availability: "coming-soon",
  },
] as const;

export type GameDefinition = (typeof GAMES)[number];

export function isGameId(value: string | null): value is GameId {
  return GAMES.some((game) => game.id === value);
}

