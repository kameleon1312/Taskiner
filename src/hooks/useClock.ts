import { create } from "zustand";

/** One shared minute ticker so time-relative labels (overdue, "Dziś 14:00") stay fresh. */
const useClockStore = create<{ minute: number }>(() => ({ minute: Math.floor(Date.now() / 60_000) }));

let started = false;
function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  const tick = () => useClockStore.setState({ minute: Math.floor(Date.now() / 60_000) });
  // Align to the start of the next minute, then tick every minute
  setTimeout(() => { tick(); setInterval(tick, 60_000); }, 60_000 - (Date.now() % 60_000) + 50);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") tick(); });
}

export function useMinuteClock(): number {
  start();
  return useClockStore((s) => s.minute);
}
