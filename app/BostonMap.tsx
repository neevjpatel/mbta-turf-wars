"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  INITIAL_STOPS,
  LINE_DIFFICULTIES,
  SCHOOL_COLORS,
  StopData,
} from "./mbtaData";

interface TrainItem {
  id: string;
  attributes: {
    latitude: number | null;
    longitude: number | null;
    current_status?: string;
  };
}
import { SCHOOL_COLORS, StopData } from "./mbtaData";

export default function BostonMap({
  selectedSchool,
  isDelayed,
  onStartClaim,
  claimedStopTrigger,
  lineFilter,
  stops,
  isActive,
}: {
  selectedSchool: string;
  isDelayed: boolean;
  onStartClaim: (stop: StopData) => void;
  claimedStopTrigger: { stopId: string; school: string; pointsAdded: number } | null;
  lineFilter: string;
}) {
  const [stops, setStops] = useState<StopData[]>(INITIAL_STOPS);
  const [trains, setTrains] = useState<TrainItem[]>([]);

  useEffect(() => {
    if (!claimedStopTrigger) return;
    setStops((prev) =>
      prev.map((stop) =>
        stop.id === claimedStopTrigger.stopId
          ? {
              ...stop,
              owner: claimedStopTrigger.school,
              points: stop.points + claimedStopTrigger.pointsAdded,
            }
          : stop
      )
    );
  }, [claimedStopTrigger]);
  stops: StopData[];
  isActive: boolean;
}) {
  const [trains, setTrains] = useState<Array<{
    id: string;
    attributes: { latitude?: number; longitude?: number; current_status?: string };
  }>>([]);

  useEffect(() => {
    const fetchTrains = async () => {
      try {
        const res = await fetch(
          "https://api-v3.mbta.com/vehicles?filter[route]=Red,Orange,Green-B,Green-C,Green-D,Green-E,Blue"
        );
        const json = await res.json();
        setTrains(json.data || []);
      } catch (err) {
        console.error("Failed to fetch MBTA trains:", err);
      }
    };

    fetchTrains();
    const interval = setInterval(fetchTrains, 10000);
    return () => clearInterval(interval);
  }, []);

  const visibleStops =
    lineFilter === "ALL"
      ? stops
      : stops.filter((stop) => stop.line === lineFilter);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[42.356, -71.082]}
        zoom={13}
        className="h-full w-full rounded-2xl z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {visibleStops.map((stop) => {
          const lineConfig = LINE_DIFFICULTIES[stop.line];
          const reward = lineConfig.basePoints * (isDelayed ? 3 : 1);

          return (
            <CircleMarker
              key={stop.id}
              center={[stop.lat, stop.lng]}
              radius={15}
              pathOptions={{
                color: lineConfig.color,
                weight: 4,
                fillColor: SCHOOL_COLORS[stop.owner] || "#64748B",
                fillOpacity: 0.92,
              }}
            >
              <Popup>
                <div className="text-slate-900 p-1.5 min-w-[215px]">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded text-white"
                      style={{ backgroundColor: lineConfig.color }}
                    >
                      {stop.line} • {lineConfig.difficulty}
                    </span>
                    <span className="text-xs font-extrabold text-slate-700">
                      +{reward} pts
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base leading-tight">
                    {stop.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 mb-2">
                    📍 {stop.localTip}
                  </p>

                  <div className="bg-slate-100 rounded px-2 py-1 text-xs mb-2 flex justify-between">
                    <span>
                      Owner: <b>{stop.owner}</b>
                    </span>
                    <span>Turf: {stop.points}</span>
                  </div>

                  <button
                    onClick={() => onStartClaim(stop)}
                    className="text-white text-xs px-3 py-2 rounded-lg font-bold w-full transition cursor-pointer shadow-sm"
                    style={{ backgroundColor: lineConfig.color }}
                  >
                    Challenge for {selectedSchool} (+{reward} pts{isDelayed ? " 🔥" : ""})
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {trains.map((train) => {
          const { latitude, longitude, current_status } = train.attributes;
          if (!latitude || !longitude) return null;

          return (
            <CircleMarker
              key={train.id}
              center={[latitude, longitude]}
              radius={5}
              pathOptions={{
                color: "#38BDF8",
                fillColor: "#38BDF8",
                fillOpacity: 1,
              }}
            >
              <Popup>
                <div className="text-slate-900 text-xs">
                  <b>🚇 Live MBTA Train</b>
                  <br />
                  Status: {current_status?.replace("_", " ")}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div className="absolute bottom-4 left-4 z-[400] bg-slate-950/90 backdrop-blur-md border border-slate-800 px-3.5 py-2.5 rounded-xl text-[11px] shadow-xl">
        <p className="font-bold text-slate-300 uppercase tracking-wider mb-1.5">
          Ring Color = Difficulty Tier
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5 text-emerald-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00843D]" /> Green: Easy (+15)
          </span>
          <span className="flex items-center gap-1.5 text-orange-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ED8B00]" /> Orange: Med (+25)
          </span>
          <span className="flex items-center gap-1.5 text-blue-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#003DA5]" /> Blue: Hard (+40)
          </span>
          <span className="flex items-center gap-1.5 text-red-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DA291C]" /> Red: Expert (+60)
          </span>
        </div>
      </div>
    </div>
    <MapContainer
      center={[42.353, -71.095]}
      zoom={13}
      className="h-full w-full rounded-xl z-0"
    >
      <MapResizeWatcher isActive={isActive} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {stops.map((stop) => (
        <CircleMarker
          key={stop.id}
          center={[stop.lat, stop.lng]}
          radius={14}
          pathOptions={{
            color: "#ffffff",
            weight: 2,
            fillColor: SCHOOL_COLORS[stop.owner] || "#64748B",
            fillOpacity: 0.9,
          }}
        >
          <Popup>
            <div className="text-slate-900 p-1 min-w-[170px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {stop.line} Line
              </span>
              <h3 className="font-bold text-base leading-tight">{stop.name}</h3>
              <p className="text-xs mt-1">
                Controlled by: <b>{stop.owner}</b>
              </p>
              <p className="text-xs text-slate-600 mb-2">Turf Value: {stop.points} pts</p>
              <button
                onClick={() => onStartClaim(stop)}
                className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded font-semibold w-full hover:bg-blue-700 cursor-pointer"
              >
                Capture for {selectedSchool} ({isDelayed ? "+30 pts 🔥" : "+10 pts"})
              </button>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {trains.map((train) => {
        const { latitude, longitude, current_status } = train.attributes;
        if (!latitude || !longitude) return null;

        return (
          <CircleMarker
            key={train.id}
            center={[latitude, longitude]}
            radius={5}
            pathOptions={{ color: "#38BDF8", fillColor: "#38BDF8", fillOpacity: 1 }}
          >
            <Popup>
              <div className="text-slate-900 text-xs">
                <b>🚇 Live MBTA Train</b>
                <br />
                Status: {current_status?.replace("_", " ")}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
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
