import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import API, { AUTH_UNAUTHORIZED_EVENT, resetCsrfTokenCache } from "../api";
import { socket } from "../socket";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]                       = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState("");
  const [notifications, setNotifications]     = useState([]);
  const [notificationsLoading, setNLoading]   = useState(false);

  // Prevent double-fetch on strict-mode double mount
  const fetchedOnce = useRef(false);

  // ─── Notifications ────────────────────────────────────────────────────────
  const refreshNotifications = useCallback(async () => {
    try {
      setNLoading(true);
      const res = await API.get("/notifications?limit=25");
      setNotifications(Array.isArray(res.data) ? res.data : []);
      return res.data || [];
    } catch {
      setNotifications([]);
      return [];
    } finally {
      setNLoading(false);
    }
  }, []);

  // ─── Refresh current user ─────────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      setError("");
      const res = await API.get("/auth/user");
      setUser(res.data || null);
      return res.data || null;
    } catch (err) {
      setUser(null);
      if (!err?.response) setError("We could not reach the server.");
      return null;
    }
  }, []);

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await API.post("/auth/logout", null, {
        headers: { "Cache-Control": "no-store" },
      });
    } catch {
      // Fallback: GET logout (works even if CSRF token is stale)
      try {
        await API.get("/auth/logout", {
          headers: { "Cache-Control": "no-store" },
        });
      } catch {
        /* ignore — we clean up client-side regardless */
      }
    } finally {
      resetCsrfTokenCache();
      if (socket.connected) socket.disconnect();
      setUser(null);
      setNotifications([]);

      // Hard navigate so no stale React memory survives
      const isTest =
        typeof import.meta !== "undefined" &&
        import.meta.env?.MODE === "test";
      if (typeof window !== "undefined" && !isTest) {
        window.location.replace(`${window.location.origin}/login`);
      }
    }
  }, []);

  // ─── Handle 401 events from API interceptor ───────────────────────────────
  // When any authenticated API call returns 401 (session expired / token
  // revoked), clear state AND redirect to login.  Without the redirect the
  // user stays on a protected page that is now broken.
  useEffect(() => {
    const onUnauthorized = () => {
      resetCsrfTokenCache();
      if (socket.connected) socket.disconnect();
      setUser(null);
      setNotifications([]);

      // Only redirect if currently on a protected path
      const publicPaths = ["/", "/login", "/signup", "/features", "/pricing",
        "/security", "/contact", "/terms", "/privacy", "/help"];
      const isPublic = publicPaths.some(
        (p) =>
          window.location.pathname === p ||
          window.location.pathname.startsWith("/invite/"),
      );
      if (!isPublic) {
        // Preserve current path so after re-login the user returns here
        const returnTo = window.location.pathname + window.location.search;
        window.location.replace(
          `/login?session_expired=1#from=${encodeURIComponent(returnTo)}`,
        );
      }
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  // ─── Boot: load current user once ─────────────────────────────────────────
  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;

    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await API.get("/auth/user");
        if (mounted) setUser(res.data || null);
      } catch (err) {
        if (mounted) {
          setUser(null);
          if (!err?.response) setError("We could not reach the server.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  // ─── Socket lifecycle ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?._id) {
      if (socket.connected) socket.disconnect();
      return;
    }
    if (!socket.connected) socket.connect();
  }, [user?._id]);

  // ─── Notifications via socket ─────────────────────────────────────────────
  useEffect(() => {
    if (!user?._id) return;
    refreshNotifications();
    const onNew = () => refreshNotifications();
    socket.on("notify:new", onNew);
    return () => socket.off("notify:new", onNew);
  }, [user?._id, refreshNotifications]);

  // ─── Context value ────────────────────────────────────────────────────────
  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      refreshUser,
      logout,
      setUser,
      notifications,
      notificationsLoading,
      refreshNotifications,
    }),
    [user, loading, error, refreshUser, logout,
      notifications, notificationsLoading, refreshNotifications],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};
