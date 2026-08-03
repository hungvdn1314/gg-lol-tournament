"use client";

import { useState, useEffect } from "react";
import { Award, CheckCircle2, Lock, Sparkles, Trophy, BarChart2, Crown, Flame, TrendingUp, Zap } from "lucide-react";
import { submitMvpVote } from "@/lib/db";
import PlayerSignature from "@/components/PlayerSignature";
import GoldParticleCanvas from "@/components/GoldParticleCanvas";

export default function MvpVoting({ winningTeam, isVotingOpen, isVotingFinished, votes = {} }) {
  const [votedPlayerId, setVotedPlayerId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Real-time rank position tracking for overtake FX
  const [prevRanks, setPrevRanks] = useState({});
  const [rankChanges, setRankChanges] = useState({});
  const [overtakeMsg, setOvertakeMsg] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("gg_lol_mvp_voted_player");
    if (saved) {
      setVotedPlayerId(saved);
    }
  }, []);

  const candidates = getRosterCandidates(winningTeam);
  const totalVotes = candidates.reduce((sum, c) => sum + getVotesForCandidate(c, votes), 0);

  // Sorted candidates by votes descending for live ranking chart
  const rankedCandidates = [...candidates].sort((a, b) => getVotesForCandidate(b, votes) - getVotesForCandidate(a, votes));
  const leaderCandidate = rankedCandidates[0] || null;

  // Rank Overtake & Position Change Effect Trigger
  useEffect(() => {
    if (rankedCandidates.length === 0) return;

    const currentRankMap = {};
    rankedCandidates.forEach((c, idx) => {
      currentRankMap[c.id] = idx;
    });

    if (Object.keys(prevRanks).length > 0) {
      const changes = {};
      let overtaker = null;

      rankedCandidates.forEach((c, idx) => {
        const oldRank = prevRanks[c.id];
        if (oldRank !== undefined && oldRank !== idx) {
          if (idx < oldRank) {
            changes[c.id] = "UP";
            if (idx === 0) overtaker = c;
          } else {
            changes[c.id] = "DOWN";
          }
        }
      });

      if (Object.keys(changes).length > 0) {
        setRankChanges(changes);
        if (overtaker) {
          setOvertakeMsg(`⚡ NEW VOTE LEADER: ${overtaker.realName || overtaker.ign} (${overtaker.ign}) OVERTOOK 1ST PLACE!`);
          setTimeout(() => setOvertakeMsg(null), 4000);
        }
        setTimeout(() => setRankChanges({}), 3500);
      }
    }

    setPrevRanks(currentRankMap);
  }, [votes]);

  const handleVote = async (playerId) => {
    // Production Guard: 1 vote per device & must be open
    if (!isVotingOpen || votedPlayerId || submitting) return;
    setSubmitting(true);
    try {
      await submitMvpVote(playerId);
      setVotedPlayerId(playerId);
      setShowConfetti(false);
      setTimeout(() => setShowConfetti(true), 10);
      if (typeof window !== "undefined") {
        localStorage.setItem("gg_lol_mvp_voted_player", playerId);
      }
      setTimeout(() => setShowConfetti(false), 2500);
    } catch (e) {
      console.error("Error submitting MVP vote:", e);
      alert("Vote failed — please try again. Error: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // State 1: No Champion declared yet
  if (!winningTeam) {
    return (
      <div
        className="card card-gold metallic-sheen-card"
        style={{
          padding: "3rem 2rem",
          textAlign: "center",
          backgroundColor: "var(--bg-secondary)",
          borderColor: "var(--border-dark)",
          borderRadius: "16px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <GoldParticleCanvas />
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: "rgba(245, 176, 65, 0.08)",
            border: "1px solid var(--border-gold)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.25rem auto",
            position: "relative",
            zIndex: 2,
          }}
        >
          <Lock size={28} style={{ color: "var(--primary-gold)" }} />
        </div>
        <h3 style={{ fontFamily: "var(--font-header)", fontSize: "1.3rem", color: "var(--text-primary)", marginBottom: "0.5rem", textTransform: "uppercase", position: "relative", zIndex: 2 }}>
          FINALS MVP FAN VOTE LOCKED
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", maxWidth: "500px", margin: "0 auto 1.5rem auto", lineHeight: "1.6", position: "relative", zIndex: 2 }}>
          Voting will be unlocked by tournament officials once the Grand Final champion team is declared. Check back during the live broadcast!
        </p>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.35rem 1rem",
            borderRadius: "20px",
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid var(--border-dark)",
            color: "var(--text-muted)",
            fontSize: "0.8rem",
            fontWeight: 700,
            position: "relative",
            zIndex: 2,
          }}
        >
          <Flame size={14} style={{ color: "var(--primary-gold)" }} /> ARAM MAYHEM CHAMPIONSHIP MVP
        </div>
      </div>
    );
  }

  return (
    <div
      className="card card-gold metallic-sheen-card"
      style={{
        padding: "2rem",
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-gold)",
        borderRadius: "16px",
        boxShadow: "0 12px 40px rgba(245, 176, 65, 0.12)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <GoldParticleCanvas />

      {/* Confetti Explosion FX */}
      {showConfetti && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 99 }}>
          {Array.from({ length: 35 }).map((_, i) => {
            const tx = (Math.random() - 0.5) * 500;
            const ty = -100 - Math.random() * 250;
            const tr = Math.random() * 720;
            const bgColors = ["#F5B041", "#FFE082", "#34D399", "#D68910", "#FFFFFF"];
            const bg = bgColors[i % bgColors.length];

            return (
              <div
                key={i}
                className="confetti-piece"
                style={{
                  left: `${15 + Math.random() * 70}%`,
                  top: "35%",
                  backgroundColor: bg,
                  borderRadius: i % 2 === 0 ? "50%" : "2px",
                  width: `${6 + Math.random() * 8}px`,
                  height: `${8 + Math.random() * 10}px`,
                  "--tx": `${tx}px`,
                  "--ty": `${ty}px`,
                  "--tr": `${tr}deg`,
                  animationDelay: `${Math.random() * 0.2}s`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.75rem",
          paddingBottom: "1.25rem",
          borderBottom: "1px solid var(--border-dark)",
          flexWrap: "wrap",
          gap: "1rem",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "12px",
              backgroundColor: "rgba(245, 176, 65, 0.12)",
              border: "2px solid var(--border-gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 15px rgba(245, 176, 65, 0.2)",
            }}
          >
            <Award size={26} style={{ color: "var(--primary-gold)" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              <h3 style={{ fontFamily: "var(--font-header)", fontSize: "1.2rem", color: "var(--text-primary)", margin: 0, textTransform: "uppercase" }}>
                FINALS MVP FAN VOTE
              </h3>
              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "0.2rem 0.65rem",
                  borderRadius: "6px",
                  backgroundColor: "rgba(245, 176, 65, 0.15)",
                  border: "1px solid var(--border-gold)",
                  color: "var(--primary-gold-bright)",
                  fontWeight: 800,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <Trophy size={12} /> CHAMPION: {winningTeam.name}
              </span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.25rem 0 0 0" }}>
              {isVotingFinished
                ? "Official MVP voting has concluded. Crown winner highlighted below!"
                : isVotingOpen
                ? "Cast your vote for the most valuable player of the winning team!"
                : "Voting status is currently in standby mode."}
            </p>
          </div>
        </div>

        {/* Right Header: Status Badge & Total Vote Pill */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {isVotingOpen ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.35rem 0.85rem",
                borderRadius: "20px",
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                color: "#34d399",
                fontSize: "0.75rem",
                fontWeight: 800,
              }}
            >
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981", boxShadow: "0 0 8px #10b981" }} />
              VOTING OPEN
            </span>
          ) : (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.35rem 0.85rem",
                borderRadius: "20px",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-dark)",
                color: "var(--text-muted)",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              {isVotingFinished ? "VOTING CLOSED" : "VOTING STANDBY"}
            </span>
          )}

          <div
            style={{
              padding: "0.35rem 0.85rem",
              borderRadius: "20px",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-dark)",
              color: "var(--text-secondary)",
              fontSize: "0.8rem",
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <BarChart2 size={14} style={{ color: "var(--primary-gold)" }} />
            <span>{totalVotes} Total Votes</span>
          </div>
        </div>
      </div>

      {/* Rank Overtake Announcement Flash Banner */}
      {overtakeMsg && (
        <div
          style={{
            padding: "0.85rem 1.25rem",
            borderRadius: "10px",
            backgroundColor: "rgba(245, 176, 65, 0.18)",
            border: "2px solid var(--primary-gold)",
            color: "var(--primary-gold-bright)",
            fontFamily: "var(--font-header)",
            fontSize: "0.95rem",
            textAlign: "center",
            marginBottom: "1.5rem",
            boxShadow: "0 0 25px rgba(245, 176, 65, 0.3)",
            position: "relative",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          <Zap size={18} style={{ color: "var(--primary-gold)" }} />
          <span>{overtakeMsg}</span>
          <Zap size={18} style={{ color: "var(--primary-gold)" }} />
        </div>
      )}

      {/* Broadcast-Quality Live Leaderboard Standings */}
      {candidates.length > 0 && (
        <div
          style={{
            backgroundColor: "rgba(10, 10, 12, 0.85)",
            border: "1px solid var(--border-dark)",
            borderRadius: "16px",
            padding: "1.75rem",
            marginBottom: "2.5rem",
            position: "relative",
            zIndex: 2,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <h4
              style={{
                fontFamily: "var(--font-header)",
                fontSize: "1.05rem",
                color: "var(--text-primary)",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <Crown size={20} style={{ color: "var(--primary-gold)" }} /> LIVE MVP VOTING STANDINGS
            </h4>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 700 }}>
              Real-time Vote Percentages & Rankings
            </span>
          </div>

          {/* Ranked Progress Bar Rows List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {rankedCandidates.map((candidate, rankIdx) => {
              const pVotes = getVotesForCandidate(candidate, votes);
              const pct = totalVotes > 0 ? Math.round((pVotes / totalVotes) * 100) : 0;
              const is1st = rankIdx === 0 && totalVotes > 0;
              const is2nd = rankIdx === 1;
              const is3rd = rankIdx === 2;
              const rankChange = rankChanges[candidate.id];

              const rankBadges = [
                { color: "#0A0A0C", bg: "linear-gradient(135deg, #FFE082, #F5B041)", border: "var(--primary-gold)", icon: "🥇" },
                { color: "#0F172A", bg: "linear-gradient(135deg, #FFFFFF, #CBD5E1)", border: "#94A3B8", icon: "🥈" },
                { color: "#FFFFFF", bg: "linear-gradient(135deg, #D97706, #78350F)", border: "#D97706", icon: "🥉" },
              ];

              const badge = rankBadges[rankIdx] || { color: "var(--text-muted)", bg: "rgba(255,255,255,0.05)", border: "var(--border-dark)", icon: "" };

              return (
                <div
                  key={candidate.id}
                  className={is1st ? "gold-pulse-aura" : ""}
                  style={{
                    backgroundColor: is1st
                      ? "rgba(245, 176, 65, 0.08)"
                      : "rgba(255, 255, 255, 0.02)",
                    border: is1st
                      ? "2px solid var(--primary-gold)"
                      : "1px solid var(--border-dark)",
                    borderRadius: "12px",
                    padding: "0.9rem 1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "1.25rem",
                    position: "relative",
                    transition: "all 0.3s ease",
                  }}
                >
                  {/* Rank Badge Emblem */}
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: badge.bg,
                      border: `1px solid ${badge.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: is1st ? "0 0 15px rgba(245, 176, 65, 0.4)" : "none",
                    }}
                  >
                    <span style={{ fontSize: badge.icon ? "1.4rem" : "0.95rem", fontFamily: badge.icon ? "inherit" : "var(--font-header)", fontWeight: 900, color: badge.color, lineHeight: 1 }}>
                      {badge.icon || `#${rankIdx + 1}`}
                    </span>
                  </div>

                  {/* Player Avatar / Signature */}
                  <div style={{ flexShrink: 0 }}>
                    {candidate.avatar ? (
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "10px",
                          overflow: "hidden",
                          border: `2px solid ${badge.border}`,
                        }}
                      >
                        <img src={candidate.avatar} alt={candidate.ign} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    ) : (
                      <PlayerSignature name={candidate.realName} size={48} />
                    )}
                  </div>

                  {/* Player Details & Progress Meter */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.35rem", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <strong style={{ fontFamily: "var(--font-family), sans-serif", fontSize: "1.05rem", color: "#fff", fontWeight: 800 }}>
                          {candidate.realName || candidate.ign}
                        </strong>
                        {candidate.realName && candidate.ign && (
                          <span style={{ fontSize: "0.85rem", color: "var(--primary-gold-bright)", fontWeight: 600 }}>
                            ({candidate.ign}{candidate.riotTag ? ` ${candidate.riotTag}` : ""})
                          </span>
                        )}

                        {rankChange === "UP" && (
                          <span
                            style={{
                              backgroundColor: "#10b981",
                              color: "#0a0a0c",
                              fontSize: "0.65rem",
                              fontWeight: 900,
                              padding: "2px 6px",
                              borderRadius: "4px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "2px",
                            }}
                          >
                            <TrendingUp size={10} /> CLIMBED!
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span style={{ fontFamily: "var(--font-header)", fontSize: "1.15rem", color: is1st ? "var(--primary-gold)" : "#fff", fontWeight: 900 }}>
                          {pct}%
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
                          {pVotes} votes
                        </span>
                      </div>
                    </div>

                    {/* Animated Progress Bar */}
                    <div style={{ width: "100%", height: "8px", backgroundColor: "rgba(255, 255, 255, 0.08)", borderRadius: "4px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: is1st
                            ? "linear-gradient(90deg, #F5B041 0%, #FFE082 100%)"
                            : is2nd
                            ? "linear-gradient(90deg, #94A3B8 0%, #CBD5E1 100%)"
                            : is3rd
                            ? "linear-gradient(90deg, #78350F 0%, #D97706 100%)"
                            : "rgba(245, 176, 65, 0.4)",
                          borderRadius: "4px",
                          transition: "width 0.6s ease",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Roster Voting Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "1.25rem", position: "relative", zIndex: 2 }}>
        {candidates.map((candidate) => {
          const pVotes = getVotesForCandidate(candidate, votes);
          const percentage = totalVotes > 0 ? Math.round((pVotes / totalVotes) * 100) : 0;
          const isUserVotedThis = votedPlayerId && (
            votedPlayerId === candidate.id ||
            sanitizeCandidateId(votedPlayerId) === candidate.id ||
            votedPlayerId === candidate.realName ||
            votedPlayerId === candidate.ign
          );
          const isCurrentLeader = leaderCandidate?.id === candidate.id && totalVotes > 0;
          const rankChange = rankChanges[candidate.id];

          return (
            <div
              key={candidate.id}
              className={isCurrentLeader ? "gold-pulse-aura" : ""}
              style={{
                position: "relative",
                backgroundColor: isUserVotedThis
                  ? "rgba(16, 185, 129, 0.06)"
                  : isCurrentLeader
                  ? "rgba(245, 176, 65, 0.06)"
                  : "rgba(255, 255, 255, 0.02)",
                border: isUserVotedThis
                  ? "2px solid #10b981"
                  : isCurrentLeader
                  ? "2px solid var(--primary-gold)"
                  : "1px solid var(--border-dark)",
                borderRadius: "12px",
                padding: "1.5rem 1.25rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                transition: "all 0.25s ease",
              }}
            >
              {/* Rank Change Indicator */}
              {rankChange === "UP" && (
                <span
                  style={{
                    position: "absolute",
                    top: "8px",
                    left: "8px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px",
                    fontSize: "0.65rem",
                    fontWeight: 900,
                    color: "#10b981",
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  <TrendingUp size={10} /> UP!
                </span>
              )}

              {/* Voted Badge */}
              {isUserVotedThis && (
                <span
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px",
                    fontSize: "0.65rem",
                    fontWeight: 900,
                    color: "#34d399",
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                  }}
                >
                  <CheckCircle2 size={11} /> VOTED
                </span>
              )}

              {isCurrentLeader && !isUserVotedThis && (
                <span
                  style={{
                    position: "absolute",
                    top: "-12px",
                    backgroundColor: "var(--primary-gold)",
                    color: "#0A0A0C",
                    fontSize: "0.65rem",
                    fontFamily: "var(--font-header)",
                    fontWeight: 900,
                    padding: "3px 10px",
                    borderRadius: "8px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    letterSpacing: "0.05em",
                    boxShadow: "0 2px 8px rgba(245, 176, 65, 0.4)",
                  }}
                >
                  <Crown size={11} /> {isVotingFinished ? "FINALS MVP" : "VOTE LEADER"}
                </span>
              )}

              {/* Player Avatar or Signature */}
              <div style={{ marginBottom: "0.85rem" }}>
                {candidate.avatar ? (
                  <div
                    style={{
                      width: "68px",
                      height: "68px",
                      borderRadius: "14px",
                      overflow: "hidden",
                      backgroundColor: "var(--bg-primary)",
                      border: isCurrentLeader ? "2px solid var(--primary-gold)" : "2px solid var(--border-dark)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img src={candidate.avatar} alt={candidate.ign} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ) : (
                  <PlayerSignature name={candidate.realName} size={68} />
                )}
              </div>

              {/* Dual Name Display: Real Name (Primary) + IGN (Secondary) */}
              <h4 style={{ fontFamily: "var(--font-family), sans-serif", fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 2px 0" }}>
                {candidate.realName || candidate.ign}
              </h4>

              {candidate.realName && candidate.ign && (
                <div style={{ fontSize: "0.82rem", color: "var(--primary-gold-bright)", fontWeight: 700, marginBottom: "0.35rem" }}>
                  ({candidate.ign}{candidate.riotTag ? ` ${candidate.riotTag}` : ""})
                </div>
              )}

              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "1rem" }}>
                ARAM MAYHEM STARTER
              </span>

              {/* Vote Button or Real-time Progress Bar */}
              {isVotingOpen && !votedPlayerId && !isVotingFinished ? (
                <button
                  onClick={() => handleVote(candidate.id)}
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    fontSize: "0.8rem",
                    fontWeight: 900,
                    letterSpacing: "0.05em",
                    marginTop: "auto",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                    cursor: "pointer",
                  }}
                >
                  <Sparkles size={14} /> {submitting ? "Casting Vote..." : "VOTE MVP"}
                </button>
              ) : (
                <div style={{ width: "100%", marginTop: "auto", paddingTop: "0.5rem" }}>
                  <div style={{ width: "100%", height: "8px", backgroundColor: "rgba(255, 255, 255, 0.08)", borderRadius: "4px", overflow: "hidden", marginBottom: "6px" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${percentage}%`,
                        backgroundColor: isCurrentLeader ? "var(--primary-gold)" : "rgba(245, 176, 65, 0.6)",
                        borderRadius: "4px",
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                    <span style={{ color: "var(--primary-gold-bright)", fontWeight: 900 }}>{percentage}%</span>
                    <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{pVotes} votes</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function sanitizeCandidateId(rawId, teamId = "", idx = 0) {
  const base = rawId ? String(rawId).trim() : `${teamId}_p${idx}`;
  return base.replace(/[.#$\[\]\/\s]+/g, "_");
}

function getVotesForCandidate(candidate, votes) {
  if (!votes || !candidate) return 0;
  const cId = candidate.id;
  if (votes[cId] !== undefined) return Number(votes[cId]) || 0;
  const cleanReal = candidate.realName ? sanitizeCandidateId(candidate.realName) : "";
  const cleanIgn = candidate.ign ? sanitizeCandidateId(candidate.ign) : "";

  for (const [key, val] of Object.entries(votes)) {
    const cleanKey = String(key).trim().replace(/[.#$\[\]\/\s]+/g, "_");
    if (
      cleanKey === cId ||
      key === candidate.realName ||
      key === candidate.ign ||
      (cleanReal && cleanKey === cleanReal) ||
      (cleanIgn && cleanKey === cleanIgn)
    ) {
      return Number(val) || 0;
    }
  }
  return 0;
}

function getRosterCandidates(team) {
  if (!team) return [];
  
  if (Array.isArray(team.players) && team.players.length > 0) {
    return team.players.map((p, idx) => {
      const realName = typeof p === "string" ? p : p.name || p.ign || `Player ${idx + 1}`;
      let ign = typeof p === "string" ? p : p.ign || p.riotId || p.name || `Player ${idx + 1}`;
      let riotTag = "";
      if (ign.includes("#")) {
        const parts = ign.split("#");
        ign = parts[0];
        riotTag = `#${parts[1]}`;
      } else if (typeof p === "object" && p.riotId && p.riotId.includes("#")) {
        riotTag = `#${p.riotId.split("#")[1]}`;
      }

      const rawId = typeof p === "string" ? `${team.id}_${idx}` : p.id || p.name || p.ign || `p_${idx}`;

      return {
        id: sanitizeCandidateId(rawId, team.id, idx),
        realName: realName,
        ign: ign,
        riotTag: riotTag,
        avatar: typeof p === "object" ? p.avatar || p.image : null,
      };
    });
  }

  if (team.roster && typeof team.roster === "object") {
    return Object.entries(team.roster).map(([key, val], idx) => {
      const realName = typeof val === "string" ? val : val.name || val.ign || `Player ${idx + 1}`;
      let ign = typeof val === "string" ? val : val.ign || val.riotId || val.name || `Player ${idx + 1}`;
      let riotTag = "";
      if (ign.includes("#")) {
        const parts = ign.split("#");
        ign = parts[0];
        riotTag = `#${parts[1]}`;
      }

      const rawId = typeof val === "string" ? `${team.id}_${idx}` : val.id || val.ign || `p_${idx}`;

      return {
        id: sanitizeCandidateId(rawId, team.id, idx),
        realName: realName,
        ign: ign,
        riotTag: riotTag,
        avatar: typeof val === "object" ? val.avatar || val.image : null,
      };
    });
  }

  return [
    { id: sanitizeCandidateId(`${team.id}_1`, team.id, 1), realName: `${team.name} Player 1`, ign: "Player1", riotTag: "#VN1", avatar: null },
    { id: sanitizeCandidateId(`${team.id}_2`, team.id, 2), realName: `${team.name} Player 2`, ign: "Player2", riotTag: "#VN1", avatar: null },
    { id: sanitizeCandidateId(`${team.id}_3`, team.id, 3), realName: `${team.name} Player 3`, ign: "Player3", riotTag: "#VN1", avatar: null },
    { id: sanitizeCandidateId(`${team.id}_4`, team.id, 4), realName: `${team.name} Player 4`, ign: "Player4", riotTag: "#VN1", avatar: null },
    { id: sanitizeCandidateId(`${team.id}_5`, team.id, 5), realName: `${team.name} Player 5`, ign: "Player5", riotTag: "#VN1", avatar: null },
  ];
}
