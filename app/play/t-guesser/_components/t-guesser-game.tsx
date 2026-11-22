"use client";

import Image from "next/image";
import { useAppState } from "@/app/_state/app-state";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { T_GUESSER_IMAGES_BY_DIFFICULTY, T_GUESSER_STATIONS, type TGuesserDifficulty, type TGuesserImage, type TGuesserStation } from "../_data/t-guesser-data";

const StationMap = dynamic(() => import("./station-map"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center bg-slate-900 text-sm text-slate-200">Loading map…</div>,
});

const difficultyInfo: Record<TGuesserDifficulty, { label: string; color: string }> = {
  easy: { label: "Easy", color: "#34d399" },
  medium: { label: "Medium", color: "#fb923c" },
  hard: { label: "Hard", color: "#60a5fa" },
  extreme: { label: "Extreme", color: "#f87171" },
};

function distanceKm(first: TGuesserStation, second: TGuesserStation) {
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

function formatLocationName(locationId: string) {
  return locationId.split("_").map((part) => `${part[0].toUpperCase()}${part.slice(1)}`).join(" ");
}

function ConfettiBurst() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionPreference.matches) return;

    const colors = ["#34d399", "#fbbf24", "#fb7185", "#60a5fa", "#e879f9", "#ffffff"];
    let width = 0;
    let height = 0;
    let frame = 0;
    let previousTime = 0;

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    resizeCanvas();

    const particles = Array.from({ length: 120 }, (_, index) => {
      const fromLeft = index % 2 === 0;
      const cannonX = width * (fromLeft ? 0.08 : 0.92);
      const spread = 4 + Math.random() * 7;
      const angle = (Math.random() * 0.8 + 0.25) * (fromLeft ? -1 : 1);
      const speed = 7 + Math.random() * 9;
      return {
        x: cannonX,
        y: height * (0.7 + Math.random() * 0.1),
        vx: (fromLeft ? 1 : -1) * Math.cos(Math.abs(angle)) * speed,
        vy: -Math.sin(Math.abs(angle)) * speed - spread,
        gravity: 0.22 + Math.random() * 0.12,
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.3,
        width: 4 + Math.random() * 6,
        height: 7 + Math.random() * 8,
        color: colors[index % colors.length],
        age: 0,
        lifetime: 100 + Math.random() * 55,
      };
    });

    const draw = (time: number) => {
      const delta = previousTime === 0 ? 1 : Math.min((time - previousTime) / 16.67, 2);
      previousTime = time;
      context.clearRect(0, 0, width, height);

      let activeParticles = 0;
      for (const particle of particles) {
        if (particle.age >= particle.lifetime) continue;
        activeParticles += 1;
        particle.age += delta;
        particle.vy += particle.gravity * delta;
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.rotation += particle.spin * delta;
        const fade = Math.min(1, (particle.lifetime - particle.age) / 24);

        context.save();
        context.globalAlpha = fade;
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        context.fillStyle = particle.color;
        context.fillRect(-particle.width / 2, -particle.height / 2, particle.width, particle.height);
        context.restore();
      }

      if (activeParticles > 0) frame = requestAnimationFrame(draw);
      else context.clearRect(0, 0, width, height);
    };

    const onMotionPreferenceChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        cancelAnimationFrame(frame);
        context.clearRect(0, 0, width, height);
      }
    };

    window.addEventListener("resize", resizeCanvas);
    motionPreference.addEventListener("change", onMotionPreferenceChange);
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resizeCanvas);
      motionPreference.removeEventListener("change", onMotionPreferenceChange);
      context.clearRect(0, 0, width, height);
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <canvas ref={canvasRef} className="pointer-events-none fixed inset-0" style={{ zIndex: 2147483647 }} aria-hidden="true" />,
    document.body
  );
}

export default function TGuesserGame() {
  const { difficulty } = useAppState();
  return <TGuesserRound key={difficulty} difficulty={difficulty} />;
}

