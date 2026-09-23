import React from "react";
import SportTag from "../design/components/SportTag";

/**
 * One match card for the public matches list. Sport-aware rendering of the score line,
 * shared chrome (teams, status, sport tag) so the Matches tab can just map over mixed-sport
 * match documents without per-sport branching at the list level.
 */
export default function LiveScoreboard({ match }) {
  const isLive = match.status === "live";

  return (
    <div className="sb-panel" style={{ padding: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
        <SportTag sport={match.sport} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: isLive ? "var(--signal)" : "var(--chalk-dim)", fontWeight: 600 }}>
          {isLive && <span className="sb-live-dot" />}
          {statusLabel(match)}
        </div>
      </div>

      {match.sport === "cricket" && <CricketScoreLine match={match} />}
      {match.sport === "football" && <FootballScoreLine match={match} />}
      {match.sport === "badminton" && <BadmintonScoreLine match={match} />}

      {match.venue && <div style={{ fontSize: 12, color: "var(--chalk-dim)", marginTop: "var(--space-3)" }}>{match.venue}</div>}
    </div>
  );
}

function statusLabel(match) {
  if (match.status === "live") return "LIVE";
  if (match.status === "completed") return match.resultSummary || "Completed";
  return match.date ? `${match.date} ${match.time || ""}`.trim() : "Upcoming";
}

function CricketScoreLine({ match }) {
  const innings = match.innings || [];
  return (
    <div style={{ display: "grid", gap: 6 }}>
      {[match.teamA, match.teamB].map((team, i) => {
        const inn = innings[i];
        return (
          <div key={team?.id ?? i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontWeight: 600 }}>{team?.name}</span>
            <span className="sb-display" style={{ fontSize: 22 }}>
              {inn ? `${inn.runs}/${inn.wickets}` : "-"}
              {inn && <span style={{ fontSize: 12, color: "var(--chalk-dim)", marginLeft: 6 }}>({Math.floor(inn.balls / 6)}.{inn.balls % 6})</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function FootballScoreLine({ match }) {
  const s = match.footballState;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontWeight: 600 }}>{match.teamA?.name}</span>
      <span className="sb-display" style={{ fontSize: 26 }}>{s ? `${s.homeScore} - ${s.awayScore}` : "vs"}</span>
      <span style={{ fontWeight: 600 }}>{match.teamB?.name}</span>
    </div>
  );
}

function BadmintonScoreLine({ match }) {
  const s = match.badmintonState;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontWeight: 600 }}>{(match.sideA?.players || []).join(" / ")}</span>
      <span className="sb-display" style={{ fontSize: 20 }}>{s ? `${s.gamesWonA} - ${s.gamesWonB}` : "vs"}</span>
      <span style={{ fontWeight: 600 }}>{(match.sideB?.players || []).join(" / ")}</span>
    </div>
  );
}
