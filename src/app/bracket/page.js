"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { SummonersCup } from "@/components/Icons";
import { subscribeToData } from "@/lib/db";

export default function Bracket() {
  const [matches, setMatches] = useState({});
  const [teams, setTeams] = useState({});
  const [bracket, setBracket] = useState({ size: 6, rounds: [] });
  const [activeView, setActiveView] = useState("upper"); // upper, lower, final

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

  const getMatch = (id) => matches[id] || null;

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
        style={{ border: "1px solid var(--border-dark)", background: "var(--bg-tertiary)", borderRadius: "8px", overflow: "hidden", minWidth: "220px", display: "flex", flexDirection: "column" }}
      >
        {/* Match Header Info */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(0, 210, 255, 0.03)", padding: "0.3rem 0.75rem", fontSize: "0.7rem", borderBottom: "1px solid var(--border-dark)", color: "var(--text-muted)" }}>
          <span style={{ fontWeight: "600", color: "var(--primary-gold-bright)" }}>{label}</span>
          <span>Bo{match.bestOf}</span>
        </div>

        {/* Team A Row */}
        <div className={`bracket-team-row ${isCompleted && winnerId === match.teamAId ? "winner" : ""}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.75rem", borderBottom: "1px solid var(--border-dark)", opacity: isCompleted && winnerId !== match.teamAId ? 0.5 : 1 }}>
          <div className="bracket-team-info" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {teamA ? (
              <>
                <img src={teamA.logo} alt={teamA.name} className="bracket-team-logo" style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }} />
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "120px", fontWeight: isCompleted && winnerId === match.teamAId ? "800" : "500", color: isCompleted && winnerId === match.teamAId ? "var(--primary-gold-bright)" : "var(--text-primary)", fontSize: "0.85rem" }}>{teamA.name}</span>
              </>
            ) : (
              <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.8rem" }}>TBD</span>
            )}
          </div>
          <div className="bracket-team-score" style={{ fontWeight: "800", color: isCompleted && winnerId === match.teamAId ? "var(--primary-gold-bright)" : "var(--text-secondary)" }}>
            {match.status !== "scheduled" ? match.scoreA : "-"}
          </div>
        </div>

        {/* Team B Row */}
        <div className={`bracket-team-row ${isCompleted && winnerId === match.teamBId ? "winner" : ""}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.75rem", opacity: isCompleted && winnerId !== match.teamBId ? 0.5 : 1 }}>
          <div className="bracket-team-info" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {teamB ? (
              <>
                <img src={teamB.logo} alt={teamB.name} className="bracket-team-logo" style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }} />
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "120px", fontWeight: isCompleted && winnerId === match.teamBId ? "800" : "500", color: isCompleted && winnerId === match.teamBId ? "var(--primary-gold-bright)" : "var(--text-primary)", fontSize: "0.85rem" }}>{teamB.name}</span>
              </>
            ) : (
              <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.8rem" }}>TBD</span>
            )}
          </div>
          <div className="bracket-team-score" style={{ fontWeight: "800", color: isCompleted && winnerId === match.teamBId ? "var(--primary-gold-bright)" : "var(--text-secondary)" }}>
            {match.status !== "scheduled" ? match.scoreB : "-"}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="container">
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <span className="hero-badge">Double Elimination Bracket</span>
        <h1 style={{ fontSize: "2.5rem", textTransform: "uppercase", marginBottom: "1rem" }}>Knockout Stage</h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto" }}>
          The road to the ARAM Cup. 6 teams compete in a high-stakes Winners and Losers bracket structure.
        </p>

        {/* Bracket tabs */}
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "2rem" }}>
          <button 
            onClick={() => setActiveView("upper")} 
            className={`btn ${activeView === "upper" ? "btn-primary" : "btn-outline"}`}
            style={{ padding: "0.4rem 1.25rem", fontSize: "0.85rem" }}
          >
            Winners Bracket (Upper)
          </button>
          <button 
            onClick={() => setActiveView("lower")} 
            className={`btn ${activeView === "lower" ? "btn-primary" : "btn-outline"}`}
            style={{ padding: "0.4rem 1.25rem", fontSize: "0.85rem" }}
          >
            Losers Bracket (Lower)
          </button>
          <button 
            onClick={() => setActiveView("final")} 
            className={`btn ${activeView === "final" ? "btn-primary" : "btn-outline"}`}
            style={{ padding: "0.4rem 1.25rem", fontSize: "0.85rem" }}
          >
            Grand Finals
          </button>
        </div>
      </div>

      <div className="bracket-viewport card" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-dark)", padding: "3rem 1.5rem", minHeight: "450px" }}>
        <div className="bracket-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", overflowX: "auto" }}>
          
          {/* Winners Bracket View */}
          {activeView === "upper" && (
            <div style={{ display: "flex", alignItems: "center", gap: "3rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
                <h3 className="bracket-round-title" style={{ textAlign: "center", color: "var(--primary-gold)", fontSize: "0.95rem" }}>Upper Semifinals</h3>
                {renderMatchNode("match-playoff-1", "Match 1")}
                {renderMatchNode("match-playoff-2", "Match 2")}
              </div>
              <div style={{ color: "var(--border-gold-hover)" }}><ChevronRight size={24} /></div>
              <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
                <h3 className="bracket-round-title" style={{ textAlign: "center", color: "var(--primary-gold)", fontSize: "0.95rem" }}>Upper Finals</h3>
                {renderMatchNode("match-playoff-5", "Match 5")}
              </div>
            </div>
          )}

          {/* Losers Bracket View */}
          {activeView === "lower" && (
            <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
              {/* Round 1: Quarterfinals */}
              <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
                <h3 className="bracket-round-title" style={{ textAlign: "center", color: "var(--primary-gold)", fontSize: "0.95rem" }}>LB Quarterfinals</h3>
                {renderMatchNode("match-playoff-3", "Match 3")}
                {renderMatchNode("match-playoff-4", "Match 4")}
              </div>
              <div style={{ color: "var(--border-gold-hover)" }}><ChevronRight size={20} /></div>
              {/* Round 2: Semifinals */}
              <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
                <h3 className="bracket-round-title" style={{ textAlign: "center", color: "var(--primary-gold)", fontSize: "0.95rem" }}>LB Semifinals</h3>
                {renderMatchNode("match-playoff-6", "Match 6")}
              </div>
              <div style={{ color: "var(--border-gold-hover)" }}><ChevronRight size={20} /></div>
              {/* Round 3: Finals */}
              <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
                <h3 className="bracket-round-title" style={{ textAlign: "center", color: "var(--primary-gold)", fontSize: "0.95rem" }}>LB Finals</h3>
                {renderMatchNode("match-playoff-7", "Match 7")}
              </div>
            </div>
          )}

          {/* Grand Finals View */}
          {activeView === "final" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--primary-gold)", fontSize: "0.85rem", fontWeight: "700", textTransform: "uppercase" }}>
                <SummonersCup size={18} /> ARAM Mayhem Champion Trophy
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "3rem" }}>
                {renderMatchNode("match-playoff-8", "Match 8 (Grand Final)")}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
