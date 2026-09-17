import React, { useState } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import Navbar from "./components/Navbar";
import PublicView from "./pages/PublicView";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";

function MainContent() {
  const [activeTab, setActiveTab] = useState("public");
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-snb-bg text-slate-900 font-sans antialiased">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main>
        {activeTab === "public" && <PublicView />}
        {activeTab === "admin" && (currentUser ? <AdminDashboard /> : <Login onSuccess={() => setActiveTab("admin")} />)}
        {activeTab === "login" && <Login onSuccess={() => setActiveTab("admin")} />}
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
