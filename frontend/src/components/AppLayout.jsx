import Navbar from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";

export default function AppLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-app-bg text-app-text">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="min-h-0 flex-1 overflow-y-auto bg-app-bg">{children}</main>
      </div>
    </div>
  );
}
