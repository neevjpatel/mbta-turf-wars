"use client";

import { useEffect, useRef, useState } from "react";
import type { DifficultyLevel, TransitLine } from "@/app/_data/transit/types";
import { usePlay } from "@/app/_stats/player";

export type TransitLine = "Green" | "Orange" | "Blue" | "Red";
export type DifficultyLevel = "Easy" | "Medium" | "Hard" | "Expert";

interface LineMeta {
  color: string;
  darkColor: string;
  difficulty: DifficultyLevel;
  destination: string;
  baseSpeed: number;
  targetScore: number;
  spawnInterval: number;
}

const LINE_CONFIG: Record<TransitLine, LineMeta> = {
  Green: {
    color: "#00843D",
    darkColor: "#004D23",
    difficulty: "Easy",
    destination: "BOSTON COLLEGE",
    baseSpeed: 0.72,
    targetScore: 50,
    spawnInterval: 46,
  },
  Orange: {
    color: "#ED8B00",
    darkColor: "#8A4F00",
    difficulty: "Medium",
    destination: "FOREST HILLS",
    baseSpeed: 0.9,
    targetScore: 80,
    spawnInterval: 39,
  },
  Blue: {
    color: "#003DA5",
    darkColor: "#00215C",
    difficulty: "Hard",
    destination: "WONDERLAND",
    baseSpeed: 1.08,
    targetScore: 110,
    spawnInterval: 33,
  },
  Red: {
    color: "#DA291C",
    darkColor: "#7A140D",
    difficulty: "Expert",
    destination: "ALEWIFE",
    baseSpeed: 1.26,
    targetScore: 150,
    spawnInterval: 28,
  },
};

interface Obstacle3D {
  id: number;
  lane: -1 | 0 | 1;
  z: number;
  length: number;
  type: "train" | "commuter" | "barrier";
  speedMult: number;
  accentColor: string;
}

interface Token3D {
  id: number;
  lane: -1 | 0 | 1;
  z: number;
  y: number;
  collected: boolean;
}

interface Particle3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  color: string;
}

