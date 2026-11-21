"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import BostonEnvironment from "./BostonEnvironment";
import GameArtwork from "./GameArtwork";
import { useAppState } from "./AppState";
import { DIFFICULTIES, GAMES, isGameId, type GameId } from "./gameConfig";
import { adjacentGameId } from "./gameModel.mjs";
import {
  JOURNEY_PHASES,
  JOURNEY_TIMINGS,
  canStartJourney,
  createJourneyPlan,
  doorsAreOpen,
  isMotionPhase,
  resolveTravelDirection,
  runJourney,
  type JourneyPhase,
} from "./trainTransition.mjs";

function requestedStation(): GameId | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("station");
  return isGameId(value) ? value : null;
}

function GameStopPanel({ game, onPlay, disabled }: { game: (typeof GAMES)[number]; onPlay: () => void; disabled: boolean }) {
  const playable = game.availability === "playable";
  return (
    <section className="game-stop-panel" aria-labelledby="game-stop-title">
      <div className="game-stop-art"><GameArtwork game={game.id} /><span className="stop-number">STOP {String(GAMES.findIndex((entry) => entry.id === game.id) + 1).padStart(2, "0")}</span></div>
      <div className="game-stop-copy">
        <p className="eyebrow">{game.subtitle}</p>
        <h1 id="game-stop-title">{game.name}</h1>
        <p className="game-description">{game.description}</p>
        <div className="game-instructions"><strong>{playable ? "How to play" : "Service notice"}</strong><span>{game.instructions}</span></div>
        <button type="button" className="board-button play-game-button" onClick={onPlay} disabled={disabled || !playable}>{playable ? "Play Game" : "Coming Soon"}</button>
      </div>
    </section>
  );
}

