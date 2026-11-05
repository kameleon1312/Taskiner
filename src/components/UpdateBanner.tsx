import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function UpdateBanner() {
  const [show, setShow] = useState(false);
  const reloadRequested = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const checkForWaiting = async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg?.waiting) setShow(true);
    };

    checkForWaiting();

    const handler = (e: Event) => {
      const reg = e.target as ServiceWorkerRegistration;
      if (reg.waiting) setShow(true);
    };

    // First install also fires controllerchange (clientsClaim) — only an
    // UPDATE of an already controlling worker should offer a refresh.
    const hadController = !!navigator.serviceWorker.controller;
    const onControllerChange = () => {
      if (reloadRequested.current) window.location.reload();
      else if (hadController) setShow(true);
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    navigator.serviceWorker.ready.then((reg) => {
      reg.addEventListener("updatefound", () => {
        const next = reg.installing;
        if (!next) return;
        next.addEventListener("statechange", () => {
          if (next.state === "installed" && navigator.serviceWorker.controller) {
            setShow(true);
          }
        });
      });
    });

    window.addEventListener("sw-update-available", handler as EventListener);
    return () => {
      window.removeEventListener("sw-update-available", handler as EventListener);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  const handleUpdate = async () => {
    reloadRequested.current = true;
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg?.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
    else window.location.reload(); // new worker already active (skipWaiting)
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="update-banner"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 36 }}
        >
          <span className="update-banner__text">🚀 Dostępna aktualizacja!</span>
          <button className="update-banner__btn" onClick={handleUpdate}>
            Odśwież
          </button>
          <button
            className="update-banner__dismiss"
            onClick={() => setShow(false)}
            aria-label="Zamknij"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
