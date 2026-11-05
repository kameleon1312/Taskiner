import { useEffect, useRef } from "react";

/**
 * Lets the system back button / gesture close an overlay.
 * Pushes a marker history entry while the overlay is open and removes it again
 * when the overlay is closed from the UI, so no "dead" back presses remain.
 */
export function useAndroidBack(onBack: () => void, active: boolean): void {
  const ref = useRef(onBack);
  ref.current = onBack;

  useEffect(() => {
    if (!active) return;
    const marker = Math.random().toString(36).slice(2);
    history.pushState({ ...(history.state ?? {}), __overlay: marker }, "");
    let popped = false;

    const handler = () => {
      if (history.state?.__overlay !== marker) {
        popped = true;
        ref.current();
      }
    };
    window.addEventListener("popstate", handler);
    return () => {
      window.removeEventListener("popstate", handler);
      if (!popped && history.state?.__overlay === marker) history.back();
    };
  }, [active]);
}
