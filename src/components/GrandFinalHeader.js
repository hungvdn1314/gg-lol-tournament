"use client";

import { Trophy, Swords, Zap } from "lucide-react";

export default function GrandFinalHeader({ match, team1, team2, winningTeamId }) {
  const team1Score = match?.scoreA ?? match?.team1Score ?? 0;
  const team2Score = match?.scoreB ?? match?.team2Score ?? 0;
  
  const isTeam1Winner = winningTeamId === team1?.id || (match?.completed && team1Score > team2Score);
  const isTeam2Winner = winningTeamId === team2?.id || (match?.completed && team2Score > team1Score);

  const bo5Games = [1, 2, 3, 4, 5];

  const team1Players = getTeamPlayerList(team1);
  const team2Players = getTeamPlayerList(team2);

  return (
    <div
      className="card card-gold"
      style={{
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-gold)",
        boxShadow: "0 8px 32px rgba(245, 176, 65, 0.15)",
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
          <Trophy size={14} /> ARAM MAYHEM GRAND FINALS <Trophy size={14} />
        </span>
      </div>

      {/* Main Clash Scoreboard */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: "1.5rem",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        {/* Team A */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "1.5rem",
            borderRadius: "12px",
            backgroundColor: isTeam1Winner ? "rgba(245, 176, 65, 0.08)" : "rgba(255, 255, 255, 0.02)",
            border: isTeam1Winner ? "1px solid var(--primary-gold)" : "1px solid var(--border-dark)",
            boxShadow: isTeam1Winner ? "0 4px 20px rgba(245, 176, 65, 0.2)" : "none",
            position: "relative",
          }}
        >
          {isTeam1Winner && (
            <span
              style={{
                position: "absolute",
                top: "-12px",
                backgroundColor: "var(--primary-gold)",
                color: "#0A0A0C",
                fontFamily: "var(--font-header)",
                fontSize: "0.7rem",
                fontWeight: "900",
                padding: "0.2rem 0.75rem",
                borderRadius: "10px",
                letterSpacing: "0.1em",
              }}
            >
              CHAMPION
            </span>
          )}

          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--bg-primary)",
              border: "2px solid var(--border-gold)",
              marginBottom: "0.75rem",
            }}
          >
            {team1?.logo ? (
              <img src={team1.logo} alt={team1.name} style={{ maxWidth: "85%", maxHeight: "85%", objectFit: "contain" }} />
            ) : (
              <span style={{ fontFamily: "var(--font-header)", fontSize: "1.4rem", color: "var(--primary-gold)", fontWeight: "900" }}>
                {team1?.tag || team1?.name?.substring(0, 3) || "T1"}
              </span>
            )}
          </div>
          <h2 style={{ fontFamily: "var(--font-header)", fontSize: "1.3rem", color: "var(--text-primary)", margin: 0, textTransform: "uppercase", textAlign: "center" }}>
            {team1?.name || "Team A"}
          </h2>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            {team1?.tag ? `[${team1.tag}]` : "Finalist"}
          </span>
        </div>

        {/* Center VS & Score */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "var(--primary-gold)", fontWeight: "900", fontSize: "0.85rem", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
            <Swords size={16} /> VS
          </div>

          <div style={{ fontFamily: "var(--font-header)", fontSize: "3rem", fontWeight: "900", lineHeight: "1", marginBottom: "0.5rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <span style={{ color: team1Score > team2Score ? "var(--primary-gold-bright)" : "var(--text-primary)" }}>{team1Score}</span>
            <span style={{ color: "var(--text-muted)" }}>:</span>
            <span style={{ color: team2Score > team1Score ? "var(--primary-gold-bright)" : "var(--text-primary)" }}>{team2Score}</span>
          </div>

          <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
            BEST OF 5 · ARAM MAYHEM
          </span>

          {/* Series Game Tracker */}
          <div style={{ display: "flex", gap: "0.35rem" }}>
            {bo5Games.map((gNum) => {
              const played = team1Score + team2Score >= gNum;
              const isT1Win = played && gNum <= team1Score;
              const isT2Win = played && gNum > team1Score && gNum <= team1Score + team2Score;

              return (
                <div
                  key={gNum}
                  style={{
                    width: "28px",
                    height: "24px",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                    fontWeight: "800",
                    border: "1px solid var(--border-dark)",
                    backgroundColor: isT1Win ? "rgba(245, 176, 65, 0.25)" : isT2Win ? "rgba(59, 130, 246, 0.25)" : "rgba(255,255,255,0.03)",
                    borderColor: isT1Win ? "var(--primary-gold)" : isT2Win ? "#3b82f6" : "var(--border-dark)",
                    color: isT1Win ? "var(--primary-gold-bright)" : isT2Win ? "#93c5fd" : "var(--text-muted)",
                  }}
                  title={`Game ${gNum}`}
                >
                  G{gNum}
                </div>
              );
            })}
          </div>
        </div>

        {/* Team B */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "1.5rem",
            borderRadius: "12px",
            backgroundColor: isTeam2Winner ? "rgba(245, 176, 65, 0.08)" : "rgba(255, 255, 255, 0.02)",
            border: isTeam2Winner ? "1px solid var(--primary-gold)" : "1px solid var(--border-dark)",
            boxShadow: isTeam2Winner ? "0 4px 20px rgba(245, 176, 65, 0.2)" : "none",
            position: "relative",
          }}
        >
          {isTeam2Winner && (
            <span
              style={{
                position: "absolute",
                top: "-12px",
                backgroundColor: "var(--primary-gold)",
                color: "#0A0A0C",
                fontFamily: "var(--font-header)",
                fontSize: "0.7rem",
                fontWeight: "900",
                padding: "0.2rem 0.75rem",
                borderRadius: "10px",
                letterSpacing: "0.1em",
              }}
            >
              CHAMPION
            </span>
          )}

          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--bg-primary)",
              border: "2px solid var(--border-gold)",
              marginBottom: "0.75rem",
            }}
          >
            {team2?.logo ? (
              <img src={team2.logo} alt={team2.name} style={{ maxWidth: "85%", maxHeight: "85%", objectFit: "contain" }} />
            ) : (
              <span style={{ fontFamily: "var(--font-header)", fontSize: "1.4rem", color: "var(--primary-gold)", fontWeight: "900" }}>
                {team2?.tag || team2?.name?.substring(0, 3) || "T2"}
              </span>
            )}
          </div>
          <h2 style={{ fontFamily: "var(--font-header)", fontSize: "1.3rem", color: "var(--text-primary)", margin: 0, textTransform: "uppercase", textAlign: "center" }}>
            {team2?.name || "Team B"}
          </h2>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            {team2?.tag ? `[${team2.tag}]` : "Finalist"}
          </span>
        </div>
      </div>

      {/* 5v5 ARAM MAYHEM Roster Comparison */}
      <div
        style={{
          backgroundColor: "rgba(10, 10, 12, 0.8)",
          border: "1px solid var(--border-dark)",
          borderRadius: "10px",
          padding: "1rem 1.25rem",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "0.75rem" }}>
          <h3
            style={{
              fontFamily: "var(--font-header)",
              fontSize: "0.85rem",
              color: "var(--text-primary)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              margin: 0,
            }}
          >
            <Zap size={14} style={{ color: "var(--primary-gold)" }} /> 5v5 ARAM MAYHEM ROSTERS
          </h3>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[0, 1, 2, 3, 4].map((idx) => {
            const p1 = team1Players[idx] || "-";
            const p2 = team2Players[idx] || "-";

            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.5rem 1rem",
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.04)",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                }}
              >
                <div style={{ flex: 1, textAlign: "left", fontWeight: "700", color: "var(--primary-gold-bright)" }}>
                  {p1}
                </div>
                <div
                  style={{
                    padding: "0.2rem 0.6rem",
                    borderRadius: "4px",
                    backgroundColor: "rgba(26, 26, 34, 0.9)",
                    border: "1px solid var(--border-gold)",
                    color: "var(--primary-gold)",
                    fontSize: "0.7rem",
                    fontWeight: "800",
                    letterSpacing: "0.05em",
                  }}
                >
                  ⚔️ ARAM #{idx + 1}
                </div>
                <div style={{ flex: 1, textAlign: "right", fontWeight: "700", color: "var(--primary-gold-bright)" }}>
                  {p2}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getTeamPlayerList(team) {
  if (!team) return [];
  if (Array.isArray(team.players) && team.players.length > 0) {
    return team.players.map((p) => (typeof p === "string" ? p : p.name || p.ign || p.riotId || "Player"));
  }
  if (team.roster && typeof team.roster === "object") {
    return Object.values(team.roster).map((val) => (typeof val === "string" ? val : val.name || val.ign || "Player"));
  }
  return [];
}
