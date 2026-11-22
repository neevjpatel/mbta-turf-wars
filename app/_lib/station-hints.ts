import type { StopData } from "../_data/transit/types";

export function getStationHint(guess: StopData, target: StopData) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const deltaLatitude = radians(target.lat - guess.lat);
  const deltaLongitude = radians(target.lng - guess.lng);
  const haversine = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(radians(guess.lat)) * Math.cos(radians(target.lat)) * Math.sin(deltaLongitude / 2) ** 2;
  const distanceMiles = earthRadiusMiles * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  const bearingY = Math.sin(deltaLongitude) * Math.cos(radians(target.lat));
  const bearingX = Math.cos(radians(guess.lat)) * Math.sin(radians(target.lat))
    - Math.sin(radians(guess.lat)) * Math.cos(radians(target.lat)) * Math.cos(deltaLongitude);
  const bearing = ((Math.atan2(bearingY, bearingX) * 180) / Math.PI + 360) % 360;
  const compassDirections = ["⬆️ N", "↗️ NE", "➡️ E", "↘️ SE", "⬇️ S", "↙️ SW", "⬅️ W", "↖️ NW"];

  return {
    distance: distanceMiles.toFixed(2),
    direction: compassDirections[Math.round(bearing / 45) % compassDirections.length],
    sameLine: guess.line === target.line,
  };
}
