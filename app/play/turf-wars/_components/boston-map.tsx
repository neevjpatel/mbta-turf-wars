"use client";

import { CAMPUS_COLORS as SCHOOL_COLORS } from "@/app/_data/campuses";
import { LINE_DIFFICULTIES } from "@/app/_data/transit/lines";
import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { StopData, TransitLine } from "@/app/_data/transit/types";

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
  const [trains, setTrains] = useState<TrainItem[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchTrains = async () => {
      try {
        const response = await fetch("https://api-v3.mbta.com/vehicles?filter[route]=Red,Orange,Green-B,Green-C,Green-D,Green-E,Blue", { signal: controller.signal });
        const json = await response.json();
        setTrains(json.data || []);
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

  const visibleStops = lineFilter === "ALL" ? stops : stops.filter((stop) => stop.line === lineFilter);

  return (
    <div className="relative h-full w-full">
      <MapContainer center={[42.356, -71.082]} zoom={13} className="h-full w-full rounded-xl z-0">
        <MapResizeWatcher isActive={isActive} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {visibleStops.map((stop) => {
          const config = LINE_DIFFICULTIES[stop.line];
          const reward = config.basePoints * (isDelayed ? 3 : 1);
          return (
            <CircleMarker
              key={stop.id}
              center={[stop.lat, stop.lng]}
              radius={15}
              pathOptions={{ color: config.color, weight: 4, fillColor: SCHOOL_COLORS[stop.owner] || "#64748B", fillOpacity: 0.92 }}
            >
              <Popup>
                <div className="text-slate-900 p-1.5 min-w-[215px]">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded text-white" style={{ backgroundColor: config.color }}>{stop.line} · {config.difficulty}</span>
                    <span className="text-xs font-extrabold text-slate-700">+{reward} pts</span>
                  </div>
                  <h3 className="font-extrabold text-base leading-tight">{stop.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 mb-2">📍 {stop.localTip}</p>
                  <div className="bg-slate-100 rounded px-2 py-1 text-xs mb-2 flex justify-between"><span>Owner: <b>{stop.owner}</b></span><span>Turf: {stop.points}</span></div>
                  <button type="button" onClick={() => onStartClaim(stop)} className="text-white text-xs px-3 py-2 rounded-lg font-bold w-full transition cursor-pointer shadow-sm" style={{ backgroundColor: config.color }}>
                    Challenge for {selectedSchool} (+{reward} pts{isDelayed ? " 🔥" : ""})
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
        {trains.map((train) => {
          const { latitude, longitude, current_status } = train.attributes;
          if (latitude == null || longitude == null) return null;
          return (
            <CircleMarker key={train.id} center={[latitude, longitude]} radius={5} pathOptions={{ color: "#38BDF8", fillColor: "#38BDF8", fillOpacity: 1 }}>
              <Popup><div className="text-slate-900 text-xs"><b>🚇 Live MBTA Train</b><br />Status: {current_status?.replaceAll("_", " ") ?? "Status unavailable"}</div></Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
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

function MapResizeWatcher({ isActive }: { isActive: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!isActive) return;
    const frame = window.requestAnimationFrame(() => map.invalidateSize());
    const timeout = window.setTimeout(() => map.invalidateSize(), 350);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [isActive, map]);
  return null;
}
