import { defineConfig } from "vite";
import type { AliasOptions } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const root = path.resolve(__dirname, "src");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": root,
    } as AliasOptions,
  },
  server: {
    host: true, // or "0.0.0.0"
    port: 5173,
    allowedHosts: [".ngrok-free.dev"],
  },
});
