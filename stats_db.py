"""Stats database for Gamifying the T.

Usage:
    python stats_db.py            # creates t_games.db, seeds fake data, prints demo stats

In the game, call only two functions:
    play_id = start_game(conn, "joselo", "Game 1")   # when the game starts
    end_game(conn, play_id, score)                   # when the game ends
The database records the start/end times itself, so the game needs no timer.
"""
import random
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

DB_PATH = "t_games.db"
SCHEMA_PATH = Path(__file__).with_name("schema.sql")
GAMES = ["Game 1", "Game 2", "Game 3"]  # rename to your real game names
NOW = "strftime('%Y-%m-%d %H:%M:%f', 'now')"


def connect(path=DB_PATH):
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(conn):
    conn.executescript(SCHEMA_PATH.read_text())
    conn.executemany("INSERT OR IGNORE INTO games(name) VALUES (?)", [(g,) for g in GAMES])
    conn.commit()


# ---------- writing data (the only two calls the game needs) ----------

def get_or_create_user(conn, username):
    conn.execute("INSERT OR IGNORE INTO users(username) VALUES (?)", (username,))
    return conn.execute("SELECT user_id FROM users WHERE username = ?", (username,)).fetchone()[0]


def game_id(conn, game_name):
    return conn.execute("SELECT game_id FROM games WHERE name = ?", (game_name,)).fetchone()[0]


def start_game(conn, username, game_name):
    """Call when the game starts. Returns play_id; keep it until the game ends."""
    uid = get_or_create_user(conn, username)
    cur = conn.execute(
        "INSERT INTO scores(user_id, game_id) VALUES (?, ?)", (uid, game_id(conn, game_name))
    )
    conn.commit()
    return cur.lastrowid


def end_game(conn, play_id, score):
    """Call when the game ends. Stamps the end time and saves the score."""
    conn.execute(
        f"UPDATE scores SET score = ?, ended_at = {NOW} WHERE score_id = ? AND ended_at IS NULL",
        (score, play_id),
    )
    conn.commit()


# ---------- score stats ----------

def percentile_in_game(conn, username, game_name):
    """% of other players whose best score is below this user's best (ties count half)."""
    gid = game_id(conn, game_name)
    row = conn.execute(
        """
        SELECT b.best_score,
               (SELECT COUNT(*) FROM best_scores o WHERE o.game_id = :g AND o.best_score <  b.best_score) AS below,
               (SELECT COUNT(*) FROM best_scores o WHERE o.game_id = :g AND o.best_score =  b.best_score) AS ties,
               (SELECT COUNT(*) FROM best_scores o WHERE o.game_id = :g)                                  AS n
        FROM best_scores b JOIN users u USING(user_id)
        WHERE u.username = :u AND b.game_id = :g
        """,
        {"g": gid, "u": username},
    ).fetchone()
    if row is None:
        return None
    pct = (row["below"] + 0.5 * (row["ties"] - 1)) / max(row["n"] - 1, 1) * 100
    return {"best": row["best_score"], "percentile": round(pct, 1), "players": row["n"]}


def game_leaderboard(conn, game_name, limit=10):
    return conn.execute(
        """
        SELECT u.username, b.best_score,
               RANK() OVER (ORDER BY b.best_score DESC) AS rank
        FROM best_scores b JOIN users u USING(user_id)
        WHERE b.game_id = ?
        ORDER BY b.best_score DESC LIMIT ?
        """,
        (game_id(conn, game_name), limit),
    ).fetchall()


def overall_leaderboard(conn, limit=10, min_games=2):
    """Average each user's percentile across games (raw scores have different scales).
    Must have played at least `min_games` games to appear."""
    return conn.execute(
        """
        WITH ranked AS (
            SELECT user_id, game_id,
                   PERCENT_RANK() OVER (PARTITION BY game_id ORDER BY best_score) * 100 AS pct
            FROM best_scores
        )
        SELECT u.username, ROUND(AVG(pct), 1) AS t_score, COUNT(*) AS games_played
        FROM ranked JOIN users u USING(user_id)
        GROUP BY u.user_id
        HAVING COUNT(*) >= ?
        ORDER BY t_score DESC LIMIT ?
        """,
        (min_games, limit),
    ).fetchall()


# ---------- time stats ----------

