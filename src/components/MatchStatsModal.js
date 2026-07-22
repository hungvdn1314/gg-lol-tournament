"use client";

import { useState, useEffect } from "react";
import { X, Award, Eye, BarChart2, Check, Copy, Activity, Info } from "lucide-react";
import { HextechCrest, CrossedSwords } from "@/components/Icons";
import { subscribeToMatchDetails, resolveGameTeamSides } from "@/lib/db";
import { useDDragon } from "@/lib/riot";

export default function MatchStatsModal({ match, teams, onClose }) {
  const {
    version,
    getChampionIcon,
    getChampionIconById,
    getItemIcon,
    getSummonerSpellIcon,
    getRuneIcon,
    loading: ddragonLoading
  } = useDDragon();

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("scoreboard"); // scoreboard, charts, team, mvp
  const [chartMetric, setChartMetric] = useState("damageDealt"); // damageDealt, damageTaken, healing
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);
  const [mvpViewMode, setMvpViewMode] = useState("game"); // game, series

  useEffect(() => {
    if (!match?.id) return;
    setLoading(true);
    const unsub = subscribeToMatchDetails(match.id, (data) => {
      setDetails(data);
      setLoading(false);
    });

    return unsub;
  }, [match]);

  if (!match) return null;

  const teamA = teams[match.teamAId];
  const teamB = teams[match.teamBId];

  // Helper to format match duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Helpers resolved dynamically from useDDragon hook

  const getKdaRatio = (k, d, a) => {
    if (d === 0) return `${(k + a).toFixed(1)} Perfect`;
    return `${((k + a) / d).toFixed(1)} KDA`;
  };

  const games = details ? (Array.isArray(details) ? details : [details]) : [];
  const currentGameDetails = games[selectedGameIndex] || null;

  // Ensure activeTab is valid for this game
  useEffect(() => {
    if (currentGameDetails) {
      const hasParticipants = currentGameDetails.participants && currentGameDetails.participants.length > 0;
      const hasScreenshot = !!currentGameDetails.screenshot;
      
      if (!hasParticipants && hasScreenshot) {
        setActiveTab("screenshot");
      } else if (hasParticipants && activeTab === "screenshot" && !hasScreenshot) {
        setActiveTab("scoreboard");
      }
    }
  }, [currentGameDetails]);

  // Sort participants by team
  const blueParticipants = currentGameDetails?.participants?.filter(p => p.teamId === 100) || [];
  const redParticipants = currentGameDetails?.participants?.filter(p => p.teamId === 200) || [];

  // Team side resolution
  const { blueTeamId, redTeamId } = resolveGameTeamSides(currentGameDetails, match, teams);
  const blueTeam = teams?.[blueTeamId] || teamA;
  const redTeam = teams?.[redTeamId] || teamB;

  // Team totals
  const blueTotalGold = blueParticipants.reduce((sum, p) => sum + (p.gold || 0), 0);
  const redTotalGold = redParticipants.reduce((sum, p) => sum + (p.gold || 0), 0);
  const blueTotalKills = blueParticipants.reduce((sum, p) => sum + (p.kills || 0), 0);
  const redTotalKills = redParticipants.reduce((sum, p) => sum + (p.kills || 0), 0);
  const blueTotalDmg = blueParticipants.reduce((sum, p) => sum + (p.damageDealt || 0), 0);
  const redTotalDmg = redParticipants.reduce((sum, p) => sum + (p.damageDealt || 0), 0);

  const calculateMVP = (participants, gameDuration) => {
    if (!participants || participants.length === 0) return [];

    // Identify the winning team side
    const winningParticipant = participants.find(p => p.win);
    const winningTeamId = winningParticipant ? winningParticipant.teamId : null;

    if (winningTeamId === null) return [];

    // Calculate team-level statistics for the winning team
    const teamTotals = {
      kills: 0,
      dmgDealt: 0,
      dmgTaken: 0,
      healing: 0,
      kdaSum: 0
    };

    const participantsWithKda = participants.map(p => {
      const kda = (p.kills + (p.assists || 0)) / Math.max(p.deaths || 0, 1);
      return { ...p, kda };
    });

    participantsWithKda.forEach(p => {
      if (p.teamId === winningTeamId) {
        teamTotals.kills += (p.kills || 0);
        teamTotals.dmgDealt += (p.damageDealt || 0);
        teamTotals.dmgTaken += (p.damageTaken || 0);
        teamTotals.healing += (p.healing || 0);
        teamTotals.kdaSum += p.kda;
      }
    });

    const scored = participantsWithKda.map(p => {
      if (p.teamId !== winningTeamId) {
        return {
          ...p,
          mvpBreakdown: { kdaScore: 0, kpScore: 0, dmgScore: 0, defUtilScore: 0, hypeScore: 0, winBonus: 0, totalScore: 0 }
        };
      }

      // 1. Kill Participation (45% -> max 450)
      const kp = teamTotals.kills > 0 ? (p.kills + (p.assists || 0)) / teamTotals.kills : 0;
      const kpScore = kp * 450;

      // 2. Damage Share (20% -> max 200)
      const damageShare = teamTotals.dmgDealt > 0 ? (p.damageDealt || 0) / teamTotals.dmgDealt : 0;
      const dmgScore = damageShare * 200;

      // 3. Damage Taken Share (15% -> max 150)
      const dmgTakenShare = teamTotals.dmgTaken > 0 ? (p.damageTaken || 0) / teamTotals.dmgTaken : 0;
      const defUtilScore = dmgTakenShare * 150;

      // 4. Healing Share (10% -> max 100)
      const healingShare = teamTotals.healing > 0 ? (p.healing || 0) / teamTotals.healing : 0;
      const hypeScore = healingShare * 100;

      // 5. KDA Share (10% -> max 100)
      const kdaShare = teamTotals.kdaSum > 0 ? p.kda / teamTotals.kdaSum : 0;
      const winBonus = kdaShare * 100;

      const totalScore = kpScore + dmgScore + defUtilScore + hypeScore + winBonus;

      return {
        ...p,
        mvpBreakdown: { kdaScore: winBonus, kpScore, dmgScore, defUtilScore, hypeScore, winBonus: 0, totalScore }
      };
    });
    
    return scored.sort((a, b) => b.mvpBreakdown.totalScore - a.mvpBreakdown.totalScore);
  };

  const scoredParticipants = currentGameDetails ? calculateMVP(currentGameDetails.participants, currentGameDetails.gameDuration) : [];
  const mvpPlayerName = scoredParticipants.length > 0 ? scoredParticipants[0].playerName : null;

  const validGames = games.filter(g => g !== null && g !== undefined);
  const getSeriesMVPData = () => {
    const aggregates = {};
    validGames.forEach(g => {
      const scored = calculateMVP(g.participants, g.gameDuration);
      scored.forEach(p => {
        if (!aggregates[p.playerName]) {
          aggregates[p.playerName] = {
            ...p,
            gamesPlayed: 0,
            mvpBreakdown: { kdaScore: 0, kpScore: 0, dmgScore: 0, defUtilScore: 0, hypeScore: 0, winBonus: 0, totalScore: 0 }
          };
        }
        aggregates[p.playerName].gamesPlayed += 1;
        aggregates[p.playerName].champion = p.champion; // keep the latest champion
        const b = aggregates[p.playerName].mvpBreakdown;
        const s = p.mvpBreakdown;
        b.kdaScore += s.kdaScore;
        b.kpScore += s.kpScore;
        b.dmgScore += s.dmgScore;
        b.defUtilScore += s.defUtilScore;
        b.hypeScore += s.hypeScore;
        b.winBonus += s.winBonus;
        b.totalScore += s.totalScore;
      });
    });
    return Object.values(aggregates).sort((a, b) => b.mvpBreakdown.totalScore - a.mvpBreakdown.totalScore);
  };
  const seriesScoredParticipants = getSeriesMVPData();

  const goldDiff = Math.abs(blueTotalGold - redTotalGold);
  const goldLeadTeam = blueTotalGold > redTotalGold ? blueTeam?.name?.split(" (")[0] : redTeam?.name?.split(" (")[0];

  // Calculate highest metric value in the game for charts
  const maxMetricVal = currentGameDetails?.participants 
    ? Math.max(...currentGameDetails.participants.map(p => p[chartMetric] || 0)) 
    : 1;

  return (
    <div className="modal-overlay">
      <div className="card card-gold modal-content">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="btn btn-outline" 
          style={{ position: "absolute", top: "1.5rem", right: "1.5rem", padding: "0.5rem", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px" }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ borderBottom: "1px solid var(--border-dark)", paddingBottom: "1rem", marginBottom: "1.5rem", textTransform: "uppercase" }}>
          <span className="hero-badge" style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", marginBottom: "0.5rem" }}>
            Post-Game Stats
          </span>
          <h2 style={{ fontSize: "1.5rem" }}>
            {teamA?.name} vs {teamB?.name}
          </h2>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem", display: "block" }}>
            {match.stage} &bull; Series Score: {match.scoreA} : {match.scoreB}
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>
            Loading game telemetry...
          </div>
        ) : games.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
              Detailed statistics are not available for this match yet.
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
              Stats are automatically populated once the coordinator triggers match completion.
            </p>
          </div>
        ) : (
          <div>
            {/* Game Selector Tabs */}
            {games.length > 1 && (
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                {games.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedGameIndex(idx)}
                    className="btn btn-outline"
                    style={{
                      padding: "0.4rem 1rem",
                      backgroundColor: selectedGameIndex === idx ? "var(--primary-gold)" : "transparent",
                      color: selectedGameIndex === idx ? "#000" : "var(--primary-gold)",
                      borderColor: "var(--primary-gold)",
                      borderRadius: "4px"
                    }}
                  >
                    Game {idx + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Quick Game Summary Strip */}
            {!currentGameDetails ? (
              <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)", fontStyle: "italic" }}>
                Detailed statistics for Game {selectedGameIndex + 1} have not been synced yet.
              </div>
            ) : (
              <>
                <div className="card" style={{ backgroundColor: "var(--bg-tertiary)", padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem", marginBottom: "1.5rem", border: "1px solid var(--border-dark)" }}>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase" }}>Winner</span>
                <div style={{ color: "var(--primary-gold-bright)", fontWeight: "bold", fontSize: "1.1rem", textTransform: "uppercase", marginTop: "0.25rem" }}>
                  {currentGameDetails.teams[100]?.winner ? blueTeam?.name.split(" (")[0] : redTeam?.name.split(" (")[0]}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase" }}>Game Duration</span>
                <div style={{ color: "var(--text-primary)", fontWeight: "bold", fontSize: "1.1rem", marginTop: "0.25rem" }}>
                  {formatDuration(currentGameDetails.gameDuration)}
                </div>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase" }}>Gold Lead</span>
                <div style={{ color: "var(--primary-gold)", fontWeight: "bold", fontSize: "1.1rem", marginTop: "0.25rem" }}>
                  {goldLeadTeam} (+{(goldDiff / 1000).toFixed(1)}k)
                </div>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase" }}>Total Kills</span>
                <div style={{ color: "var(--text-primary)", fontWeight: "bold", fontSize: "1.1rem", marginTop: "0.25rem" }}>
                  {blueTotalKills} - {redTotalKills}
                </div>
              </div>
            </div>

             {/* Modal Navigation Tabs */}
            {(() => {
              const tabList = [];
              if (currentGameDetails?.screenshot) {
                tabList.push({ id: "screenshot", label: "Screenshot", icon: <Eye size={14} /> });
              }
              if (currentGameDetails?.participants && currentGameDetails.participants.length > 0) {
                tabList.push({ id: "scoreboard", label: "Scoreboard", icon: <CrossedSwords size={14} /> });
                tabList.push({ id: "charts", label: "Combat Charts", icon: <BarChart2 size={14} /> });
                tabList.push({ id: "team", label: "Match Objectives", icon: <HextechCrest size={14} /> });
                tabList.push({ id: "mvp", label: "MVP Calculation", icon: <Activity size={14} /> });
              }
              return (
                <div className="scrollable-tabs" style={{ borderBottom: "1px solid var(--border-dark)", marginBottom: "1.5rem", paddingBottom: "0.5rem" }}>
                  {tabList.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.4rem 0.8rem",
                        backgroundColor: activeTab === tab.id ? "rgba(var(--primary-red-rgb), 0.08)" : "transparent",
                        border: "1px solid",
                        borderColor: activeTab === tab.id ? "var(--border-red)" : "transparent",
                        color: activeTab === tab.id ? "var(--primary-red)" : "var(--text-secondary)",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              );
            })()}

            {/* TAB CONTENTS */}

            {/* TAB 0: SCREENSHOT */}
            {activeTab === "screenshot" && currentGameDetails?.screenshot && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center" }}>
                  Official post-game score screen capture submitted by the match captain.
                </p>
                <div style={{ position: "relative", width: "100%", overflow: "hidden", border: "1px solid var(--border-gold)", borderRadius: "8px", backgroundColor: "#000" }}>
                  <img 
                    src={currentGameDetails.screenshot} 
                    alt="End Game Screenshot" 
                    style={{ width: "100%", height: "auto", display: "block", maxHeight: "60vh", objectFit: "contain" }} 
                  />
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Click image to zoom.
                </span>
              </div>
            )}
            
            {/* TAB 1: SCOREBOARD */}
            {activeTab === "scoreboard" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                {/* Blue Team */}
                <div>
                  <h3 style={{ fontSize: "0.9rem", color: "var(--text-primary)", textTransform: "uppercase", marginBottom: "0.5rem", borderBottom: "2px solid #005A82", paddingBottom: "0.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span>{blueTeam?.name} (Blue Side)</span>
                      {currentGameDetails?.teams?.[100]?.bans && currentGameDetails.teams[100].bans.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginRight: "0.2rem" }}>BANS:</span>
                          {currentGameDetails.teams[100].bans.map((banId, idx) => (
                            banId > 0 && (
                              <div key={idx} style={{ position: "relative" }}>
                                <img src={getChampionIconById(banId)} alt={`Ban ${banId}`} style={{ width: "20px", height: "20px", borderRadius: "50%", filter: "grayscale(100%)", border: "1px solid var(--color-danger)" }} />
                                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "100%", height: "1px", backgroundColor: "var(--color-danger)" }}></div>
                              </div>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                    {currentGameDetails.teams[100]?.winner && <span style={{ color: "var(--primary-gold-bright)", fontSize: "0.75rem" }}>🏆 VICTORY</span>}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {blueParticipants.map((p, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-dark)", borderRadius: "4px", padding: "0.6rem 0.8rem", flexWrap: "wrap", gap: "1rem" }}>
                        <div className="sb-col-player" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <img src={getChampionIcon(p.champion)} alt={p.champion} style={{ width: "36px", height: "36px", borderRadius: "4px", border: "1px solid var(--border-dark)" }} />
                          {p.summonerSpells && p.runes && (
                            <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                <img 
                                  src={getSummonerSpellIcon(p.summonerSpells[0])} 
                                  alt="spell1" 
                                  style={{ width: "16px", height: "16px", borderRadius: "2px" }} 
                                  onError={(e) => { e.target.style.display = "none" }}
                                />
                                <img 
                                  src={getSummonerSpellIcon(p.summonerSpells[1])} 
                                  alt="spell2" 
                                  style={{ width: "16px", height: "16px", borderRadius: "2px" }} 
                                  onError={(e) => { e.target.style.display = "none" }}
                                />
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                <div style={{ width: "16px", height: "16px", backgroundColor: "rgba(0,0,0,0.5)", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
                                  <img 
                                    src={getRuneIcon(p.runes.keystoneId)} 
                                    alt="keystone" 
                                    style={{ width: "14px", height: "14px", objectFit: "contain" }} 
                                    onError={(e) => { e.target.style.display = "none" }}
                                  />
                                </div>
                                <div style={{ width: "16px", height: "16px", backgroundColor: "rgba(0,0,0,0.5)", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
                                  <img 
                                    src={getRuneIcon(p.runes.primaryStyleId)} 
                                    alt="rune-style" 
                                    style={{ width: "12px", height: "12px", objectFit: "contain", opacity: 0.8 }} 
                                    onError={(e) => { e.target.style.display = "none" }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "0.85rem", display: "flex", alignItems: "center" }}>
                              {p.playerName}
                              {p.playerName === mvpPlayerName && <span style={{ backgroundColor: "#20C997", color: "#000", fontSize: "0.55rem", padding: "0.05rem 0.2rem", borderRadius: "2px", fontWeight: "bold", marginLeft: "0.3rem" }}>MVP</span>}
                              {p.pentaKills > 0 && <span style={{ backgroundColor: "#D4AF37", color: "#000", fontSize: "0.55rem", padding: "0.05rem 0.2rem", borderRadius: "2px", fontWeight: "bold", marginLeft: "0.3rem" }}>PENTA</span>}
                              {p.quadraKills > 0 && p.pentaKills === 0 && <span style={{ backgroundColor: "#E5A93B", color: "#000", fontSize: "0.55rem", padding: "0.05rem 0.2rem", borderRadius: "2px", fontWeight: "bold", marginLeft: "0.3rem" }}>QUADRA</span>}
                              {p.tripleKills > 0 && p.quadraKills === 0 && p.pentaKills === 0 && <span style={{ backgroundColor: "purple", color: "#fff", fontSize: "0.55rem", padding: "0.05rem 0.2rem", borderRadius: "2px", fontWeight: "bold", marginLeft: "0.3rem" }}>TRIPLE</span>}
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{p.champion}</div>
                          </div>
                        </div>
                        
                        <div className="sb-col-kda">
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>KDA</span>
                          <strong style={{ fontSize: "0.85rem" }}>{p.kills}/{p.deaths}/{p.assists}</strong>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>{getKdaRatio(p.kills, p.deaths, p.assists)}</span>
                        </div>

                        <div className="sb-col-gold">
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>Gold</span>
                          <span style={{ fontSize: "0.8rem" }}>{p.gold.toLocaleString()}</span>
                        </div>

                        <div className="sb-col-cs">
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>CS</span>
                          <span style={{ fontSize: "0.8rem" }}>{p.cs}</span>
                        </div>


                        {/* Damage Bar Chart */}
                        <div className="sb-col-items">
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block", marginBottom: "0.15rem" }}>Dmg: {p.damageDealt.toLocaleString()}</span>
                          <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(0,0,0,0.3)", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${(p.damageDealt / Math.max(1, maxMetricVal)) * 100}%`, height: "100%", backgroundColor: "var(--primary-gold)", borderRadius: "3px" }}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Red Team */}
                <div>
                  <h3 style={{ fontSize: "0.9rem", color: "var(--text-primary)", textTransform: "uppercase", marginBottom: "0.5rem", borderBottom: "2px solid #820000", paddingBottom: "0.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span>{redTeam?.name} (Red Side)</span>
                      {currentGameDetails?.teams?.[200]?.bans && currentGameDetails.teams[200].bans.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginRight: "0.2rem" }}>BANS:</span>
                          {currentGameDetails.teams[200].bans.map((banId, idx) => (
                            banId > 0 && (
                              <div key={idx} style={{ position: "relative" }}>
                                <img src={getChampionIconById(banId)} alt={`Ban ${banId}`} style={{ width: "20px", height: "20px", borderRadius: "50%", filter: "grayscale(100%)", border: "1px solid var(--color-danger)" }} />
                                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "100%", height: "1px", backgroundColor: "var(--color-danger)" }}></div>
                              </div>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                    {currentGameDetails.teams[200]?.winner && <span style={{ color: "var(--primary-gold-bright)", fontSize: "0.75rem" }}>🏆 VICTORY</span>}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {redParticipants.map((p, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-dark)", borderRadius: "4px", padding: "0.6rem 0.8rem", flexWrap: "wrap", gap: "1rem" }}>
                        <div className="sb-col-player" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <img src={getChampionIcon(p.champion)} alt={p.champion} style={{ width: "36px", height: "36px", borderRadius: "4px", border: "1px solid var(--border-dark)" }} />
                          {p.summonerSpells && p.runes && (
                            <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                <img 
                                  src={getSummonerSpellIcon(p.summonerSpells[0])} 
                                  alt="spell1" 
                                  style={{ width: "16px", height: "16px", borderRadius: "2px" }} 
                                  onError={(e) => { e.target.style.display = "none" }}
                                />
                                <img 
                                  src={getSummonerSpellIcon(p.summonerSpells[1])} 
                                  alt="spell2" 
                                  style={{ width: "16px", height: "16px", borderRadius: "2px" }} 
                                  onError={(e) => { e.target.style.display = "none" }}
                                />
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                <div style={{ width: "16px", height: "16px", backgroundColor: "rgba(0,0,0,0.5)", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
                                  <img 
                                    src={getRuneIcon(p.runes.keystoneId)} 
                                    alt="keystone" 
                                    style={{ width: "14px", height: "14px", objectFit: "contain" }} 
                                    onError={(e) => { e.target.style.display = "none" }}
                                  />
                                </div>
                                <div style={{ width: "16px", height: "16px", backgroundColor: "rgba(0,0,0,0.5)", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
                                  <img 
                                    src={getRuneIcon(p.runes.primaryStyleId)} 
                                    alt="rune-style" 
                                    style={{ width: "12px", height: "12px", objectFit: "contain", opacity: 0.8 }} 
                                    onError={(e) => { e.target.style.display = "none" }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "0.85rem", display: "flex", alignItems: "center" }}>
                              {p.playerName}
                              {p.playerName === mvpPlayerName && <span style={{ backgroundColor: "#20C997", color: "#000", fontSize: "0.55rem", padding: "0.05rem 0.2rem", borderRadius: "2px", fontWeight: "bold", marginLeft: "0.3rem" }}>MVP</span>}
                              {p.pentaKills > 0 && <span style={{ backgroundColor: "#D4AF37", color: "#000", fontSize: "0.55rem", padding: "0.05rem 0.2rem", borderRadius: "2px", fontWeight: "bold", marginLeft: "0.3rem" }}>PENTA</span>}
                              {p.quadraKills > 0 && p.pentaKills === 0 && <span style={{ backgroundColor: "#E5A93B", color: "#000", fontSize: "0.55rem", padding: "0.05rem 0.2rem", borderRadius: "2px", fontWeight: "bold", marginLeft: "0.3rem" }}>QUADRA</span>}
                              {p.tripleKills > 0 && p.quadraKills === 0 && p.pentaKills === 0 && <span style={{ backgroundColor: "purple", color: "#fff", fontSize: "0.55rem", padding: "0.05rem 0.2rem", borderRadius: "2px", fontWeight: "bold", marginLeft: "0.3rem" }}>TRIPLE</span>}
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{p.champion}</div>
                          </div>
                        </div>
                        
                        <div className="sb-col-kda">
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>KDA</span>
                          <strong style={{ fontSize: "0.85rem" }}>{p.kills}/{p.deaths}/{p.assists}</strong>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>{getKdaRatio(p.kills, p.deaths, p.assists)}</span>
                        </div>

                        <div className="sb-col-gold">
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>Gold</span>
                          <span style={{ fontSize: "0.8rem" }}>{p.gold.toLocaleString()}</span>
                        </div>

                        <div className="sb-col-cs">
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>CS</span>
                          <span style={{ fontSize: "0.8rem" }}>{p.cs}</span>
                        </div>


                        {/* Damage Bar Chart */}
                        <div className="sb-col-items">
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block", marginBottom: "0.15rem" }}>Dmg: {p.damageDealt.toLocaleString()}</span>
                          <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(0,0,0,0.3)", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${(p.damageDealt / Math.max(1, maxMetricVal)) * 100}%`, height: "100%", backgroundColor: "#DC3545", borderRadius: "3px" }}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: COMBAT CHARTS */}
            {activeTab === "charts" && (
              <div>
                {/* Metric Selector */}
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
                  {[
                    { id: "damageDealt", label: "Damage Dealt", color: "var(--primary-gold)" },
                    { id: "damageTaken", label: "Damage Taken", color: "#6F42C1" },
                    { id: "healing", label: "Total Healing", color: "#28A745" }
                  ].map(metric => (
                    <button
                      key={metric.id}
                      onClick={() => setChartMetric(metric.id)}
                      style={{
                        padding: "0.3rem 0.6rem",
                        fontSize: "0.75rem",
                        backgroundColor: chartMetric === metric.id ? metric.color : "var(--bg-tertiary)",
                        color: chartMetric === metric.id ? "#000" : "var(--text-secondary)",
                        border: "1px solid var(--border-dark)",
                        borderRadius: "2px",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      {metric.label}
                    </button>
                  ))}
                </div>

                <div className="grid-2" style={{ gap: "2rem" }}>
                  {/* Blue Side */}
                  <div>
                    <h4 style={{ color: "#4fa8ff", fontSize: "0.85rem", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.5rem", marginBottom: "1rem", textTransform: "uppercase" }}>
                      {teamA?.name} (Blue Side)
                    </h4>
                    {blueParticipants.map((p, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1rem 0" }}>
                        <div style={{ width: "120px", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <img src={getChampionIcon(p.champion)} alt={p.champion} style={{ width: "24px", height: "24px", borderRadius: "2px" }} />
                          <span style={{ fontSize: "0.75rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: "600" }}>{p.playerName}</span>
                        </div>
                        <div style={{ flex: 1, height: "14px", backgroundColor: "rgba(0,0,0,0.3)", borderRadius: "2px", overflow: "hidden", position: "relative" }}>
                          <div style={{
                            width: `${Math.max(2, (((p[chartMetric] || 0) / Math.max(1, maxMetricVal)) * 100))}%`,
                            height: "100%",
                            backgroundColor: chartMetric === "damageDealt" ? "var(--primary-gold)" : chartMetric === "damageTaken" ? "#6F42C1" : "#28A745",
                            transition: "width 0.4s ease"
                          }}></div>
                          <span style={{ position: "absolute", right: "0.4rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.65rem", fontWeight: "bold", color: "#fff" }}>
                            {(p[chartMetric] || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Red Side */}
                  <div>
                    <h4 style={{ color: "#ffd47f", fontSize: "0.85rem", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.5rem", marginBottom: "1rem", textTransform: "uppercase" }}>
                      {teamB?.name} (Red Side)
                    </h4>
                    {redParticipants.map((p, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1rem 0" }}>
                        <div style={{ width: "120px", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <img src={getChampionIcon(p.champion)} alt={p.champion} style={{ width: "24px", height: "24px", borderRadius: "2px" }} />
                          <span style={{ fontSize: "0.75rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: "600" }}>{p.playerName}</span>
                        </div>
                        <div style={{ flex: 1, height: "14px", backgroundColor: "rgba(0,0,0,0.3)", borderRadius: "2px", overflow: "hidden", position: "relative" }}>
                          <div style={{
                            width: `${Math.max(2, (((p[chartMetric] || 0) / Math.max(1, maxMetricVal)) * 100))}%`,
                            height: "100%",
                            backgroundColor: chartMetric === "damageDealt" ? "#DC3545" : chartMetric === "damageTaken" ? "#6F42C1" : "#28A745",
                            transition: "width 0.4s ease"
                          }}></div>
                          <span style={{ position: "absolute", right: "0.4rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.65rem", fontWeight: "bold", color: "#fff" }}>
                            {(p[chartMetric] || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MATCH OBJECTIVES */}
            {activeTab === "team" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* Gold Lead Visualizer */}
                <div className="card" style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-dark)", padding: "1.5rem" }}>
                  <div className="gold-lead-bar" style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "bold" }}>
                    <span className="mvp-player-name" style={{ color: "#4fa8ff", textAlign: "left", flex: 1 }}>{teamA?.name}</span>
                    <span style={{ color: "var(--primary-gold)", whiteSpace: "nowrap", margin: "0 0.5rem" }}>
                      {goldDiff === 0 ? "Even Gold" : `${goldLeadTeam} +${(goldDiff / 1000).toFixed(1)}k Lead`}
                    </span>
                    <span className="mvp-player-name" style={{ color: "#ffd47f", textAlign: "right", flex: 1 }}>{teamB?.name}</span>
                  </div>
                  <div style={{ width: "100%", height: "12px", backgroundColor: "rgba(0,0,0,0.5)", borderRadius: "6px", display: "flex", overflow: "hidden" }}>
                    <div style={{ width: `${(blueTotalGold / (blueTotalGold + redTotalGold)) * 100}%`, height: "100%", backgroundColor: "#005A82" }}></div>
                    <div style={{ width: `${(redTotalGold / (blueTotalGold + redTotalGold)) * 100}%`, height: "100%", backgroundColor: "#C8AA6E" }}></div>
                  </div>
                </div>

                {(() => {
                  const blueTowers = blueParticipants.reduce((sum, p) => sum + (p.turretsKilled || 0), 0);
                  const redTowers = redParticipants.reduce((sum, p) => sum + (p.turretsKilled || 0), 0);
                  const blueInhibs = blueParticipants.reduce((sum, p) => sum + (p.inhibitorsKilled || 0), 0);
                  const redInhibs = redParticipants.reduce((sum, p) => sum + (p.inhibitorsKilled || 0), 0);

                  return (
                    <div className="grid-2" style={{ gap: "2rem" }}>
                      {/* Left Column: Side-by-side stats */}
                      <div className="card" style={{ border: "1px solid var(--border-dark)", display: "flex", flexDirection: "column", gap: "1rem", padding: "1.5rem" }}>
                        <h4 style={{ fontSize: "0.9rem", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.4rem", textTransform: "uppercase" }}>Objectives Breakdown</h4>
                        {[
                          { label: "Total Kills", blue: blueTotalKills, red: redTotalKills },
                          { label: "Towers Destroyed", blue: blueTowers, red: redTowers },
                          { label: "Inhibitors Destroyed", blue: blueInhibs, red: redInhibs }
                        ].map((row, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>
                            <span style={{ color: "#4fa8ff", fontWeight: "bold", width: "30%", textAlign: "left" }}>{row.blue}</span>
                            <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem", width: "40%", textAlign: "center" }}>{row.label}</span>
                            <span style={{ color: "#ffd47f", fontWeight: "bold", width: "30%", textAlign: "right" }}>{row.red}</span>
                          </div>
                        ))}
                      </div>

                      {/* Right Column: Player structural stats */}
                      <div className="card" style={{ border: "1px solid var(--border-dark)", padding: "1.5rem" }}>
                        <h4 style={{ fontSize: "0.9rem", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.4rem", textTransform: "uppercase", marginBottom: "1.0rem" }}>Player Takedowns</h4>
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
                            <thead>
                              <tr style={{ borderBottom: "1px solid var(--border-dark)", color: "var(--text-muted)", textAlign: "left" }}>
                                <th style={{ padding: "0.4rem" }}>Player</th>
                                <th style={{ padding: "0.4rem", textAlign: "center" }}>Towers</th>
                                <th style={{ padding: "0.4rem", textAlign: "center" }}>Inhibs</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...blueParticipants, ...redParticipants].map((p, idx) => (
                                <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                  <td style={{ padding: "0.4rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                    <img src={getChampionIcon(p.champion)} alt={p.champion} style={{ width: "16px", height: "16px", borderRadius: "2px" }} />
                                    <span style={{ fontWeight: "600", color: p.teamId === 100 ? "#4fa8ff" : "#ffd47f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80px" }}>{p.playerName}</span>
                                  </td>
                                  <td style={{ padding: "0.4rem", textAlign: "center" }}>{p.turretsKilled || 0}</td>
                                  <td style={{ padding: "0.4rem", textAlign: "center" }}>{p.inhibitorsKilled || 0}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB 5: MVP BREAKDOWN */}
            {activeTab === "mvp" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <button onClick={() => setMvpViewMode("game")} className={`btn ${mvpViewMode === "game" ? "btn-primary" : "btn-outline"} sb-col-items`}>Game {selectedGameIndex + 1} MVP</button>
                  <button onClick={() => setMvpViewMode("series")} className={`btn ${mvpViewMode === "series" ? "btn-primary" : "btn-outline"} sb-col-items`}>Series Overall MVP</button>
                </div>

                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", backgroundColor: "rgba(228,179,60,0.05)", border: "1px solid var(--border-gold)", borderRadius: "4px", padding: "1rem", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                  <Info size={18} style={{ color: "var(--primary-gold)", flexShrink: 0, marginTop: "0.1rem" }} />
                  <div>
                    <strong>MVP Algorithm:</strong> Players are scored dynamically out of 1000 points {mvpViewMode === "series" ? `per game (Max: ${1000 * validGames.length} points for a BO${match.bestOf || 3})` : `(Max: 1000 points)`}. Only players from the winning team of each game are eligible.<br />
                    Breakdown: Kill Participation (max 450), Damage Share (max 200), Damage Taken Share (max 150), Healing Share (max 100), KDA Share (max 100).
                  </div>
                </div>

                {(() => {
                  const rawData = mvpViewMode === "game" ? scoredParticipants : seriesScoredParticipants;
                  const dataToRender = rawData.filter(p => p.mvpBreakdown.totalScore > 0);
                  const maxPoints = mvpViewMode === "game" ? 1000 : 1000 * validGames.length;
                  if (dataToRender.length === 0) return <div style={{textAlign: "center", color: "var(--text-muted)"}}>No data available.</div>;

                  return (
                    <div className="card" style={{ border: "1px solid var(--border-dark)", padding: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {dataToRender.map((p, idx) => (
                          <div key={idx} className="mvp-stats-row" style={{ 
                            padding: "1rem", 
                            backgroundColor: idx === 0 ? "rgba(228,179,60,0.08)" : "var(--bg-tertiary)", 
                            border: idx === 0 ? "1px solid var(--border-gold)" : "1px solid var(--border-dark)", 
                            borderRadius: "4px" 
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "40px", flexShrink: 0 }}>
                                <span style={{ fontSize: "1.2rem", fontWeight: "bold", color: idx === 0 ? "var(--primary-gold-bright)" : "var(--text-muted)" }}>
                                  #{idx + 1}
                                </span>
                              </div>
                              <img src={getChampionIcon(p.champion)} alt={p.champion} style={{ width: "40px", height: "40px", borderRadius: "4px" }} />
                            </div>
                            <div style={{ flex: 1, width: "100%" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", width: "100%" }}>
                                <div style={{ fontWeight: "bold", color: p.teamId === 100 ? "#4fa8ff" : "#ffd47f", display: "flex", alignItems: "center", gap: "0.5rem", maxWidth: "70%" }}>
                                  <span className="mvp-player-name">{p.playerName}</span>
                                  {idx === 0 && <span style={{ backgroundColor: "var(--primary-gold)", color: "black", fontSize: "0.6rem", padding: "0.1rem 0.4rem", borderRadius: "2px", fontWeight: "bold", textTransform: "uppercase", flexShrink: 0 }}>MVP</span>}
                                </div>
                                <div style={{ fontWeight: "bold", color: "var(--text-primary)" }}>
                                  {p.mvpBreakdown.totalScore.toFixed(2)} pts
                                </div>
                              </div>
                              <div style={{ display: "flex", height: "12px", borderRadius: "2px", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.2)" }}>
                                <div title={`Kill Part: ${p.mvpBreakdown.kpScore.toFixed(1)}`} style={{ width: `${(p.mvpBreakdown.kpScore / maxPoints) * 100}%`, backgroundColor: "#2196f3" }}></div>
                                <div title={`Dmg Share: ${p.mvpBreakdown.dmgScore.toFixed(1)}`} style={{ width: `${(p.mvpBreakdown.dmgScore / maxPoints) * 100}%`, backgroundColor: "#f44336" }}></div>
                                <div title={`Dmg Taken Share: ${p.mvpBreakdown.defUtilScore.toFixed(1)}`} style={{ width: `${(p.mvpBreakdown.defUtilScore / maxPoints) * 100}%`, backgroundColor: "#00bcd4" }}></div>
                                <div title={`Healing Share: ${p.mvpBreakdown.hypeScore.toFixed(1)}`} style={{ width: `${(p.mvpBreakdown.hypeScore / maxPoints) * 100}%`, backgroundColor: "#4caf50" }}></div>
                                <div title={`KDA Share: ${p.mvpBreakdown.kdaScore.toFixed(1)}`} style={{ width: `${(p.mvpBreakdown.kdaScore / maxPoints) * 100}%`, backgroundColor: "var(--primary-gold)" }}></div>
                              </div>
                              <div className="mvp-kda-stats" style={{ justifyContent: "space-between", fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.4rem", textTransform: "uppercase", overflowX: "auto", whiteSpace: "nowrap", paddingBottom: "0.2rem", scrollbarWidth: "none" }}>
                                <span>KP ({p.mvpBreakdown.kpScore.toFixed(1)})</span>
                                <span>DMG ({p.mvpBreakdown.dmgScore.toFixed(1)})</span>
                                <span>DMG TAKEN ({p.mvpBreakdown.defUtilScore.toFixed(1)})</span>
                                <span>HEAL ({p.mvpBreakdown.hypeScore.toFixed(1)})</span>
                                <span>KDA Share ({p.mvpBreakdown.kdaScore.toFixed(1)})</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            </>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
