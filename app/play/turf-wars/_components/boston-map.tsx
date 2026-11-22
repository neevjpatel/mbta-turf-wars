"use client";

import { CAMPUS_COLORS as SCHOOL_COLORS } from "@/app/_data/campuses";
import { LINE_DIFFICULTIES } from "@/app/_data/transit/lines";
import type { StopData, TransitLine } from "@/app/_data/transit/types";
import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

interface TrainItem {
  id: string;
  attributes: {
    latitude?: number | null;
    longitude?: number | null;
    current_status?: string;
  };
}

export default function BostonMap({
  selectedSchool,
  isDelayed,
  onStartClaim,
  stops,
  lineFilter,
  isActive,
}: {
  selectedSchool: string;
  isDelayed: boolean;
  onStartClaim: (stop: StopData) => void;
  stops: StopData[];
  lineFilter: "ALL" | TransitLine;
  isActive: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const stationLayerRef = useRef<L.LayerGroup | null>(null);
  const trainLayerRef = useRef<L.LayerGroup | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [trains, setTrains] = useState<TrainItem[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Own the Leaflet lifecycle here so a React Strict Mode effect replay or
    // route re-entry always creates a live map before adding its layers.
    const map = L.map(container, { center: [42.356, -71.082], zoom: 13 });
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const stationLayer = L.layerGroup().addTo(map);
    const trainLayer = L.layerGroup().addTo(map);
    stationLayerRef.current = stationLayer;
    trainLayerRef.current = trainLayer;
    setMapReady(true);

    const frame = window.requestAnimationFrame(() => map.invalidateSize());
    const timeout = window.setTimeout(() => map.invalidateSize(), 350);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      map.remove();
      if (mapRef.current === map) {
        mapRef.current = null;
        stationLayerRef.current = null;
        trainLayerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchTrains = async () => {
      try {
        const response = await fetch("https://api-v3.mbta.com/vehicles?filter[route]=Red,Orange,Green-B,Green-C,Green-D,Green-E,Blue", { signal: controller.signal });
        const json = await response.json();
        if (!controller.signal.aborted) setTrains(Array.isArray(json.data) ? json.data : []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") console.error("Failed to fetch MBTA trains:", error);
      }
    };
    void fetchTrains();
    const interval = window.setInterval(() => void fetchTrains(), 10000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const stationLayer = stationLayerRef.current;
    const trainLayer = trainLayerRef.current;
    if (!mapReady || !map || !stationLayer || !trainLayer) return;

    stationLayer.clearLayers();
    trainLayer.clearLayers();
    const visibleStops = lineFilter === "ALL" ? stops : stops.filter((stop) => stop.line === lineFilter);

    for (const stop of visibleStops) {
      const config = LINE_DIFFICULTIES[stop.line];
      L.circleMarker([stop.lat, stop.lng], {
        radius: 15,
        color: config.color,
        weight: 4,
        fillColor: SCHOOL_COLORS[stop.owner] || "#64748B",
        fillOpacity: 0.92,
      }).bindPopup(createStopPopup(stop, selectedSchool, isDelayed, onStartClaim)).addTo(stationLayer);
    }

    for (const train of trains) {
      const { latitude, longitude, current_status } = train.attributes;
      if (latitude == null || longitude == null) continue;
      const popup = document.createElement("div");
      popup.className = "text-slate-900 text-xs";
      const title = document.createElement("b");
      title.textContent = "🚇 Live MBTA Train";
      const status = document.createElement("p");
      status.textContent = `Status: ${current_status?.replaceAll("_", " ") ?? "Status unavailable"}`;
      popup.append(title, status);
      L.circleMarker([latitude, longitude], {
        radius: 5,
        color: "#38BDF8",
        fillColor: "#38BDF8",
        fillOpacity: 1,
      }).bindPopup(popup).addTo(trainLayer);
    }

    if (isActive) map.invalidateSize();
  }, [isActive, isDelayed, lineFilter, mapReady, onStartClaim, selectedSchool, stops, trains]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="relative z-0 h-full w-full rounded-xl" aria-label="Boston transit map" />
      <div className="map-difficulty-key" aria-label="Station ring color shows MBTA line difficulty">
        <strong>Station ring · challenge difficulty</strong>
        <span><i style={{ backgroundColor: LINE_DIFFICULTIES.Green.color }} />Green · Easy</span>
        <span><i style={{ backgroundColor: LINE_DIFFICULTIES.Orange.color }} />Orange · Medium</span>
        <span><i style={{ backgroundColor: LINE_DIFFICULTIES.Blue.color }} />Blue · Hard</span>
        <span><i style={{ backgroundColor: LINE_DIFFICULTIES.Red.color }} />Red · Expert</span>
      </div>
    </div>
  );
}

function createStopPopup(
  stop: StopData,
  selectedSchool: string,
  isDelayed: boolean,
  onStartClaim: (stop: StopData) => void
) {
  const config = LINE_DIFFICULTIES[stop.line];
  const reward = config.basePoints * (isDelayed ? 3 : 1);
  const popup = document.createElement("div");
  popup.className = "text-slate-900 p-1.5 min-w-[215px]";

  const heading = document.createElement("div");
  heading.className = "flex items-center justify-between gap-2 mb-1";
  const line = document.createElement("span");
  line.className = "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded text-white";
  line.style.backgroundColor = config.color;
  line.textContent = `${stop.line} · ${config.difficulty}`;
  const rewardLabel = document.createElement("span");
  rewardLabel.className = "text-xs font-extrabold text-slate-700";
  rewardLabel.textContent = `+${reward} pts`;
  heading.append(line, rewardLabel);

  const name = document.createElement("h3");
  name.className = "font-extrabold text-base leading-tight";
  name.textContent = stop.name;
  const tip = document.createElement("p");
  tip.className = "text-[11px] text-slate-500 mt-0.5 mb-2";
  tip.textContent = `📍 ${stop.localTip}`;
  const details = document.createElement("div");
  details.className = "bg-slate-100 rounded px-2 py-1 text-xs mb-2 flex justify-between";
  const owner = document.createElement("span");
  owner.append("Owner: ");
  const ownerName = document.createElement("b");
  ownerName.textContent = stop.owner;
  owner.append(ownerName);
  const points = document.createElement("span");
  points.textContent = `Turf: ${stop.points}`;
  details.append(owner, points);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "text-white text-xs px-3 py-2 rounded-lg font-bold w-full transition cursor-pointer shadow-sm";
  button.style.backgroundColor = config.color;
  button.textContent = `Challenge for ${selectedSchool} (+${reward} pts${isDelayed ? " 🔥" : ""})`;
  button.addEventListener("click", (event) => {
    L.DomEvent.stopPropagation(event);
    onStartClaim(stop);
  });
  popup.append(heading, name, tip, details, button);
  return popup;
}
