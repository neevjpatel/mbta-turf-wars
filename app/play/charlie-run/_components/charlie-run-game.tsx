"use client";

import { LINE_DIFFICULTIES } from "@/app/_data/transit/lines";
import { useEffect, useRef, useState } from "react";
import type { DifficultyLevel, TransitLine } from "@/app/_data/transit/types";
import { usePlay } from "@/app/_stats/player";

interface Obstacle {
  id: number;
  lane: -1 | 0 | 1;
  z: number;
  type: "train" | "person" | "barrier";
  speedMult: number;
  shirtColor: string;
}

interface Coin {
  id: number;
  lane: -1 | 0 | 1;
  z: number;
  collected: boolean;
}

const DIFFICULTY_TUNING: Record<
  DifficultyLevel,
  { baseSpeed: number; targetScore: number; spawnRate: number }
> = {
  Easy: { baseSpeed: 0.011, targetScore: 40, spawnRate: 52 },
  Medium: { baseSpeed: 0.014, targetScore: 70, spawnRate: 44 },
  Hard: { baseSpeed: 0.017, targetScore: 100, spawnRate: 36 },
  Expert: { baseSpeed: 0.0205, targetScore: 140, spawnRate: 30 },
};

export default function CharlieRunGame({
  stationName,
  line,
  isDelayed,
  selectedSchool,
  onCompleteRun,
}: {
  stationName: string;
  line: TransitLine;
  isDelayed: boolean;
  selectedSchool: string;
  onCompleteRun: (earnedPoints: number, capturedStation: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cfg = LINE_DIFFICULTIES[line];
  const tuning = DIFFICULTY_TUNING[cfg.difficulty];
  const multiplier = isDelayed ? 3 : 1;

  const [uiScore, setUiScore] = useState(0);
  const [uiCoins, setUiCoins] = useState(0);
  const [status, setStatus] = useState<"playing" | "crashed">("playing");
  const [unlockedCapture, setUnlockedCapture] = useState(false);
  const play = usePlay("charlie-run");
  useEffect(() => { if (status === "playing") play.start(); }, [play, status]);
  useEffect(() => { if (status === "crashed") play.end(uiScore, { coins: uiCoins, delayed: isDelayed, captured: unlockedCapture }); }, [play, status, uiScore, uiCoins, isDelayed, unlockedCapture]);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const stateRef = useRef({
    lane: 0 as -1 | 0 | 1,
    visualLane: 0,
    y: 0,
    vy: 0,
    slideTimer: 0,
    frame: 0,
    score: 0,
    coins: 0,
    chaserProximity: 1,
    obstacles: [] as Obstacle[],
    coinList: [] as Coin[],
    nextId: 1,
    isOver: false,
    thresholdReached: false,
  });

  const resetGame = () => {
    stateRef.current = {
      lane: 0,
      visualLane: 0,
      y: 0,
      vy: 0,
      slideTimer: 0,
      frame: 0,
      score: 0,
      coins: 0,
      chaserProximity: 1,
      obstacles: [],
      coinList: [],
      nextId: 1,
      isOver: false,
      thresholdReached: false,
    };
    setUiScore(0);
    setUiCoins(0);
    setStatus("playing");
    setUnlockedCapture(false);
  };

  const moveLeft = () => {
    if (stateRef.current.isOver) return;
    stateRef.current.lane = Math.max(-1, stateRef.current.lane - 1) as -1 | 0 | 1;
  };

  const moveRight = () => {
    if (stateRef.current.isOver) return;
    stateRef.current.lane = Math.min(1, stateRef.current.lane + 1) as -1 | 0 | 1;
  };

  const jump = () => {
    if (stateRef.current.isOver) return;
    if (stateRef.current.y === 0) {
      stateRef.current.vy = 13.5;
      stateRef.current.slideTimer = 0;
    }
  };

  const slide = () => {
    if (stateRef.current.isOver) return;
    if (stateRef.current.y > 0) {
      stateRef.current.vy = -14;
    }
    stateRef.current.slideTimer = 28;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)) {
        e.preventDefault();
      }
      if (stateRef.current.isOver) return;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        stateRef.current.lane = Math.max(-1, stateRef.current.lane - 1) as -1 | 0 | 1;
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        stateRef.current.lane = Math.min(1, stateRef.current.lane + 1) as -1 | 0 | 1;
      }
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " ") {
        if (stateRef.current.y === 0) {
          stateRef.current.vy = 13.5;
          stateRef.current.slideTimer = 0;
        }
      }
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        if (stateRef.current.y > 0) stateRef.current.vy = -14;
        stateRef.current.slideTimer = 28;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    let animId: number;

    const renderLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const W = canvas.width;
      const H = canvas.height;
      const s = stateRef.current;

      const horizonY = H * 0.22;
      const playerY = H * 0.74;
      const centerX = W * 0.5;

      const project = (lane: number, z: number) => {
        const scale = 0.2 + z * 0.8;
        const y = horizonY + z * (playerY - horizonY);
        const x = centerX + lane * (W * 0.27) * scale;
        return { x, y, scale };
      };

      if (!s.isOver) {
        s.frame += 1;
        s.visualLane += (s.lane - s.visualLane) * 0.24;

        if (s.y > 0 || s.vy !== 0) {
          s.y += s.vy;
          s.vy -= 0.85;
          if (s.y <= 0) {
            s.y = 0;
            s.vy = 0;
          }
        }

        if (s.slideTimer > 0) s.slideTimer -= 1;

        const currentSpeed = tuning.baseSpeed + Math.min(0.006, s.frame * 0.000002);
        s.chaserProximity = Math.max(0.45, 1 - s.frame * 0.0012);

        if (s.frame % 20 === 0) {
          s.score += 1 * multiplier;
          setUiScore(s.score);
          if (!s.thresholdReached && s.score >= tuning.targetScore) {
            s.thresholdReached = true;
            setUnlockedCapture(true);
          }
        }

        if (s.frame % tuning.spawnRate === 0) {
          const lanes: (-1 | 0 | 1)[] = [-1, 0, 1];
          const chosenLane = lanes[Math.floor(Math.random() * lanes.length)];
          const roll = Math.random();
          const peopleColors = ["#F43F5E", "#A855F7", "#EAB308", "#14B8A6", "#F97316"];

          if (roll < 0.45) {
            s.obstacles.push({
              id: s.nextId++,
              lane: chosenLane,
              z: 0.02,
              type: "train",
              speedMult: 1.45,
              shirtColor: cfg.color,
            });
          } else if (roll < 0.8) {
            s.obstacles.push({
              id: s.nextId++,
              lane: chosenLane,
              z: 0.02,
              type: "person",
              speedMult: 1.12,
              shirtColor: peopleColors[Math.floor(Math.random() * peopleColors.length)],
            });
          } else {
            s.obstacles.push({
              id: s.nextId++,
              lane: chosenLane,
              z: 0.02,
              type: "barrier",
              speedMult: 1.0,
              shirtColor: "#F59E0B",
            });
          }

          const safeLanes = lanes.filter((l) => l !== chosenLane);
          const coinLane = safeLanes[Math.floor(Math.random() * safeLanes.length)];
          for (let i = 0; i < 3; i++) {
            s.coinList.push({
              id: s.nextId++,
              lane: coinLane,
              z: 0.02 - i * 0.065,
              collected: false,
            });
          }
        }

        s.coinList.forEach((coin) => {
          coin.z += currentSpeed;
          if (
            !coin.collected &&
            coin.z >= 0.92 &&
            coin.z <= 1.06 &&
            coin.lane === s.lane
          ) {
            coin.collected = true;
            s.coins += 1;
            s.score += 5 * multiplier;
            setUiCoins(s.coins);
            setUiScore(s.score);
            if (!s.thresholdReached && s.score >= tuning.targetScore) {
              s.thresholdReached = true;
              setUnlockedCapture(true);
            }
          }
        });
        s.coinList = s.coinList.filter((c) => !c.collected && c.z < 1.2);

        for (const obs of s.obstacles) {
          obs.z += currentSpeed * obs.speedMult;

          if (obs.z >= 0.93 && obs.z <= 1.04 && obs.lane === s.lane) {
            let hit = false;
            if (obs.type === "train") {
              hit = true;
            } else if (obs.type === "person") {
              if (s.y < 36) hit = true;
            } else if (obs.type === "barrier") {
              if (s.y < 32 && s.slideTimer <= 0) hit = true;
            }

            if (hit) {
              s.isOver = true;
              s.chaserProximity = 1.25;
              setStatus("crashed");
              break;
            }
          }
        }
        s.obstacles = s.obstacles.filter((o) => o.z < 1.25);
      }

      ctx.clearRect(0, 0, W, H);

      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, "#020617");
      bgGrad.addColorStop(0.25, "#0F172A");
      bgGrad.addColorStop(1, "#1E293B");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = cfg.color;
      ctx.fillRect(0, horizonY - 8, W, 8);

      ctx.fillStyle = "#0B1120";
      ctx.beginPath();
      ctx.moveTo(centerX - W * 0.11, horizonY);
      ctx.lineTo(centerX + W * 0.11, horizonY);
      ctx.lineTo(centerX + W * 0.45, H);
      ctx.lineTo(centerX - W * 0.45, H);
      ctx.closePath();
      ctx.fill();

      const tieOffset = (s.frame * tuning.baseSpeed * 12) % 1;
      for (let i = 0; i < 14; i++) {
        const z = (i + tieOffset) / 14;
        const left = project(-1.35, z);
        const right = project(1.35, z);
        ctx.strokeStyle = `rgba(100, 116, 139, ${0.15 + z * 0.45})`;
        ctx.lineWidth = 1.5 + z * 3;
        ctx.beginPath();
        ctx.moveTo(left.x, left.y);
        ctx.lineTo(right.x, right.y);
        ctx.stroke();
      }

      [-1, 0, 1].forEach((lane) => {
        [-0.22, 0.22].forEach((railOffset) => {
          const top = project(lane + railOffset, 0);
          const bot = project(lane + railOffset, 1.35);
          ctx.strokeStyle = "#64748B";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(top.x, top.y);
          ctx.lineTo(bot.x, bot.y);
          ctx.stroke();
        });
      });

      s.coinList.forEach((coin) => {
        if (coin.z < 0) return;
        const { x, y, scale } = project(coin.lane, coin.z);
        const r = Math.max(5, 15 * scale);
        const bob = Math.sin(s.frame * 0.18 + coin.id) * 3 * scale;

        ctx.fillStyle = "#FACC15";
        ctx.beginPath();
        ctx.arc(x, y - 16 * scale + bob, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#CA8A04";
        ctx.lineWidth = 2 * scale;
        ctx.stroke();

        ctx.fillStyle = "#713F12";
        ctx.font = `900 ${Math.max(8, Math.round(15 * scale))}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("$", x, y - 15 * scale + bob);
      });

      const sortedObs = [...s.obstacles].sort((a, b) => a.z - b.z);
      sortedObs.forEach((obs) => {
        if (obs.z < 0) return;
        const { x, y, scale } = project(obs.lane, obs.z);

        if (obs.type === "train") {
          const tw = 66 * scale;
          const th = 78 * scale;
          ctx.fillStyle = obs.shirtColor;
          ctx.beginPath();
          ctx.roundRect(x - tw / 2, y - th, tw, th, 8 * scale);
          ctx.fill();

          ctx.fillStyle = "#0F172A";
          ctx.fillRect(x - tw * 0.38, y - th * 0.82, tw * 0.76, th * 0.34);

          ctx.fillStyle = "#FEF08A";
          ctx.beginPath();
          ctx.arc(x - tw * 0.26, y - th * 0.2, 5 * scale, 0, Math.PI * 2);
          ctx.arc(x + tw * 0.26, y - th * 0.2, 5 * scale, 0, Math.PI * 2);
          ctx.fill();
        } else if (obs.type === "person") {
          const pw = 24 * scale;
          const ph = 46 * scale;

          ctx.fillStyle = "#1E293B";
          ctx.fillRect(x - pw * 0.32, y - ph * 0.42, pw * 0.24, ph * 0.42);
          ctx.fillRect(x + pw * 0.08, y - ph * 0.42, pw * 0.24, ph * 0.42);

          ctx.fillStyle = obs.shirtColor;
          ctx.beginPath();
          ctx.roundRect(x - pw * 0.45, y - ph * 0.82, pw * 0.9, ph * 0.44, 5 * scale);
          ctx.fill();

          ctx.fillStyle = "#FDBA74";
          ctx.beginPath();
          ctx.arc(x, y - ph * 0.95, 8 * scale, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const bw = 58 * scale;
          const bh = 22 * scale;
          ctx.fillStyle = "#F59E0B";
          ctx.fillRect(x - bw / 2, y - bh, bw, bh);
          ctx.fillStyle = "#0F172A";
          ctx.fillRect(x - bw * 0.3, y - bh, bw * 0.15, bh);
          ctx.fillRect(x + bw * 0.15, y - bh, bw * 0.15, bh);
        }
      });

      const pProj = project(s.visualLane, 1);
      const charlieX = pProj.x;
      const charlieBaseY = pProj.y;
      const charlieY = charlieBaseY - s.y;
      const isSliding = s.slideTimer > 0;
      const stride = Math.sin(s.frame * 0.35) * 8;

      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.beginPath();
      ctx.ellipse(charlieX, charlieBaseY + 2, 18, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      const bodyH = isSliding ? 24 : 44;

      ctx.strokeStyle = "#1E3A8A";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(charlieX - 5, charlieY - bodyH * 0.35);
      ctx.lineTo(charlieX - 7, charlieY + (isSliding ? 0 : stride * 0.4));
      ctx.moveTo(charlieX + 5, charlieY - bodyH * 0.35);
      ctx.lineTo(charlieX + 7, charlieY - (isSliding ? 0 : stride * 0.4));
      ctx.stroke();

      ctx.fillStyle = "#2A6F7B";
      ctx.beginPath();
      ctx.roundRect(charlieX - 14, charlieY - bodyH, 28, bodyH * 0.68, 7);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(charlieX, charlieY - bodyH * 0.66, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0F172A";
      ctx.font = "900 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("T", charlieX, charlieY - bodyH * 0.65);

      ctx.fillStyle = "#FDBA74";
      ctx.beginPath();
      ctx.arc(charlieX, charlieY - bodyH - 8, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#451A03";
      ctx.beginPath();
      ctx.arc(charlieX, charlieY - bodyH - 11, 9, Math.PI, 0);
      ctx.fill();

      const chaserY = H - 14 + (1 - s.chaserProximity) * 34;
      const chaserW = 118;
      const chaserH = 54;

      ctx.fillStyle = "#DC2626";
      ctx.beginPath();
      ctx.roundRect(charlieX - chaserW / 2, chaserY - chaserH, chaserW, chaserH, 10);
      ctx.fill();
      ctx.strokeStyle = "#FCA5A5";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "rgba(254, 240, 138, 0.22)";
      ctx.beginPath();
      ctx.moveTo(charlieX - 34, chaserY - chaserH + 10);
      ctx.lineTo(charlieX - 58, chaserY - chaserH - 36);
      ctx.lineTo(charlieX - 10, chaserY - chaserH - 36);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(charlieX + 34, chaserY - chaserH + 10);
      ctx.lineTo(charlieX + 10, chaserY - chaserH - 36);
      ctx.lineTo(charlieX + 58, chaserY - chaserH - 36);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#FEF08A";
      ctx.beginPath();
      ctx.arc(charlieX - 34, chaserY - chaserH + 14, 6, 0, Math.PI * 2);
      ctx.arc(charlieX + 34, chaserY - chaserH + 14, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "800 9px sans-serif";
      ctx.fillText("CHASING TRAIN", charlieX, chaserY - 12);

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [cfg.color, multiplier, tuning.baseSpeed, tuning.spawnRate, tuning.targetScore]);

  return (
    <div className="flex flex-col items-center">
      <div className="w-full flex items-center justify-between bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl mb-2 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-amber-400">
            💰 Coins: {uiCoins} (+{uiCoins * 5 * multiplier} pts)
          </span>
          <span className="font-extrabold text-white">
            Score: {uiScore} / {tuning.targetScore}
          </span>
        </div>
        {unlockedCapture ? (
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold animate-pulse">
            ✅ Ready to Capture!
          </span>
        ) : (
          <span className="text-slate-400">
            Outrun train & collect <b>$</b>!
          </span>
        )}
      </div>

      <div
        className="relative w-full rounded-xl overflow-hidden border border-slate-700 shadow-inner select-none"
        onTouchStart={(e) => {
          const t = e.touches[0];
          touchStartRef.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          if (!touchStartRef.current) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - touchStartRef.current.x;
          const dy = t.clientY - touchStartRef.current.y;
          if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 20) moveRight();
            else if (dx < -20) moveLeft();
          } else {
            if (dy < -20) jump();
            else if (dy > 20) slide();
          }
          touchStartRef.current = null;
        }}
      >
        <canvas
          ref={canvasRef}
          width={440}
          height={290}
          className="w-full h-[260px] sm:h-[290px] block bg-slate-950"
        />

        {status === "crashed" && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
            <p className="text-lg font-black text-red-400 mb-1">
              🚨 The T Train Caught Charlie!
            </p>
            <p className="text-xs text-slate-200 mb-4">
              You collected <b>{uiCoins} Charlie Coins ($)</b> and scored{" "}
              <b className="text-amber-400">{uiScore} pts</b>!
            </p>
            <div className="flex gap-2">
              <button
                onClick={resetGame}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-extrabold border border-slate-600 cursor-pointer"
              >
                🔄 Run Again
              </button>
              {uiScore > 0 && (
                <button
                  onClick={() => onCompleteRun(uiScore, unlockedCapture)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold cursor-pointer"
                >
                  {unlockedCapture
                    ? `🏆 Capture ${stationName} (+${uiScore} pts)`
                    : `💰 Bank +${uiScore} pts for ${selectedSchool}`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 w-full mt-2.5">
        <button
          onClick={moveLeft}
          className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 font-extrabold text-xs text-white border border-slate-700 cursor-pointer"
        >
          ⬅️ Left
        </button>
        <button
          onClick={jump}
          className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 font-extrabold text-xs text-sky-300 border border-slate-700 cursor-pointer"
        >
          ⬆️ Jump
        </button>
        <button
          onClick={slide}
          className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 font-extrabold text-xs text-amber-300 border border-slate-700 cursor-pointer"
        >
          ⬇️ Slide
        </button>
        <button
          onClick={moveRight}
          className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 font-extrabold text-xs text-white border border-slate-700 cursor-pointer"
        >
          ➡️ Right
        </button>
      </div>

      {unlockedCapture && status === "playing" && (
        <button
          onClick={() => { play.end(uiScore, { coins: uiCoins, delayed: isDelayed, captured: true }); onCompleteRun(uiScore, true); }}
          className="mt-2.5 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer transition"
        >
          🏆 Target Hit! Capture {stationName} Now (+{uiScore} pts)
        </button>
      )}
    </div>
  );
}
