"use client";

import { useEffect, useRef, useState } from "react";

const PENGUIN_GIF =
  "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExdzdhMmQ0Z284ZWE4ZTluaW5zcG13M2Rpd3RjenFhMHlyM2l6dDIyciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/123GivAQB7k0s8/giphy.gif";

const TRAIL_LENGTH = 10;
const TRAIL_FRAME_INTERVAL = 3;

function getMaxSize() {
  if (typeof window === "undefined") return 150;
  const w = window.innerWidth;
  return Math.min(Math.max(w * 0.2, 80), 180);
}

export function FloatingPenguins() {
  const box1Ref = useRef<HTMLDivElement>(null);
  const box2Ref = useRef<HTMLDivElement>(null);
  const trail1Refs = useRef<(HTMLDivElement | null)[]>([]);
  const trail2Refs = useRef<(HTMLDivElement | null)[]>([]);
  const [mounted, setMounted] = useState(false);
  const sizeRef = useRef(150);

  useEffect(() => {
    setMounted(true);
    sizeRef.current = getMaxSize();
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const getViewportBounds = () => ({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const size = sizeRef.current;
    let pos1 = { x: 50, y: 80 };
    let pos2 = { x: Math.min(200, window.innerWidth - size - 20), y: 150 };
    const vel1 = { x: 1.8, y: 1.2 };
    const vel2 = { x: -2.1, y: 1.6 };

    const trail1: { x: number; y: number }[] = [];
    const trail2: { x: number; y: number }[] = [];
    let frameCount = 0;

    function updatePosition(
      pos: { x: number; y: number },
      vel: { x: number; y: number },
      boxRef: React.RefObject<HTMLDivElement | null>,
      trail: { x: number; y: number }[]
    ) {
      const { width, height } = getViewportBounds();
      const el = boxRef.current;
      const elW = el?.offsetWidth ?? sizeRef.current;
      const elH = el?.offsetHeight ?? sizeRef.current;
      const maxX = Math.max(0, width - elW);
      const maxY = Math.max(0, height - elH);

      let newX = pos.x + vel.x;
      let newY = pos.y + vel.y;

      if (newX <= 0) {
        newX = 0;
        vel.x = Math.abs(vel.x);
      } else if (newX >= maxX) {
        newX = maxX;
        vel.x = -Math.abs(vel.x);
      }
      if (newY <= 0) {
        newY = 0;
        vel.y = Math.abs(vel.y);
      } else if (newY >= maxY) {
        newY = maxY;
        vel.y = -Math.abs(vel.y);
      }

      if (boxRef.current) {
        boxRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
      }

      if (frameCount % TRAIL_FRAME_INTERVAL === 0) {
        trail.push({ x: newX, y: newY });
        if (trail.length > TRAIL_LENGTH) trail.shift();
      }

      return { x: newX, y: newY };
    }

    function updateTrails(
      trail: { x: number; y: number }[],
      trailRefs: React.RefObject<(HTMLDivElement | null)[]>
    ) {
      for (let i = 0; i < TRAIL_LENGTH; i++) {
        const trailEl = trailRefs.current[i];
        if (!trailEl) continue;
        const idx = trail.length - 1 - i;
        if (idx < 0) {
          trailEl.style.opacity = "0";
          continue;
        }
        const p = trail[idx];
        trailEl.style.transform = `translate(${p.x}px, ${p.y}px)`;
        trailEl.style.opacity = String(0.4 - (i / TRAIL_LENGTH) * 0.35);
      }
    }

    let rafId: number;
    const loop = () => {
      frameCount++;
      pos1 = updatePosition(pos1, vel1, box1Ref, trail1);
      pos2 = updatePosition(pos2, vel2, box2Ref, trail2);
      updateTrails(trail1, trail1Refs);
      updateTrails(trail2, trail2Refs);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafId);
  }, [mounted]);

  if (!mounted) return null;

  const containerStyle =
    "fixed left-0 top-0 z-10 will-change-transform inline-block";
  const trailStyle =
    "fixed left-0 top-0 z-[9] will-change-transform inline-block pointer-events-none transition-none";

  return (
    <>
      {/* Trail ghosts for penguin 1 */}
      {Array.from({ length: TRAIL_LENGTH }).map((_, i) => (
        <div
          key={`t1-${i}`}
          ref={(el) => {
            trail1Refs.current[i] = el;
          }}
          className={trailStyle}
          style={{ opacity: 0 }}
        >
          <img
            src={PENGUIN_GIF}
            alt=""
            className="block select-none"
            style={{ width: "auto", height: "auto" }}
          />
        </div>
      ))}
      {/* Trail ghosts for penguin 2 */}
      {Array.from({ length: TRAIL_LENGTH }).map((_, i) => (
        <div
          key={`t2-${i}`}
          ref={(el) => {
            trail2Refs.current[i] = el;
          }}
          className={trailStyle}
          style={{ opacity: 0 }}
        >
          <img
            src={PENGUIN_GIF}
            alt=""
            className="block select-none"
            style={{ width: "auto", height: "auto" }}
          />
        </div>
      ))}
      {/* Main penguins */}
      <div
        ref={box1Ref}
        className={containerStyle}
        style={{ transform: "translate(50px, 80px)" }}
      >
        <img
          src={PENGUIN_GIF}
          alt="Dancing penguins"
          className="pointer-events-none select-none block"
          style={{ width: "auto", height: "auto" }}
        />
      </div>
      <div
        ref={box2Ref}
        className={containerStyle}
        style={{ transform: "translate(200px, 150px)" }}
      >
        <img
          src={PENGUIN_GIF}
          alt="Dancing penguins"
          className="pointer-events-none select-none block"
          style={{ width: "auto", height: "auto" }}
        />
      </div>
    </>
  );
}
