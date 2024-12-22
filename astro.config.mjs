// @ts-check
import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import AstroPWA from "@vite-pwa/astro";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  adapter: node({
    mode: "standalone",
  }),
  output: "server",
  experimental: {
    serverIslands: true,
  },
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
    AstroPWA({
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "service-worker.ts",
      injectRegister: "script-defer",
      devOptions: {
        enabled: true,
        type: "module",
      },
      injectManifest: {
        maximumFileSizeToCacheInBytes: 7000000,
      },
      manifest: {
        name: "Tutly",
        short_name: "Tutly",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "/logo-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/logo-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  vite: {
    optimizeDeps: {
      exclude: ["@mapbox"],
    },
    define: {
      'APP_VERSION': JSON.stringify(process.env.npm_package_version)
    },
    server: {
      fs: {
        // Allow serving files from node_modules
        allow: ["../node_modules"]
      }
    }
  },
});
