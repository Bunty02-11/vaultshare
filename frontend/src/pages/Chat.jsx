import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios.js";
import { useSocket } from "../context/SocketContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotifications } from "../context/NotificationContext.jsx";

export default function Chat() {
  const { friendId } = useParams();
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const { byFriend, setActiveConversation, markConversationRead } = useNotifications();

  const [friends, setFriends] = useState([]);
  const [friendQuery, setFriendQuery] = useState("");
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const activeFriend = friends.find((f) => f._id === friendId);

  const filteredFriends = friends.filter((f) => {
    const q = friendQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      f.name?.toLowerCase().includes(q) ||
      f.email?.toLowerCase().includes(q) ||
      f.uniqueId?.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    api.get("/friends").then(({ data }) => setFriends(data.friends));
  }, []);

  useEffect(() => {
    if (!friendId) {
      setConversation(null);
      setMessages([]);
      setActiveConversation(null);
      return;
    }

    let cancelled = false;
    const start = async () => {
      const { data } = await api.get(`/messages/conversations/${friendId}/start`);
      if (cancelled) return;
      setConversation(data);
      setActiveConversation(data._id);
      await markConversationRead(data._id, friendId);
      const { data: msgs } = await api.get(`/messages/${data._id}`);
      if (!cancelled) setMessages(msgs);
    };
    start();

    return () => {
      cancelled = true;
      setActiveConversation(null);
    };
  }, [friendId, setActiveConversation, markConversationRead]);

  useEffect(() => {
    if (!socket || !conversation) return;
    socket.emit("chat:join", conversation._id);

    const onMessage = (msg) => {
      if (String(msg.conversationId) === String(conversation._id)) {
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(msg._id))) return prev;
          return [...prev, msg];
        });
        markConversationRead(conversation._id, friendId);
      }
    };
    const onTyping = ({ isTyping }) => setTyping(isTyping);

    socket.on("chat:message", onMessage);
    socket.on("chat:typing", onTyping);
    return () => {
      socket.off("chat:message", onMessage);
      socket.off("chat:typing", onTyping);
    };
  }, [socket, conversation, friendId, markConversationRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket || !conversation) return;
    socket.emit("chat:message", { conversationId: conversation._id, text });
    setText("");
    socket.emit("chat:typing", { conversationId: conversation._id, isTyping: false });
  };

  const handleTyping = (val) => {
    setText(val);
    if (socket && conversation) {
      socket.emit("chat:typing", { conversationId: conversation._id, isTyping: !!val });
    }
  };

  return (
    <div className="flex h-full min-h-0">
      <div className="flex w-72 shrink-0 flex-col border-r border-app-border bg-app-sidebar">
        <div className="border-b border-app-border px-3 py-3">
          <h2 className="mb-2.5 px-1 text-sm font-semibold text-app-text">Messaging</h2>
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
            </svg>
            <input
              type="search"
              value={friendQuery}
              onChange={(e) => setFriendQuery(e.target.value)}
              placeholder="Search friends"
              className="h-10 w-full rounded-xl border border-app-border bg-app-input pl-9 pr-3 text-sm text-app-text outline-none placeholder:text-app-muted focus:border-app-primary focus:ring-2 focus:ring-app-primary/20"
              style={{ color: "var(--input-text)" }}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {friends.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-app-muted">Add friends to start chatting</p>
          )}
          {friends.length > 0 && filteredFriends.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-app-muted">No friends match your search</p>
          )}
          {filteredFriends.map((f) => {
            const online = onlineUsers.includes(f._id) || onlineUsers.includes(String(f._id));
            const unread = byFriend[String(f._id)] || 0;
            return (
              <Link
                key={f._id}
                to={`/chat/${f._id}`}
                onClick={() => setFriendQuery("")}
                className={`flex items-center gap-3 border-b border-app-border px-4 py-3 transition-colors hover:bg-app-hover ${
                  f._id === friendId ? "bg-app-hover" : ""
                }`}
              >
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-app-border bg-app-accent text-sm font-semibold text-app-on-accent">
                    {f.name?.charAt(0)?.toUpperCase()}
                  </div>
                  {online ? (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-app-sidebar bg-green-500" />
                  ) : (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-app-sidebar bg-red-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-app-text">{f.name}</p>
                    {unread > 0 && f._id !== friendId && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-app-primary px-1.5 text-[11px] font-semibold text-app-on-primary">
                        {unread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-app-muted">{online ? "Online" : "Offline"}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col bg-app-bg">
        {!friendId && (
          <div className="m-auto text-center text-app-muted">
            <p className="text-sm">Select a conversation</p>
          </div>
        )}

        {friendId && (
          <>
            <div className="flex items-center gap-3 border-b border-app-border bg-app-card px-5 py-3">
              <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-app-border bg-app-accent text-sm font-semibold text-app-on-accent">
                  {activeFriend?.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <span
                  className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-app-card ${
                    onlineUsers.includes(friendId) || onlineUsers.includes(String(friendId))
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-app-text">{activeFriend?.name || "Chat"}</p>
                <p className="text-xs text-app-muted">
                  {onlineUsers.includes(friendId) || onlineUsers.includes(String(friendId))
                    ? "Active now"
                    : "Offline"}
                </p>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              <div className="mt-auto flex flex-col justify-end space-y-2 px-5 py-4">
                {messages.length === 0 && (
                  <p className="py-8 text-center text-sm text-app-muted">No messages yet — say hello</p>
                )}
                {messages.map((m) => {
                  const mine = String(m.sender) === String(user.id || user._id);
                  const initial = mine
                    ? user?.name?.charAt(0)?.toUpperCase() || "?"
                    : activeFriend?.name?.charAt(0)?.toUpperCase() || "?";
                  return (
                    <div
                      key={m._id}
                      className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}
                    >
                      {!mine && (
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-app-border bg-app-accent text-xs font-bold text-app-on-accent"
                          title={activeFriend?.name || "Friend"}
                        >
                          {initial}
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                          mine
                            ? "rounded-br-md border border-green-500 bg-app-primary text-app-on-primary"
                            : "rounded-bl-md bg-app-card text-app-text shadow-sm ring-1 ring-app-border"
                        }`}
                      >
                        {m.text}
                      </div>
                      {mine && (
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-green-500 bg-app-primary text-xs font-bold text-app-on-primary"
                          title={user?.name || "You"}
                        >
                          {initial}
                        </div>
                      )}
                    </div>
                  );
                })}
                {typing && <p className="pl-1 text-xs text-app-muted">typing...</p>}
                <div ref={bottomRef} />
              </div>
            </div>

            <form
              onSubmit={sendMessage}
              className="flex items-center gap-2 border-t border-app-border bg-app-card px-4 py-3"
            >
              <input
                className="flex-1 rounded-full border border-app-border bg-app-input px-4 py-2.5 text-sm text-app-text outline-none placeholder:text-app-muted focus:border-app-primary focus:ring-2 focus:ring-app-primary/20"
                style={{ color: "var(--input-text)" }}
                placeholder="Write a message..."
                value={text}
                onChange={(e) => handleTyping(e.target.value)}
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="rounded-full bg-app-primary px-5 py-2.5 text-sm font-medium text-app-on-primary hover:opacity-90 disabled:opacity-40"
              >
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
