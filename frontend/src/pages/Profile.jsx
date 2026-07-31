import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(user.uniqueId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="overflow-hidden rounded-2xl border border-app-border bg-app-card shadow-sm">
        <div className="border-b border-app-border bg-app-sidebar px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-app-border bg-app-accent text-2xl font-bold text-app-on-accent shadow-sm">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-app-muted">Your Profile</p>
              <h1 className="mt-1 text-2xl font-semibold text-app-text">{user.name}</h1>
              <p className="mt-1 text-sm text-app-muted">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-app-border bg-app-bg/50 p-4">
              <p className="text-sm text-app-muted">Full Name</p>
              <p className="mt-1 font-semibold text-app-text">{user.name}</p>
            </div>
            <div className="rounded-xl border border-app-border bg-app-bg/50 p-4">
              <p className="text-sm text-app-muted">Email</p>
              <p className="mt-1 font-semibold text-app-text">{user.email}</p>
            </div>
          </div>

          <div className="rounded-xl border border-app-border bg-app-bg/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-app-muted">Unique ID</p>
                <p className="mt-1 font-semibold text-app-text">{user.uniqueId}</p>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-lg bg-app-primary px-4 py-2 text-sm font-medium text-app-on-primary hover:opacity-90"
              >
                {copied ? "Copied!" : "Copy ID"}
              </button>
            </div>
            <p className="mt-3 text-sm text-app-muted">
              Friends can search for you using this ID even if they share the same name.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/friends")}
              className="rounded-lg border border-app-border px-4 py-2 text-sm font-medium text-app-text hover:bg-app-hover"
            >
              Find Friends
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
