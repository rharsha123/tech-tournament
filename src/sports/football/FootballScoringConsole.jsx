import React, { useState } from "react";
import { createFootballMatch, recordGoal, recordCard, recordSubstitution, advancePeriod } from "../../sports/football/footballEngine";

export default function FootballScoringConsole({ match, players, onChange, onClose }) {
  const [state, setState] = useState(
    match.footballState || createFootballMatch({ homeTeam: match.teamA, awayTeam: match.teamB, extraTimeEnabled: !!match.extraTimeEnabled })
  );
  const [minute, setMinute] = useState(1);
  const [goalScorer, setGoalScorer] = useState("");
  const [assist, setAssist] = useState("");

  function commit(next) {
    setState(next);
    onChange?.(next);
  }

  function handleGoal(side) {
    if (!goalScorer) return;
    commit(recordGoal(state, { side, minute, playerId: goalScorer, assistPlayerId: assist || null }));
    setGoalScorer("");
    setAssist("");
  }

  function handleCard(side, cardType, playerId) {
    if (!playerId) return;
    commit(recordCard(state, { side, minute, playerId, cardType }));
  }

  return (
    <div className="sb-panel" style={{ padding: "var(--space-4)", maxWidth: 640 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div className="sb-display" style={{ fontSize: 40 }}>
          {state.homeScore} — {state.awayScore}
        </div>
        {onClose && <button onClick={onClose} style={closeBtnStyle}>Close</button>}
      </div>
      <div style={{ fontSize: 13, color: "var(--chalk-dim)", marginBottom: "var(--space-3)" }}>
        {state.period} · Minute
        <input type="number" value={minute} min={0} max={130} onChange={(e) => setMinute(Number(e.target.value))} style={{ ...numInputStyle, marginLeft: 6 }} />
        <button onClick={() => commit(advancePeriod(state))} style={{ ...smallBtn, marginLeft: 10 }}>Advance Period</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
        {["home", "away"].map((side) => (
          <div key={side}>
            <div className="sb-tag sb-tag--football" style={{ marginBottom: 8 }}>
              {side === "home" ? state.homeTeam?.name : state.awayTeam?.name}
            </div>
            <select value={side === "home" ? goalScorer : goalScorer} onChange={(e) => setGoalScorer(e.target.value)} style={selectStyle}>
              <option value="">Scorer…</option>
              {(players || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={assist} onChange={(e) => setAssist(e.target.value)} style={selectStyle}>
              <option value="">Assist (optional)…</option>
              {(players || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={() => handleGoal(side)} style={{ ...smallBtn, width: "100%", marginTop: 6, background: "var(--signal)", color: "var(--signal-ink)" }}>
              Goal
            </button>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button onClick={() => handleCard(side, "yellow", goalScorer)} style={{ ...smallBtn, background: "#E8C547", color: "#241C00", flex: 1 }}>Yellow</button>
              <button onClick={() => handleCard(side, "red", goalScorer)} style={{ ...smallBtn, background: "var(--cricket)", color: "#fff", flex: 1 }}>Red</button>
            </div>
          </div>
        ))}
      </div>

      <EventLog events={state.events} players={players} />
    </div>
  );
}

function EventLog({ events, players }) {
  if (!events?.length) return null;
  const name = (id) => players?.find((p) => p.id === id)?.name || "—";
  return (
    <div style={{ marginTop: "var(--space-4)" }}>
      <div style={{ fontSize: 12, color: "var(--chalk-dim)", marginBottom: 6 }}>MATCH EVENTS</div>
      {[...events].reverse().map((e, i) => (
        <div key={i} className="sb-hairline" style={{ padding: "6px 0", fontSize: 13 }}>
          <span className="sb-display" style={{ color: "var(--chalk-dim)", marginRight: 8 }}>{e.minute}'</span>
          {e.type === "goal" && <>⚽ {name(e.playerId)}{e.assistPlayerId ? ` (assist: ${name(e.assistPlayerId)})` : ""}{e.isOwnGoal ? " (OG)" : ""}</>}
          {e.type === "card" && <>{e.cardType === "yellow" ? "🟨" : "🟥"} {name(e.playerId)}</>}
          {e.type === "substitution" && <>🔁 {name(e.playerInId)} in for {name(e.playerOutId)}</>}
        </div>
      ))}
    </div>
  );
}

const closeBtnStyle = { background: "transparent", border: "1px solid var(--turf-line)", color: "var(--chalk-dim)", borderRadius: "var(--radius-sm)", padding: "6px 12px", cursor: "pointer" };
const smallBtn = { border: "1px solid var(--turf-line)", background: "var(--turf-raised)", color: "var(--chalk)", borderRadius: "var(--radius-sm)", padding: "6px 10px", fontSize: 13, cursor: "pointer" };
const selectStyle = { width: "100%", marginTop: 6, background: "var(--turf)", border: "1px solid var(--turf-line)", color: "var(--chalk)", borderRadius: "var(--radius-sm)", padding: "6px 10px" };
const numInputStyle = { width: 50, background: "var(--turf)", border: "1px solid var(--turf-line)", color: "var(--chalk)", borderRadius: "var(--radius-sm)", padding: "2px 6px" };
