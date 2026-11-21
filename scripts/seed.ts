// Fill the database with 200 fake riders for testing/demo.
// Run:  npx tsx scripts/seed.ts      (delete db/t_games.db first to start fresh)
import { getDb, GAMES } from "../lib/db";

const db = getDb();
let seed = 42;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const gauss = () => Math.sqrt(-2 * Math.log(rand())) * Math.cos(2 * Math.PI * rand());

// [score mean, score sd, round length seconds]
const params: Record<string, [number, number, number]> = {
  [GAMES[0]]: [500, 150, 60],
  [GAMES[1]]: [50, 15, 30],
  [GAMES[2]]: [2000, 600, 120],
};

const addUser = db.prepare("INSERT OR IGNORE INTO users(username) VALUES (?)");
const getUser = db.prepare("SELECT user_id FROM users WHERE username = ?");
const getGame = db.prepare("SELECT game_id FROM games WHERE name = ?");
const addPlay = db.prepare("INSERT INTO scores(user_id, game_id, score, started_at, ended_at) VALUES (?,?,?,?,?)");
const iso = (d: Date) => d.toISOString().replace("T", " ").replace("Z", "");

db.transaction(() => {
  const base = Date.now() - 10 * 3600_000;
  for (let i = 0; i < 200; i++) {
    const name = `rider${String(i).padStart(3, "0")}`;
    addUser.run(name);
    const uid = (getUser.get(name) as { user_id: number }).user_id;
    const skill = gauss();
    for (const g of GAMES) {
      if (rand() > 0.8) continue;
      const [mu, sd, secs] = params[g];
      const gid = (getGame.get(g) as { game_id: number }).game_id;
      const plays = 1 + Math.floor(rand() * 5);
      for (let k = 0; k < plays; k++) {
        const start = new Date(base + rand() * 10 * 3600_000);
        if (rand() < 0.1) { addPlay.run(uid, gid, null, iso(start), null); continue; } // quit early
        const end = new Date(start.getTime() + Math.exp(0.4 * gauss()) * secs * 1000);
        const score = Math.max(0, Math.round(mu + skill * sd * 0.6 + gauss() * sd * 0.8));
        addPlay.run(uid, gid, score, iso(start), iso(end));
      }
    }
  }
})();

console.log("Seeded:", db.prepare("SELECT COUNT(*) AS plays FROM scores").get());
