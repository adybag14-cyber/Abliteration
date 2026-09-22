import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import { readFileSync } from "node:fs";

const buildSha = process.env.VITE_BUILD_SHA || "local";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/Abliteration/" : "/",
  plugins: [
    {
      name: "handbook-development-routes",
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          const base = server.config.base;
          const pathname = (request.url || "").split("?")[0];
          if (pathname === `${base}__handbook/content.json` || pathname === `${base}__handbook/search-index.json`) {
            try {
              const file = pathname.endsWith("/content.json") ? "content.json" : "search-index.json";
              response.setHeader("Content-Type", "application/json");
              response.end(readFileSync(new URL(`./artifacts/handbook-build/${file}`, import.meta.url)));
            } catch { response.statusCode = 503; response.end("Run npm run handbook:prepare"); }
            return;
          }
          if (pathname.startsWith(`${base}handbook/`) && (pathname.endsWith("/") || pathname.endsWith("/index.html"))) request.url = `${base}handbook.html`;
          next();
        });
      },
    },
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
    rolldownOptions: { input: { main: fileURLToPath(new URL("./index.html", import.meta.url)), handbook: fileURLToPath(new URL("./handbook.html", import.meta.url)) } },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    include: ["src/**/*.test.{ts,tsx}"],
    css: true,
  },
});
