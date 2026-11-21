"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { StopData } from "../mbtaData";

function ResizeMapWithContainer() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize({ animate: false }));
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}

function MapFeedback({
  stations,
  correctStationId,
  incorrectGuessId,
}: {
  stations: StopData[];
  correctStationId: string | null;
  incorrectGuessId: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!correctStationId) {
      map.flyTo([42.35, -71.1], 12, { duration: 0.7 });
      return;
    }

    const correct = stations.find((station) => station.id === correctStationId);
    if (!correct) return;

    if (incorrectGuessId) {
      const guessed = stations.find((station) => station.id === incorrectGuessId);
      if (!guessed) return;
      map.fitBounds(
        [
          [guessed.lat, guessed.lng],
          [correct.lat, correct.lng],
        ],
        { padding: [64, 64], maxZoom: 14, animate: true, duration: 0.8 }
      );
      return;
    }

    map.flyTo([correct.lat, correct.lng], 14, { duration: 0.8 });
  }, [correctStationId, incorrectGuessId, map, stations]);

  return null;
}

export default function StationMap({
  stations,
  selectedId,
  onSelect,
  locked,
  correctStationId,
  incorrectGuessId,
  revealedDistanceKm,
}: {
  stations: StopData[];
  selectedId: string | null;
  onSelect: (station: StopData) => void;
  locked: boolean;
  correctStationId: string | null;
  incorrectGuessId: string | null;
  revealedDistanceKm: number | null;
}) {
  return (
    <MapContainer center={[42.35, -71.1]} zoom={12} scrollWheelZoom className="h-full w-full">
      <ResizeMapWithContainer />
      <MapFeedback stations={stations} correctStationId={correctStationId} incorrectGuessId={incorrectGuessId} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {correctStationId && incorrectGuessId && revealedDistanceKm !== null && (() => {
        const correct = stations.find((station) => station.id === correctStationId);
        const guessed = stations.find((station) => station.id === incorrectGuessId);
        if (!correct || !guessed) return null;

        return (
          <Polyline
            positions={[[guessed.lat, guessed.lng], [correct.lat, correct.lng]]}
            pathOptions={{ color: "#facc15", weight: 4, opacity: 0.95, dashArray: "9 7" }}
          >
            <Tooltip permanent direction="center" className="geo-distance-tooltip">
              {revealedDistanceKm.toFixed(2)} km
            </Tooltip>
          </Polyline>
        );
      })()}
      {stations.map((station) => (
        (() => {
          const isCorrect = correctStationId === station.id;
          const isIncorrectGuess = incorrectGuessId === station.id;
          const isSelected = selectedId === station.id;
          const fillColor = isIncorrectGuess ? "#ef4444" : isCorrect ? "#22c55e" : isSelected ? "#10b981" : "#0f172a";
          return (
            <CircleMarker
              key={station.id}
              center={[station.lat, station.lng]}
              radius={isCorrect || isIncorrectGuess ? 12 : isSelected ? 10 : 7}
              pathOptions={{ color: isCorrect ? "#d9f99d" : isIncorrectGuess ? "#fecaca" : "#ffffff", weight: isCorrect || isIncorrectGuess ? 3 : 2, fillColor, fillOpacity: 1 }}
              eventHandlers={{ click: () => !locked && onSelect(station) }}
            >
              {isCorrect && <Tooltip permanent direction="top" offset={[0, -8]}>Correct · {station.name}</Tooltip>}
              {isIncorrectGuess && <Tooltip permanent direction="top" offset={[0, -8]}>Your guess · {station.name}</Tooltip>}
              <Popup>
                <div className="min-w-32 text-slate-900">
                  <strong>{station.name}</strong>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => onSelect(station)}
                    className="mt-2 block w-full rounded bg-emerald-600 px-3 py-1.5 text-sm font-bold text-white disabled:opacity-50"
                  >{selectedId === station.id ? "Selected" : "Guess this station"}</button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })()
      ))}
    </MapContainer>
  );
}
