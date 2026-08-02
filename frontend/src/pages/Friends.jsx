import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios.js";
import { useSocket } from "../context/SocketContext.jsx";

function Avatar({ name, online, size = "lg" }) {
  const sizeCls = size === "lg" ? "h-20 w-20 text-2xl" : "h-12 w-12 text-lg";
  return (
    <div className="relative inline-flex">
      <div
        className={`flex ${sizeCls} items-center justify-center rounded-full border-2 border-app-border bg-app-accent font-bold text-app-on-accent shadow-sm`}
      >
        {name?.charAt(0)?.toUpperCase() || "?"}
      </div>
      {online != null && (
        <span
          className={`absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full border-[3px] border-app-card ${
            online ? "bg-green-500" : "bg-red-500"
          }`}
        />
      )}
    </div>
  );
}

export default function Friends() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { socket, onlineUsers } = useSocket();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [data, setData] = useState({ friends: [], received: [], sent: [] });
  const [showAdd, setShowAdd] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: next } = await api.get("/friends");
    setData(next);
    setLoading(false);
  };

  const runSearch = async (q) => {
    if (!q.trim()) return setResults([]);
    const { data: found } = await api.get(`/friends/search?q=${encodeURIComponent(q)}`);
    setResults(found);
  };

  useEffect(() => {
    load();
  }, []);

  // Live friend request / accept / unfriend updates (no reload needed)
  useEffect(() => {
    if (!socket) return;

    const onRequest = ({ from }) => {
      if (!from?._id) return;
      setData((prev) => {
        if (prev.received.some((u) => String(u._id) === String(from._id))) return prev;
        return { ...prev, received: [from, ...prev.received] };
      });
    };

    const onRespond = ({ action, by }) => {
      if (!by?._id) return;
      setData((prev) => {
        const next = {
          ...prev,
          sent: prev.sent.filter((u) => String(u._id) !== String(by._id)),
        };
        if (action === "accept") {
          const alreadyFriend = prev.friends.some((u) => String(u._id) === String(by._id));
          if (!alreadyFriend) next.friends = [...prev.friends, by];
        }
        return next;
      });
    };

    const onRemoved = ({ by }) => {
      if (!by?._id) return;
      setData((prev) => ({
        ...prev,
        friends: prev.friends.filter((u) => String(u._id) !== String(by._id)),
      }));
    };

    socket.on("friend:request", onRequest);
    socket.on("friend:respond", onRespond);
    socket.on("friend:removed", onRemoved);
    return () => {
      socket.off("friend:request", onRequest);
      socket.off("friend:respond", onRespond);
      socket.off("friend:removed", onRemoved);
    };
  }, [socket]);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q) {
      setQuery(q);
      setShowAdd(true);
      runSearch(q);
    }
  }, [searchParams]);

  const search = async (e) => {
    e.preventDefault();
    setShowAdd(true);
    runSearch(query);
  };

  const sendRequest = async (id) => {
    if (busyId) return;
    setBusyId(id);
    setResults((prev) => prev.filter((r) => r._id !== id));
    try {
      await api.post(`/friends/request/${id}`);
      load();
    } catch {
      await load();
      runSearch(query);
    } finally {
      setBusyId(null);
    }
  };

  const respond = async (id, action) => {
    if (busyId) return;
    setBusyId(id);

    const requester = data.received.find((u) => String(u._id) === String(id));
    // Optimistic UI — remove request instantly so a second click can't fire
    setData((prev) => ({
      ...prev,
      received: prev.received.filter((u) => String(u._id) !== String(id)),
      friends:
        action === "accept" && requester
          ? [...prev.friends, requester]
          : prev.friends,
    }));

    try {
      await api.post(`/friends/respond/${id}`, { action });
      window.dispatchEvent(
        new CustomEvent("friend:local-update", { detail: { id, action } })
      );
    } catch {
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const unfriend = async (id, name) => {
    if (busyId) return;
    if (!window.confirm(`Unfriend ${name}?`)) return;
    setBusyId(id);
    const removed = data.friends.find((u) => String(u._id) === String(id));
    setData((prev) => ({
      ...prev,
      friends: prev.friends.filter((u) => String(u._id) !== String(id)),
    }));
    try {
      await api.delete(`/friends/${id}`);
    } catch {
      if (removed) {
        setData((prev) => ({ ...prev, friends: [...prev.friends, removed] }));
      } else {
        await load();
      }
    } finally {
      setBusyId(null);
    }
  };

  const isOnline = (id) =>
    onlineUsers.includes(id) || onlineUsers.includes(String(id));

  const onlineFriends = data.friends.filter((f) => isOnline(f._id));
  const offlineFriends = data.friends.filter((f) => !isOnline(f._id));

  const FriendCard = ({ u, online }) => (
    <div className="flex flex-col items-center rounded-2xl border border-app-border bg-app-card px-4 py-5 text-center transition hover:border-app-primary/40 hover:shadow-sm">
      <Avatar name={u.name} online={online} />
      <p className="mt-3 max-w-full truncate text-sm font-semibold text-app-text">
        {u.name}
      </p>
      <p className="mt-0.5 max-w-full truncate text-xs text-app-muted">
        #{u.uniqueId || "----"}
      </p>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(`/chat/${u._id}`)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-app-border bg-app-hover text-app-text transition hover:border-app-primary hover:bg-app-primary hover:text-app-on-primary"
          aria-label={`Message ${u.name}`}
          title="Message"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
        <button
          type="button"
          disabled={busyId === u._id}
          onClick={() => unfriend(u._id, u.name)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-app-border bg-app-hover text-app-muted transition hover:border-red-400/50 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
          aria-label={`Unfriend ${u.name}`}
          title="Unfriend"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a7 7 0 00-7 7h8m6-6l4 4m0 0l-4 4m4-4H13"
            />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <form onSubmit={search} className="mb-8 flex items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <input
            className="h-14 w-full rounded-2xl border border-app-border bg-app-input px-5 pr-14 text-base text-app-text outline-none transition placeholder:text-app-muted focus:border-app-primary focus:ring-2 focus:ring-app-primary/20"
            style={{ color: "var(--input-text)" }}
            placeholder="Search Friends"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className="absolute inset-y-0 right-0 flex w-14 items-center justify-center text-app-muted hover:text-app-text"
            aria-label="Search"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAdd((v) => !v);
            if (showAdd) setResults([]);
          }}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-app-border bg-app-card text-app-text transition hover:bg-app-hover"
          title="Find people"
          aria-label="Find people"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
        </button>
      </form>

      {loading && (
        <p className="mb-6 text-sm text-app-muted">Loading friends…</p>
      )}

      {showAdd && results.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-app-muted">
            Search results
          </h2>
          <div className="space-y-2">
            {results.map((u) => (
              <div
                key={u._id}
                className="flex items-center justify-between rounded-2xl border border-app-border bg-app-card px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={u.name} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-app-text">{u.name}</p>
                    <p className="truncate text-xs text-app-muted">
                      {u.email} · #{u.uniqueId}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busyId === u._id}
                  onClick={() => sendRequest(u._id)}
                  className="shrink-0 rounded-xl bg-app-primary px-3 py-1.5 text-sm font-medium text-app-on-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busyId === u._id ? "Sending…" : "Add Friend"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {showAdd && query.trim() && results.length === 0 && (
        <p className="mb-8 text-center text-sm text-app-muted">No users found</p>
      )}

      {data.received.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-app-muted">
            Friend requests — {data.received.length}
          </h2>
          <div className="space-y-2">
            {data.received.map((u) => {
              const busy = busyId === u._id;
              return (
                <div
                  key={u._id}
                  className="flex items-center justify-between rounded-2xl border border-app-border bg-app-card px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={u.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-app-text">{u.name}</p>
                      <p className="text-xs text-app-muted">#{u.uniqueId}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!!busyId}
                      onClick={() => respond(u._id, "accept")}
                      className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busy ? "Accepting…" : "Accept"}
                    </button>
                    <button
                      type="button"
                      disabled={!!busyId}
                      onClick={() => respond(u._id, "reject")}
                      className="rounded-xl border border-app-border px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busy ? "…" : "Reject"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="mb-10">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-app-muted">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
          Online — {onlineFriends.length}
        </h2>
        {onlineFriends.length === 0 ? (
          <p className="text-sm text-app-muted">No friends online</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {onlineFriends.map((u) => (
              <FriendCard key={u._id} u={u} online />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-app-muted">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
          Offline — {offlineFriends.length}
        </h2>
        {offlineFriends.length === 0 && data.friends.length === 0 ? (
          <p className="text-sm text-app-muted">No friends yet. Search above to add someone.</p>
        ) : offlineFriends.length === 0 ? (
          <p className="text-sm text-app-muted">Everyone is online</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {offlineFriends.map((u) => (
              <FriendCard key={u._id} u={u} online={false} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
