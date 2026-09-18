import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { Trophy, Award, Activity, Radio, Camera, ImageIcon, X, Maximize2, Minimize2, LogOut, GitCommit } from "lucide-react";

  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [publicTab, setPublicTab] = useState("matches"); // "matches" | "standings" | "bracket" | "gallery"
  const [expandedMatchId, setExpandedMatchId] = useState(null);

  useEffect(() => {
    const unsubTourn = onSnapshot(collection(db, "tournaments"), (snap) => {
      setTournaments(list);
      if (list.length > 0 && !selectedTournamentId) setSelectedTournamentId(list[0].id);
    });

    const unsubMatches = onSnapshot(collection(db, "matches"), (snap) => {
      setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubTourn(); unsubMatches(); };
  }, [selectedTournamentId]);

  const activeTourn = tournaments.find(t => t.id === selectedTournamentId);
  const activeMatches = matches.filter(m => m.tournamentId === selectedTournamentId);

  const qfMatches = activeMatches.filter(m => m.stage === "Quarter-Final");
  const sfMatches = activeMatches.filter(m => m.stage === "Semi-Final");
  const finalMatches = activeMatches.filter(m => m.stage === "Final");

  const getEmbedUrl = (url) => {
    if (!url) return "";
    if (url.includes("youtube.com/watch?v=")) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    return url;
  };

  const getTeamInfo = (teamName) => {
    if (!activeTourn?.groups) return { groupName: "", photos: [], players: [] };
      const foundTeam = (group.teams || []).find(t => t.name === teamName);
      if (foundTeam) {
        return {
          groupName: group.name,
          photos: foundTeam.photos || [],
          players: foundTeam.players || []
        };
      }
    }
    return { groupName: "", photos: [], players: [] };
  const computeStandings = () => {
    if (!activeTourn) return [];

    let teamStats = {};
    (activeTourn.groups || []).forEach(group => {
      (group.teams || []).forEach(team => {
        teamStats[team.name] = { name: team.name, group: group.name, played: 0, won: 0, lost: 0, drawn: 0, points: 0 };
      });
    });

    activeMatches.filter(m => m.status === "COMPLETED").forEach(match => {
      if (teamStats[match.teamA]) teamStats[match.teamA].played += 1;

      if (match.winner === match.teamA) {
        if (teamStats[match.teamA]) { teamStats[match.teamA].won += 1; teamStats[match.teamA].points += 2; }
        if (teamStats[match.teamB]) { teamStats[match.teamB].lost += 1; }
      } else if (match.winner === match.teamB) {
        if (teamStats[match.teamB]) { teamStats[match.teamB].won += 1; teamStats[match.teamB].points += 2; }
      } else {
        if (teamStats[match.teamA]) { teamStats[match.teamA].drawn += 1; teamStats[match.teamA].points += 1; }
      }
    });

    return Object.values(teamStats).sort((a, b) => b.points - a.points || b.won - a.won);
  };

  const standings = computeStandings();

  const tournamentPhotos = (activeTourn?.photos || []).map(p => ({ url: p, label: "Tournament Photo" }));
  const groupPhotos = (activeTourn?.groups || []).flatMap(g => (g.photos || []).map(p => ({ url: p, label: `Group: ${g.name}` })));
  const teamPhotos = (activeTourn?.groups || []).flatMap(g => (g.teams || []).flatMap(tm => (tm.photos || []).map(p => ({ url: p, label: `Team: ${tm.name}` }))));

  const allTournamentMedia = [...tournamentPhotos, ...groupPhotos, ...teamPhotos, ...playerPhotos];

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      {/* FULLY RESPONSIVE STRUCTURED HEADER */}
      <header className="border-b border-slate-800 bg-slate-950 px-3 py-3 shadow-md">
        <div className="max-w-7xl mx-auto space-y-3">
          
          {/* Top Row: Brand & Primary Controls */}
          <div className="flex items-center justify-between gap-2">
            {/* LOGO */}
            <div className="flex items-center space-x-2 shrink-0">
              <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <Trophy className="text-amber-400" size={16} />
              <span className="text-xs font-black tracking-wider text-slate-200 uppercase">Tech Tournaments</span>
            </div>

            {/* CONTROLS (Dropdown, Media count, Logout) */}
            <div className="flex items-center space-x-2">
                value={selectedTournamentId}
                onChange={(e) => setSelectedTournamentId(e.target.value)}
                className="bg-emerald-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg max-w-[150px] sm:max-w-xs focus:outline-none cursor-pointer truncate shadow-xs"
              >
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.sport})</option>
                ))}
              </select>

              <button 
                onClick={() => setGalleryModalOpen(true)}
                className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center space-x-1 shadow-xs transition shrink-0"
                title="Media Gallery"
              >
                <Camera size={13} />
                <span>({allTournamentMedia.length})</span>
              </button>

              {onLogout && (
                <button 
                  onClick={onLogout}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition shadow-xs shrink-0"
                  title="Logout"
                >
                  <LogOut size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Bottom Row: Tab Switcher (Scrollable on small mobile screens) */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto no-scrollbar">
            {[
              { id: "matches", name: "Fixtures", icon: Activity },
              { id: "standings", name: "Standings", icon: Award },
              { id: "gallery", name: "Media", icon: ImageIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPublicTab(tab.id)}
                className={`flex-1 min-w-[85px] sm:min-w-0 flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  publicTab === tab.id ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <tab.icon size={13} />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

        </div>
      </header>

      <main className="p-3 sm:p-5 max-w-7xl mx-auto space-y-4">
        {publicTab === "matches" && (
          <section className="space-y-3">
            <h2 className="text-xs font-black tracking-wider uppercase flex items-center space-x-1.5 text-emerald-400">
              <Activity size={15} />
              <span>Realtime Live & Upcoming Fixtures</span>

            {activeMatches.length === 0 ? (
              <p className="text-xs text-slate-500">No scheduled matches found for this tournament.</p>
              <div className={`grid grid-cols-1 ${expandedMatchId ? 'lg:grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'} gap-3 transition-all duration-300`}>
                {activeMatches.map((m) => {
                  const isExpanded = expandedMatchId === m.id;
                  const infoA = getTeamInfo(m.teamA);
                  const infoB = getTeamInfo(m.teamB);
                  return (
                    <div 
                      key={m.id} 
                      className={`bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 relative overflow-hidden shadow-xl space-y-3 transition-all duration-300 ${
                        isExpanded ? 'lg:col-span-1 border-emerald-500/80 ring-2 ring-emerald-500/30 bg-slate-800' : ''
                    >
                      {m.status === "LIVE" && (
                        <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-bl-xl flex items-center space-x-1 animate-pulse z-20 shadow-md">
                          <span>LIVE</span>
                      )}

                      {m.videoUrl && (
                        <div className={`relative rounded-lg overflow-hidden bg-black border border-slate-700 shadow-inner transition-all duration-300 ${
                          isExpanded ? 'aspect-[21/9] lg:aspect-[2.4/1]' : 'aspect-video'
                          <iframe 
                            src={getEmbedUrl(m.videoUrl)} 
                            title="Match Stream" 
                            className="w-full h-full border-0 absolute inset-0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                          ></iframe>

                          <button 
                            onClick={() => setExpandedMatchId(isExpanded ? null : m.id)}
                          >
                            {isExpanded ? (
                              <>
                                <Minimize2 size={12} />
                                <span>Collapse</span>
                              </>
                            ) : (
                              <>
                                <Maximize2 size={12} />
                                <span>Expand</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-700 shadow-md">
                        <div className="flex-1 truncate">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] bg-indigo-900 text-indigo-200 px-2 py-0.5 rounded font-bold">{m.stage || "League"}</span>
                            <h3 className="font-extrabold text-xs text-slate-300 truncate">{m.teamA}</h3>
                          <p className="text-2xl font-black text-amber-400 mt-1 tracking-tight">
                            {activeTourn?.sport === 'Badminton' ? `${m.scoreA || 0} Sets` : (m.scoreA || 0)}
                          </p>
                        </div>

                        <span className="text-xs font-black text-slate-500 px-3 uppercase tracking-widest">VS</span>

                        <div className="flex-1 text-right truncate">
                          <h3 className="font-extrabold text-xs text-slate-300 truncate">{m.teamB}</h3>
                          <p className="text-2xl font-black text-amber-400 mt-1 tracking-tight">
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/50 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1.5 overflow-x-auto max-w-[45%]">
                          {infoA.photos.map((p, idx) => (
                            <img key={`ta-${idx}`} src={p} alt="Team" className="w-5 h-5 rounded object-cover border border-slate-600" title="Team Photo" />
                          ))}
                          {infoA.players.flatMap(pl => pl.photos || []).map((p, idx) => (
                            <img key={`pa-${idx}`} src={p} alt="Player" className="w-5 h-5 rounded-full object-cover border border-emerald-500/50" title="Player Photo" />
                          ))}
                          {infoA.photos.length === 0 && infoA.players.flatMap(pl => pl.photos || []).length === 0 && (
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5 justify-end overflow-x-auto max-w-[45%]">
                          {infoB.photos.length === 0 && infoB.players.flatMap(pl => pl.photos || []).length === 0 && (
                          )}
                          {infoB.photos.map((p, idx) => (
                          ))}
                          {infoB.players.flatMap(pl => pl.photos || []).map((p, idx) => (
                            <img key={`pb-${idx}`} src={p} alt="Player" className="w-5 h-5 rounded-full object-cover border border-emerald-500/50" title="Player Photo" />
                          ))}
                          <span className="text-slate-400 font-bold truncate">:{m.teamB}</span>
                        </div>
                      </div>

                      {activeTourn?.sport === 'Badminton' && (
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Set-by-Set Score Breakdown:</span>
                          <div className="grid grid-cols-3 gap-2 text-center">
                              <div key={idx} className="bg-slate-800 p-1.5 rounded-md border border-slate-700">
                                <span className="text-[9px] font-bold text-slate-400 block">Set {idx + 1}</span>
                                <span className="text-sm font-black text-amber-300">
                                </span>
                              </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-xs">
                         <span className="text-slate-400 font-medium">{m.date} at {m.time}</span>
                         <span className="font-black text-xs text-emerald-400 tracking-wide">{m.result || "Scheduled"}</span>
                      </div>
                    </div>
                  );
              </div>
            )}
          </section>
        )}

        {publicTab === "standings" && (
          <section className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 shadow-xl">
              <Award size={16} />
              <span>Official League Standings ({activeTourn?.name || "Tournament"})</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 font-bold uppercase text-[11px]">
                    <th className="py-2.5 px-3">Pos</th>
                    <th className="py-2.5 px-3">Team</th>
                    <th className="py-2.5 px-3">Group</th>
                    <th className="py-2.5 px-3 text-center">Played</th>
                    <th className="py-2.5 px-3 text-center">Won</th>
                    <th className="py-2.5 px-3 text-center">Lost</th>
                    <th className="py-2.5 px-3 text-center font-extrabold text-amber-400">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {standings.map((team, idx) => (
                    <tr key={team.name} className="hover:bg-slate-700/30 transition">
                      <td className="py-3 px-3 font-extrabold text-white">{team.name}</td>
                      <td className="py-3 px-3 text-slate-400">{team.group}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-300">{team.played}</td>
                      <td className="py-3 px-3 text-center font-bold text-red-400">{team.lost}</td>
                      <td className="py-3 px-3 text-center font-black text-amber-400 text-sm">{team.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {publicTab === "bracket" && (
          <section className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h2 className="text-xs font-black tracking-wider uppercase flex items-center space-x-1.5 text-amber-400">
                <GitCommit size={16} />
                <span>Tournament Hierarchy & Bracket ({activeTourn?.name})</span>
              <span className="text-xs bg-emerald-900 text-emerald-300 px-3 py-1 rounded-full font-bold">{activeTourn?.sport}</span>
            </div>

            <div className="overflow-x-auto py-2">
              <div className="min-w-[750px] flex items-center justify-between space-x-6">
                
                {/* 1. GROUPS */}
                <div className="flex-1 space-y-2.5">
                  <div className="bg-slate-900 text-slate-200 text-center py-2.5 rounded-lg text-xs font-black uppercase">
                    1. Groups Stage
                  </div>
                  <div className="space-y-2">
                    {(!activeTourn?.groups || activeTourn.groups.length === 0) ? (
                      <p className="text-xs text-slate-400 text-center italic p-3 bg-slate-900/50 rounded-lg border border-slate-700">No groups</p>
                    ) : (
                      activeTourn.groups.map(g => (
                        <div key={g.id} className="bg-slate-900 p-3 rounded-lg border border-slate-700 space-y-0.5">
                          <span className="text-xs font-bold text-white">{g.name}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="text-slate-500 font-bold text-lg">➔</div>

                {/* 2. QUARTER FINALS */}
                <div className="flex-1 space-y-2.5">
                  <div className="bg-indigo-950 text-indigo-200 text-center py-2.5 rounded-lg text-xs font-black uppercase">
                  </div>
                  <div className="space-y-2">
                    {qfMatches.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center italic p-3 bg-slate-900/50 rounded-lg border border-slate-700">None</p>
                    ) : (
                      qfMatches.map(m => (
                        <div key={m.id} className="bg-slate-900 p-3 rounded-lg border border-indigo-500/40 text-xs space-y-1">
                            <span>{m.teamA}</span>
                            <span className="text-indigo-400 font-black">vs</span>
                          </div>
                          <p className="text-[10px] text-slate-400 text-center">Winner: <strong className="text-emerald-400">{m.winner || "TBD"}</strong></p>
                      ))
                    )}
                  </div>
                </div>

                <div className="text-slate-500 font-bold text-lg">➔</div>

                {/* 3. SEMI FINALS */}
                <div className="flex-1 space-y-2.5">
                  <div className="bg-blue-950 text-blue-200 text-center py-2.5 rounded-lg text-xs font-black uppercase">
                    3. Semi-Finals
                  </div>
                  <div className="space-y-2">
                    {sfMatches.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center italic p-3 bg-slate-900/50 rounded-lg border border-slate-700">None</p>
                      sfMatches.map(m => (
                        <div key={m.id} className="bg-slate-900 p-3 rounded-lg border border-blue-500/40 text-xs space-y-1">
                            <span>{m.teamA}</span>
                            <span className="text-blue-400 font-black">vs</span>
                          </div>
                          <p className="text-[10px] text-slate-400 text-center">Winner: <strong className="text-emerald-400">{m.winner || "TBD"}</strong></p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="text-slate-500 font-bold text-lg">➔</div>

                {/* 4. FINALS */}
                <div className="flex-1 space-y-2.5">
                  <div className="bg-amber-950 text-amber-200 text-center py-2.5 rounded-lg text-xs font-black uppercase flex items-center justify-center space-x-1">
                    <Trophy size={13} />
                    <span>4. Final</span>
                  <div className="space-y-2">
                    {finalMatches.length === 0 ? (
                    ) : (
                      finalMatches.map(m => (
                        <div key={m.id} className="bg-slate-900 p-3 rounded-lg border border-amber-500 text-xs space-y-1.5 shadow-md">
                          <div className="flex justify-between font-black text-white">
                            <span>{m.teamA}</span>
                            <span className="text-amber-400 font-black">vs</span>
                            <span>{m.teamB}</span>
                          </div>
                          <p className="text-[10px] text-amber-300 text-center font-bold bg-amber-950 py-1 rounded">
                            CHAMPION: <strong className="text-emerald-400">{m.winner || "PENDING"}</strong>
                        </div>
                      ))
                    )}
                </div>

              </div>
            </div>
          </section>
        )}

        {publicTab === "gallery" && (
          <section className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 shadow-xl space-y-3">
            <h2 className="text-xs font-black tracking-wider uppercase flex items-center space-x-1.5 text-amber-400">
              <ImageIcon size={16} />
              <span>Complete Media & Gallery ({allTournamentMedia.length} Photos)</span>
            </h2>

            {allTournamentMedia.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No photos uploaded for this tournament yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {allTournamentMedia.map((media, i) => (
                  <div key={i} className="rounded-lg overflow-hidden border border-slate-700 aspect-video bg-slate-900 shadow-md relative group">
                    <img src={media.url} alt={media.label} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    <div className="absolute bottom-0 inset-x-0 bg-slate-950/85 px-2 py-1 text-[10px] font-bold text-center truncate">
                      {media.label}
                    </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {galleryModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="bg-slate-950 p-3.5 border-b border-slate-800 flex items-center justify-between">
                <Camera size={15} />
                <span>Tournament Media & Gallery ({activeTourn?.name})</span>
              </h3>
              <button onClick={() => setGalleryModalOpen(false)} className="text-slate-400 hover:text-white"><X size={18}/></button>

            <div className="p-4 overflow-y-auto flex-1">
              {allTournamentMedia.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No photos captured for this tournament yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    <div key={idx} className="rounded-lg overflow-hidden border border-slate-700 aspect-video bg-slate-950 relative shadow-md">
                      <img src={media.url} alt={media.label} className="w-full h-full object-cover" />
                        {media.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
