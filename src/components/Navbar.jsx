import React from "react";
import { Trophy, LogIn, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "../AuthContext";

export default function Navbar({ activeTab, setActiveTab }) {
  const { currentUser, logout } = useAuth();

  return (
    <nav className="bg-snb-dark text-white border-b-2 border-snb-accent shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex justify-between items-center">
        {/* Brand Logo */}
        <div 
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => setActiveTab("public")}
        >
          <div className="bg-snb-accent p-2 rounded-lg text-snb-dark group-hover:scale-105 transition">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-white block">Tech Tournaments</span>
            <span className="text-[10px] text-snb-accent font-semibold tracking-widest uppercase block -mt-1">Sports Portal</span>
          </div>
        </div>

        {/* Links & Auth */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setActiveTab("public")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'public' ? 'bg-snb-green text-snb-accent border border-snb-accent/40' : 'hover:bg-snb-green/50 text-slate-200'}`}
          >
            Matches & Scores
          </button>

          {currentUser ? (
            <>
              <button 
                onClick={() => setActiveTab("admin")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'admin' ? 'bg-snb-green text-snb-accent border border-snb-accent/40' : 'hover:bg-snb-green/50 text-slate-200'}`}
              >
                <LayoutDashboard className="w-4 h-4 text-snb-accent" /> Admin Panel
              </button>
              <button 
                onClick={logout}
                className="flex items-center gap-1 bg-red-700 hover:bg-red-800 px-3.5 py-2 rounded-lg text-xs font-bold text-white transition"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          ) : (
            <button 
              onClick={() => setActiveTab("login")}
              className="flex items-center gap-1.5 bg-snb-accent hover:bg-snb-goldLight text-snb-dark px-4 py-2 rounded-lg text-xs font-extrabold transition shadow-sm"
            >
              <LogIn className="w-4 h-4" /> Admin Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
