import { INITIAL_STOPS, type StopData } from "../mbtaData";

const additionalStations: StopData[] = [
  { id: "place-chill", name: "Chestnut Hill Avenue", line: "Green-B", lat: 42.33843, lng: -71.15281, owner: "Unclaimed", points: 10 },
  { id: "place-chswk", name: "Chiswick Road", line: "Green-B", lat: 42.34083, lng: -71.15061, owner: "Unclaimed", points: 10 },
  { id: "place-sthld", name: "Sutherland Road", line: "Green-B", lat: 42.34158, lng: -71.14635, owner: "Unclaimed", points: 10 },
  { id: "place-wascm", name: "Washington Street", line: "Green-B", lat: 42.34389, lng: -71.14259, owner: "Unclaimed", points: 10 },
  { id: "place-wrnst", name: "Warren Street", line: "Green-B", lat: 42.3486, lng: -71.1403, owner: "Unclaimed", points: 10 },
  { id: "place-alsgr", name: "Allston Street", line: "Green-B", lat: 42.3486, lng: -71.1376, owner: "Unclaimed", points: 10 },
  { id: "place-grigg", name: "Griggs Street", line: "Green-B", lat: 42.34878, lng: -71.13444, owner: "Unclaimed", points: 10 },
  { id: "place-harvd", name: "Harvard Avenue", line: "Green-B", lat: 42.35043, lng: -71.13103, owner: "Unclaimed", points: 10 },
  { id: "place-brico", name: "Packards Corner", line: "Green-B", lat: 42.352086, lng: -71.12472, owner: "Unclaimed", points: 10 },
];

export const GEOGUESSER_STATIONS: StopData[] = [...INITIAL_STOPS, ...additionalStations];
