# BostonHacks MBTA Game — Delivery Roadmap

## 1. Product outcome

Deliver a working, end-to-end web demo where a player can create an account, choose a difficulty on a train-inspired menu, play each of three MBTA mini-games, earn a personal point balance, buy/equip a profile cosmetic, and view personal and university standings. Students who complete the agreed university SSO flow contribute eligible round points to their school's team total.

The present codebase is a map-based “T-Line Turf Wars” territory-capture prototype. It is not the target product described here. The roadmap treats replacing that prototype as an initial task. Existing station records and trivia may be reviewed and reused after validation; territory claiming, simulated delay multipliers, and live service alerts are not part of the MVP loop.

## 2. Delivery assumptions and decisions

These are the working decisions from project discussion. Update this section if the team changes them.

- **Hackathon priority:** a complete end-to-end demo is more important than polishing one isolated screen.
- **Team:** plan for 3–4 people. Role names below are responsibilities and can be combined or split.
- **Accounts/data:** use real hosted authentication and a shared hosted database. Select the provider during Stage 0; no provider is assumed by this roadmap.
- **Student eligibility:** target Boston-area universities and institutions served by or near the MBTA, including BU, MIT, Harvard, Boston College, Northeastern, and other agreed schools. Use university OAuth/SSO where available. The first release can only verify institutions for which credentials/provider support are available; do not represent an unsupported self-selected school as verified.
- **School score:** add the awarded points from each eligible round to the affiliated school’s all-time aggregate. An administrator can reset the competition in the backend. All points have equal value regardless of game; different modes may award different point amounts.
- **Personal statistics and ranking:** show both gross points earned and current spendable wallet balance in player statistics. Rank the individual leaderboard by gross points earned; cosmetics spending does not lower rank.
- **Difficulty order:** Green easiest, then Orange, Blue, Red hardest. These colors are menu difficulty labels only and never restrict game questions, station choices, or image answer sets.
- **Game rules:** Trivia continues one question at a time until the player chooses to stop; award points per question. Station Wordle allows at most six guesses and awards points according to guesses remaining at success. Its difficulty changes how well-known the target station is. Closest Station allows one guess and awards points according to straight-line distance.
- **Distance:** use straight-line distance between coordinates for both station games.
- **Images:** this is a demo with a small curated set. The team may use selected demo images and predetermine the correct closest station; retain source/attribution and answer metadata with each image.
- **Account identity:** support username and email sign-up/sign-in.
- **Hosting and deadline:** deploy on Vercel; hackathon deadline is 24 hours from the roadmap update. Stage 0 decisions and a deployment smoke check must happen immediately.

## 3. Roles and workstream ownership

For a four-person team, assign one owner to each workstream. With three people, combine Workstream A with D or B with D. Each owner keeps their branch/module runnable and opens a small integration-ready change; merge early and frequently.

### A — Product shell and interaction design

Own the main menu, train visual, difficulty selector, navigation, shared layout, responsive behavior, and the visual states/instructions/results shared by games. Coordinate interface decisions with B and the game owners before building shared components.

### B — Platform, account, persistence, and scoring

Own the hosted auth/database decision and setup, account/profile records, SSO integration, result persistence, personal wallet, cosmetic catalog/purchases, school aggregation, and leaderboard queries. Publish TypeScript types and service functions early so game owners can integrate before the backend is finished.

### C — Trivia and Station Wordle

Own the trivia content format and round, the station target/guess interaction, station search, directional/distance hints, difficulty behavior for those games, and game-specific unit calculations. Use canonical station IDs and the shared result contract.

### D — Closest Station and game content/data

Own the image challenge interaction, static image content records and attribution, closest-station answer metadata, distance-based award calculation, and quality review of shared station/trivia/image data. Coordinate the same result contract with B and C.

### Shared integration duty

Every teammate helps keep the integrated app working. A is the integration coordinator unless the team assigns another person. Do not leave integration, auth, or scoring until the final hours: use the gates below and maintain a playable vertical slice early.

## 4. Contracts between workstreams

Agree these contracts in Stage 0 and put the actual types in a shared module before parallel feature implementation.

### Round result contract

Each completed Wordle or Closest Station round returns one result object. Trivia is continuous, so each answered question is its own scored result/event; stopping ends the trivia session and shows the session summary without re-awarding its question events. Each scored result/event contains:

