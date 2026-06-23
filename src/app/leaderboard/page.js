"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Trophy, Info } from "lucide-react";
import { subscribeToData } from "@/lib/db";

export default function Leaderboard() {
  const [teams, setTeams] = useState({});

  useEffect(() => {
    const unsubTeams = subscribeToData("teams", setTeams);
    return unsubTeams;
  }, []);

  const teamList = Object.values(teams);

  // Sorting function: 
  // 1. Points (descending)
  // 2. Net game difference (gameWins - gameLosses) (descending)
  // 3. Game wins (descending)
  // 4. Name (alphabetical)
  const sortTeams = (a, b) => {
    const ptsDiff = (b.stats?.points || 0) - (a.stats?.points || 0);
    if (ptsDiff !== 0) return ptsDiff;

    const aDiff = (a.stats?.gameWins || 0) - (a.stats?.gameLosses || 0);
    const bDiff = (b.stats?.gameWins || 0) - (b.stats?.gameLosses || 0);
    const diffDiff = bDiff - aDiff;
    if (diffDiff !== 0) return diffDiff;

    const gwDiff = (b.stats?.gameWins || 0) - (a.stats?.gameWins || 0);
    if (gwDiff !== 0) return gwDiff;

    return a.name.localeCompare(b.name);
  };

  const groupATeams = teamList.filter((t) => t.group === "A").sort(sortTeams);
  const groupBTeams = teamList.filter((t) => t.group === "B").sort(sortTeams);

  // Overall standings (for the podium)
  const overallStandings = [...teamList].sort(sortTeams);
  const top1 = overallStandings[0];
  const top2 = overallStandings[1];
  const top3 = overallStandings[2];

  return (
    <div className="container">
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <span className="hero-badge">Tournament Standings</span>
        <h1 style={{ fontSize: "2.5rem", textTransform: "uppercase", marginBottom: "1rem" }}>Leaderboard & Rankings</h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto" }}>
          Real-time group stage results. Ranks are dynamically updated as match outcomes are registered by coordinators.
        </p>
      </div>

      {/* Top 3 Podium (Overall ranking show) */}
      {teamList.length >= 3 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "4rem" }}>
          <h2 style={{ textTransform: "uppercase", fontSize: "1.2rem", letterSpacing: "0.05em", color: "var(--primary-gold)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Trophy size={20} /> Summoner Ranks
          </h2>
          
          <div className="podium-container">
            {/* 2nd Place */}
            {top2 && (
              <div className="podium-column podium-2">
                <img src={top2.logo || "https://placehold.co/100x100"} alt={top2.name} className="podium-avatar" />
                <div style={{ textAlign: "center", marginBottom: "0.5rem", fontWeight: "700", width: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {top2.name.split(" (")[0]}
                </div>
                <div className="podium-step">
                  <div style={{ fontSize: "2rem", fontWeight: "900", color: "#C0C0C0" }}>2</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", marginTop: "0.25rem" }}>
                    {top2.stats?.points || 0} PTS
                  </div>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {top1 && (
              <div className="podium-column podium-1">
                <div style={{ position: "relative" }}>
                  <Trophy size={36} style={{ color: "var(--primary-gold)", position: "absolute", top: "-30px", left: "50%", transform: "translateX(-50%)" }} />
                  <img src={top1.logo || "https://placehold.co/100x100"} alt={top1.name} className="podium-avatar" />
                </div>
                <div style={{ textAlign: "center", marginBottom: "0.5rem", fontWeight: "700", width: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--primary-gold-bright)" }}>
                  {top1.name.split(" (")[0]}
                </div>
                <div className="podium-step">
                  <div style={{ fontSize: "2.5rem", fontWeight: "900", color: "var(--primary-gold)" }}>1</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--primary-gold-bright)", fontWeight: "600", textTransform: "uppercase", marginTop: "0.25rem" }}>
                    {top1.stats?.points || 0} PTS
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3 && (
              <div className="podium-column podium-3">
                <img src={top3.logo || "https://placehold.co/100x100"} alt={top3.name} className="podium-avatar" />
                <div style={{ textAlign: "center", marginBottom: "0.5rem", fontWeight: "700", width: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {top3.name.split(" (")[0]}
                </div>
                <div className="podium-step">
                  <div style={{ fontSize: "1.75rem", fontWeight: "900", color: "#CD7F32" }}>3</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", marginTop: "0.25rem" }}>
                    {top3.stats?.points || 0} PTS
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Group Tables */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", marginBottom: "4rem" }}>
        {/* Group A Standings */}
        <div className="card">
          <h2 style={{ fontSize: "1.3rem", textTransform: "uppercase", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Group A Standings</span>
            <span className="hero-badge" style={{ margin: 0, fontSize: "0.7rem", padding: "0.15rem 0.5rem" }}>Group Stage</span>
          </h2>
          
          <div className="table-responsive">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th style={{ width: "8%" }}>Rank</th>
                  <th>Team</th>
                  <th style={{ width: "10%", textAlign: "center" }}>P</th>
                  <th style={{ width: "10%", textAlign: "center" }}>W</th>
                  <th style={{ width: "10%", textAlign: "center" }}>L</th>
                  <th style={{ width: "15%", textAlign: "center" }}>Games</th>
                  <th style={{ width: "12%", textAlign: "center" }}>PTS</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {groupATeams.map((team, index) => (
                    <motion.tr
                      key={team.id}
                      layout
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className={`rank-${index + 1}`}
                    >
                      <td className="leaderboard-rank">#{index + 1}</td>
                      <td>
                        <div className="leaderboard-team-cell">
                          <img src={team.logo || "https://placehold.co/50x50"} alt={team.name} className="leaderboard-team-logo" />
                          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "160px" }}>{team.name}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: "center", fontWeight: "500" }}>{team.stats?.played || 0}</td>
                      <td style={{ textAlign: "center", color: "var(--color-success)", fontWeight: "600" }}>{team.stats?.wins || 0}</td>
                      <td style={{ textAlign: "center", color: "var(--color-danger)", fontWeight: "600" }}>{team.stats?.losses || 0}</td>
                      <td style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        {team.stats?.gameWins || 0}W - {team.stats?.gameLosses || 0}L
                      </td>
                      <td style={{ textAlign: "center", fontWeight: "800", color: index === 0 ? "var(--primary-gold-bright)" : "var(--text-primary)" }}>
                        {team.stats?.points || 0}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* Group B Standings */}
        <div className="card">
          <h2 style={{ fontSize: "1.3rem", textTransform: "uppercase", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Group B Standings</span>
            <span className="hero-badge" style={{ margin: 0, fontSize: "0.7rem", padding: "0.15rem 0.5rem" }}>Group Stage</span>
          </h2>
          
          <div className="table-responsive">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th style={{ width: "8%" }}>Rank</th>
                  <th>Team</th>
                  <th style={{ width: "10%", textAlign: "center" }}>P</th>
                  <th style={{ width: "10%", textAlign: "center" }}>W</th>
                  <th style={{ width: "10%", textAlign: "center" }}>L</th>
                  <th style={{ width: "15%", textAlign: "center" }}>Games</th>
                  <th style={{ width: "12%", textAlign: "center" }}>PTS</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {groupBTeams.map((team, index) => (
                    <motion.tr
                      key={team.id}
                      layout
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className={`rank-${index + 1}`}
                    >
                      <td className="leaderboard-rank">#{index + 1}</td>
                      <td>
                        <div className="leaderboard-team-cell">
                          <img src={team.logo || "https://placehold.co/50x50"} alt={team.name} className="leaderboard-team-logo" />
                          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "160px" }}>{team.name}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: "center", fontWeight: "500" }}>{team.stats?.played || 0}</td>
                      <td style={{ textAlign: "center", color: "var(--color-success)", fontWeight: "600" }}>{team.stats?.wins || 0}</td>
                      <td style={{ textAlign: "center", color: "var(--color-danger)", fontWeight: "600" }}>{team.stats?.losses || 0}</td>
                      <td style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        {team.stats?.gameWins || 0}W - {team.stats?.gameLosses || 0}L
                      </td>
                      <td style={{ textAlign: "center", fontWeight: "800", color: index === 0 ? "var(--primary-gold-bright)" : "var(--text-primary)" }}>
                        {team.stats?.points || 0}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Rules Notice */}
      <div className="card" style={{ display: "flex", gap: "1rem", alignItems: "flex-start", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-dark)", padding: "1.25rem 1.5rem", marginBottom: "4rem" }}>
        <Info size={20} style={{ color: "var(--primary-gold)", flexShrink: 0, marginTop: "0.15rem" }} />
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.5" }}>
          <strong>Tie-breaker Rule Details:</strong> Teams are ordered by points. In the case of equal points, ranking is determined by game wins-losses differential, followed by total individual game wins, and finally the alphabetical order of team names. In playoffs, top 2 teams of each group advance.
        </div>
      </div>
    </div>
  );
}
