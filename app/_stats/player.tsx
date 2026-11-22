"use client";

// Player identity + score recording for the games.
//  - <PlayerProvider> loads who is playing (guest, or a signed-in player with a username and maybe a school).
//  - <PlayerBar> is the small sign-in pill + toasts + first-sign-in username prompt. It stays out of the way:
//    guests can play everything; they're only reminded that their scores aren't saved.
//  - usePlay(game) is the one hook the games use:  play.start()  when a round starts,  play.end(score)  when it ends.
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { GAME_LABELS } from "@/app/_data/game-model.mjs";
import { useAppState } from "@/app/_state/app-state";
import { authClient } from "@/lib/auth-client";
import { SCHOOL_GAMES, type School } from "@/lib/schools";
import { CAMPUS_COLORS } from "@/app/_data/campuses";
import { recordEnd, recordStart, type GameName, type PlayStats } from "@/lib/statsClient";

export type Player = {
  status: "loading" | "guest" | "needs-username" | "ready";
  username?: string;
  email?: string;
  school: School | null;
};

type RoundDetail = { lines: string[]; personalBest: boolean };
type Celebration = { id: number; points: number; game: GameName; guest: boolean; school: School | null; detail?: RoundDetail };

const secs = (s: number) => `${Math.round(s)}s`;

/** Concrete, changing facts about the round just played: rank, who's next, and this round vs the average. */
function describeRound(game: GameName, s: PlayStats): RoundDetail {
  const label = GAME_LABELS[game];
  const standing =
    s.rank === 1
      ? `You're #1 of ${s.players} in ${label}!`
      : s.next_username && s.points_to_next != null
        ? `#${s.rank} of ${s.players} in ${label} · ${s.points_to_next === 0 ? "tied with" : `${s.points_to_next} pts behind`} @${s.next_username} (#${s.next_rank})`
        : `#${s.rank} of ${s.players} in ${label}`;
  const round = `This round: +${s.score} pts in ${secs(s.duration_sec)} · average round: +${s.avg_round_score} in ${secs(s.avg_round_sec)}`;
  return { lines: [standing, round, `${s.total_points} ${label} points total`], personalBest: s.score > 0 && s.personal_best === 1 && s.prev_best != null };
}

type PlayerContextValue = {
  player: Player;
  googleConfigured: boolean;
  refresh: () => Promise<void>;
  notify: (message: string) => void;
  celebrate: (c: Omit<Celebration, "id">) => number;
  addCelebrationDetail: (id: number, detail: RoundDetail) => void;
  signIn: () => void;
  signOut: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

const LOADING: Player = { status: "loading", school: null };
const GUEST: Player = { status: "guest", school: null };

async function fetchMe(): Promise<{ player: Player; googleConfigured: boolean }> {
  try {
    const res = await fetch("/api/me", { cache: "no-store" });
    const me = await res.json();
    return {
      googleConfigured: Boolean(me.googleConfigured),
      player: { status: me.status, username: me.username, email: me.email, school: me.school ?? null },
    };
  } catch {
    return { googleConfigured: false, player: GUEST };
  }
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<Player>(LOADING);
  const [googleConfigured, setGoogleConfigured] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const apply = useCallback((me: Awaited<ReturnType<typeof fetchMe>>) => {
    setGoogleConfigured(me.googleConfigured);
    setPlayer(me.player);
  }, []);

  const refresh = useCallback(async () => apply(await fetchMe()), [apply]);

  useEffect(() => {
    let alive = true;
    fetchMe().then((me) => alive && apply(me));
    return () => {
      alive = false;
    };
  }, [apply]);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4500);
  }, []);

  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const celebrationTimer = useRef<number | undefined>(undefined);
  const nextCelebrationId = useRef(1);

  const closeCelebration = useCallback(() => setCelebration(null), []);

  const celebrate = useCallback((c: Omit<Celebration, "id">) => {
    const id = nextCelebrationId.current++;
    setCelebration({ ...c, id });
    window.clearTimeout(celebrationTimer.current);
    celebrationTimer.current = window.setTimeout(() => setCelebration(null), c.guest ? 6000 : 4500);
    return id;
  }, []);

  const addCelebrationDetail = useCallback((id: number, detail: RoundDetail) => {
    setCelebration((current) => (current?.id === id ? { ...current, detail } : current));
  }, []);

  const signIn = useCallback(() => {
    void authClient.signIn.social({ provider: "google", callbackURL: window.location.href });
  }, []);

  const signOut = useCallback(() => {
    void authClient.signOut().then(refresh);
  }, [refresh]);

  const value = useMemo(
    () => ({ player, googleConfigured, refresh, notify, celebrate, addCelebrationDetail, signIn, signOut }),
    [player, googleConfigured, refresh, notify, celebrate, addCelebrationDetail, signIn, signOut]
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {celebration && <CelebrationCard key={celebration.id} celebration={celebration} onClose={closeCelebration} />}
      <PlayerBar toast={toast} />
    </PlayerContext.Provider>
  );
}

