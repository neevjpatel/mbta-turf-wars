<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project conventions

- Use kebab-case for source filenames. Keep Next.js special filenames such as `page.tsx` and `layout.tsx` unchanged.
- Keep each game in its own route directory under `app/play/`: `turf-wars`, `guess-the-t`, `stationle`, and `charlie-run`. Put game-only components and data in that game's `_components/` and `_data/` folders. Put shared gameplay UI in `app/play/_components/`.
- Use those canonical game IDs in state, navigation, links, and data. `/geoguesser` is a legacy redirect to `/play/guess-the-t`; do not add new GeoGuessr routes or internal aliases.
- Keep shared resources separated by subject under `app/_data/` (transit, trivia, campus, and game catalog). Keep reusable logic in `app/_lib/` and app-wide state in `app/_state/`. Avoid copying shared resource data into game components.

## Direct-route and refresh behavior

- Every game must work when opened directly or refreshed at its `/play/<game>/` URL. Do not require the home menu to initialize context, difficulty, selected game, station, campus, scores, or a game round.
- Initialize game state from local data or safe defaults. Validate persisted values before using them, and handle saved preferences loading after the first render. A game must remain valid while preferences hydrate or change.
- The root app layout provides `AppStateProvider`; the shared `GameplayShell` synchronizes the selected game for direct visits. Keep game routes within this layout and avoid dependencies on in-memory state set only by the home page.
- When a preference change affects a game's active round or resources, reset or reinitialize that game state for the new preference instead of retaining stale data.

## Guess the T interaction

- Guess the T is the photo-based nearest-station game at `/play/guess-the-t`. Its photo uses `object-fit: cover` and supports pointer/touch panning so users can inspect cropped areas.
- Preserve the pan surface's `select-none`, `touch-none`, and `draggable={false}` behavior. Keep map and game controls above the photo pan layer so their interactions continue to work.
- Game photos belong in `public/games/guess-the-t/images/`; reference them by public URL from `app/play/guess-the-t/_data/guess-the-t-data.ts`.
