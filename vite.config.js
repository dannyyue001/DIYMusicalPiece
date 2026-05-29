import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,   // auto-open browser on `npm run dev`
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
