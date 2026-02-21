import React, { useEffect, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { socket } from "./socket";
import { AnimatePresence } from "framer-motion";

// Custom Components
import BootLoader from "./components/BootLoader";
import PageTransition from "./components/PageTransition";
import AmbientAIAssistant from "./components/AmbientAIAssistant";
import CommandPalette from "./components/CommandPalette";

// Lazy load route components for code splitting
const Home = React.lazy(() => import("./pages/Home"));
const Login = React.lazy(() => import("./pages/Login"));
const Signup = React.lazy(() => import("./pages/Signup"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Repositories = React.lazy(() => import("./pages/Repositories"));
const Workspaces = React.lazy(() => import("./pages/Workspaces"));
const Workspace = React.lazy(() => import("./pages/Workspace"));
const InvitationHandler = React.lazy(() => import("./pages/InvitationHandler"));

// Loading fallback component
const LoadingFallback = () => <BootLoader />;

// We need a helper component to use useLocation for Framer Motion AnimatePresence
const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <Home />
            </PageTransition>
          }
        />
        <Route
          path="/login"
          element={
            <PageTransition>
              <Login />
            </PageTransition>
          }
        />
        <Route
          path="/signup"
          element={
            <PageTransition>
              <Signup />
            </PageTransition>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PageTransition>
              <Dashboard />
            </PageTransition>
          }
        />
        <Route
          path="/repos"
          element={
            <PageTransition>
              <Repositories />
            </PageTransition>
          }
        />
        <Route
          path="/workspaces"
          element={
            <PageTransition>
              <Workspaces />
            </PageTransition>
          }
        />
        <Route
          path="/workspaces/:id"
          element={
            <PageTransition>
              <Workspace />
            </PageTransition>
          }
        />
        <Route
          path="/invite/:token"
          element={
            <PageTransition>
              <InvitationHandler />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);
  useEffect(() => {
    // Auto-connect socket on app load
    if (!socket.connected) {
      socket.connect();
      console.log("Socket connecting...");
    }

    // Handle socket connection events
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    // Cleanup on unmount
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
    };
  }, []);

  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        {/* Ambient AI & Command Palette globally available */}
        <AmbientAIAssistant
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
        />

        <AnimatedRoutes />
      </Suspense>
    </Router>
  );
}

export default App;
