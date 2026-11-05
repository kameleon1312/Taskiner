import { useEffect, useState } from "react";
import { registerBackgroundSync } from "../notifications/bridge";

export { sendTestNotification } from "../notifications/useNotificationEngine";

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );

  useEffect(() => {
    const sync = () => {
      if (typeof Notification !== "undefined") setPermission(Notification.permission);
    };
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("notification-permission-changed", sync);
    // Live updates where the Permissions API supports it
    let status: PermissionStatus | null = null;
    navigator.permissions?.query({ name: "notifications" as PermissionName })
      .then((s) => { status = s; s.onchange = sync; })
      .catch(() => {});
    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("notification-permission-changed", sync);
      if (status) status.onchange = null;
    };
  }, []);

  const request = async (): Promise<NotificationPermission | "unsupported"> => {
    if (typeof Notification === "undefined") return "unsupported";
    const result = await Notification.requestPermission();
    setPermission(result);
    window.dispatchEvent(new Event("notification-permission-changed"));
    if (result === "granted") registerBackgroundSync();
    return result;
  };

  return { permission, request };
}
