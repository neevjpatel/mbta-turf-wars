// Point rules for games that don't award points on their own.
// Change the numbers here; the games and stats pick them up automatically.

/** Stople: a solved station earns a base by difficulty plus 10 for every guess left unused. A miss earns 0. */
const STOPLE_BASE = { easy: 20, medium: 30, hard: 40, extreme: 50 } as const;
export const STOPLE_POINTS_PER_GUESS_LEFT = 10;

export function stoplePoints(difficulty: keyof typeof STOPLE_BASE, won: boolean, guessesLeft: number) {
  if (!won) return 0;
  return STOPLE_BASE[difficulty] + STOPLE_POINTS_PER_GUESS_LEFT * Math.max(0, guessesLeft);
}
