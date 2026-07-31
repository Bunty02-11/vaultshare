import { NavLink, useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext.jsx";

export default function Sidebar() {
  const navigate = useNavigate();
  const { unreadTotal } = useNotifications();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? "bg-app-primary text-app-on-primary shadow-sm"
        : "text-app-muted hover:bg-app-hover hover:text-app-text"
    }`;

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-app-border bg-app-sidebar text-app-text transition-colors">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="flex h-14 shrink-0 items-center border-b border-app-border px-5 text-left"
      >
        <span className="text-lg font-bold tracking-tight text-app-text">VaultShare</span>
      </button>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        <NavLink to="/" end className={linkClass}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          Assets
        </NavLink>
        <NavLink to="/friends" className={linkClass}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-4a4 4 0 11-8 0 4 4 0 018 0zm6 4a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Friends
        </NavLink>
        <NavLink to="/chat" className={linkClass}>
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="flex-1">Chat</span>
          {unreadTotal > 0 && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">
              {unreadTotal > 99 ? "99+" : unreadTotal}
            </span>
          )}
        </NavLink>
      </nav>
    </aside>
  );
}
