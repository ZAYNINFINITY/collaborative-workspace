import React, { useState } from "react";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";
import { API_BASE_URL } from "../config";
import logoImage from "../assets/collab-logo.png";
import { useAuth } from "../auth/useAuth";

const Signup = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const isStrongPassword = (password) => {
    if (!password || password.length < 8) return false;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    return hasUpper && hasLower && hasNumber && hasSpecial;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = "Name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!isStrongPassword(formData.password)) {
      newErrors.password =
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setStatusMessage("");
      await API.post("/auth/signup", {
        displayName: formData.displayName,
        email: formData.email,
        password: formData.password,
      });
      setStatusMessage("Account created. Redirecting to setup…");
      await refreshUser();
      navigate("/onboarding", { replace: true });
    } catch (err) {
      const message = !err.response
        ? "Cannot reach the server right now. Check your connection and retry."
        : err.response?.data?.msg || "Failed to create account";
      setErrors((prev) => ({ ...prev, form: message }));
      setStatusMessage("");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img
            src={logoImage}
            alt="Collab logo"
            className="mx-auto mb-3 h-12 w-12 rounded-lg"
          />
          <h1 className="text-2xl font-semibold tracking-tight text-cyan-300">
            Create Account
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Join Collab and start collaborating with your team
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <form onSubmit={handleSignup} className="space-y-4">
            {errors.form && (
              <div
                role="alert"
                className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
              >
                {errors.form}
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="displayName" className="text-sm font-medium text-white/90">
                Full Name
              </label>
              <input
                id="displayName"
                aria-label="Full Name"
                type="text"
                name="displayName"
                placeholder="John Doe"
                value={formData.displayName}
                onChange={handleChange}
                className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
              />
              {errors.displayName && (
                <p className="text-xs text-red-300">{errors.displayName}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-white/90">
                Email
              </label>
              <input
                id="email"
                aria-label="Email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
              />
              {errors.email && <p className="text-xs text-red-300">{errors.email}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium text-white/90">
                Password
              </label>
              <input
                id="password"
                aria-label="Password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
              />
              {errors.password && (
                <p className="text-xs text-red-300">{errors.password}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-white/90">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                aria-label="Confirm Password"
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-300">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            {statusMessage && (
              <p className="text-center text-sm text-emerald-300">{statusMessage}</p>
            )}
          </form>

          <div className="my-6 h-px w-full bg-white/10" />

          <p className="mb-3 text-center text-sm text-white/60">Or continue with</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                window.location.href = `${API_BASE_URL}/auth/github`;
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <FaGithub aria-hidden="true" />
              GitHub
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = `${API_BASE_URL}/auth/google`;
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <FaGoogle aria-hidden="true" />
              Google
            </button>
          </div>

        </div>

        <p className="mt-6 text-center text-sm text-white/70">
          Already have an account?{" "}
          <Link className="font-semibold text-cyan-300 hover:text-cyan-200" to="/login">
            Sign In
          </Link>
        </p>
      </section>
    </main>
  );
};

export default Signup;
