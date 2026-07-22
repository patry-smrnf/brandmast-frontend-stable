export type AuthSessionErrorPayload = {
  message: string;
};

type Listener = (payload: AuthSessionErrorPayload) => void;

const listeners = new Set<Listener>();

export function subscribeAuthSessionError(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyAuthSessionError(message: string) {
  const payload: AuthSessionErrorPayload = {
    message: message.trim() || "Sesja wygasła lub token jest nieprawidłowy.",
  };
  for (const listener of listeners) {
    try {
      listener(payload);
    } catch {
      // ignore listener failures
    }
  }
}
