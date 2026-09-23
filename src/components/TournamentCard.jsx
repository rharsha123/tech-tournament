import React from "react";
import SportTag from "../design/components/SportTag";

export default function TournamentCard({ tournament, onSelect }) {
  const isLive = tournament.status === "Live";

  return (
    <div
      onClick={() => onSelect && onSelect(tournament)}
      className="sb-panel"
      style={{ padding: "var(--space-4)", cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: "var(--space-2)" }}>
          <SportTag sport={tournament.sport || tournament.category || "cricket"} />
          <span
            style={{
              fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: "var(--radius-sm)",
              display: "flex", alignItems: "center", gap: 5,
              color: isLive ? "var(--signal)" : "var(--chalk-dim)",
              background: isLive ? "var(--turf-raised)" : "transparent",
              border: isLive ? "none" : "1px solid var(--turf-line)",
            }}
          >
            {isLive && <span className="sb-live-dot" />}
            {tournament.status || "Upcoming"}
          </span>
        </div>

        <h3 className="sb-display" style={{ fontSize: 20, color: "var(--chalk)", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {tournament.name}
        </h3>
        <p style={{ fontSize: 13, color: "var(--chalk-dim)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {tournament.venue || "Venue TBA"}
        </p>
      </div>

      <div className="sb-hairline" style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-3)", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
        <span style={{ color: "var(--chalk-dim)" }}>{tournament.startDate || ""}</span>
        <span style={{ color: "var(--signal)", fontWeight: 600 }}>View details &rarr;</span>
      </div>
    </div>
  );
}
