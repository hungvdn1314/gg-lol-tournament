"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Info, Trophy, Swords, Clock, Zap, Shield, HelpCircle, CheckCircle2 } from "lucide-react";
import { subscribeToData, sortGroupTeams } from "@/lib/db";
import { teamLogoPlaceholder } from "@/lib/placeholders";

export default function Leaderboard() {
  const [teams, setTeams] = useState({});
  const [matches, setMatches] = useState({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubTeams = subscribeToData("teams", (data) => {
      setTeams(data || {});
    });
    const unsubMatches = subscribeToData("matches", (data) => {
      setMatches(data || {});
      setLoading(false);
    });
    return () => {
      unsubTeams();
      unsubMatches();
    };
  }, []);

  const teamList = Object.values(teams);

  const groupATeams = sortGroupTeams(teamList.filter((t) => t.group === "A"), matches);
  const groupBTeams = sortGroupTeams(teamList.filter((t) => t.group === "B"), matches);
  const groupCTeams = sortGroupTeams(teamList.filter((t) => t.group === "C"), matches);

  // Cross-group ranking for seed mapping
  const top1Teams = [];
  const top2Teams = [];

  [groupATeams, groupBTeams, groupCTeams].forEach((groupList) => {
    if (groupList[0]) top1Teams.push(groupList[0]);
    if (groupList[1]) top2Teams.push(groupList[1]);
  });

  const sortedTop1Teams = sortGroupTeams(top1Teams, matches);
  const sortedTop2Teams = sortGroupTeams(top2Teams, matches);

  const seedInfoMap = {};

  const top1RankLabels = ["Group Winner #1", "Group Winner #2", "Group Winner #3"];
  const top1BracketLabels = ["Upper Semis · Match 2", "Upper Semis · Match 1", "Upper Semis · Match 1"];

  sortedTop1Teams.forEach((team, idx) => {
    seedInfoMap[team.id] = {
      rankTitle: top1RankLabels[idx] || `Winner #${idx + 1}`,
      overallSeed: idx + 1,
      seedTag: `Seed #${idx + 1}`,
      bracketMatch: top1BracketLabels[idx] || "Upper Semis",
      type: "top1"
    };
  });

  const top2RankLabels = ["Runner-Up #1", "Runner-Up #2", "Runner-Up #3"];
  const top2BracketLabels = ["Upper Semis · Match 2", "Lower Quarters · Match 3", "Lower Quarters · Match 4"];

  sortedTop2Teams.forEach((team, idx) => {
    seedInfoMap[team.id] = {
      rankTitle: top2RankLabels[idx] || `Runner-Up #${idx + 1}`,
      overallSeed: idx + 4,
      seedTag: `Seed #${idx + 4}`,
      bracketMatch: top2BracketLabels[idx] || "Lower Bracket",
      type: "top2"
    };
  });

  const openTeamModal = (team) => {
    router.push(`/teams?teamId=${team.id}&backUrl=${encodeURIComponent("/leaderboard")}`);
  };

  const formatWinTime = (seconds) => {
    if (!seconds || seconds <= 0 || seconds === Infinity) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const renderTeamRow = (team, index) => {
    const seedInfo = seedInfoMap[team.id];
    const gameDiff = (team.stats?.gameWins || 0) - (team.stats?.gameLosses || 0);
    const killDiff = team.stats?.killDiff || 0;

    let rowStyle = { cursor: "pointer", transition: "all 0.15s ease" };
    if (index === 0) {
      rowStyle.backgroundColor = "rgba(245, 176, 65, 0.04)";
      rowStyle.borderLeft = "3px solid var(--primary-gold)";
    } else if (index === 1) {
      rowStyle.backgroundColor = "rgba(34, 211, 238, 0.03)";
      rowStyle.borderLeft = "3px solid #22d3ee";
    } else {
      rowStyle.opacity = 0.65;
      rowStyle.borderLeft = "3px solid transparent";
    }

    return (
      <motion.tr
        key={team.id}
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`rank-${index + 1}`}
        style={rowStyle}
        whileHover={{ scale: 1.002, backgroundColor: index === 0 ? "rgba(245, 176, 65, 0.08)" : index === 1 ? "rgba(34, 211, 238, 0.06)" : "rgba(255, 255, 255, 0.03)" }}
        onClick={() => openTeamModal(team)}
      >
        <td className="leaderboard-rank" style={{ textAlign: "center", width: "45px" }}>
          <span
            style={{
              fontWeight: "900",
              fontSize: "0.85rem",
              color: index === 0 ? "var(--primary-gold)" : index === 1 ? "#22d3ee" : "var(--text-muted)",
              display: "inline-block",
              width: "24px",
              height: "24px",
              lineHeight: "24px",
              textAlign: "center",
              borderRadius: "50%",
              backgroundColor: index === 0 ? "rgba(245, 176, 65, 0.12)" : index === 1 ? "rgba(34, 211, 238, 0.12)" : "transparent"
            }}
          >
            #{index + 1}
          </span>
        </td>
        <td>
          <div className="leaderboard-team-cell" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <img
              src={team.logo || teamLogoPlaceholder(team.name, 50)}
              alt={team.name}
              className="leaderboard-team-logo"
              style={{ width: "32px", height: "32px", borderRadius: "50%", border: index === 0 ? "1px solid var(--primary-gold)" : index === 1 ? "1px solid #22d3ee" : "1px solid var(--border-dark)", flexShrink: 0 }}
            />
            <span style={{ fontWeight: "700", color: index === 0 ? "var(--primary-gold-bright)" : "var(--text-primary)", fontSize: "0.95rem", whiteSpace: "nowrap" }}>
              {team.name}
            </span>
          </div>
        </td>
        <td style={{ textAlign: "center", width: "85px" }}>
          <span style={{ fontWeight: "800", fontSize: "0.9rem", color: "var(--text-primary)" }}>
            {team.stats?.wins || 0} - {team.stats?.losses || 0}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "0.3rem", fontWeight: "600" }}>
            ({team.stats?.gameWins || 0}-{team.stats?.gameLosses || 0})
          </span>
        </td>
        <td style={{ textAlign: "center", width: "50px", fontWeight: "700", color: gameDiff > 0 ? "var(--color-success)" : gameDiff < 0 ? "var(--color-danger)" : "var(--text-muted)" }}>
          {gameDiff > 0 ? `+${gameDiff}` : gameDiff}
        </td>
        <td style={{ textAlign: "center", width: "50px", fontWeight: "700", color: killDiff > 0 ? "var(--color-success)" : killDiff < 0 ? "var(--color-danger)" : "var(--text-muted)" }}>
          {killDiff > 0 ? `+${killDiff}` : killDiff}
        </td>
        <td style={{ textAlign: "center", width: "65px", fontSize: "0.85rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
          {formatWinTime(team.stats?.totalWinTime)}
        </td>
        <td style={{ textAlign: "center", width: "50px", fontWeight: "900", fontSize: "1.05rem", color: index === 0 ? "var(--primary-gold-bright)" : "var(--text-primary)" }}>
          {team.stats?.points || 0}
        </td>
        <td style={{ textAlign: "center", width: "145px" }}>
          {seedInfo ? (
            <span
              style={{
                backgroundColor: seedInfo.type === "top1" ? "rgba(245, 176, 65, 0.15)" : "rgba(34, 211, 238, 0.12)",
                border: seedInfo.type === "top1" ? "1px solid var(--primary-gold)" : "1px solid #22d3ee",
                color: seedInfo.type === "top1" ? "var(--primary-gold-bright)" : "#22d3ee",
                padding: "0.2rem 0.6rem",
                borderRadius: "20px",
                fontSize: "0.72rem",
                fontWeight: "800",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                whiteSpace: "nowrap"
              }}
              title={seedInfo.bracketMatch}
            >
              <span>{seedInfo.type === "top1" ? "★" : "◈"}</span>
              <span>{seedInfo.seedTag} · {seedInfo.rankTitle}</span>
            </span>
          ) : (
            <span
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px dashed var(--border-dark)",
                color: "var(--text-muted)",
                padding: "0.2rem 0.6rem",
                borderRadius: "12px",
                fontSize: "0.72rem",
                fontWeight: "600",
                whiteSpace: "nowrap"
              }}
            >
              Eliminated
            </span>
          )}
        </td>
      </motion.tr>
    );
  };

  const tableHeader = (
    <thead>
      <tr>
        <th style={{ width: "45px", textAlign: "center" }}>Rank</th>
        <th>Team</th>
        <th style={{ width: "85px", textAlign: "center" }} title="Series W-L (Game W-L)">Matches</th>
        <th style={{ width: "50px", textAlign: "center" }} title="Step 3: Game Differential (Wins - Losses)">GD</th>
        <th style={{ width: "50px", textAlign: "center" }} title="Step 4: Kill Differential (Kills - Deaths)">KD</th>
        <th style={{ width: "65px", textAlign: "center" }} title="Step 5: Total Win Duration">Time</th>
        <th style={{ width: "50px", textAlign: "center" }} title="Step 1: Points">PTS</th>
        <th style={{ width: "145px", textAlign: "center" }}>Playoff Seed</th>
      </tr>
    </thead>
  );

  const renderGroupCard = (label, groupTeams) => (
    <div className="card" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-dark)", overflow: "hidden" }}>
      <h2 style={{ fontSize: "1.25rem", textTransform: "uppercase", borderBottom: "1px solid var(--border-dark)", padding: "1.25rem 1.5rem", marginBottom: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: "800", letterSpacing: "0.05em", color: "var(--text-primary)" }}>{label} Standings</span>
        <span className="hero-badge" style={{ margin: 0, fontSize: "0.7rem", padding: "0.2rem 0.6rem", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid var(--border-dark)", color: "var(--text-muted)" }}>Single Round Robin</span>
      </h2>
      <div className="table-responsive">
        <table className="leaderboard-table" style={{ margin: 0 }}>
          {tableHeader}
          <tbody>
            <AnimatePresence>
              {groupTeams.map((team, index) => renderTeamRow(team, index))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1rem" }}>
      {/* Page Header */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem", position: "relative", paddingTop: "1.5rem" }}>
        <span className="hero-badge" style={{ backgroundColor: "rgba(245,176,65,0.08)", border: "1px solid var(--border-gold)", color: "var(--primary-gold)", textTransform: "uppercase", fontSize: "0.8rem", fontWeight: "700", padding: "0.3rem 1rem", borderRadius: "20px", display: "inline-block", marginBottom: "1rem" }}>Tournament Standings</span>
        <h1 style={{ fontSize: "2.8rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem", background: "linear-gradient(to bottom, #FFFFFF, var(--primary-gold-bright))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Group Stage Leaderboard</h1>
        <p style={{ color: "var(--text-muted)", maxWidth: "650px", margin: "0 auto", fontSize: "0.95rem", lineHeight: "1.6" }}>
          Real-time group standings evaluated with official 5-step tie-breaker rules. Top 2 teams from each group qualify for the 6-team Double Elimination Playoff Bracket.
        </p>
      </div>

      {/* Playoff Seeding Summary Hero Banner */}
      {!loading && (top1Teams.length > 0 || top2Teams.length > 0) && (
        <div 
          className="card" 
          style={{ 
            backgroundColor: "var(--bg-secondary)", 
            border: "1px solid var(--border-dark)", 
            marginBottom: "3rem", 
            padding: "1.75rem",
            borderRadius: "12px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <Trophy size={20} style={{ color: "var(--primary-gold)" }} />
              <h3 style={{ fontSize: "1.2rem", textTransform: "uppercase", fontWeight: "900", color: "var(--primary-gold-bright)", margin: 0, letterSpacing: "0.04em" }}>
                Playoff Qualification Summary
              </h3>
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", backgroundColor: "rgba(255,255,255,0.03)", padding: "0.3rem 0.8rem", borderRadius: "15px", border: "1px solid var(--border-dark)" }}>
              Top 6 Teams Advance to Knockouts
            </span>
          </div>

          {/* Two Pods Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
            
            {/* Pod 1: Group Winners Tier */}
            <div style={{ backgroundColor: "rgba(245, 176, 65, 0.03)", border: "1px solid var(--border-gold)", borderTop: "3px solid var(--primary-gold)", borderRadius: "10px", padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px dashed rgba(245,176,65,0.3)", paddingBottom: "0.6rem" }}>
                <div>
                  <h4 style={{ fontSize: "0.95rem", textTransform: "uppercase", fontWeight: "800", color: "var(--primary-gold-bright)", margin: 0 }}>
                    Group Winners Tier
                  </h4>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Ranked Group 1st Place Teams</span>
                </div>
                <span style={{ backgroundColor: "rgba(245, 176, 65, 0.15)", color: "var(--primary-gold-bright)", padding: "0.15rem 0.6rem", borderRadius: "12px", fontSize: "0.7rem", fontWeight: "800" }}>
                  Seeds #1 - #3
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {sortedTop1Teams.map((t, idx) => {
                  const info = seedInfoMap[t.id];
                  return (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "var(--bg-secondary)", border: "1px solid rgba(245,176,65,0.3)", borderRadius: "8px", padding: "0.6rem 0.9rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span style={{ fontWeight: "900", color: "var(--primary-gold)", fontSize: "0.85rem", width: "20px" }}>#{idx + 1}</span>
                        <img src={t.logo || teamLogoPlaceholder(t.name, 30)} alt={t.name} style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--primary-gold)" }} />
                        <div>
                          <div style={{ fontWeight: "800", fontSize: "0.9rem", color: "var(--text-primary)" }}>{t.name}</div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Group {t.group} Winner</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ backgroundColor: "rgba(245,176,65,0.15)", border: "1px solid var(--primary-gold)", color: "var(--primary-gold-bright)", padding: "0.15rem 0.6rem", borderRadius: "12px", fontSize: "0.72rem", fontWeight: "800", display: "inline-block" }}>
                          ★ Seed #{info?.overallSeed}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pod 2: Group Runners-Up Tier */}
            <div style={{ backgroundColor: "rgba(34, 211, 238, 0.03)", border: "1px solid #22d3ee", borderTop: "3px solid #22d3ee", borderRadius: "10px", padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px dashed rgba(34,211,238,0.3)", paddingBottom: "0.6rem" }}>
                <div>
                  <h4 style={{ fontSize: "0.95rem", textTransform: "uppercase", fontWeight: "800", color: "#22d3ee", margin: 0 }}>
                    Group Runners-Up Tier
                  </h4>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Ranked Group 2nd Place Teams</span>
                </div>
                <span style={{ backgroundColor: "rgba(34, 211, 238, 0.15)", color: "#22d3ee", padding: "0.15rem 0.6rem", borderRadius: "12px", fontSize: "0.7rem", fontWeight: "800" }}>
                  Seeds #4 - #6
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {sortedTop2Teams.map((t, idx) => {
                  const info = seedInfoMap[t.id];
                  return (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "var(--bg-secondary)", border: "1px solid rgba(34,211,238,0.3)", borderRadius: "8px", padding: "0.6rem 0.9rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span style={{ fontWeight: "900", color: "#22d3ee", fontSize: "0.85rem", width: "20px" }}>#{idx + 1}</span>
                        <img src={t.logo || teamLogoPlaceholder(t.name, 30)} alt={t.name} style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover", border: "1px solid #22d3ee" }} />
                        <div>
                          <div style={{ fontWeight: "800", fontSize: "0.9rem", color: "var(--text-primary)" }}>{t.name}</div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Group {t.group} Runner-Up</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ backgroundColor: "rgba(34,211,238,0.15)", border: "1px solid #22d3ee", color: "#22d3ee", padding: "0.15rem 0.6rem", borderRadius: "12px", fontSize: "0.72rem", fontWeight: "800", display: "inline-block" }}>
                          ◈ Seed #{info?.overallSeed}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Group Tables */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", marginBottom: "4rem" }}>
        {loading ? (
          <>
            <div className="skeleton" style={{ height: "280px" }}></div>
            <div className="skeleton" style={{ height: "280px" }}></div>
            <div className="skeleton" style={{ height: "280px" }}></div>
          </>
        ) : (
          <>
            {renderGroupCard("Group A", groupATeams)}
            {renderGroupCard("Group B", groupBTeams)}
            {renderGroupCard("Group C", groupCTeams)}
          </>
        )}
      </div>

      {/* Tie-Breaker Rule Explanation Card */}
      <div className="card" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-dark)", padding: "1.75rem", marginBottom: "4rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
          <Info size={20} style={{ color: "var(--primary-gold)" }} />
          <h3 style={{ fontSize: "1.1rem", textTransform: "uppercase", fontWeight: "800", color: "var(--primary-gold-bright)", margin: 0 }}>
            Official 5-Step Standings Tie-Breaker Rules
          </h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
          <div style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "0.8rem 1rem", borderRadius: "6px", border: "1px solid var(--border-dark)" }}>
            <span style={{ color: "var(--primary-gold)", fontWeight: "800", fontSize: "0.75rem", textTransform: "uppercase", display: "block", marginBottom: "0.2rem" }}>Step 1: Points (PTS)</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>3 points per Bo3 match win. 0 points per loss.</span>
          </div>
          <div style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "0.8rem 1rem", borderRadius: "6px", border: "1px solid var(--border-dark)" }}>
            <span style={{ color: "var(--primary-gold)", fontWeight: "800", fontSize: "0.75rem", textTransform: "uppercase", display: "block", marginBottom: "0.2rem" }}>Step 2: Head-to-Head (H2H)</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Direct match winner between tied teams in the group.</span>
          </div>
          <div style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "0.8rem 1rem", borderRadius: "6px", border: "1px solid var(--border-dark)" }}>
            <span style={{ color: "var(--primary-gold)", fontWeight: "800", fontSize: "0.75rem", textTransform: "uppercase", display: "block", marginBottom: "0.2rem" }}>Step 3: Game Diff (GD)</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Total Game Wins minus Game Losses (e.g. +3, -1).</span>
          </div>
          <div style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "0.8rem 1rem", borderRadius: "6px", border: "1px solid var(--border-dark)" }}>
            <span style={{ color: "var(--primary-gold)", fontWeight: "800", fontSize: "0.75rem", textTransform: "uppercase", display: "block", marginBottom: "0.2rem" }}>Step 4: Kill Diff (KD)</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Total Kills minus Total Deaths in all group matches.</span>
          </div>
          <div style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "0.8rem 1rem", borderRadius: "6px", border: "1px solid var(--border-dark)" }}>
            <span style={{ color: "var(--primary-gold)", fontWeight: "800", fontSize: "0.75rem", textTransform: "uppercase", display: "block", marginBottom: "0.2rem" }}>Step 5: Win Duration</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Total duration of winning games (faster wins favored).</span>
          </div>
        </div>
      </div>
    </div>
  );
}


