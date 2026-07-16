"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { subscribeToData } from "@/lib/db";
import { LoLMinion, CrossedSwords, SummonersCup, RoleTop, RoleJungle, RoleMid, RoleADC, RoleSupport } from "@/components/Icons";
import { teamLogoPlaceholder } from "@/lib/placeholders";

export default function Teams() {
  const [teams, setTeams] = useState({});
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [groupFilter, setGroupFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showIgn, setShowIgn] = useState(false);

  useEffect(() => {
    const unsubTeams = subscribeToData("teams", (data) => {
      setTeams(data || {});
      setLoading(false);
    });
    return unsubTeams;
  }, []);



  const teamList = Object.values(teams);
  
  // Filter teams based on selected group
  const filteredTeams = teamList.filter((team) => {
    if (groupFilter === "all") return true;
    return team.group === groupFilter;
  });

  const selectedTeam = selectedTeamId ? teams[selectedTeamId] : null;

  const roleIcons = {
    Top: <RoleTop size={14} />,
    Jungle: <RoleJungle size={14} />,
    Mid: <RoleMid size={14} />,
    ADC: <RoleADC size={14} />,
    Support: <RoleSupport size={14} />
  };

  const ROLE_ORDER = {
    Top: 1,
    Jungle: 2,
    Mid: 3,
    ADC: 4,
    Support: 5
  };

  return (
    <div className="container">
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <span className="hero-badge">Participating Teams</span>
        <h1 style={{ fontSize: "2.5rem", textTransform: "uppercase", marginBottom: "1rem" }}>Tournament Attendance</h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto" }}>
          Browse all registered department teams, check their active summoner rosters, and follow their statistics throughout the cup.
        </p>

        {/* Group Filter Tabs */}
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "2rem" }}>
          <button
            onClick={() => setGroupFilter("all")}
            className={`btn ${groupFilter === "all" ? "btn-primary" : "btn-outline"}`}
            style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}
          >
            All Groups
          </button>
          <button
            onClick={() => setGroupFilter("A")}
            className={`btn ${groupFilter === "A" ? "btn-primary" : "btn-outline"}`}
            style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}
          >
            Group A
          </button>
          <button
            onClick={() => setGroupFilter("B")}
            className={`btn ${groupFilter === "B" ? "btn-primary" : "btn-outline"}`}
            style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}
          >
            Group B
          </button>
          <button
            onClick={() => setGroupFilter("C")}
            className={`btn ${groupFilter === "C" ? "btn-primary" : "btn-outline"}`}
            style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}
          >
            Group C
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem", marginBottom: "3rem" }}>
        {loading ? (
          <>
            <div className="skeleton" style={{ height: "80px" }}></div>
            <div className="skeleton" style={{ height: "80px" }}></div>
            <div className="skeleton" style={{ height: "80px" }}></div>
            <div className="skeleton" style={{ height: "80px" }}></div>
            <div className="skeleton" style={{ height: "80px" }}></div>
            <div className="skeleton" style={{ height: "80px" }}></div>
          </>
        ) : filteredTeams.map((team) => (
          <div
            key={team.id}
            onClick={() => setSelectedTeamId(team.id)}
            className={`card ${selectedTeamId === team.id ? "card-gold" : ""}`}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", transition: "all 0.2s" }}
          >
            <img
              src={team.logo || teamLogoPlaceholder(team.name, 48)}
              alt={team.name}
              style={{ width: "48px", height: "48px", borderRadius: "8px", objectFit: "cover", border: "1px solid var(--border-dark)", backgroundColor: "var(--bg-tertiary)" }}
            />
            <div style={{ flex: 1, textAlign: "left", overflow: "hidden" }}>
              <div style={{ fontWeight: "700", fontSize: "1.05rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{team.name}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem", textTransform: "uppercase" }}>Group {team.group}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: "800", color: "var(--primary-gold)", fontSize: "1.1rem" }}>{team.stats?.points || 0} PTS</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{team.stats?.wins || 0}W - {team.stats?.losses || 0}L</div>
            </div>
          </div>
        ))}
      </div>

      {/* Expanded Team Modal */}
      {selectedTeam && (
        <div className="modal-overlay" onClick={() => setSelectedTeamId(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center", padding: "1rem", backdropFilter: "blur(4px)" }}>
          <div className="card card-gold" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "900px", maxHeight: "90vh", overflowY: "auto", padding: "2.5rem", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "2rem", borderBottom: "1px solid var(--border-dark)", paddingBottom: "1.5rem", marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
              <img
                src={selectedTeam.logo || teamLogoPlaceholder(selectedTeam.name, 150)}
                alt={selectedTeam.name}
                style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--primary-gold)" }}
              />
              <div>
                <h2 style={{ fontSize: "2rem", textTransform: "uppercase" }}>{selectedTeam.name}</h2>
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                  <span className="hero-badge" style={{ margin: 0, fontSize: "0.75rem" }}>Group {selectedTeam.group} Standings</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <SummonersCup size={16} style={{ color: "var(--primary-gold)" }} />
                    Points: <strong>{selectedTeam.stats?.points || 0}</strong>
                  </span>
                </div>
              </div>
            </div>
            
            <button onClick={() => setSelectedTeamId(null)} className="btn btn-outline" style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}>
              Close Roster
            </button>
          </div>

          <div className="grid-2">
            {/* Active Roster */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <h3 style={{ textTransform: "uppercase", fontSize: "1.1rem", margin: 0, color: "var(--primary-gold)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <LoLMinion size={18} /> Active Roster
                </h3>
                
                {/* Toggle Real Name / IGN */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Display:</span>
                  <div style={{ display: "flex", backgroundColor: "var(--bg-primary)", padding: "3px", borderRadius: "20px", border: "1px solid var(--border-dark)" }}>
                    <button
                      onClick={() => setShowIgn(false)}
                      style={{
                        padding: "0.3rem 0.8rem",
                        fontSize: "0.7rem",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        borderRadius: "15px",
                        border: "none",
                        cursor: "pointer",
                        backgroundColor: !showIgn ? "var(--primary-gold)" : "transparent",
                        color: !showIgn ? "#0A0A0C" : "var(--text-secondary)",
                        transition: "all 0.2s ease"
                      }}
                    >
                      Real Name
                    </button>
                    <button
                      onClick={() => setShowIgn(true)}
                      style={{
                        padding: "0.3rem 0.8rem",
                        fontSize: "0.7rem",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        borderRadius: "15px",
                        border: "none",
                        cursor: "pointer",
                        backgroundColor: showIgn ? "var(--primary-gold)" : "transparent",
                        color: showIgn ? "#0A0A0C" : "var(--text-secondary)",
                        transition: "all 0.2s ease"
                      }}
                    >
                      IGN
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {selectedTeam.players && selectedTeam.players.length > 0 ? (
                  [...selectedTeam.players]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((player, idx) => (
                    <div
                      key={idx}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--bg-tertiary)", padding: "1rem 1.25rem", borderRadius: "4px", border: "1px solid var(--border-dark)" }}
                    >
                      <Link 
                        href={`/players/${encodeURIComponent(player.name)}`} 
                        style={{ fontWeight: "700", color: "var(--text-primary)", textDecoration: "none", borderBottom: "1px dashed var(--border-dark)" }}
                        onMouseEnter={(e) => { e.target.style.color = 'var(--primary-gold)'; e.target.style.borderBottom = '1px solid var(--primary-gold)'; }}
                        onMouseLeave={(e) => { e.target.style.color = 'var(--text-primary)'; e.target.style.borderBottom = '1px dashed var(--border-dark)'; }}
                      >
                        {showIgn ? (
                          (() => {
                            const riotId = player.riotId || `${player.name}#vn1`;
                            const parts = riotId.split("#");
                            const name = parts[0];
                            const tag = parts[1] ? `#${parts[1]}` : "";
                            return (
                              <span>
                                {name}
                                {tag && <span style={{ fontSize: "0.8em", color: "var(--text-muted)", fontWeight: "normal", marginLeft: "0.2rem" }}>{tag}</span>}
                              </span>
                            );
                          })()
                        ) : (
                          player.name
                        )}
                      </Link>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--primary-gold)", fontWeight: "600", backgroundColor: "rgba(var(--primary-gold-rgb), 0.05)", padding: "0.25rem 0.75rem", borderRadius: "20px", border: "1px solid rgba(var(--primary-gold-rgb), 0.15)" }}>
                        <RoleMid size={14} />
                        <span>All Mid</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No players registered for this team.</p>
                )}
              </div>
            </div>

            {/* Team Statistics */}
            <div>
              <h3 style={{ textTransform: "uppercase", fontSize: "1.1rem", marginBottom: "1.5rem", color: "var(--primary-gold)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CrossedSwords size={18} /> Team Statistics
              </h3>
              <div className="card" style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-dark)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.75rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>Matches Played</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: "bold" }}>{selectedTeam.stats?.played || 0}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.75rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>Series Wins / Losses</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: "bold" }}>
                      <span style={{ color: "var(--color-success)" }}>{selectedTeam.stats?.wins || 0}W</span> - <span style={{ color: "var(--color-danger)" }}>{selectedTeam.stats?.losses || 0}L</span>
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.75rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>Individual Game Wins</span>
                    <span style={{ color: "var(--color-success)", fontWeight: "bold" }}>{selectedTeam.stats?.gameWins || 0}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.75rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>Individual Game Losses</span>
                    <span style={{ color: "var(--color-danger)", fontWeight: "bold" }}>{selectedTeam.stats?.gameLosses || 0}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Win Rate (Series)</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: "bold" }}>
                      {selectedTeam.stats?.played ? Math.round((selectedTeam.stats.wins / selectedTeam.stats.played) * 100) : 0}%
                    </span>
                  </div>
                </div>
            </div>
          </div>
        </div>
        </div>
        </div>
      )}
    </div>
  );
}
