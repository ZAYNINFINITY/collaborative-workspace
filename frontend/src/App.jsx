import React, { Suspense, lazy, useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { socket } from "./socket";
import { AnimatePresence, motion } from "framer-motion";
import API from "./api";
import RequireAuth from "./auth/RequireAuth";

import PageTransition       from "./components/PageTransition";
import AmbientAIAssistant   from "./components/AmbientAIAssistant";
import CommandPalette       from "./components/CommandPalette";
import AppErrorBoundary     from "./components/AppErrorBoundary";
import NotificationsButton  from "./components/NotificationsButton";
import NotificationsPanel   from "./components/NotificationsPanel";
import logoImage            from "./assets/collab-logo.png";

// Marketing pages — loaded eagerly (tiny)
import Home             from "./pages/Home";
import Login            from "./pages/Login";
import Signup           from "./pages/Signup";
import Features         from "./pages/Features";
import Pricing          from "./pages/Pricing";
import Contact          from "./pages/Contact";
import Security         from "./pages/Security";
import Terms            from "./pages/Terms";
import Privacy          from "./pages/Privacy";
import Help             from "./pages/Help";

// App pages — code-split
import Onboarding        from "./pages/Onboarding";
import Settings          from "./pages/Settings";
import WorkspaceSettings from "./pages/WorkspaceSettings";

const Dashboard          = lazy(() => import("./pages/Dashboard"));
const Repositories       = lazy(() => import("./pages/Repositories"));
const Workspaces         = lazy(() => import("./pages/Workspaces"));
const Workspace          = lazy(() => import("./pages/Workspace"));
const WorkspaceAnalytics = lazy(() => import("./pages/WorkspaceAnalytics"));
const InvitationHandler  = lazy(() => import("./pages/InvitationHandler"));

// ─── Spinner shown while lazy chunks load ──────────────────────────────────────
const RouteLoader = () => (
  <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
    <img
      src={logoImage}
      alt="Loading"
      className="h-10 w-10 animate-pulse rounded-xl opacity-70"
    />
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
  </main>
);

// ─── Session-expired toast ─────────────────────────────────────────────────────
const SessionExpiredBanner = () => {
  const [params, setParams] = useSearchParams();
  const expired = params.get("session_expired") === "1";
  const [visible, setVisible] = useState(expired);

  useEffect(() => {
    if (!expired) return;
    // Remove the query param so a refresh doesn't re-show the banner
    params.delete("session_expired");
    setParams(params, { replace: true });
    const t = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-x-0 top-4 z-[9999] flex justify-center px-4"
    >
      <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-5 py-3 text-sm text-amber-200 backdrop-blur-xl shadow-lg">
        Your session expired. Please sign in again.
      </div>
    </motion.div>
  );
};

// ─── Animated route tree ───────────────────────────────────────────────────────
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <>
      <AnimatePresence>
        <SessionExpiredBanner key="session-banner" />
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>

          {/* ── Public / marketing ── */}
          <Route path="/"         element={<PageTransition><Home /></PageTransition>} />
          <Route path="/features" element={<PageTransition><Features /></PageTransition>} />
          <Route path="/pricing"  element={<PageTransition><Pricing /></PageTransition>} />
          <Route path="/security" element={<PageTransition><Security /></PageTransition>} />
          <Route path="/contact"  element={<PageTransition><Contact /></PageTransition>} />
          <Route path="/terms"    element={<PageTransition><Terms /></PageTransition>} />
          <Route path="/privacy"  element={<PageTransition><Privacy /></PageTransition>} />
          <Route path="/help"     element={<PageTransition><Help /></PageTransition>} />
          <Route path="/login"    element={<PageTransition><Login /></PageTransition>} />
          <Route path="/signup"   element={<PageTransition><Signup /></PageTransition>} />

          {/* ── Invite — PUBLIC, NOT behind RequireAuth ──────────────────────
               InvitationHandler itself handles the logged-in / logged-out
               distinction and shows sign-in / sign-up links accordingly.
               Wrapping this in RequireAuth was the root cause of invite tokens
               being lost after the login redirect. */}
          <Route
            path="/invite/:token"
            element={
              <Suspense fallback={<RouteLoader />}>
                <PageTransition>
                  <InvitationHandler />
                </PageTransition>
              </Suspense>
            }
          />

          {/* ── Protected app routes ── */}
          <Route path="/onboarding" element={<RequireAuth><PageTransition><Onboarding /></PageTransition></RequireAuth>} />
          <Route path="/settings"   element={<RequireAuth><PageTransition><Settings /></PageTransition></RequireAuth>} />

          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Suspense fallback={<RouteLoader />}>
                  <PageTransition><Dashboard /></PageTransition>
                </Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="/repos"
            element={
              <RequireAuth>
                <Suspense fallback={<RouteLoader />}>
                  <PageTransition><Repositories /></PageTransition>
                </Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="/workspaces"
            element={
              <RequireAuth>
                <Suspense fallback={<RouteLoader />}>
                  <PageTransition><Workspaces /></PageTransition>
                </Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="/workspaces/:id"
            element={
              <RequireAuth>
                <Suspense fallback={<RouteLoader />}>
                  <PageTransition><Workspace /></PageTransition>
                </Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="/workspaces/:id/settings"
            element={
              <RequireAuth>
                <PageTransition><WorkspaceSettings /></PageTransition>
              </RequireAuth>
            }
          />
          <Route
            path="/workspaces/:id/analytics"
            element={
              <RequireAuth>
                <Suspense fallback={<RouteLoader />}>
                  <PageTransition><WorkspaceAnalytics /></PageTransition>
                </Suspense>
              </RequireAuth>
            }
          />

        </Routes>
      </AnimatePresence>
    </>
  );
};

// ─── Root App ──────────────────────────────────────────────────────────────────
function App() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen]   = useState(false);

  useEffect(() => {
    // Prime CSRF token for the first POST (any page load triggers this)
    API.get("/health").catch(() => {});

    socket.on("connect",       () => console.log("Socket connected:", socket.id));
    socket.on("disconnect",    () => console.log("Socket disconnected"));
    socket.on("connect_error", (e) => console.error("Socket error:", e));

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
    };
  }, []);

  return (
    <AppErrorBoundary>
      <Router>
        <AmbientAIAssistant onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
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
