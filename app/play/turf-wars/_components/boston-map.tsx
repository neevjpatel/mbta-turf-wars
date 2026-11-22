"use client";

// Turf Wars map: a light basemap with one Google-Maps-style pin per station.
// Pin color = the campus that owns the station; the ring in the pin = the line (challenge difficulty).
// Hover a pin for its owner, click it for the station's stats and the challenge button.
import { CAMPUS_COLORS as SCHOOL_COLORS } from "@/app/_data/campuses";
import { LINE_DIFFICULTIES } from "@/app/_data/transit/lines";
import type { StopData, TransitLine } from "@/app/_data/transit/types";
import type { StationStats } from "@/lib/db";
import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

const UNOWNED = "#94A3B8";

export default function BostonMap({
  selectedSchool,
  isDelayed,
  onStartClaim,
  stops,
  lineFilter,
  isActive,
  lockedStopIds,
  stationStats,
}: {
  selectedSchool: string;
  isDelayed: boolean;
  onStartClaim: (stop: StopData) => void;
  /** Stations with their current owner already resolved (saved captures, else the starting owner). */
  stops: StopData[];
  lineFilter: "ALL" | TransitLine;
  isActive: boolean;
  /** Stations the player answered wrong: shown faded with a locked button. */
  lockedStopIds?: ReadonlySet<string>;
  /** Saved capture stats per station id, from /api/turf. */
  stationStats?: Record<string, StationStats>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const stationLayerRef = useRef<L.LayerGroup | null>(null);
  const fittedRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Own the Leaflet lifecycle here so a React Strict Mode effect replay or
    // route re-entry always creates a live map before adding its layers.
    const map = L.map(container, { center: [42.356, -71.082], zoom: 13, zoomControl: false });
    mapRef.current = map;
    L.control.zoom({ position: "bottomright" }).addTo(map);
    // Free, full-color OpenStreetMap tiles (no API key needed)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const stationLayer = L.layerGroup().addTo(map);
    stationLayerRef.current = stationLayer;
    setMapReady(true);

    const frame = window.requestAnimationFrame(() => map.invalidateSize());
    const timeout = window.setTimeout(() => map.invalidateSize(), 350);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      map.remove();
      fittedRef.current = false;
      if (mapRef.current === map) {
        mapRef.current = null;
        stationLayerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const stationLayer = stationLayerRef.current;
    if (!mapReady || !map || !stationLayer) return;

    stationLayer.clearLayers();
    const visibleStops = lineFilter === "ALL" ? stops : stops.filter((stop) => stop.line === lineFilter);

    for (const stop of visibleStops) {
      const locked = lockedStopIds?.has(stop.id) ?? false;
      const fill = SCHOOL_COLORS[stop.owner] ?? UNOWNED;
      L.marker([stop.lat, stop.lng], { icon: pinIcon(fill, LINE_DIFFICULTIES[stop.line].color, locked), riseOnHover: true, title: stop.name })
        .bindTooltip(locked ? `🔒 ${stop.name}: locked until tomorrow` : ownerLine(stop), { direction: "top", className: "turf-pin-tooltip" })
        .bindPopup(createStopPopup(stop, stationStats?.[stop.id], selectedSchool, isDelayed, onStartClaim, locked), { minWidth: 240, maxWidth: 280 })
        .addTo(stationLayer);
    }

    // Frame all stations the first time they're drawn
    if (!fittedRef.current && stops.length > 0) {
      map.fitBounds(L.latLngBounds(stops.map((s) => [s.lat, s.lng] as [number, number])), { padding: [70, 70] });
      fittedRef.current = true;
    }
    if (isActive) map.invalidateSize();
  }, [isActive, isDelayed, lineFilter, lockedStopIds, mapReady, onStartClaim, selectedSchool, stationStats, stops]);

  return <div ref={containerRef} className="absolute inset-0 z-0 h-full w-full" aria-label="Boston transit map with Turf Wars stations" />;
}

function ownerLine(stop: StopData) {
  return SCHOOL_COLORS[stop.owner] ? `${stop.owner} is the owner of the turf!` : "Nobody owns this turf yet. Claim it!";
}

