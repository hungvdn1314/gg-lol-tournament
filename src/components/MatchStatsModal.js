"use client";

import { useState, useEffect } from "react";
import { X, Award, Eye, BarChart2, Check, Copy } from "lucide-react";
import { HextechCrest, CrossedSwords } from "@/components/Icons";
import { subscribeToMatchDetails } from "@/lib/db";

export default function MatchStatsModal({ match, teams, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("scoreboard"); // scoreboard, charts, utility, team
  const [chartMetric, setChartMetric] = useState("damageDealt"); // damageDealt, damageTaken, healing

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

  // Helper to get champion icon URL from Data Dragon CDN
  const getChampionIcon = (championName) => {
    if (!championName) return "https://placehold.co/40x40";
    const cleanName = championName.replace(/[^a-zA-Z0-9]/g, "");
    return `https://ddragon.leagueoflegends.com/cdn/14.12.1/img/champion/${cleanName}.png`;
  };

  // Helper to get item icon URL from Data Dragon CDN
  const getItemIcon = (itemId) => {
    if (!itemId || itemId === 0) return null;
    return `https://ddragon.leagueoflegends.com/cdn/14.12.1/img/item/${itemId}.png`;
  };

  const getKdaRatio = (k, d, a) => {
    if (d === 0) return `${(k + a).toFixed(1)} Perfect`;
    return `${((k + a) / d).toFixed(1)} KDA`;
  };

  // Sort participants by team
  const blueParticipants = details?.participants?.filter(p => p.teamId === 100) || [];
  const redParticipants = details?.participants?.filter(p => p.teamId === 200) || [];

  // Team totals
  const blueTotalGold = blueParticipants.reduce((sum, p) => sum + (p.gold || 0), 0);
  const redTotalGold = redParticipants.reduce((sum, p) => sum + (p.gold || 0), 0);
  const blueTotalKills = blueParticipants.reduce((sum, p) => sum + (p.kills || 0), 0);
  const redTotalKills = redParticipants.reduce((sum, p) => sum + (p.kills || 0), 0);

  const goldDiff = Math.abs(blueTotalGold - redTotalGold);
  const goldLeadTeam = blueTotalGold > redTotalGold ? teamA?.name?.split(" (")[0] : teamB?.name?.split(" (")[0];

  // Calculate highest metric value in the game for charts
  const maxMetricVal = details?.participants 
    ? Math.max(...details.participants.map(p => p[chartMetric] || 0)) 
    : 1;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "1.5rem", backdropFilter: "blur(5px)" }}>
      <div className="card card-gold" style={{ width: "100%", maxWidth: "1000px", maxHeight: "90vh", overflowY: "auto", padding: "2rem", display: "flex", flexDirection: "column", position: "relative" }}>
        
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
        ) : !details ? (
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
            {/* Quick Game Summary Strip */}
            <div className="card" style={{ backgroundColor: "var(--bg-tertiary)", padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem", marginBottom: "1.5rem", border: "1px solid var(--border-dark)" }}>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase" }}>Winner</span>
                <div style={{ color: "var(--primary-gold-bright)", fontWeight: "bold", fontSize: "1.1rem", textTransform: "uppercase", marginTop: "0.25rem" }}>
                  {details.teams[100]?.winner ? teamA?.name.split(" (")[0] : teamB?.name.split(" (")[0]}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase" }}>Game Duration</span>
                <div style={{ color: "var(--text-primary)", fontWeight: "bold", fontSize: "1.1rem", marginTop: "0.25rem" }}>
                  {formatDuration(details.gameDuration)}
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
            <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border-dark)", marginBottom: "1.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
              {[
                { id: "scoreboard", label: "Scoreboard", icon: <CrossedSwords size={14} /> },
                { id: "charts", label: "Combat Charts", icon: <BarChart2 size={14} /> },
                { id: "utility", label: "Utility & Vision", icon: <Eye size={14} /> },
                { id: "team", label: "Team Objectives", icon: <HextechCrest size={14} /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.4rem 0.8rem",
                    backgroundColor: activeTab === tab.id ? "rgba(228,179,60,0.12)" : "transparent",
                    border: "1px solid",
                    borderColor: activeTab === tab.id ? "var(--border-gold)" : "transparent",
                    color: activeTab === tab.id ? "var(--primary-gold-bright)" : "var(--text-secondary)",
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

            {/* TAB CONTENTS */}
            
            {/* TAB 1: SCOREBOARD */}
            {activeTab === "scoreboard" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                {/* Blue Team */}
                <div>
                  <h3 style={{ fontSize: "0.9rem", color: "var(--text-primary)", textTransform: "uppercase", marginBottom: "0.5rem", borderBottom: "2px solid #005A82", paddingBottom: "0.25rem", display: "flex", justifyContent: "space-between" }}>
                    <span>{teamA?.name} (Blue Side)</span>
                    {details.teams[100]?.winner && <span style={{ color: "var(--primary-gold-bright)", fontSize: "0.75rem" }}>🏆 VICTORY</span>}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {blueParticipants.map((p, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-dark)", borderRadius: "4px", padding: "0.6rem 0.8rem", flexWrap: "wrap", gap: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "20%" }}>
                          <img src={getChampionIcon(p.champion)} alt={p.champion} style={{ width: "32px", height: "32px", borderRadius: "4px", border: "1px solid var(--border-dark)" }} />
                          <div>
                            <div style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "0.85rem", display: "flex", alignItems: "center" }}>
                              {p.playerName}
                              {p.pentaKills > 0 && <span style={{ backgroundColor: "#D4AF37", color: "#000", fontSize: "0.55rem", padding: "0.05rem 0.2rem", borderRadius: "2px", fontWeight: "bold", marginLeft: "0.3rem" }}>PENTA</span>}
                              {p.quadraKills > 0 && p.pentaKills === 0 && <span style={{ backgroundColor: "#E5A93B", color: "#000", fontSize: "0.55rem", padding: "0.05rem 0.2rem", borderRadius: "2px", fontWeight: "bold", marginLeft: "0.3rem" }}>QUADRA</span>}
                              {p.tripleKills > 0 && p.quadraKills === 0 && p.pentaKills === 0 && <span style={{ backgroundColor: "purple", color: "#fff", fontSize: "0.55rem", padding: "0.05rem 0.2rem", borderRadius: "2px", fontWeight: "bold", marginLeft: "0.3rem" }}>TRIPLE</span>}
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{p.champion}</div>
                          </div>
                        </div>
                        
                        <div style={{ width: "15%", textAlign: "center" }}>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>KDA</span>
                          <strong style={{ fontSize: "0.85rem" }}>{p.kills}/{p.deaths}/{p.assists}</strong>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>{getKdaRatio(p.kills, p.deaths, p.assists)}</span>
                        </div>

                        <div style={{ width: "10%", textAlign: "center" }}>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>Gold</span>
                          <span style={{ fontSize: "0.8rem" }}>{p.gold.toLocaleString()}</span>
                        </div>

                        <div style={{ width: "8%", textAlign: "center" }}>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>CS</span>
                          <span style={{ fontSize: "0.8rem" }}>{p.cs}</span>
                        </div>

                        <div style={{ width: "8%", textAlign: "center" }}>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>Vision</span>
                          <span style={{ fontSize: "0.8rem" }}>{p.vision || 0}</span>
                        </div>

                        {/* Items */}
                        <div style={{ display: "flex", gap: "3px", width: "20%" }}>
                          {p.items.map((itemId, i) => {
                            const iconUrl = getItemIcon(itemId);
                            return (
                              <div key={i} style={{ width: "22px", height: "22px", backgroundColor: "rgba(0,0,0,0.3)", borderRadius: "2px", border: "1px solid var(--border-dark)", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
                                {iconUrl ? (
                                  <img src={iconUrl} alt="item" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : null}
                              </div>
                            );
                          })}
                        </div>

                        {/* Damage Bar Chart */}
                        <div style={{ flex: 1 }}>
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
                  <h3 style={{ fontSize: "0.9rem", color: "var(--text-primary)", textTransform: "uppercase", marginBottom: "0.5rem", borderBottom: "2px solid #C8AA6E", paddingBottom: "0.25rem", display: "flex", justifyContent: "space-between" }}>
                    <span>{teamB?.name} (Red Side)</span>
                    {details.teams[200]?.winner && <span style={{ color: "var(--primary-gold-bright)", fontSize: "0.75rem" }}>🏆 VICTORY</span>}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {redParticipants.map((p, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-dark)", borderRadius: "4px", padding: "0.6rem 0.8rem", flexWrap: "wrap", gap: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "20%" }}>
                          <img src={getChampionIcon(p.champion)} alt={p.champion} style={{ width: "32px", height: "32px", borderRadius: "4px", border: "1px solid var(--border-dark)" }} />
                          <div>
                            <div style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "0.85rem", display: "flex", alignItems: "center" }}>
                              {p.playerName}
                              {p.pentaKills > 0 && <span style={{ backgroundColor: "#D4AF37", color: "#000", fontSize: "0.55rem", padding: "0.05rem 0.2rem", borderRadius: "2px", fontWeight: "bold", marginLeft: "0.3rem" }}>PENTA</span>}
                              {p.quadraKills > 0 && p.pentaKills === 0 && <span style={{ backgroundColor: "#E5A93B", color: "#000", fontSize: "0.55rem", padding: "0.05rem 0.2rem", borderRadius: "2px", fontWeight: "bold", marginLeft: "0.3rem" }}>QUADRA</span>}
                              {p.tripleKills > 0 && p.quadraKills === 0 && p.pentaKills === 0 && <span style={{ backgroundColor: "purple", color: "#fff", fontSize: "0.55rem", padding: "0.05rem 0.2rem", borderRadius: "2px", fontWeight: "bold", marginLeft: "0.3rem" }}>TRIPLE</span>}
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{p.champion}</div>
                          </div>
                        </div>
                        
                        <div style={{ width: "15%", textAlign: "center" }}>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>KDA</span>
                          <strong style={{ fontSize: "0.85rem" }}>{p.kills}/{p.deaths}/{p.assists}</strong>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>{getKdaRatio(p.kills, p.deaths, p.assists)}</span>
                        </div>

                        <div style={{ width: "10%", textAlign: "center" }}>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>Gold</span>
                          <span style={{ fontSize: "0.8rem" }}>{p.gold.toLocaleString()}</span>
                        </div>

                        <div style={{ width: "8%", textAlign: "center" }}>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>CS</span>
                          <span style={{ fontSize: "0.8rem" }}>{p.cs}</span>
                        </div>

                        <div style={{ width: "8%", textAlign: "center" }}>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>Vision</span>
                          <span style={{ fontSize: "0.8rem" }}>{p.vision || 0}</span>
                        </div>

                        {/* Items */}
                        <div style={{ display: "flex", gap: "3px", width: "20%" }}>
                          {p.items.map((itemId, i) => {
                            const iconUrl = getItemIcon(itemId);
                            return (
                              <div key={i} style={{ width: "22px", height: "22px", backgroundColor: "rgba(0,0,0,0.3)", borderRadius: "2px", border: "1px solid var(--border-dark)", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
                                {iconUrl ? (
                                  <img src={iconUrl} alt="item" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : null}
                              </div>
                            );
                          })}
                        </div>

                        {/* Damage Bar Chart */}
                        <div style={{ flex: 1 }}>
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

            {/* TAB 3: UTILITY & VISION */}
            {activeTab === "utility" && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", border: "1px solid var(--border-dark)" }}>
                  <thead>
                    <tr style={{ backgroundColor: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-dark)", textTransform: "uppercase", fontSize: "0.7rem", color: "var(--text-muted)", textAlign: "left" }}>
                      <th style={{ padding: "0.6rem 0.8rem" }}>Player</th>
                      <th style={{ padding: "0.6rem 0.8rem", textAlign: "center" }}>Wards Placed</th>
                      <th style={{ padding: "0.6rem 0.8rem", textAlign: "center" }}>Wards Killed</th>
                      <th style={{ padding: "0.6rem 0.8rem", textAlign: "center" }}>Control Wards</th>
                      <th style={{ padding: "0.6rem 0.8rem", textAlign: "center" }}>CC Duration</th>
                      <th style={{ padding: "0.6rem 0.8rem", textAlign: "center" }}>Towers Killed</th>
                      <th style={{ padding: "0.6rem 0.8rem", textAlign: "center" }}>Inhibs Killed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...blueParticipants, ...redParticipants].map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border-dark)", backgroundColor: p.teamId === 100 ? "rgba(0,90,130,0.03)" : "rgba(200,170,110,0.03)" }}>
                        <td style={{ padding: "0.6rem 0.8rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <img src={getChampionIcon(p.champion)} alt={p.champion} style={{ width: "20px", height: "20px", borderRadius: "2px" }} />
                          <span style={{ fontWeight: "600", color: p.teamId === 100 ? "#4fa8ff" : "#ffd47f" }}>{p.playerName}</span>
                        </td>
                        <td style={{ padding: "0.6rem 0.8rem", textAlign: "center" }}>{p.wardsPlaced || 0}</td>
                        <td style={{ padding: "0.6rem 0.8rem", textAlign: "center" }}>{p.wardsKilled || 0}</td>
                        <td style={{ padding: "0.6rem 0.8rem", textAlign: "center" }}>{p.controlWards || 0}</td>
                        <td style={{ padding: "0.6rem 0.8rem", textAlign: "center" }}>{p.ccDuration || 0}s</td>
                        <td style={{ padding: "0.6rem 0.8rem", textAlign: "center" }}>{p.turretsKilled || 0}</td>
                        <td style={{ padding: "0.6rem 0.8rem", textAlign: "center" }}>{p.inhibitorsKilled || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 4: TEAM OBJECTIVES & COMPARISON */}
            {activeTab === "team" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* Gold Lead Visualizer */}
                <div className="card" style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-dark)", padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "bold" }}>
                    <span style={{ color: "#4fa8ff" }}>{teamA?.name} ({(blueTotalGold / 1000).toFixed(1)}k)</span>
                    <span style={{ color: "var(--primary-gold)" }}>
                      {goldDiff === 0 ? "Even Gold" : `${goldLeadTeam} +${(goldDiff / 1000).toFixed(1)}k Lead`}
                    </span>
                    <span style={{ color: "#ffd47f" }}>{teamB?.name} ({(redTotalGold / 1000).toFixed(1)}k)</span>
                  </div>
                  <div style={{ width: "100%", height: "12px", backgroundColor: "rgba(0,0,0,0.5)", borderRadius: "6px", display: "flex", overflow: "hidden" }}>
                    <div style={{ width: `${(blueTotalGold / (blueTotalGold + redTotalGold)) * 100}%`, height: "100%", backgroundColor: "#005A82" }}></div>
                    <div style={{ width: `${(redTotalGold / (blueTotalGold + redTotalGold)) * 100}%`, height: "100%", backgroundColor: "#C8AA6E" }}></div>
                  </div>
                </div>

                <div className="grid-2" style={{ gap: "2rem" }}>
                  {/* Left Column: Side-by-side stats */}
                  <div className="card" style={{ border: "1px solid var(--border-dark)", display: "flex", flexDirection: "column", gap: "1rem", padding: "1.5rem" }}>
                    <h4 style={{ fontSize: "0.9rem", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.4rem", textTransform: "uppercase" }}>Objectives Breakdown</h4>
                    {[
                      { label: "Total Kills", blue: blueTotalKills, red: redTotalKills },
                      { label: "Dragons Slain", blue: details.teams[100]?.dragons || 0, red: details.teams[200]?.dragons || 0 },
                      { label: "Barons Slain", blue: details.teams[100]?.barons || 0, red: details.teams[200]?.barons || 0 },
                      { label: "First Blood", blue: details.teams[100]?.firstBlood ? "🩸 Yes" : "No", red: details.teams[200]?.firstBlood ? "🩸 Yes" : "No" }
                    ].map((row, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>
                        <span style={{ color: "#4fa8ff", fontWeight: "bold", width: "30%", textAlign: "left" }}>{row.blue}</span>
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem", width: "40%", textAlign: "center" }}>{row.label}</span>
                        <span style={{ color: "#ffd47f", fontWeight: "bold", width: "30%", textAlign: "right" }}>{row.red}</span>
                      </div>
                    ))}
                  </div>

                  {/* Right Column: Bans */}
                  <div className="card" style={{ border: "1px solid var(--border-dark)", padding: "1.5rem" }}>
                    <h4 style={{ fontSize: "0.9rem", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.4rem", textTransform: "uppercase", marginBottom: "1rem" }}>Bans</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div>
                        <span style={{ fontSize: "0.75rem", color: "#4fa8ff", display: "block", marginBottom: "0.5rem" }}>Blue Side Bans</span>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          {(details.teams[100]?.bans || []).map((ban, i) => (
                            <div key={i} style={{ width: "32px", height: "32px", border: "1px solid var(--border-dark)", borderRadius: "2px", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.3)" }}>
                              {/* check if ban is name or ID */}
                              {typeof ban === "string" ? (
                                <img src={getChampionIcon(ban)} alt="ban" style={{ width: "100%", height: "100%", filter: "grayscale(100%)" }} />
                              ) : (
                                <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", display: "block", textAlign: "center", paddingTop: "6px" }}>Banned</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.75rem", color: "#ffd47f", display: "block", marginBottom: "0.5rem" }}>Red Side Bans</span>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          {(details.teams[200]?.bans || []).map((ban, i) => (
                            <div key={i} style={{ width: "32px", height: "32px", border: "1px solid var(--border-dark)", borderRadius: "2px", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.3)" }}>
                              {typeof ban === "string" ? (
                                <img src={getChampionIcon(ban)} alt="ban" style={{ width: "100%", height: "100%", filter: "grayscale(100%)" }} />
                              ) : (
                                <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", display: "block", textAlign: "center", paddingTop: "6px" }}>Banned</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
