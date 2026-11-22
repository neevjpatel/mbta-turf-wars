export const GAME_ORDER = Object.freeze(["turf-wars", "t-guesser", "stople", "charlie-run"]);

export const GAME_LABELS = Object.freeze({
  "turf-wars": "Turf Wars",
  "t-guesser": "T Guesser",
  stople: "Stople",
  "charlie-run": "Charlie Run",
});

export const DIFFICULTY_DESTINATIONS = Object.freeze({
  easy: Object.freeze({ lineShort: "Green", color: "#00843D", destination: "BOSTON COLLEGE" }),
  medium: Object.freeze({ lineShort: "Blue", color: "#003DA5", destination: "BOWDOIN" }),
  hard: Object.freeze({ lineShort: "Orange", color: "#ED8B00", destination: "FOREST HILLS" }),
  extreme: Object.freeze({ lineShort: "Red", color: "#DA291C", destination: "BRAINTREE" }),
});

export function adjacentGameId(current, offset) {
  const index = GAME_ORDER.indexOf(current);
  if (index < 0 || (offset !== -1 && offset !== 1)) return null;
  return GAME_ORDER[index + offset] ?? null;
}

export function gameRoute(game) {
  return GAME_ORDER.includes(game) ? `/play/${game}` : null;
}
