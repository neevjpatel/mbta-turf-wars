export type JourneyPhase =
  | "idle_open"
  | "doors_closing"
  | "doors_closed"
  | "departing"
  | "in_transit"
  | "arriving"
  | "arrived"
  | "doors_opening";

export const JOURNEY_PHASES: Readonly<Record<Uppercase<JourneyPhase>, JourneyPhase>>;
export const JOURNEY_TIMINGS: Readonly<Record<Exclude<JourneyPhase, "idle_open">, number>>;
export type JourneyStep = { phase: JourneyPhase; duration: number; commitDestination: boolean; waitsForDoor: boolean };
export function createJourneyPlan(options?: { reducedMotion?: boolean }): JourneyStep[];
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
  waitForPhase?: (step: JourneyStep, signal?: AbortSignal) => Promise<void>;
}): Promise<{ status: "completed" | "cancelled" }>;
