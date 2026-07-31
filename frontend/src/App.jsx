import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import AppLayout from "./components/AppLayout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Friends from "./pages/Friends.jsx";
import Chat from "./pages/Chat.jsx";
import Profile from "./pages/Profile.jsx";

const Private = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-app-bg text-app-muted">
        Loading...
      </div>
    );
  }
  return user ? children : <Navigate to="/login" />;
};

function App() {
  const { user } = useAuth();

  return (
    <SocketProvider>
      <NotificationProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <Private>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </Private>
            }
          />
          <Route
            path="/friends"
            element={
              <Private>
                <AppLayout>
                  <Friends />
                </AppLayout>
              </Private>
            }
          />
          <Route
            path="/chat/:friendId?"
            element={
              <Private>
                <AppLayout>
                  <Chat />
                </AppLayout>
              </Private>
            }
          />
          <Route
            path="/profile"
            element={
              <Private>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </Private>
            }
          />
          <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
        </Routes>
      </NotificationProvider>
    </SocketProvider>
  );
}

export default App;
