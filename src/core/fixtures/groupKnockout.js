import { generateRoundRobin, splitIntoGroups, sortStandings } from "./roundRobin";
import { generateKnockoutBracket } from "./knockout";

/**
 * Generates the league (group) stage fixtures. Call generateKnockoutStage() separately
 * once group standings are known, so the bracket seeds off real results.
 */
export function generateGroupStage(teams, groupCount) {
  const groups = splitIntoGroups(teams, groupCount);
  return groups.map((g) => ({
    ...g,
    fixtures: generateRoundRobin(g.teams).map((f) => ({ ...f, groupId: g.groupId })),
  }));
}

/**
 * @param {Array<{groupId, standings: Array<{team, points, ...}>}>} groupsWithStandings
 * @param {number} qualifyPerGroup how many teams advance from each group
 */
export function generateKnockoutStage(groupsWithStandings, qualifyPerGroup = 2, tiebreakerKey = "netRunRate") {
  // Seed order: all group winners first, then all runners-up, etc. (avoids same-group clashes early)
  const seeded = [];
  for (let pos = 0; pos < qualifyPerGroup; pos++) {
    groupsWithStandings.forEach((g) => {
      const sorted = sortStandings(g.standings, { tiebreakerKey });
      if (sorted[pos]) seeded.push(sorted[pos].team);
    });
  }
  return generateKnockoutBracket(seeded);
}
