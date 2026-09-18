import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import PublicView from "./pages/PublicView";
import Login from "./pages/Login";

// Tracks the current browser path for route handling
function usePath() {
  const [path, setPath] = useState(window.location.pathname);
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return path;
}

function MainContent() {
  const path = usePath();
  const { currentUser, logout } = useAuth();
  const isAdminRoute = path.startsWith("/admin");

  // Secure admin routes (e.g., yourdomain.com/admin) -> isolated from public layout
  if (isAdminRoute) {
    return (
      <div className="min-h-screen bg-snb-bg text-slate-900 font-sans antialiased">
        {currentUser ? <AdminDashboard onLogout={logout} /> : <Login />}
    );
  }

  // Public site layout with responsive navigation and hidden admin controls
  return (
    <div className="min-h-screen bg-snb-bg text-slate-900 font-sans antialiased">
      <Navbar />
      <main>
        <PublicView />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
