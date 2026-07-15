"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Info } from "lucide-react";
import { SummonersCup } from "@/components/Icons";
import { subscribeToData } from "@/lib/db";
import { teamLogoPlaceholder } from "@/lib/placeholders";

export default function Leaderboard() {
  const [teams, setTeams] = useState({});
  const [matches, setMatches] = useState({});
  const [loading, setLoading] = useState(true);

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

  // Helper to determine head-to-head winner between two teams
  const getHeadToHead = (teamAId, teamBId) => {
    const match = Object.values(matches).find(
      (m) =>
        m.status === "completed" &&
        ((m.teamAId === teamAId && m.teamBId === teamBId) ||
          (m.teamAId === teamBId && m.teamBId === teamAId))
    );
    if (!match) return 0;
    return match.winnerId === teamAId ? 1 : -1;
  };

  // Sorting function: 
  // 1. Points (descending)
  // 2. Head-to-Head winner
  // 3. Net game difference (gameWins - gameLosses) (descending)
  // 4. Game wins (descending)
  // 5. Name (alphabetical)
  const sortTeams = (a, b) => {
    const ptsDiff = (b.stats?.points || 0) - (a.stats?.points || 0);
    if (ptsDiff !== 0) return ptsDiff;

    const h2h = getHeadToHead(b.id, a.id);
    if (h2h !== 0) return h2h;

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
  const groupCTeams = teamList.filter((t) => t.group === "C").sort(sortTeams);

  // Overall standings (for the podium)
  const overallStandings = [...teamList].sort(sortTeams);
  const top1 = overallStandings[0];
  const top2 = overallStandings[1];
  const top3 = overallStandings[2];

  return (
    <div className="container">
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <span className="hero-badge">Tournament Standings</span>
        <h1 style={{ fontSize: "2.5rem", textTransform: "uppercase", marginBottom: "1rem" }}>Leaderboard Standings</h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto" }}>
          Real-time group stage results. Ranks are dynamically updated as match outcomes are registered by coordinators.
        </p>
      </div>



      {/* Group Tables */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", marginBottom: "4rem" }}>
        {loading ? (
          <>
            <div className="skeleton" style={{ height: "300px" }}></div>
            <div className="skeleton" style={{ height: "300px" }}></div>
            <div className="skeleton" style={{ height: "300px" }}></div>
          </>
        ) : (
          <>
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
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={`rank-${index + 1}`}
                    >
                      <td className="leaderboard-rank">#{index + 1}</td>
                      <td>
                        <div className="leaderboard-team-cell">
                          <img src={team.logo || teamLogoPlaceholder(team.name, 50)} alt={team.name} className="leaderboard-team-logo" />
                          <span style={{ fontWeight: "600" }}>{team.name}</span>
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
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={`rank-${index + 1}`}
                    >
                      <td className="leaderboard-rank">#{index + 1}</td>
                      <td>
                        <div className="leaderboard-team-cell">
                          <img src={team.logo || teamLogoPlaceholder(team.name, 50)} alt={team.name} className="leaderboard-team-logo" />
                          <span style={{ fontWeight: "600" }}>{team.name}</span>
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

        {/* Group C Standings */}
        <div className="card">
          <h2 style={{ fontSize: "1.3rem", textTransform: "uppercase", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Group C Standings</span>
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
                  {groupCTeams.map((team, index) => (
                    <motion.tr
                      key={team.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={`rank-${index + 1}`}
                    >
                      <td className="leaderboard-rank">#{index + 1}</td>
                      <td>
                        <div className="leaderboard-team-cell">
                          <img src={team.logo || teamLogoPlaceholder(team.name, 50)} alt={team.name} className="leaderboard-team-logo" />
                          <span style={{ fontWeight: "600" }}>{team.name}</span>
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
        </>
        )}
      </div>

      {/* Rules Notice */}
      <div className="card" style={{ display: "flex", gap: "1rem", alignItems: "flex-start", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-dark)", padding: "1.25rem 1.5rem", marginBottom: "4rem" }}>
        <Info size={20} style={{ color: "var(--primary-gold)", flexShrink: 0, marginTop: "0.15rem" }} />
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.5" }}>
          <strong>Tie-breaker Rule Details:</strong> Standing order is determined by: 1. Higher points; 2. Head-to-head result; 3. Game difference (wins - losses); 4. Kill differential (kills - deaths); 5. Total game completion time. If a tie still persists, a random draw is conducted. In playoffs, the top 2 teams of each group advance.
        </div>
      </div>
    </div>
  );
}
