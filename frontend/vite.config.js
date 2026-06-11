import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/yt": {
        target: "https://www.youtube.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/yt/, ""),
      },
    },
  },
});
