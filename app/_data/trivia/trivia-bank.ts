import type { DifficultyLevel } from "../transit/types";

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

