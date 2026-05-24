"use client";

import { useState } from "react";

export function ContinueOverlay() {
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/0">
        <button
          onClick={() => setHidden(true)}
          className="rounded-xl bg-white/20 px-6 py-3 text-lg font-medium text-white transition hover:bg-white/30 active:scale-95"
        >
          Kliknij zeby przejsc dalej
        </button>
    </div>
  );
}
