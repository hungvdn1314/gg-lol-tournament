"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Tv, Award, Lock } from "lucide-react";
import { subscribeToData, subscribeToGrandFinalConfig, subscribeToMvpVotes, subscribeToMatchDetails } from "@/lib/db";
import GrandFinalHeader from "@/components/GrandFinalHeader";
import LivestreamPlayer from "@/components/LivestreamPlayer";
import MvpVoting from "@/components/MvpVoting";

export default function GrandFinalPage() {
  const [config, setConfig] = useState(null);
  const [matches, setMatches] = useState({});
  const [teams, setTeams] = useState({});
  const [gfConfig, setGfConfig] = useState({});
  const [mvpVotes, setMvpVotes] = useState({});
  const [matchDetails, setMatchDetails] = useState(null);

  useEffect(() => {
    const unsubConfig = subscribeToData("config", setConfig);
    const unsubMatches = subscribeToData("matches", setMatches);
    const unsubTeams = subscribeToData("teams", setTeams);
    const unsubGfConfig = subscribeToGrandFinalConfig(setGfConfig);
    const unsubMvpVotes = subscribeToMvpVotes(setMvpVotes);

    return () => {
      if (unsubConfig) unsubConfig();
      if (unsubMatches) unsubMatches();
      if (unsubTeams) unsubTeams();
      if (unsubGfConfig) unsubGfConfig();
      if (unsubMvpVotes) unsubMvpVotes();
    };
  }, []);

  // Check if Grand Final Page is hidden by Admin
  if (gfConfig?.isPageVisible === false) {
    return (
      <div className="container" style={{ paddingTop: "4rem", paddingBottom: "4rem", textAlign: "center" }}>
        <div
          className="card card-gold"
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "3.5rem 2rem",
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-gold)",
            borderRadius: "16px",
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.6)",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              backgroundColor: "rgba(245, 176, 65, 0.1)",
              border: "2px solid var(--border-gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem auto",
            }}
          >
            <Lock size={32} style={{ color: "var(--primary-gold)" }} />
          </div>

          <h1 style={{ fontFamily: "var(--font-header)", fontSize: "1.6rem", color: "var(--text-primary)", marginBottom: "0.75rem", textTransform: "uppercase" }}>
            GRAND FINAL SHOWDOWN HIDDEN
          </h1>

          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "2rem" }}>
            The Grand Final page is currently set to private by tournament organizers. Please check back during the scheduled broadcast time!
          </p>

          <Link href="/" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.5rem", fontWeight: 800 }}>
            <ArrowLeft size={16} /> Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Find the Grand Final match
  const matchArray = Object.values(matches);
  let grandFinalMatch = null;

  if (gfConfig?.grandFinalMatchId && matches[gfConfig.grandFinalMatchId]) {
    grandFinalMatch = matches[gfConfig.grandFinalMatchId];
  } else {
    // Search by stage, id, or type with fallbacks
    grandFinalMatch = matchArray.find(
      (m) =>
        m.id === "match-playoff-8" ||
        m.stage === "Grand Final" ||
        m.stage === "grand_final" ||
        m.stage?.toLowerCase().includes("grand final") ||
        m.round === "Grand Finals" ||
        m.type === "grand_final" ||
        m.title?.toLowerCase().includes("grand final")
    ) || matchArray[matchArray.length - 1];
  }

  // Subscribe to Grand Final match details (game-by-game results)
  useEffect(() => {
    if (!grandFinalMatch?.id) return;
    const unsub = subscribeToMatchDetails(grandFinalMatch.id, (details) => {
      setMatchDetails(details);
    });
    return () => {
      if (unsub) unsub();
    };
  }, [grandFinalMatch?.id]);

  // Identify Team A and Team B
  const team1Id = grandFinalMatch?.teamAId || grandFinalMatch?.team1Id;
  const team2Id = grandFinalMatch?.teamBId || grandFinalMatch?.team2Id;

  const team1 = team1Id ? teams[team1Id] : null;
  const team2 = team2Id ? teams[team2Id] : null;

  // Identify Winning Team (Admin manual override takes Priority 1, System auto-detect from match status / winnerId as Priority 2)
  let winningTeam = null;
  if (gfConfig?.winningTeamId && teams[gfConfig.winningTeamId]) {
    winningTeam = teams[gfConfig.winningTeamId];
  } else if (grandFinalMatch?.status === "completed" || grandFinalMatch?.winnerId || grandFinalMatch?.completed) {
    const winnerId =
      grandFinalMatch.winnerId ||
      ((grandFinalMatch.scoreA || 0) > (grandFinalMatch.scoreB || 0)
        ? grandFinalMatch.teamAId
        : (grandFinalMatch.scoreB || 0) > (grandFinalMatch.scoreA || 0)
        ? grandFinalMatch.teamBId
        : null);
    if (winnerId && teams[winnerId]) {
      winningTeam = teams[winnerId];
    }
  }

  return (
    <div className="container" style={{ paddingTop: "1.5rem", paddingBottom: "4rem", display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      {/* Top Navigation & Title Hero */}
      <div style={{ textAlign: "center", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "1rem" }}>
          <Link
            href="/"
            className="btn btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.85rem", fontSize: "0.8rem" }}
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>

        <span
          className="hero-badge"
          style={{
            backgroundColor: "rgba(245, 176, 65, 0.08)",
            border: "1px solid var(--border-gold)",
            color: "var(--primary-gold)",
            textTransform: "uppercase",
            fontSize: "0.8rem",
            fontWeight: "700",
            padding: "0.3rem 1rem",
            borderRadius: "20px",
            display: "inline-block",
            marginBottom: "1rem",
          }}
        >
          ARAM MAYHEM CHAMPIONSHIP
        </span>

        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3.2rem)",
            fontWeight: "900",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "0.5rem",
            background: "linear-gradient(to bottom, #FFFFFF, var(--primary-gold-bright))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Grand Finals Showdown
        </h1>

        <p style={{ color: "var(--text-muted)", maxWidth: "600px", margin: "0 auto", fontSize: "0.95rem", lineHeight: "1.6" }}>
          Watch live coverage of the championship match and cast your vote for the tournament Finals MVP.
        </p>
      </div>

      {/* Grand Final Scoreboard & Roster Clash Header */}
      <GrandFinalHeader
        match={grandFinalMatch}
        matchDetails={matchDetails}
        team1={team1}
        team2={team2}
        winningTeamId={winningTeam?.id}
      />

      {/* Livestream Player Section */}
      <section style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Tv size={20} style={{ color: "var(--primary-gold)" }} />
          <h2 style={{ fontSize: "1.3rem", fontWeight: "900", color: "var(--text-primary)", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Grand Final Broadcast
          </h2>
        </div>
        <LivestreamPlayer
          youtubeUrl={gfConfig?.youtubeUrl}
          isLive={gfConfig?.isLive ?? true}
          matchTitle={`${team1?.name || "Team A"} vs ${team2?.name || "Team B"} - Grand Finals`}
        />
      </section>

      {/* MVP Fan Voting Section */}
      <section style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Award size={20} style={{ color: "var(--primary-gold)" }} />
          <h2 style={{ fontSize: "1.3rem", fontWeight: "900", color: "var(--text-primary)", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Finals MVP Fan Vote
          </h2>
        </div>
        <MvpVoting
          winningTeam={winningTeam}
          isVotingOpen={gfConfig?.isVotingOpen ?? false}
          isVotingFinished={gfConfig?.isVotingFinished ?? false}
          votes={mvpVotes}
        />
      </section>
    </div>
  );
}
