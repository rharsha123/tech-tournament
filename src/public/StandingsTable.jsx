import React from "react";
import { sortStandings } from "../core/fixtures/roundRobin";

/**
 * rows: [{ team: {id,name}, played, wins, losses, draws, points, netRunRate|goalDifference|... }]
 * tiebreakerKey lets each sport plug in its own tiebreaker (netRunRate for cricket,
 * goalDifference for football, gameDifference for badminton).
 */
export default function StandingsTable({ rows, tiebreakerKey = "netRunRate", tiebreakerLabel = "NRR" }) {
  const sorted = sortStandings(rows, { tiebreakerKey });

  return (
    <div className="sb-panel" style={{ overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr className="sb-hairline">
            <th style={th}>#</th>
            <th style={{ ...th, textAlign: "left" }}>TEAM</th>
            <th style={th}>P</th>
            <th style={th}>W</th>
            <th style={th}>L</th>
            <th style={th}>D</th>
            <th style={th}>{tiebreakerLabel}</th>
            <th style={th}>PTS</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={row.team.id} className="sb-hairline">
              <td style={{ ...td, color: "var(--chalk-dim)" }}>{i + 1}</td>
              <td style={{ ...td, textAlign: "left", fontWeight: 600 }}>{row.team.name}</td>
              <td style={td}>{row.played ?? 0}</td>
              <td style={td}>{row.wins ?? 0}</td>
              <td style={td}>{row.losses ?? 0}</td>
              <td style={td}>{row.draws ?? 0}</td>
              <td style={td}>{(row[tiebreakerKey] ?? 0).toFixed?.(2) ?? row[tiebreakerKey]}</td>
              <td className="sb-display" style={{ ...td, color: "var(--signal)" }}>{row.points ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th = { padding: "10px 12px", fontSize: 11, color: "var(--chalk-dim)", fontWeight: 600, textAlign: "center" };
const td = { padding: "10px 12px", fontSize: 14, textAlign: "center" };
