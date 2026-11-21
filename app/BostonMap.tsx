"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { SCHOOL_COLORS, StopData } from "./mbtaData";

export default function BostonMap({
  selectedSchool,
  isDelayed,
  onStartClaim,
  stops,
  isActive,
}: {
  selectedSchool: string;
  isDelayed: boolean;
  onStartClaim: (stop: StopData) => void;
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

  return (
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
