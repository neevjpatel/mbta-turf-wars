"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import catalog from "../../geoguesser/geoguesser.json";
import bostonCollegeOne from "../../geoguesser/boston_college_1_medium.json";
import bostonCollegeTwo from "../../geoguesser/boston_college_2_hard.json";
import chestnutHillOne from "../../geoguesser/chestnut_hill_1_easy.json";
import chestnutHillTwo from "../../geoguesser/chestnut_hill_2_extreme.json";
import chiswickRoadOne from "../../geoguesser/chiswick_road_1_hard.json";
import southStationOne from "../../geoguesser/south_station_1_hard.json";
import southStationTwo from "../../geoguesser/south_station_2_easy.json";
import southStationThree from "../../geoguesser/south_station_3_medium.json";
import bostonCollegeImageOne from "../../geoguesser/boston_college_1_medium.png";
import bostonCollegeImageTwo from "../../geoguesser/boston_college_2_hard.png";
import chestnutHillImageOne from "../../geoguesser/chestnut_hill_1_easy.png";
import chestnutHillImageTwo from "../../geoguesser/chestnut_hill_2_extreme.png";
import chiswickRoadImageOne from "../../geoguesser/chiswick_road_1_hard.png";
import southStationImageOne from "../../geoguesser/south_station_1_hard.png";
import southStationImageTwo from "../../geoguesser/south_station_2_easy.png";
import southStationImageThree from "../../geoguesser/south_station_3_medium.png";
import allstonStreetOne from "../../geoguesser/allston_street_1_medium.json";
import allstonStreetTwo from "../../geoguesser/allston_street_2_easy.json";
import chiswickRoadTwo from "../../geoguesser/chiswick_road_2_extreme.json";
import griggsStreetOne from "../../geoguesser/griggs_street_1_extreme.json";
import griggsStreetTwo from "../../geoguesser/griggs_street_2_medium.json";
import griggsStreetThree from "../../geoguesser/griggs_street_3_hard.json";
import harvardAveOne from "../../geoguesser/harvard_ave_1_hard.json";
import harvardAveTwo from "../../geoguesser/harvard_ave_2_easy.json";
import harvardAveThree from "../../geoguesser/harvard_ave_3_extreme.json";
import packardsCornerOne from "../../geoguesser/packards_corner_1_easy.json";
import sutherlandRoadOne from "../../geoguesser/sutherland_road_1_easy.json";
import sutherlandRoadTwo from "../../geoguesser/sutherland_road_2_extreme.json";
import warrenStreetOne from "../../geoguesser/warren_street_1_easy.json";
import warrenStreetTwo from "../../geoguesser/warren_street_2_hard.json";
import washingtonStreetOne from "../../geoguesser/washington_street_1_extreme.json";
import washingtonStreetTwo from "../../geoguesser/washington_street_2_medium.json";
import allstonStreetImageOne from "../../geoguesser/allston_street_1_medium.png";
import allstonStreetImageTwo from "../../geoguesser/allston_street_2_easy.png";
import chiswickRoadImageTwo from "../../geoguesser/chiswick_road_2_extreme.png";
import griggsStreetImageOne from "../../geoguesser/griggs_street_1_extreme.png";
import griggsStreetImageTwo from "../../geoguesser/griggs_street_2_medium.png";
import griggsStreetImageThree from "../../geoguesser/griggs_street_3_hard.png";
import harvardAveImageOne from "../../geoguesser/harvard_ave_1_hard.png";
import harvardAveImageTwo from "../../geoguesser/harvard_ave_2_easy.png";
import harvardAveImageThree from "../../geoguesser/harvard_ave_3_extreme.png";
import packardsCornerImageOne from "../../geoguesser/packards_corner_1_easy.png";
import sutherlandRoadImageOne from "../../geoguesser/sutherland_road_1_easy.png";
import sutherlandRoadImageTwo from "../../geoguesser/sutherland_road_2_extreme.png";
import warrenStreetImageOne from "../../geoguesser/warren_street_1_easy.png";
import warrenStreetImageTwo from "../../geoguesser/warren_street_2_hard.png";
import washingtonStreetImageOne from "../../geoguesser/washington_street_1_extreme.png";
import washingtonStreetImageTwo from "../../geoguesser/washington_street_2_medium.png";
import { GEOGUESSER_STATIONS } from "./stations";
import type { StopData } from "../mbtaData";

