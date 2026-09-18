import React from "react";
  return (
    <div 
      onClick={() => onSelect && onSelect(tournament)}
      className="bg-slate-800 border border-slate-700/80 rounded-xl p-5 shadow-lg hover:border-slate-600 transition-all cursor-pointer flex flex-col justify-between min-w-0"
    >
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2 mb-2">
            {tournament.category || "Cricket"}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
            tournament.status === 'Live' ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-slate-700 text-slate-300'
            {tournament.status || "Upcoming"}
          </span>
        </div>

        {/* Name truncation to handle long titles safely without breaking grid */}
        <h3 className="text-lg font-bold text-white truncate mb-1">
        </h3>
        <p className="text-sm text-slate-400 truncate">
          📍 {tournament.venue || "Main Ground"}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
        <span className="text-blue-400 font-medium hover:underline">View Details &rarr;</span>
    </div>
  );
}