export default function TrainExperience() {
  const router = useRouter();
  const { difficulty, setDifficulty, muted, selectedGame, setSelectedGame } = useAppState();
  const [pendingGame, setPendingGame] = useState<GameId | null>(null);
  const [phase, setPhase] = useState<JourneyPhase>(JOURNEY_PHASES.IDLE);
  const [direction, setDirection] = useState<-1 | 1>(1);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [serviceIssue, setServiceIssue] = useState<string | null>(null);
  const navigationLocked = useRef(false);
  const mountedRef = useRef(true);
  const environmentRef = useRef<HTMLElement | null>(null);
  const journeyAbortRef = useRef<AbortController | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const distanceRef = useRef(0);

  const activeIndex = GAMES.findIndex((game) => game.id === selectedGame);
  const active = GAMES[activeIndex] ?? GAMES[0];
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
        const filter = context.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1050, now);
        hornBus.gain.setValueAtTime(.0001, now);
        hornBus.gain.exponentialRampToValueAtTime(.075, now + .07);
        hornBus.gain.setValueAtTime(.075, now + .26);
        hornBus.gain.exponentialRampToValueAtTime(.0001, now + .72);
        hornBus.connect(filter).connect(context.destination);
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
      const frequency = ({ departure_warning: 880, doors_closing: 190, decelerating: 125, arrived: 660, doors_opening: 330 } as Partial<Record<JourneyPhase, number>>)[cue];
      if (!frequency) return;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;
      oscillator.type = cue === JOURNEY_PHASES.DEPARTURE_WARNING ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(.035, now + .025);
      gain.gain.exponentialRampToValueAtTime(.0001, now + .18);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + .2);
    } catch {
      // Decorative audio must never interrupt navigation.
    }
  }, [muted]);

  const commitGame = useCallback((game: GameId, historyMode: "push" | "replace" | "none") => {
    setSelectedGame(game);
    if (historyMode === "none") return;
    const url = new URL(window.location.href);
    url.searchParams.set("station", game);
    window.history[historyMode === "replace" ? "replaceState" : "pushState"]({}, "", url);
  }, [setSelectedGame]);

  const travelTo = useCallback(async (game: GameId, requestedDirection?: number, historyMode: "push" | "replace" | "none" = "push") => {
    if (!canStartJourney({ phase, currentDestination: selectedGame, targetDestination: game, pendingDestination: pendingGame }) || navigationLocked.current) return;
    navigationLocked.current = true;
    setServiceIssue(null);
    const controller = new AbortController();
    journeyAbortRef.current = controller;
    const nextIndex = GAMES.findIndex((item) => item.id === game);
    setDirection(resolveTravelDirection(activeIndex, nextIndex, requestedDirection));
    setPendingGame(game);
    try {
      await runJourney({
        plan: createJourneyPlan({ reducedMotion }),
        signal: controller.signal,
        onPhase: (nextPhase) => { setPhase(nextPhase); playCue(nextPhase); },
        onCommit: () => commitGame(game, historyMode),
        onRecover: (error) => { if ((error as { name?: string })?.name !== "AbortError") setServiceIssue("Service interruption. The train returned to a safe stop."); },
      });
    } catch {
      setServiceIssue("Service interruption. Please select the stop again.");
    } finally {
      navigationLocked.current = false;
      if (mountedRef.current) { setPhase(JOURNEY_PHASES.IDLE); setPendingGame(null); }
      if (journeyAbortRef.current === controller) journeyAbortRef.current = null;
    }
  }, [activeIndex, commitGame, pendingGame, phase, playCue, reducedMotion, selectedGame]);

  const navigateRelative = useCallback((offset: -1 | 1) => {
    const next = adjacentGameId(selectedGame, offset);
    if (next) void travelTo(next, offset);
  }, [selectedGame, travelTo]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    const initial = requestedStation() ?? "turf";
    queueMicrotask(() => commitGame(initial, "replace"));
    return () => media.removeEventListener("change", update);
  }, [commitGame]);

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
    let frame = 0;
    let previousTime = performance.now();
    const phaseStarted = previousTime;
    const updateMotion = (now: number) => {
      const delta = Math.min((now - previousTime) / 1000, .05);
      const elapsed = now - phaseStarted;
      previousTime = now;
      let speed = 720;
      if (phase === JOURNEY_PHASES.ACCELERATING) speed *= Math.pow(Math.min(elapsed / JOURNEY_TIMINGS.accelerating, 1), 3);
      if (phase === JOURNEY_PHASES.DECELERATING) speed *= Math.pow(1 - Math.min(elapsed / JOURNEY_TIMINGS.decelerating, 1), 3);
      distanceRef.current += speed * delta * direction;
      const width = Math.max(window.innerWidth, 1);
      const offset = (factor: number) => `${-(((distanceRef.current * factor) % width + width) % width)}px`;
      environment.style.setProperty("--parallax-sky", offset(.05));
      environment.style.setProperty("--parallax-city", offset(.15));
      environment.style.setProperty("--parallax-mid", offset(.4));
      environment.style.setProperty("--parallax-near", offset(.75));
      environment.style.setProperty("--parallax-rail", offset(1));
      environment.style.setProperty("--travel-light", `${.76 + Math.sin(distanceRef.current * .012) * .1}`);
      frame = requestAnimationFrame(updateMotion);
    };
    frame = requestAnimationFrame(updateMotion);
    return () => cancelAnimationFrame(frame);
  }, [direction, phase, reducedMotion]);

  useEffect(() => {
    const onPopState = () => {
      const game = requestedStation() ?? "turf";
      if (game !== selectedGame && !navigationLocked.current) void travelTo(game, undefined, "none");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [selectedGame, travelTo]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (navigationLocked.current || (event.target as HTMLElement | null)?.matches("input,textarea,select,button,[contenteditable='true']")) return;
      if (event.key === "ArrowLeft" && activeIndex > 0) { event.preventDefault(); navigateRelative(-1); }
      if (event.key === "ArrowRight" && activeIndex < GAMES.length - 1) { event.preventDefault(); navigateRelative(1); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, navigateRelative]);

  const journeyMessage = useMemo(() => {
    const next = GAMES.find((game) => game.id === pendingGame);
    return ({
      departure_warning: "STAND CLEAR · DEPARTURE READY",
      doors_closing: "DOORS CLOSING",
      accelerating: "DEPARTING",
      in_transit: `NEXT STOP · ${next?.name ?? active.name}`,
      decelerating: "APPROACHING STATION",
      arrived: `ARRIVING · ${active.name}`,
      doors_opening: `WELCOME · ${active.name}`,
    } as Partial<Record<JourneyPhase, string>>)[phase] ?? `CURRENT STOP · ${active.name}`;
  }, [active.name, pendingGame, phase]);

  return (
    <main className={`experience station-selector phase-${phase} direction-${direction > 0 ? "forward" : "reverse"}`} data-journey-phase={phase} data-selected-game={selectedGame} style={{ "--line-color": difficultyConfig.color, "--line-glow": `${difficultyConfig.color}66` } as CSSProperties}>
      <section className="station-controls" aria-label="Game stop and difficulty controls">
        <div className="route-progress game-route-progress">
          {GAMES.map((game, index) => <button type="button" key={game.id} className={selectedGame === game.id ? "active" : ""} onClick={() => void travelTo(game.id, index < activeIndex ? -1 : 1)} disabled={!interactionReady}><span className="route-node">{index + 1}</span><span>{game.shortName}</span></button>)}
        </div>
        <fieldset className="difficulty-selector roof-difficulty"><legend>Difficulty and MBTA line</legend>{(Object.entries(DIFFICULTIES) as Array<[keyof typeof DIFFICULTIES, (typeof DIFFICULTIES)[keyof typeof DIFFICULTIES]]>).map(([id, item]) => <button type="button" key={id} className={difficulty === id ? "active" : ""} onClick={() => setDifficulty(id)} aria-pressed={difficulty === id}><span style={{ backgroundColor: item.color }}>{item.code}</span><strong>{item.line}</strong><small>{item.label}</small></button>)}</fieldset>
      </section>

      <section className="station-environment" ref={environmentRef}>
        <BostonEnvironment />
        <div className="journey-status" role="status" aria-live="polite"><span>{journeyMessage}</span><i /></div>
        <div className="train-track"><div className="subway-train">
          <div className="train-roof">
            <div className="roof-vents" aria-hidden="true"><i /><i /><i /></div>
            <span className="car-number">01872</span>
            <div className="destination-display authentic-destination" aria-label={`${difficultyConfig.line} destination ${difficultyConfig.destination}`}><span className="led-dot" /><strong>{difficultyConfig.destination}</strong><small>{difficultyConfig.line.toUpperCase()} · {difficultyConfig.label.toUpperCase()}</small></div>
            <span className="service-badge">BOSTON</span>
          </div>
          <div className="train-stripe" />
          <div className="train-body">
            <aside className="train-side left-side">
              <div className="subway-window passenger-window" aria-hidden="true"><span className="window-city" /><span className="passing-light one" /><span className="passing-light two" /></div>
              <span className="train-roundel side-mounted" aria-hidden="true">T</span>
              <button type="button" className="train-nav-button" onClick={() => navigateRelative(-1)} disabled={!interactionReady || activeIndex === 0} aria-keyshortcuts="ArrowLeft"><span className="nav-symbol">‹</span><span><small>PREVIOUS STOP</small><strong>{activeIndex > 0 ? GAMES[activeIndex - 1].shortName : "Start of line"}</strong></span></button>
            </aside>
            <div className="doorway-frame">
              <div className="game-viewport"><GameStopPanel game={active} disabled={!interactionReady} onPlay={() => { if (active.route) router.push(active.route); }} /></div>
              <div className={`train-doors ${doorsOpen ? "open" : "closed"}`} data-door-state={doorsOpen ? "open" : "closed"} aria-hidden="true">
                <div className="door-panel door-left"><span className="door-warning-light" /><span className="door-window"><i /></span><span className="door-seam-label">STAND CLEAR</span><span className="door-handle" /><span className="door-rivets" /></div>
                <div className="door-panel door-right"><span className="door-warning-light" /><span className="door-window"><i /></span><span className="door-seam-label">OF CLOSING DOORS</span><span className="door-handle" /><span className="door-rivets" /></div>
              </div>
            </div>
            <aside className="train-side right-side cab-side">
              <div className="subway-window cab-window" aria-label="Illustrated train operator in the front cab"><div className="cab-interior"><span className="operator-cap" /><span className="operator-head"><i /></span><span className="operator-body" /><span className="operator-arm" /><span className="cab-controls" /></div><span className="window-reflection" /><span className="passing-light one" /><span className="passing-light two" /></div>
              <span className="cab-headlight" aria-hidden="true" />
              <button type="button" className="train-nav-button" onClick={() => navigateRelative(1)} disabled={!interactionReady || activeIndex === GAMES.length - 1} aria-keyshortcuts="ArrowRight"><span><small>NEXT STOP</small><strong>{activeIndex < GAMES.length - 1 ? GAMES[activeIndex + 1].shortName : "End of line"}</strong></span><span className="nav-symbol">›</span></button>
            </aside>
          </div>
          <div className="train-undercarriage" aria-hidden="true"><i className="bogie bogie-left" /><span /><span /><b className="equipment-box" /><span /><span /><i className="bogie bogie-right" /></div>
        </div></div>
        <div className="platform-edge" aria-hidden="true"><span>STAND BEHIND YELLOW LINE</span><span>STAND BEHIND YELLOW LINE</span><span>STAND BEHIND YELLOW LINE</span></div>
      </section>

      {serviceIssue && <div className="service-disruption" role="alert"><strong>Service notice</strong><span>{serviceIssue}</span><button type="button" onClick={() => setServiceIssue(null)}>Dismiss</button></div>}
      <footer className="system-footer"><span><i className="status-light" /> Train 01872 · {interactionReady ? "Service normal" : "Journey in progress"}</span><span>Unofficial student game · Not affiliated with the MBTA</span></footer>
    </main>
  );
}
