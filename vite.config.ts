/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget = env.API_PROXY_TARGET;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: apiProxyTarget
      ? {
          proxy: {
            "/api": {
              target: apiProxyTarget,
              changeOrigin: true,
              secure: true,
            },
          },
        }
      : undefined,
    test: {
      environment: "node",
      include: ["tests/**/*.test.{ts,tsx}"],
      setupFiles: ["./tests/setup.ts"],
    },
  };
});
