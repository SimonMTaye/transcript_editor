import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  test: {
    setupFiles: "./tests/frontend/vitest.setup.ts",
    environment: "jsdom",
    coverage: {
      include: [
        "src/**/*.{js,ts,jsx,tsx}",
        "worker/**/*.{js,ts,jsx,tsx}",
        "shared/**/*.{js,ts,jsx,tsx}",
      ],
    },
  },
  resolve: {
    alias: {
      "@src": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
      "@worker": path.resolve(__dirname, "./worker"),
    },
  },
  define: {
    "import.meta.VITE_POCKETB_URL":
      mode === "development" ? undefined : "process.env.VITE_POCKETB_URL",
    "import.meta.VITE_CF_ENDPOINT":
      mode === "development" ? undefined : "process.env.VITE_CF_ENDPOINT",
  },
}));
