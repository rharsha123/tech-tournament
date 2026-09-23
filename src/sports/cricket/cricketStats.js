// Aggregates per-match innings data into tournament-wide player stats,
// in the common { playerId, playerName, teamId, metrics, impactScore } shape
// consumed by src/core/stats/awards.js.

export function aggregateCricketStats(matches, playersById) {
  const table = {}; // playerId -> accumulating metrics

  function touch(playerId) {
    if (!table[playerId]) {
      const p = playersById[playerId] || {};
      table[playerId] = {
        playerId,
        playerName: p.name || "Unknown",
        teamId: p.teamId,
        teamName: p.teamName,
        metrics: {
          runs: 0, ballsFaced: 0, fours: 0, sixes: 0, innings: 0, notOuts: 0,
          wickets: 0, ballsBowled: 0, runsConceded: 0, maidens: 0,
        },
      };
    }
    return table[playerId];
  }

  matches.forEach((match) => {
    (match.innings || []).forEach((innings) => {
      Object.entries(innings.batsmen || {}).forEach(([playerId, b]) => {
        const row = touch(playerId);
        row.metrics.runs += b.runs;
        row.metrics.ballsFaced += b.ballsFaced;
        row.metrics.fours += b.fours;
        row.metrics.sixes += b.sixes;
        row.metrics.innings += 1;
        if (!b.out) row.metrics.notOuts += 1;
      });
      Object.entries(innings.bowlers || {}).forEach(([playerId, bw]) => {
        const row = touch(playerId);
        row.metrics.wickets += bw.wickets;
        row.metrics.ballsBowled += bw.ballsBowled;
        row.metrics.runsConceded += bw.runsConceded;
        row.metrics.maidens += bw.maidens;
      });
    });
  });

  return Object.values(table).map((row) => {
    const { metrics } = row;
    metrics.strikeRate = metrics.ballsFaced > 0 ? +((metrics.runs / metrics.ballsFaced) * 100).toFixed(1) : 0;
    metrics.average = metrics.innings - metrics.notOuts > 0
      ? +(metrics.runs / (metrics.innings - metrics.notOuts)).toFixed(1)
      : metrics.runs;
    metrics.economy = metrics.ballsBowled > 0 ? +((metrics.runsConceded / (metrics.ballsBowled / 6))).toFixed(2) : 0;

    // Simple composite impact score for the cross-sport MVP leaderboard (0-100 scale, tunable).
    const battingImpact = metrics.runs * 1 + metrics.fours * 1 + metrics.sixes * 2 + metrics.strikeRate * 0.2;
    const bowlingImpact = metrics.wickets * 20 + metrics.maidens * 5 - metrics.economy * 2;
    row.impactScore = Math.max(0, Math.round(battingImpact + bowlingImpact));
    return row;
  });
}
