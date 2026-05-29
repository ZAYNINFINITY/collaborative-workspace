import React, { useRef, useState } from "react";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Float, Sphere, MeshDistortMaterial } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api";
import { API_BASE_URL } from "../config";
import logoImage from "../assets/collab-logo.png";
import { useAuth } from "../auth/useAuth";

// ─── Same Three.js background as Login ────────────────────────────────────────
const InteractiveBackground = () => {
  const groupRef = useRef();
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.04;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.4;
  });
  return (
    <group ref={groupRef}>
      <Stars radius={100} depth={50} count={4000} factor={4} saturation={0} fade speed={1} />
      <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.9}>
        <mesh position={[7, 2, -12]}>
          <octahedronGeometry args={[2.2, 0]} />
          <meshBasicMaterial color="#9333ea" wireframe transparent opacity={0.13} />
        </mesh>
        <mesh position={[-6, -2, -14]}>
          <icosahedronGeometry args={[2.8, 0]} />
          <meshBasicMaterial color="#00d9ff" wireframe transparent opacity={0.12} />
        </mesh>
        <Sphere args={[1.4, 32, 32]} position={[1, 4, -9]}>
          <MeshDistortMaterial
            color="#6366f1"
            envMapIntensity={1}
            clearcoat={1}
            clearcoatRoughness={0}
            metalness={0.9}
            roughness={0.1}
            distort={0.35}
            speed={1.8}
            transparent
            opacity={0.28}
          />
        </Sphere>
      </Float>
    </group>
  );
};

