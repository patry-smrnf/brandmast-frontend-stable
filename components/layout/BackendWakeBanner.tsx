"use client";

import { useEffect, useState } from "react";
import { subscribeBackendTimeout } from "@/lib/api/backend-timeout-signal";
import { Button } from "@/components/ui/button";

/** Tymczasowy URL do „budzenia” instancji Render w testach. */
const WAKE_SERVER_URL = "https://brandmast-backend-stable.onrender.com/";

export function BackendWakeBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    return subscribeBackendTimeout(() => setOpen(true));
  }, []);

  if (!open) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-100 flex flex-wrap items-center justify-center gap-3 border-b border-amber-500/40 bg-amber-950/95 px-4 py-2 text-center text-sm text-amber-50 shadow-md backdrop-blur-sm"
    >
      <span className="text-balance">
        Brak odpowiedzi z backendu (timeout). Render mógł uśpić serwer - otwórz backend w tej samej przeglądarce, żeby go obudzić.
      </span>
      <Button asChild variant="secondary" size="sm" className="shrink-0 bg-amber-100 text-amber-950 hover:bg-amber-200">
        <a href={WAKE_SERVER_URL}>Obudz serwer</a>
      </Button>
    </div>
  );
}
