"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import BostonEnvironment from "./BostonEnvironment";
import TurfWarsGame from "./TurfWarsGame";
import {
  JOURNEY_PHASES,
  JOURNEY_TIMINGS,
  canStartJourney,
  createJourneyPlan,
  doorsAreOpen,
  isDestinationInteractive,
  isMotionPhase,
  resolveTravelDirection,
  runJourney,
  type JourneyPhase,
} from "./trainTransition.mjs";

type DestinationId = "home" | "turf" | "signal" | "charlie";
type DifficultyId = "easy" | "medium" | "hard" | "extreme";

const DIFFICULTIES = {
  easy: { label: "Easy", line: "Green Line", color: "#00843D", code: "G" },
  medium: { label: "Medium", line: "Blue Line", color: "#003DA5", code: "B" },
  hard: { label: "Hard", line: "Orange Line", color: "#ED8B00", code: "O" },
  extreme: { label: "Extreme", line: "Red Line", color: "#DA291C", code: "R" },
} satisfies Record<DifficultyId, { label: string; line: string; color: string; code: string }>;

const DESTINATIONS: Array<{
  id: DestinationId;
  name: string;
  shortName: string;
  kicker: string;
  description: string;
  status: "open" | "soon";
  marker: string;
}> = [
  { id: "home", name: "South Station", shortName: "Game Select", kicker: "Central concourse", description: "Choose a destination and board your next challenge.", status: "open", marker: "00" },
  { id: "turf", name: "Turf Capture", shortName: "Turf Wars", kicker: "Live strategy game", description: "Claim MBTA stops for your campus by answering Boston trivia.", status: "open", marker: "01" },
  { id: "signal", name: "Signal Scramble", shortName: "Signal", kicker: "Future service", description: "A future timing challenge. No playable implementation exists yet.", status: "soon", marker: "02" },
  { id: "charlie", name: "Charlie Run", shortName: "Charlie Run", kicker: "Future service", description: "A future fare-gate challenge. No playable implementation exists yet.", status: "soon", marker: "03" },
];

function destinationFromUrl(): DestinationId {
  if (typeof window === "undefined") return "home";
  const value = new URLSearchParams(window.location.search).get("station");
  return DESTINATIONS.some((destination) => destination.id === value) ? (value as DestinationId) : "home";
}

function HomeSelection({ onTravel, disabled }: { onTravel: (destination: DestinationId, direction?: number) => void; disabled: boolean }) {
  const [selected, setSelected] = useState<DestinationId>("turf");
  const destination = DESTINATIONS.find((item) => item.id === selected) ?? DESTINATIONS[1];

  return (
    <section className="selection-screen" aria-labelledby="welcome-heading">
      <div className="selection-intro">
        <p className="eyebrow">Welcome aboard</p>
        <h1 id="welcome-heading">Choose your game</h1>
        <p>Pick a stop on the challenge line. The train does the rest.</p>
      </div>
      <div className="destination-board" aria-label="Game destinations">
        {DESTINATIONS.slice(1).map((item) => (
          <button type="button" key={item.id} className={`destination-row ${selected === item.id ? "is-selected" : ""}`} onClick={() => setSelected(item.id)} aria-pressed={selected === item.id}>
            <span className={`game-art game-art-${item.id}`} aria-hidden="true">
              {item.id === "turf" && <><i className="map-river" /><i className="map-route route-a" /><i className="map-route route-b" /><b>T</b></>}
              {item.id === "signal" && <><i className="signal-post" /><i className="signal-lamp red" /><i className="signal-lamp amber" /><i className="signal-lamp green" /></>}
              {item.id === "charlie" && <><i className="charlie-card" /><i className="gate-arm" /></>}
            </span>
            <span className="destination-copy"><strong>{item.name}</strong><small>{item.kicker}</small></span>
            <span className={`service-pill ${item.status}`}>{item.status === "open" ? "PLAYABLE" : "COMING SOON"}</span>
          </button>
        ))}
      </div>
      <div className="selection-detail">
        <div><span className="detail-label">Selected destination</span><strong>{destination.name}</strong><p>{destination.description}</p></div>
        <button type="button" className="board-button" disabled={disabled} onClick={() => onTravel(destination.id, 1)}><span>{destination.status === "open" ? "Let's ride" : "Visit station"}</span><i aria-hidden="true" /></button>
      </div>
    </section>
  );
}

