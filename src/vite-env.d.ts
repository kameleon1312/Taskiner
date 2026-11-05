/// <reference types="vite/client" />

declare module "*.scss";

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

interface NotificationOptions {
  vibrate?: number[];
  actions?: NotificationAction[];
  renotify?: boolean;
  timestamp?: number;
  image?: string;
}

interface Navigator {
  setAppBadge?: (count?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
}