function TGuesserRound({ difficulty }: { difficulty: TGuesserDifficulty }) {
  const [round, setRound] = useState(0);
  const [selectedStation, setSelectedStation] = useState<TGuesserStation | null>(null);
  const [result, setResult] = useState<{ guessed: TGuesserStation; correct: TGuesserStation; distance: number; points: number } | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [loadedImageId, setLoadedImageId] = useState<string | null>(null);
  const [photoDimensions, setPhotoDimensions] = useState<{ id: string; width: number; height: number } | null>(null);
  const [photoPosition, setPhotoPosition] = useState<{ imageId: string; x: number; y: number }>({ imageId: "", x: 50, y: 50 });
  const photoDrag = useRef<{ imageId: string; pointerId: number; startX: number; startY: number; positionX: number; positionY: number } | null>(null);
  const eligibleImages = useMemo(() => {
    const difficultyImages = T_GUESSER_IMAGES_BY_DIFFICULTY[difficulty];
    return difficultyImages.length > 0 ? difficultyImages : T_GUESSER_IMAGES_BY_DIFFICULTY.easy;
  }, [difficulty]);
  const [imageOrder, setImageOrder] = useState(eligibleImages);
const eligibleKey = eligibleImages.map((img) => img.id).join(",");

useEffect(() => {
  setImageOrder(shuffleImages(eligibleImages));
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [eligibleKey]);
  const image: TGuesserImage = imageOrder[round % imageOrder.length];
  const correctStation = T_GUESSER_STATIONS.find((station) => station.id === image.correctStationId)!;
  const activePhotoPosition = photoPosition.imageId === image.id ? photoPosition : { imageId: image.id, x: 50, y: 50 };

  const startPhotoPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !photoDimensions || photoDimensions.id !== image.id) return;
    photoDrag.current = {
      imageId: image.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      positionX: activePhotoPosition.x,
      positionY: activePhotoPosition.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const panPhoto = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = photoDrag.current;
    const dimensions = photoDimensions;
    if (!drag || drag.pointerId !== event.pointerId || drag.imageId !== image.id || !dimensions || dimensions.id !== image.id) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const coverScale = Math.max(bounds.width / dimensions.width, bounds.height / dimensions.height);
    const overflowX = Math.max(0, dimensions.width * coverScale - bounds.width);
    const overflowY = Math.max(0, dimensions.height * coverScale - bounds.height);
    const x = overflowX === 0 ? 50 : Math.min(100, Math.max(0, drag.positionX - (event.clientX - drag.startX) / overflowX * 100));
    const y = overflowY === 0 ? 50 : Math.min(100, Math.max(0, drag.positionY - (event.clientY - drag.startY) / overflowY * 100));
    setPhotoPosition({ imageId: image.id, x, y });
  };

  const stopPhotoPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (photoDrag.current?.pointerId === event.pointerId) photoDrag.current = null;
  };

  const submitGuess = () => {
    if (!selectedStation || result) return;
    const distance = distanceKm(selectedStation, correctStation);
    const points = selectedStation.id === correctStation.id ? 50 : 0;
    setResult({ guessed: selectedStation, correct: correctStation, distance, points });
    setTotalPoints((previous) => previous + points);
  };

  const nextRound = () => {
    if (round + 1 >= imageOrder.length) {
      setImageOrder(shuffleImages(eligibleImages));
      setRound(0);
    } else {
      setRound((previous) => previous + 1);
    }
    setSelectedStation(null);
    setResult(null);
  };

  return (
    <main className="relative h-full w-full overflow-hidden bg-[#07111c] text-white">
      <div
        className="absolute inset-0 z-10 touch-none select-none cursor-grab active:cursor-grabbing"
        aria-label="Drag the photo to pan across it"
        onPointerDown={startPhotoPan}
        onPointerMove={panPhoto}
        onPointerUp={stopPhotoPan}
        onPointerCancel={stopPhotoPan}
        onLostPointerCapture={stopPhotoPan}
      >
        <Image
          src={image.src}
          alt={`${formatLocationName(image.locationId)} location challenge`}
          fill
          priority
          draggable={false}
          sizes="100vw"
          onLoad={(event) => {
            setLoadedImageId(image.id);
            setPhotoDimensions({ id: image.id, width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight });
          }}
          style={{ objectPosition: `${activePhotoPosition.x}% ${activePhotoPosition.y}%` }}
          className={`object-cover transition-[filter,transform] duration-700 ease-out ${loadedImageId === image.id ? "scale-100 blur-0" : "scale-[1.03] blur-xl"}`}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 z-[11] bg-gradient-to-b from-black/65 via-black/5 to-black/70" />
      {result?.points === 50 && <ConfettiBurst key={`confetti-${round}`} />}

      <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-end gap-3 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="rounded-lg bg-black/40 px-3 py-2 text-sm font-semibold text-white/90 backdrop-blur sm:hidden">Pick station</div>
          <div className="hidden rounded-lg bg-black/40 px-3 py-2 text-sm font-semibold text-white/90 backdrop-blur sm:block">Pick nearest station</div>
          <div className="rounded-lg bg-black/40 px-3 py-2 text-right text-xs font-bold uppercase text-white/90 backdrop-blur">{difficultyInfo[difficulty].label} · {round + 1} · {totalPoints} pts</div>
          
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
            stations={T_GUESSER_STATIONS}
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
      <p className="pointer-events-none absolute bottom-1 left-4 z-[12] text-[10px] text-white/75 drop-shadow">Drag photo to pan</p>
      <p className="pointer-events-none absolute bottom-1 right-4 z-[12] text-[10px] text-white/60 drop-shadow sm:bottom-1 sm:right-6">Map data © OpenStreetMap contributors</p>
    </main>
  );
}
