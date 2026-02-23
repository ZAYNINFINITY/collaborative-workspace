import React, { useEffect, useState } from "react";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";
import { API_BASE_URL } from "../config";
import logoImage from "../assets/collab-logo.png";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await API.get("/auth/user");
        navigate("/dashboard");
      } catch {
        // Stay on login page
      }
    };
    checkAuth();
  }, [navigate]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setErrors({ form: "Email and password required" });
      setStatusMessage("");
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      setStatusMessage("");

      const res = await API.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      setStatusMessage(`Welcome back, ${res.data.user.displayName}.`);

      navigate("/dashboard");
    } catch (err) {
      const message = err.response?.data?.msg || "Login failed";
      setErrors({ form: message });
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
            Collaborative Workspace
          </h1>
          <p className="mt-2 text-sm text-white/70">Sign in to your account</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <form onSubmit={handleEmailLogin} className="space-y-4">
            {errors.form && (
              <div
                role="alert"
                className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
              >
                {errors.form}
              </div>
            )}

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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
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
          Don&apos;t have an account?{" "}
          <Link className="font-semibold text-cyan-300 hover:text-cyan-200" to="/signup">
            Create one
          </Link>
        </p>
      </section>
    </main>
  );
};

export default Login;
