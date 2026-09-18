import React, { useState } from "react";
import TournamentCard from "../components/TournamentCard";
export default function PublicView({ onNavigateAdmin, onLogout }) {
  // Sample or state-driven tournaments list
  const [tournaments] = useState([
    { id: 1, name: "SNB Annual Corporate Cricket Championship 2026", category: "Cricket", venue: "Ground A", status: "Live", teamCount: 8 },
    { id: 3, name: "Weekend Super League T20 Tournament", category: "Cricket", venue: "Ground B", status: "Completed", teamCount: 6 },
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Alignment Fix: flex items-center justify-between with wrap */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight truncate">
            Tournaments Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Explore live matches, schedules, and standings for ongoing sports events.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={onNavigateAdmin}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            Admin Portal
          </button>
        </div>
      </div>

      {/* Grid Layout Fix: Proper breakpoints and gap consistency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((tournament) => (
          <TournamentCard 
            key={tournament.id} 
            tournament={tournament} 
            onSelect={(t) => console.log("Selected tournament:", t.name)} 
          />
        ))}
      </div>
    </div>
  );
}
