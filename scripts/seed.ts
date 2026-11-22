// Fill the database with 200 FAKE riders (rider000–rider199) so SQL queries can be tested.
// This is not real player data. Scores loosely follow each game's real scoring rules (see comments).
// Run:  npx tsx scripts/seed.ts      (delete db/t_games.db first to start fresh)
import { getDb } from "../lib/db";
import { GAMES, type GameName } from "../lib/games";
import { SCHOOLS, SCHOOL_GAMES } from "../lib/schools";

const db = getDb();
let seed = 42;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const gauss = () => Math.sqrt(-2 * Math.log(rand())) * Math.cos(2 * Math.PI * rand());
const pick = <T,>(items: T[]) => items[Math.floor(rand() * items.length)];
const chance = (skill: number, shift = 0) => rand() < 1 / (1 + Math.exp(-(skill + shift)));
const delay = () => (rand() < 0.15 ? 3 : 1); // 3x delay bonus, toggled by the player

// basePoints per line: Green 15, Orange 25, Blue 40, Red 60 (app/_data/transit/lines.ts)
const LINE_POINTS = [15, 25, 40, 60];

// Each returns [score, round length in seconds] for one play by a rider with this skill.
const PLAY: Record<GameName, (skill: number) => [number, number]> = {
  // Turf Wars: one trivia challenge; wrong answers can retry, so a finished play always earns basePoints (x3 with delay)
  "turf-wars": (skill) => [pick(LINE_POINTS) * delay(), 6 + rand() * 20 - skill * 3],
  // T Guesser: one photo, 50 points if the station is right, else 0
  "t-guesser": (skill) => [chance(skill, -0.3) ? 50 : 0, 10 + rand() * 30],
  // Stople: one mystery station, basePoints of the difficulty's line if solved, else 0
  stople: (skill) => [chance(skill, 0.5) ? pick(LINE_POINTS) : 0, 30 + rand() * 90],
  // Charlie Run: +1 per 20 frames (~3/sec at 60fps) plus 5 per coin, all x3 with delay
  "charlie-run": (skill) => {
    const secs = Math.exp(2.8 + 0.3 * skill + 0.5 * gauss());
    const coins = Math.floor((secs / 4) * rand());
    return [(Math.floor(secs * 3) + coins * 5) * delay(), secs];
  },
};

// Fake riders have no email or sign-in account; about 60% get a school so the school leaderboard has data.
const addUser = db.prepare("INSERT OR IGNORE INTO users(username, school) VALUES (?, ?)");
const getUser = db.prepare("SELECT user_id, school FROM users WHERE username = ?");
const getGame = db.prepare("SELECT game_id FROM games WHERE name = ?");
const addPlay = db.prepare("INSERT INTO scores(user_id, game_id, score, started_at, ended_at, difficulty, school) VALUES (?,?,?,?,?,?,?)");
const DIFFICULTIES = ["easy", "medium", "hard", "extreme"];
const iso = (d: Date) => d.toISOString().replace("T", " ").replace("Z", "");

db.transaction(() => {
  const base = Date.now() - 10 * 3600_000;
  for (let i = 0; i < 200; i++) {
    const name = `rider${String(i).padStart(3, "0")}`;
    addUser.run(name, rand() < 0.6 ? pick(SCHOOLS) : null);
    const { user_id: uid, school } = getUser.get(name) as { user_id: number; school: string | null };
    const skill = gauss();
    for (const g of GAMES) {
      if (rand() > 0.8) continue;
      const gid = (getGame.get(g) as { game_id: number }).game_id;
      const plays = 1 + Math.floor(rand() * 5);
      const credit = (SCHOOL_GAMES as readonly string[]).includes(g) ? school : null; // only Turf Wars counts for a school
      for (let k = 0; k < plays; k++) {
        const start = new Date(base + rand() * 10 * 3600_000);
        const difficulty = pick(DIFFICULTIES);
        if (rand() < 0.1) { addPlay.run(uid, gid, null, iso(start), null, difficulty, credit); continue; } // quit early
        const [score, secs] = PLAY[g](skill);
        const end = new Date(start.getTime() + Math.max(2, secs) * 1000);
        addPlay.run(uid, gid, score, iso(start), iso(end), difficulty, credit);
      }
    }
  }
})();

console.log("Seeded:", db.prepare("SELECT COUNT(*) AS plays FROM scores").get());
