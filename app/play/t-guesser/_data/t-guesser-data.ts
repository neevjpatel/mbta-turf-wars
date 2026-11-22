import { TRANSIT_STATIONS } from "@/app/_data/transit/stations";
import type { TransitStation } from "@/app/_data/transit/types";

export type TGuesserDifficulty = "easy" | "medium" | "hard" | "extreme";

interface LocationImage {
  id: string;
  difficulties: TGuesserDifficulty[];
  src: string;
}

interface TGuesserLocation {
  id: string;
  stationId: string;
  images: LocationImage[];
}

export interface TGuesserImage extends LocationImage {
  locationId: string;
  correctStationId: string;
}

export type TGuesserStation = TransitStation;

export const T_GUESSER_STATIONS = TRANSIT_STATIONS;

const T_GUESSER_LOCATIONS: TGuesserLocation[] = [
  { id: "allston-street", stationId: "place-alsgr", images: [
    { id: "allston-street-1-medium", difficulties: ["medium"], src: "/games/t-guesser/images/allston-street-1-medium.png" },
    { id: "allston-street-2-easy", difficulties: ["easy"], src: "/games/t-guesser/images/allston-street-2-easy.png" },
  ] },
  { id: "amory-street", stationId: "place-amory", images: [
    { id: "amory-street-1-medium", difficulties: ["medium"], src: "/games/t-guesser/images/amory-street-1-medium.png" },
    { id: "amory-street-2-easy", difficulties: ["easy"], src: "/games/t-guesser/images/amory-street-2-easy.png" },
    { id: "amory-street-3-hard", difficulties: ["hard"], src: "/games/t-guesser/images/amory-street-3-hard.png" },
  ] },
  { id: "babcock-street", stationId: "place-babck", images: [
    { id: "babcock-corner-1-medium", difficulties: ["medium"], src: "/games/t-guesser/images/babcock-corner-1-medium.png" },
    { id: "babcock-street-2-easy", difficulties: ["easy"], src: "/games/t-guesser/images/babcock-street-2-easy.png" },
  ] },
  { id: "blandford-street", stationId: "place-bland", images: [
    { id: "blandford-street-1-hard", difficulties: ["hard"], src: "/games/t-guesser/images/blandford-street-1-hard.png" },
    { id: "blandford-street-2-easy", difficulties: ["easy"], src: "/games/t-guesser/images/blandford-street-2-easy.png" },
  ] },
  { id: "boston-college", stationId: "place-lake", images: [
    { id: "boston-college-1-medium", difficulties: ["medium"], src: "/games/t-guesser/images/boston-college-1-medium.png" },
    { id: "boston-college-2-hard", difficulties: ["hard"], src: "/games/t-guesser/images/boston-college-2-hard.png" },
  ] },
  { id: "bu-central", stationId: "place-bucen", images: [
    { id: "bu-central-1-easy", difficulties: ["easy"], src: "/games/t-guesser/images/bu-central-1-easy.png" },
    { id: "bu-central-2-medium", difficulties: ["medium"], src: "/games/t-guesser/images/bu-central-2-medium.png" },
    { id: "bu-central-3-extreme", difficulties: ["extreme"], src: "/games/t-guesser/images/bu-central-3-extreme.png" },
  ] },
  { id: "bu-east", stationId: "place-buest", images: [
    { id: "bu-east-1-easy", difficulties: ["easy"], src: "/games/t-guesser/images/bu-east-1-easy.png" },
    { id: "bu-east-2-medium", difficulties: ["medium"], src: "/games/t-guesser/images/bu-east-2-medium.png" },
    { id: "bu-east-3-extreme", difficulties: ["extreme"], src: "/games/t-guesser/images/bu-east-3-extreme.png" },
  ] },
  { id: "chestnut-hill", stationId: "place-chill", images: [
    { id: "chestnut-hill-1-easy", difficulties: ["easy"], src: "/games/t-guesser/images/chestnut-hill-1-easy.png" },
    { id: "chestnut-hill-2-extreme", difficulties: ["extreme"], src: "/games/t-guesser/images/chestnut-hill-2-extreme.png" },
  ] },
  { id: "chiswick-road", stationId: "place-chswk", images: [
    { id: "chiswick-road-1-hard", difficulties: ["hard"], src: "/games/t-guesser/images/chiswick-road-1-hard.png" },
    { id: "chiswick-road-2-extreme", difficulties: ["extreme"], src: "/games/t-guesser/images/chiswick-road-2-extreme.png" },
  ] },
  { id: "griggs-street", stationId: "place-grigg", images: [
    { id: "griggs-street-1-extreme", difficulties: ["extreme"], src: "/games/t-guesser/images/griggs-street-1-extreme.png" },
    { id: "griggs-street-2-medium", difficulties: ["medium"], src: "/games/t-guesser/images/griggs-street-2-medium.png" },
    { id: "griggs-street-3-hard", difficulties: ["hard"], src: "/games/t-guesser/images/griggs-street-3-hard.png" },
  ] },
  { id: "harvard-ave", stationId: "place-harvd", images: [
    { id: "harvard-ave-1-hard", difficulties: ["hard"], src: "/games/t-guesser/images/harvard-ave-1-hard.png" },
    { id: "harvard-ave-2-easy", difficulties: ["easy"], src: "/games/t-guesser/images/harvard-ave-2-easy.png" },
    { id: "harvard-ave-3-extreme", difficulties: ["extreme"], src: "/games/t-guesser/images/harvard-ave-3-extreme.png" },
  ] },
  { id: "kenmore-square", stationId: "place-kencl", images: [
    { id: "kenmore-square-1-medium", difficulties: ["medium"], src: "/games/t-guesser/images/kenmore-square-1-medium.png" },
    { id: "kenmore-square-2-medium", difficulties: ["medium"], src: "/games/t-guesser/images/kenmore-square-2-medium.png" },
    { id: "kenmore-square-3-easy", difficulties: ["easy"], src: "/games/t-guesser/images/kenmore-square-3-easy.png" },
  ] },
  { id: "packards-corner", stationId: "place-brico", images: [
    { id: "packards-corner-1-easy", difficulties: ["easy"], src: "/games/t-guesser/images/packards-corner-1-easy.png" },
    { id: "packards-corner-2-medium", difficulties: ["medium"], src: "/games/t-guesser/images/packards-corner-2-medium.png" },
    { id: "packards-corner-3-hard", difficulties: ["hard"], src: "/games/t-guesser/images/packards-corner-3-hard.png" },
  ] },
  { id: "south-station", stationId: "place-sstat", images: [
    { id: "south-station-1-hard", difficulties: ["hard"], src: "/games/t-guesser/images/south-station-1-hard.png" },
    { id: "south-station-2-easy", difficulties: ["easy"], src: "/games/t-guesser/images/south-station-2-easy.png" },
    { id: "south-station-3-medium", difficulties: ["medium"], src: "/games/t-guesser/images/south-station-3-medium.png" },
  ] },
  { id: "sutherland-road", stationId: "place-sthld", images: [
    { id: "sutherland-road-1-easy", difficulties: ["easy"], src: "/games/t-guesser/images/sutherland-road-1-easy.png" },
    { id: "sutherland-road-2-extreme", difficulties: ["extreme"], src: "/games/t-guesser/images/sutherland-road-2-extreme.png" },
  ] },
  { id: "warren-street", stationId: "place-wrnst", images: [
    { id: "warren-street-1-easy", difficulties: ["easy"], src: "/games/t-guesser/images/warren-street-1-easy.png" },
    { id: "warren-street-2-hard", difficulties: ["hard"], src: "/games/t-guesser/images/warren-street-2-hard.png" },
  ] },
  { id: "washington-street", stationId: "place-wascm", images: [
    { id: "washington-street-1-extreme", difficulties: ["extreme"], src: "/games/t-guesser/images/washington-street-1-extreme.png" },
    { id: "washington-street-2-medium", difficulties: ["medium"], src: "/games/t-guesser/images/washington-street-2-medium.png" },
  ] },
];

export const T_GUESSER_IMAGES: TGuesserImage[] = T_GUESSER_LOCATIONS.flatMap((location) =>
  location.images.map((image) => ({ ...image, locationId: location.id, correctStationId: location.stationId }))
);

export const T_GUESSER_IMAGES_BY_DIFFICULTY: Record<TGuesserDifficulty, TGuesserImage[]> = {
  easy: T_GUESSER_IMAGES.filter((image) => image.difficulties.includes("easy")),
  medium: T_GUESSER_IMAGES.filter((image) => image.difficulties.includes("medium")),
  hard: T_GUESSER_IMAGES.filter((image) => image.difficulties.includes("hard")),
  extreme: T_GUESSER_IMAGES.filter((image) => image.difficulties.includes("extreme")),
};
