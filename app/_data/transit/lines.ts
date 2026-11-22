import type { LineDifficultyConfig, TransitLine } from "./types";

export const LINE_DIFFICULTIES: Record<TransitLine, LineDifficultyConfig> = {
  Green: { line: "Green", difficulty: "Easy", basePoints: 15, color: "#00843D", maxStopleGuesses: 6 },
  Orange: { line: "Orange", difficulty: "Medium", basePoints: 25, color: "#ED8B00", maxStopleGuesses: 5 },
  Blue: { line: "Blue", difficulty: "Hard", basePoints: 40, color: "#003DA5", maxStopleGuesses: 4 },
  Red: { line: "Red", difficulty: "Expert", basePoints: 60, color: "#DA291C", maxStopleGuesses: 3 },
};
