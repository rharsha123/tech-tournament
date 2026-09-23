// Round-robin fixture generator using the circle method.
// Works for any team count (odd counts get a "BYE" placeholder that is filtered out).
// Sport-agnostic: just produces { round, teamA, teamB } pairings; the caller attaches
// venue/date/time and sport-specific defaults.

const BYE = "__BYE__";

/**
 * @param {Array<{id:string,name:string}>} teams
 * @param {{doubleRound?: boolean}} options doubleRound = play home & away (reverse fixtures too)
 * @returns {Array<{round:number, teamA:{id,name}, teamB:{id,name}}>}
 */
export function generateRoundRobin(teams, options = {}) {
  const { doubleRound = false } = options;
  if (!teams || teams.length < 2) return [];

  const list = [...teams];
  if (list.length % 2 !== 0) list.push({ id: BYE, name: BYE });

  const n = list.length;
  const rounds = n - 1;
  const half = n / 2;
  const fixtures = [];

  // Fix the first team, rotate the rest.
  let arr = [...list];
  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const teamA = arr[i];
      const teamB = arr[n - 1 - i];
      if (teamA.id !== BYE && teamB.id !== BYE) {
        fixtures.push({ round: r + 1, teamA, teamB });
      }
    }
    // rotate: keep arr[0] fixed, rotate the rest clockwise
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop());
    arr = [fixed, ...rest];
  }

  if (doubleRound) {
    const reverseLeg = fixtures.map((f) => ({
      round: f.round + rounds,
      teamA: f.teamB,
      teamB: f.teamA,
    }));
    return [...fixtures, ...reverseLeg];
  }

  return fixtures;
}

/** Group teams into N groups (snake-seeded so groups stay balanced by seed order). */
export function splitIntoGroups(teams, groupCount) {
  const groups = Array.from({ length: groupCount }, () => []);
  teams.forEach((team, idx) => {
    const cycle = Math.floor(idx / groupCount);
    const posInCycle = idx % groupCount;
    const groupIdx = cycle % 2 === 0 ? posInCycle : groupCount - 1 - posInCycle;
    groups[groupIdx].push(team);
  });
  return groups.map((teamsInGroup, i) => ({
    groupId: `G${i + 1}`,
    groupName: `Group ${String.fromCharCode(65 + i)}`,
    teams: teamsInGroup,
  }));
}

/** Standard points-table sort: points desc, then a sport-specific tiebreaker value desc. */
export function sortStandings(rows, { tiebreakerKey = "netRunRate" } = {}) {
  return [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if ((b[tiebreakerKey] ?? 0) !== (a[tiebreakerKey] ?? 0)) return (b[tiebreakerKey] ?? 0) - (a[tiebreakerKey] ?? 0);
    return (b.wins ?? 0) - (a.wins ?? 0);
  });
}
