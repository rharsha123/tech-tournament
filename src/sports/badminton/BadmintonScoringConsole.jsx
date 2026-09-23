import React, { useState } from "react";
import { createBadmintonMatch, recordPoint, undoPoint, isDeuce } from "../../sports/badminton/badmintonEngine";

export default function BadmintonScoringConsole({ match, onChange, onClose }) {
  const [state, setState] = useState(
    match.badmintonState || createBadmintonMatch({ sideA: match.sideA, sideB: match.sideB })
  );

  function commit(next) {
    setState(next);
    onChange?.(next);
  }

  const currentGame = state.games[state.games.length - 1];
  const deuce = isDeuce(currentGame, state.pointsPerGame);

  return (
    <div className="sb-panel" style={{ padding: "var(--space-4)", maxWidth: 480 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontSize: 13, color: "var(--chalk-dim)" }}>
          Games: {state.gamesWonA} — {state.gamesWonB}
          {deuce && <span style={{ color: "var(--signal)", marginLeft: 8, fontWeight: 700 }}>DEUCE</span>}
        </div>
        {onClose && <button onClick={onClose} style={closeBtnStyle}>Close</button>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 16, margin: "var(--space-4) 0" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "var(--chalk-dim)", marginBottom: 4 }}>{sideLabel(state.sideA)}</div>
          <div className="sb-display" style={{ fontSize: 56 }}>{currentGame.scoreA}</div>
        </div>
        <div className="sb-display" style={{ fontSize: 20, color: "var(--chalk-dim)" }}>vs</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "var(--chalk-dim)", marginBottom: 4 }}>{sideLabel(state.sideB)}</div>
          <div className="sb-display" style={{ fontSize: 56 }}>{currentGame.scoreB}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button disabled={state.isComplete} onClick={() => commit(recordPoint(state, "A"))} style={pointBtn}>Point A</button>
        <button disabled={state.isComplete} onClick={() => commit(recordPoint(state, "B"))} style={pointBtn}>Point B</button>
      </div>
      <button onClick={() => commit(undoPoint(state))} style={{ ...pointBtn, width: "100%", marginTop: 8, background: "transparent", border: "1px solid var(--turf-line)" }}>
        Undo
      </button>

      <div style={{ marginTop: "var(--space-4)", fontSize: 12, color: "var(--chalk-dim)" }}>
        {state.games.map((g, i) => (
          <span key={i} style={{ marginRight: 14 }}>Game {i + 1}: {g.scoreA}-{g.scoreB}</span>
        ))}
      </div>

      {state.isComplete && (
        <div style={{ marginTop: 12, padding: 10, background: "var(--turf-raised)", borderRadius: "var(--radius-sm)", color: "var(--signal)", fontWeight: 700 }}>
          Match complete — {sideLabel(state.winner === "A" ? state.sideA : state.sideB)} wins
        </div>
      )}
    </div>
  );
}

function sideLabel(side) {
  return (side?.players || []).join(" / ") || "—";
}

const closeBtnStyle = { background: "transparent", border: "1px solid var(--turf-line)", color: "var(--chalk-dim)", borderRadius: "var(--radius-sm)", padding: "6px 12px", cursor: "pointer" };
const pointBtn = { padding: "16px 0", fontSize: 15, fontWeight: 700, borderRadius: "var(--radius-sm)", border: "1px solid var(--badminton)", background: "var(--badminton)", color: "#fff", cursor: "pointer" };
