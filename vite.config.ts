import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  test: {
    // vendor/pstack ships its own *.test.ts files, which must never run here.
    include: ["src/**/*.test.{ts,tsx}"],
  },
})
