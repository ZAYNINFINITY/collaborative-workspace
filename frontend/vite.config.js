import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const defaultLocalApiBaseUrl = "http://localhost:5000/api";
  const apiBase =
    mode === "production"
      ? "/api"
      : env.VITE_API_BASE_URL ||
        env.REACT_APP_API_BASE_URL ||
        defaultLocalApiBaseUrl;

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
        ...(mode === "test"
          ? {
              "react-icons/fa": path.resolve(
                __dirname,
                "./src/testStubs/reactIconsFa.jsx",
              ),
            }
          : {}),
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/setupTests.js",
    },
  };
});