const StationMap = dynamic(() => import("./StationMap"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center bg-slate-900 text-sm text-slate-200">Loading map…</div>,
});

export type GameDifficulty = "easy" | "medium" | "hard" | "extreme";
type ImageEntry = (typeof catalog.images)[number];
type ImageAnswer = { correctStationId: string; coordinates: { latitude: number; longitude: number } | null };

const answers: Record<string, ImageAnswer> = {
  boston_college_1_medium: bostonCollegeOne,
  boston_college_2_hard: bostonCollegeTwo,
  chestnut_hill_1_easy: chestnutHillOne,
  chestnut_hill_2_extreme: chestnutHillTwo,
  chiswick_road_1_hard: chiswickRoadOne,
  south_station_1_hard: southStationOne,
  south_station_2_easy: southStationTwo,
  south_station_3_medium: southStationThree,
  allston_street_1_medium: allstonStreetOne,
  allston_street_2_easy: allstonStreetTwo,
  chiswick_road_2_extreme: chiswickRoadTwo,
  griggs_street_1_extreme: griggsStreetOne,
  griggs_street_2_medium: griggsStreetTwo,
  griggs_street_3_hard: griggsStreetThree,
  harvard_ave_1_hard: harvardAveOne,
  harvard_ave_2_easy: harvardAveTwo,
  harvard_ave_3_extreme: harvardAveThree,
  packards_corner_1_easy: packardsCornerOne,
  sutherland_road_1_easy: sutherlandRoadOne,
  sutherland_road_2_extreme: sutherlandRoadTwo,
  warren_street_1_easy: warrenStreetOne,
  warren_street_2_hard: warrenStreetTwo,
  washington_street_1_extreme: washingtonStreetOne,
  washington_street_2_medium: washingtonStreetTwo,
};

const imageSources = {
  boston_college_1_medium: bostonCollegeImageOne,
  boston_college_2_hard: bostonCollegeImageTwo,
  chestnut_hill_1_easy: chestnutHillImageOne,
  chestnut_hill_2_extreme: chestnutHillImageTwo,
  chiswick_road_1_hard: chiswickRoadImageOne,
  south_station_1_hard: southStationImageOne,
  south_station_2_easy: southStationImageTwo,
  south_station_3_medium: southStationImageThree,
  allston_street_1_medium: allstonStreetImageOne,
  allston_street_2_easy: allstonStreetImageTwo,
  chiswick_road_2_extreme: chiswickRoadImageTwo,
  griggs_street_1_extreme: griggsStreetImageOne,
  griggs_street_2_medium: griggsStreetImageTwo,
  griggs_street_3_hard: griggsStreetImageThree,
  harvard_ave_1_hard: harvardAveImageOne,
  harvard_ave_2_easy: harvardAveImageTwo,
  harvard_ave_3_extreme: harvardAveImageThree,
  packards_corner_1_easy: packardsCornerImageOne,
  sutherland_road_1_easy: sutherlandRoadImageOne,
  sutherland_road_2_extreme: sutherlandRoadImageTwo,
  warren_street_1_easy: warrenStreetImageOne,
  warren_street_2_hard: warrenStreetImageTwo,
  washington_street_1_extreme: washingtonStreetImageOne,
  washington_street_2_medium: washingtonStreetImageTwo,
};

const difficultyInfo: Record<GameDifficulty, { label: string; color: string }> = {
  easy: { label: "Easy", color: "#34d399" },
  medium: { label: "Medium", color: "#fb923c" },
  hard: { label: "Hard", color: "#60a5fa" },
  extreme: { label: "Extreme", color: "#f87171" },
};

