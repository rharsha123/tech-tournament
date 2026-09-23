import React, { useState } from "react";
import { generateRoundRobin } from "../../core/fixtures/roundRobin";
import { generateKnockoutBracket } from "../../core/fixtures/knockout";
import { generateGroupStage } from "../../core/fixtures/groupKnockout";

const FORMATS = [
  { id: "round_robin", label: "Round Robin", blurb: "Every team plays every team once (or twice)." },
  { id: "knockout", label: "Knockout", blurb: "Single elimination, seeded bracket, auto-byes." },
  { id: "group_knockout", label: "Group + Knockout", blurb: "Round-robin groups, top teams advance to a bracket." },
];

/**
 * @param {Array<{id,name}>} teams
 * @param {(fixtures: any) => void} onSave persist the generated fixtures (e.g. to Firestore)
 */
export default function FixturesTab({ teams = [], onSave }) {
  const [format, setFormat] = useState("round_robin");
  const [doubleRound, setDoubleRound] = useState(false);
  const [groupCount, setGroupCount] = useState(2);
  const [qualifyPerGroup, setQualifyPerGroup] = useState(2);
  const [preview, setPreview] = useState(null);

  const canGenerate = teams.length >= 2;

  function handleGenerate() {
    if (format === "round_robin") {
      setPreview({ type: "round_robin", fixtures: generateRoundRobin(teams, { doubleRound }) });
    } else if (format === "knockout") {
      setPreview({ type: "knockout", bracket: generateKnockoutBracket(teams) });
    } else if (format === "group_knockout") {
      setPreview({ type: "group_knockout", groups: generateGroupStage(teams, groupCount), qualifyPerGroup });
    }
  }

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div className="sb-panel" style={{ padding: "var(--space-4)" }}>
        <h3 className="sb-display" style={{ fontSize: 20, margin: "0 0 var(--space-3)" }}>Generate Fixtures</h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
          {FORMATS.map((f) => (
            <button
              key={f.id}
              onClick={() => { setFormat(f.id); setPreview(null); }}
              className="sb-panel"
              style={{
                padding: "var(--space-3)", textAlign: "left", cursor: "pointer",
                borderColor: format === f.id ? "var(--signal)" : "var(--turf-line)",
                background: format === f.id ? "var(--turf-raised)" : "var(--turf)",
              }}
            >
              <div style={{ fontWeight: 700, color: "var(--chalk)" }}>{f.label}</div>
              <div style={{ fontSize: 12, color: "var(--chalk-dim)", marginTop: 4 }}>{f.blurb}</div>
            </button>
          ))}
        </div>

        {format === "round_robin" && (
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--chalk-dim)" }}>
            <input type="checkbox" checked={doubleRound} onChange={(e) => setDoubleRound(e.target.checked)} />
            Double round (home & away)
          </label>
        )}

        {format === "group_knockout" && (
          <div style={{ display: "flex", gap: "var(--space-4)", fontSize: 14, color: "var(--chalk-dim)" }}>
            <label>Groups
              <input type="number" min={2} max={8} value={groupCount}
                onChange={(e) => setGroupCount(Number(e.target.value))}
                style={numInputStyle} />
            </label>
            <label>Qualify per group
              <input type="number" min={1} max={4} value={qualifyPerGroup}
                onChange={(e) => setQualifyPerGroup(Number(e.target.value))}
                style={numInputStyle} />
            </label>
          </div>
        )}

        <div style={{ marginTop: "var(--space-3)", display: "flex", gap: "var(--space-2)" }}>
          <button
            disabled={!canGenerate}
            onClick={handleGenerate}
            style={{
              background: canGenerate ? "var(--signal)" : "var(--turf-line)",
              color: canGenerate ? "var(--signal-ink)" : "var(--chalk-dim)",
              border: "none", borderRadius: "var(--radius-sm)", padding: "10px 20px",
              fontWeight: 700, cursor: canGenerate ? "pointer" : "not-allowed",
            }}
          >
            Generate
          </button>
          {preview && onSave && (
            <button
              onClick={() => onSave(preview)}
              style={{ background: "transparent", color: "var(--chalk)", border: "1px solid var(--turf-line)", borderRadius: "var(--radius-sm)", padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}
            >
              Save Fixtures
            </button>
          )}
        </div>
        {!canGenerate && <p style={{ fontSize: 12, color: "var(--chalk-dim)", marginTop: 8 }}>Add at least 2 teams first.</p>}
      </div>

      {preview && <FixturePreview preview={preview} />}
    </div>
  );
}