def last_play_time_stats(conn, play_id):
    """'Your round took 41s, quicker than 70% of rounds in this game.'"""
    row = conn.execute(
        """
        SELECT p.duration_sec,
               (SELECT COUNT(*) FROM finished_plays o WHERE o.game_id = p.game_id AND o.duration_sec > p.duration_sec) AS slower,
               (SELECT COUNT(*) FROM finished_plays o WHERE o.game_id = p.game_id) AS n
        FROM finished_plays p WHERE p.score_id = ?
        """,
        (play_id,),
    ).fetchone()
    if row is None:
        return None
    return {"duration_sec": row["duration_sec"],
            "quicker_than_pct": round(row["slower"] / max(row["n"] - 1, 1) * 100, 1)}


def game_time_summary(conn):
    """Per game: plays, median-ish (avg) round length, and how often people quit early."""
    return conn.execute(
        """
        SELECT g.name,
               COUNT(s.score_id)                                         AS started,
               SUM(s.ended_at IS NOT NULL)                               AS finished,
               ROUND(100.0 * SUM(s.ended_at IS NULL) / COUNT(*), 1)      AS quit_pct,
               ROUND(AVG((julianday(s.ended_at) - julianday(s.started_at)) * 86400), 1) AS avg_sec
        FROM games g JOIN scores s USING(game_id)
        GROUP BY g.game_id
        """
    ).fetchall()


def user_time_played(conn, username):
    """Total time a user has spent playing, across all games."""
    row = conn.execute(
        """
        SELECT ROUND(SUM(duration_sec) / 60, 1) AS minutes, COUNT(*) AS plays
        FROM finished_plays JOIN users USING(user_id) WHERE username = ?
        """,
        (username,),
    ).fetchone()
    return dict(row)


# ---------- fake data for the demo ----------

def seed_fake_data(conn, n_users=200, seed=42):
    rng = random.Random(seed)
    # (score mean, score sd, round length mean in seconds)
    params = {"Game 1": (500, 150, 60), "Game 2": (50, 15, 30), "Game 3": (2000, 600, 120)}
    base = datetime(2026, 11, 21, 8, 0, 0)
    fmt = "%Y-%m-%d %H:%M:%S.%f"
    for i in range(n_users):
        uid = get_or_create_user(conn, f"rider{i:03d}")
        skill = rng.gauss(0, 1)
        for g in GAMES:
            if rng.random() < 0.8:
                mu, sd, secs = params[g]
                for _ in range(rng.randint(1, 5)):
                    start = base + timedelta(minutes=rng.uniform(0, 600))
                    if rng.random() < 0.1:            # 10% quit before finishing
                        conn.execute("INSERT INTO scores(user_id, game_id, started_at) VALUES (?,?,?)",
                                     (uid, game_id(conn, g), start.strftime(fmt)))
                        continue
                    end = start + timedelta(seconds=rng.lognormvariate(0, 0.4) * secs)
                    score = max(0, round(rng.gauss(mu + skill * sd * 0.6, sd * 0.8)))
                    conn.execute(
                        "INSERT INTO scores(user_id, game_id, score, started_at, ended_at) VALUES (?,?,?,?,?)",
                        (uid, game_id(conn, g), score, start.strftime(fmt), end.strftime(fmt)),
                    )
    conn.commit()


if __name__ == "__main__":
    import time

    Path(DB_PATH).unlink(missing_ok=True)
    conn = connect()
    init_db(conn)
    seed_fake_data(conn)

    # Simulate a real play: start, "play" for 2 seconds, end
    pid = start_game(conn, "joselo", "Game 2")
    time.sleep(2)
    end_game(conn, pid, 61)

    print("joselo's round:", last_play_time_stats(conn, pid))
    print("joselo in Game 2:", percentile_in_game(conn, "joselo", "Game 2"))
    print("joselo total time:", user_time_played(conn, "joselo"))

    for g in GAMES:
        print(f"\n{g} top 3:")
        for r in game_leaderboard(conn, g, 3):
            print(f"  #{r['rank']} {r['username']}: {r['best_score']:.0f}")

    print("\nOverall top 5 (avg percentile, 2+ games):")
    for r in overall_leaderboard(conn, 5):
        print(f"  {r['username']}: {r['t_score']}  ({r['games_played']} games)")

    print("\nTime summary per game:")
    for r in game_time_summary(conn):
        print(f"  {r['name']}: {r['started']} started, {r['quit_pct']}% quit, avg {r['avg_sec']}s")