- `mode`: `trivia`, `station-wordle`, or `closest-station`.
- `difficulty`: `green`, `orange`, `blue`, or `red`.
- `rawScore`: mode-specific performance score, before any common conversion.
- `personalPointsEarned`: non-negative integer added once to the player's spendable balance.
- `schoolPointsEarned`: non-negative integer contributed to the school only when affiliation is eligible; otherwise zero/not eligible.
- `outcome`: enough structured data to explain the result (for example correct count, guess count, guessed station, target station, or distance band).
- `completedAt` and a unique round/result ID created or validated by the persistence layer.

Database writes must be idempotent by result ID so refreshing/retrying the result screen cannot award points twice. Cosmetic purchase changes only `personalPointsBalance` and the player's inventory/equipped cosmetic; it never edits recorded game results or school totals.

### Shared game interface

Each game receives the selected difficulty and a player context. It owns the active round UI and emits scored result events through the shared result submission function. Wordle and Closest Station emit one event at completion; Trivia emits one event per answered question and a non-scoring session summary when the player stops. Game UI must not directly update wallet or leaderboard totals. Shared shell owns navigation and the account/menu surfaces.

### Content data contract

- Every station is referenced by a stable ID, with canonical display name and validated coordinates.
- Trivia entries include ID, prompt, answer options, correct option, explanation, difficulty tag, and source/verification note for factual claims.
- Closest Station entries include ID, image path, alt text, attribution/source, image location coordinates, expected closest station ID, and difficulty tag.
- Keep content in static typed data files for the MVP unless the chosen backend specifically requires a database table. Do not duplicate station names/coordinates in each game.

## 5. Staged roadmap

### Stage 0 — Lock the demo rules and unblock parallel work (first 1–2 hours)

**Owner:** A facilitates; all owners decide their areas. **Can run in parallel:** provider investigation, content audit, screen sketching. **Must finish before:** production game scoring and backend schema are treated as final.

Tasks:

1. Select the hosted auth/database provider and verify Vercel compatibility, server-side secrets, shared database access, username/email sign-up, and the available university SSO/OAuth path.
2. Keep the product school list inclusive of Boston/MBTA-area universities (initial examples: BU, MIT, Harvard, Boston College, and Northeastern). Confirm which providers can be configured within the 24-hour build window. If a school is unsupported, allow standard play but do not award verified school points based on a self-selected affiliation.
3. Write exact scoring tables before implementation: points per correct trivia answer; Wordle points by guesses remaining (and whether failure earns zero); and Closest Station points by straight-line distance bands. Define how difficulty affects question/image selection and Wordle station familiarity.
4. Rank the individual leaderboard by gross points earned; keep gross earned and current wallet balance as separate profile statistics. Define a deterministic tie-breaker. Make school totals all-time, with an administrator-only reset that does not change wallet balances or recorded results.
5. Use straight-line distance in kilometers between coordinates for both location games. For Wordle, show compass direction from guessed station toward target. For Closest Station, compare the guessed station to the curated closest-station answer and award by documented distance bands.
6. Select and review a small playable set of trivia, stations, and demo images. Record image attribution and predetermined answers with each image.
7. Draw the key states: menu, signed-out/sign-in, game instructions, active game, result, profile/cosmetics, individual leaderboard, school leaderboard, loading/error/empty states.
8. Create shared TypeScript types and the result submission interface in the repo before game owners work against separate assumptions.

**Exit criteria:** exact score tables and difficulty rules are written down; supported-school/auth plan is written down; distance and admin-reset rules are explicit; content format and shared result/event types are agreed; each workstream has a named owner.

### Stage 1 — Replace the prototype with the navigable application shell (hours 1–6)

**Owner:** A. **Parallel:** B can create backend project/schema; C and D can prepare content modules using Stage 0 contracts.

Tasks:

1. Replace the territory-capture home screen with the train-themed main menu and three game entry points.
2. Add the four-state difficulty selector. Show both color and text label; preserve selected difficulty as the player enters a game.
3. Add placeholder routes/views for each mode, profile, personal leaderboard, and school leaderboard so the full navigation can be clicked before games are complete.
4. Add shared header/account state, menu return action, loading/error/empty patterns, and responsive layout.
5. Remove or disconnect prototype-only campus capture controls, territory ownership, delay simulator, activity feed, and live alerts unless the product owner specifically reprioritizes them.
6. Keep usable focus states, keyboard operation, and text labels so difficulty is not communicated by color alone.