/** Who is playing. Outside a PlayerProvider everyone is a guest. */
export function usePlayer(): Player {
  return useContext(PlayerContext)?.player ?? GUEST;
}

export function usePlayerActions() {
  return useContext(PlayerContext);
}

/**
 * Score recording for one game. Usage inside a game component:
 *   const play = usePlay("stople");
 *   play.start();            // when a round starts (safe to call from a useEffect)
 *   play.end(points, {...});  // when the round ends; details are optional game-specific data
 * Any round that earns points shows a congratulations card. For guests nothing is saved,
 * and the card offers sign-in instead.
 */
export function usePlay(game: GameName) {
  const ctx = useContext(PlayerContext);
  const { difficulty } = useAppState();
  const ready = ctx?.player.status === "ready";
  const latest = useRef({ ctx, difficulty });
  const open = useRef<{ id: Promise<number | null>; at: number } | null>(null);

  useEffect(() => {
    latest.current = { ctx, difficulty };
  });

  // Recreated when the player becomes ready, so a game's `useEffect(() => play.start(), [play, ...])`
  // re-runs and starts recording the round that was already on screen.
  return useMemo(
    () => ({
      start() {
        if (!ready) return;
        // React dev mode runs effects twice; ignore a second start right after the first.
        if (open.current && Date.now() - open.current.at < 1500) return;
        open.current = { id: recordStart(game, latest.current.difficulty), at: Date.now() };
      },
      end(score: number, details?: Record<string, unknown>) {
        const { ctx } = latest.current;
        const current = open.current;
        open.current = null;
        const saving = ready && Boolean(current);
        const forSchool = ready && (SCHOOL_GAMES as readonly string[]).includes(game) ? ctx?.player.school ?? null : null;
        const cardId = score > 0 && ctx ? ctx.celebrate({ points: score, game, guest: !ready, school: forSchool }) : null;
        if (!saving || !current) return;
        void current.id
          .then((playId) => recordEnd(playId, score, details))
          .then((stats) => {
            if (!stats || !ctx) return;
            const detail = describeRound(game, stats);
            if (cardId) ctx.addCelebrationDetail(cardId, detail);
            else ctx.notify(`Round saved · ${detail.lines[0]}`);
          });
      },
    }),
    [game, ready]
  );
}

/** "+25 points!" card at the top of the screen after any round that earns points. */
function CelebrationCard({ celebration: c, onClose }: { celebration: Celebration; onClose: () => void }) {
  const { signIn, googleConfigured } = useContext(PlayerContext)!;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[2002] flex justify-center px-4">
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto w-full max-w-sm rounded-2xl border-4 border-[#07151b] bg-[#f7f5e9] p-4 text-center text-[#1b2d34] shadow-[0_6px_0_#07151b] motion-safe:animate-[celebrate-in_.35s_ease-out]"
      >
        <style>{`@keyframes celebrate-in { from { transform: translateY(-12px) scale(.95); opacity: 0 } to { transform: none; opacity: 1 } }`}</style>
        <p className="text-3xl" aria-hidden="true">🎉</p>
        <p className="text-2xl font-black uppercase tracking-tight">+{c.points} points!</p>
        <p className="mt-1 text-sm font-semibold">
          Nice round of {GAME_LABELS[c.game]}
          {c.school && (
            <>
              {" · "}
              <span className="inline-flex items-center gap-1">
                <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CAMPUS_COLORS[c.school] }} />
                +{c.points} for {c.school}
              </span>
            </>
          )}
        </p>
        {c.guest ? (
          <div className="mt-3 rounded-xl bg-white p-2 text-xs">
            <p>You&apos;re playing as a guest, so these points aren&apos;t saved.</p>
            <button type="button" onClick={signIn} disabled={!googleConfigured} className="mt-2 rounded-full bg-[#07151b] px-3 py-1.5 font-bold text-white disabled:opacity-40">
              {googleConfigured ? "Sign in with Google to keep them" : "Sign-in isn't set up yet"}
            </button>
          </div>
        ) : (
          <div className="mt-2 min-h-4 space-y-0.5 text-xs text-[#52656b]">
            {c.detail?.personalBest && <p className="font-black uppercase text-[#7a5b16]">New personal best!</p>}
            {c.detail ? c.detail.lines.map((line) => <p key={line}>{line}</p>) : <p>Saving to your profile…</p>}
          </div>
        )}
        <button type="button" onClick={onClose} className="mt-2 text-xs font-semibold text-[#52656b] underline">Close</button>
      </div>
    </div>
  );
}

