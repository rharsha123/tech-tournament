// Pure, UI-agnostic football match-state engine. Mirrors cricketEngine.js's shape:
// every action returns a new immutable state; full event log kept for undo & commentary.

export function createFootballMatch({ homeTeam, awayTeam, halfLengthMinutes = 45, extraTimeEnabled = false }) {
  return {
    homeTeam,
    awayTeam,
    halfLengthMinutes,
    extraTimeEnabled,
    period: "First Half", // First Half | Half Time | Second Half | Extra Time 1 | Extra Time 2 | Penalties | Full Time
    homeScore: 0,
    awayScore: 0,
    events: [], // { type, minute, team, playerId, meta }
    cards: { home: { yellow: [], red: [] }, away: { yellow: [], red: [] } },
    substitutions: { home: [], away: [] },
    penaltyShootout: null, // { home: [made], away: [made] } when it goes to penalties
    isComplete: false,
  };
}

const SIDES = ["home", "away"];

function oppositeSide(side) {
  return side === "home" ? "away" : "home";
}

export function recordGoal(match, { side, minute, playerId, assistPlayerId = null, isOwnGoal = false, isPenalty = false }) {
  const state = structuredClone(match);
  const scoringSide = isOwnGoal ? oppositeSide(side) : side;
  state[`${scoringSide}Score`] += 1;
  state.events.push({ type: "goal", minute, team: side, playerId, assistPlayerId, isOwnGoal, isPenalty });
  return state;
}

export function recordCard(match, { side, minute, playerId, cardType }) {
  const state = structuredClone(match);
  state.cards[side][cardType].push({ playerId, minute });
  state.events.push({ type: "card", cardType, minute, team: side, playerId });
  return state;
}

export function recordSubstitution(match, { side, minute, playerOutId, playerInId }) {
  const state = structuredClone(match);
  state.substitutions[side].push({ minute, playerOutId, playerInId });
  state.events.push({ type: "substitution", minute, team: side, playerOutId, playerInId });
  return state;
}

export function advancePeriod(match) {
  const order = ["First Half", "Half Time", "Second Half", "Extra Time 1", "Extra Time 2", "Penalties", "Full Time"];
  const state = structuredClone(match);
  const idx = order.indexOf(state.period);
  let nextIdx = idx + 1;
  // Skip extra time / penalties unless the match is drawn and extra time is enabled / needed.
  if (order[nextIdx] === "Extra Time 1" && (state.homeScore !== state.awayScore || !state.extraTimeEnabled)) {
    nextIdx = order.indexOf("Full Time");
  }
  state.period = order[nextIdx] || "Full Time";
  if (state.period === "Full Time") state.isComplete = true;
  if (state.period === "Penalties") state.penaltyShootout = { home: [], away: [] };
  return state;
}

export function recordPenaltyKick(match, { side, scored }) {
  const state = structuredClone(match);
  state.penaltyShootout[side].push(scored);
  const homeMade = state.penaltyShootout.home.filter(Boolean).length;
  const awayMade = state.penaltyShootout.away.filter(Boolean).length;
  const homeLeft = 5 - state.penaltyShootout.home.length;
  const awayLeft = 5 - state.penaltyShootout.away.length;
  // Decide winner once one side can no longer catch up (standard shootout logic, best-of-5 then sudden death).
  if (state.penaltyShootout.home.length >= 5 && state.penaltyShootout.away.length >= 5 && homeMade !== awayMade) {
    state.isComplete = true;
  } else if (homeMade > awayMade + awayLeft || awayMade > homeMade + homeLeft) {
    state.isComplete = true;
  }
  return state;
}
