import React, { useEffect, useState } from "react";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api";
import { API_BASE_URL } from "../config";
import logoImage from "../assets/collab-logo.png";
import { useAuth } from "../auth/useAuth";
import AuthBackground from "../components/AuthBackground";

const Login = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, refreshUser } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [notice, setNotice]     = useState("");

  const getRedirectTarget = () => {
    if (location.state?.from) return location.state.from;
    const hash = location.hash;
    if (hash.startsWith("#from=")) {
      try { return decodeURIComponent(hash.slice(6)); } catch { /* ignore */ }
    }
    return "/dashboard";
  };

  useEffect(() => {
    if (user) navigate(getRedirectTarget(), { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("session_expired") === "1") {
      setNotice("Your session expired. Please sign in again.");
      navigate({ pathname: "/login", search: "", hash: location.hash }, { replace: true, state: location.state });
      return;
    }
    if (params.get("logged_out") === "true") {
      setNotice("You have been signed out.");
      navigate({ pathname: "/login", search: "", hash: location.hash }, { replace: true, state: location.state });
      return;
    }
    const oauthErr = params.get("error");
    if (oauthErr === "github_auth_failed") {
      setErrors({ form: "GitHub sign-in failed. Try again or use email." });
      navigate({ pathname: "/login", search: "", hash: location.hash }, { replace: true, state: location.state });
    }
    if (oauthErr === "google_auth_failed") {
      setErrors({ form: "Google sign-in failed. Try again or use email." });
      navigate({ pathname: "/login", search: "", hash: location.hash }, { replace: true, state: location.state });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setErrors({ form: "Email and password are required" });
      return;
    }
    try {
      setLoading(true);
      setErrors({});
      setNotice("");
      await API.post("/auth/login", { email: formData.email, password: formData.password });
      await refreshUser();
      navigate(getRedirectTarget(), { replace: true });
    } catch (err) {
      setErrors({
        form: !err.response
          ? "Cannot reach the server. Check your connection."
          : err.response?.data?.msg || "Login failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const containerVariants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
  };
  const itemVariants = {
    hidden:  { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 12 } },
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0e0e10]">
      {/* Shared Three.js background — single canvas, no context loss */}
      <AuthBackground />

      <motion.section
        className="relative z-10 w-full max-w-md px-4 py-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="mb-8 text-center" variants={itemVariants}>
          <motion.img
            src={logoImage}
            alt="Collab logo"
            className="mx-auto mb-3 h-14 w-14 rounded-xl shadow-[0_0_30px_rgba(0,217,255,0.4)]"
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 10 }}
          />
          <h1 className="text-3xl font-semibold tracking-tight text-white drop-shadow-[0_0_15px_rgba(0,217,255,0.5)]">
            Collaborative Workspace
          </h1>
          <p className="mt-2 text-sm text-cyan-100/70">Sign in to your account</p>
        </motion.div>

        <motion.div className="glassmorphic-card p-6" variants={itemVariants}>
          <AnimatePresence>
            {notice && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 rounded-md border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
              >
                {notice}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            <AnimatePresence>
              {errors.form && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  role="alert"
                  className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
                >
                  {errors.form}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-white/90">Email</label>
              <input
                id="email" name="email" type="email" autoComplete="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-white/90">Password</label>
                <span className="text-xs text-white/30">Forgot password?</span>
              </div>
              <input
                id="password" name="password" type="password" autoComplete="current-password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30"
              />
            </div>

            <motion.button
              type="submit" disabled={loading}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(0,217,255,0.3)] transition hover:shadow-[0_0_30px_rgba(0,217,255,0.5)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign In"}
            </motion.button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="text-xs uppercase tracking-wider text-white/40">Or</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}
              onClick={() => { window.location.href = `${API_BASE_URL.replace("/api", "")}/auth/github`; }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <FaGithub aria-hidden="true" /> GitHub
            </motion.button>
            <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}
              onClick={() => { window.location.href = `${API_BASE_URL.replace("/api", "")}/auth/google`; }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <FaGoogle aria-hidden="true" /> Google
            </motion.button>
          </div>
        </motion.div>

        <motion.p className="mt-6 text-center text-sm text-white/50" variants={itemVariants}>
          Don&apos;t have an account?{" "}
          <Link
            to="/signup"
            state={location.state}
            className="font-semibold text-cyan-400 drop-shadow-[0_0_10px_rgba(0,217,255,0.5)] transition hover:text-cyan-300"
          >
            Create one
          </Link>
        </motion.p>
      </motion.section>
    </main>
  );
};

export default Login;
