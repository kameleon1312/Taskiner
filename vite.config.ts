import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/react-router")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/framer-motion")) {
            return "vendor-motion";
          }
          if (id.includes("node_modules/zustand")) {
            return "vendor-store";
          }
        },
      },
    },
    // Raise warning threshold to avoid false positives (framer-motion is large)
    chunkSizeWarningLimit: 600,
  },
  plugins: [
    react(),
    VitePWA({
     
      registerType: "autoUpdate",

      injectRegister: "auto",

    
      manifest: false,

      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,wav,webp,woff,woff2}"],

        // Dołącz nasz scheduler powiadomień do SW
        importScripts: ["/notification-sw.js"],

        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api/, /^\/service-worker\.js/],


        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "taskiner-fonts",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 rok
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],


        cleanupOutdatedCaches: true,


        skipWaiting: true,
        clientsClaim: true,
      },

      devOptions: {
        enabled: false,
      },
    }),
  ],
});
