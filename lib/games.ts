// Game names as stored in the stats DB's `games` table.
// They match the game ids in app/_data/game-model.mjs (GAME_ORDER), so each game can pass its own id.
// Shared by the server (lib/db.ts) and the browser (lib/statsClient.ts).
export const GAMES = ["turf-wars", "t-guesser", "stople", "charlie-run"] as const;
export type GameName = (typeof GAMES)[number];