function FixturePreview({ preview }) {
  if (preview.type === "round_robin") {
    const byRound = groupBy(preview.fixtures, "round");
    return (
      <div className="sb-panel" style={{ padding: "var(--space-4)" }}>
        <h4 className="sb-display" style={{ fontSize: 16, margin: "0 0 var(--space-3)" }}>
          {Object.keys(byRound).length} Rounds · {preview.fixtures.length} Matches
        </h4>
        {Object.entries(byRound).map(([round, fixtures]) => (
          <div key={round} style={{ marginBottom: "var(--space-3)" }}>
            <div style={{ fontSize: 12, color: "var(--chalk-dim)", marginBottom: 4 }}>ROUND {round}</div>
            {fixtures.map((f, i) => <MatchupRow key={i} teamA={f.teamA.name} teamB={f.teamB.name} />)}
          </div>
        ))}
      </div>
    );
  }

  if (preview.type === "knockout") {
    return (
      <div className="sb-panel" style={{ padding: "var(--space-4)" }}>
        {preview.bracket.rounds.map((round) => (
          <div key={round.roundNumber} style={{ marginBottom: "var(--space-3)" }}>
            <div style={{ fontSize: 12, color: "var(--chalk-dim)", marginBottom: 4 }}>{round.roundName.toUpperCase()}</div>
            {round.matches.map((m) => (
              <MatchupRow key={m.matchId} teamA={m.teamA?.name || "TBD"} teamB={m.isBye ? "BYE" : (m.teamB?.name || "TBD")} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (preview.type === "group_knockout") {
    return (
      <div style={{ display: "grid", gap: "var(--space-3)" }}>
        {preview.groups.map((g) => (
          <div key={g.groupId} className="sb-panel" style={{ padding: "var(--space-4)" }}>
            <h4 className="sb-display" style={{ fontSize: 16, margin: "0 0 var(--space-2)" }}>{g.groupName}</h4>
            <div style={{ fontSize: 12, color: "var(--chalk-dim)", marginBottom: 8 }}>
              {g.teams.map((t) => t.name).join(" · ")}
            </div>
            {g.fixtures.map((f, i) => <MatchupRow key={i} teamA={f.teamA.name} teamB={f.teamB.name} />)}
          </div>
        ))}
        <p style={{ fontSize: 12, color: "var(--chalk-dim)" }}>
          Top {preview.qualifyPerGroup} from each group advance to the knockout stage once group results are in.
        </p>
      </div>
    );
  }

  return null;
}

function MatchupRow({ teamA, teamB }) {
  return (
    <div className="sb-hairline" style={{ display: "flex", justifyContent: "space-between", padding: "8px 4px", fontSize: 14 }}>
      <span>{teamA}</span>
      <span style={{ color: "var(--chalk-dim)" }}>vs</span>
      <span>{teamB}</span>
    </div>
  );
}

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    (acc[item[key]] = acc[item[key]] || []).push(item);
    return acc;
  }, {});
}

const numInputStyle = {
  marginLeft: 8, width: 50, background: "var(--turf)", border: "1px solid var(--turf-line)",
  color: "var(--chalk)", borderRadius: "var(--radius-sm)", padding: "4px 8px",
};
