export type TransitLine = "Green" | "Orange" | "Blue" | "Red";
export type GameMode = "charlierun" | "trivia" | "worldle" | "geoguessr";
export type DifficultyLevel = "Easy" | "Medium" | "Hard" | "Expert";

export interface StopData {
  id: string;
  name: string;
  line: TransitLine;
  lat: number;
  lng: number;
  owner: string;
  points: number;
  localTip: string;
}

export interface LineDifficultyConfig {
  line: TransitLine;
  difficulty: DifficultyLevel;
  basePoints: number;
  color: string;
  maxWorldleGuesses: number;
  geoHintsShown: number;
}

export const LINE_DIFFICULTIES: Record<TransitLine, LineDifficultyConfig> = {
  Green: {
    line: "Green",
    difficulty: "Easy",
    basePoints: 15,
    color: "#00843D",
    maxWorldleGuesses: 6,
    geoHintsShown: 3,
  },
  Orange: {
    line: "Orange",
    difficulty: "Medium",
    basePoints: 25,
    color: "#ED8B00",
    maxWorldleGuesses: 5,
    geoHintsShown: 2,
  },
  Blue: {
    line: "Blue",
    difficulty: "Hard",
    basePoints: 40,
    color: "#003DA5",
    maxWorldleGuesses: 4,
    geoHintsShown: 1,
  },
  Red: {
    line: "Red",
    difficulty: "Expert",
    basePoints: 60,
    color: "#DA291C",
    maxWorldleGuesses: 3,
    geoHintsShown: 1,
  },
};

export const SCHOOL_COLORS: Record<string, string> = {
  BU: "#CC0000",
  Northeastern: "#D41B2C",
  MIT: "#750014",
  Harvard: "#A51C30",
  BC: "#8A100B",
};

export const INITIAL_STOPS: StopData[] = [
  // GREEN LINE (EASY)
  {
    id: "place-kencl",
    name: "Kenmore",
    line: "Green",
    lat: 42.3489,
    lng: -71.0951,
    owner: "BU",
    points: 30,
    localTip: "Steps from Fenway Park and the iconic Citgo sign.",
  },
  {
    id: "place-babck",
    name: "Babcock St (BU)",
    line: "Green",
    lat: 42.3518,
    lng: -71.1216,
    owner: "BU",
    points: 20,
    localTip: "Heart of Boston University's West Campus.",
  },
  {
    id: "place-coecl",
    name: "Copley",
    line: "Green",
    lat: 42.35,
    lng: -71.0774,
    owner: "BC",
    points: 25,
    localTip: "Exit directly onto Boylston St & Boston Public Library.",
  },
  {
    id: "place-gover",
    name: "Government Center",
    line: "Green",
    lat: 42.3597,
    lng: -71.0592,
    owner: "Harvard",
    points: 25,
    localTip: "Gateway to Faneuil Hall and the Freedom Trail.",
  },

  // ORANGE LINE (MEDIUM)
  {
    id: "place-rugg",
    name: "Ruggles",
    line: "Orange",
    lat: 42.3364,
    lng: -71.0889,
    owner: "Northeastern",
    points: 40,
    localTip: "Direct commuter hub right on Northeastern's campus.",
  },
  {
    id: "place-bbsta",
    name: "Back Bay",
    line: "Orange",
    lat: 42.3473,
    lng: -71.0757,
    owner: "Northeastern",
    points: 35,
    localTip: "Connects Amtrak, Commuter Rail, and Newbury Street.",
  },
  {
    id: "place-north",
    name: "North Station",
    line: "Orange",
    lat: 42.3655,
    lng: -71.0613,
    owner: "BU",
    points: 35,
    localTip: "Right beneath TD Garden—home of the Celtics & Bruins.",
  },

  // BLUE LINE (HARD)
  {
    id: "place-aqucl",
    name: "Aquarium",
    line: "Blue",
    lat: 42.3597,
    lng: -71.0516,
    owner: "MIT",
    points: 50,
    localTip: "Deepest underground station on the T, right on Long Wharf.",
  },
  {
    id: "place-mvbcl",
    name: "Maverick",
    line: "Blue",
    lat: 42.3691,
    lng: -71.0395,
    owner: "BU",
    points: 50,
    localTip: "First stop in East Boston across the harbor tunnel.",
  },
  {
    id: "place-aport",
    name: "Airport",
    line: "Blue",
    lat: 42.3742,
    lng: -71.0304,
    owner: "Harvard",
    points: 55,
    localTip: "Free shuttle links straight to Logan Airport terminals.",
  },

  // RED LINE (EXPERT)
  {
    id: "place-pktrm",
    name: "Park Street",
    line: "Red",
    lat: 42.3563,
    lng: -71.0624,
    owner: "MIT",
    points: 75,
    localTip: "America's oldest subway station (1897) on Boston Common.",
  },
  {
    id: "place-knncl",
    name: "Kendall/MIT",
    line: "Red",
    lat: 42.3625,
    lng: -71.0861,
    owner: "MIT",
    points: 80,
    localTip: "Surrounded by biotech labs, startups, and MIT's Great Dome.",
  },
  {
    id: "place-harsq",
    name: "Harvard Square",
    line: "Red",
    lat: 42.3733,
    lng: -71.1189,
    owner: "Harvard",
    points: 80,
    localTip: "Historic Harvard Yard, indie bookshops, and street performers.",
  },
  {
    id: "place-sstat",
    name: "South Station",
    line: "Red",
    lat: 42.3522,
    lng: -71.0552,
    owner: "BC",
    points: 70,
    localTip: "Boston's busiest transit terminal in the Financial District.",
  },
];

