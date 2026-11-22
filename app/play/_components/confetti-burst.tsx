"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";

export default function ConfettiBurst() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionPreference.matches) return;

    const colors = ["#34d399", "#fbbf24", "#fb7185", "#60a5fa", "#e879f9", "#ffffff"];
    let width = 0;
    let height = 0;
    let frame = 0;
    let previousTime = 0;

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    resizeCanvas();

    const particles = Array.from({ length: 120 }, (_, index) => {
      const fromLeft = index % 2 === 0;
      const cannonX = width * (fromLeft ? 0.08 : 0.92);
      const spread = 4 + Math.random() * 7;
      const angle = (Math.random() * 0.8 + 0.25) * (fromLeft ? -1 : 1);
      const speed = 7 + Math.random() * 9;
      return {
        x: cannonX,
        y: height * (0.7 + Math.random() * 0.1),
        vx: (fromLeft ? 1 : -1) * Math.cos(Math.abs(angle)) * speed,
        vy: -Math.sin(Math.abs(angle)) * speed - spread,
        gravity: 0.22 + Math.random() * 0.12,
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.3,
        width: 4 + Math.random() * 6,
        height: 7 + Math.random() * 8,
        color: colors[index % colors.length],
        age: 0,
        lifetime: 100 + Math.random() * 55,
      };
    });

    const draw = (time: number) => {
      const delta = previousTime === 0 ? 1 : Math.min((time - previousTime) / 16.67, 2);
      previousTime = time;
      context.clearRect(0, 0, width, height);

      let activeParticles = 0;
      for (const particle of particles) {
        if (particle.age >= particle.lifetime) continue;
        activeParticles += 1;
        particle.age += delta;
        particle.vy += particle.gravity * delta;
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.rotation += particle.spin * delta;
        const fade = Math.min(1, (particle.lifetime - particle.age) / 24);

        context.save();
        context.globalAlpha = fade;
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        context.fillStyle = particle.color;
        context.fillRect(-particle.width / 2, -particle.height / 2, particle.width, particle.height);
        context.restore();
      }

      if (activeParticles > 0) frame = requestAnimationFrame(draw);
      else context.clearRect(0, 0, width, height);
    };

    const onMotionPreferenceChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        cancelAnimationFrame(frame);
        context.clearRect(0, 0, width, height);
      }
    };

    window.addEventListener("resize", resizeCanvas);
    motionPreference.addEventListener("change", onMotionPreferenceChange);
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resizeCanvas);
      motionPreference.removeEventListener("change", onMotionPreferenceChange);
      context.clearRect(0, 0, width, height);
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <canvas ref={canvasRef} className="pointer-events-none fixed inset-0" style={{ zIndex: 2147483647 }} aria-hidden="true" />,
    document.body
  );
}
