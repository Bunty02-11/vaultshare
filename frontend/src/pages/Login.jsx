import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-app-border bg-app-card p-8 shadow-md"
      >
        <h1 className="mb-6 text-2xl font-bold text-app-text">
          Log in to VaultShare
        </h1>
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          required
          className="mb-3 w-full rounded border border-app-border bg-app-input px-3 py-2 text-app-text outline-none focus:border-app-primary"
          style={{ color: "var(--input-text)" }}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          required
          className="mb-4 w-full rounded border border-app-border bg-app-input px-3 py-2 text-app-text outline-none focus:border-app-primary"
          style={{ color: "var(--input-text)" }}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button className="w-full rounded bg-app-primary py-2 text-app-on-primary hover:opacity-90">
          Log in
        </button>
        <p className="mt-4 text-center text-sm text-app-muted">
          No account?{" "}
          <Link to="/register" className="text-app-primary">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
