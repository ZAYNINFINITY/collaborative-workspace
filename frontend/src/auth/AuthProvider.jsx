import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import API, { AUTH_UNAUTHORIZED_EVENT, resetCsrfTokenCache } from "../api";
import { socket } from "../socket";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const refreshNotifications = useCallback(async () => {
    try {
      setNotificationsLoading(true);
      const res = await API.get("/notifications?limit=25");
      setNotifications(Array.isArray(res.data) ? res.data : []);
      return res.data || [];
    } catch {
      setNotifications([]);
      return [];
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      setError("");
      const res = await API.get("/auth/user");
      setUser(res.data || null);
      return res.data || null;
    } catch (err) {
      setUser(null);
      if (!err?.response) {
        setError("We could not reach the server.");
      }
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await API.post("/auth/logout", null, {
        headers: { "Cache-Control": "no-store" },
      });
    } catch {
      try {
        await API.get("/auth/logout", {
          headers: { "Cache-Control": "no-store" },
        });
      } catch {
        // Ignore and continue with local cleanup.
      }
    } finally {
      resetCsrfTokenCache();
      if (socket.connected) {
        socket.disconnect();
      }
      setUser(null);
      setNotifications([]);
      // Always hard-navigate to login so you never land on `/` with a stale "logged in" header.
      // Client-only navigate("/login") can leave memory/cache quirks; full reload matches cleared cookies.
      const isTestEnv =
        typeof import.meta !== "undefined" && import.meta.env?.MODE === "test";
      if (typeof window !== "undefined" && !isTestEnv) {
        window.location.replace(`${window.location.origin}/login`);
      }
    }
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      resetCsrfTokenCache();
      if (socket.connected) {
        socket.disconnect();
      }
      setUser(null);
      setNotifications([]);
    };
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  useEffect(() => {
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

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!user?._id) {
      if (socket.connected) {
        socket.disconnect();
      }
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id) return;

    refreshNotifications();

    const onNotifyNew = () => {
      refreshNotifications();
    };

    socket.on("notify:new", onNotifyNew);
    return () => socket.off("notify:new", onNotifyNew);
  }, [user?._id, refreshNotifications]);

  const enableDemoMode = useCallback(() => {
    setError("");
    setUser({
      _id: "demo-user-id",
      displayName: "Demo Guest",
      username: "demo_guest",
      email: "guest@demo.local",
      isDemo: true,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Demo",
    });
  }, []);

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
      enableDemoMode,
    }),
    [
      user,
      loading,
      error,
      refreshUser,
      logout,
      notifications,
      notificationsLoading,
      refreshNotifications,
      enableDemoMode,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
