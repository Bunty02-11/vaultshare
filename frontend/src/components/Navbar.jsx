import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotifications } from "../context/NotificationContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { messageNotifs, markConversationRead } = useNotifications();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [query, setQuery] = useState("");
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  const loadRequests = async () => {
    try {
      const { data } = await api.get("/friends");
      setRequests(data.received || []);
    } catch {
      setRequests([]);
    }
  };

  useEffect(() => {
    loadRequests();
    const id = setInterval(loadRequests, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const openMessage = async (notif) => {
    setNotifOpen(false);
    const friendId = notif.sender?._id;
    if (friendId) {
      await markConversationRead(notif.conversationId, friendId);
      navigate(`/chat/${friendId}`);
    } else {
      navigate("/chat");
    }
  };

  const openFriendRequest = () => {
    setNotifOpen(false);
    navigate("/friends");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/friends?q=${encodeURIComponent(q)}`);
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || "?";
  const notifCount = requests.length + messageNotifs.reduce((sum, n) => sum + (n.count || 1), 0);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-app-border bg-app-navbar px-5">
      <form onSubmit={handleSearch} className="relative min-w-0 max-w-2xl flex-1">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-app-muted">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
          </svg>
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="h-9 w-full rounded-full border border-app-border bg-app-input pl-9 pr-4 text-sm text-app-text outline-none transition placeholder:text-app-muted focus:border-app-primary focus:ring-2 focus:ring-app-primary/20"
        />
      </form>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              setMenuOpen(false);
              loadRequests();
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-app-muted transition hover:bg-app-hover hover:text-app-text"
            aria-label="Notifications"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notifCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {notifCount > 99 ? "99+" : notifCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-app-border bg-app-card shadow-lg">
              <div className="border-b border-app-border px-4 py-3">
                <p className="text-sm font-semibold text-app-text">Notifications</p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifCount === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-app-muted">No new notifications</p>
                )}

                {messageNotifs.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => openMessage(n)}
                    className="flex w-full items-start gap-3 border-b border-app-border px-4 py-3 text-left hover:bg-app-hover"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-app-border bg-app-accent text-sm font-semibold text-app-on-accent">
                      {n.sender?.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-app-text">
                        {n.sender?.name || "Someone"}
                        {n.count > 1 && (
                          <span className="ml-1 text-xs font-normal text-app-muted">({n.count})</span>
                        )}
                      </p>
                      <p className="truncate text-xs text-app-muted">{n.text}</p>
                    </div>
                    <span className="mt-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-app-primary px-1 text-[10px] font-semibold text-app-on-primary">
                      {n.count}
                    </span>
                  </button>
                ))}

                {requests.map((u) => (
                  <button
                    key={u._id}
                    type="button"
                    onClick={openFriendRequest}
                    className="flex w-full items-start gap-3 border-b border-app-border px-4 py-3 text-left hover:bg-app-hover"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-app-border bg-app-accent text-sm font-semibold text-app-on-accent">
                      {u.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-app-text">{u.name}</p>
                      <p className="text-xs text-app-muted">sent you a friend request</p>
                    </div>
                  </button>
                ))}
              </div>
              <Link
                to="/friends"
                onClick={() => setNotifOpen(false)}
                className="block border-t border-app-border px-4 py-2.5 text-center text-xs font-medium text-app-muted hover:bg-app-hover"
              >
                View all friends
              </Link>
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => {
              setMenuOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-app-border bg-app-primary text-sm font-bold text-app-on-primary shadow-sm transition hover:opacity-90"
            aria-label="Account menu"
          >
            {initial}
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-app-border bg-app-card shadow-lg">
              <div className="border-b border-app-border px-3 py-2">
                <p className="truncate text-sm font-medium text-app-text">{user?.name}</p>
                <p className="truncate text-xs text-app-muted">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/profile");
                }}
                className="block w-full px-3 py-2.5 text-left text-sm text-app-text hover:bg-app-hover"
              >
                Profile
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full px-3 py-2.5 text-left text-sm text-red-500 hover:bg-red-500/10"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