/** A map pin: body in the owner's campus color, white center ringed in the line's color. */
function pinIcon(fill: string, ring: string, locked: boolean) {
  const center = locked
    ? `<circle cx="15" cy="15" r="7" fill="#fff"/><text x="15" y="18.5" text-anchor="middle" font-size="9">🔒</text>`
    : `<circle cx="15" cy="15" r="6.5" fill="#fff" stroke="${ring}" stroke-width="3.5"/>`;
  const html = `<svg width="30" height="42" viewBox="0 0 30 42" aria-hidden="true" style="display:block;filter:drop-shadow(0 2px 2px rgba(15,23,42,.35));opacity:${locked ? 0.6 : 1}">
    <path d="M15 1C7.3 1 1 7.2 1 14.9c0 10.4 14 26.1 14 26.1s14-15.7 14-26.1C29 7.2 22.7 1 15 1z" fill="${locked ? UNOWNED : fill}" stroke="#fff" stroke-width="2"/>${center}</svg>`;
  return L.divIcon({ html, className: "", iconSize: [30, 42], iconAnchor: [15, 41], popupAnchor: [0, -38], tooltipAnchor: [0, -38] });
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
  const node = document.createElement(tag);
  node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function createStopPopup(
  stop: StopData,
  stats: StationStats | undefined,
  selectedSchool: string,
  isDelayed: boolean,
  onStartClaim: (stop: StopData) => void,
  locked = false
) {
  const config = LINE_DIFFICULTIES[stop.line];
  const reward = config.basePoints * (isDelayed ? 3 : 1);
  const popup = el("div", "text-slate-900 p-1");

  const heading = el("div", "flex items-center justify-between gap-2 mb-1");
  const line = el("span", "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded text-white", `${stop.line} · ${config.difficulty}`);
  line.style.backgroundColor = config.color;
  heading.append(line, el("span", "text-xs font-extrabold text-slate-700", `+${reward} pts${isDelayed ? " 🔥" : ""}`));

  const name = el("h3", "font-extrabold text-base leading-tight", stop.name);
  const tip = el("p", "text-[11px] text-slate-500 mt-0.5 mb-2", `📍 ${stop.localTip}`);

  // Owner + who has captured it
  const ownerBox = el("div", "bg-slate-100 rounded-lg px-2 py-1.5 text-xs mb-2 space-y-1");
  const owned = Boolean(SCHOOL_COLORS[stop.owner]);
  const ownerRow = el("div", "flex items-center gap-1.5");
  const dot = el("i", "inline-block h-2.5 w-2.5 rounded-full");
  dot.style.backgroundColor = SCHOOL_COLORS[stop.owner] ?? UNOWNED;
  ownerRow.append(dot, el("b", "", owned ? `${stop.owner} owns this turf` : "Unclaimed"));
  if (owned && !stats?.owner) ownerRow.append(el("span", "text-slate-500", "(starting owner)"));
  ownerBox.append(ownerRow);
  if (stats?.schools.length) {
    for (const s of stats.schools.slice(0, 3)) {
      const row = el("div", "flex justify-between text-slate-600");
      row.append(el("span", "", `${s.school} · ${s.captures} capture${s.captures === 1 ? "" : "s"}`), el("span", "font-semibold", `${s.points} pts`));
      ownerBox.append(row);
    }
  }
  ownerBox.append(
    el(
      "div",
      "text-slate-500",
      stats?.attempts
        ? `Challenged ${stats.attempts} time${stats.attempts === 1 ? "" : "s"} · ${Math.round((100 * stats.correct) / stats.attempts)}% answered right`
        : "No saved challenges yet. Be the first!"
    )
  );

  const button = el("button", "text-white text-xs px-3 py-2 rounded-lg font-bold w-full transition cursor-pointer shadow-sm");
  button.type = "button";
  button.style.backgroundColor = config.color;
  button.textContent = `Challenge for ${selectedSchool} (+${reward} pts)`;
  button.addEventListener("click", (event) => {
    L.DomEvent.stopPropagation(event);
    onStartClaim(stop);
  });
  if (locked) {
    // Answered wrong: one try per station, so the challenge is greyed out until tomorrow.
    button.disabled = true;
    button.className = "text-slate-500 text-xs px-3 py-2 rounded-lg font-bold w-full cursor-not-allowed bg-slate-200 border border-slate-300";
    button.style.backgroundColor = "";
    button.textContent = "🔒 Locked until tomorrow";
    button.title = "You missed this station's question. (Demo: refresh the page to unlock.)";
  }
  popup.append(heading, name, tip, ownerBox, button);
  return popup;
}
