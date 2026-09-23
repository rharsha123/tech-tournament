import React from "react";

/**
 * A scoreboard-style leaderboard panel. Shared across all sports/awards —
 * each caller just passes rows + which metric columns to show.
 *
 * columns: [{ key: 'runs', label: 'RUNS' }, { key: 'strikeRate', label: 'SR' }]
 */
export default function LeaderboardPanel({ title, sport, rows, columns, emptyLabel = "No data yet" }) {
  return (
    <div className="sb-panel" style={{ overflow: "hidden" }}>
      <div className="sb-hairline" style={{ padding: "var(--space-3) var(--space-4)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 className="sb-display" style={{ fontSize: 20, margin: 0, color: "var(--chalk)" }}>{title}</h3>
        {sport && <SportTagInline sport={sport} />}
      </div>

      {(!rows || rows.length === 0) ? (
        <div style={{ padding: "var(--space-5)", color: "var(--chalk-dim)", fontSize: 14 }}>{emptyLabel}</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr className="sb-hairline">
              <th style={thStyle}>#</th>
              <th style={{ ...thStyle, textAlign: "left" }}>PLAYER</th>
              {columns.map((c) => (
                <th key={c.key} style={thStyle}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.playerId} className="sb-hairline">
                <td style={{ ...tdStyle, color: "var(--chalk-dim)" }}>{i + 1}</td>
                <td style={{ ...tdStyle, textAlign: "left", fontWeight: 600 }}>
                  {row.playerName}
                  <div style={{ fontSize: 11, color: "var(--chalk-dim)", fontWeight: 400 }}>{row.teamName}</div>
                </td>
                {columns.map((c) => (
                  <td key={c.key} className="sb-display" style={{ ...tdStyle, color: "var(--signal)" }}>
                    {row.metrics ? row.metrics[c.key] : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SportTagInline({ sport }) {
  const key = (sport || "").toLowerCase();
  return <span className={`sb-tag sb-tag--${key}`}>{sport.toUpperCase()}</span>;
}

const thStyle = { padding: "var(--space-2) var(--space-3)", fontSize: 11, color: "var(--chalk-dim)", fontWeight: 600, textAlign: "center" };
const tdStyle = { padding: "var(--space-2) var(--space-3)", fontSize: 14, textAlign: "center" };
