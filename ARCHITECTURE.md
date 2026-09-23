# Multi-Sport Tournament Platform — Architecture & Roadmap

## What's built in this pass (Phase 1: foundation)

New modular structure, additive — nothing in your existing `src/pages/*` was deleted,
so the current app keeps working while we migrate screen by screen.

```
src/
  core/
    fixtures/roundRobin.js     Round-robin generator (circle method), grouping, standings sort
    fixtures/knockout.js       Seeded knockout bracket, handles non-power-of-2 team counts + byes
    fixtures/groupKnockout.js  Group stage -> auto-seeded knockout stage
    stats/awards.js            Sport-agnostic ranking + MVP/MOTM engine
  sports/
    cricket/cricketEngine.js   Ball-by-ball reducer: runs, extras, wickets, overs, run rate, undo
    cricket/cricketStats.js    Match data -> tournament batting/bowling leaderboards
    football/footballEngine.js Goals, cards, subs, extra time, penalty shootouts
    football/footballStats.js  Match data -> top scorer / assists / clean sheets
    badminton/badmintonEngine.js  Sets/points, deuce, win-by-2, cap-at-30
    badminton/badmintonStats.js   Match data -> wins / win% leaderboards
  design/
    tokens.css                 New visual direction (see below)
    components/SportTag.jsx
    components/LeaderboardPanel.jsx
  admin/tabs/StatsAwardsTab.jsx  Working example: engines + design system wired together
```

Every engine is a **pure function module** — no React, no Firebase inside them. You
give them plain data, they give back new plain data. That's what makes this modular:
you can unit-test `recordBall()` or `generateKnockoutBracket()` with zero UI involved,
and swap the backend later without touching sport logic.

## New UI direction: "Floodlit Scoreboard"

The old UI used generic SaaS-dashboard styling (rounded cards, default Tailwind grays).
The new direction is grounded in what a live sports scoreboard actually looks like:
a near-black turf-green base, chalk-white text, one amber "live" accent reserved for
active states, and a condensed display face (`Big Shoulders Display`) for scores —
so numbers read the way stadium signage reads. Each sport gets its own tag color
(cricket red / football green / badminton blue) used consistently everywhere a match
is listed. Tokens are in `src/design/tokens.css`, already wired into `index.css`.

## How this plugs into what you have today

`StatsAwardsTab.jsx` is a working demonstration — point it at real match documents
(`matches`, `playersById`) from Firestore and it renders live Orange Cap / Purple Cap /
Top Scorer / MVP boards using the new design system. That's the pattern for the rest
of the migration: each old tab in `AdminDashboard.jsx` gets replaced by a focused
component in `src/admin/tabs/`, pulling logic from `src/core` and `src/sports/*`
instead of having it inline.

## Phase 2 (built in this pass)

```
src/
  admin/tabs/
    FixturesTab.jsx          Generate Round Robin / Knockout / Group+Knockout, live preview
    MotmPicker.jsx            Auto-suggested MOTM (suggestMotm) with manual override
  sports/
    cricket/CricketScoringConsole.jsx    Rebuilt fully on cricketEngine.js (undo, RRR, overs)
    football/FootballScoringConsole.jsx  Goals/assists/cards/periods, on footballEngine.js
    badminton/BadmintonScoringConsole.jsx Point-by-point, deuce indicator, on badmintonEngine.js
  public/
    StandingsTable.jsx        Points table, pluggable tiebreaker (NRR / GD / game diff)
    BracketView.jsx           Renders the knockout.js `rounds` shape as a bracket
    LiveScoreboard.jsx        Sport-aware match card (cricket/football/badminton score lines)
```

Plus:
- **Capacitor wrap**: `capacitor.config.json` added, `package.json` has `@capacitor/core|ios|android|cli`
  and `cap:ios` / `cap:android` / `cap:sync` scripts. Run `npm install` then `npm run cap:android`
  (needs Android Studio / Xcode installed locally — that part can't be done in this sandbox).
- **PWA shell**: `public/manifest.json` + `public/sw.js` (network-first, offline app-shell fallback —
  deliberately does NOT cache live score data), wired into `index.html` and `main.jsx`.
- **Redesign pass**: `Navbar.jsx` and `TournamentCard.jsx` rebuilt in the Floodlit Scoreboard
  direction. `TournamentCard.jsx` was also silently broken in the original upload (missing
  function signature / unclosed JSX) — fixed as part of the rewrite. Old versions kept as
  `bkp_Navbar_v1.jsx` for reference.

## What's still open (Phase 3)

1. **Wire these into `AdminDashboard.jsx`/`PublicView.jsx`** — the new tabs and consoles are
   built as standalone components; swapping them into the existing tab-switch logic in
   `AdminDashboard.jsx` (replacing the old inline `LiveScoringConsole`) is the remaining
   integration step, plus connecting each to Firestore read/write.
2. **Per-match player-performance capture** — `MotmPicker` and the tournament MVP board
   need each match's per-player `impactScore` computed at save time (the formulas already
   exist in `cricketStats.js` / `footballStats.js` / `badmintonStats.js`, just need to run
   per-match instead of only tournament-wide).
2. **Auth/permissions** for multi-admin orgs, if more than one organizer will manage tournaments.
3. **Native install icons** — `public/icons.svg` should be exported to the PNG sizes iOS/Android
   require before running `cap:ios` / `cap:android` for real.
4. **Redesign remaining screens** — Login, the admin shell/tab bar, and Gallery still use the
   old styling; same token system, just needs the pass applied screen by screen.

Tell me which of these to do next, or if you'd rather I go ahead and wire everything
into `AdminDashboard.jsx`/`PublicView.jsx` directly so the app is fully switched over.
