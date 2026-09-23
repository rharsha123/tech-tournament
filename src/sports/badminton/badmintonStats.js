export function aggregateBadmintonStats(matches, playersById) {
  const table = {};

  function touch(playerId) {
    if (!table[playerId]) {
      const p = playersById[playerId] || {};
      table[playerId] = {
        playerId,
        playerName: p.name || "Unknown",
        teamId: p.teamId,
        teamName: p.teamName,
        metrics: { matchesPlayed: 0, matchWins: 0, gamesWon: 0, gamesLost: 0, pointsWon: 0, pointsConceded: 0 },
      };
    }
    return table[playerId];
  }

  matches.forEach((match) => {
    const sideAWon = match.winner === "A";
    [...match.sideA.players].forEach((id) => {
      const row = touch(id);
      row.metrics.matchesPlayed += 1;
      if (sideAWon) row.metrics.matchWins += 1;
      row.metrics.gamesWon += match.gamesWonA;
      row.metrics.gamesLost += match.gamesWonB;
      match.games.forEach((g) => { row.metrics.pointsWon += g.scoreA; row.metrics.pointsConceded += g.scoreB; });
    });
    [...match.sideB.players].forEach((id) => {
      const row = touch(id);
      row.metrics.matchesPlayed += 1;
      if (!sideAWon) row.metrics.matchWins += 1;
      row.metrics.gamesWon += match.gamesWonB;
      row.metrics.gamesLost += match.gamesWonA;
      match.games.forEach((g) => { row.metrics.pointsWon += g.scoreB; row.metrics.pointsConceded += g.scoreA; });
    });
  });

  return Object.values(table).map((row) => {
    const { metrics } = row;
    metrics.winPct = metrics.matchesPlayed > 0 ? +((metrics.matchWins / metrics.matchesPlayed) * 100).toFixed(1) : 0;
    row.impactScore = Math.round(metrics.matchWins * 15 + metrics.winPct * 0.5 + (metrics.pointsWon - metrics.pointsConceded) * 0.1);
    return row;
  });
}
