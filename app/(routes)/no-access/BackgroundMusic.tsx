"use client";

import { useEffect } from "react";

export function BackgroundMusic() {
  useEffect(() => {
    const audio = new Audio("/hehe/track.mp3");
    audio.loop = true;
    audio.volume = 0.5;

    const startMusic = () => {
      audio.play().catch(() => {});
      document.removeEventListener("click", startMusic);
      document.removeEventListener("touchstart", startMusic, { capture: true });
      document.removeEventListener("keydown", startMusic);
    };

    // Try autoplay first (works in some contexts), then fall back to user interaction
    audio.play().then(() => {}).catch(() => {
      document.addEventListener("click", startMusic);
      document.addEventListener("touchstart", startMusic, { capture: true });
      document.addEventListener("keydown", startMusic);
    });

    return () => {
      audio.pause();
      document.removeEventListener("click", startMusic);
      document.removeEventListener("touchstart", startMusic, { capture: true });
      document.removeEventListener("keydown", startMusic);
    };
  }, []);

  return null;
}