export default function CharlieRunGame({
  stationName = "Park Street",
  line,
  isDelayed = false,
  selectedSchool = "BU",
  onCompleteRun,
}: {
  stationName?: string;
  line?: TransitLine;
  isDelayed?: boolean;
  selectedSchool?: string;
  onCompleteRun?: (earnedPoints: number, capturedStation: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedLine, setSelectedLine] = useState<TransitLine>(line ?? "Red");
  const activeLine = line ?? selectedLine;
  const cfg = LINE_CONFIG[activeLine];
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
    distance: 0,
    score: 0,
    coins: 0,
    shake: 0,
    cameraRoll: 0,
    chaserGlow: 0.35,
    obstacles: [] as Obstacle3D[],
    tokens: [] as Token3D[],
    particles: [] as Particle3D[],
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
      distance: 0,
      score: 0,
      coins: 0,
      shake: 0,
      cameraRoll: 0,
      chaserGlow: 0.35,
      obstacles: [],
      tokens: [],
      particles: [],
      nextId: 1,
      isOver: false,
      thresholdReached: false,
    };
    setUiScore(0);
    setUiCoins(0);
    setStatus("playing");
    setUnlockedCapture(false);
  };

  useEffect(() => {
    resetGame();
  }, [activeLine]);

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
    if (stateRef.current.y <= 0.01) {
      stateRef.current.vy = 0.56;
      stateRef.current.slideTimer = 0;
    }
  };

  const slide = () => {
    if (stateRef.current.isOver) return;
    if (stateRef.current.y > 0) {
      stateRef.current.vy = -0.65;
    }
    stateRef.current.slideTimer = 28;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)) {
        e.preventDefault();
      }
      if (stateRef.current.isOver) {
        if (e.key === "Enter" || e.key === " ") resetGame();
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") moveLeft();
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") moveRight();
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " ") jump();
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") slide();
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

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = 640;
      const H = 390;
      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width = W * dpr;
        canvas.height = H * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const s = stateRef.current;

      // 3D Camera parameters
      const FOV = 340;
      const CAM_HEIGHT = 4.6;
      const CAM_DIST = 6.5;
      const PLAYER_Z = 7.5;
      const Z_FAR = 115;
      const LANE_WIDTH = 3.1;
      const horizonY = H * 0.34;
      const centerX = W * 0.5;

      const project3D = (wx: number, wy: number, wz: number) => {
        const depth = Math.max(0.5, wz + CAM_DIST);
        const scale = FOV / depth;
        const x = centerX + (wx - s.visualLane * 0.55) * scale;
        const y = horizonY + (CAM_HEIGHT - wy) * scale;
        return { x, y, scale };
      };

      const spawnBurst = (wx: number, wy: number, wz: number, color: string, count: number) => {
        for (let i = 0; i < count; i++) {
          s.particles.push({
            x: wx,
            y: wy,
            z: wz,
            vx: (Math.random() - 0.5) * 0.35,
            vy: Math.random() * 0.32 + 0.08,
            vz: (Math.random() - 0.5) * 0.35,
            life: 1,
            color,
          });
        }
      };

      // Physics & Spawning
      if (!s.isOver) {
        s.frame += 1;
        const laneDelta = s.lane - s.visualLane;
        s.visualLane += laneDelta * 0.22;
        s.cameraRoll += (-laneDelta * 0.035 - s.cameraRoll) * 0.18;

        if (s.y > 0 || s.vy !== 0) {
          s.y += s.vy;
          s.vy -= 0.036;
          if (s.y <= 0) {
            s.y = 0;
            s.vy = 0;
          }
        }

        if (s.slideTimer > 0) {
          s.slideTimer -= 1;
          if (s.frame % 3 === 0) {
            spawnBurst(s.visualLane * LANE_WIDTH, 0.2, PLAYER_Z, "#94A3B8", 1);
          }
        }

        const worldSpeed = cfg.baseSpeed + Math.min(0.45, s.frame * 0.00014);
        s.distance += worldSpeed;
        s.chaserGlow = 0.28 + Math.sin(s.frame * 0.08) * 0.1;

        if (s.frame % 16 === 0) {
          s.score += 1 * multiplier;
          setUiScore(s.score);
          if (!s.thresholdReached && s.score >= cfg.targetScore) {
            s.thresholdReached = true;
            setUnlockedCapture(true);
          }
        }

        if (s.frame % cfg.spawnInterval === 0) {
          const lanes: (-1 | 0 | 1)[] = [-1, 0, 1];
          const chosenLane = lanes[Math.floor(Math.random() * lanes.length)];
          const roll = Math.random();
          const jacketColors = ["#E11D48", "#7C3AED", "#D97706", "#0D9488", "#2563EB"];

          if (roll < 0.46) {
            s.obstacles.push({
              id: s.nextId++,
              lane: chosenLane,
              z: Z_FAR,
              length: 15,
              type: "train",
              speedMult: 1.38,
              accentColor: cfg.color,
            });
          } else if (roll < 0.76) {
            s.obstacles.push({
              id: s.nextId++,
              lane: chosenLane,
              z: Z_FAR,
              length: 1.6,
              type: "commuter",
              speedMult: 1.08,
              accentColor: jacketColors[Math.floor(Math.random() * jacketColors.length)],
            });
          } else {
            s.obstacles.push({
              id: s.nextId++,
              lane: chosenLane,
              z: Z_FAR,
              length: 1.4,
              type: "barrier",
              speedMult: 1.0,
              accentColor: "#F59E0B",
            });
          }

          const openLanes = lanes.filter((l) => l !== chosenLane);
          const tokenLane = openLanes[Math.floor(Math.random() * openLanes.length)];
          for (let i = 0; i < 4; i++) {
            s.tokens.push({
              id: s.nextId++,
              lane: tokenLane,
              z: Z_FAR + i * 4.2,
              y: 1.25,
              collected: false,
            });
          }
        }

        // Move & collect 3D tokens
        s.tokens.forEach((tok) => {
          tok.z -= worldSpeed;
          if (
            !tok.collected &&
            Math.abs(tok.z - PLAYER_Z) < 1.9 &&
            tok.lane === s.lane &&
            s.y < 2.6
          ) {
            tok.collected = true;
            s.coins += 1;
            s.score += 5 * multiplier;
            setUiCoins(s.coins);
            setUiScore(s.score);
            spawnBurst(tok.lane * LANE_WIDTH, tok.y, tok.z, "#FACC15", 8);
            if (!s.thresholdReached && s.score >= cfg.targetScore) {
              s.thresholdReached = true;
              setUnlockedCapture(true);
            }
          }
        });
        s.tokens = s.tokens.filter((t) => !t.collected && t.z > -4);

        // Move obstacles & check 3D bounding-box collisions
        for (const obs of s.obstacles) {
          obs.z -= worldSpeed * obs.speedMult;
          const frontZ = obs.z;
          const backZ = obs.z + obs.length;

          if (frontZ <= PLAYER_Z + 0.9 && backZ >= PLAYER_Z - 0.7 && obs.lane === s.lane) {
            let crashed = false;
            if (obs.type === "train") {
              crashed = true;
            } else if (obs.type === "commuter") {
              if (s.y < 1.85) crashed = true;
            } else if (obs.type === "barrier") {
              if (s.y < 1.65 && s.slideTimer <= 0) crashed = true;
            }

            if (crashed) {
              s.isOver = true;
              s.shake = 14;
              spawnBurst(s.visualLane * LANE_WIDTH, 1.5, PLAYER_Z, "#EF4444", 22);
              setStatus("crashed");
              break;
            }
          }
        }
        s.obstacles = s.obstacles.filter((o) => o.z + o.length > -5);
      }

      if (s.shake > 0) s.shake *= 0.85;

      // Update particles
      s.particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.vy -= 0.015;
        p.life -= 0.045;
      });
      s.particles = s.particles.filter((p) => p.life > 0);

      // ================= RENDER 3D SCENE =================
      ctx.save();
      const shakeX = s.shake > 0.2 ? (Math.random() - 0.5) * s.shake : 0;
      const shakeY = s.shake > 0.2 ? (Math.random() - 0.5) * s.shake : 0;
      ctx.translate(centerX + shakeX, horizonY + shakeY);
      ctx.rotate(s.cameraRoll);
      ctx.translate(-centerX, -horizonY);

      // Deep subway background
      ctx.fillStyle = "#050811";
      ctx.fillRect(-40, -40, W + 80, H + 80);

      // 3D Tunnel Vaulted Walls, Ceiling Lights & Track Bed
      const tunnelHalfW = 7.4;
      const tunnelH = 8.8;
      const segStep = 9;
      const segOffset = s.distance % segStep;

      for (let z = Z_FAR; z >= 0; z -= segStep) {
        const z1 = Math.max(0.1, z - segOffset);
        const z2 = z1 + segStep;
        const fog = Math.min(1, z1 / Z_FAR);

        const bl1 = project3D(-tunnelHalfW, 0, z1);
        const br1 = project3D(tunnelHalfW, 0, z1);
        const tl1 = project3D(-tunnelHalfW, tunnelH, z1);
        const tr1 = project3D(tunnelHalfW, tunnelH, z1);

        const bl2 = project3D(-tunnelHalfW, 0, z2);
        const br2 = project3D(tunnelHalfW, 0, z2);
        const tl2 = project3D(-tunnelHalfW, tunnelH, z2);
        const tr2 = project3D(tunnelHalfW, tunnelH, z2);

        // Gravel track bed
        const bedShade = Math.round(28 * (1 - fog * 0.75));
        ctx.fillStyle = `rgb(${bedShade}, ${bedShade + 4}, ${bedShade + 12})`;
        ctx.beginPath();
        ctx.moveTo(bl1.x, bl1.y);
        ctx.lineTo(br1.x, br1.y);
        ctx.lineTo(br2.x, br2.y);
        ctx.lineTo(bl2.x, bl2.y);
        ctx.closePath();
        ctx.fill();

        // Left & Right concrete tunnel walls
        const wallShade = Math.round(36 * (1 - fog * 0.8));
        ctx.fillStyle = `rgb(${wallShade}, ${wallShade + 6}, ${wallShade + 16})`;
        ctx.beginPath();
        ctx.moveTo(bl1.x, bl1.y);
        ctx.lineTo(tl1.x, tl1.y);
        ctx.lineTo(tl2.x, tl2.y);
        ctx.lineTo(bl2.x, bl2.y);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(br1.x, br1.y);
        ctx.lineTo(tr1.x, tr1.y);
        ctx.lineTo(tr2.x, tr2.y);
        ctx.lineTo(br2.x, br2.y);
        ctx.closePath();
        ctx.fill();

        // MBTA Colored Wall Tile Stripe
        const stripeLow1 = project3D(-tunnelHalfW + 0.05, 2.3, z1);
        const stripeHigh1 = project3D(-tunnelHalfW + 0.05, 3.1, z1);
        const stripeLow2 = project3D(-tunnelHalfW + 0.05, 2.3, z2);
        const stripeHigh2 = project3D(-tunnelHalfW + 0.05, 3.1, z2);

        ctx.globalAlpha = Math.max(0.15, 1 - fog * 0.88);
        ctx.fillStyle = cfg.color;
        ctx.beginPath();
        ctx.moveTo(stripeLow1.x, stripeLow1.y);
        ctx.lineTo(stripeHigh1.x, stripeHigh1.y);
        ctx.lineTo(stripeHigh2.x, stripeHigh2.y);
        ctx.lineTo(stripeLow2.x, stripeLow2.y);
        ctx.closePath();
        ctx.fill();

        const rStripeLow1 = project3D(tunnelHalfW - 0.05, 2.3, z1);
        const rStripeHigh1 = project3D(tunnelHalfW - 0.05, 3.1, z1);
        const rStripeLow2 = project3D(tunnelHalfW - 0.05, 2.3, z2);
        const rStripeHigh2 = project3D(tunnelHalfW - 0.05, 3.1, z2);

        ctx.beginPath();
        ctx.moveTo(rStripeLow1.x, rStripeLow1.y);
        ctx.lineTo(rStripeHigh1.x, rStripeHigh1.y);
        ctx.lineTo(rStripeHigh2.x, rStripeHigh2.y);
        ctx.lineTo(rStripeLow2.x, rStripeLow2.y);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        // Concrete tunnel arch rib
        ctx.strokeStyle = `rgba(15, 23, 42, ${0.95 - fog * 0.6})`;
        ctx.lineWidth = Math.max(1.5, 5 * (1 - fog));
        ctx.beginPath();
        ctx.moveTo(bl1.x, bl1.y);
        ctx.lineTo(tl1.x, tl1.y);
        ctx.quadraticCurveTo(centerX, tl1.y - 26 * (1 - fog), tr1.x, tr1.y);
        ctx.lineTo(br1.x, br1.y);
        ctx.stroke();

        // Overhead fluorescent tunnel light strip
        const lightL = project3D(-1.3, tunnelH - 0.1, z1 + 1.5);
        const lightR = project3D(1.3, tunnelH - 0.1, z1 + 1.5);
        ctx.strokeStyle = `rgba(224, 242, 254, ${Math.max(0.08, 0.75 * (1 - fog))})`;
        ctx.lineWidth = Math.max(1, 3.5 * (1 - fog));
        ctx.beginPath();
        ctx.moveTo(lightL.x, lightL.y);
        ctx.lineTo(lightR.x, lightR.y);
        ctx.stroke();
      }

      // Wooden Railroad Ties (Sleepers)
      const tieSpacing = 2.6;
      const tieOffset = s.distance % tieSpacing;
      for (let z = Z_FAR; z >= 0.5; z -= tieSpacing) {
        const tz = z - tieOffset;
        if (tz <= 0.3) continue;
        const fog = Math.min(1, tz / Z_FAR);
        const left = project3D(-5.2, 0.02, tz);
        const right = project3D(5.2, 0.02, tz);
        ctx.strokeStyle = `rgba(71, 56, 44, ${Math.max(0.08, 0.85 * (1 - fog))})`;
        ctx.lineWidth = Math.max(1, 4.5 * (1 - fog));
        ctx.beginPath();
        ctx.moveTo(left.x, left.y);
        ctx.lineTo(right.x, right.y);
        ctx.stroke();
      }

      // 3D Steel Tracks (3 lanes x 2 rails)
      [-1, 0, 1].forEach((laneIdx) => {
        const laneCenter = laneIdx * LANE_WIDTH;
        [-0.78, 0.78].forEach((railOffset) => {
          const rx = laneCenter + railOffset;
          const nearBase = project3D(rx, 0, 0.2);
          const farBase = project3D(rx, 0, Z_FAR);
          const nearTop = project3D(rx, 0.18, 0.2);
          const farTop = project3D(rx, 0.18, Z_FAR);

          // Dark rail web
          ctx.strokeStyle = "#334155";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(nearBase.x, nearBase.y);
          ctx.lineTo(farBase.x, farBase.y);
          ctx.stroke();

          // Metallic top rail gleam
          ctx.strokeStyle = "#CBD5E1";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(nearTop.x, nearTop.y);
          ctx.lineTo(farTop.x, farTop.y);
          ctx.stroke();
        });
      });

      // Helper to render a true 3D extruded MBTA Train
      const drawTrain3D = (obs: Obstacle3D) => {
        const wx = obs.lane * LANE_WIDTH;
        const halfW = 1.28;
        const height = 3.25;
        const zFront = Math.max(0.2, obs.z);
        const zBack = Math.min(Z_FAR, obs.z + obs.length);
        if (zBack <= zFront) return;

        const fog = Math.min(0.85, zFront / Z_FAR);

        const fbl = project3D(wx - halfW, 0.15, zFront);
        const fbr = project3D(wx + halfW, 0.15, zFront);
        const ftl = project3D(wx - halfW, height, zFront);
        const ftr = project3D(wx + halfW, height, zFront);

        const bbl = project3D(wx - halfW, 0.15, zBack);
        const bbr = project3D(wx + halfW, 0.15, zBack);
        const btl = project3D(wx - halfW, height, zBack);
        const btr = project3D(wx + halfW, height, zBack);

        // Headlight glow cones on the tracks
        if (fog < 0.7) {
          const beamNearL = project3D(wx - 1.5, 0.1, Math.max(0.2, zFront - 7));
          const beamNearR = project3D(wx + 1.5, 0.1, Math.max(0.2, zFront - 7));
          const grad = ctx.createLinearGradient(0, fbl.y, 0, beamNearL.y);
          grad.addColorStop(0, `rgba(254, 249, 195, ${0.32 * (1 - fog)})`);
          grad.addColorStop(1, "rgba(254, 249, 195, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(fbl.x, fbl.y);
          ctx.lineTo(fbr.x, fbr.y);
          ctx.lineTo(beamNearR.x, beamNearR.y);
          ctx.lineTo(beamNearL.x, beamNearL.y);
          ctx.closePath();
          ctx.fill();
        }

        // Visible inner side wall (perspective depth!)
        if (obs.lane <= 0) {
          // Right side visible
          ctx.fillStyle = "#475569";
          ctx.beginPath();
          ctx.moveTo(fbr.x, fbr.y);
          ctx.lineTo(ftr.x, ftr.y);
          ctx.lineTo(btr.x, btr.y);
          ctx.lineTo(bbr.x, bbr.y);
          ctx.closePath();
          ctx.fill();

          // Colored side livery stripe
          const s1 = project3D(wx + halfW, 1.15, zFront);
          const s2 = project3D(wx + halfW, 1.75, zFront);
          const s3 = project3D(wx + halfW, 1.75, zBack);
          const s4 = project3D(wx + halfW, 1.15, zBack);
          ctx.fillStyle = obs.accentColor;
          ctx.beginPath();
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
          ctx.lineTo(s3.x, s3.y);
          ctx.lineTo(s4.x, s4.y);
          ctx.closePath();
          ctx.fill();
        }
        if (obs.lane >= 0) {
          // Left side visible
          ctx.fillStyle = "#475569";
          ctx.beginPath();
          ctx.moveTo(fbl.x, fbl.y);
          ctx.lineTo(ftl.x, ftl.y);
          ctx.lineTo(btl.x, btl.y);
          ctx.lineTo(bbl.x, bbl.y);
          ctx.closePath();
          ctx.fill();

          const s1 = project3D(wx - halfW, 1.15, zFront);
          const s2 = project3D(wx - halfW, 1.75, zFront);
          const s3 = project3D(wx - halfW, 1.75, zBack);
          const s4 = project3D(wx - halfW, 1.15, zBack);
          ctx.fillStyle = obs.accentColor;
          ctx.beginPath();
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
          ctx.lineTo(s3.x, s3.y);
          ctx.lineTo(s4.x, s4.y);
          ctx.closePath();
          ctx.fill();
        }

        // Train 3D Roof
        ctx.fillStyle = "#94A3B8";
        ctx.beginPath();
        ctx.moveTo(ftl.x, ftl.y);
        ctx.lineTo(ftr.x, ftr.y);
        ctx.lineTo(btr.x, btr.y);
        ctx.lineTo(btl.x, btl.y);
        ctx.closePath();
        ctx.fill();

        // Train Front Nose Face
        const fw = fbr.x - fbl.x;
        const fh = fbl.y - ftl.y;
        ctx.fillStyle = "#E2E8F0";
        ctx.beginPath();
        ctx.roundRect(ftl.x, ftl.y, fw, fh, Math.max(3, fw * 0.08));
        ctx.fill();

        // Colored MBTA Front Band
        ctx.fillStyle = obs.accentColor;
        ctx.fillRect(ftl.x, ftl.y + fh * 0.48, fw, fh * 0.22);

        // LED Destination Header Board
        ctx.fillStyle = "#090D16";
        ctx.fillRect(ftl.x + fw * 0.14, ftl.y + fh * 0.07, fw * 0.72, fh * 0.11);
        if (fw > 46) {
          ctx.fillStyle = "#FBBF24";
          ctx.font = `900 ${Math.max(6, Math.round(fw * 0.075))}px monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(cfg.destination, ftl.x + fw * 0.5, ftl.y + fh * 0.125);
        }

        // Dual Tinted Front Windshields
        ctx.fillStyle = "#0F172A";
        ctx.fillRect(ftl.x + fw * 0.12, ftl.y + fh * 0.22, fw * 0.34, fh * 0.22);
        ctx.fillRect(ftl.x + fw * 0.54, ftl.y + fh * 0.22, fw * 0.34, fh * 0.22);

        // Glowing Headlights
        ctx.fillStyle = "#FEF9C3";
        const hlR = Math.max(2, fw * 0.055);
        ctx.beginPath();
        ctx.arc(ftl.x + fw * 0.22, ftl.y + fh * 0.82, hlR, 0, Math.PI * 2);
        ctx.arc(ftl.x + fw * 0.78, ftl.y + fh * 0.82, hlR, 0, Math.PI * 2);
        ctx.fill();

        // Atmospheric distance fog tint
        if (fog > 0.05) {
          ctx.fillStyle = `rgba(5, 8, 17, ${fog * 0.82})`;
          ctx.fillRect(ftl.x - 2, ftl.y - 2, fw + 4, fh + 4);
        }
      };

      // Draw 3D Spinning Gold Charlie Tokens
      s.tokens.forEach((tok) => {
        if (tok.z < 0.5 || tok.z > Z_FAR) return;
        const wx = tok.lane * LANE_WIDTH;
        const bob = Math.sin(s.frame * 0.14 + tok.id) * 0.22;
        const ground = project3D(wx, 0.05, tok.z);
        const pos = project3D(wx, tok.y + bob, tok.z);
        const r = Math.max(4, pos.scale * 0.55);
        const spin = Math.cos(s.frame * 0.12 + tok.id);
        const rx = Math.max(r * 0.22, Math.abs(spin) * r);

        // Ground shadow
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.beginPath();
        ctx.ellipse(ground.x, ground.y, r * 0.9, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3D Coin Rim Thickness
        ctx.fillStyle = "#B45309";
        ctx.beginPath();
        ctx.ellipse(pos.x + (spin >= 0 ? 2 : -2), pos.y, rx, r, 0, 0, Math.PI * 2);
        ctx.fill();

        // Coin Face
        ctx.fillStyle = "#FACC15";
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y, rx, r, 0, 0, Math.PI * 2);
        ctx.fill();

        if (rx > 5) {
          ctx.fillStyle = "#78350F";
          ctx.font = `900 ${Math.round(r * 1.1)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("T", pos.x, pos.y + 0.5);
        }
      });

      // Sort & render 3D Obstacles back-to-front
      const sortedObs = [...s.obstacles].sort((a, b) => b.z - a.z);
      sortedObs.forEach((obs) => {
        if (obs.z > Z_FAR) return;
        if (obs.type === "train") {
          drawTrain3D(obs);
          return;
        }

        const wx = obs.lane * LANE_WIDTH;
        const base = project3D(wx, 0.1, obs.z);

        if (obs.type === "commuter") {
          const top = project3D(wx, 2.35, obs.z);
          const h = base.y - top.y;
          const w = h * 0.46;
          const stride = Math.sin(s.frame * 0.25 + obs.id) * w * 0.18;

          // Ground shadow
          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.beginPath();
          ctx.ellipse(base.x, base.y, w * 0.65, w * 0.25, 0, 0, Math.PI * 2);
          ctx.fill();

          // Legs
          ctx.fillStyle = "#1E293B";
          ctx.fillRect(base.x - w * 0.32, base.y - h * 0.44 + stride * 0.3, w * 0.24, h * 0.44);
          ctx.fillRect(base.x + w * 0.08, base.y - h * 0.44 - stride * 0.3, w * 0.24, h * 0.44);

          // 3D Shaded Jacket + Backpack
          ctx.fillStyle = "#0F172A";
          ctx.beginPath();
          ctx.roundRect(base.x - w * 0.48, base.y - h * 0.84, w * 0.96, h * 0.44, 4);
          ctx.fill();

          ctx.fillStyle = obs.accentColor;
          ctx.beginPath();
          ctx.roundRect(base.x - w * 0.42, base.y - h * 0.82, w * 0.84, h * 0.42, 4);
          ctx.fill();

          // Head
          ctx.fillStyle = "#FDBA74";
          ctx.beginPath();
          ctx.arc(base.x, base.y - h * 0.94, w * 0.26, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // 3D High-Clearance MBTA Construction Gate (Jump Over or Slide Under!)
          const postL = project3D(wx - 1.15, 0.1, obs.z);
          const postR = project3D(wx + 1.15, 0.1, obs.z);
          const barLowL = project3D(wx - 1.2, 1.25, obs.z);
          const barHighL = project3D(wx - 1.2, 2.05, obs.z);
          const barHighR = project3D(wx + 1.2, 2.05, obs.z);
          const bw = barHighR.x - barHighL.x;
          const bh = barLowL.y - barHighL.y;

          // Side legs
          ctx.strokeStyle = "#94A3B8";
          ctx.lineWidth = Math.max(2, bw * 0.05);
          ctx.beginPath();
          ctx.moveTo(postL.x, postL.y);
          ctx.lineTo(barHighL.x, barHighL.y);
          ctx.moveTo(postR.x, postR.y);
          ctx.lineTo(barHighR.x, barHighR.y);
          ctx.stroke();

          // Hazard Beam
          ctx.fillStyle = "#F59E0B";
          ctx.beginPath();
          ctx.roundRect(barHighL.x, barHighL.y, bw, bh, 3);
          ctx.fill();

          ctx.fillStyle = "#0F172A";
          for (let k = 0; k < 4; k++) {
            ctx.fillRect(barHighL.x + bw * (0.1 + k * 0.22), barHighL.y, bw * 0.1, bh);
          }
        }
      });

      // ================= RENDER 3D-SHADED CHARLIE =================
      const charlieWX = s.visualLane * LANE_WIDTH;
      const groundProj = project3D(charlieWX, 0.12, PLAYER_Z);
      const bodyProj = project3D(charlieWX, 0.12 + s.y, PLAYER_Z);
      const isSliding = s.slideTimer > 0;
      const runCycle = Math.sin(s.frame * 0.36);

      // Dynamic Ground Shadow (shrinks as Charlie jumps higher)
      const shadowScale = Math.max(0.42, 1 - s.y * 0.16);
      ctx.fillStyle = `rgba(0, 0, 0, ${0.6 * shadowScale})`;
      ctx.beginPath();
      ctx.ellipse(
        groundProj.x,
        groundProj.y,
        24 * shadowScale,
        8 * shadowScale,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      const cx = bodyProj.x;
      const cy = bodyProj.y;
      const charH = isSliding ? 34 : 66;

      // Running Legs with Sneakers
      ctx.strokeStyle = "#1E3A8A";
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy - charH * 0.36);
      ctx.lineTo(cx - 9, cy - 3 + (isSliding ? 0 : runCycle * 8));
      ctx.moveTo(cx + 7, cy - charH * 0.36);
      ctx.lineTo(cx + 9, cy - 3 - (isSliding ? 0 : runCycle * 8));
      ctx.stroke();

      // White Sneaker Soles
      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(cx - 14, cy - 5 + (isSliding ? 0 : runCycle * 8), 10, 4);
      ctx.fillRect(cx + 4, cy - 5 - (isSliding ? 0 : runCycle * 8), 10, 4);

      // Backpack (3D depth behind torso)
      ctx.fillStyle = "#1E293B";
      ctx.beginPath();
      ctx.roundRect(cx - 19, cy - charH * 0.94, 38, charH * 0.56, 9);
      ctx.fill();

      // Boston Varsity Jacket Torso
      ctx.fillStyle = "#2A6F7B";
      ctx.beginPath();
      ctx.roundRect(cx - 16, cy - charH * 0.96, 32, charH * 0.62, 8);
      ctx.fill();

      // Cream Varsity Sleeves
      ctx.strokeStyle = "#FEF3C7";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(cx - 17, cy - charH * 0.86);
      ctx.lineTo(cx - 21, cy - charH * 0.52 - runCycle * 6);
      ctx.moveTo(cx + 17, cy - charH * 0.86);
      ctx.lineTo(cx + 21, cy - charH * 0.52 + runCycle * 6);
      ctx.stroke();

      // MBTA "T" Crest on Back
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(cx, cy - charH * 0.66, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0F172A";
      ctx.font = "900 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("T", cx, cy - charH * 0.65);

      // Head & Hair
      ctx.fillStyle = "#FDBA74";
      ctx.beginPath();
      ctx.arc(cx, cy - charH - 10, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3B1D0E";
      ctx.beginPath();
      ctx.arc(cx, cy - charH - 13, 11.5, Math.PI * 0.92, Math.PI * 2.08);
      ctx.fill();

      // 3D Sparkle & Dust Particles
      s.particles.forEach((p) => {
        const pp = project3D(p.x, p.y, p.z);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, Math.max(2, pp.scale * 0.14), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Pursuing Train Headlight Rim Glow at Bottom Edge
      const rimGrad = ctx.createLinearGradient(0, H - 36, 0, H);
      rimGrad.addColorStop(0, "rgba(239, 68, 68, 0)");
      rimGrad.addColorStop(1, `rgba(239, 68, 68, ${s.chaserGlow})`);
      ctx.fillStyle = rimGrad;
      ctx.fillRect(0, H - 36, W, 36);

      ctx.restore();

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [activeLine, cfg.baseSpeed, cfg.color, cfg.destination, cfg.spawnInterval, cfg.targetScore, multiplier]);

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      {/* Line Selector (shown when played standalone) + Live HUD */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 bg-slate-950/90 border border-slate-800 px-3.5 py-2.5 rounded-xl mb-2.5 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-amber-400">
            🪙 Tokens: {uiCoins} (+{uiCoins * 5 * multiplier} pts)
          </span>
          <span className="font-extrabold text-white">
            Score: {uiScore} / {cfg.targetScore}
          </span>
        </div>

        {!line && (
          <div className="flex items-center gap-1">
            {(["Green", "Orange", "Blue", "Red"] as TransitLine[]).map((l) => (
              <button
                key={l}
                onClick={() => setSelectedLine(l)}
                className={`px-2 py-0.5 rounded font-extrabold text-[11px] text-white cursor-pointer transition ${
                  activeLine === l ? "ring-2 ring-white scale-105" : "opacity-65 hover:opacity-100"
                }`}
                style={{ backgroundColor: LINE_CONFIG[l].color }}
              >
                {l}
              </button>
            ))}
          </div>
        )}

        {unlockedCapture ? (
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold animate-pulse">
            ✅ Target Reached!
          </span>
        ) : (
          <span className="text-slate-400 hidden sm:inline">
            Arrow keys / WASD / Swipe
          </span>
        )}
      </div>

      {/* 3D Viewport Canvas */}
      <div
        className="relative w-full rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl select-none bg-[#050811]"
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
          className="w-full aspect-[16/10] block"
        />

        {status === "crashed" && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
            <p className="text-xl font-black text-red-400 mb-1">
              🚨 T Train Collision!
            </p>
            <p className="text-xs text-slate-200 mb-4">
              You grabbed <b>{uiCoins} Charlie Tokens</b> and scored{" "}
              <b className="text-amber-400">{uiScore} pts</b> on the {activeLine} Line!
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={resetGame}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-extrabold border border-slate-600 cursor-pointer"
              >
                🔄 Run Again
              </button>
              {onCompleteRun && uiScore > 0 && (
                <button
                  onClick={() => onCompleteRun(uiScore, unlockedCapture)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold cursor-pointer"
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

      {/* Touch & Desktop Controls */}
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

      {onCompleteRun && unlockedCapture && status === "playing" && (
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
