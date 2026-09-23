export function aggregateFootballStats(matches, playersById) {
  const table = {};

  function touch(playerId) {
    if (!table[playerId]) {
      const p = playersById[playerId] || {};
      table[playerId] = {
        playerId,
        playerName: p.name || "Unknown",
        teamId: p.teamId,
        teamName: p.teamName,
        position: p.position,
        metrics: { goals: 0, assists: 0, yellowCards: 0, redCards: 0, appearances: 0, cleanSheets: 0 },
      };
    }
    return table[playerId];
  }

  matches.forEach((match) => {
    const playedIds = new Set();
    (match.events || []).forEach((e) => {
      if (e.type === "goal") {
        playedIds.add(e.playerId);
        if (!e.isOwnGoal) touch(e.playerId).metrics.goals += 1;
        if (e.assistPlayerId) {
          playedIds.add(e.assistPlayerId);
          touch(e.assistPlayerId).metrics.assists += 1;
        }
      }
      if (e.type === "card") {
        playedIds.add(e.playerId);
        touch(e.playerId).metrics[e.cardType === "yellow" ? "yellowCards" : "redCards"] += 1;
      }
    });
    playedIds.forEach((id) => (touch(id).metrics.appearances += 1));

    // Clean sheet credit for the goalkeeper(s) of the team that conceded zero.
    if (match.homeScore === 0 && match.awayGoalkeeperId) touch(match.awayGoalkeeperId).metrics.cleanSheets += 1;
    if (match.awayScore === 0 && match.homeGoalkeeperId) touch(match.homeGoalkeeperId).metrics.cleanSheets += 1;
  });

  return Object.values(table).map((row) => {
    const { metrics } = row;
    const impact = metrics.goals * 10 + metrics.assists * 6 + metrics.cleanSheets * 8 - metrics.redCards * 5 - metrics.yellowCards * 1;
    row.impactScore = Math.max(0, impact);
    return row;
  });
}
