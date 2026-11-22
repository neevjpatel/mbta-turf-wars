"use client";

import Image from "next/image";
import { useAppState } from "@/app/_state/app-state";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import ConfettiBurst from "@/app/play/_components/confetti-burst";
import { T_GUESSER_IMAGES_BY_DIFFICULTY, T_GUESSER_STATIONS, type TGuesserDifficulty, type TGuesserImage, type TGuesserStation } from "../_data/t-guesser-data";
import { usePlay } from "@/app/_stats/player";

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

export default function TGuesserGame() {
  const { difficulty } = useAppState();
  return <TGuesserRound key={difficulty} difficulty={difficulty} />;
}

function TGuesserRound({ difficulty }: { difficulty: TGuesserDifficulty }) {
  const [round, setRound] = useState(0);
  const play = usePlay("t-guesser");
  useEffect(() => play.start(), [play, round]);
  const [selectedStation, setSelectedStation] = useState<TGuesserStation | null>(null);
  const [result, setResult] = useState<{ guessed: TGuesserStation; correct: TGuesserStation; distance: number; points: number } | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [loadedImageId, setLoadedImageId] = useState<string | null>(null);
  const [photoDimensions, setPhotoDimensions] = useState<{ id: string; width: number; height: number } | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [photoView, setPhotoView] = useState({ imageId: "", zoom: 1, offsetX: 0, offsetY: 0 });
  const photoViewRef = useRef(photoView);
  const photoViewportRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number; type: string }>());
  const photoDrag = useRef<{ pointerId: number; startX: number; startY: number; startView: typeof photoView } | null>(null);
  const photoPinch = useRef<{ pointerIds: [number, number]; distance: number; startView: typeof photoView } | null>(null);
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
  const activePhotoView = useMemo(
    () => photoView.imageId === image.id ? photoView : { imageId: image.id, zoom: 1, offsetX: 0, offsetY: 0 },
    [image.id, photoView]
  );
  const activePhotoDimensions = photoDimensions?.id === image.id ? photoDimensions : null;

  const commitPhotoView = (next: typeof photoView) => {
    photoViewRef.current = next;
    setPhotoView(next);
  };

  // The base scale uses object-cover geometry, so 1 is the smallest zoom
  // that still fills the entire canvas.
  const minimumZoom = 1;

  const getPhotoOverflow = (zoom: number) => {
    if (!activePhotoDimensions || viewportSize.width === 0 || viewportSize.height === 0) return { x: 0, y: 0 };
    const coverScale = Math.max(viewportSize.width / activePhotoDimensions.width, viewportSize.height / activePhotoDimensions.height);
    return {
      x: Math.max(0, activePhotoDimensions.width * coverScale * zoom - viewportSize.width),
      y: Math.max(0, activePhotoDimensions.height * coverScale * zoom - viewportSize.height),
    };
  };

  const constrainPhotoView = (view: typeof photoView) => {
    const overflow = getPhotoOverflow(view.zoom);
    return {
      ...view,
      imageId: image.id,
      offsetX: Math.min(overflow.x / 2, Math.max(-overflow.x / 2, view.offsetX)),
      offsetY: Math.min(overflow.y / 2, Math.max(-overflow.y / 2, view.offsetY)),
    };
  };

  const zoomAt = (requestedZoom: number, anchorX: number, anchorY: number, startingView = photoViewRef.current) => {
    const startView = constrainPhotoView(startingView);
    const zoom = Math.min(3, Math.max(minimumZoom, requestedZoom));
    const ratio = zoom / startView.zoom;
    commitPhotoView(constrainPhotoView({
      ...startView,
      zoom,
      offsetX: anchorX - (anchorX - startView.offsetX) * ratio,
      offsetY: anchorY - (anchorY - startView.offsetY) * ratio,
    }));
  };

  const photoGeometry = (() => {
    if (!activePhotoDimensions || viewportSize.width === 0 || viewportSize.height === 0) return null;
    const coverScale = Math.max(viewportSize.width / activePhotoDimensions.width, viewportSize.height / activePhotoDimensions.height);
    const view = constrainPhotoView(activePhotoView);
    const overflowX = Math.max(0, activePhotoDimensions.width * coverScale * view.zoom - viewportSize.width);
    const overflowY = Math.max(0, activePhotoDimensions.height * coverScale * view.zoom - viewportSize.height);
    return {
      width: activePhotoDimensions.width * coverScale * view.zoom,
      height: activePhotoDimensions.height * coverScale * view.zoom,
      overflowX,
      overflowY,
      offsetX: view.offsetX,
      offsetY: view.offsetY,
    };
  })();

  useEffect(() => {
    const viewport = photoViewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setViewportSize((current) => current.width === width && current.height === height ? current : { width, height });
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const zoomPhotoWithWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!activePhotoDimensions) return;
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    const delta = event.deltaY * (event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? bounds.height : 1);
    const zoom = photoViewRef.current.zoom * Math.exp(-delta * 0.0015);
    zoomAt(zoom, event.clientX - bounds.left - bounds.width / 2, event.clientY - bounds.top - bounds.height / 2);
  };

  const startPhotoGesture = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY, type: event.pointerType });
    event.currentTarget.setPointerCapture(event.pointerId);

    const touchPointers = Array.from(pointersRef.current.entries()).filter(([, pointer]) => pointer.type === "touch");
    if (touchPointers.length >= 2) {
      const [first, second] = touchPointers.slice(-2).map(([, pointer]) => pointer);
      photoPinch.current = {
        pointerIds: [touchPointers[touchPointers.length - 2][0], touchPointers[touchPointers.length - 1][0]],
        distance: Math.hypot(second.x - first.x, second.y - first.y),
        startView: constrainPhotoView(photoViewRef.current),
      };
      photoDrag.current = null;
      return;
    }

    if (pointersRef.current.size === 1 || event.pointerType === "mouse") {
      photoDrag.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startView: constrainPhotoView(photoViewRef.current),
      };
    }
  };

  const movePhotoGesture = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointersRef.current.has(event.pointerId)) pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY, type: event.pointerType });
    const pinch = photoPinch.current;
    if (pinch?.pointerIds.includes(event.pointerId)) {
      const first = pointersRef.current.get(pinch.pointerIds[0]);
      const second = pointersRef.current.get(pinch.pointerIds[1]);
      if (!first || !second || pinch.distance === 0) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      const distance = Math.hypot(second.x - first.x, second.y - first.y);
      const anchorX = (first.x + second.x) / 2 - bounds.left - bounds.width / 2;
      const anchorY = (first.y + second.y) / 2 - bounds.top - bounds.height / 2;
      zoomAt(pinch.startView.zoom * distance / pinch.distance, anchorX, anchorY, pinch.startView);
      return;
    }

    const drag = photoDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    commitPhotoView(constrainPhotoView({
      ...drag.startView,
      offsetX: drag.startView.offsetX + event.clientX - drag.startX,
      offsetY: drag.startView.offsetY + event.clientY - drag.startY,
    }));
  };

  const stopPhotoGesture = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (photoPinch.current?.pointerIds.includes(event.pointerId)) {
      photoPinch.current = null;
      const remaining = Array.from(pointersRef.current.entries()).find(([, pointer]) => pointer.type === "touch");
      if (remaining) {
        photoDrag.current = {
          pointerId: remaining[0],
          startX: remaining[1].x,
          startY: remaining[1].y,
          startView: constrainPhotoView(photoViewRef.current),
        };
      } else {
        photoDrag.current = null;
      }
      return;
    }
    if (photoDrag.current?.pointerId === event.pointerId) photoDrag.current = null;
  };

  const resetPhotoView = () => {
    photoDrag.current = null;
    photoPinch.current = null;
    commitPhotoView({ imageId: image.id, zoom: 1, offsetX: 0, offsetY: 0 });
  };

  const changeZoom = (amount: number) => {
    zoomAt(photoViewRef.current.zoom + amount, 0, 0);
  };

  const panPhotoByButton = (horizontal: -1 | 0 | 1, vertical: -1 | 0 | 1) => {
    if (!photoGeometry) return;
    const stepX = Math.max(24, photoGeometry.overflowX * 0.16);
    const stepY = Math.max(24, photoGeometry.overflowY * 0.16);
    commitPhotoView(constrainPhotoView({
      ...activePhotoView,
      offsetX: activePhotoView.offsetX - horizontal * stepX,
      offsetY: activePhotoView.offsetY - vertical * stepY,
    }));
  };

  const canPanPhoto = (horizontal: -1 | 0 | 1, vertical: -1 | 0 | 1) => {
    if (!photoGeometry) return false;
    const stepX = Math.max(24, photoGeometry.overflowX * 0.16);
    const stepY = Math.max(24, photoGeometry.overflowY * 0.16);
    const current = constrainPhotoView(activePhotoView);
    const next = constrainPhotoView({
      ...current,
      offsetX: current.offsetX - horizontal * stepX,
      offsetY: current.offsetY - vertical * stepY,
    });

    // Ignore subpixel movement so arrows reliably dim at either edge.
    return Math.abs(next.offsetX - current.offsetX) > 0.5 || Math.abs(next.offsetY - current.offsetY) > 0.5;
  };

  const nextImage = () => {
    pointersRef.current.clear();
    photoDrag.current = null;
    photoPinch.current = null;
    setPhotoView({ imageId: "", zoom: 1, offsetX: 0, offsetY: 0 });
    photoViewRef.current = { imageId: "", zoom: 1, offsetX: 0, offsetY: 0 };
  };

  const submitGuess = () => {
    if (!selectedStation || result) return;
    const distance = distanceKm(selectedStation, correctStation);
    const points = selectedStation.id === correctStation.id ? 50 : 0;
    setResult({ guessed: selectedStation, correct: correctStation, distance, points });
    setTotalPoints((previous) => previous + points);
    play.end(points, { correct: points > 0, distance_km: Math.round(distance * 100) / 100, image: image.id, guessed: selectedStation.id, answer: correctStation.id });
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
    nextImage();
  };

  return (
    <main className="relative h-full w-full overflow-hidden bg-[#07111c] text-white">
      <div
        ref={photoViewportRef}
        className="absolute inset-0 z-10 touch-none select-none cursor-grab active:cursor-grabbing"
        role="group"
        aria-label="Photo canvas: drag to pan, use the scroll wheel or pinch to zoom"
        onWheel={zoomPhotoWithWheel}
        onPointerDown={startPhotoGesture}
        onPointerMove={movePhotoGesture}
        onPointerUp={stopPhotoGesture}
        onPointerCancel={stopPhotoGesture}
        onLostPointerCapture={stopPhotoGesture}
      >
        <Image
          src={image.src}
          alt={`${formatLocationName(image.locationId)} location challenge`}
          width={activePhotoDimensions?.width ?? 1600}
          height={activePhotoDimensions?.height ?? 900}
          priority
          draggable={false}
          sizes="300vw"
          onLoad={(event) => {
            setLoadedImageId(image.id);
            setPhotoDimensions({ id: image.id, width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight });
          }}
          style={photoGeometry ? {
            position: "absolute",
            left: "50%",
            top: "50%",
            width: `${photoGeometry.width}px`,
            height: `${photoGeometry.height}px`,
            maxWidth: "none",
            objectFit: "fill",
            transform: `translate(calc(-50% + ${photoGeometry.offsetX}px), calc(-50% + ${photoGeometry.offsetY}px))`,
            transition: "filter 700ms ease-out",
          } : {
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "filter 700ms ease-out",
          }}
          className={loadedImageId === image.id ? "blur-0" : "blur-xl"}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 z-[11] bg-gradient-to-b from-black/65 via-black/5 to-black/70" />
      {result?.points === 50 && <ConfettiBurst key={`confetti-${round}`} />}

      <div className="absolute left-4 top-16 z-[40] flex flex-col items-start gap-2 sm:top-4" role="group" aria-label="Photo controls">
        <div className="flex items-center gap-1 rounded-xl border border-white/20 bg-black/80 p-1.5 text-white shadow-lg backdrop-blur" role="group" aria-label="Zoom and reset controls">
          <button type="button" onClick={() => changeZoom(-0.25)} disabled={activePhotoView.zoom <= minimumZoom + 0.001} aria-label="Zoom out" title="Zoom out" className="grid size-10 cursor-pointer place-items-center rounded-lg text-xl font-bold hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-35">−</button>
          <output className="min-w-12 text-center text-xs font-bold tabular-nums" aria-live="polite" aria-label="Zoom level">{Math.round(activePhotoView.zoom * 100)}%</output>
          <button type="button" onClick={() => changeZoom(0.25)} disabled={activePhotoView.zoom >= 3} aria-label="Zoom in" title="Zoom in" className="grid size-10 cursor-pointer place-items-center rounded-lg text-xl font-bold hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-35">+</button>
          <button type="button" onClick={resetPhotoView} aria-label="Reset photo view" title="Reset photo view" className="grid min-h-10 cursor-pointer place-items-center rounded-lg px-2 text-xs font-bold hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">Reset</button>
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/20 bg-black/80 p-1.5 text-white shadow-lg backdrop-blur" role="group" aria-label="Pan photo controls">
          <span aria-hidden="true" />
          <button type="button" onClick={() => panPhotoByButton(0, -1)} disabled={!canPanPhoto(0, -1)} aria-label="Move photo up" title="Move photo up" className="grid size-10 cursor-pointer place-items-center rounded-lg hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-35">↑</button>
          <span aria-hidden="true" />
          <button type="button" onClick={() => panPhotoByButton(-1, 0)} disabled={!canPanPhoto(-1, 0)} aria-label="Move photo left" title="Move photo left" className="grid size-10 cursor-pointer place-items-center rounded-lg hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-35">←</button>
          <span aria-hidden="true" />
          <button type="button" onClick={() => panPhotoByButton(1, 0)} disabled={!canPanPhoto(1, 0)} aria-label="Move photo right" title="Move photo right" className="grid size-10 cursor-pointer place-items-center rounded-lg hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-35">→</button>
          <span aria-hidden="true" />
          <button type="button" onClick={() => panPhotoByButton(0, 1)} disabled={!canPanPhoto(0, 1)} aria-label="Move photo down" title="Move photo down" className="grid size-10 cursor-pointer place-items-center rounded-lg hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-35">↓</button>
          <span aria-hidden="true" />
        </div>
      </div>

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
      <p className="pointer-events-none absolute bottom-1 left-4 z-[12] max-w-[70%] text-[10px] text-white/75 drop-shadow">Drag to pan · Scroll or pinch to zoom · Reset in photo controls</p>
      <p className="pointer-events-none absolute bottom-1 right-4 z-[12] text-[10px] text-white/60 drop-shadow sm:bottom-1 sm:right-6">Map data © OpenStreetMap contributors</p>
    </main>
  );
}
