import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import Navbar from "./components/Navbar"; // Matches the Navbar component import properly
import PublicView from "./pages/PublicView";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";

function usePath() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
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

  if (isAdminRoute) {
    return (
      <div className="min-h-screen bg-snb-bg text-slate-900 font-sans antialiased">
        {currentUser ? <AdminDashboard onLogout={logout} /> : <Login />}
      </div>
    );
  }

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
