/**
 * Tymczasowy mechanizm testowy: powiadamia UI o timeoutach backendu,
 * żeby pokazać baner „Obudz serwer”.
 */
type Listener = () => void;
const listeners = new Set<Listener>();

export function signalBackendTimeout(): void {
  if (typeof window === "undefined") return;
  for (const l of listeners) l();
}

export function subscribeBackendTimeout(handler: Listener): () => void {
  listeners.add(handler);
  return () => {
    listeners.delete(handler);
  };
}
