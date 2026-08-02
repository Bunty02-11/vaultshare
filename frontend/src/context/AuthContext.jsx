import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);

const readCachedUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => (token ? readCachedUser() : null));
  // Skip full-screen wait when we already have a cached user
  const [loading, setLoading] = useState(() => Boolean(token) && !readCachedUser());

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        if (cancelled) return;
        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));
      } catch {
        if (cancelled) return;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadUser();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const persistSession = (nextToken, nextUser) => {
    localStorage.setItem("token", nextToken);
    localStorage.setItem("user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
    setLoading(false);
  };

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    persistSession(data.token, data.user);
  };

  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    persistSession(data.token, data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
