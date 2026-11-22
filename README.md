# MBTA Mini Games

A Boston transit themed collection of four games connected by an interactive train journey.

## Games

- **Turf Wars** (`/play/turf-wars`): claim MBTA stops for a campus by answering trivia.
- **T Guesser** (`/play/t-guesser`): identify the nearest station to a Boston street photo.
- **Stople** (`/play/stople`): use distance and direction clues to find a mystery station.
- **Charlie Run** (`/play/charlie-run`): an endless runner with campus and station scoring.

The home menu presents these games through a train based navigation experience. The former `/geoguesser`, `/play/guess-the-t`, and `/play/stationle` URLs redirect to their renamed game routes for compatibility.

## Project structure

- `app/_components/`: shared home and layout UI.
- `app/_data/`: shared game catalog, transit stops and lines, trivia, and campus data.
- `app/_lib/`: shared non-UI helpers.
- `app/_state/`: app-wide preferences and state.
- `app/play/<game>/`: each game's route, UI, and game-specific data.
- `public/games/`: game imagery served as static assets.

Keep resources close to their owner: shared transit facts live under `app/_data/transit`, while game-only assets and datasets live in that game's route directory. This keeps unrelated game edits in separate files.

## Development

```bash
npm install
npm run dev
```

Run `npm run lint` for lint checks, `npx tsc --noEmit` for type checking, and `npm test` for the transition and route model tests.
