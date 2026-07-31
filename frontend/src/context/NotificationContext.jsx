import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import api from "../api/axios.js";
import { useAuth } from "./AuthContext.jsx";
import { useSocket } from "./SocketContext.jsx";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user, token } = useAuth();
  const { socket } = useSocket();

  const [unreadTotal, setUnreadTotal] = useState(0);
  const [byConversation, setByConversation] = useState({});
  const [byFriend, setByFriend] = useState({});
  const [messageNotifs, setMessageNotifs] = useState([]);
  const activeConversationId = useRef(null);

  const loadUnread = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await api.get("/messages/unread");
      setUnreadTotal(data.total || 0);
      setByConversation(data.byConversation || {});
      setByFriend(data.byFriend || {});
      setMessageNotifs(
        (data.notifications || []).map((n) => ({
          id: String(n.conversationId),
          conversationId: String(n.conversationId),
          sender: n.sender,
          text: n.text,
          count: n.count,
          createdAt: n.createdAt,
        }))
      );
    } catch {
      // ignore
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setUnreadTotal(0);
      setByConversation({});
      setByFriend({});
      setMessageNotifs([]);
      return;
    }
    loadUnread();
  }, [token, loadUnread]);

  useEffect(() => {
    if (!socket || !user) return;

    const onNotify = ({ message, conversationId, sender }) => {
      const convoId = String(conversationId);
      const myId = String(user.id || user._id);
      if (String(message.sender) === myId) return;

      if (activeConversationId.current === convoId) {
        api.post(`/messages/${convoId}/read`).catch(() => {});
        return;
      }

      const friendId = String(sender?._id || message.sender);

      setByConversation((prev) => {
        const next = { ...prev, [convoId]: (prev[convoId] || 0) + 1 };
        setUnreadTotal(Object.values(next).reduce((a, b) => a + b, 0));
        return next;
      });

      setByFriend((prev) => ({
        ...prev,
        [friendId]: (prev[friendId] || 0) + 1,
      }));

      setMessageNotifs((prev) => {
        const existing = prev.find((n) => n.conversationId === convoId);
        if (existing) {
          return [
            {
              ...existing,
              text: message.text,
              count: existing.count + 1,
              createdAt: message.createdAt || new Date().toISOString(),
              sender: sender || existing.sender,
            },
            ...prev.filter((n) => n.conversationId !== convoId),
          ];
        }
        return [
          {
            id: convoId,
            conversationId: convoId,
            sender,
            text: message.text,
            count: 1,
            createdAt: message.createdAt || new Date().toISOString(),
          },
          ...prev,
        ];
      });
    };

    socket.on("chat:notify", onNotify);
    return () => socket.off("chat:notify", onNotify);
  }, [socket, user]);

  const setActiveConversation = useCallback((conversationId) => {
    activeConversationId.current = conversationId ? String(conversationId) : null;
  }, []);

  const markConversationRead = useCallback(async (conversationId, friendId) => {
    if (!conversationId) return;
    const convoId = String(conversationId);
    try {
      await api.post(`/messages/${convoId}/read`);
    } catch {
      // ignore
    }

    setByConversation((prev) => {
      const next = { ...prev };
      delete next[convoId];
      setUnreadTotal(Object.values(next).reduce((a, b) => a + b, 0));
      return next;
    });

    if (friendId) {
      setByFriend((prev) => {
        const next = { ...prev };
        delete next[String(friendId)];
        return next;
      });
    } else {
      setMessageNotifs((prev) => {
        const notif = prev.find((n) => n.conversationId === convoId);
        if (notif?.sender?._id) {
          setByFriend((bf) => {
            const next = { ...bf };
            delete next[String(notif.sender._id)];
            return next;
          });
        }
        return prev.filter((n) => n.conversationId !== convoId);
      });
      return;
    }

    setMessageNotifs((prev) => prev.filter((n) => n.conversationId !== convoId));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        unreadTotal,
        byConversation,
        byFriend,
        messageNotifs,
        setActiveConversation,
        markConversationRead,
        refreshUnread: loadUnread,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
