import React, { Suspense, lazy, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { socket } from "./socket";
import { AnimatePresence } from "framer-motion";
import API from "./api";
import RequireAuth from "./auth/RequireAuth";

// Custom Components
import PageTransition from "./components/PageTransition";
import AmbientAIAssistant from "./components/AmbientAIAssistant";
import CommandPalette from "./components/CommandPalette";
import AppErrorBoundary from "./components/AppErrorBoundary";
import NotificationsButton from "./components/NotificationsButton";
import NotificationsPanel from "./components/NotificationsPanel";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Security from "./pages/Security";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Onboarding from "./pages/Onboarding";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import WorkspaceSettings from "./pages/WorkspaceSettings";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Repositories = lazy(() => import("./pages/Repositories"));
const Workspaces = lazy(() => import("./pages/Workspaces"));
const Workspace = lazy(() => import("./pages/Workspace"));
const WorkspaceAnalytics = lazy(() => import("./pages/WorkspaceAnalytics"));
const InvitationHandler = lazy(() => import("./pages/InvitationHandler"));

const RouteLoader = () => (
  <main className="flex min-h-screen items-center justify-center px-4 text-white/70">
    Loading page...
  </main>
);

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
          path="/features"
          element={
            <PageTransition>
              <Features />
            </PageTransition>
          }
        />
        <Route
          path="/pricing"
          element={
            <PageTransition>
              <Pricing />
            </PageTransition>
          }
        />
        <Route
          path="/security"
          element={
            <PageTransition>
              <Security />
            </PageTransition>
          }
        />
        <Route
          path="/contact"
          element={
            <PageTransition>
              <Contact />
            </PageTransition>
          }
        />
        <Route
          path="/terms"
          element={
            <PageTransition>
              <Terms />
            </PageTransition>
          }
        />
        <Route
          path="/privacy"
          element={
            <PageTransition>
              <Privacy />
            </PageTransition>
          }
        />
        <Route
          path="/help"
          element={
            <PageTransition>
              <Help />
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
            <Suspense fallback={<RouteLoader />}>
              <RequireAuth>
                <PageTransition>
                  <Dashboard />
                </PageTransition>
              </RequireAuth>
            </Suspense>
          }
        />
        <Route
          path="/onboarding"
          element={
            <Suspense fallback={<RouteLoader />}>
              <RequireAuth>
                <PageTransition>
                  <Onboarding />
                </PageTransition>
              </RequireAuth>
            </Suspense>
          }
        />
        <Route
          path="/settings"
          element={
            <Suspense fallback={<RouteLoader />}>
              <RequireAuth>
                <PageTransition>
                  <Settings />
                </PageTransition>
              </RequireAuth>
            </Suspense>
          }
        />
        <Route
          path="/repos"
          element={
            <Suspense fallback={<RouteLoader />}>
              <RequireAuth>
                <PageTransition>
                  <Repositories />
                </PageTransition>
              </RequireAuth>
            </Suspense>
          }
        />
        <Route
          path="/workspaces"
          element={
            <Suspense fallback={<RouteLoader />}>
              <RequireAuth>
                <PageTransition>
                  <Workspaces />
                </PageTransition>
              </RequireAuth>
            </Suspense>
          }
        />
        <Route
          path="/workspaces/:id"
          element={
            <Suspense fallback={<RouteLoader />}>
              <RequireAuth>
                <PageTransition>
                  <Workspace />
                </PageTransition>
              </RequireAuth>
            </Suspense>
          }
        />
        <Route
          path="/workspaces/:id/settings"
          element={
            <Suspense fallback={<RouteLoader />}>
              <RequireAuth>
                <PageTransition>
                  <WorkspaceSettings />
                </PageTransition>
              </RequireAuth>
            </Suspense>
          }
        />
        <Route
          path="/workspaces/:id/analytics"
          element={
            <Suspense fallback={<RouteLoader />}>
              <RequireAuth>
                <PageTransition>
                  <WorkspaceAnalytics />
                </PageTransition>
              </RequireAuth>
            </Suspense>
          }
        />
        <Route
          path="/invite/:token"
          element={
            <Suspense fallback={<RouteLoader />}>
              <RequireAuth>
                <PageTransition>
                  <InvitationHandler />
                </PageTransition>
              </RequireAuth>
            </Suspense>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  useEffect(() => {
    // Prime CSRF token cache for authenticated write requests
    API.get("/health").catch(() => {});

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
    <AppErrorBoundary>
      <Router>
        {/* Ambient AI & Command Palette globally available */}
        <AmbientAIAssistant
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
        />

        <AnimatedRoutes />

        <NotificationsButton onClick={() => setNotificationsOpen(true)} />
        <NotificationsPanel
          open={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
        />
      </Router>
    </AppErrorBoundary>
  );
}

export default App;
