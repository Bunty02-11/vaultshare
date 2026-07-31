import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(form.name, form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-app-border bg-app-card p-8 shadow-md"
      >
        <h1 className="mb-6 text-2xl font-bold text-app-text">Create your account</h1>
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
        <input
          placeholder="Name"
          required
          className="mb-3 w-full rounded border border-app-border bg-app-input px-3 py-2 text-app-text outline-none focus:border-app-primary"
          style={{ color: "var(--input-text)" }}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
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
          className="mb-3 w-full rounded border border-app-border bg-app-input px-3 py-2 text-app-text outline-none focus:border-app-primary"
          style={{ color: "var(--input-text)" }}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button className="w-full rounded bg-app-primary py-2 text-app-on-primary hover:opacity-90">
          Register
        </button>
        <p className="mt-4 text-center text-sm text-app-muted">
          Already have an account?{" "}
          <Link to="/login" className="text-app-primary">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
