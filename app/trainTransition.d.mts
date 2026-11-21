export type JourneyPhase =
  | "idle"
  | "departure_warning"
  | "doors_closing"
  | "accelerating"
  | "in_transit"
  | "decelerating"
  | "arrived"
  | "doors_opening";

export const JOURNEY_PHASES: Readonly<Record<Uppercase<JourneyPhase>, JourneyPhase>>;
export const JOURNEY_TIMINGS: Readonly<Record<Exclude<JourneyPhase, "idle">, number>>;
export function createJourneyPlan(options?: { reducedMotion?: boolean }): Array<{ phase: JourneyPhase; duration: number; commitDestination: boolean }>;
export function canStartJourney(input: { phase: JourneyPhase; currentDestination: string; targetDestination: string; pendingDestination?: string | null }): boolean;
export function resolveTravelDirection(currentIndex: number, targetIndex: number, requestedDirection?: number): -1 | 1;
export function doorsAreOpen(phase: JourneyPhase): boolean;
export function isMotionPhase(phase: JourneyPhase): boolean;
export function isDestinationInteractive(phase: JourneyPhase, activeDestination: string, destination: string): boolean;
export function waitForJourneyStep(milliseconds: number, signal?: AbortSignal): Promise<void>;
export function runJourney(input: {
  plan: ReturnType<typeof createJourneyPlan>;
  signal?: AbortSignal;
  onPhase: (phase: JourneyPhase) => void;
  onCommit: () => void;
  onRecover?: (error: unknown) => void;
  wait?: (milliseconds: number, signal?: AbortSignal) => Promise<void>;
}): Promise<{ status: "completed" | "cancelled" }>;
