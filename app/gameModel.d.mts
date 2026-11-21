export type GameModelId = "turf" | "signal" | "charlie";
export const GAME_ORDER: readonly GameModelId[];
export const DIFFICULTY_DESTINATIONS: Readonly<Record<"easy" | "medium" | "hard" | "extreme", Readonly<{ lineShort: string; color: string; destination: string }>>>;
export function adjacentGameId(current: GameModelId, offset: -1 | 1): GameModelId | null;
export function gameRoute(game: GameModelId): string | null;