// 1. TRIVIA BANK (Filtered by Difficulty)
export interface TriviaItem {
  difficulty: DifficultyLevel;
  question: string;
  options: string[];
  answer: string;
}

export const TRIVIA_BANK: TriviaItem[] = [
  // Easy (Green)
  {
    difficulty: "Easy",
    question: "Which MBTA line is the oldest subway tunnel in North America (opened 1897)?",
    options: ["Red Line", "Green Line", "Blue Line", "Orange Line"],
    answer: "Green Line",
  },
  {
    difficulty: "Easy",
    question: "Which MBTA line runs through a tunnel beneath Boston Harbor?",
    options: ["Orange Line", "Blue Line", "Red Line", "Silver Line"],
    answer: "Blue Line",
  },
  // Medium (Orange)
  {
    difficulty: "Medium",
    question: "Why is the MBTA nicknamed 'The T'?",
    options: [
      "Named after Tremont Street",
      "Inspired by Stockholm's Tunnelbana logo",
      "Stands for Transit Terminal",
      "Named after the Tobin Bridge",
    ],
    answer: "Inspired by Stockholm's Tunnelbana logo",
  },
  {
    difficulty: "Medium",
    question: "Which two rapid transit lines intersect at Downtown Crossing?",
    options: [
      "Red & Orange",
      "Green & Blue",
      "Red & Blue",
      "Orange & Blue",
    ],
    answer: "Red & Orange",
  },
  // Hard (Blue)
  {
    difficulty: "Hard",
    question: "Where do Blue Line trains switch from third-rail power to overhead catenary wires?",
    options: ["Airport", "Maverick", "Wonderland", "Aquarium"],
    answer: "Airport",
  },
  {
    difficulty: "Hard",
    question: "Which Green Line branch was the last surface streetcar line to remain running to Lechmere?",
    options: ["E Branch", "B Branch", "C Branch", "D Branch"],
    answer: "E Branch",
  },
  // Expert (Red)
  {
    difficulty: "Expert",
    question: "What year did the Harvard-to-Park Street Cambridge Subway (now Red Line) open?",
    options: ["1912", "1897", "1924", "1904"],
    answer: "1912",
  },
  {
    difficulty: "Expert",
    question: "Which is the deepest underground station in the entire MBTA system?",
    options: ["Aquarium", "Porter", "Harvard Square", "State"],
    answer: "Porter",
  },
];

// 2. GEOGUESSR SCENES (Visual Scene Card + Clues by Difficulty)
export interface GeoScene {
  id: string;
  difficulty: DifficultyLevel;
  targetStop: string;
  sceneTitle: string;
  visualGradient: string;
  landmarkEmoji: string;
  sceneDescription: string;
  clues: string[];
  choices: string[];
}