function distanceKm(first: StopData, second: StopData) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const lat1 = radians(first.lat);
  const lat2 = radians(second.lat);
  const deltaLat = radians(second.lat - first.lat);
  const deltaLng = radians(second.lng - first.lng);
  const haversine = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function shuffleImages<T>(images: T[]) {
  const shuffled = [...images];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function ConfettiBurst() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    if (!portalTarget) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const colors = ["#34d399", "#fbbf24", "#fb7185", "#60a5fa", "#e879f9", "#ffffff"];
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    context.scale(pixelRatio, pixelRatio);

    const pixelsPerMeter = height / 1.8;
    const framesPerSecond = 60;
    const speedScale = 0.75;
    const earthGravityPxPerFrameSquared = (9.81 * pixelsPerMeter) / (framesPerSecond * framesPerSecond);
    const particles = Array.from({ length: 75 }, (_, pairIndex) => {
      const gravity = earthGravityPxPerFrameSquared * speedScale ** 2;
      const apexHeight = height * (0.55 + Math.random() * 0.35);
      const vy = -Math.sqrt(2 * gravity * apexHeight);
      const targetY = height * (1.12 + Math.random() * 0.15);
      const startY = height + 8;
      const fallDistance = targetY - startY;
      const flightFrames = (-vy + Math.sqrt(vy * vy + 2 * gravity * fallDistance)) / gravity;
      const leftTargetX = width * (0.25 + Math.random() * 1.05);
      const rotation = Math.random() * Math.PI;
      const spin = (Math.random() - 0.5) * 0.28;
      const w = 5 + Math.random() * 7;
      const h = 8 + Math.random() * 9;
      const color = colors[pairIndex % colors.length];
      const makeParticle = (fromLeft: boolean) => {
        const startX = fromLeft ? 10 : width - 10;
        const targetX = fromLeft ? leftTargetX : width - leftTargetX;
        return {
          x: startX,
          y: startY,
          vx: (targetX - startX) / flightFrames,
          vy,
          gravity,
          rotation: fromLeft ? rotation : -rotation,
          spin: fromLeft ? spin : -spin,
          w,
          h,
          color,
          opacity: 1,
        };
      };

      return [makeParticle(true), makeParticle(false)];
    }).flat();

    let frame = 0;
    let previousTime = performance.now();
    const startedAt = previousTime;

    const draw = (time: number) => {
      const delta = Math.min((time - previousTime) / 16.67, 2.5);
      previousTime = time;
      context.clearRect(0, 0, width, height);

      for (const particle of particles) {
        particle.vy += particle.gravity * delta;
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.rotation += particle.spin * delta;
        particle.opacity = Math.min(1, Math.max(0, (height + 40 - particle.y) / 120));

        context.save();
        context.globalAlpha = particle.opacity;
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        context.fillStyle = particle.color;
        context.fillRect(-particle.w / 2, -particle.h / 2, particle.w, particle.h);
        context.restore();
      }

      if (time - startedAt < 5000 && particles.some((particle) => particle.y <= height + 40 && particle.opacity > 0)) {
        frame = requestAnimationFrame(draw);
      } else {
        context.clearRect(0, 0, width, height);
      }
    };

    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      context.clearRect(0, 0, width, height);
    };
  }, [portalTarget]);

  if (!portalTarget) return null;
  return createPortal(
    <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 h-screen w-screen" style={{ zIndex: 2147483647 }} aria-hidden="true" />,
    portalTarget
  );
}

