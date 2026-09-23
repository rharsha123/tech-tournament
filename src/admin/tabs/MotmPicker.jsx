import React, { useState } from "react";
import { suggestMotm } from "../../core/stats/awards";

/**
 * matchPlayerPerformances: [{ playerId, playerName, teamName, impactScore }]
 * (build this from the match's innings/events + the same impactScore logic used in
 * cricketStats.js / footballStats.js / badmintonStats.js, scoped to this one match)
 */
export default function MotmPicker({ matchPlayerPerformances = [], value, onSelect }) {
  const suggestion = suggestMotm(matchPlayerPerformances);
  const [manualOverride, setManualOverride] = useState(false);
  const selected = value || suggestion?.playerId;

  return (
    <div className="sb-panel" style={{ padding: "var(--space-3) var(--space-4)" }}>
      <div style={{ fontSize: 12, color: "var(--chalk-dim)", marginBottom: 8 }}>MAN OF THE MATCH</div>

      {!manualOverride && suggestion ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700 }}>{suggestion.playerName}</div>
            <div style={{ fontSize: 12, color: "var(--chalk-dim)" }}>{suggestion.teamName} · Impact {suggestion.impactScore}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => onSelect?.(suggestion.playerId)} style={confirmBtn}>Confirm</button>
            <button onClick={() => setManualOverride(true)} style={changeBtn}>Change</button>
          </div>
        </div>
      ) : (
        <select value={selected || ""} onChange={(e) => onSelect?.(e.target.value)} style={selectStyle}>
          <option value="">Select player…</option>
          {matchPlayerPerformances.map((p) => (
            <option key={p.playerId} value={p.playerId}>{p.playerName} — {p.teamName}</option>
          ))}
        </select>
      )}

      {!suggestion && matchPlayerPerformances.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--chalk-dim)" }}>No player performance data recorded yet for this match.</div>
      )}
    </div>
  );
}

const confirmBtn = { background: "var(--signal)", color: "var(--signal-ink)", border: "none", borderRadius: "var(--radius-sm)", padding: "6px 14px", fontWeight: 700, cursor: "pointer" };
const changeBtn = { background: "transparent", color: "var(--chalk-dim)", border: "1px solid var(--turf-line)", borderRadius: "var(--radius-sm)", padding: "6px 14px", cursor: "pointer" };
const selectStyle = { width: "100%", background: "var(--turf)", border: "1px solid var(--turf-line)", color: "var(--chalk)", borderRadius: "var(--radius-sm)", padding: "8px 10px" };