**Exit criteria:** a teammate can navigate from menu to each placeholder mode and back on desktop and mobile widths; selected difficulty is visible and retained; no prototype capture action appears in the target journey.

### Stage 2 — Build the three independent game loops (hours 3–14; parallel)

**Owners:** C owns Trivia and Station Wordle; D owns Closest Station. **Parallel:** all three games can be implemented against the shared typed content and result contracts. Use a local stub for result submission until B's service is ready.

#### Trivia tasks (C)

1. Load a question bank tagged by difficulty; choose one question at a time without repeating until the eligible pool is exhausted.
2. Render a prompt and answer options; lock the answer after one submission.
3. Show correctness and explanation, award points for that question, then offer **Continue** or **Stop**.
4. If the player stops, end the session and show questions answered and gross points earned. Persist each answered question as an idempotent scored result/event so a refresh cannot award it twice.
5. Permit a new trivia session after stopping; apply the agreed anti-farming/duplicate rules if required.
6. Include difficulty and question ID in each result/event; difficulty affects question selection as agreed.

#### Station Wordle tasks (C)

1. Pick one target from the canonical station list using the difficulty tag/rarity rules; do not filter by train color or line.
2. Provide searchable station selection by canonical name; reject duplicate guesses and invalid values.
3. After each guess, show compass direction and straight-line distance toward the target.
4. End when correct or after six guesses; on failure, reveal the target.
5. On success, award points based on guesses remaining using the Stage 0 table; on failure, use the agreed failed-round award. Emit target ID, guesses, success, difficulty, and points.

#### Closest Station tasks (D)

1. Render a static demo image, accessible alt text, prompt, and only the hints allowed at the selected difficulty.
2. Let the player select one canonical station and submit exactly one guess.
3. Calculate straight-line distance from the image location to the guessed station and compare with the curated closest-station answer.
4. Show guessed station, expected closest station, distance/feedback, and point explanation after submission.
5. Award points according to the Stage 0 distance table; emit image ID, guessed and expected station IDs, distance, difficulty, and award.

**Exit criteria:** each mode can start, accept input, finish, show a useful result, and replay; all modes emit the same result shape; game logic does not directly mutate wallet/leaderboard state; content references canonical station IDs.

### Stage 3 — Authentication, persistence, and competitive scoring (hours 2–17; parallel with game work)

**Owner:** B. **Parallel:** A wires account/profile/leaderboard views to typed service calls; game owners replace stubs with result submission calls.

Tasks:

1. Configure hosted auth and database for local development and the hackathon deployment; document required environment variables without committing secrets.
2. Implement username/email sign-up, sign-in, sign-out, and recoverable loading/error states.
3. Implement university SSO/linking for the agreed participating institutions. Store provider-derived school eligibility separately from display name or user-selected preferences.
4. Create records/tables for users/profiles, affiliations, game results, wallet transactions/balance, cosmetic catalog/inventory/equipped item, school score aggregates, and leaderboard score as required by the provider.
5. Implement a server-validated/idempotent `submitRoundResult` operation. It validates the player, mode, difficulty and result ID, persists the result, awards personal points once, updates the eligible school total once, and updates competitive ranking data according to agreed rules.
6. Implement cosmetic purchase/equip operations that reject insufficient balance and duplicate charges, and do not change earned-score history.
7. Implement personal leaderboard reads ranked by gross points earned and school leaderboard reads ranked by all-time eligible points, with clear labels and empty/loading/error behavior.
8. Implement a protected administrator-only school-score reset operation. It resets aggregate school standings only, not player wallets or stored round history; document how the authorized admin triggers it.
9. Add demo seed data only where clearly separated from live player results; identify any demo fixtures in the UI.

**Exit criteria:** signing in survives refresh; a completed round persists across sessions; retrying the same result does not double-award; a standard user earns personal points but contributes no school points; eligible SSO student contributes the same awarded amount to their school; cosmetic purchase deducts wallet only; both leaderboards show persisted data.

### Stage 4 — Complete the player loop and polish the demo (hours 14–22)

