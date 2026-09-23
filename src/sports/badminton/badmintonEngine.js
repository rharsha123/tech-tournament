// Pure, UI-agnostic badminton match engine. Standard BWF rules: best-of-3 games to 21,
// win by 2, cap at 30 (30-29 wins outright).

export function createBadmintonMatch({ sideA, sideB, gamesToWin = 2, pointsPerGame = 21, capAt = 30 }) {
  return {
    sideA, // { players: [id] } — 1 for singles, 2 for doubles
    sideB,
    gamesToWin,
    pointsPerGame,
    capAt,
    games: [{ scoreA: 0, scoreB: 0, isComplete: false }],
    gamesWonA: 0,
    gamesWonB: 0,
    isComplete: false,
    winner: null,
  };
}

function isGameComplete(scoreA, scoreB, pointsPerGame, capAt) {
  const leader = Math.max(scoreA, scoreB);
  const diff = Math.abs(scoreA - scoreB);
  if (leader >= capAt) return true; // hard cap, e.g. 30
  if (leader >= pointsPerGame && diff >= 2) return true; // normal win by 2
  return false;
}

export function recordPoint(match, side) {
  const state = structuredClone(match);
  const currentGame = state.games[state.games.length - 1];
  if (currentGame.isComplete || state.isComplete) return state;

  if (side === "A") currentGame.scoreA += 1;
  else currentGame.scoreB += 1;

  if (isGameComplete(currentGame.scoreA, currentGame.scoreB, state.pointsPerGame, state.capAt)) {
    currentGame.isComplete = true;
    if (currentGame.scoreA > currentGame.scoreB) state.gamesWonA += 1;
    else state.gamesWonB += 1;

    if (state.gamesWonA === state.gamesToWin || state.gamesWonB === state.gamesToWin) {
      state.isComplete = true;
      state.winner = state.gamesWonA > state.gamesWonB ? "A" : "B";
    } else {
      state.games.push({ scoreA: 0, scoreB: 0, isComplete: false });
    }
  }

  return state;
}

export function undoPoint(match) {
  const state = structuredClone(match);
  const currentGame = state.games[state.games.length - 1];
  if (currentGame.scoreA === 0 && currentGame.scoreB === 0 && state.games.length > 1) {
    // Reopen the previous game.
    state.games.pop();
    const prev = state.games[state.games.length - 1];
    prev.isComplete = false;
    if (prev.scoreA > prev.scoreB) state.gamesWonA -= 1; else state.gamesWonB -= 1;
    return state;
  }
  if (currentGame.scoreA > currentGame.scoreB) currentGame.scoreA -= 1;
  else if (currentGame.scoreB > 0) currentGame.scoreB -= 1;
  state.isComplete = false;
  state.winner = null;
  return state;
}

/** "Deuce" indicator for the UI: true once both players are within 1 point at 20-20+. */
export function isDeuce(game, pointsPerGame) {
  return game.scoreA >= pointsPerGame - 1 && game.scoreB >= pointsPerGame - 1 && Math.abs(game.scoreA - game.scoreB) < 2;
}