export default function GeoGuessrGame({ difficulty }: { difficulty: GameDifficulty }) {
  const [round, setRound] = useState(0);
  const [selectedStation, setSelectedStation] = useState<StopData | null>(null);
  const [result, setResult] = useState<{ guessed: StopData; correct: StopData; distance: number; points: number } | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [loadedImageId, setLoadedImageId] = useState<string | null>(null);

  const eligibleImages = useMemo(() => catalog.images.filter((entry) => entry.difficulty === difficulty), [difficulty]);
  const [imageOrder, setImageOrder] = useState<ImageEntry[]>(eligibleImages);
  useEffect(() => {
    setImageOrder(shuffleImages(eligibleImages));
  }, [eligibleImages]);
  const image: ImageEntry = imageOrder[round % imageOrder.length];
  const correctStation = GEOGUESSER_STATIONS.find((station) => station.id === answers[image.id].correctStationId)!;

  const submitGuess = () => {
    if (!selectedStation || result) return;
    const distance = distanceKm(selectedStation, correctStation);
    const points = selectedStation.id === correctStation.id ? 50 : 0;
    setResult({ guessed: selectedStation, correct: correctStation, distance, points });
    setTotalPoints((previous) => previous + points);
  };

  const nextRound = () => {
    setRound((previous) => (previous + 1) % imageOrder.length);
    setSelectedStation(null);
    setResult(null);
  };

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#07111c] text-white">
      <Image
        src={imageSources[image.id as keyof typeof imageSources]}
        alt={image.alt}
        fill
        priority
        sizes="100vw"
        onLoad={() => setLoadedImageId(image.id)}
        className={`object-cover transition-[filter,transform] duration-700 ease-out ${loadedImageId === image.id ? "scale-100 blur-0" : "scale-[1.03] blur-xl"}`}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/65 via-black/5 to-black/70" />
      {result?.points === 50 && <ConfettiBurst key={`confetti-${round}`} />}

      <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-end gap-3 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="rounded-lg bg-black/40 px-3 py-2 text-sm font-semibold text-white/90 backdrop-blur sm:hidden">Pick station</div>
          <div className="hidden rounded-lg bg-black/40 px-3 py-2 text-sm font-semibold text-white/90 backdrop-blur sm:block">Pick nearest station</div>
          <div className="rounded-lg bg-black/40 px-3 py-2 text-right text-xs font-bold uppercase text-white/90 backdrop-blur">{difficultyInfo[difficulty].label} · {round + 1} · {totalPoints} pts</div>
          <Link href="/" className="rounded-lg bg-black/40 px-3 py-2 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-black/60">Exit</Link>
        </div>
      </header>

      <section
        className={`group absolute bottom-4 right-4 z-30 overflow-hidden rounded-2xl border border-white/25 bg-slate-950/90 shadow-2xl backdrop-blur transition-[width,height] duration-300 ease-out sm:bottom-6 sm:right-6 ${mapExpanded ? "h-[min(72vh,640px)] w-[min(92vw,640px)]" : "h-56 w-80 sm:h-64 sm:w-96"}`}
        aria-label="Station guess map"
        onMouseEnter={() => setMapExpanded(true)}
        onMouseLeave={() => setMapExpanded(false)}
        onFocus={() => setMapExpanded(true)}
      >
        <button
          type="button"
          className="absolute right-2 top-2 z-[600] rounded-lg border border-white/20 bg-slate-950/90 px-3 py-2 text-xs font-extrabold text-white shadow-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          onClick={() => setMapExpanded((expanded) => !expanded)}
          aria-expanded={mapExpanded}
          >{mapExpanded ? "Collapse map" : "Expand map"}</button>
        <div className="absolute inset-0 pb-[76px]">
          <StationMap
            stations={GEOGUESSER_STATIONS}
            selectedId={selectedStation?.id ?? null}
            correctStationId={result?.correct.id ?? null}
            incorrectGuessId={result && result.points === 0 ? result.guessed.id : null}
            revealedDistanceKm={result && result.points === 0 ? result.distance : null}
            onSelect={(station) => !result && setSelectedStation(station)}
            locked={Boolean(result)}
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 z-[550] border-t border-white/15 bg-slate-950/95 p-3 backdrop-blur" aria-live="polite">
          {result ? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 text-xs leading-5">
                <p className="font-extrabold text-emerald-200">{result.points === 50 ? "Correct · +50 points" : "No points this round"}</p>
                <p className="truncate text-white/85">{result.guessed.name} → {result.correct.name} · {result.distance.toFixed(2)} km</p>
              </div>
              <button type="button" onClick={nextRound} className="shrink-0 rounded-lg bg-emerald-300 px-3 py-2 text-xs font-extrabold text-[#07111c] transition hover:bg-emerald-200">Next image</button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-bold text-white" aria-label="Selected station">{selectedStation?.name ?? "Choose station"}</p>
              <button type="button" disabled={!selectedStation} onClick={submitGuess} className="shrink-0 rounded-lg bg-emerald-300 px-4 py-2.5 text-xs font-extrabold text-[#07111c] transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-40">Guess</button>
            </div>
          )}
        </div>
      </section>
      <p className="absolute bottom-1 right-4 z-10 text-[10px] text-white/60 drop-shadow sm:bottom-1 sm:right-6">Map data © OpenStreetMap contributors</p>
    </main>
  );
}
