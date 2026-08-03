"use client";

import { Trophy, Swords, Zap } from "lucide-react";

export default function GrandFinalHeader({ match, matchDetails, team1, team2, winningTeamId }) {
  const team1Score = match?.scoreA ?? match?.team1Score ?? 0;
  const team2Score = match?.scoreB ?? match?.team2Score ?? 0;
  
  const isCompleted = match?.status === "completed" || match?.completed || Boolean(winningTeamId);
  const isTeam1Winner = winningTeamId === team1?.id || (isCompleted && team1Score > team2Score);
  const isTeam2Winner = winningTeamId === team2?.id || (isCompleted && team2Score > team1Score);

  const team1Players = getTeamPlayerListStructured(team1);
  const team2Players = getTeamPlayerListStructured(team2);

  const maxPlayers = Math.max(team1Players.length, team2Players.length, 5);
  const playerIndices = Array.from({ length: maxPlayers }, (_, i) => i);

  // Generate game-by-game breakdown sequence from matchDetails (OCR / score submission)
  const bestOf = match?.bestOf || 5;
  const gamesList = Array.isArray(matchDetails) ? matchDetails : [];

  const seriesGames = Array.from({ length: bestOf }, (_, i) => {
    const game = gamesList[i];
    if (game) {
      const winnerTeamId =
        game.winnerTeamId ||
        (game.teams?.[100]?.winner ? (game.blueTeamId || match?.teamAId) :
         game.teams?.[200]?.winner ? (game.redTeamId || match?.teamBId) : null);

      if (winnerTeamId && (winnerTeamId === team1?.id || winnerTeamId === match?.teamAId)) {
        return { winner: "team1" };
      } else if (winnerTeamId && (winnerTeamId === team2?.id || winnerTeamId === match?.teamBId)) {
        return { winner: "team2" };
      }
    }

    // Fallback if matchDetails array is partial or loading
    if (i < team1Score + team2Score) {
      if (i < team1Score) return { winner: "team1" };
      return { winner: "team2" };
    }

    return { winner: null };
  });

  return (
    <div
      className="card card-gold"
      style={{
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-gold)",
        boxShadow: "0 12px 40px rgba(0, 0, 0, 0.6)",
        borderRadius: "16px",
      }}
    >
      {/* Top Tournament Badge */}
      <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
        <span
          className="hero-badge"
          style={{
            backgroundColor: "rgba(245, 176, 65, 0.1)",
            border: "1px solid var(--border-gold)",
            color: "var(--primary-gold)",
            textTransform: "uppercase",
            fontSize: "0.8rem",
            fontWeight: "800",
            padding: "0.4rem 1.2rem",
            borderRadius: "20px",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            letterSpacing: "0.08em",
          }}
        >
          ARAM MAYHEM GRAND FINALS
        </span>
      </div>

      {/* Main Scoreboard Arena Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        {/* Team A Corner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.25rem",
            justifyContent: "flex-end",
            textAlign: "right",
          }}
        >
          <div>
            {isTeam1Winner && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  backgroundColor: "rgba(245, 176, 65, 0.2)",
                  border: "1px solid var(--primary-gold)",
                  padding: "0.2rem 0.65rem",
                  borderRadius: "12px",
                  fontSize: "0.7rem",
                  fontWeight: 900,
                  color: "var(--primary-gold-bright)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "0.4rem",
                  boxShadow: "0 0 12px rgba(245, 176, 65, 0.3)",
                }}
              >
                <Trophy size={13} style={{ color: "var(--primary-gold-bright)" }} /> CHAMPION
              </div>
            )}
            <h2 style={{ fontFamily: "var(--font-header)", fontSize: "1.6rem", color: isTeam1Winner ? "var(--primary-gold-bright)" : "var(--text-primary)", margin: 0 }}>
              {team1?.name || "Team A"}
            </h2>
            <span style={{ fontSize: "0.8rem", color: isTeam1Winner ? "var(--primary-gold)" : "var(--text-muted)", fontWeight: "700" }}>
              {team1?.tag ? `[${team1.tag}]` : "FINALIST"}
            </span>
          </div>

          <div
            style={{
              position: "relative",
              width: "76px",
              height: "76px",
              borderRadius: "14px",
              overflow: "hidden",
              border: isTeam1Winner ? "3px solid var(--primary-gold-bright)" : "2px solid var(--border-dark)",
              backgroundColor: "var(--bg-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: isTeam1Winner ? "0 0 25px rgba(245, 176, 65, 0.6), 0 0 50px rgba(245, 176, 65, 0.2)" : "none",
              flexShrink: 0,
            }}
          >
            {team1?.logo ? (
              <img src={team1.logo} alt={team1.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ fontWeight: 900, color: "var(--primary-gold)", fontSize: "1.2rem" }}>
                {team1?.name?.charAt(0) || "A"}
              </div>
            )}
          </div>
        </div>

        {/* Center Versus Score Display */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "0 1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              fontSize: "3rem",
              fontFamily: "var(--font-header)",
              fontWeight: 900,
              color: "var(--text-primary)",
              lineHeight: 1,
            }}
          >
            <span style={{ color: isTeam1Winner ? "var(--primary-gold-bright)" : "var(--text-primary)", textShadow: isTeam1Winner ? "0 0 15px rgba(245, 176, 65, 0.5)" : "none" }}>{team1Score}</span>
            <span style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>:</span>
            <span style={{ color: isTeam2Winner ? "var(--primary-gold-bright)" : "var(--text-primary)", textShadow: isTeam2Winner ? "0 0 15px rgba(245, 176, 65, 0.5)" : "none" }}>{team2Score}</span>
          </div>

          {/* Series Status Pill */}
          <div
            style={{
              marginTop: "0.5rem",
              padding: "0.25rem 0.75rem",
              borderRadius: "12px",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid var(--border-dark)",
              fontSize: "0.75rem",
              fontWeight: 800,
              color: "var(--primary-gold-bright)",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <Swords size={12} /> BEST OF 5 SERIES
          </div>
        </div>

        {/* Team B Corner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.25rem",
            justifyContent: "flex-start",
            textAlign: "left",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "76px",
              height: "76px",
              borderRadius: "14px",
              overflow: "hidden",
              border: isTeam2Winner ? "3px solid var(--primary-gold-bright)" : "2px solid var(--border-dark)",
              backgroundColor: "var(--bg-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: isTeam2Winner ? "0 0 25px rgba(245, 176, 65, 0.6), 0 0 50px rgba(245, 176, 65, 0.2)" : "none",
              flexShrink: 0,
            }}
          >
            {team2?.logo ? (
              <img src={team2.logo} alt={team2.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ fontWeight: 900, color: "var(--primary-gold)", fontSize: "1.2rem" }}>
                {team2?.name?.charAt(0) || "B"}
              </div>
            )}
          </div>

          <div>
            {isTeam2Winner && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  backgroundColor: "rgba(245, 176, 65, 0.2)",
                  border: "1px solid var(--primary-gold)",
                  padding: "0.2rem 0.65rem",
                  borderRadius: "12px",
                  fontSize: "0.7rem",
                  fontWeight: 900,
                  color: "var(--primary-gold-bright)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "0.4rem",
                  boxShadow: "0 0 12px rgba(245, 176, 65, 0.3)",
                }}
              >
                <Trophy size={13} style={{ color: "var(--primary-gold-bright)" }} /> CHAMPION
              </div>
            )}
            <h2 style={{ fontFamily: "var(--font-header)", fontSize: "1.6rem", color: isTeam2Winner ? "var(--primary-gold-bright)" : "var(--text-primary)", margin: 0 }}>
              {team2?.name || "Team B"}
            </h2>
            <span style={{ fontSize: "0.8rem", color: isTeam2Winner ? "var(--primary-gold)" : "var(--text-muted)", fontWeight: "700" }}>
              {team2?.tag ? `[${team2.tag}]` : "FINALIST"}
            </span>
          </div>
        </div>
      </div>

      {/* BO5 Game-by-Game Series Breakdown */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: "2rem",
          padding: "0.85rem 1.25rem",
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          borderRadius: "12px",
          border: "1px solid var(--border-dark)",
        }}
      >
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.6rem" }}>
          SERIES GAME BREAKDOWN (BEST OF 5)
        </span>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.6rem" }}>
          {seriesGames.map((game, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "8px",
                backgroundColor: game.winner === "team1"
                  ? "rgba(245, 176, 65, 0.15)"
                  : game.winner === "team2"
                  ? "rgba(203, 213, 225, 0.1)"
                  : "rgba(255, 255, 255, 0.03)",
                border: `1px solid ${
                  game.winner === "team1"
                    ? "var(--primary-gold)"
                    : game.winner === "team2"
                    ? "#94A3B8"
                    : "var(--border-dark)"
                }`,
              }}
            >
              <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)" }}>
                GAME {i + 1}:
              </span>
              <strong
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: game.winner === "team1"
                    ? "var(--primary-gold-bright)"
                    : game.winner === "team2"
                    ? "#E2E8F0"
                    : "var(--text-muted)",
                }}
              >
                {game.winner === "team1"
                  ? (team1?.name || "Team A").replace(/^TEAM\s+/i, "").replace(/^Team\s+/i, "")
                  : game.winner === "team2"
                  ? (team2?.name || "Team B").replace(/^TEAM\s+/i, "").replace(/^Team\s+/i, "")
                  : "UNPLAYED"}
              </strong>
            </div>
          ))}
        </div>
      </div>

      {/* Roster Matchup Comparison Grid */}
      <div
        style={{
          backgroundColor: "rgba(10, 10, 12, 0.85)",
          border: "1px solid var(--border-dark)",
          borderRadius: "12px",
          padding: "1.25rem",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <h3
            style={{
              fontFamily: "var(--font-header)",
              fontSize: "0.9rem",
              color: "var(--text-primary)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              margin: 0,
            }}
          >
            <Zap size={14} style={{ color: "var(--primary-gold)" }} /> ARAM MAYHEM ROSTERS MATCHUP
          </h3>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {playerIndices.map((idx) => {
            const p1 = team1Players[idx] || { ign: "-", realName: "" };
            const p2 = team2Players[idx] || { ign: "-", realName: "" };

            return (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto 1fr",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.65rem 1rem",
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  borderRadius: "8px",
                }}
              >
                {/* Left Team Player Card */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#FFFFFF", fontFamily: "var(--font-family)", letterSpacing: "0.02em" }}>
                    {p1.realName || p1.ign}
                  </span>
                  {p1.realName && p1.ign && (
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--primary-gold)", marginTop: "0.1rem" }}>
                      ({p1.ign})
                    </span>
                  )}
                </div>

                {/* Matchup Index Pill */}
                <div
                  style={{
                    padding: "0.25rem 0.65rem",
                    borderRadius: "6px",
                    backgroundColor: "rgba(26, 26, 34, 0.9)",
                    border: "1px solid var(--border-gold)",
                    color: "var(--primary-gold)",
                    fontSize: "0.7rem",
                    fontWeight: "800",
                    letterSpacing: "0.05em",
                    whiteSpace: "nowrap",
                  }}
                >
                  ⚔️ PLAYER #{idx + 1}
                </div>

                {/* Right Team Player Card */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", textAlign: "right" }}>
                  <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#FFFFFF", fontFamily: "var(--font-family)", letterSpacing: "0.02em" }}>
                    {p2.realName || p2.ign}
                  </span>
                  {p2.realName && p2.ign && (
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--primary-gold)", marginTop: "0.1rem" }}>
                      ({p2.ign})
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function parsePlayerData(p) {
  if (!p) return { ign: "-", realName: "" };
  if (typeof p === "string") {
    const match = p.match(/^([^(]+)(?:\(([^)]+)\))?/);
    if (match) {
      return {
        ign: match[1].trim(),
        realName: match[2] ? match[2].trim() : ""
      };
    }
    return { ign: p, realName: "" };
  }
  const ign = p.ign || p.riotId || p.playerName || p.name || "Player";
  const realName = p.realName || p.name || "";
  return { ign, realName };
}

function getTeamPlayerListStructured(team) {
  if (!team) return [];
  if (Array.isArray(team.players) && team.players.length > 0) {
    return team.players.map(parsePlayerData);
  }
  if (team.roster && typeof team.roster === "object") {
    return Object.values(team.roster).map(parsePlayerData);
  }
  return [];
}
