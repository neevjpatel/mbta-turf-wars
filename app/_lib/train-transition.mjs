export const JOURNEY_PHASES = Object.freeze({
  IDLE_OPEN: "idle_open",
  DOORS_CLOSING: "doors_closing",
  DOORS_CLOSED: "doors_closed",
  DEPARTING: "departing",
  IN_TRANSIT: "in_transit",
  ARRIVING: "arriving",
  ARRIVED: "arrived",
  DOORS_OPENING: "doors_opening",
});

export const JOURNEY_TIMINGS = Object.freeze({
  doors_closing: 680,
  doors_closed: 80,
  departing: 400,
  in_transit: 600,
  arriving: 400,
  arrived: 100,
  doors_opening: 680,
});

const ORDERED_PHASES = [
  JOURNEY_PHASES.DOORS_CLOSING,
  JOURNEY_PHASES.DOORS_CLOSED,
  JOURNEY_PHASES.DEPARTING,
  JOURNEY_PHASES.IN_TRANSIT,
  JOURNEY_PHASES.ARRIVING,
  JOURNEY_PHASES.ARRIVED,
  JOURNEY_PHASES.DOORS_OPENING,
];

export function createJourneyPlan({ reducedMotion = false } = {}) {
  return ORDERED_PHASES.map((phase) => ({
    phase,
    duration: reducedMotion ? 0 : JOURNEY_TIMINGS[phase],
    commitDestination: phase === JOURNEY_PHASES.DOORS_CLOSED,
    waitsForDoor: phase === JOURNEY_PHASES.DOORS_CLOSING || phase === JOURNEY_PHASES.DOORS_OPENING,
  }));
}

export function canStartJourney({ phase, currentDestination, targetDestination, pendingDestination = null }) {
  return phase === JOURNEY_PHASES.IDLE_OPEN && pendingDestination === null && currentDestination !== targetDestination;
}

export function resolveTravelDirection(currentIndex, targetIndex, requestedDirection) {
  if (requestedDirection === -1 || requestedDirection === 1) return requestedDirection;
  return targetIndex < currentIndex ? -1 : 1;
}

export function doorsAreOpen(phase) {
  return phase === JOURNEY_PHASES.IDLE_OPEN || phase === JOURNEY_PHASES.DOORS_OPENING;
}

export function isMotionPhase(phase) {
  return phase === JOURNEY_PHASES.DEPARTING || phase === JOURNEY_PHASES.IN_TRANSIT || phase === JOURNEY_PHASES.ARRIVING;
}

export function isDestinationInteractive(phase, activeDestination, destination) {
  return phase === JOURNEY_PHASES.IDLE_OPEN && activeDestination === destination;
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

export async function runJourney({ plan, signal, onPhase, onCommit, onRecover, wait = waitForJourneyStep, waitForPhase }) {
  try {
    for (const step of plan) {
      if (signal?.aborted) throw abortError();
      onPhase(step.phase);
      if (step.commitDestination) onCommit();
      if (waitForPhase) await waitForPhase(step, signal);
      else await wait(step.duration, signal);
    }
    onPhase(JOURNEY_PHASES.IDLE_OPEN);
    return { status: "completed" };
  } catch (error) {
    onRecover?.(error);
    if (error?.name === "AbortError") return { status: "cancelled" };
    throw error;
  }
}
