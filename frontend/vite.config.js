import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  // Load .env files for the current mode (development / production)
  // '' prefix loads ALL env vars, not just VITE_ ones
  const env = loadEnv(mode, process.cwd(), "");

  const isProd = mode === "production";

  // In production Vercel proxies /api/* → Railway, so relative /api is correct.
  // In development fall back to the local backend.
  const apiBase = isProd
    ? "/api"
    : env.VITE_API_BASE_URL || env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

  return {
    plugins: [
      react({
        include: "**/*.{js,jsx,ts,tsx}",
      }),
    ],

    // Make process.env.NODE_ENV available (some libs need it)
    // and expose API base so config.js can read it via import.meta.env
    define: {
      "process.env.NODE_ENV": JSON.stringify(mode),
    },

    // Expose to import.meta.env in the app
    // (Only VITE_ vars are exposed by default; we add our own here)
    envPrefix: ["VITE_", "REACT_APP_"],

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

    build: {
      outDir: "dist",
      sourcemap: false,
      // Raise chunk warning limit — Three.js is large
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          // Split large dependencies into separate chunks for better caching
          manualChunks: {
            "vendor-react":  ["react", "react-dom", "react-router-dom"],
            "vendor-three":  ["three", "@react-three/fiber", "@react-three/drei"],
            "vendor-motion": ["framer-motion"],
            "vendor-socket": ["socket.io-client"],
            "vendor-axios":  ["axios"],
          },
        },
      },
    },

    server: {
      port: 3000,
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:5000",
          changeOrigin: true,
          secure: false,
        },
        "/socket.io": {
          target: env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:5000",
          changeOrigin: true,
          ws: true,
        },
      },
    },

    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/setupTests.js",
    },
  };
});
