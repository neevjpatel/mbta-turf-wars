export interface StopData {
  id: string;
  name: string;
  line: string;
  lat: number;
  lng: number;
  owner: string;
  points: number;
}

export const INITIAL_STOPS: StopData[] = [
  { id: "place-pktrm", name: "Park Street", line: "Red / Green", lat: 42.356395, lng: -71.062424, owner: "Unclaimed", points: 10 },
  { id: "place-kencl", name: "Kenmore (BU)", line: "Green", lat: 42.348949, lng: -71.095169, owner: "BU", points: 25 },
  { id: "place-babck", name: "Babcock St (BU)", line: "Green-B", lat: 42.35182, lng: -71.12165, owner: "BU", points: 15 },
  { id: "place-rugg", name: "Ruggles (NEU)", line: "Orange", lat: 42.336377, lng: -71.088961, owner: "Northeastern", points: 25 },
  { id: "place-nuniv", name: "Northeastern", line: "Green-E", lat: 42.3404, lng: -71.0888, owner: "Northeastern", points: 15 },
  { id: "place-knncl", name: "Kendall / MIT", line: "Red", lat: 42.362491, lng: -71.086177, owner: "MIT", points: 25 },
  { id: "place-cntsq", name: "Central Square", line: "Red", lat: 42.365486, lng: -71.103802, owner: "MIT", points: 15 },
  { id: "place-harsq", name: "Harvard Square", line: "Red", lat: 42.373362, lng: -71.118956, owner: "Harvard", points: 25 },
  { id: "place-coecl", name: "Copley", line: "Green", lat: 42.349974, lng: -71.077447, owner: "Unclaimed", points: 10 },
  { id: "place-sstat", name: "South Station", line: "Red", lat: 42.352271, lng: -71.055242, owner: "Unclaimed", points: 10 },
  { id: "place-dwnxg", name: "Downtown Crossing", line: "Red / Orange", lat: 42.355518, lng: -71.060225, owner: "Unclaimed", points: 15 },
  { id: "place-bpl", name: "Boston College", line: "Green-B", lat: 42.340081, lng: -71.166769, owner: "BC", points: 25 },
];

export const SCHOOL_COLORS: Record<string, string> = {
  BU: "#EF4444",
  Northeastern: "#F97316",
  MIT: "#8B5CF6",
  Harvard: "#EC4899",
  BC: "#EAB308",
  Unclaimed: "#64748B",
};

export const BOSTON_TRIVIA = [
  {
    question: "Which MBTA line includes the oldest subway tunnel in North America (opened 1897)?",
    options: ["Green Line", "Red Line", "Orange Line"],
    answer: "Green Line",
  },
  {
    question: "What does 'MBTA' stand for?",
    options: [
      "Massachusetts Bay Transportation Authority",
      "Metro Boston Transit Agency",
      "Massachusetts Bus & Train Association",
    ],
    answer: "Massachusetts Bay Transportation Authority",
  },
  {
    question: "Which T station is famous for its musical chimes suspended from the ceiling?",
    options: ["Kendall/MIT", "Park Street", "South Station"],
    answer: "Kendall/MIT",
  },
  {
    question: "What is the name of the MBTA's reusable fare card?",
    options: ["CharlieCard", "BostonPass", "T-Token"],
    answer: "CharlieCard",
  },
]; 



