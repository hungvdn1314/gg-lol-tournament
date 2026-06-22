"use client";

import { useState, useEffect } from "react";
import { X, Award, Eye, Swords, Shield, Heart } from "lucide-react";
import { subscribeToMatchDetails } from "@/lib/db";

export default function MatchStatsModal({ match, teams, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

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
    // Clean name for CDN (remove spaces and special characters)
    const cleanName = championName.replace(/[^a-zA-Z0-9]/g, "");
    return `https://ddragon.leagueoflegends.com/cdn/14.12.1/img/champion/${cleanName}.png`;
  };

  // Helper to get item icon URL from Data Dragon CDN
  const getItemIcon = (itemId) => {
    if (!itemId || itemId === 0) return null;
    return `https://ddragon.leagueoflegends.com/cdn/14.12.1/img/item/${itemId}.png`;
  };

  // Sort participants by team
  const blueParticipants = details?.participants?.filter(p => p.teamId === 100) || [];
  const redParticipants = details?.participants?.filter(p => p.teamId === 200) || [];

  // Calculate highest damage in the game for charts
  const maxDamage = details?.participants 
    ? Math.max(...details.participants.map(p => p.damageDealt || 0)) 
    : 1;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "1.5rem", backdropFilter: "blur(5px)" }}>
      <div className="card card-gold" style={{ width: "100%", maxWidth: "1000px", maxHeight: "90vh", overflowY: "auto", padding: "2rem", display: "flex", flexDirection: "column", position: "relative" }}>
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="btn btn-outline" 
          style={{ position: "absolute", top: "1.5rem", right: "1.5rem", padding: "0.5rem", borderRadius: "50%", cursor: "pointer" }}
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
            <div className="card" style={{ backgroundColor: "var(--bg-tertiary)", padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem", marginBottom: "2rem", border: "1px solid var(--border-dark)" }}>
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
              <div style={{ display: "flex", gap: "2rem" }}>
                <div style={{ textSelf: "center" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase", display: "block" }}>Blue Team Objectives</span>
                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem", fontSize: "0.85rem" }}>
                    <span title="Dragons">🐉 {details.teams[100]?.dragons || 0}</span>
                    <span title="Barons">👾 {details.teams[100]?.barons || 0}</span>
                    {details.teams[100]?.firstBlood && <span style={{ color: "var(--primary-gold-bright)" }}>🩸 First Blood</span>}
                  </div>
                </div>
                <div style={{ borderRight: "1px solid var(--border-dark)" }}></div>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase", display: "block" }}>Red Team Objectives</span>
                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem", fontSize: "0.85rem" }}>
                    <span title="Dragons">🐉 {details.teams[200]?.dragons || 0}</span>
                    <span title="Barons">👾 {details.teams[200]?.barons || 0}</span>
                    {details.teams[200]?.firstBlood && <span style={{ color: "var(--primary-gold-bright)" }}>🩸 First Blood</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Teams Roster Scoreboard */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
              {/* Blue Team (Team A) */}
              <div>
                <h3 style={{ fontSize: "1rem", color: "var(--text-primary)", textTransform: "uppercase", marginBottom: "0.75rem", borderBottom: "2px solid #005A82", paddingBottom: "0.25rem", display: "flex", justifyContent: "space-between" }}>
                  <span>{teamA?.name} (Blue Side)</span>
                  {details.teams[100]?.winner && <span style={{ color: "var(--primary-gold-bright)", fontSize: "0.8rem" }}>🏆 VICTORY</span>}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {blueParticipants.map((p, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-dark)", borderRadius: "4px", padding: "0.75rem 1rem", flexWrap: "wrap", gap: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "20%" }}>
                        <img src={getChampionIcon(p.champion)} alt={p.champion} style={{ width: "36px", height: "36px", borderRadius: "4px", border: "1px solid var(--border-dark)" }} />
                        <div>
                          <div style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "0.9rem" }}>{p.playerName}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.champion}</div>
                        </div>
                      </div>
                      
                      <div style={{ width: "12%", textAlign: "center" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>KDA</span>
                        <strong style={{ fontSize: "0.95rem" }}>{p.kills}/{p.deaths}/{p.assists}</strong>
                      </div>

                      <div style={{ width: "10%", textAlign: "center" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Gold</span>
                        <span>{p.gold.toLocaleString()}</span>
                      </div>

                      <div style={{ width: "8%", textAlign: "center" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>CS</span>
                        <span>{p.cs}</span>
                      </div>

                      {/* Items */}
                      <div style={{ display: "flex", gap: "4px", width: "20%" }}>
                        {p.items.map((itemId, i) => {
                          const iconUrl = getItemIcon(itemId);
                          return (
                            <div key={i} style={{ width: "24px", height: "24px", backgroundColor: "rgba(0,0,0,0.3)", borderRadius: "2px", border: "1px solid var(--border-dark)", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
                              {iconUrl ? (
                                <img src={iconUrl} alt="item" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : null}
                            </div>
                          );
                        })}
                      </div>

                      {/* Damage Bar Chart */}
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Damage: {p.damageDealt.toLocaleString()}</span>
                        <div style={{ width: "100%", height: "8px", backgroundColor: "rgba(0,0,0,0.3)", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ width: `${(p.damageDealt / maxDamage) * 100}%`, height: "100%", backgroundColor: "var(--primary-gold)", borderRadius: "4px" }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Red Team (Team B) */}
              <div>
                <h3 style={{ fontSize: "1rem", color: "var(--text-primary)", textTransform: "uppercase", marginBottom: "0.75rem", borderBottom: "2px solid #C8AA6E", paddingBottom: "0.25rem", display: "flex", justifyContent: "space-between" }}>
                  <span>{teamB?.name} (Red Side)</span>
                  {details.teams[200]?.winner && <span style={{ color: "var(--primary-gold-bright)", fontSize: "0.8rem" }}>🏆 VICTORY</span>}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {redParticipants.map((p, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-dark)", borderRadius: "4px", padding: "0.75rem 1rem", flexWrap: "wrap", gap: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "20%" }}>
                        <img src={getChampionIcon(p.champion)} alt={p.champion} style={{ width: "36px", height: "36px", borderRadius: "4px", border: "1px solid var(--border-dark)" }} />
                        <div>
                          <div style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "0.9rem" }}>{p.playerName}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.champion}</div>
                        </div>
                      </div>
                      
                      <div style={{ width: "12%", textAlign: "center" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>KDA</span>
                        <strong style={{ fontSize: "0.95rem" }}>{p.kills}/{p.deaths}/{p.assists}</strong>
                      </div>

                      <div style={{ width: "10%", textAlign: "center" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Gold</span>
                        <span>{p.gold.toLocaleString()}</span>
                      </div>

                      <div style={{ width: "8%", textAlign: "center" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>CS</span>
                        <span>{p.cs}</span>
                      </div>

                      {/* Items */}
                      <div style={{ display: "flex", gap: "4px", width: "20%" }}>
                        {p.items.map((itemId, i) => {
                          const iconUrl = getItemIcon(itemId);
                          return (
                            <div key={i} style={{ width: "24px", height: "24px", backgroundColor: "rgba(0,0,0,0.3)", borderRadius: "2px", border: "1px solid var(--border-dark)", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
                              {iconUrl ? (
                                <img src={iconUrl} alt="item" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : null}
                            </div>
                          );
                        })}
                      </div>

                      {/* Damage Bar Chart */}
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Damage: {p.damageDealt.toLocaleString()}</span>
                        <div style={{ width: "100%", height: "8px", backgroundColor: "rgba(0,0,0,0.3)", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ width: `${(p.damageDealt / maxDamage) * 100}%`, height: "100%", backgroundColor: "#DC3545", borderRadius: "4px" }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
