"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { INITIAL_STOPS, SCHOOL_COLORS, StopData } from "./mbtaData";

export default function BostonMap({
  selectedSchool,
  isDelayed,
  onStartClaim,
  claimedStopTrigger,
}: {
  selectedSchool: string;
  isDelayed: boolean;
  onStartClaim: (stop: StopData) => void;
  claimedStopTrigger: { stopId: string; school: string; pointsAdded: number } | null;
}) {
  const [stops, setStops] = useState<StopData[]>(INITIAL_STOPS);
  const [trains, setTrains] = useState<any[]>([]);

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