function PlayerBar({ toast }: { toast: string | null }) {
  const ctx = useContext(PlayerContext)!;
  const { player, googleConfigured, signIn, signOut } = ctx;
  if (player.status === "loading") return null;

  return (
    <div className="pointer-events-none fixed bottom-3 left-3 z-[2000] flex max-w-[calc(100vw-1.5rem)] flex-col items-start gap-2 text-xs">
      {toast && (
        <div role="status" className="pointer-events-auto rounded-xl bg-slate-950/95 px-3 py-2 font-semibold text-white shadow-xl ring-1 ring-white/15">
          {toast}
        </div>
      )}
      <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-slate-950/90 py-1.5 pl-3 pr-1.5 text-white/90 shadow-lg ring-1 ring-white/15 backdrop-blur">
        {player.status === "ready" ? (
          <>
            <Link href="/profile" className="font-bold text-white hover:underline">@{player.username}</Link>
            <span className="text-white/60">{player.school ?? "no school"}</span>
            <button type="button" onClick={signOut} className="rounded-full px-2 py-1 text-white/60 hover:bg-white/10 hover:text-white">Sign out</button>
          </>
        ) : (
          <>
            <span>Guest · scores not saved</span>
            <button
              type="button"
              onClick={signIn}
              disabled={!googleConfigured}
              title={googleConfigured ? undefined : "Google sign-in isn't set up yet (add the keys to .env.local)"}
              className="rounded-full bg-white px-2.5 py-1 font-bold text-slate-950 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sign in with Google
            </button>
          </>
        )}
      </div>
      {player.status === "needs-username" && <UsernamePrompt />}
    </div>
  );
}

function UsernamePrompt() {
  const { player, refresh, signOut } = useContext(PlayerContext)!;
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/profile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username }) });
    const json = await res.json().catch(() => ({ error: "Something went wrong" }));
    setSaving(false);
    if (!res.ok) return setError(json.error ?? "Something went wrong");
    await refresh();
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-[2001] grid place-items-center bg-black/60 p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-5 text-slate-900 shadow-2xl" aria-labelledby="username-title">
        <h2 id="username-title" className="text-lg font-black">Pick a username</h2>
        <p className="mt-1 text-sm text-slate-600">Signed in as {player.email}</p>
        <p className="mt-3 rounded-lg bg-slate-100 p-3 text-sm">
          {player.school
            ? <>Your school email puts you on <b>{player.school}</b>. Your Turf Wars points also count for {player.school}.</>
            : <>This isn&apos;t a BU, MIT, Harvard, Northeastern or BC email, so your points count for you only.</>}
        </p>
        <label htmlFor="username" className="mt-4 block text-sm font-bold">Username</label>
        <input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          minLength={3}
          maxLength={20}
          pattern="[A-Za-z0-9_.\-]+"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          placeholder="3–20 letters, numbers, _ . -"
        />
        {error && <p role="alert" className="mt-2 text-sm font-semibold text-red-600">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">
            {saving ? "Saving…" : "Save and play"}
          </button>
          <button type="button" onClick={signOut} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Play as guest
          </button>
        </div>
      </form>
    </div>
  );
}
