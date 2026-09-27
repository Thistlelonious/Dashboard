import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"
import { defineConfig } from "vitest/config"
import { lightToken } from "./scripts/light-tokens.mjs"

const canvas = lightToken("canvas")
const year = 365 * 24 * 60 * 60

export default defineConfig({
  base: "/coinvoice/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      manifest: {
        name: "coinvoice",
        short_name: "coinvoice",
        display: "standalone",
        start_url: "./",
        scope: "./",
        theme_color: canvas,
        background_color: canvas,
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{html,js,css,png,jpg,jpeg,webp,svg}"],
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com",
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-css" },
          },
          {
            urlPattern: ({ url }) => url.origin === "https://fonts.gstatic.com",
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 30, maxAgeSeconds: year },
            },
          },
        ],
      },
    }),
  ],
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
  },
})
