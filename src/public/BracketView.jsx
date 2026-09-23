import React from "react";

/** Renders the { rounds: [{roundName, matches}] } shape produced by core/fixtures/knockout.js. */
export default function BracketView({ rounds }) {
  if (!rounds?.length) return null;

  return (
    <div style={{ display: "flex", gap: "var(--space-5)", overflowX: "auto", padding: "var(--space-2) 0" }}>
      {rounds.map((round) => (
        <div key={round.roundNumber} style={{ minWidth: 200, display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
          <div className="sb-display" style={{ fontSize: 13, color: "var(--chalk-dim)", marginBottom: "var(--space-2)", textAlign: "center" }}>
            {round.roundName.toUpperCase()}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", flex: 1, justifyContent: "space-around" }}>
            {round.matches.map((m) => (
              <div key={m.matchId} className="sb-panel" style={{ padding: "var(--space-2) var(--space-3)" }}>
                <TeamRow name={m.teamA?.name} isWinner={m.winner && m.winner.id === m.teamA?.id} />
                <div className="sb-hairline" />
                <TeamRow name={m.isBye ? "BYE" : m.teamB?.name} isWinner={m.winner && m.winner.id === m.teamB?.id} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TeamRow({ name, isWinner }) {
  return (
    <div style={{
      padding: "6px 2px", fontSize: 13,
      color: isWinner ? "var(--signal)" : "var(--chalk)",
      fontWeight: isWinner ? 700 : 400,
    }}>
      {name || "TBD"}
    </div>
  );
}