function UnavailableGame({ destination }: { destination: (typeof DESTINATIONS)[number] }) {
  return (
    <section className="unavailable-screen">
      <span className="construction-icon" aria-hidden="true">×</span>
      <p className="eyebrow">Station closed · Future service</p>
      <h2>{destination.name}</h2>
      <p>{destination.description}</p>
      <div className="service-notice"><span>NO GAME BUILD FOUND</span><p>This stop is shown on the route map only. Gameplay and backend integration have not been fabricated.</p></div>
    </section>
  );
}

export default function TrainExperience() {
  const [activeDestination, setActiveDestination] = useState<DestinationId>("home");
  const [pendingDestination, setPendingDestination] = useState<DestinationId | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyId>("medium");
  const [phase, setPhase] = useState<JourneyPhase>(JOURNEY_PHASES.IDLE);
  const [direction, setDirection] = useState<-1 | 1>(1);
  const [hasVisitedTurf, setHasVisitedTurf] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [muted, setMuted] = useState(true);
  const [serviceIssue, setServiceIssue] = useState<string | null>(null);
  const navigationLocked = useRef(false);
  const mountedRef = useRef(true);
  const environmentRef = useRef<HTMLElement | null>(null);
  const journeyAbortRef = useRef<AbortController | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const distanceRef = useRef(0);

  const activeIndex = DESTINATIONS.findIndex((item) => item.id === activeDestination);
  const active = DESTINATIONS[activeIndex];
  const difficultyConfig = DIFFICULTIES[difficulty];
  const doorsOpen = doorsAreOpen(phase);
  const interactionReady = phase === JOURNEY_PHASES.IDLE;

  const playCue = useCallback((cue: JourneyPhase) => {
    if (muted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const context = audioContextRef.current ?? new AudioContextClass();
      audioContextRef.current = context;
      void context.resume();
      if (cue === JOURNEY_PHASES.ACCELERATING) {
        const now = context.currentTime;
        const hornBus = context.createGain();
        const hornFilter = context.createBiquadFilter();
        hornFilter.type = "lowpass";
        hornFilter.frequency.setValueAtTime(1050, now);
        hornBus.gain.setValueAtTime(.0001, now);
        hornBus.gain.exponentialRampToValueAtTime(.075, now + .07);
        hornBus.gain.setValueAtTime(.075, now + .26);
        hornBus.gain.exponentialRampToValueAtTime(.0001, now + .72);
        hornBus.connect(hornFilter).connect(context.destination);
        [146.8, 185, 220].forEach((frequency, index) => {
          const oscillator = context.createOscillator();
          const voice = context.createGain();
          oscillator.type = index === 0 ? "sawtooth" : "triangle";
          oscillator.frequency.setValueAtTime(frequency, now);
          oscillator.frequency.linearRampToValueAtTime(frequency * .985, now + .72);
          voice.gain.value = index === 0 ? .42 : .28;
          oscillator.connect(voice).connect(hornBus);
          oscillator.start(now);
          oscillator.stop(now + .74);
        });
        return;
      }
      const frequencies: Partial<Record<JourneyPhase, number>> = {
        departure_warning: 880,
        doors_closing: 190,
        decelerating: 125,
        arrived: 660,
        doors_opening: 330,
      };
      const frequency = frequencies[cue];
      if (!frequency) return;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;
      oscillator.type = cue === JOURNEY_PHASES.DEPARTURE_WARNING ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(.045, now + .025);
      gain.gain.exponentialRampToValueAtTime(.0001, now + .18);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + .2);
    } catch {
      // Audio is decorative and must never block navigation.
    }
  }, [muted]);

  const commitDestination = useCallback((destination: DestinationId, historyMode: "push" | "replace" | "none") => {
    setActiveDestination(destination);
    if (destination === "turf") setHasVisitedTurf(true);
    if (historyMode === "none") return;
    const url = new URL(window.location.href);
    if (destination === "home") url.searchParams.delete("station");
    else url.searchParams.set("station", destination);
    window.history[historyMode === "replace" ? "replaceState" : "pushState"]({}, "", url);
  }, []);

  const travelTo = useCallback(async (destination: DestinationId, requestedDirection?: number, historyMode: "push" | "replace" | "none" = "push") => {
    if (!canStartJourney({ phase, currentDestination: activeDestination, targetDestination: destination, pendingDestination }) || navigationLocked.current) return;
    navigationLocked.current = true;
    setServiceIssue(null);
    const controller = new AbortController();
    journeyAbortRef.current = controller;
    const destinationIndex = DESTINATIONS.findIndex((item) => item.id === destination);
    setDirection(resolveTravelDirection(activeIndex, destinationIndex, requestedDirection));
    setPendingDestination(destination);

    try {
      const result = await runJourney({
        plan: createJourneyPlan({ reducedMotion }),
        signal: controller.signal,
        onPhase: (nextPhase) => {
          setPhase(nextPhase);
          playCue(nextPhase);
        },
        onCommit: () => commitDestination(destination, historyMode),
        onRecover: (error) => {
          if ((error as { name?: string })?.name !== "AbortError") setServiceIssue("Service interruption. The train has returned to a safe stop.");
        },
      });
      if (result.status === "cancelled" && !controller.signal.aborted) setServiceIssue("Journey cancelled. Please select your destination again.");
    } catch {
      setServiceIssue("Service interruption. Please retry or return to Game Select.");
    } finally {
      navigationLocked.current = false;
      if (mountedRef.current) {
        setPhase(JOURNEY_PHASES.IDLE);
        setPendingDestination(null);
      }
      if (journeyAbortRef.current === controller) journeyAbortRef.current = null;
    }
  }, [activeDestination, activeIndex, commitDestination, pendingDestination, phase, playCue, reducedMotion]);

  const navigateRelative = useCallback((offset: -1 | 1) => {
    const nextIndex = (activeIndex + offset + DESTINATIONS.length) % DESTINATIONS.length;
    void travelTo(DESTINATIONS[nextIndex].id, offset);
  }, [activeIndex, travelTo]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(media.matches);
    updateMotionPreference();
    media.addEventListener("change", updateMotionPreference);
    const initialDestination = destinationFromUrl();
    if (initialDestination !== "home") queueMicrotask(() => {
      setActiveDestination(initialDestination);
      if (initialDestination === "turf") setHasVisitedTurf(true);
    });
    return () => media.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      journeyAbortRef.current?.abort();
      if (audioContextRef.current && audioContextRef.current.state !== "closed") void audioContextRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (reducedMotion || !isMotionPhase(phase)) return;
    const environment = environmentRef.current;
    if (!environment) return;
    let animationFrame = 0;
    let previousTime = performance.now();
    const phaseStarted = previousTime;
    const maximumSpeed = 720;

    const updateMotion = (now: number) => {
      const deltaSeconds = Math.min((now - previousTime) / 1000, .05);
      const elapsed = now - phaseStarted;
      previousTime = now;
      let speed = maximumSpeed;
      if (phase === JOURNEY_PHASES.ACCELERATING) {
        const progress = Math.min(elapsed / JOURNEY_TIMINGS.accelerating, 1);
        speed = maximumSpeed * progress * progress * progress;
      } else if (phase === JOURNEY_PHASES.DECELERATING) {
        const progress = Math.min(elapsed / JOURNEY_TIMINGS.decelerating, 1);
        speed = maximumSpeed * Math.pow(1 - progress, 3);
      }
      distanceRef.current += speed * deltaSeconds * direction;
      const width = Math.max(window.innerWidth, 1);
      const offset = (factor: number) => {
        const normalized = ((distanceRef.current * factor) % width + width) % width;
        return `${-normalized}px`;
      };
      environment.style.setProperty("--parallax-sky", offset(.05));
      environment.style.setProperty("--parallax-city", offset(.15));
      environment.style.setProperty("--parallax-mid", offset(.4));
      environment.style.setProperty("--parallax-near", offset(.75));
      environment.style.setProperty("--parallax-rail", offset(1));
      environment.style.setProperty("--travel-light", `${.72 + Math.sin(distanceRef.current * .012) * .12}`);
      animationFrame = window.requestAnimationFrame(updateMotion);
    };

    animationFrame = window.requestAnimationFrame(updateMotion);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [direction, phase, reducedMotion]);

  useEffect(() => {
    const handlePopState = () => {
      const destination = destinationFromUrl();
      if (destination !== activeDestination && !navigationLocked.current) void travelTo(destination, undefined, "none");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [activeDestination, travelTo]);

  useEffect(() => {
    const handleKeyboardNavigation = (event: KeyboardEvent) => {
      if (activeDestination === "turf" || navigationLocked.current) return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, button, [contenteditable='true']")) return;
      if (event.key === "ArrowLeft") { event.preventDefault(); navigateRelative(-1); }
      if (event.key === "ArrowRight") { event.preventDefault(); navigateRelative(1); }
    };
    window.addEventListener("keydown", handleKeyboardNavigation);
    return () => window.removeEventListener("keydown", handleKeyboardNavigation);
  }, [activeDestination, navigateRelative]);

  const displayMessage = useMemo(() => {
    const next = DESTINATIONS.find((item) => item.id === pendingDestination);
    const messages: Partial<Record<JourneyPhase, string>> = {
      departure_warning: "STAND CLEAR · DEPARTURE READY",
      doors_closing: "DOORS CLOSING",
      accelerating: "DEPARTING",
      in_transit: `NEXT STOP: ${next?.name ?? active.name}`,
      decelerating: "APPROACHING STATION",
      arrived: `ARRIVING AT ${active.name}`,
      doors_opening: `WELCOME TO ${active.name}`,
    };
    return messages[phase] ?? (activeDestination === "home" ? "CURRENT STATION: GAME SELECT" : `CURRENT STATION: ${active.name}`);
  }, [active.name, activeDestination, pendingDestination, phase]);

  return (
    <main
      className={`experience phase-${phase} direction-${direction > 0 ? "forward" : "reverse"}`}
      data-journey-phase={phase}
      style={{ "--line-color": difficultyConfig.color, "--line-glow": `${difficultyConfig.color}66` } as CSSProperties}
    >
      <header className="player-header">
        <button type="button" className="brand" onClick={() => void travelTo("home", -1)} disabled={!interactionReady}>
          <span className="t-roundel">T</span><span><strong>MBTA TURF WARS</strong><small>Challenge line · Boston</small></span>
        </button>
        <nav aria-label="Player navigation">
          <button type="button" onClick={() => void travelTo("home", -1)} disabled={!interactionReady}>Home</button>
          <button type="button" onClick={() => void travelTo("turf", 1)} disabled={!interactionReady}>Leaderboard</button>
          <button type="button" className="audio-toggle" onClick={() => setMuted((value) => !value)} aria-pressed={!muted} title={muted ? "Enable journey sound" : "Mute journey sound"}>{muted ? "Sound off" : "Sound on"}</button>
          <button type="button" className="profile-chip" disabled title="Profile route is not implemented in this repository"><span className="avatar">KS</span><span><strong>Guest rider</strong><small>Profile unavailable</small></span></button>
        </nav>
      </header>

      <section className="route-and-controls" aria-label="Challenge line route">
        <div className="route-progress">
          {DESTINATIONS.map((destination, index) => (
            <button type="button" key={destination.id} className={activeDestination === destination.id ? "active" : ""} onClick={() => void travelTo(destination.id, index < activeIndex ? -1 : 1)} disabled={!interactionReady} aria-label={`Travel to ${destination.name}${destination.status === "soon" ? ", coming soon" : ""}`}>
              <span className="route-node">{index === 0 ? "T" : index}</span><span>{destination.shortName}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="station-environment" ref={environmentRef}>
        <BostonEnvironment />
        <div className="journey-status" aria-hidden="true"><span>{phase.replaceAll("_", " ")}</span><i /></div>
        <div className="train-track">
          <div className="subway-train">
            <div className="train-roof">
              <div className="roof-vents" aria-hidden="true"><i /><i /><i /></div>
              <span className="car-number">01872</span>
              <div className="destination-display" role="status" aria-live="polite"><span className="led-dot" /><strong>{displayMessage}</strong><small>{difficultyConfig.line.toUpperCase()} · {difficultyConfig.label.toUpperCase()}</small></div>
              <span className="service-badge">BOSTON</span>
            </div>
            <div className="train-stripe" />
            <div className="train-body">
              <aside className="train-side left-side">
                <div className="subway-window" aria-hidden="true"><span className="window-city" /><span className="passing-light one" /><span className="passing-light two" /></div>
                <span className="train-roundel" aria-hidden="true">T</span>
                <button type="button" className="train-nav-button" onClick={() => navigateRelative(-1)} disabled={!interactionReady} aria-keyshortcuts="ArrowLeft"><span className="nav-symbol">‹</span><span><small>PREVIOUS STOP</small><strong>{DESTINATIONS[(activeIndex - 1 + DESTINATIONS.length) % DESTINATIONS.length].shortName}</strong></span></button>
              </aside>
              <div className="doorway-frame">
                <div className="game-viewport">
                  {activeDestination === "home" && <HomeSelection onTravel={travelTo} disabled={!interactionReady} />}
                  {(hasVisitedTurf || activeDestination === "turf") && <div className={`viewport-layer ${activeDestination === "turf" ? "is-active" : "is-hidden"}`}><TurfWarsGame difficulty={difficultyConfig} isActive={isDestinationInteractive(phase, activeDestination, "turf")} /></div>}
                  {(activeDestination === "signal" || activeDestination === "charlie") && <UnavailableGame destination={active} />}
                </div>
                <div className={`train-doors ${doorsOpen ? "open" : "closed"}`} data-door-state={doorsOpen ? "open" : "closed"} aria-hidden="true">
                  <div className="door-panel door-left"><span className="door-warning-light" /><span className="door-window"><i /></span><span className="door-seam-label">STAND CLEAR</span><span className="door-handle" /><span className="door-rivets" /></div>
                  <div className="door-panel door-right"><span className="door-warning-light" /><span className="door-window"><i /></span><span className="door-seam-label">OF CLOSING DOORS</span><span className="door-handle" /><span className="door-rivets" /></div>
                </div>
              </div>
              <aside className="train-side right-side">
                <div className="subway-window" aria-hidden="true"><span className="window-city" /><span className="passing-light one" /><span className="passing-light two" /></div>
                <span className="train-roundel" aria-hidden="true">T</span>
                <button type="button" className="train-nav-button" onClick={() => navigateRelative(1)} disabled={!interactionReady} aria-keyshortcuts="ArrowRight"><span><small>NEXT STOP</small><strong>{DESTINATIONS[(activeIndex + 1) % DESTINATIONS.length].shortName}</strong></span><span className="nav-symbol">›</span></button>
              </aside>
            </div>
            <div className="train-undercarriage" aria-hidden="true"><i className="bogie bogie-left" /><span /><span /><b className="equipment-box" /><span /><span /><i className="bogie bogie-right" /></div>
          </div>
        </div>
        <div className="platform-edge" aria-hidden="true"><span>STAND BEHIND YELLOW LINE</span><span>STAND BEHIND YELLOW LINE</span><span>STAND BEHIND YELLOW LINE</span></div>
      </section>

      <section className="difficulty-dock" aria-label="Difficulty controls">
        <span className="difficulty-title">Difficulty</span>
        <fieldset className="difficulty-selector">
          <legend>Difficulty · visual theme</legend>
          {(Object.entries(DIFFICULTIES) as Array<[DifficultyId, (typeof DIFFICULTIES)[DifficultyId]]>).map(([id, item]) => (
            <button type="button" key={id} className={difficulty === id ? "active" : ""} onClick={() => setDifficulty(id)} aria-pressed={difficulty === id} title={`${item.label} · ${item.line}`}><span style={{ backgroundColor: item.color }}>{item.code}</span>{item.label}</button>
          ))}
        </fieldset>
      </section>

      {serviceIssue && <div className="service-disruption" role="alert"><strong>Service notice</strong><span>{serviceIssue}</span><button type="button" onClick={() => setServiceIssue(null)}>Dismiss</button></div>}
      <footer className="system-footer"><span><i className="status-light" /> Train 01872 · {interactionReady ? "Service normal" : "Journey in progress"}</span><span><kbd>←</kbd> <kbd>→</kbd> Navigate stops outside active games · Difficulty changes presentation only.</span></footer>
    </main>
  );
}
