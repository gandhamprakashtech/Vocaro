import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "WordVault",
        short_name: "WordVault",
        description: "Personal vocabulary memory and revision system",
        theme_color: "#6366f1",
        background_color: "#0f172a",
        display: "fullscreen",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,json}"],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react-dom") || id.includes("react")) return "react";
          if (id.includes("react-router")) return "router";
          if (id.includes("@supabase/supabase-js")) return "supabase";
          if (id.includes("recharts")) return "charts";
          if (id.includes("jspdf")) return "pdf";
          if (id.includes("lucide-react")) return "icons";
          if (
            id.includes("@tanstack/react-query") ||
            id.includes("@tanstack/react-virtual") ||
            id.includes("dexie")
          ) {
            return "data";
          }
          return "vendor";
        },
      },
    },
  },
});
