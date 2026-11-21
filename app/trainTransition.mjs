export const JOURNEY_PHASES = Object.freeze({
  IDLE: "idle",
  DEPARTURE_WARNING: "departure_warning",
  DOORS_CLOSING: "doors_closing",
  ACCELERATING: "accelerating",
  IN_TRANSIT: "in_transit",
  DECELERATING: "decelerating",
  ARRIVED: "arrived",
  DOORS_OPENING: "doors_opening",
});

export const JOURNEY_TIMINGS = Object.freeze({
  departure_warning: 150,
  doors_closing: 450,
  accelerating: 400,
  in_transit: 500,
  decelerating: 400,
  arrived: 100,
  doors_opening: 450,
});

const ORDERED_PHASES = [
  JOURNEY_PHASES.DEPARTURE_WARNING,
  JOURNEY_PHASES.DOORS_CLOSING,
  JOURNEY_PHASES.ACCELERATING,
  JOURNEY_PHASES.IN_TRANSIT,
  JOURNEY_PHASES.DECELERATING,
  JOURNEY_PHASES.ARRIVED,
  JOURNEY_PHASES.DOORS_OPENING,
];

export function createJourneyPlan({ reducedMotion = false } = {}) {
  return ORDERED_PHASES.map((phase) => ({
    phase,
    duration: reducedMotion ? 0 : JOURNEY_TIMINGS[phase],
    commitDestination: phase === JOURNEY_PHASES.ACCELERATING,
  }));
}

export function canStartJourney({ phase, currentDestination, targetDestination, pendingDestination = null }) {
  return phase === JOURNEY_PHASES.IDLE && pendingDestination === null && currentDestination !== targetDestination;
}

export function resolveTravelDirection(currentIndex, targetIndex, requestedDirection) {
  if (requestedDirection === -1 || requestedDirection === 1) return requestedDirection;
  return targetIndex < currentIndex ? -1 : 1;
}

export function doorsAreOpen(phase) {
  return phase === JOURNEY_PHASES.IDLE || phase === JOURNEY_PHASES.DEPARTURE_WARNING || phase === JOURNEY_PHASES.DOORS_OPENING;
}

export function isMotionPhase(phase) {
  return phase === JOURNEY_PHASES.ACCELERATING || phase === JOURNEY_PHASES.IN_TRANSIT || phase === JOURNEY_PHASES.DECELERATING;
}

export function isDestinationInteractive(phase, activeDestination, destination) {
  return phase === JOURNEY_PHASES.IDLE && activeDestination === destination;
}

function abortError() {
  return new DOMException("Journey cancelled", "AbortError");
}

export function waitForJourneyStep(milliseconds, signal) {
  if (signal?.aborted) return Promise.reject(abortError());
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, milliseconds);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(abortError());
    }, { once: true });
  });
}

export async function runJourney({ plan, signal, onPhase, onCommit, onRecover, wait = waitForJourneyStep }) {
  try {
    for (const step of plan) {
      if (signal?.aborted) throw abortError();
      onPhase(step.phase);
      if (step.commitDestination) onCommit();
      await wait(step.duration, signal);
    }
    onPhase(JOURNEY_PHASES.IDLE);
    return { status: "completed" };
  } catch (error) {
    onRecover?.(error);
    if (error?.name === "AbortError") return { status: "cancelled" };
    throw error;
  }
}
