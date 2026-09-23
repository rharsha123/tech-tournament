import React, { useState } from "react";
import { createInnings, recordBall, undoLastBall, currentRunRate, requiredRunRate } from "../../sports/cricket/cricketEngine";

const EXTRAS = [
  { id: null, label: "Runs" },
  { id: "wide", label: "Wide" },
  { id: "noBall", label: "No Ball" },
  { id: "bye", label: "Bye" },
  { id: "legBye", label: "Leg Bye" },
];
const RUN_VALUES = [0, 1, 2, 3, 4, 5, 6];

/**
 * Cricket live scoring console. Fully driven by cricketEngine.js so undo, run rate,
 * and end-of-innings detection are all correct by construction — this component
 * only handles button layout and persisting `innings` upward (e.g. to Firestore)
 * via onChange after every ball.
 */
export default function CricketScoringConsole({ match, players, onChange, onClose }) {
  const [innings, setInnings] = useState(
    match.innings || createInnings({
      battingTeam: match.teamA,
      bowlingTeam: match.teamB,
      oversLimit: match.oversLimit || 20,
    })
  );
  const [extraType, setExtraType] = useState(null);
  const [pendingWicket, setPendingWicket] = useState(false);
  const [dismissalType, setDismissalType] = useState("Bowled");

  function commit(next) {
    setInnings(next);
    onChange?.(next);
  }

  function handleRun(runs) {
    const ball = {
      runs, extraType,
      isWicket: pendingWicket,
      dismissal: pendingWicket ? { type: dismissalType, bowler: innings.bowler } : null,
    };
    commit(recordBall(innings, ball));
    setExtraType(null);
    setPendingWicket(false);
  }

  function handleUndo() {
    commit(undoLastBall(innings));
  }

  const overs = `${Math.floor(innings.balls / 6)}.${innings.balls % 6}`;
  const rr = currentRunRate(innings);
  const reqRR = requiredRunRate(innings);

  return (
    <div className="sb-panel" style={{ padding: "var(--space-4)", maxWidth: 640 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <div className="sb-display" style={{ fontSize: 40, lineHeight: 1 }}>
            {innings.runs}/{innings.wickets}
            <span style={{ fontSize: 18, color: "var(--chalk-dim)", marginLeft: 10 }}>({overs} ov)</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--chalk-dim)", marginTop: 4 }}>
            CRR {rr} {reqRR !== null && <>· Need {innings.target - innings.runs} off {innings.oversLimit * 6 - innings.balls} balls (RRR {reqRR})</>}
          </div>
        </div>
        {onClose && <button onClick={onClose} style={closeBtnStyle}>Close</button>}
      </div>

      {innings.isComplete && (
        <div style={{ marginTop: 12, padding: 10, background: "var(--turf-raised)", borderRadius: "var(--radius-sm)", color: "var(--signal)", fontWeight: 700 }}>
          Innings complete
        </div>
      )}

      <div className="sb-hairline" style={{ margin: "var(--space-3) 0", paddingBottom: "var(--space-3)", fontSize: 13, color: "var(--chalk-dim)" }}>
        Striker: <b style={{ color: "var(--chalk)" }}>{playerName(players, innings.striker)}</b> ({innings.batsmen[innings.striker]?.runs ?? 0}
        {" "}off {innings.batsmen[innings.striker]?.ballsFaced ?? 0}) ·
        Non-striker: <b style={{ color: "var(--chalk)" }}>{playerName(players, innings.nonStriker)}</b> ·
        Bowler: <b style={{ color: "var(--chalk)" }}>{playerName(players, innings.bowler)}</b>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {EXTRAS.map((e) => (
          <button key={e.id ?? "runs"} onClick={() => setExtraType(e.id)}
            style={pillStyle(extraType === e.id)}>{e.label}</button>
        ))}
        <button onClick={() => setPendingWicket((w) => !w)} style={pillStyle(pendingWicket, "var(--cricket)")}>Wicket</button>
      </div>

      {pendingWicket && (
        <select value={dismissalType} onChange={(e) => setDismissalType(e.target.value)} style={selectStyle}>
          {["Bowled", "Caught", "LBW", "Run Out", "Stumped", "Hit Wicket", "Retired Hurt"].map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 10 }}>
        {RUN_VALUES.map((r) => (
          <button key={r} onClick={() => handleRun(r)} disabled={innings.isComplete}
            className="sb-display" style={runBtnStyle}>{r}</button>
        ))}
        <button onClick={handleUndo} style={{ ...runBtnStyle, background: "transparent", border: "1px solid var(--turf-line)", gridColumn: "span 2" }}>
          Undo Last Ball
        </button>
      </div>

      <div style={{ display: "flex", gap: 4, marginTop: "var(--space-3)" }}>
        {innings.currentOverBalls.map((b, i) => (
          <div key={i} className="sb-display" style={overBallStyle(b)}>
            {b.isWicket ? "W" : b.extraType ? b.extraType[0].toUpperCase() : b.runs}
          </div>
        ))}
      </div>
    </div>
  );
}

function playerName(players, id) {
  return players?.[id]?.name || "—";
}

function pillStyle(active, activeColor = "var(--signal)") {
  return {
    padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer",
    border: `1px solid ${active ? activeColor : "var(--turf-line)"}`,
    background: active ? activeColor : "transparent",
    color: active ? "var(--signal-ink)" : "var(--chalk-dim)",
  };
}
const runBtnStyle = {
  padding: "14px 0", fontSize: 20, borderRadius: "var(--radius-sm)", border: "1px solid var(--turf-line)",
  background: "var(--turf-raised)", color: "var(--chalk)", cursor: "pointer",
};
const closeBtnStyle = {
  background: "transparent", border: "1px solid var(--turf-line)", color: "var(--chalk-dim)",
  borderRadius: "var(--radius-sm)", padding: "6px 12px", cursor: "pointer",
};
const selectStyle = {
  marginTop: 8, background: "var(--turf)", border: "1px solid var(--turf-line)", color: "var(--chalk)",
  borderRadius: "var(--radius-sm)", padding: "6px 10px",
};
function overBallStyle(b) {
  return {
    width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
    borderRadius: "50%", fontSize: 13,
    background: b.isWicket ? "var(--cricket)" : "var(--turf-line)",
    color: b.isWicket ? "#fff" : "var(--chalk)",
  };
}
