import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

// Suppress THREE.Clock deprecation warning from @react-three/fiber
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    args[0] &&
    typeof args[0] === "string" &&
    args[0].includes("THREE.Clock: This module has been deprecated")
  ) {
    return;
  }
  originalWarn(...args);
};

import App from "./App";
import { AuthProvider } from "./auth/AuthProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
