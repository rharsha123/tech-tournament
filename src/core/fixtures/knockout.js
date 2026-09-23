// Knockout bracket generator. Handles non-power-of-2 team counts with byes
// awarded to the top seeds so the bracket still resolves cleanly.

function nextPowerOf2(n) {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * @param {Array<{id:string,name:string}>} seededTeams teams in seed order (1st seed first)
 * @returns {{rounds: Array<{roundNumber:number, roundName:string, matches: Array}>}}
 */
export function generateKnockoutBracket(seededTeams) {
  const teams = [...seededTeams];
  if (teams.length < 2) return { rounds: [] };

  const bracketSize = nextPowerOf2(teams.length);
  const byeCount = bracketSize - teams.length;

  // Standard seeding order for a single-elimination bracket (1 vs 16, 8 vs 9, etc.)
  const seedOrder = buildSeedOrder(bracketSize);
  const slots = seedOrder.map((seedPos) => teams[seedPos - 1] || null); // null = bye slot

  const round1Matches = [];
  for (let i = 0; i < slots.length; i += 2) {
    const teamA = slots[i];
    const teamB = slots[i + 1];
    round1Matches.push({
      matchId: `R1-M${i / 2 + 1}`,
      teamA,
      teamB,
      isBye: !teamA || !teamB,
      winner: !teamA ? teamB : !teamB ? teamA : null,
    });
  }

  const totalRounds = Math.log2(bracketSize);
  const rounds = [{ roundNumber: 1, roundName: roundName(1, totalRounds), matches: round1Matches }];

  // Subsequent rounds start empty (TBD) until previous round winners are known.
  let matchesInRound = round1Matches.length / 2;
  for (let r = 2; r <= totalRounds; r++) {
    const matches = Array.from({ length: matchesInRound }, (_, i) => ({
      matchId: `R${r}-M${i + 1}`,
      teamA: null,
      teamB: null,
      isBye: false,
      winner: null,
    }));
    rounds.push({ roundNumber: r, roundName: roundName(r, totalRounds), matches });
    matchesInRound = matchesInRound / 2;
  }

  return { rounds, byeCount };
}

/** Advances a winner into the correct slot of the next round. Call after recording each result. */
export function advanceWinner(rounds, roundNumber, matchIndex, winnerTeam) {
  const updated = rounds.map((r) => ({ ...r, matches: r.matches.map((m) => ({ ...m })) }));
  updated[roundNumber - 1].matches[matchIndex].winner = winnerTeam;

  const nextRound = updated[roundNumber]; // roundNumber is 1-indexed, so this is the next one
  if (!nextRound) return updated;

  const nextMatchIndex = Math.floor(matchIndex / 2);
  const slot = matchIndex % 2 === 0 ? "teamA" : "teamB";
  nextRound.matches[nextMatchIndex][slot] = winnerTeam;
  return updated;
}

function roundName(roundNumber, totalRounds) {
  const remaining = totalRounds - roundNumber + 1;
  if (remaining === 1) return "Final";
  if (remaining === 2) return "Semi-Final";
  if (remaining === 3) return "Quarter-Final";
  return `Round ${roundNumber}`;
}

function buildSeedOrder(size) {
  // Recursive standard-bracket seeding: [1,2] -> [1,4,3,2] -> [1,8,5,4,3,6,7,2] ...
  let order = [1, 2];
  while (order.length < size) {
    const total = order.length * 2 + 1;
    const next = [];
    order.forEach((seed) => {
      next.push(seed, total - seed);
    });
    order = next;
  }
  return order;
}