// ─── Live password strength meter ─────────────────────────────────────────────
const checks = [
  { label: "8+ characters",        test: (p) => p.length >= 8 },
  { label: "Uppercase letter",     test: (p) => /[A-Z]/.test(p) },
  { label: "Lowercase letter",     test: (p) => /[a-z]/.test(p) },
  { label: "Number",               test: (p) => /[0-9]/.test(p) },
  { label: "Special character",    test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const passed = checks.filter((c) => c.test(password)).length;
  const pct    = (passed / checks.length) * 100;
  const color  =
    passed <= 2 ? "bg-red-400"
    : passed <= 3 ? "bg-amber-400"
    : passed === 4 ? "bg-yellow-300"
    : "bg-emerald-400";
  const label  =
    passed <= 2 ? "Weak"
    : passed <= 3 ? "Fair"
    : passed === 4 ? "Good"
    : "Strong";

  return (
    <div className="mt-2 space-y-2">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className={`h-full rounded-full ${color}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.25 }}
          />
        </div>
        <span className={`text-xs font-medium ${color.replace("bg-", "text-")}`}>
          {label}
        </span>
      </div>
      {/* Individual checks */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {checks.map((c) => {
          const ok = c.test(password);
          return (
            <div key={c.label} className="flex items-center gap-1.5">
              <span className={`text-xs ${ok ? "text-emerald-400" : "text-white/30"}`}>
                {ok ? "✓" : "○"}
              </span>
              <span className={`text-xs ${ok ? "text-white/70" : "text-white/30"}`}>
                {c.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Signup page ──────────────────────────────────────────────────────────────
const Signup = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { refreshUser } = useAuth();

  // Preserve invite context through signup → onboarding
  // The from value is either "/invite/:token" (set by RequireAuth or InvitationHandler)
  // or any other page the user was trying to reach.
  const from = location.state?.from || null;

  const [formData, setFormData] = useState({
    displayName:     "",
    email:           "",
    password:        "",
    confirmPassword: "",
  });
  const [errors, setErrors]           = useState({});
  const [loading, setLoading]         = useState(false);
  const [statusMessage, setStatus]    = useState("");

  const isPasswordStrong = (p) =>
    checks.every((c) => c.test(p));

  const validate = () => {
    const e = {};
    if (!formData.displayName.trim()) e.displayName = "Name is required";
    if (!formData.email.trim())        e.email       = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = "Invalid email";
    if (!formData.password)            e.password    = "Password is required";
    else if (!isPasswordStrong(formData.password))
      e.password = "Please meet all password requirements below";
    if (formData.password !== formData.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      setStatus("");
      await API.post("/auth/signup", {
        displayName: formData.displayName,
        email:       formData.email,
        password:    formData.password,
      });
      setStatus("Account created! Setting up your workspace…");
      await refreshUser();

      // If user came from an invite link, go directly there after signup.
      // Otherwise go to onboarding, passing along any pending from so it
      // survives further redirects.
      if (from && from.startsWith("/invite/")) {
        navigate(from, { replace: true });
      } else {
        navigate("/onboarding", { replace: true, state: from ? { from } : undefined });
      }
    } catch (err) {
      const msg = !err.response
        ? "Cannot reach the server. Check your connection."
        : err.response?.data?.msg || "Failed to create account";
      setErrors((p) => ({ ...p, form: msg }));
      setStatus("");
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
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
  };
  const itemVariants = {
    hidden:  { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 12 } },
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0e0e10]">
      {/* ── Three.js background — matches Login ── */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
          <ambientLight intensity={0.5} />
          <InteractiveBackground />
        </Canvas>
      </div>

      <motion.section
        className="relative z-10 w-full max-w-md px-4 py-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="mb-7 text-center" variants={itemVariants}>
          <motion.img
            src={logoImage}
            alt="Collab logo"
            className="mx-auto mb-3 h-13 w-13 rounded-xl shadow-[0_0_30px_rgba(0,217,255,0.35)]"
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 10 }}
          />
          <h1 className="text-3xl font-semibold tracking-tight text-white drop-shadow-[0_0_15px_rgba(0,217,255,0.45)]">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-cyan-100/60">
            {from?.startsWith("/invite/")
              ? "Sign up to accept your workspace invitation"
              : "Join Collab and start collaborating"}
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          className="glassmorphic-card p-6"
          variants={itemVariants}
        >
          <form onSubmit={handleSignup} className="space-y-4" noValidate>
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

            {/* Full name */}
            <div className="space-y-1">
              <label htmlFor="displayName" className="text-sm font-medium text-white/90">
                Full name
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                autoComplete="name"
                placeholder="Ali Hassan"
                value={formData.displayName}
                onChange={handleChange}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
              />
              {errors.displayName && (
                <p className="text-xs text-red-300">{errors.displayName}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-white/90">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
              />
              {errors.email && (
                <p className="text-xs text-red-300">{errors.email}</p>
              )}
            </div>

            {/* Password + live meter */}
            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium text-white/90">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30"
              />
              <PasswordStrength password={formData.password} />
              {errors.password && (
                <p className="text-xs text-red-300">{errors.password}</p>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-white/90">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-300">{errors.confirmPassword}</p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(0,217,255,0.3)] transition hover:shadow-[0_0_30px_rgba(0,217,255,0.5)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Create account"}
            </motion.button>

            {statusMessage && (
              <p className="text-center text-sm text-emerald-300">{statusMessage}</p>
            )}
          </form>

          {/* OAuth divider */}
          <div className="my-5 flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="text-xs uppercase tracking-wider text-white/40">Or</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { window.location.href = `${API_BASE_URL}/auth/github`; }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <FaGithub aria-hidden="true" /> GitHub
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { window.location.href = `${API_BASE_URL}/auth/google`; }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <FaGoogle aria-hidden="true" /> Google
            </motion.button>
          </div>
        </motion.div>

        <motion.p
          className="mt-6 text-center text-sm text-white/50"
          variants={itemVariants}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            state={from ? { from } : undefined}
            className="font-semibold text-cyan-400 transition hover:text-cyan-300 drop-shadow-[0_0_8px_rgba(0,217,255,0.4)]"
          >
            Sign in
          </Link>
        </motion.p>
      </motion.section>
    </main>
  );
};

export default Signup;
