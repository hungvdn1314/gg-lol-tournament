"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { subscribeToData, subscribeToAllMatchDetails } from "@/lib/db";
import { LoLMinion, CrossedSwords, SummonersCup, RoleMid } from "@/components/Icons";
import { teamLogoPlaceholder } from "@/lib/placeholders";

export default function Teams() {
  return (
    <Suspense fallback={<div className="container" style={{ textAlign: "center", padding: "4rem" }}>Loading teams...</div>}>
      <TeamsContent />
    </Suspense>
  );
}

function TeamsContent() {
  const [teams, setTeams] = useState({});
  const [matches, setMatches] = useState({});
  const [allMatches, setAllMatches] = useState({});
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [groupFilter, setGroupFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showIgn, setShowIgn] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTeamId = searchParams.get("teamId");

  const handleClose = () => {
    setSelectedTeamId(null);
    const backUrl = searchParams.get("backUrl");
    if (backUrl) {
      router.push(backUrl);
    } else {
      router.push("/teams");
    }
  };

  useEffect(() => {
    let teamsLoaded = false;
    let matchesLoaded = false;
    let detailsLoaded = false;

    const checkDone = () => {
      if (teamsLoaded && matchesLoaded && detailsLoaded) setLoading(false);
    };

    const unsubTeams = subscribeToData("teams", (data) => {
      setTeams(data || {});
      teamsLoaded = true;
      checkDone();
    });

    const unsubMatches = subscribeToData("matches", (data) => {
      setMatches(data || {});
      matchesLoaded = true;
      checkDone();
    });

    const unsubDetails = subscribeToAllMatchDetails((data) => {
      setAllMatches(data || {});
      detailsLoaded = true;
      checkDone();
    });

    return () => {
      unsubTeams();
      unsubMatches();
      unsubDetails();
    };
  }, []);

  // Build player to team mapping
  const playerToTeamMap = {};
  Object.entries(teams).forEach(([teamId, team]) => {
    if (team && Array.isArray(team.players)) {
      team.players.forEach(p => {
        playerToTeamMap[p.name.trim().toLowerCase()] = teamId;
      });
    }
  });

  // Calculate tournament wide team stats
  const tournamentStats = {};
  Object.keys(teams).forEach(teamId => {
    tournamentStats[teamId] = {
      played: 0,
      wins: 0,
      losses: 0,
      gameWins: 0,
      gameLosses: 0,
      points: teams[teamId]?.stats?.points || 0
    };
  });

  // Series wins / losses from matches
  Object.values(matches).forEach(match => {
    if (match.status !== "completed") return;
    const teamAId = match.teamAId;
    const teamBId = match.teamBId;
    const winnerId = match.winnerId;

    if (tournamentStats[teamAId]) {
      tournamentStats[teamAId].played += 1;
      if (winnerId === teamAId) {
        tournamentStats[teamAId].wins += 1;
      } else {
        tournamentStats[teamAId].losses += 1;
      }
    }
    if (tournamentStats[teamBId]) {
      tournamentStats[teamBId].played += 1;
      if (winnerId === teamBId) {
        tournamentStats[teamBId].wins += 1;
      } else {
        tournamentStats[teamBId].losses += 1;
      }
    }
  });

  // Game wins / losses from matchDetails
  Object.entries(allMatches).forEach(([matchId, gamesArray]) => {
    if (!Array.isArray(gamesArray)) return;

    gamesArray.forEach(game => {
      if (!game || !game.participants) return;

      const winningParticipant = game.participants.find(p => p.win);
      const winningTeamId = winningParticipant ? winningParticipant.teamId : null;

      let winningActualTeamId = null;
      if (winningTeamId !== null) {
        const winningPlayer = game.participants.find(p => p.teamId === winningTeamId);
        if (winningPlayer) {
          winningActualTeamId = playerToTeamMap[winningPlayer.playerName?.trim().toLowerCase()] || winningTeamId;
        }
      }

      const gameTeamIds = Array.from(new Set(game.participants.map(p => {
        return playerToTeamMap[p.playerName?.trim().toLowerCase()] || p.teamId;
      })));

      gameTeamIds.forEach(teamId => {
        if (tournamentStats[teamId]) {
          if (winningActualTeamId !== null) {
            if (teamId === winningActualTeamId) {
              tournamentStats[teamId].gameWins += 1;
            } else {
              tournamentStats[teamId].gameLosses += 1;
            }
          }
        }
      });
    });
  });

  // Decorate teams with tournament stats
  const decoratedTeams = {};
  Object.entries(teams).forEach(([teamId, team]) => {
    const stats = tournamentStats[teamId];
    decoratedTeams[teamId] = {
      ...team,
      stats: {
        played: stats.played || team.stats?.played || 0,
        wins: stats.wins || team.stats?.wins || 0,
        losses: stats.losses || team.stats?.losses || 0,
        gameWins: stats.gameWins || team.stats?.gameWins || 0,
        gameLosses: stats.gameLosses || team.stats?.gameLosses || 0,
        points: team.stats?.points || 0
      }
    };
  });

  useEffect(() => {
    if (queryTeamId && decoratedTeams[queryTeamId]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTeamId(queryTeamId);
    } else if (!queryTeamId) {
      setSelectedTeamId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryTeamId, teams]);

  const teamList = Object.values(decoratedTeams);
  
  // Filter teams based on selected group
  const filteredTeams = teamList.filter((team) => {
    if (groupFilter === "all") return true;
    return team.group === groupFilter;
  });

  const selectedTeam = selectedTeamId ? decoratedTeams[selectedTeamId] : null;

  const getFriendlyMatchName = (match) => {
    if (!match) return "Unknown Match";
    const id = match.id || "";
    if (id.startsWith("match-playoff-")) {
      switch (id) {
        case "match-playoff-1": return "UB Semifinals - Match 1";
        case "match-playoff-2": return "UB Semifinals - Match 2";
        case "match-playoff-3": return "LB Round 1 - Match 1";
        case "match-playoff-4": return "LB Round 1 - Match 2";
        case "match-playoff-5": return "UB Finals";
        case "match-playoff-6": return "LB Semifinals";
        case "match-playoff-7": return "LB Finals";
        case "match-playoff-8": return "Grand Final";
        default: return match.name || id;
      }
    }
    if (id.startsWith("match-g-")) {
      const part = id.split("-")[2] || "";
      const groupChar = part[0]?.toUpperCase() || "";
      const matchNum = part.substring(1) || "";
      return `Group ${groupChar} - Match ${matchNum}`;
    }
    return match.name || id;
  };

  const teamMatchHistory = [];
  if (selectedTeam && matches) {
    Object.values(matches).forEach(match => {
      if (match.status !== "completed") return;
      if (match.teamAId === selectedTeam.id || match.teamBId === selectedTeam.id) {
        const isWin = match.winnerId === selectedTeam.id;
        const opponentId = match.teamAId === selectedTeam.id ? match.teamBId : match.teamAId;
        const opponentTeam = teams[opponentId];
        const myScore = match.teamAId === selectedTeam.id ? (match.scoreA || 0) : (match.scoreB || 0);
        const oppScore = match.teamAId === selectedTeam.id ? (match.scoreB || 0) : (match.scoreA || 0);
        
        teamMatchHistory.push({
          matchId: match.id,
          friendlyName: getFriendlyMatchName(match),
          opponentName: opponentTeam?.name || "Opponent",
          opponentLogo: opponentTeam?.logo || teamLogoPlaceholder(opponentTeam?.name || "?", 32),
          isWin,
          myScore,
          oppScore,
          scheduledTime: match.scheduledTime
        });
      }
    });
    teamMatchHistory.sort((a, b) => new Date(b.scheduledTime) - new Date(a.scheduledTime));
  }

  return (
    <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1rem" }}>
      {/* Header section */}
      <div style={{ textAlign: "center", marginBottom: "3rem", position: "relative", paddingTop: "1.5rem" }}>
        <span className="hero-badge" style={{ backgroundColor: "rgba(245,176,65,0.08)", border: "1px solid var(--border-gold)", color: "var(--primary-gold)", textTransform: "uppercase", fontSize: "0.8rem", fontWeight: "700", padding: "0.3rem 1rem", borderRadius: "20px", display: "inline-block", marginBottom: "1rem" }}>Participating Teams</span>
        <h1 style={{ fontSize: "2.8rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem", background: "linear-gradient(to bottom, #FFFFFF, var(--primary-gold-bright))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Tournament Attendance</h1>
        <p style={{ color: "var(--text-muted)", maxWidth: "600px", margin: "0 auto", fontSize: "0.95rem", lineHeight: "1.6" }}>
          Browse all registered department teams, check their active summoner rosters, and follow their statistics throughout the cup.
        </p>

        {/* Group Filter Tabs */}
        <div style={{ display: "inline-flex", backgroundColor: "var(--bg-secondary)", padding: "4px", borderRadius: "30px", border: "1px solid var(--border-dark)", marginTop: "2rem" }}>
          {["all", "A", "B", "C"].map((group) => (
            <button
              key={group}
              className={`btn ${groupFilter === group ? "btn-primary" : ""}`}
              onClick={() => setGroupFilter(group)}
              style={{
                borderRadius: "20px",
                padding: "0.4rem 1.5rem",
                fontSize: "0.85rem",
                background: groupFilter === group ? "" : "transparent",
                border: "none",
                color: groupFilter === group ? "#000" : "var(--text-muted)",
                fontWeight: "bold",
              }}
            >
              {group === "all" ? "All Groups" : `Group ${group}`}
            </button>
          ))}
        </div>
      </div>

      {/* Main full-width grid of team cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "4rem" }}>
        {loading ? (
          <>
            <div className="skeleton" style={{ height: "100px", borderRadius: "8px" }}></div>
            <div className="skeleton" style={{ height: "100px", borderRadius: "8px" }}></div>
            <div className="skeleton" style={{ height: "100px", borderRadius: "8px" }}></div>
            <div className="skeleton" style={{ height: "100px", borderRadius: "8px" }}></div>
          </>
        ) : filteredTeams.length > 0 ? (
          filteredTeams.map((team) => {
            const wins = team.stats?.wins || 0;
            const losses = team.stats?.losses || 0;
            const totalGames = wins + losses;
            const winRatePercent = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
            const isSelected = selectedTeamId === team.id;

            return (
              <div
                key={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                className={`card esports-team-card ${isSelected ? "selected" : ""}`}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  padding: "1.25rem",
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  position: "relative",
                  overflow: "hidden",
                  backgroundColor: isSelected ? "rgba(245, 176, 65, 0.03)" : "var(--bg-secondary)",
                  border: isSelected ? "1px solid var(--primary-gold)" : "1px solid var(--border-dark)",
                  boxShadow: isSelected ? "0 4px 20px rgba(245, 176, 65, 0.1)" : "none",
                  transform: isSelected ? "translateY(-2px)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = "var(--border-gold-hover)";
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(245, 176, 65, 0.08)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = "var(--border-dark)";
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                {/* Team Portrait Background Watermark / Hover Graphic */}
                <div className="esports-team-card-bg">
                  <img
                    src={`/logos/${team.id}.png`}
                    alt=""
                    className="esports-team-card-img"
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem", zIndex: 1, marginBottom: "1rem" }}>
                  <img
                    src={team.logo || teamLogoPlaceholder(team.name, 48)}
                    alt={team.name}
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: isSelected ? "2px solid var(--primary-gold)" : "2px solid var(--border-dark)",
                      backgroundColor: "var(--bg-tertiary)"
                    }}
                  />
                  <div style={{ flex: 1, textAlign: "left", overflow: "hidden" }}>
                    <div style={{ fontWeight: "800", fontSize: "1.1rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: isSelected ? "var(--primary-gold-bright)" : "var(--text-primary)" }}>
                      {team.name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "bold" }}>
                      Group {team.group}
                    </div>
                  </div>
                </div>                {/* Stats Summary & Custom W/L Progress bar */}
                <div style={{ zIndex: 1, marginTop: "auto" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Win Rate: <strong>{winRatePercent}%</strong> ({wins}W-{losses}L)</span>
                  </div>
                  
                  <div style={{ width: "100%", height: "4px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                    <div 
                      style={{ 
                        width: `${winRatePercent}%`, 
                        height: "100%", 
                        backgroundColor: winRatePercent >= 50 ? "var(--primary-gold)" : "var(--primary-gold-dim)", 
                        borderRadius: "2px",
                        transition: "width 0.4s ease"
                      }} 
                    />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)", backgroundColor: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border-dark)" }}>
            No teams found matching the filters.
          </div>
        )}
      </div>

      {/* Expanded Team Modal - Restored and Beautifully Redesigned */}
      {selectedTeam && (
        <div 
          className="modal-overlay" 
          onClick={handleClose} 
          style={{ 
            position: "fixed", 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: "rgba(6, 6, 8, 0.85)", 
            zIndex: 100, 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center", 
            padding: "1.5rem", 
            backdropFilter: "blur(8px)" 
          }}
        >
          <div 
            className="card card-gold" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              width: "100%", 
              maxWidth: "850px", 
              maxHeight: "90vh", 
              overflowY: "auto", 
              padding: "2.5rem", 
              position: "relative",
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--primary-gold)",
              boxShadow: "0 8px 32px rgba(245, 176, 65, 0.15)"
            }}
          >
            {/* Header Roster details */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "2rem", borderBottom: "1px solid var(--border-dark)", paddingBottom: "1.5rem", marginBottom: "2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
                <img
                  src={selectedTeam.logo || teamLogoPlaceholder(selectedTeam.name, 150)}
                  alt={selectedTeam.name}
                  style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--primary-gold)", boxShadow: "0 0 15px rgba(245, 176, 65, 0.2)" }}
                />
                <div>
                  <h2 style={{ fontSize: "2rem", textTransform: "uppercase", margin: 0, color: "var(--primary-gold-bright)" }}>{selectedTeam.name}</h2>
                  <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                    <span className="hero-badge" style={{ margin: 0, fontSize: "0.75rem" }}>Group {selectedTeam.group} Standings</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleClose} 
                className="btn btn-outline" 
                style={{ padding: "0.4rem 1.2rem", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: "bold" }}
              >
                Close
              </button>
            </div>
            
            {/* Team Portrait Banner */}
            <div style={{
              position: "relative",
              width: "100%",
              height: "260px",
              background: "radial-gradient(circle at center, rgba(245, 176, 65, 0.12) 0%, rgba(10, 10, 12, 0.6) 100%)",
              border: "1px solid var(--border-dark)",
              borderRadius: "8px",
              overflow: "hidden",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-end",
              marginBottom: "2rem",
              boxShadow: "inset 0 0 20px rgba(0,0,0,0.8)"
            }}>
              {/* Scanline / Grid overlay */}
              <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: "linear-gradient(rgba(18, 18, 22, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 255, 255, 0.01) 1px, transparent 1px)",
                backgroundSize: "100% 4px, 20px 100%",
                zIndex: 1,
                pointerEvents: "none"
              }} />
              
              <img
                src={`/logos/${selectedTeam.id}.png`}
                alt={`${selectedTeam.name} team portrait`}
                style={{
                  maxHeight: "95%",
                  maxWidth: "95%",
                  objectFit: "contain",
                  zIndex: 2,
                  filter: "drop-shadow(0 0 20px rgba(245, 176, 65, 0.35))",
                }}
              />
            </div>

            {/* Inner Content Grid */}
            <div className="grid-2" style={{ gap: "2.5rem" }}>
              {/* Active Roster */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                  <h3 style={{ textTransform: "uppercase", fontSize: "1.1rem", margin: 0, color: "var(--primary-gold)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <LoLMinion size={18} /> Roster
                  </h3>
                  
                  {/* Toggle Real Name / IGN */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Show:</span>
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
                        Name
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
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(255,255,255,0.01)", padding: "1rem 1.25rem", borderRadius: "4px", border: "1px solid var(--border-dark)" }}
                      >
                        <Link 
                          href={`/players/${encodeURIComponent(player.name)}?backUrl=${encodeURIComponent(`/teams?teamId=${selectedTeamId}`)}`} 
                          style={{ fontWeight: "700", color: "var(--text-primary)", textDecoration: "none", borderBottom: "1px dashed var(--border-dark)", fontSize: "0.95rem" }}
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
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--primary-gold)", fontWeight: "600", backgroundColor: "rgba(245, 176, 65, 0.05)", padding: "0.25rem 0.75rem", borderRadius: "20px", border: "1px solid rgba(245, 176, 65, 0.15)" }}>
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
                  <CrossedSwords size={18} /> Statistics
                </h3>
                <div style={{ backgroundColor: "rgba(255,255,255,0.01)", border: "1px solid var(--border-dark)", borderRadius: "6px", padding: "1.5rem" }}>
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

                {/* Team Match History */}
                <h3 style={{ textTransform: "uppercase", fontSize: "1.1rem", marginTop: "2rem", marginBottom: "1.25rem", color: "var(--primary-gold)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <CrossedSwords size={18} /> Match History
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", overflowY: "auto", maxHeight: "250px", paddingRight: "0.25rem" }}>
                  {teamMatchHistory.length === 0 ? (
                    <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontStyle: "italic", backgroundColor: "rgba(255,255,255,0.01)", borderRadius: "6px", border: "1px solid var(--border-dark)", fontSize: "0.85rem" }}>
                      No matches recorded yet.
                    </div>
                  ) : (
                    teamMatchHistory.map((hist, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem",
                          backgroundColor: hist.isWin ? "rgba(0, 160, 100, 0.06)" : "rgba(200, 40, 40, 0.06)",
                          borderLeft: `4px solid ${hist.isWin ? "var(--color-success)" : "var(--color-danger)"}`,
                          borderRadius: "0 6px 6px 0",
                          border: "1px solid var(--border-dark)",
                          borderLeftWidth: "4px"
                        }}
                      >
                        <img src={hist.opponentLogo} alt={hist.opponentName} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", backgroundColor: "var(--bg-tertiary)" }}
                          onError={(e) => { e.target.src = teamLogoPlaceholder(hist.opponentName, 32); }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: hist.isWin ? "var(--color-success)" : "var(--color-danger)" }}>
                            {hist.isWin ? "VICTORY" : "DEFEAT"} &nbsp;&ndash;&nbsp; {hist.myScore} - {hist.oppScore}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                            {hist.friendlyName} · vs {hist.opponentName}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