**Owners:** A coordinates; all owners fix their areas. **Parallel:** test the three modes and auth/scoring independently, then run the integrated checklist.

Tasks:

1. Connect the menu to playable games and all game results to the persistence service.
2. Complete profile page: display name/public profile choice, personal wallet, equipped cosmetic, owned items, recent game results, and school eligibility state.
3. Complete cosmetic catalog with a small fixed set (target 3–6 items); show price, owned/equipped state, and insufficient balance feedback. In player statistics show gross points earned and current wallet balance; rank the individual leaderboard by gross points earned.
4. Complete separate personal and school leaderboard views; label personal wallet and competition score distinctly and show season/all-time label.
5. Add clear instructions and scoring explanation before each round and a point breakdown after each round.
6. Check responsive layout, keyboard navigation, contrast, alt text, empty/error/loading states, auth cancellation, and unsupported-school flow.
7. Review all question answers and explanations, station coordinates/names, image permissions/attribution, closest-station answers, distance display, and scoring edge cases.
8. Prepare one username/email demo account and one verified student demo account for an integrated school if feasible, seeded rankings, and a 2–3 minute walkthrough.

**Exit criteria:** a fresh user can complete the intended demo journey without developer console/manual database intervention; score totals reconcile with stored results; the full walkthrough works on the target deployment; no secret is committed; every non-integrated SSO or image limitation is identified in the demo UI/presentation.

### Stage 5 — Deploy and rehearse (final 2 hours)

**Owner:** A coordinates; B owns Vercel/auth configuration; all owners validate their changes.

1. Configure Vercel project, production environment variables, auth callback URLs, and database permissions. Never put server secrets in client code or commit them.
2. Deploy the integrated MVP before the final hour; do not wait for visual polish to create the first deployment.
3. Run the complete journey on the deployed URL using a standard account and, if available, a verified student account. Confirm refresh persistence, no duplicate point awards, correct wallet/gross leaderboard behavior, school contribution, cosmetic purchase, and admin reset behavior.
4. Fix release-blocking issues first: failed sign-in, failed round submission, wrong scoring, broken game navigation, or deployment/runtime errors. Defer non-blocking polish.
5. Keep a short demo script and backup seeded account ready. Confirm any unsupported SSO institution/image limitation is accurately described.

**Exit criteria:** public Vercel URL works for the planned demo; one complete standard account journey works; school path is demonstrated only if actually verified; scoring and balances reconcile.

## 6. MVP scope boundaries

Included: train-style menu, difficulty selection, trivia, station directional/distance guessing, static-image closest-station game, generic sign-in, agreed student SSO path, profile cosmetics purchased with personal points, individual leaderboard, university leaderboard, persistent results, and clear demo data.

Excluded unless the team explicitly changes scope: live arrivals/alerts, route planning, ticketing/payment, real-time station status, map territory capture, delay multipliers, live multiplayer, player-created content, a large item economy, every university SSO provider, and production moderation/reporting tooling.

## 7. Work tracking and integration rules

- Create issues from the task lists above; put the owner letter, stage, acceptance criteria, and dependencies in each issue.
- Keep one shared interface/schema issue owned jointly by B and the game owners. Do not create parallel incompatible result types.
- Merge a thin vertical slice early: menu → one stub game → result service → persisted personal score → leaderboard. Then expand to other games and school eligibility.
- Each game owner supplies at least one sample content record for every supported difficulty or explicitly documents why the content pool is smaller.
- Prefer static content and a small catalog over extra tooling. Implement the protected backend reset operation, but defer a full admin dashboard unless time remains.
- At the end of each stage, demonstrate the exit criteria to the team and resolve blockers before marking the stage done.

## 8. Decisions still needed from the team

1. Which Boston/MBTA-area universities can the team actually configure for SSO in the remaining time, and which auth/database provider is selected?
2. What are the exact point schedules: trivia points per correct answer, Wordle points per remaining guess and failed round, and Closest Station points by distance band?
3. How should difficulty change trivia selection and image prompts, and what station familiarity tiers define each Wordle difficulty?
4. Which authorized admin account/action will reset school aggregates, and should the UI expose an admin panel or should reset remain a backend operation?
5. Which demo images are selected, and where will their attribution be shown?
6. Is the username public by default on individual leaderboards, or can players choose a display name/privacy setting?
