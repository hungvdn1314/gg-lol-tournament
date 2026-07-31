"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Tv, Award } from "lucide-react";
import { subscribeToData, subscribeToGrandFinalConfig, subscribeToMvpVotes } from "@/lib/db";
import GrandFinalHeader from "@/components/GrandFinalHeader";
import LivestreamPlayer from "@/components/LivestreamPlayer";
import MvpVoting from "@/components/MvpVoting";

export default function GrandFinalPage() {
  const [config, setConfig] = useState(null);
  const [matches, setMatches] = useState({});
  const [teams, setTeams] = useState({});
  const [gfConfig, setGfConfig] = useState({});
  const [mvpVotes, setMvpVotes] = useState({});

  useEffect(() => {
    const unsubConfig = subscribeToData("config", setConfig);
    const unsubMatches = subscribeToData("matches", setMatches);
    const unsubTeams = subscribeToData("teams", setTeams);
    const unsubGfConfig = subscribeToGrandFinalConfig(setGfConfig);
    const unsubMvpVotes = subscribeToMvpVotes(setMvpVotes);

    return () => {
      unsubConfig();
      unsubMatches();
      unsubTeams();
      unsubGfConfig();
      unsubMvpVotes();
    };
  }, []);

  // Find the Grand Final match
  const matchArray = Object.values(matches);
  let grandFinalMatch = null;

  if (gfConfig?.grandFinalMatchId && matches[gfConfig.grandFinalMatchId]) {
    grandFinalMatch = matches[gfConfig.grandFinalMatchId];
  } else {
    // Search by stage or type or fallback to last match
    grandFinalMatch = matchArray.find(
      (m) =>
        m.stage === "grand_final" ||
        m.round === "Grand Finals" ||
        m.type === "grand_final" ||
        m.title?.toLowerCase().includes("grand final")
    ) || matchArray[matchArray.length - 1];
  }

  // Identify Team A and Team B
  const team1Id = grandFinalMatch?.teamAId || grandFinalMatch?.team1Id;
  const team2Id = grandFinalMatch?.teamBId || grandFinalMatch?.team2Id;

  const team1 = team1Id ? teams[team1Id] : null;
  const team2 = team2Id ? teams[team2Id] : null;

  // Identify Winning Team
  let winningTeam = null;
  if (gfConfig?.winningTeamId && teams[gfConfig.winningTeamId]) {
    winningTeam = teams[gfConfig.winningTeamId];
  } else if (grandFinalMatch?.completed || grandFinalMatch?.winnerId) {
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
