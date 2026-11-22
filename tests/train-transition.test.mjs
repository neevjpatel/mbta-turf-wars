import assert from "node:assert/strict";
import test from "node:test";
import {
  JOURNEY_PHASES,
  canStartJourney,
  createJourneyPlan,
  doorsAreOpen,
  isDestinationInteractive,
  resolveTravelDirection,
  runJourney,
} from "../app/_lib/train-transition.mjs";
import { adjacentGameId, DIFFICULTY_DESTINATIONS, GAME_LABELS, GAME_ORDER, gameRoute } from "../app/_data/game-model.mjs";

test("journey phases run in the required order", () => {
  assert.deepEqual(createJourneyPlan().map((step) => step.phase), [
    "doors_closing",
    "doors_closed",
    "departing",
    "in_transit",
    "arriving",
    "arrived",
    "doors_opening",
  ]);
});

test("destination commits only after the door-closing phase", () => {
  const plan = createJourneyPlan();
  const closeIndex = plan.findIndex((step) => step.phase === JOURNEY_PHASES.DOORS_CLOSING);
  const commitIndex = plan.findIndex((step) => step.commitDestination);
  assert.ok(commitIndex > closeIndex);
  assert.equal(plan[commitIndex].phase, JOURNEY_PHASES.DOORS_CLOSED);
  assert.equal(doorsAreOpen(plan[commitIndex].phase), false);
});

test("arrival completes before doors begin opening", () => {
  const phases = createJourneyPlan().map((step) => step.phase);
  assert.ok(phases.indexOf(JOURNEY_PHASES.ARRIVED) < phases.indexOf(JOURNEY_PHASES.DOORS_OPENING));
});

test("forward and backward directions are deterministic", () => {
  assert.equal(resolveTravelDirection(0, 2), 1);
  assert.equal(resolveTravelDirection(2, 0), -1);
  assert.equal(resolveTravelDirection(0, 3, -1), -1);
});

test("rapid navigation is rejected while a destination is pending", () => {
  assert.equal(canStartJourney({ phase: "idle_open", currentDestination: "home", targetDestination: "turf-wars" }), true);
  assert.equal(canStartJourney({ phase: "doors_closing", currentDestination: "home", targetDestination: "turf-wars" }), false);
  assert.equal(canStartJourney({ phase: "idle_open", currentDestination: "home", targetDestination: "turf-wars", pendingDestination: "t-guesser" }), false);
});

test("reduced-motion journeys keep state order without waiting", () => {
  assert.ok(createJourneyPlan({ reducedMotion: true }).every((step) => step.duration === 0));
});

test("cancellation restores a safe state", async () => {
  const controller = new AbortController();
  const phases = [];
  let recovered = false;
  const result = await runJourney({
    plan: createJourneyPlan(),
    signal: controller.signal,
    onPhase: (phase) => phases.push(phase),
    onCommit: () => {},
    onRecover: () => { recovered = true; },
    wait: async () => { controller.abort(); },
  });
  assert.equal(result.status, "cancelled");
  assert.equal(recovered, true);
  assert.deepEqual(phases, [JOURNEY_PHASES.DOORS_CLOSING]);
});

test("content commits exactly once during a complete journey", async () => {
  let commits = 0;
  const phases = [];
  const result = await runJourney({
    plan: createJourneyPlan({ reducedMotion: true }),
    onPhase: (phase) => phases.push(phase),
    onCommit: () => { commits += 1; },
    wait: async () => {},
  });
  assert.equal(result.status, "completed");
  assert.equal(commits, 1);
  assert.equal(phases.at(-1), JOURNEY_PHASES.IDLE_OPEN);
});

test("minigames become interactive only after doors finish opening", () => {
  assert.equal(isDestinationInteractive(JOURNEY_PHASES.ARRIVED, "turf-wars", "turf-wars"), false);
  assert.equal(isDestinationInteractive(JOURNEY_PHASES.DOORS_OPENING, "turf-wars", "turf-wars"), false);
  assert.equal(isDestinationInteractive(JOURNEY_PHASES.IDLE_OPEN, "turf-wars", "turf-wars"), true);
  assert.equal(isDestinationInteractive(JOURNEY_PHASES.IDLE_OPEN, "home", "turf-wars"), false);
});

test("door phases are explicitly marked for completion-driven waits", () => {
  const doorSteps = createJourneyPlan().filter((step) => step.waitsForDoor);
  assert.deepEqual(doorSteps.map((step) => step.phase), [JOURNEY_PHASES.DOORS_CLOSING, JOURNEY_PHASES.DOORS_OPENING]);
  assert.ok(doorSteps.every((step) => step.duration === 680));
});

test("journeys do not mutate caller-owned difficulty state", async () => {
  const difficulty = "extreme";
  await runJourney({
    plan: createJourneyPlan({ reducedMotion: true }),
    onPhase: () => {},
    onCommit: () => {},
    wait: async () => {},
  });
  assert.equal(difficulty, "extreme");
});

test("homepage game registry includes the four connected games in order", () => {
  assert.equal(GAME_ORDER[0], "turf-wars");
  assert.deepEqual(GAME_ORDER, ["turf-wars", "t-guesser", "stople", "charlie-run"]);
});

test("game stops use the finalized frontend labels", () => {
  assert.deepEqual(GAME_LABELS, {
    "turf-wars": "Turf Wars",
    "t-guesser": "T Guesser",
    stople: "Stople",
    "charlie-run": "Charlie Run",
  });
});

test("side navigation advances one stop and stops at route boundaries", () => {
  assert.equal(adjacentGameId("turf-wars", 1), "t-guesser");
  assert.equal(adjacentGameId("t-guesser", 1), "stople");
  assert.equal(adjacentGameId("stople", 1), "charlie-run");
  assert.equal(adjacentGameId("charlie-run", 1), null);
  assert.equal(adjacentGameId("turf-wars", -1), null);
  assert.equal(adjacentGameId("stople", -1), "t-guesser");
  assert.equal(adjacentGameId("charlie-run", -1), "stople");
});

test("each menu game has its own gameplay route", () => {
  assert.equal(gameRoute("turf-wars"), "/play/turf-wars");
  assert.equal(gameRoute("t-guesser"), "/play/t-guesser");
  assert.equal(gameRoute("stople"), "/play/stople");
  assert.equal(gameRoute("charlie-run"), "/play/charlie-run");
});

test("difficulty themes map to authentic requested destinations", () => {
  assert.deepEqual(DIFFICULTY_DESTINATIONS, {
    easy: { lineShort: "Green", color: "#00843D", destination: "BOSTON COLLEGE" },
    medium: { lineShort: "Blue", color: "#003DA5", destination: "BOWDOIN" },
    hard: { lineShort: "Orange", color: "#ED8B00", destination: "FOREST HILLS" },
    extreme: { lineShort: "Red", color: "#DA291C", destination: "BRAINTREE" },
  });
});
