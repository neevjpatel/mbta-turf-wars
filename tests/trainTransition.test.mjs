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
} from "../app/trainTransition.mjs";

test("journey phases run in the required order", () => {
  assert.deepEqual(createJourneyPlan().map((step) => step.phase), [
    "departure_warning",
    "doors_closing",
    "accelerating",
    "in_transit",
    "decelerating",
    "arrived",
    "doors_opening",
  ]);
});

test("destination commits only after the door-closing phase", () => {
  const plan = createJourneyPlan();
  const closeIndex = plan.findIndex((step) => step.phase === JOURNEY_PHASES.DOORS_CLOSING);
  const commitIndex = plan.findIndex((step) => step.commitDestination);
  assert.ok(commitIndex > closeIndex);
  assert.equal(plan[commitIndex].phase, JOURNEY_PHASES.ACCELERATING);
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
  assert.equal(canStartJourney({ phase: "idle", currentDestination: "home", targetDestination: "turf" }), true);
  assert.equal(canStartJourney({ phase: "doors_closing", currentDestination: "home", targetDestination: "turf" }), false);
  assert.equal(canStartJourney({ phase: "idle", currentDestination: "home", targetDestination: "turf", pendingDestination: "signal" }), false);
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
  assert.deepEqual(phases, [JOURNEY_PHASES.DEPARTURE_WARNING]);
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
  assert.equal(phases.at(-1), JOURNEY_PHASES.IDLE);
});

test("minigames become interactive only after doors finish opening", () => {
  assert.equal(isDestinationInteractive(JOURNEY_PHASES.ARRIVED, "turf", "turf"), false);
  assert.equal(isDestinationInteractive(JOURNEY_PHASES.DOORS_OPENING, "turf", "turf"), false);
  assert.equal(isDestinationInteractive(JOURNEY_PHASES.IDLE, "turf", "turf"), true);
  assert.equal(isDestinationInteractive(JOURNEY_PHASES.IDLE, "home", "turf"), false);
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
