import React, { useMemo } from "react";
import LeaderboardPanel from "../../design/components/LeaderboardPanel";
import { aggregateCricketStats } from "../../sports/cricket/cricketStats";
import { aggregateFootballStats } from "../../sports/football/footballStats";
import { aggregateBadmintonStats } from "../../sports/badminton/badmintonStats";
import { cricketAwards, footballAwards, badmintonAwards, tournamentMVP } from "../../core/stats/awards";

/**
 * Renders Best Batsman / Best Bowler / Top Scorer / MVP etc. for a tournament.
 * Pass in the raw match documents for each sport plus a playersById lookup —
 * this component does not care where that data came from (Firestore, mock, etc).
 */
export default function StatsAwardsTab({ sport, matches = [], playersById = {} }) {
  const cricketStats = useMemo(
    () => (sport === "cricket" ? aggregateCricketStats(matches, playersById) : []),
    [sport, matches, playersById]
  );
  const footballStats = useMemo(
    () => (sport === "football" ? aggregateFootballStats(matches, playersById) : []),
    [sport, matches, playersById]
  );
  const badmintonStats = useMemo(
    () => (sport === "badminton" ? aggregateBadmintonStats(matches, playersById) : []),
    [sport, matches, playersById]
  );

  const allStats = [...cricketStats, ...footballStats, ...badmintonStats];
  const mvp = tournamentMVP(allStats);

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <LeaderboardPanel
        title="Tournament MVP"
        rows={mvp}
        columns={[{ key: "impactScore", label: "IMPACT" }]}
        emptyLabel="MVP leaderboard fills in once matches are scored."
      />

      {sport === "cricket" && (() => {
        const awards = cricketAwards(cricketStats);
        return (
          <>
            <LeaderboardPanel
              title="Orange Cap — Most Runs"
              sport="cricket"
              rows={awards.bestBatsmen}
              columns={[
                { key: "runs", label: "RUNS" },
                { key: "strikeRate", label: "SR" },
                { key: "fours", label: "4s" },
                { key: "sixes", label: "6s" },
              ]}
            />
            <LeaderboardPanel
              title="Purple Cap — Most Wickets"
              sport="cricket"
              rows={awards.bestBowlers}
              columns={[
                { key: "wickets", label: "WKTS" },
                { key: "economy", label: "ECON" },
                { key: "maidens", label: "MDNS" },
              ]}
            />
          </>
        );
      })()}

      {sport === "football" && (() => {
        const awards = footballAwards(footballStats);
        return (
          <>
            <LeaderboardPanel
              title="Top Scorer"
              sport="football"
              rows={awards.topScorers}
              columns={[
                { key: "goals", label: "GOALS" },
                { key: "appearances", label: "APPS" },
              ]}
            />
            <LeaderboardPanel
              title="Most Assists"
              sport="football"
              rows={awards.mostAssists}
              columns={[{ key: "assists", label: "ASSISTS" }]}
            />
          </>
        );
      })()}

      {sport === "badminton" && (() => {
        const awards = badmintonAwards(badmintonStats);
        return (
          <LeaderboardPanel
            title="Most Match Wins"
            sport="badminton"
            rows={awards.mostWins}
            columns={[
              { key: "matchWins", label: "WINS" },
              { key: "winPct", label: "WIN %" },
            ]}
          />
        );
      })()}
    </div>
  );
}
