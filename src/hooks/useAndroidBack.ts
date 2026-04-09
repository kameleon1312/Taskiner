import { useEffect, useRef } from "react";

export function useAndroidBack(onBack: () => void, active: boolean): void {
  const ref = useRef(onBack);
  ref.current = onBack;

  useEffect(() => {
    if (!active) return;

    history.pushState({ overlay: true }, "");

    const handler = () => ref.current();
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [active]);
}
