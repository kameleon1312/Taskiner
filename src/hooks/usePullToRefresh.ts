import { useState, useRef, useCallback } from "react";

export type PTRPhase = "idle" | "pulling" | "ready" | "refreshing" | "done";

const THRESHOLD  = 68;
const RESISTANCE = 0.42;
const MAX_DIST   = 108;

export function usePullToRefresh(onRefresh?: () => void) {
  const [distance, setDistance] = useState(0);
  const [phase,    setPhase]    = useState<PTRPhase>("idle");

  const startY  = useRef(0);
  const active  = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollTop =
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;
    if (scrollTop > 4) return;

    const target = e.target as HTMLElement;
    if (target.closest("[data-no-ptr]")) return;

    startY.current = e.touches[0].clientY;
    active.current = true;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!active.current || phase === "refreshing" || phase === "done") return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy <= 0) { active.current = false; return; }
    const d = Math.min(dy * RESISTANCE, MAX_DIST);
    setDistance(d);
    setPhase(d >= THRESHOLD ? "ready" : "pulling");
  }, [phase]);

  const onTouchEnd = useCallback(() => {
    if (!active.current) return;
    active.current = false;

    setDistance((prev) => {
      if (prev >= THRESHOLD) {
        setPhase("refreshing");
        setTimeout(() => {
          onRefresh?.();
          navigator.vibrate?.(14);
          setPhase("done");
          setTimeout(() => {
            setPhase("idle");
            setDistance(0);
          }, 750);
        }, 850);
        return THRESHOLD;
      }
      setPhase("idle");
      return 0;
    });
  }, [onRefresh]);

  return { distance, phase, onTouchStart, onTouchMove, onTouchEnd };
}
