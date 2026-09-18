import React, { useState } from "react";

export default function AdminDashboard() {

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
          <h1 className="text-2xl font-black text-white tracking-tight truncate">
            Admin Control Panel
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage teams, schedules, players, and live scores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveSubTab("tournaments")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            }`}
          >
            Tournaments
          </button>
          <button 
            onClick={() => setActiveSubTab("teams")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSubTab === "teams" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            Teams & Players
          </button>
        </div>
      </div>

      {/* Content Grid Area with proper min-w-0 */}
      <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-6 shadow-xl min-w-0">
          <h2 className="text-lg font-bold text-white">Manage Tournaments</h2>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow transition-colors">
            + Create New Tournament
          </button>
        </div>

        {/* Table or Card listing placeholder */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
              <tr>
                <th className="py-3 px-4 rounded-l-lg">Tournament Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 rounded-r-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              <tr>
                <td className="py-4 px-4 font-medium text-white truncate max-w-xs">
                  SNB Annual Corporate Cricket Championship 2026
                </td>
                <td className="py-4 px-4">Cricket</td>
                <td className="py-4 px-4"><span className="text-red-400 font-semibold">Live</span></td>
                  <button className="text-blue-400 hover:underline font-medium">Edit</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