export const GEOGUESSR_SCENES: GeoScene[] = [
  {
    id: "geo-kenmore",
    difficulty: "Easy",
    targetStop: "Kenmore",
    sceneTitle: "Neon Triangle & Brick Ballpark",
    visualGradient: "from-red-900 via-slate-900 to-emerald-950",
    landmarkEmoji: "⚾🔺",
    sceneDescription:
      "You emerge from an underground glass canopy to see a giant glowing red-and-white triangle sign towering above brick buildings and stadium floodlights.",
    clues: [
      "Served by Green Line B, C, and D branches",
      "Right next to Fenway Park",
      "Famous Citgo sign looms overhead",
    ],
    choices: ["Kenmore", "Copley", "Park Street", "Ruggles"],
  },
  {
    id: "geo-ruggles",
    difficulty: "Medium",
    targetStop: "Ruggles",
    sceneTitle: "Arched Steel Canopy & Brick Plaza",
    visualGradient: "from-orange-900 via-stone-900 to-slate-950",
    landmarkEmoji: "🏛️🚆",
    sceneDescription:
      "A dramatic vaulted steel-and-glass concourse bridges directly over both subway and commuter rail tracks into a bustling red-brick university quad.",
    clues: [
      "Major Orange Line & Commuter Rail bus hub",
      "Directly borders Northeastern University",
      "Located on Tremont St / Forsyth St",
    ],
    choices: ["Back Bay", "Ruggles", "North Station", "South Station"],
  },
  {
    id: "geo-aquarium",
    difficulty: "Hard",
    targetStop: "Aquarium",
    sceneTitle: "Harbor Breeze & Waterfront Plaza",
    visualGradient: "from-blue-900 via-cyan-950 to-slate-950",
    landmarkEmoji: "🦭🌊",
    sceneDescription:
      "Salt air hits you at the top of an extra-long escalator ride. Harbor ferries dock steps away beside a giant cylindrical tank building and the Rose Kennedy Greenway.",
    clues: [
      "Blue Line stop right on Long Wharf",
      "Adjacent to the New England Aquarium",
      "One stop away from State and Maverick",
    ],
    choices: ["Aquarium", "Maverick", "Airport", "Government Center"],
  },
  {
    id: "geo-kendall",
    difficulty: "Expert",
    targetStop: "Kendall/MIT",
    sceneTitle: "Glass Biotech Towers & Kinetic Sculpture",
    visualGradient: "from-rose-950 via-slate-900 to-indigo-950",
    landmarkEmoji: "🧬🔬",
    sceneDescription:
      "Sleek pharmaceutical research labs surround a brick plaza featuring an outdoor steam-powered kinetic sculpture and colorful kayak launches along the Charles River.",
    clues: [
      "Red Line station in East Cambridge",
      "Heart of Cambridge's biotech hub & MIT",
      "Between Charles/MGH and Central",
    ],
    choices: ["Kendall/MIT", "Harvard Square", "Park Street", "South Station"],
  },
];

// 3. T-WORLDLE HAVERSINE DISTANCE & BEARING CALCULATOR
export function getStationHint(guess: StopData, target: StopData) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(target.lat - guess.lat);
  const dLng = toRad(target.lng - guess.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(guess.lat)) *
      Math.cos(toRad(target.lat)) *
      Math.sin(dLng / 2) ** 2;
  const distanceMiles = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const y = Math.sin(dLng) * Math.cos(toRad(target.lat));
  const x =
    Math.cos(toRad(guess.lat)) * Math.sin(toRad(target.lat)) -
    Math.sin(toRad(guess.lat)) *
      Math.cos(toRad(target.lat)) *
      Math.cos(dLng);
  const brng = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;

  const directions = ["⬆️ N", "↗️ NE", "➡️ E", "↘️ SE", "⬇️ S", "↙️ SW", "⬅️ W", "↖️ NW"];
  const dirLabel = directions[Math.round(brng / 45) % 8];

  return {
    distance: distanceMiles.toFixed(2),
    direction: dirLabel,
    sameLine: guess.line === target.line,
  };
}