import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

const buildSha = process.env.VITE_BUILD_SHA || "local";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/Abliteration/" : "/",
  plugins: [
    {
      name: "commit-bound-html",
      transformIndexHtml(html: string) {
        return html.replaceAll("__ABLITERATION_BUILD_SHA__", buildSha);
      },
    },
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    target: "es2022",
    sourcemap: false,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    include: ["src/**/*.test.{ts,tsx}"],
    css: true,
  },
});
