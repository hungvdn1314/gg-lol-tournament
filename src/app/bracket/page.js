"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { SummonersCup } from "@/components/Icons";
import { subscribeToData } from "@/lib/db";

export default function Bracket() {
  const [matches, setMatches] = useState({});
  const [teams, setTeams] = useState({});
  const [bracket, setBracket] = useState({ size: 4, rounds: [] });

  useEffect(() => {
    const unsubMatches = subscribeToData("matches", setMatches);
    const unsubTeams = subscribeToData("teams", setTeams);
    const unsubBracket = subscribeToData("bracket", setBracket);

    return () => {
      unsubMatches();
      unsubTeams();
      unsubBracket();
    };
  }, []);

  // Helper to get match by ID safely
  const getMatch = (id) => matches[id] || null;

  // Render a single match card in the bracket
  const renderMatchNode = (matchId, label) => {
    const match = getMatch(matchId);
    if (!match) {
      return (
        <div className="bracket-match-node" style={{ opacity: 0.5 }}>
          <div className="bracket-round-title" style={{ border: "none", margin: 0, padding: "0.5rem" }}>
            {label}
          </div>
          <div className="bracket-team-row">
            <div className="bracket-team-info">TBD</div>
            <div className="bracket-team-score">-</div>
          </div>
          <div className="bracket-team-row">
            <div className="bracket-team-info">TBD</div>
            <div className="bracket-team-score">-</div>
          </div>
        </div>
      );
    }

    const teamA = teams[match.teamAId];
    const teamB = teams[match.teamBId];

    const isCompleted = match.status === "completed";
    const winnerId = match.winnerId;

    return (
      <motion.div 
        className="bracket-match-node"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        whileHover={{ scale: 1.02, transition: { duration: 0.1 } }}
      >
        {/* Match Header Info */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(255,255,255,0.01)", padding: "0.3rem 0.75rem", fontSize: "0.7rem", borderBottom: "1px solid var(--border-dark)", color: "var(--text-muted)" }}>
          <span>Bo{match.bestOf}</span>
          {match.status === "live" ? (
            <span style={{ color: "var(--color-danger)", fontWeight: "bold", animation: "pulse-live 1.5s infinite" }}>LIVE</span>
          ) : isCompleted ? (
            <span>Finished</span>
          ) : (
            <span>Scheduled</span>
          )}
        </div>

        {/* Team A Row */}
        <div className={`bracket-team-row ${isCompleted && winnerId === match.teamAId ? "winner" : ""}`}>
          <div className="bracket-team-info">
            {teamA ? (
              <>
                <img src={teamA.logo || "https://placehold.co/50x50"} alt={teamA.name} className="bracket-team-logo" />
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "150px" }}>{teamA.name.split(" (")[0]}</span>
              </>
            ) : (
              <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>TBD (Group Stage)</span>
            )}
          </div>
          <div className="bracket-team-score">
            {match.status !== "scheduled" ? match.scoreA : "-"}
          </div>
        </div>

        {/* Team B Row */}
        <div className={`bracket-team-row ${isCompleted && winnerId === match.teamBId ? "winner" : ""}`}>
          <div className="bracket-team-info">
            {teamB ? (
              <>
                <img src={teamB.logo || "https://placehold.co/50x50"} alt={teamB.name} className="bracket-team-logo" />
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "150px" }}>{teamB.name.split(" (")[0]}</span>
              </>
            ) : (
              <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>TBD (Group Stage)</span>
            )}
          </div>
          <div className="bracket-team-score">
            {match.status !== "scheduled" ? match.scoreB : "-"}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="container">
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <span className="hero-badge">Championship Bracket</span>
        <h1 style={{ fontSize: "2.5rem", textTransform: "uppercase", marginBottom: "1rem" }}>Knockout Stage</h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto" }}>
          The road to the Summoner's Cup. The top 2 teams from each group advance here. Swipe horizontally to view full stages on mobile.
        </p>
      </div>

      <div className="bracket-viewport card" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-dark)", padding: "3rem 1.5rem" }}>
        <div className="bracket-container">
          {/* Round 1: Semifinals */}
          <div className="bracket-round">
            <h3 className="bracket-round-title">Semifinals</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "6rem", justifyContent: "center", height: "100%" }}>
              <div style={{ position: "relative" }}>
                {renderMatchNode("match-semi1", "Semifinal #1")}
                {/* SVG connection lines for PC */}
                <div style={{ display: "none", position: "absolute", right: "-65px", top: "50%", width: "65px", height: "85px", borderRight: "2px solid var(--border-dark)", borderTop: "2px solid var(--border-dark)", pointerEvents: "none" }} className="bracket-line-pc"></div>
              </div>
              <div style={{ position: "relative" }}>
                {renderMatchNode("match-semi2", "Semifinal #2")}
                <div style={{ display: "none", position: "absolute", right: "-65px", bottom: "50%", width: "65px", height: "85px", borderRight: "2px solid var(--border-dark)", borderBottom: "2px solid var(--border-dark)", pointerEvents: "none" }} className="bracket-line-pc"></div>
              </div>
            </div>
          </div>

          {/* Bracket Advance Indicator Arrow (Hidden on Mobile) */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", height: "100%", color: "var(--border-gold-hover)" }} className="bracket-arrow-column">
            <div style={{ height: "45%", display: "flex", alignItems: "center" }}><ChevronRight size={24} /></div>
            <div style={{ height: "45%", display: "flex", alignItems: "center" }}><ChevronRight size={24} /></div>
          </div>

          {/* Round 2: Grand Finals */}
          <div className="bracket-round">
            <h3 className="bracket-round-title">Grand Finals</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "4rem", justifyContent: "center", height: "100%" }}>
              {/* Grand Final Node */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--primary-gold)", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase" }}>
                  <SummonersCup size={14} /> Winner Receives Cup
                </div>
                {renderMatchNode("match-final", "Grand Final")}
              </div>

              {/* 3rd Place Node */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", marginTop: "2rem" }}>
                <span className="hero-badge" style={{ fontSize: "0.65rem", padding: "0.15rem 0.5rem", margin: 0 }}>
                  3rd Place Playoff
                </span>
                {renderMatchNode("match-third", "Bronze Match")}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media (min-width: 769px) {
          .bracket-line-pc {
            display: block !important;
          }
        }
        @media (max-width: 768px) {
          .bracket-arrow-column {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
