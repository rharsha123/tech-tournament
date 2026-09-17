import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { 
  Trophy, 
  Users, 
  Calendar, 
  Plus, 
  Trash2, 
  Edit3, 
  Layers, 
  UserPlus, 
  ChevronRight, 
  Check, 
  X,
  Loader2,
  Search,
  Activity,
  Award,
  Minus,
  Camera,
  Video,
  GitCommit
} from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("tournaments");
  const [activeTournamentId, setActiveTournamentId] = useState("");
  const [loading, setLoading] = useState(true);

  // Firestore Data State
  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);

  // Search & Edit States
  const [tournamentSearch, setTournamentSearch] = useState("");
  const [editingTournId, setEditingTournId] = useState(null);
  const [editTournData, setEditTournData] = useState({ name: "", sport: "Cricket", startDate: "", endDate: "" });

  // Forms State
  const [newTourn, setNewTourn] = useState({ name: "", sport: "Cricket", startDate: "", endDate: "" });
  const [newGroupName, setNewGroupName] = useState("");
  
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [newCaptain, setNewCaptain] = useState("");

  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerRole, setNewPlayerRole] = useState("Player");

  // Fixture Form State with Stage support (League, Quarter-Final, Semi-Final, Final)
  const [fixtureData, setFixtureData] = useState({
    stage: "League", groupAId: "", teamA: "", groupBId: "", teamB: "", date: "", time: "", venue: "", videoUrl: ""
  });

  // Fixture Editing State
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [editMatchData, setEditMatchData] = useState({ stage: "League", teamA: "", teamB: "", date: "", time: "", venue: "", videoUrl: "" });

  const [scoringMatch, setScoringMatch] = useState(null);

  // Camera Modal State
  const [cameraModal, setCameraModal] = useState({ open: false, targetType: null, targetId: null, targetName: "" });
  const videoRef = useRef(null);

  useEffect(() => {
    const unsubscribeTournaments = onSnapshot(collection(db, "tournaments"), (snapshot) => {
      const tournList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTournaments(tournList);
      if (tournList.length > 0 && !activeTournamentId) {
        setActiveTournamentId(tournList[0].id);
      }
      setLoading(false);
    });

    const unsubscribeMatches = onSnapshot(collection(db, "matches"), (snapshot) => {
      const matchList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMatches(matchList);
      if (scoringMatch) {
        const updated = matchList.find(m => m.id === scoringMatch.id);
        if (updated) setScoringMatch(updated);
      }
    });

    return () => {
      unsubscribeTournaments();
      unsubscribeMatches();
    };
  }, [activeTournamentId, scoringMatch?.id]);

  const currentTournament = tournaments.find((t) => t.id === activeTournamentId) || tournaments[0];
  const filteredTournamentsList = tournaments.filter((t) =>
    t.name?.toLowerCase().includes(tournamentSearch.toLowerCase())
  );

  // Camera Handling & Image Compression
  const startCamera = async (targetType, targetId = null, targetName = "") => {
    setCameraModal({ open: true, targetType, targetId, targetName });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Unable to access camera. Please check permissions.");
      setCameraModal({ open: false, targetType: null, targetId: null, targetName: "" });
    }
  };

  const capturePhoto = async () => {
    if (!currentTournament) return;

    const canvas = document.createElement("canvas");
    const video = videoRef.current;
    
    const scale = 640 / (video.videoWidth || 640);
    canvas.width = 640;
    canvas.height = (video.videoHeight || 480) * scale;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);

    const { targetType, targetId } = cameraModal;

    try {
      if (targetType === "tournament") {
        await updateDoc(doc(db, "tournaments", currentTournament.id), {
          photos: arrayUnion(compressedDataUrl)
        });
      } else if (targetType === "group") {
        const updatedGroups = currentTournament.groups.map(g => {
          if (g.id === targetId) {
            return { ...g, photos: [...(g.photos || []), compressedDataUrl] };
          }
          return g;
        });
        await updateDoc(doc(db, "tournaments", currentTournament.id), { groups: updatedGroups });
      } else if (targetType === "team") {
        const updatedGroups = currentTournament.groups.map(g => ({
          ...g,
          teams: (g.teams || []).map(tm => {
            if (tm.id === targetId) {
              return { ...tm, photos: [...(tm.photos || []), compressedDataUrl] };
            }
            return tm;
          })
        }));
        await updateDoc(doc(db, "tournaments", currentTournament.id), { groups: updatedGroups });
      } else if (targetType === "player") {
        const updatedGroups = currentTournament.groups.map(g => ({
          ...g,
          teams: (g.teams || []).map(tm => ({
            ...tm,
            players: (tm.players || []).map(p => {
              if (p.id === targetId) {
                return { ...p, photos: [...(p.photos || []), compressedDataUrl] };
              }
              return p;
            })
          }))
        }));
        await updateDoc(doc(db, "tournaments", currentTournament.id), { groups: updatedGroups });
      }
      stopCamera();
    } catch (err) {
      console.error("Error saving photo:", err);
      alert("Failed to save photo: Size may exceed Firestore document limits.");
    }
  };

  const handleDeleteTournamentPhoto = async (photoUrl) => {
    if (!window.confirm("Delete this photo?")) return;
    await updateDoc(doc(db, "tournaments", currentTournament.id), {
      photos: arrayRemove(photoUrl)
    });
  };

  const handleDeleteGroupPhoto = async (groupId, photoUrl) => {
    if (!window.confirm("Delete this photo?")) return;
    const updatedGroups = currentTournament.groups.map(g => {
      if (g.id === groupId) {
        return { ...g, photos: (g.photos || []).filter(p => p !== photoUrl) };
      }
      return g;
    });
    await updateDoc(doc(db, "tournaments", currentTournament.id), { groups: updatedGroups });
  };

  const handleDeleteTeamPhoto = async (teamId, photoUrl) => {
    if (!window.confirm("Delete this photo?")) return;
    const updatedGroups = currentTournament.groups.map(g => ({
      ...g,
      teams: (g.teams || []).map(tm => {
        if (tm.id === teamId) {
          return { ...tm, photos: (tm.photos || []).filter(p => p !== photoUrl) };
        }
        return tm;
      })
    }));
    await updateDoc(doc(db, "tournaments", currentTournament.id), { groups: updatedGroups });
  };

  const handleDeletePlayerPhoto = async (playerId, photoUrl) => {
    if (!window.confirm("Delete this photo?")) return;
    const updatedGroups = currentTournament.groups.map(g => ({
      ...g,
      teams: (g.teams || []).map(tm => ({
        ...tm,
        players: (tm.players || []).map(p => {
          if (p.id === playerId) {
            return { ...p, photos: (p.photos || []).filter(ph => ph !== photoUrl) };
          }
          return p;
        })
      }))
    }));
    await updateDoc(doc(db, "tournaments", currentTournament.id), { groups: updatedGroups });
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setCameraModal({ open: false, targetType: null, targetId: null, targetName: "" });
  };

  // Tournament Actions
  const handleCreateTournament = async (e) => {
    e.preventDefault();
    if (!newTourn.name.trim()) return;

    const docRef = await addDoc(collection(db, "tournaments"), {
      name: newTourn.name,
      sport: newTourn.sport,
      startDate: newTourn.startDate,
      endDate: newTourn.endDate,
      groups: [],
      photos: []
    });

    setActiveTournamentId(docRef.id);
    setNewTourn({ name: "", sport: "Cricket", startDate: "", endDate: "" });
  };

  const startEditingTournament = (t) => {
    setEditingTournId(t.id);
    setEditTournData({
      name: t.name || "",
      sport: t.sport || "Cricket",
      startDate: t.startDate || "",
      endDate: t.endDate || ""
    });
  };

  const saveTournamentEdit = async (tournId) => {
    if (!editTournData.name.trim()) return;
    await updateDoc(doc(db, "tournaments", tournId), {
      name: editTournData.name,
      sport: editTournData.sport,
      startDate: editTournData.startDate,
      endDate: editTournData.endDate
    });
    setEditingTournId(null);
  };

  const handleDeleteTournament = async (tournId, tournName) => {
    if (!window.confirm(`Delete tournament "${tournName}"?`)) return;
    await deleteDoc(doc(db, "tournaments", tournId));
    if (activeTournamentId === tournId) setActiveTournamentId("");
  };

  const handleAddGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || !currentTournament) return;
    const updatedGroups = [...(currentTournament.groups || []), { id: `grp-${Date.now()}`, name: newGroupName, teams: [], photos: [] }];
    await updateDoc(doc(db, "tournaments", currentTournament.id), { groups: updatedGroups });
    setNewGroupName("");
  };

  const handleAddTeam = async (e) => {
    e.preventDefault();
    if (!selectedGroupId || !newTeamName.trim() || !currentTournament) return;
    const updatedGroups = currentTournament.groups.map((g) => {
      if (g.id === selectedGroupId) {
        return {
          ...g,
          teams: [...(g.teams || []), { 
            id: `team-${Date.now()}`, 
            name: newTeamName, 
            captain: newCaptain || "N/A", 
            photos: [],
            players: newCaptain ? [{ id: `p-${Date.now()}`, name: newCaptain, role: "Captain", photos: [] }] : [] 
          }]
        };
      }
      return g;
    });
    await updateDoc(doc(db, "tournaments", currentTournament.id), { groups: updatedGroups });
    setNewTeamName("");
    setNewCaptain("");
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!selectedTeamId || !newPlayerName.trim() || !currentTournament) return;
    const updatedGroups = currentTournament.groups.map((g) => ({
      ...g,
      teams: (g.teams || []).map((tm) => {
        if (tm.id === selectedTeamId) {
          return { ...tm, players: [...(tm.players || []), { id: `p-${Date.now()}`, name: newPlayerName, role: newPlayerRole, photos: [] }] };
        }
        return tm;
      })
    }));
    await updateDoc(doc(db, "tournaments", currentTournament.id), { groups: updatedGroups });
    setNewPlayerName("");
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("Delete this group and all its teams?")) return;
    const updatedGroups = currentTournament.groups.filter(g => g.id !== groupId);
    await updateDoc(doc(db, "tournaments", currentTournament.id), { groups: updatedGroups });
  };

  const handleDeleteTeam = async (groupId, teamId) => {
    if (!window.confirm("Delete this team?")) return;
    const updatedGroups = currentTournament.groups.map(g => {
      if (g.id === groupId) {
        return { ...g, teams: g.teams.filter(t => t.id !== teamId) };
      }
      return g;
    });
    await updateDoc(doc(db, "tournaments", currentTournament.id), { groups: updatedGroups });
  };

  const handleDeletePlayer = async (groupId, teamId, playerId) => {
    if (!window.confirm("Delete this player?")) return;
    const updatedGroups = currentTournament.groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          teams: g.teams.map(tm => {
            if (tm.id === teamId) {
              return { ...tm, players: tm.players.filter(p => p.id !== playerId) };
            }
            return tm;
          })
        };
      }
      return g;
    });
    await updateDoc(doc(db, "tournaments", currentTournament.id), { groups: updatedGroups });
  };

  const handleCreateFixture = async (e) => {
    e.preventDefault();
    if (!fixtureData.teamA || !fixtureData.teamB) {
      alert("Please select both teams.");
      return;
    }

    const groupAObj = currentTournament.groups.find(g => g.id === fixtureData.groupAId);
    const groupBObj = currentTournament.groups.find(g => g.id === fixtureData.groupBId);

    await addDoc(collection(db, "matches"), {
      tournamentId: currentTournament.id,
      stage: fixtureData.stage || "League",
      groupAName: groupAObj ? groupAObj.name : "N/A",
      teamA: fixtureData.teamA,
      groupBName: groupBObj ? groupBObj.name : "N/A",
      teamB: fixtureData.teamB,
      date: fixtureData.date,
      time: fixtureData.time,
      venue: fixtureData.venue,
      videoUrl: fixtureData.videoUrl || "",
      status: "SCHEDULED",
      scoreA: "0", scoreB: "0", wicketsA: "0", wicketsB: "0", oversA: "0.0", oversB: "0.0",
      currentSet: 1, setScoresA: [0, 0, 0], setScoresB: [0, 0, 0], setWinners: ["", "", ""],
      setCompleted: [false, false, false], winner: "", result: "Scheduled", commentary: []
    });

    setFixtureData({ stage: "League", groupAId: "", teamA: "", groupBId: "", teamB: "", date: "", time: "", venue: "", videoUrl: "" });
  };

  const startEditingMatch = (match) => {
    setEditingMatchId(match.id);
    setEditMatchData({
      stage: match.stage || "League",
      teamA: match.teamA || "",
      teamB: match.teamB || "",
      date: match.date || "",
      time: match.time || "",
      venue: match.venue || "",
      videoUrl: match.videoUrl || ""
    });
  };

  const saveMatchEdit = async (matchId) => {
    await updateDoc(doc(db, "matches", matchId), {
      stage: editMatchData.stage,
      teamA: editMatchData.teamA,
      teamB: editMatchData.teamB,
      date: editMatchData.date,
      time: editMatchData.time,
      venue: editMatchData.venue,
      videoUrl: editMatchData.videoUrl
    });
    setEditingMatchId(null);
  };

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm("Delete this match fixture?")) return;
    await deleteDoc(doc(db, "matches", matchId));
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-600 space-x-2">
        <Loader2 className="animate-spin text-emerald-600" size={24} />
        <span className="text-sm font-semibold">Loading Control Panel...</span>
      </div>
    );
  }

  const tournamentMatches = matches.filter(m => m.tournamentId === currentTournament?.id);
  const qfMatches = tournamentMatches.filter(m => m.stage === "Quarter-Final");
  const sfMatches = tournamentMatches.filter(m => m.stage === "Semi-Final");
  const finalMatches = tournamentMatches.filter(m => m.stage === "Final");
  const leagueMatches = tournamentMatches.filter(m => m.stage === "League" || !m.stage);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-100 font-sans text-slate-800">
      <aside className="bg-slate-900 text-white w-full md:w-20 flex md:flex-col justify-start shrink-0 fixed md:relative bottom-0 z-40 border-t md:border-t-0 border-slate-800 shadow-lg">
        <div className="hidden md:flex p-3 border-b border-slate-800 items-center justify-center">
          <Trophy className="text-amber-400" size={22} />
        </div>

        <nav className="flex md:flex-col justify-around md:justify-start items-center p-2 md:p-3 md:space-y-3 w-full">
          {[
            { id: "tournaments", name: "Tournaments", icon: Trophy },
            { id: "groups_teams", name: "Groups & Teams", icon: Layers },
            { id: "fixtures", name: "Fixtures & Scoring", icon: Calendar },
            { id: "bracket", name: "Hierarchy & Bracket", icon: GitCommit },
          ].map((tab) => (
            <div key={tab.id} className="relative group flex items-center justify-center w-full">
              <button
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center p-2.5 rounded-xl transition w-10 h-10 ${
                  activeTab === tab.id ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <tab.icon size={20} className="shrink-0" />
              </button>
              <div className="hidden md:group-hover:block absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-md shadow-xl whitespace-nowrap z-50 border border-slate-700 pointer-events-none">
                {tab.name}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-16 md:pb-0">
        <header className="bg-white shadow-2xs border-b border-slate-200 px-5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight">Tournament Administration</h1>
            <p className="text-[10px] text-slate-500">Live Scoring & Hierarchy Management Console</p>
          </div>

          <div className="flex items-center space-x-2">
            {currentTournament && (
              <button 
                onClick={() => startCamera("tournament", null, currentTournament.name)} 
                className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-slate-800 flex items-center space-x-1 shadow-2xs"
              >
                <Camera size={14} className="text-emerald-400" />
                <span>Capture Tournament Photo</span>
              </button>
            )}

            {tournaments.length > 0 && (
              <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-400">Active:</span>
                <select
                  value={activeTournamentId}
                  onChange={(e) => setActiveTournamentId(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
                >
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.sport})</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </header>

        <main className="p-4 sm:p-5 flex-1 overflow-y-auto max-w-7xl w-full mx-auto space-y-5">
          {cameraModal.open && (
            <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-4 max-w-md w-full space-y-3 shadow-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                    <Camera size={16} className="text-emerald-600" />
                    <span>Capture Photo ({cameraModal.targetName || "General"})</span>
                  </h3>
                  <button onClick={stopCamera} className="text-slate-400 hover:text-slate-700"><X size={18}/></button>
                </div>
                <div className="bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                </div>
                <button 
                  onClick={capturePhoto} 
                  className="w-full bg-emerald-600 text-white py-2 rounded-xl font-bold text-xs hover:bg-emerald-700 transition"
                >
                  Snap & Save Photo
                </button>
              </div>
            </div>
          )}

          {activeTab === "tournaments" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-2xs border border-slate-200">
                <h2 className="text-xs font-bold text-slate-800 mb-2.5 flex items-center space-x-1.5">
                  <Plus className="text-emerald-600" size={15} />
                  <span>Create Tournament</span>
                </h2>
                <form onSubmit={handleCreateTournament} className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Tournament Name</label>
                    <input
                      type="text"
                      placeholder="e.g. SNB Championship 2026"
                      value={newTourn.name}
                      onChange={(e) => setNewTourn({ ...newTourn, name: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Sport Category</label>
                    <select
                      value={newTourn.sport}
                      onChange={(e) => setNewTourn({ ...newTourn, sport: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-xl text-xs bg-white outline-none cursor-pointer"
                    >
                      <option value="Cricket">Cricket</option>
                      <option value="Football">Football</option>
                      <option value="Badminton">Badminton</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Start Date</label>
                      <input type="date" value={newTourn.startDate} onChange={(e) => setNewTourn({ ...newTourn, startDate: e.target.value })} className="w-full px-2 py-1 border rounded-xl text-xs"/>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">End Date</label>
                      <input type="date" value={newTourn.endDate} onChange={(e) => setNewTourn({ ...newTourn, endDate: e.target.value })} className="w-full px-2 py-1 border rounded-xl text-xs"/>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded-xl hover:bg-emerald-700 font-bold text-xs transition">Add Tournament</button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white p-4 rounded-2xl shadow-2xs border border-slate-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                  <h2 className="text-xs font-bold text-slate-800">All Tournaments</h2>
                  <div className="relative w-full sm:w-52">
                    <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-slate-400"/>
                    <input type="text" placeholder="Search..." value={tournamentSearch} onChange={(e) => setTournamentSearch(e.target.value)} className="pl-7 pr-3 py-1 border rounded-xl text-xs w-full outline-none"/>
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredTournamentsList.map((t) => (
                    <div key={t.id} className={`p-3 rounded-xl border transition ${t.id === activeTournamentId ? "border-emerald-500 bg-emerald-50/10" : "border-slate-200"}`}>
                      {editingTournId === t.id ? (
                        <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500">NAME</label>
                              <input type="text" value={editTournData.name} onChange={(e) => setEditTournData({ ...editTournData, name: e.target.value })} className="w-full px-2 py-1 border rounded-lg text-xs font-bold"/>
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500">SPORT</label>
                              <select value={editTournData.sport} onChange={(e) => setEditTournData({ ...editTournData, sport: e.target.value })} className="w-full px-2 py-1 border rounded-lg text-xs bg-white">
                                <option value="Cricket">Cricket</option>
                                <option value="Football">Football</option>
                                <option value="Badminton">Badminton</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2 pt-1">
                            <button onClick={() => saveTournamentEdit(t.id)} className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1"><Check size={13}/><span>Save</span></button>
                            <button onClick={() => setEditingTournId(null)} className="bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">{t.name}</h3>
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-bold">{t.sport}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">Dates: {t.startDate || "N/A"} to {t.endDate || "N/A"} | {t.groups?.length || 0} Groups</p>
                          </div>
                          <div className="flex items-center space-x-1.5 self-end sm:self-center">
                            <button onClick={() => startEditingTournament(t)} className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg"><Edit3 size={14}/></button>
                            <button onClick={() => { setActiveTournamentId(t.id); setActiveTab("groups_teams"); }} className="flex items-center space-x-1 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg font-bold"><span>Manage</span><ChevronRight size={12}/></button>
                            <button onClick={() => handleDeleteTournament(t.id, t.name)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "groups_teams" && currentTournament && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <h3 className="font-bold text-slate-800 mb-2 flex items-center space-x-1.5"><Layers size={15} className="text-emerald-600"/><span>Add Group / Pool</span></h3>
                  <form onSubmit={handleAddGroup} className="space-y-2">
                    <input type="text" placeholder="e.g. Group A" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="w-full px-2.5 py-1.5 border rounded-xl text-xs outline-none" required/>
                    <button type="submit" className="w-full bg-slate-900 text-white py-1.5 rounded-xl text-xs font-bold hover:bg-slate-800">Add Group</button>
                  </form>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <h3 className="font-bold text-slate-800 mb-2 flex items-center space-x-1.5"><Users size={15} className="text-emerald-600"/><span>Add Team</span></h3>
                  <form onSubmit={handleAddTeam} className="space-y-2">
                    <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} className="w-full px-2.5 py-1.5 border rounded-xl text-xs bg-white outline-none" required>
                      <option value="">Select Group...</option>
                      {(currentTournament.groups || []).map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
                    </select>
                    <input type="text" placeholder="Team Name" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} className="w-full px-2.5 py-1.5 border rounded-xl text-xs outline-none" required/>
                    <input type="text" placeholder="Captain Name" value={newCaptain} onChange={(e) => setNewCaptain(e.target.value)} className="w-full px-2.5 py-1.5 border rounded-xl text-xs outline-none"/>
                    <button type="submit" className="w-full bg-slate-900 text-white py-1.5 rounded-xl text-xs font-bold hover:bg-slate-800">Add Team</button>
                  </form>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <h3 className="font-bold text-slate-800 mb-2 flex items-center space-x-1.5"><UserPlus size={15} className="text-emerald-600"/><span>Add Player</span></h3>
                  <form onSubmit={handleAddPlayer} className="space-y-2">
                    <select value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)} className="w-full px-2.5 py-1.5 border rounded-xl text-xs bg-white outline-none" required>
                      <option value="">Select Team...</option>
                      {(currentTournament.groups || []).flatMap(g => g.teams || []).map((tm) => (<option key={tm.id} value={tm.id}>{tm.name}</option>))}
                    </select>
                    <input type="text" placeholder="Player Name" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} className="w-full px-2.5 py-1.5 border rounded-xl text-xs outline-none" required/>
                    <input type="text" placeholder="Role" value={newPlayerRole} onChange={(e) => setNewPlayerRole(e.target.value)} className="w-full px-2.5 py-1.5 border rounded-xl text-xs outline-none"/>
                    <button type="submit" className="w-full bg-slate-900 text-white py-1.5 rounded-xl text-xs font-bold hover:bg-slate-800">Add Player</button>
                  </form>
                </div>
              </div>

              {/* GROUPS & TEAMS OVERVIEW */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">Groups, Teams & Players Overview ({currentTournament.name})</h3>
                {(!currentTournament.groups || currentTournament.groups.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">No groups or teams created yet.</p>
                ) : (
                  <div className="space-y-4">
                    {currentTournament.groups.map(group => (
                      <div key={group.id} className="border border-slate-200 p-3.5 rounded-xl bg-slate-50/50 space-y-3">
                        <div className="flex items-center justify-between border-b pb-2">
                          <span className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
                            <Layers size={14} className="text-emerald-600"/> <span>{group.name}</span>
                          </span>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => startCamera("group", group.id, group.name)}
                              className="bg-emerald-600 text-white px-2 py-1 rounded-lg text-[10px] font-bold hover:bg-emerald-700 flex items-center space-x-1"
                            >
                              <Camera size={12}/>
                              <span>Group Photo</span>
                            </button>
                            <button onClick={() => handleDeleteGroup(group.id)} className="text-red-400 hover:text-red-600 text-[10px] flex items-center space-x-0.5">
                              <Trash2 size={12}/> <span>Delete</span>
                            </button>
                          </div>
                        </div>

                        {group.photos && group.photos.length > 0 && (
                          <div className="grid grid-cols-4 gap-2">
                            {group.photos.map((ph, idx) => (
                              <div key={idx} className="relative group rounded-lg overflow-hidden aspect-video border bg-slate-100">
                                <img src={ph} alt="Group" className="w-full h-full object-cover"/>
                                <button onClick={() => handleDeleteGroupPhoto(group.id, ph)} className="absolute top-0.5 right-0.5 bg-red-600 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100">
                                  <Trash2 size={10}/>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {(!group.teams || group.teams.length === 0) ? (
                          <p className="text-[11px] text-slate-400 italic">No teams in this group.</p>
                        ) : (
                          <div className="space-y-3 pl-2">
                            {group.teams.map(team => (
                              <div key={team.id} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs font-extrabold text-slate-800">{team.name} <span className="text-[10px] font-normal text-slate-500">(Capt: {team.captain})</span></p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <button 
                                      onClick={() => startCamera("team", team.id, team.name)}
                                      className="bg-slate-900 text-white px-2 py-1 rounded-lg text-[10px] font-bold hover:bg-slate-800 flex items-center space-x-1"
                                    >
                                      <Camera size={12} className="text-emerald-400"/>
                                      <span>Team Photo</span>
                                    </button>
                                    <button onClick={() => handleDeleteTeam(group.id, team.id)} className="text-red-400 hover:text-red-600 p-1">
                                      <Trash2 size={13}/>
                                    </button>
                                  </div>
                                </div>

                                {team.photos && team.photos.length > 0 && (
                                  <div className="grid grid-cols-4 gap-2 pt-1">
                                    {team.photos.map((ph, idx) => (
                                      <div key={idx} className="relative group rounded-lg overflow-hidden aspect-video border bg-slate-100">
                                        <img src={ph} alt="Team" className="w-full h-full object-cover"/>
                                        <button onClick={() => handleDeleteTeamPhoto(team.id, ph)} className="absolute top-0.5 right-0.5 bg-red-600 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100">
                                          <Trash2 size={10}/>
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div className="pl-3 border-l-2 border-slate-100 space-y-1.5 pt-1">
                                  <p className="text-[10px] font-bold uppercase text-slate-400">Players:</p>
                                  {(!team.players || team.players.length === 0) ? (
                                    <p className="text-[11px] text-slate-400 italic">No players added.</p>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {team.players.map(player => (
                                        <div key={player.id} className="bg-slate-50 p-2 rounded-lg border flex items-center justify-between">
                                          <div>
                                            <p className="text-[11px] font-bold text-slate-800">{player.name} <span className="text-[9px] text-slate-500 font-normal">({player.role})</span></p>
                                          </div>
                                          <div className="flex items-center space-x-1.5">
                                            <button 
                                              onClick={() => startCamera("player", player.id, player.name)}
                                              className="bg-emerald-600 text-white px-1.5 py-0.5 rounded text-[9px] font-bold hover:bg-emerald-700 flex items-center space-x-0.5"
                                            >
                                              <Camera size={10}/>
                                              <span>Photo</span>
                                            </button>
                                            <button onClick={() => handleDeletePlayer(group.id, team.id, player.id)} className="text-red-400 hover:text-red-600">
                                              <Trash2 size={11}/>
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "fixtures" && currentTournament && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-800 mb-2.5 flex items-center space-x-1.5"><Calendar className="text-emerald-600" size={15}/><span>Schedule Fixture</span></h3>
                <form onSubmit={handleCreateFixture} className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">Tournament Stage</label>
                    <select
                      value={fixtureData.stage}
                      onChange={(e) => setFixtureData({ ...fixtureData, stage: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-xl text-xs bg-white outline-none font-bold text-emerald-700"
                    >
                      <option value="League">League / Group Stage</option>
                      <option value="Quarter-Final">Quarter-Final</option>
                      <option value="Semi-Final">Semi-Final</option>
                      <option value="Final">Final</option>
                    </select>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-xl border space-y-1">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase">Team A</label>
                    <select value={fixtureData.groupAId} onChange={(e) => setFixtureData({ ...fixtureData, groupAId: e.target.value, teamA: "" })} className="w-full px-2 py-1 border rounded-lg text-xs bg-white" required>
                      <option value="">Select Group...</option>
                      {(currentTournament.groups || []).map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
                    </select>
                    <select value={fixtureData.teamA} onChange={(e) => setFixtureData({ ...fixtureData, teamA: e.target.value })} className="w-full px-2 py-1 border rounded-lg text-xs bg-white" disabled={!fixtureData.groupAId} required>
                      <option value="">Select Team...</option>
                      {(currentTournament.groups || []).find((g) => g.id === fixtureData.groupAId)?.teams.map((tm) => (<option key={tm.id} value={tm.name}>{tm.name}</option>))}
                    </select>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-xl border space-y-1">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase">Team B</label>
                    <select value={fixtureData.groupBId} onChange={(e) => setFixtureData({ ...fixtureData, groupBId: e.target.value, teamB: "" })} className="w-full px-2 py-1 border rounded-lg text-xs bg-white" required>
                      <option value="">Select Group...</option>
                      {(currentTournament.groups || []).map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
                    </select>
                    <select value={fixtureData.teamB} onChange={(e) => setFixtureData({ ...fixtureData, teamB: e.target.value })} className="w-full px-2 py-1 border rounded-lg text-xs bg-white" disabled={!fixtureData.groupBId} required>
                      <option value="">Select Team...</option>
                      {(currentTournament.groups || []).find((g) => g.id === fixtureData.groupBId)?.teams.map((tm) => (<option key={tm.id} value={tm.name}>{tm.name}</option>))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase">Date</label>
                      <input type="date" value={fixtureData.date} onChange={(e) => setFixtureData({ ...fixtureData, date: e.target.value })} className="w-full px-2 py-1 border rounded-xl text-xs" required/>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase">Time</label>
                      <input type="text" placeholder="10:00 AM" value={fixtureData.time} onChange={(e) => setFixtureData({ ...fixtureData, time: e.target.value })} className="w-full px-2 py-1 border rounded-xl text-xs" required/>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 uppercase">Venue</label>
                    <input type="text" placeholder="Main Court" value={fixtureData.venue} onChange={(e) => setFixtureData({ ...fixtureData, venue: e.target.value })} className="w-full px-2 py-1 border rounded-xl text-xs" required/>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 uppercase flex items-center space-x-1">
                      <Video size={11} className="text-emerald-600" />
                      <span>Video Stream URL (YouTube / MP4)</span>
                    </label>
                    <input type="url" placeholder="https://www.youtube.com/watch?v=..." value={fixtureData.videoUrl} onChange={(e) => setFixtureData({ ...fixtureData, videoUrl: e.target.value })} className="w-full px-2 py-1 border rounded-xl text-xs mt-0.5"/>
                  </div>

                  <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded-xl hover:bg-emerald-700 font-bold text-xs transition">Save Fixture</button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-800 mb-2.5">Matches & Scoring Console ({tournamentMatches.length})</h3>
                <div className="space-y-2.5">
                  {tournamentMatches.map((match) => (
                    <div key={match.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50/40">
                      {editingMatchId === match.id ? (
                        <div className="space-y-2 bg-white p-3 rounded-xl border">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500">STAGE</label>
                            <select value={editMatchData.stage} onChange={(e) => setEditMatchData({ ...editMatchData, stage: e.target.value })} className="w-full px-2 py-1 border rounded text-xs font-bold bg-white">
                              <option value="League">League / Group Stage</option>
                              <option value="Quarter-Final">Quarter-Final</option>
                              <option value="Semi-Final">Semi-Final</option>
                              <option value="Final">Final</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500">TEAM A</label>
                              <input type="text" value={editMatchData.teamA} onChange={(e) => setEditMatchData({ ...editMatchData, teamA: e.target.value })} className="w-full px-2 py-1 border rounded text-xs font-bold"/>
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500">TEAM B</label>
                              <input type="text" value={editMatchData.teamB} onChange={(e) => setEditMatchData({ ...editMatchData, teamB: e.target.value })} className="w-full px-2 py-1 border rounded text-xs font-bold"/>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500">DATE</label>
                              <input type="date" value={editMatchData.date} onChange={(e) => setEditMatchData({ ...editMatchData, date: e.target.value })} className="w-full px-2 py-1 border rounded text-xs"/>
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500">TIME</label>
                              <input type="text" value={editMatchData.time} onChange={(e) => setEditMatchData({ ...editMatchData, time: e.target.value })} className="w-full px-2 py-1 border rounded text-xs"/>
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500">VENUE</label>
                              <input type="text" value={editMatchData.venue} onChange={(e) => setEditMatchData({ ...editMatchData, venue: e.target.value })} className="w-full px-2 py-1 border rounded text-xs"/>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500">VIDEO URL</label>
                            <input type="url" value={editMatchData.videoUrl} onChange={(e) => setEditMatchData({ ...editMatchData, videoUrl: e.target.value })} className="w-full px-2 py-1 border rounded text-xs"/>
                          </div>
                          <div className="flex justify-end space-x-2 pt-1">
                            <button onClick={() => saveMatchEdit(match.id)} className="bg-emerald-600 text-white px-2.5 py-1 rounded text-xs font-bold flex items-center space-x-1"><Check size={12}/><span>Save</span></button>
                            <button onClick={() => setEditingMatchId(null)} className="bg-slate-200 text-slate-700 px-2.5 py-1 rounded text-xs">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-black">{match.stage || "League"}</span>
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">{match.teamA}</span>
                              <span className="text-[10px] text-slate-400 font-bold">VS</span>
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">{match.teamB}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">{match.date} at {match.time} | Venue: {match.venue}</p>
                            {match.winner && (
                              <p className="text-[10px] font-bold text-emerald-600 mt-0.5">Winner: {match.winner}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-1.5 self-end sm:self-center">
                            <button onClick={() => startEditingMatch(match)} className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-white rounded-lg border bg-slate-50"><Edit3 size={13}/></button>
                            <button onClick={() => setScoringMatch(match)} className="bg-emerald-600 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold hover:bg-emerald-700 flex items-center space-x-1"><Activity size={12}/><span>Score Console</span></button>
                            <button onClick={() => handleDeleteMatch(match.id)} className="text-red-400 hover:text-red-600 p-1 rounded-lg"><Trash2 size={14}/></button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "bracket" && currentTournament && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">Tournament Hierarchy & Knockout Bracket</h2>
                  <p className="text-xs text-slate-500">International Standard Tournament Tree View ({currentTournament.name})</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-full">{currentTournament.sport}</span>
              </div>

              {/* HIERARCHY TREE CONTAINER */}
              <div className="overflow-x-auto py-4">
                <div className="min-w-[700px] flex items-center justify-between space-x-6">
                  
                  {/* STAGE 1: GROUPS / LEAGUE */}
                  <div className="flex-1 space-y-3">
                    <div className="bg-slate-900 text-white text-center py-2 rounded-xl text-xs font-black uppercase tracking-wider">
                      1. Groups / League Stage
                    </div>
                    <div className="space-y-2">
                      {(!currentTournament.groups || currentTournament.groups.length === 0) ? (
                        <p className="text-xs text-slate-400 text-center italic p-4 bg-slate-50 rounded-xl border">No groups defined</p>
                      ) : (
                        currentTournament.groups.map(g => (
                          <div key={g.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                            <span className="text-xs font-extrabold text-slate-800">{g.name}</span>
                            <div className="text-[11px] text-slate-600">
                              {g.teams?.length || 0} Teams registered
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="text-slate-300 font-bold">➔</div>

                  {/* STAGE 2: QUARTER FINALS */}
                  <div className="flex-1 space-y-3">
                    <div className="bg-indigo-900 text-white text-center py-2 rounded-xl text-xs font-black uppercase tracking-wider">
                      2. Quarter-Finals
                    </div>
                    <div className="space-y-2">
                      {qfMatches.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center italic p-4 bg-slate-50 rounded-xl border">No quarter-finals scheduled</p>
                      ) : (
                        qfMatches.map(m => (
                          <div key={m.id} className="bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-200 text-xs space-y-1">
                            <div className="flex justify-between font-bold text-slate-900">
                              <span>{m.teamA}</span>
                              <span className="text-indigo-600 font-black">VS</span>
                              <span>{m.teamB}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 text-center font-medium">Winner: <strong className="text-emerald-600">{m.winner || "TBD"}</strong></div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="text-slate-300 font-bold">➔</div>

                  {/* STAGE 3: SEMI FINALS */}
                  <div className="flex-1 space-y-3">
                    <div className="bg-blue-900 text-white text-center py-2 rounded-xl text-xs font-black uppercase tracking-wider">
                      3. Semi-Finals
                    </div>
                    <div className="space-y-2">
                      {sfMatches.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center italic p-4 bg-slate-50 rounded-xl border">No semi-finals scheduled</p>
                      ) : (
                        sfMatches.map(m => (
                          <div key={m.id} className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-200 text-xs space-y-1">
                            <div className="flex justify-between font-bold text-slate-900">
                              <span>{m.teamA}</span>
                              <span className="text-blue-600 font-black">VS</span>
                              <span>{m.teamB}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 text-center font-medium">Winner: <strong className="text-emerald-600">{m.winner || "TBD"}</strong></div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="text-slate-300 font-bold">➔</div>

                  {/* STAGE 4: FINALS */}
                  <div className="flex-1 space-y-3">
                    <div className="bg-amber-600 text-white text-center py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1">
                      <Trophy size={13} />
                      <span>4. Grand Final</span>
                    </div>
                    <div className="space-y-2">
                      {finalMatches.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center italic p-4 bg-slate-50 rounded-xl border">Grand Final not scheduled</p>
                      ) : (
                        finalMatches.map(m => (
                          <div key={m.id} className="bg-amber-50 p-3 rounded-xl border border-amber-300 text-xs space-y-1.5 shadow-sm">
                            <div className="flex justify-between font-black text-slate-900">
                              <span>{m.teamA}</span>
                              <span className="text-amber-600">VS</span>
                              <span>{m.teamB}</span>
                            </div>
                            <div className="text-[10px] text-slate-700 text-center font-bold bg-amber-200/50 py-1 rounded">
                              CHAMPION: <span className="text-emerald-700 font-black">{m.winner || "PENDING"}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {scoringMatch && currentTournament && (
        <LiveScoringConsole match={scoringMatch} sport={currentTournament.sport} onClose={() => setScoringMatch(null)} />
      )}
    </div>
  );
}

function LiveScoringConsole({ match, sport, onClose }) {
  const [selectedWinner, setSelectedWinner] = useState(match.winner || "");
  const [matchResultSummary, setMatchResultSummary] = useState(match.result || "");

  const toggleLiveStatus = async () => {
    const newStatus = match.status === "LIVE" ? "SCHEDULED" : "LIVE";
    await updateDoc(doc(db, "matches", match.id), { status: newStatus });
  };

  const handleSetActiveSet = async (setNum) => {
    await updateDoc(doc(db, "matches", match.id), {
      currentSet: setNum,
      commentary: arrayUnion({
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Admin initiated Set ${setNum}.`,
        type: "TEXT"
      })
    });
  };

  const handleBadmintonPoint = async (side) => {
    const activeSetIdx = (match.currentSet || 1) - 1;
    let scoresA = [...(match.setScoresA || [0, 0, 0])];
    let scoresB = [...(match.setScoresB || [0, 0, 0])];
    let setWinners = [...(match.setWinners || ["", "", ""])];
    let setCompleted = [...(match.setCompleted || [false, false, false])];

    if (setCompleted[activeSetIdx]) {
      alert(`Set ${match.currentSet} is completed and locked.`);
      return;
    }

    if (side === "A") scoresA[activeSetIdx] = (scoresA[activeSetIdx] || 0) + 1;
    if (side === "B") scoresB[activeSetIdx] = (scoresB[activeSetIdx] || 0) + 1;

    const currentScoreA = scoresA[activeSetIdx];
    const currentScoreB = scoresB[activeSetIdx];

    let isSetWon = false;
    let setWinnerTeam = "";

    if ((currentScoreA >= 21 && currentScoreA - currentScoreB >= 2) || currentScoreA === 30) {
      isSetWon = true;
      setWinnerTeam = match.teamA;
    } else if ((currentScoreB >= 21 && currentScoreB - currentScoreA >= 2) || currentScoreB === 30) {
      isSetWon = true;
      setWinnerTeam = match.teamB;
    }

    if (isSetWon) {
      setWinners[activeSetIdx] = setWinnerTeam;
      setCompleted[activeSetIdx] = true;
    }

    const setWinnerSummary = setWinners.map((w, idx) => w ? `Set ${idx + 1}: ${w}` : "").filter(Boolean).join(" | ");
    const setsWonA = setWinners.filter(w => w === match.teamA).length;
    const setsWonB = setWinners.filter(w => w === match.teamB).length;

    let autoWinner = "";
    if (setsWonA === 2) autoWinner = match.teamA;
    if (setsWonB === 2) autoWinner = match.teamB;

    if (autoWinner) setSelectedWinner(autoWinner);

    await updateDoc(doc(db, "matches", match.id), {
      status: "LIVE",
      setScoresA: scoresA,
      setScoresB: scoresB,
      setWinners: setWinners,
      setCompleted: setCompleted,
      scoreA: `${setsWonA}`,
      scoreB: `${setsWonB}`,
      winner: autoWinner || match.winner,
      result: setWinnerSummary || `Set ${match.currentSet}: ${currentScoreA}-${currentScoreB}`,
      commentary: arrayUnion({
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: isSetWon ? `${setWinnerTeam} WON SET ${activeSetIdx + 1} (${currentScoreA}-${currentScoreB})!` : `Point to ${side === "A" ? match.teamA : match.teamB} (${currentScoreA}-${currentScoreB})`,
        type: isSetWon ? "HIGHLIGHT" : "POINT"
      })
    });
  };

  const handleBadmintonMinusPoint = async (side) => {
    const activeSetIdx = (match.currentSet || 1) - 1;
    let scoresA = [...(match.setScoresA || [0, 0, 0])];
    let scoresB = [...(match.setScoresB || [0, 0, 0])];

    if (side === "A" && scoresA[activeSetIdx] > 0) scoresA[activeSetIdx] -= 1;
    if (side === "B" && scoresB[activeSetIdx] > 0) scoresB[activeSetIdx] -= 1;

    await updateDoc(doc(db, "matches", match.id), {
      setScoresA: scoresA,
      setScoresB: scoresB,
      commentary: arrayUnion({
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Admin corrected score (-1 point to ${side === "A" ? match.teamA : match.teamB}). Current: ${scoresA[activeSetIdx]}-${scoresB[activeSetIdx]}`,
        type: "TEXT"
      })
    });
  };

  const handleToggleCompleteSet = async (idx) => {
    let setCompleted = [...(match.setCompleted || [false, false, false])];
    setCompleted[idx] = !setCompleted[idx];
    await updateDoc(doc(db, "matches", match.id), { setCompleted });
  };

  const handleCompleteMatch = async (e) => {
    e.preventDefault();
    if (!selectedWinner) {
      alert("Please select an official match winner!");
      return;
    }

    await updateDoc(doc(db, "matches", match.id), {
      status: "COMPLETED",
      winner: selectedWinner,
      result: matchResultSummary || `${selectedWinner} won the match`,
      commentary: arrayUnion({
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `OFFICIAL WINNER DECLARED: ${selectedWinner}. Result: ${matchResultSummary}`,
        type: "HIGHLIGHT"
      })
    });
    alert("Match successfully concluded!");
  };

  const getEmbedUrl = (url) => {
    if (!url) return "";
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("watch?v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    return url;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-2xs flex items-center justify-center p-3 z-50">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border overflow-hidden">
        <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xs text-white">{match.teamA} vs {match.teamB} ({sport})</h3>
            <p className="text-[10px] text-slate-400">Match Concluding & Set Scoring Console</p>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={toggleLiveStatus} className={`px-2 py-1 rounded-lg text-[9px] font-black ${match.status === "LIVE" ? "bg-red-500 text-white animate-pulse" : "bg-slate-700 text-slate-200"}`}>
              {match.status === "LIVE" ? "LIVE NOW" : "START LIVE"}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18}/></button>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 overflow-y-auto flex-1 space-y-3.5">
          {match.videoUrl && (
            <div className="bg-slate-950 rounded-xl overflow-hidden aspect-video border shadow-inner">
              <iframe 
                src={getEmbedUrl(match.videoUrl)} 
                title="Live Stream" 
                className="w-full h-full border-0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          )}

          {sport === 'Badminton' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border gap-2">
                <span className="text-[11px] font-bold text-slate-700">Active Set:</span>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3].map((setNum) => (
                    <button
                      key={setNum}
                      onClick={() => handleSetActiveSet(setNum)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        (match.currentSet || 1) === setNum ? "bg-emerald-600 text-white shadow-xs" : "bg-white border text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      Set {setNum} {(match.setCompleted?.[setNum - 1]) ? "✔" : ""}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((idx) => {
                  const isCompleted = match.setCompleted?.[idx];
                  const winner = match.setWinners?.[idx];
                  return (
                    <div key={idx} className={`p-2 rounded-xl border text-center relative ${isCompleted ? "bg-slate-100 border-slate-300" : "bg-emerald-50/50 border-emerald-200"}`}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] font-bold text-slate-700">Set {idx + 1}</span>
                        <button onClick={() => handleToggleCompleteSet(idx)} className="text-[9px] font-semibold text-slate-500 underline">
                          {isCompleted ? "Unlock" : "Lock"}
                        </button>
                      </div>

                      <p className="text-sm font-black text-slate-900">
                        {(match.setScoresA || [0])[idx] || 0} - {(match.setScoresB || [0])[idx] || 0}
                      </p>

                      {winner && (
                        <span className="text-[8px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded mt-0.5 inline-block">
                          {winner}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="space-y-1">
                  <button onClick={() => handleBadmintonPoint("A")} className="w-full bg-emerald-600 text-white py-2 rounded-xl font-bold text-xs hover:bg-emerald-700 transition">
                    +1 Point ({match.teamA})
                  </button>
                  <button onClick={() => handleBadmintonMinusPoint("A")} className="w-full bg-slate-200 text-slate-700 py-1 rounded-lg font-bold text-[10px] hover:bg-slate-300 flex items-center justify-center space-x-1">
                    <Minus size={10}/> <span>Correct (-1)</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <button onClick={() => handleBadmintonPoint("B")} className="w-full bg-indigo-600 text-white py-2 rounded-xl font-bold text-xs hover:bg-indigo-700 transition">
                    +1 Point ({match.teamB})
                  </button>
                  <button onClick={() => handleBadmintonMinusPoint("B")} className="w-full bg-slate-200 text-slate-700 py-1 rounded-lg font-bold text-[10px] hover:bg-slate-300 flex items-center justify-center space-x-1">
                    <Minus size={10}/> <span>Correct (-1)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-xl space-y-2">
            <h4 className="text-[11px] font-black uppercase text-emerald-900 flex items-center space-x-1">
              <Award size={14} className="text-emerald-600" />
              <span>Official Match Winner Declaration</span>
            </h4>

            <form onSubmit={handleCompleteMatch} className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-700 mb-0.5">Winner Team</label>
                  <select value={selectedWinner} onChange={(e) => setSelectedWinner(e.target.value)} className="w-full p-1.5 border rounded-lg text-xs font-bold bg-white outline-none" required>
                    <option value="">Select Winner...</option>
                    <option value={match.teamA}>{match.teamA}</option>
                    <option value={match.teamB}>{match.teamB}</option>
                    <option value="Draw">Match Drawn / No Result</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-700 mb-0.5">Result Summary</label>
                  <input type="text" value={matchResultSummary} onChange={(e) => setMatchResultSummary(e.target.value)} placeholder="e.g. Won by 2 sets to 1" className="w-full p-1.5 border rounded-lg text-xs bg-white outline-none" required/>
                </div>
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded-xl font-bold text-xs hover:bg-slate-800 transition">
                Save & Publish Official Winner
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
