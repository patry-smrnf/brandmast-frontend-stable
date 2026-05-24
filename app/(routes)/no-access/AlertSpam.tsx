"use client";

import { useEffect } from "react";

const ALERT_MESSAGES = [
  "tajni agenci obserwujom cb👀",
  "Przywitaj sie z nowymi agentami",
  "Kowalski, nie tutaj wchodz!",
  "Nie masz psychy tanczyc tak",
  "You've been hacked by pingiwinki!!!",
  "No i co teraz??? zabladziles kowalski-",
  "ej ja nw co tu pisac",
  "pignwin party za 3... 2... 1...",
  "Your computer has a virus! i aint kidding kidding kowalski",
  "AntiVirus: System32 Deleted"
];

function randomMessage() {
  return ALERT_MESSAGES[Math.floor(Math.random() * ALERT_MESSAGES.length)];
}

function randomDelay() {
  return 4000 +Math.random() * 9000;
}

export function AlertSpam() {
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      timeoutId = setTimeout(() => {
        alert(randomMessage());
        scheduleNext();
      }, randomDelay());
    };

    scheduleNext();

    return () => clearTimeout(timeoutId);
  }, []);

  return null;
}
