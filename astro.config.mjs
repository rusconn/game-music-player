//@ts-check

import { defineConfig } from "astro/config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  vite: {
    plugins: [
      VitePWA({
        devOptions: { enabled: true },
        registerType: "autoUpdate",
        includeAssets: ["5-seconds-of-silence.mp3", "favicon.svg", "icons.svg"],
        manifest: {
          name: "Game Music Player",
          short_name: "Game Music Player",
          start_url: "/",
          display: "standalone",
          orientation: "portrait",
          background_color: "#222",
          theme_color: "#222",
          icons: [
            {
              src: "/icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable",
            },
            {
              src: "/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
      }),
    ],
  },
});
