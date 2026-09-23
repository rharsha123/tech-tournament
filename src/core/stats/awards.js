// Sport-aware awards & leaderboard computation.
// Each sport's raw match data feeds through a per-sport aggregator (see src/sports/*/stats.js),
// which all produce a common shape: { playerId, playerName, teamId, teamName, metrics: {...} }
// so this file can rank them generically.

/** Generic top-N ranking by a metric, descending, with a minimum-qualifier filter. */
export function rankBy(players, metricKey, { minQualifier, qualifierKey, topN = 10 } = {}) {
  const eligible = minQualifier
    ? players.filter((p) => (p.metrics[qualifierKey] ?? 0) >= minQualifier)
    : players;
  return [...eligible]
    .sort((a, b) => (b.metrics[metricKey] ?? 0) - (a.metrics[metricKey] ?? 0))
    .slice(0, topN);
}

/** Cricket: Best Batsman (by runs, min. balls faced) & Best Bowler (by wickets, then economy). */
export function cricketAwards(playerStats) {
  return {
    bestBatsmen: rankBy(playerStats, "runs", { qualifierKey: "ballsFaced", minQualifier: 1 }),
    bestBowlers: [...playerStats]
      .filter((p) => (p.metrics.ballsBowled ?? 0) > 0)
      .sort((a, b) => (b.metrics.wickets - a.metrics.wickets) || (a.metrics.economy - b.metrics.economy))
      .slice(0, 10),
    orangeCap: rankBy(playerStats, "runs", { topN: 1 })[0] || null, // most runs, tournament
    purpleCap: [...playerStats]
      .sort((a, b) => b.metrics.wickets - a.metrics.wickets)
      .slice(0, 1)[0] || null, // most wickets, tournament
  };
}

/** Football: Top Scorer, Most Assists, Best Goalkeeper (by clean sheets). */
export function footballAwards(playerStats) {
  return {
    topScorers: rankBy(playerStats, "goals"),
    mostAssists: rankBy(playerStats, "assists"),
    cleanSheets: [...playerStats]
      .filter((p) => p.position === "Goalkeeper")
      .sort((a, b) => b.metrics.cleanSheets - a.metrics.cleanSheets)
      .slice(0, 5),
  };
}

/** Badminton: Most Match Wins, Best Win %, Most Points Won. */
export function badmintonAwards(playerStats) {
  return {
    mostWins: rankBy(playerStats, "matchWins"),
    bestWinPct: [...playerStats]
      .filter((p) => (p.metrics.matchesPlayed ?? 0) >= 1)
      .sort((a, b) => b.metrics.winPct - a.metrics.winPct)
      .slice(0, 10),
  };
}

/**
 * Tournament MVP: sport-agnostic composite score so cricket/football/badminton standouts
 * can all be ranked on one leaderboard. Each sport supplies a normalized 0-100 "impactScore".
 */
export function tournamentMVP(allPlayerStatsAcrossSports) {
  return [...allPlayerStatsAcrossSports]
    .sort((a, b) => (b.impactScore ?? 0) - (a.impactScore ?? 0))
    .slice(0, 10);
}

/** Man of the Match: either admin-picked, or auto-suggested from the match's top impact score. */
export function suggestMotm(matchPlayerPerformances) {
  if (!matchPlayerPerformances?.length) return null;
  return [...matchPlayerPerformances].sort((a, b) => (b.impactScore ?? 0) - (a.impactScore ?? 0))[0];
}
