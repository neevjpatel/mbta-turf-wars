export type TransitLine = "Green" | "Orange" | "Blue" | "Red";
export type DifficultyLevel = "Easy" | "Medium" | "Hard" | "Expert";

export interface StopData {
  id: string;
  name: string;
  line: TransitLine;
  lat: number;
  lng: number;
  owner: string;
  points: number;
  localTip: string;
}

export interface LineDifficultyConfig {
  line: TransitLine;
  difficulty: DifficultyLevel;
  basePoints: number;
  color: string;
  maxStopleGuesses: number;
}
