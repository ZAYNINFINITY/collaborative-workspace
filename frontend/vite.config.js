import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBase =
    env.VITE_API_BASE_URL || env.REACT_APP_API_BASE_URL || "/api";

  return {
    plugins: [
      react({
        include: "**/*.{js,jsx,ts,tsx}",
      }),
    ],
    define: {
      "process.env": {
        NODE_ENV: mode,
        REACT_APP_API_BASE_URL: apiBase,
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/setupTests.js",
    },
  };
});
