"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoGuessrStation } from "./stations";
import routeShapes from "./routeShapes.json";

function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let value: number;
    do {
      value = encoded.charCodeAt(index++) - 63;
      result |= (value & 0x1f) << shift;
      shift += 5;
    } while (value >= 0x20);
    latitude += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      value = encoded.charCodeAt(index++) - 63;
      result |= (value & 0x1f) << shift;
      shift += 5;
    } while (value >= 0x20);
    longitude += result & 1 ? ~(result >> 1) : result >> 1;

    points.push([latitude / 1e5, longitude / 1e5]);
  }

  return points;
}

const transitPaths = routeShapes.map((shape) => ({
  route: shape.route,
  color: shape.color,
  positions: decodePolyline(shape.polyline),
}));

function normalizeName(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").trim();
}

function editDistance(first: string, second: string) {
  const row = Array.from({ length: second.length + 1 }, (_, index) => index);
  for (let i = 1; i <= first.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= second.length; j += 1) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (first[i - 1] === second[j - 1] ? 0 : 1));
      previous = above;
    }
  }
  return row[second.length];
}

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
  selectedId,
  correctStationId,
  incorrectGuessId,
}: {
  stations: GeoGuessrStation[];
  selectedId: string | null;
  correctStationId: string | null;
  incorrectGuessId: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (correctStationId) {
      const correct = stations.find((station) => station.id === correctStationId);
      if (!correct) return;

      if (incorrectGuessId) {
        const guessed = stations.find((station) => station.id === incorrectGuessId);
        if (!guessed) return;
        map.fitBounds(
          [[guessed.lat, guessed.lng], [correct.lat, correct.lng]],
          { padding: [64, 64], maxZoom: 14, animate: true, duration: 0.8 }
        );
        return;
      }

      map.flyTo([correct.lat, correct.lng], 14, { duration: 0.8 });
      return;
    }

    const selected = stations.find((station) => station.id === selectedId);
    if (selected) map.flyTo([selected.lat, selected.lng], 15, { duration: 0.7 });
  }, [correctStationId, incorrectGuessId, map, selectedId, stations]);

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
  stations: GeoGuessrStation[];
  selectedId: string | null;
  onSelect: (station: GeoGuessrStation) => void;
  locked: boolean;
  correctStationId: string | null;
  incorrectGuessId: string | null;
  revealedDistanceKm: number | null;
}) {
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const suggestions = useMemo(() => {
    const query = normalizeName(search);
    if (!query) return [];
    return stations
      .map((station) => {
        const name = normalizeName(station.name);
        const words = name.split(" ");
        const distance = Math.min(editDistance(query, name), ...words.map((word) => editDistance(query, word)));
        const threshold = Math.max(1, Math.floor(query.length * 0.35));
        const startsWith = name.startsWith(query);
        const contains = name.includes(query);
        return { station, distance, score: contains ? (startsWith ? 0 : 1) : 2 + distance, matches: contains || distance <= threshold };
      })
      .filter((entry) => entry.matches)
      .sort((a, b) => a.score - b.score || a.station.name.localeCompare(b.station.name))
      .slice(0, 5);
  }, [search, stations]);

  const chooseStation = (station: GeoGuessrStation) => {
    onSelect(station);
    setSearch(station.name);
    setSearchOpen(false);
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer center={[42.35, -71.1]} zoom={12} scrollWheelZoom className="h-full w-full">
      <ResizeMapWithContainer />
      <MapFeedback stations={stations} selectedId={selectedId} correctStationId={correctStationId} incorrectGuessId={incorrectGuessId} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {transitPaths.map((path, index) => (
        <Polyline
          key={`${path.route}-${index}`}
          positions={path.positions}
          pathOptions={{ color: path.color, weight: 5, opacity: 0.82, lineCap: "round", lineJoin: "round" }}
          interactive={false}
        />
      ))}
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
              <Tooltip
                permanent={isSelected || isCorrect || isIncorrectGuess}
                direction="top"
                offset={[0, -8]}
                className={`geo-station-tooltip${isSelected || isCorrect || isIncorrectGuess ? " geo-station-tooltip-highlight" : ""}`}
              >
                {station.name}
              </Tooltip>
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
      <div className="absolute bottom-3 left-3 z-[1000] w-[min(72%,280px)]">
        <label htmlFor="station-search" className="sr-only">Search stations</label>
        <input
          id="station-search"
          type="search"
          value={search}
          disabled={locked}
          autoComplete="off"
          placeholder="Search station…"
          onChange={(event) => {
            setSearch(event.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && suggestions[0]) {
              event.preventDefault();
              chooseStation(suggestions[0].station);
            }
            if (event.key === "Escape") setSearchOpen(false);
          }}
          className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-lg outline-none placeholder:font-normal placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/70 disabled:opacity-70"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={searchOpen && suggestions.length > 0}
          aria-controls="station-search-results"
        />
        {searchOpen && suggestions.length > 0 && !locked && (
          <ul id="station-search-results" role="listbox" className="mt-1 overflow-hidden rounded-lg border border-white/15 bg-slate-950/95 py-1 text-sm text-white shadow-xl backdrop-blur">
            {suggestions.map(({ station }) => (
              <li key={station.id} role="option" aria-selected={selectedId === station.id}>
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => chooseStation(station)} className="w-full px-3 py-2 text-left hover:bg-emerald-700 focus:bg-emerald-700 focus:outline-none">
                  {station.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        {searchOpen && search.trim() && suggestions.length === 0 && !locked && (
          <p className="mt-1 rounded-lg bg-slate-950/95 px-3 py-2 text-xs text-white/75 shadow-xl">No stations found</p>
        )}
      </div>
    </div>
  );
}
