// Pure, UI-agnostic ball-by-ball cricket scoring engine.
// Every action returns a NEW innings state (immutable), so the UI layer / Firestore
// sync just has to persist `state` after each call. Full ball history is kept for
// undo, commentary, and partnership/run-rate calculations.

export const DISMISSAL_TYPES = [
  "Bowled", "Caught", "LBW", "Run Out", "Stumped", "Hit Wicket", "Retired Hurt",
];

export function createInnings({ battingTeam, bowlingTeam, oversLimit, target = null }) {
  return {
    battingTeam,
    bowlingTeam,
    oversLimit,
    target, // set when this is the 2nd innings (used to compute required run rate)
    runs: 0,
    wickets: 0,
    balls: 0, // legal balls only
    extras: { wide: 0, noBall: 0, bye: 0, legBye: 0 },
    striker: null,
    nonStriker: null,
    bowler: null,
    currentOverBalls: [], // resets each over, for the "this over" display
    partnership: { runs: 0, balls: 0 },
    batsmen: {}, // playerId -> { runs, ballsFaced, fours, sixes, out, dismissal }
    bowlers: {}, // playerId -> { ballsBowled, runsConceded, wickets, maidens }
    ballHistory: [], // full log, each entry undoable
    isComplete: false,
  };
}

function legalBall(entry) {
  return entry.extraType !== "wide" && entry.extraType !== "noBall";
}

function ensureBatsman(state, playerId) {
  if (!state.batsmen[playerId]) {
    state.batsmen[playerId] = { runs: 0, ballsFaced: 0, fours: 0, sixes: 0, out: false, dismissal: null };
  }
}
function ensureBowler(state, playerId) {
  if (!state.bowlers[playerId]) {
    state.bowlers[playerId] = { ballsBowled: 0, runsConceded: 0, wickets: 0, maidens: 0 };
  }
}

/**
 * Records one ball.
 * @param {object} innings current innings state
 * @param {object} ball { runs, extraType: null|'wide'|'noBall'|'bye'|'legBye', isWicket, dismissal }
 */
export function recordBall(innings, ball) {
  const state = structuredClone(innings);
  const { runs = 0, extraType = null, isWicket = false, dismissal = null } = ball;

  ensureBatsman(state, state.striker);
  ensureBowler(state, state.bowler);

  const isLegal = extraType !== "wide" && extraType !== "noBall";
  const battingCredited = extraType === "bye" || extraType === "legBye" ? 0 : runs; // byes/leg-byes don't count to batsman
  const totalRunsThisBall =
    runs + (extraType === "wide" || extraType === "noBall" ? 1 : 0);

  // Team totals
  state.runs += totalRunsThisBall;
  if (extraType) state.extras[extraType] += extraType === "wide" || extraType === "noBall" ? runs + 1 : runs;

  // Batsman stats (extras from byes/legbyes/wides don't count as batsman runs; no-ball runs off bat do)
  if (extraType !== "bye" && extraType !== "legBye" && extraType !== "wide") {
    state.batsmen[state.striker].runs += runs;
    if (runs === 4) state.batsmen[state.striker].fours += 1;
    if (runs === 6) state.batsmen[state.striker].sixes += 1;
  }
  if (isLegal) state.batsmen[state.striker].ballsFaced += 1;

  // Bowler stats (wides/no-balls count against bowler's runs conceded; byes/leg-byes don't)
  state.bowlers[state.bowler].runsConceded += totalRunsThisBall - (extraType === "bye" || extraType === "legBye" ? runs : 0);
  if (isLegal) state.bowlers[state.bowler].ballsBowled += 1;

  // Partnership
  state.partnership.runs += battingCredited + (extraType === "bye" || extraType === "legBye" ? runs : 0);
  if (isLegal) state.partnership.balls += 1;

  // Wicket
  if (isWicket) {
    state.wickets += 1;
    state.batsmen[state.striker].out = true;
    state.batsmen[state.striker].dismissal = dismissal; // { type, bowler, fielder }
    if (dismissal?.type && dismissal.type !== "Run Out") state.bowlers[state.bowler].wickets += 1;
    state.partnership = { runs: 0, balls: 0 }; // resets for the new batsman
  }

  if (isLegal) state.balls += 1;
  state.currentOverBalls.push({ runs, extraType, isWicket, dismissal });

  // Strike rotation on odd runs off the bat
  if (!extraType && runs % 2 === 1) swapStrike(state);

  // End of over: swap strike, reset current-over display, bowler must change
  if (isLegal && state.balls % 6 === 0 && state.balls > 0) {
    swapStrike(state);
    if (state.currentOverBalls.filter((b) => legalBall(b)).length === 0) {
      // no legal balls somehow, skip maiden calc guard
    } else {
      const runsThisOver = state.currentOverBalls.reduce((sum, b) => sum + b.runs + (b.extraType === "wide" || b.extraType === "noBall" ? 1 : 0), 0);
      if (runsThisOver === 0) state.bowlers[state.bowler].maidens += 1;
    }
    state.currentOverBalls = [];
  }

  state.ballHistory.push({ ...ball, strikerAtTime: innings.striker, bowlerAtTime: innings.bowler });

  // Auto-complete innings when overs run out or all-out (assumes 11-player squads -> 10 wickets)
  const oversUsed = state.balls / 6;
  if (oversUsed >= state.oversLimit || state.wickets >= 10) {
    state.isComplete = true;
  }
  if (state.target !== null && state.runs >= state.target) {
    state.isComplete = true;
  }

  return state;
}

function swapStrike(state) {
  const tmp = state.striker;
  state.striker = state.nonStriker;
  state.nonStriker = tmp;
}

export function undoLastBall(innings) {
  if (innings.ballHistory.length === 0) return innings;
  const history = innings.ballHistory.slice(0, -1);
  // Simplest correct approach: replay history from scratch onto a fresh innings shell.
  const shell = createInnings({
    battingTeam: innings.battingTeam,
    bowlingTeam: innings.bowlingTeam,
    oversLimit: innings.oversLimit,
    target: innings.target,
  });
  shell.striker = innings.ballHistory[0]?.strikerAtTime ?? innings.striker;
  shell.nonStriker = innings.ballHistory[0]?.nonStrikerAtTime ?? innings.nonStriker;
  shell.bowler = innings.ballHistory[0]?.bowlerAtTime ?? innings.bowler;
  let state = shell;
  history.forEach((entry) => {
    state.striker = entry.strikerAtTime;
    state.bowler = entry.bowlerAtTime;
    state = recordBall(state, entry);
  });
  return state;
}

/** Current run rate (runs per over) at any point in the innings. */
export function currentRunRate(innings) {
  if (innings.balls === 0) return 0;
  return +(innings.runs / (innings.balls / 6)).toFixed(2);
}

/** Required run rate for the chasing team. */
export function requiredRunRate(innings) {
  if (!innings.target || innings.isComplete) return null;
  const ballsLeft = innings.oversLimit * 6 - innings.balls;
  if (ballsLeft <= 0) return null;
  const runsNeeded = innings.target - innings.runs;
  return +((runsNeeded / ballsLeft) * 6).toFixed(2);
}

/** Net run rate contribution of one team from a completed match, for points-table tiebreaks. */
export function matchNetRunRateDelta(teamInnings, oppositionInnings) {
  const teamRR = teamInnings.balls > 0 ? teamInnings.runs / (teamInnings.balls / 6) : 0;
  const oppRR = oppositionInnings.balls > 0 ? oppositionInnings.runs / (oppositionInnings.balls / 6) : 0;
  return +(teamRR - oppRR).toFixed(3);
}
