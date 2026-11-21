import { DIFFICULTY_DESTINATIONS, GAME_LABELS, gameRoute } from "./gameModel.mjs";

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
    name: GAME_LABELS.turf,
    shortName: "Trivia",
    subtitle: "Boston transit trivia",
    description: "Answer MBTA trivia, capture real transit stops, and lead your campus across Boston.",
    instructions: "Choose a campus, select a station on the live map, then answer its trivia challenge.",
    route: gameRoute("turf"),
    availability: "playable",
  },
  {
    id: "signal",
    name: GAME_LABELS.signal,
    shortName: "T Guesser",
    subtitle: "MBTA geographic guessing game",
    description: "Study a Boston transit scene, read the geographic clues, and pinpoint where you are on the MBTA.",
    instructions: "T Guesser is being developed in a separate minigame branch.",
    route: gameRoute("signal"),
    availability: "coming-soon",
  },
  {
    id: "charlie",
    name: GAME_LABELS.charlie,
    shortName: "Stationle",
    subtitle: "MBTA station guessing game",
    description: "Use route, neighborhood, and station clues to identify a mystery stop in a Worldle-inspired challenge.",
    instructions: "Stationle is being developed in a separate minigame branch.",
    route: gameRoute("charlie"),
    availability: "coming-soon",
  },
] as const;

export type GameDefinition = (typeof GAMES)[number];

export function isGameId(value: string | null): value is GameId {
  return GAMES.some((game) => game.id === value);
}

