"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SummonersCup } from "@/components/Icons";
import { subscribeToData } from "@/lib/db";
import { teamLogoPlaceholder } from "@/lib/placeholders";
import MatchStatsModal from "@/components/MatchStatsModal";

export default function Bracket() {
  const [matches, setMatches] = useState({});
  const [teams, setTeams] = useState({});
  const [activeView, setActiveView] = useState("full"); // full, upper, lower, final
  const [selectedStatsMatch, setSelectedStatsMatch] = useState(null);

  useEffect(() => {
    const unsubMatches = subscribeToData("matches", setMatches);
    const unsubTeams = subscribeToData("teams", setTeams);

    return () => {
      unsubMatches();
      unsubTeams();
    };
  }, []);

  const getMatch = (id) => matches[id] || null;

  const renderMatchNode = (matchId, label, hasRightLine = false, hasLeftLine = false) => {
    const match = getMatch(matchId);
    
    // Inactive placeholder if match doesn't exist yet
    if (!match) {
      return (
        <div 
          style={{ 
            border: "1px dashed var(--border-dark)", 
            background: "rgba(255, 255, 255, 0.01)", 
            borderRadius: "8px", 
            overflow: "hidden", 
            minWidth: "220px", 
            display: "flex", 
            flexDirection: "column",
            position: "relative",
            opacity: 0.4
          }}
        >
          {/* Connector Lines */}
          {hasRightLine && <div style={{ position: "absolute", right: "-20px", top: "50%", width: "20px", height: "2px", backgroundColor: "var(--border-dark)" }} />}
          {hasLeftLine && <div style={{ position: "absolute", left: "-20px", top: "50%", width: "20px", height: "2px", backgroundColor: "var(--border-dark)" }} />}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(255, 255, 255, 0.02)", padding: "0.4rem 0.75rem", fontSize: "0.7rem", borderBottom: "1px dashed var(--border-dark)", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>
            <span>{label}</span>
            <span>TBD</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.75rem", borderBottom: "1px dashed var(--border-dark)", color: "var(--text-muted)", fontSize: "0.8rem" }}>
            <span>TBD</span>
            <span>-</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.75rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
            <span>TBD</span>
            <span>-</span>
          </div>
        </div>
      );
    }

    const teamA = teams[match.teamAId];
    const teamB = teams[match.teamBId];
    const isCompleted = match.status === "completed";
    const isLive = match.status === "live" || match.status === "in_progress";
    const winnerId = match.winnerId;

    return (
      <motion.div 
        style={{ 
          border: isLive ? "1px solid var(--primary-gold)" : "1px solid var(--border-dark)", 
          background: isLive ? "rgba(245, 176, 65, 0.02)" : "var(--bg-secondary)", 
          borderRadius: "8px", 
          overflow: "hidden", 
          minWidth: "220px", 
          display: "flex", 
          flexDirection: "column",
          position: "relative",
          boxShadow: isLive ? "0 0 15px rgba(245, 176, 65, 0.15)" : "none",
          cursor: "pointer"
        }}
        whileHover={{ 
          y: -2, 
          borderColor: isLive ? "var(--primary-gold)" : "var(--border-gold-hover)", 
          boxShadow: isLive ? "0 4px 20px rgba(245, 176, 65, 0.25)" : "0 4px 15px rgba(245, 176, 65, 0.08)"
        }}
        onClick={() => setSelectedStatsMatch(match)}
        transition={{ duration: 0.2 }}
      >
        {/* Connector Lines */}
        {hasRightLine && <div style={{ position: "absolute", right: "-20px", top: "50%", width: "20px", height: "2px", backgroundColor: isCompleted ? "var(--primary-gold-dim)" : "var(--border-dark)" }} />}
        {hasLeftLine && <div style={{ position: "absolute", left: "-20px", top: "50%", width: "20px", height: "2px", backgroundColor: isCompleted ? "var(--primary-gold-dim)" : "var(--border-dark)" }} />}

        {/* Match Header Info */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: isLive ? "rgba(245, 176, 65, 0.12)" : "rgba(255, 255, 255, 0.02)", padding: "0.4rem 0.75rem", fontSize: "0.7rem", borderBottom: "1px solid var(--border-dark)", color: "var(--text-muted)" }}>
          <span style={{ fontWeight: "700", color: isLive ? "var(--primary-gold)" : "var(--primary-gold-bright)", textTransform: "uppercase" }}>{label}</span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            {isLive && (
              <span style={{ display: "inline-block", width: "6px", height: "6px", backgroundColor: "#ff4655", borderRadius: "50%", animation: "pulse 1s infinite" }} />
            )}
            <span style={{ fontWeight: "bold", textTransform: "uppercase", fontSize: "0.65rem", color: isLive ? "#ff4655" : "var(--text-muted)" }}>
              {isLive ? "LIVE" : `Bo${match.bestOf}`}
            </span>
          </div>
        </div>

        {/* Team A Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.75rem", borderBottom: "1px solid var(--border-dark)", opacity: isCompleted && winnerId !== match.teamAId ? 0.4 : 1, transition: "opacity 0.2s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflow: "hidden", flex: 1 }}>
            {teamA ? (
              <>
                <img src={teamA.logo || teamLogoPlaceholder(teamA.name, 24)} alt={teamA.name} style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border-dark)" }} />
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: isCompleted && winnerId === match.teamAId ? "800" : "600", color: isCompleted && winnerId === match.teamAId ? "var(--primary-gold-bright)" : "var(--text-primary)", fontSize: "0.8rem" }}>
                  {teamA.name}
                </span>
                {isCompleted && winnerId === match.teamAId && (
                  <span style={{ color: "var(--primary-gold)", fontSize: "0.75rem", display: "flex", alignItems: "center" }} title="Winner">★</span>
                )}
              </>
            ) : (
              <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.8rem" }}>TBD</span>
            )}
          </div>
          <div 
            style={{ 
              fontWeight: "900", 
              fontSize: "0.85rem", 
              color: isCompleted && winnerId === match.teamAId ? "#0A0A0C" : "var(--text-primary)",
              backgroundColor: isCompleted && winnerId === match.teamAId ? "var(--primary-gold)" : "rgba(255,255,255,0.02)",
              padding: "0.15rem 0.4rem",
              borderRadius: "3px",
              minWidth: "22px",
              textAlign: "center"
            }}
          >
            {match.status !== "scheduled" ? match.scoreA : "-"}
          </div>
        </div>

        {/* Team B Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.75rem", opacity: isCompleted && winnerId !== match.teamBId ? 0.4 : 1, transition: "opacity 0.2s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflow: "hidden", flex: 1 }}>
            {teamB ? (
              <>
                <img src={teamB.logo || teamLogoPlaceholder(teamB.name, 24)} alt={teamB.name} style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border-dark)" }} />
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: isCompleted && winnerId === match.teamBId ? "800" : "600", color: isCompleted && winnerId === match.teamBId ? "var(--primary-gold-bright)" : "var(--text-primary)", fontSize: "0.8rem" }}>
                  {teamB.name}
                </span>
                {isCompleted && winnerId === match.teamBId && (
                  <span style={{ color: "var(--primary-gold)", fontSize: "0.75rem", display: "flex", alignItems: "center" }} title="Winner">★</span>
                )}
              </>
            ) : (
              <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.8rem" }}>TBD</span>
            )}
          </div>
          <div 
            style={{ 
              fontWeight: "900", 
              fontSize: "0.85rem", 
              color: isCompleted && winnerId === match.teamBId ? "#0A0A0C" : "var(--text-primary)",
              backgroundColor: isCompleted && winnerId === match.teamBId ? "var(--primary-gold)" : "rgba(255,255,255,0.02)",
              padding: "0.15rem 0.4rem",
              borderRadius: "3px",
              minWidth: "22px",
              textAlign: "center"
            }}
          >
            {match.status !== "scheduled" ? match.scoreB : "-"}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1rem" }}>
      {/* Header Section */}
      <div style={{ textAlign: "center", marginBottom: "3rem", position: "relative", paddingTop: "1.5rem" }}>
        <span className="hero-badge" style={{ backgroundColor: "rgba(245,176,65,0.08)", border: "1px solid var(--border-gold)", color: "var(--primary-gold)", textTransform: "uppercase", fontSize: "0.8rem", fontWeight: "700", padding: "0.3rem 1rem", borderRadius: "20px", display: "inline-block", marginBottom: "1rem" }}>Double Elimination Bracket</span>
        <h1 style={{ fontSize: "2.8rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem", background: "linear-gradient(to bottom, #FFFFFF, var(--primary-gold-bright))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Knockout Stage</h1>
        <p style={{ color: "var(--text-muted)", maxWidth: "600px", margin: "0 auto", fontSize: "0.95rem", lineHeight: "1.6" }}>
          The road to the ARAM Cup. 6 teams compete in a high-stakes Winners and Losers bracket structure.
        </p>

        {/* Segmented Bracket Tabs */}
        <div style={{ display: "inline-flex", backgroundColor: "var(--bg-secondary)", padding: "4px", borderRadius: "30px", border: "1px solid var(--border-dark)", marginTop: "2rem" }}>
          {[
            { id: "full", label: "Full Bracket" },
            { id: "upper", label: "Winners" },
            { id: "lower", label: "Losers" },
            { id: "final", label: "Grand Finals" }
          ].map((view) => (
            <button
              key={view.id}
              className={`btn ${activeView === view.id ? "btn-primary" : ""}`}
              onClick={() => setActiveView(view.id)}
              style={{
                borderRadius: "20px",
                padding: "0.4rem 1.5rem",
                fontSize: "0.85rem",
                background: activeView === view.id ? "" : "transparent",
                border: "none",
                color: activeView === view.id ? "#000" : "var(--text-muted)",
                fontWeight: "bold",
              }}
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bracket Viewport Container */}
      <div 
        className="card" 
        style={{ 
          backgroundColor: "var(--bg-secondary)", 
          border: "1px solid var(--border-dark)", 
          padding: "2.5rem 1.5rem", 
          minHeight: "480px", 
          marginBottom: "4rem",
          overflow: "hidden"
        }}
      >
        {/* Horizontal Scroll Hint for Mobile */}
        <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.5rem", display: "none" }} className="bracket-arrow-mobile">
          Swipe horizontally to scroll bracket &rarr;
        </div>

        <div style={{ width: "100%", overflowX: "auto", paddingBottom: "1rem" }}>
          
          {/* 1. Full Bracket View (Aligned Side-by-Side) */}
          {activeView === "full" && (
            <div style={{ display: "flex", gap: "2.5rem", minWidth: "max-content", alignItems: "center", justifyContent: "center", margin: "0 auto", padding: "1rem 2rem" }}>
              
              {/* Column 1: Lower Quarters and Upper Semis */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "620px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold", textAlign: "center", letterSpacing: "0.05em" }}>Upper Semis</span>
                  {renderMatchNode("match-playoff-1", "Match 1", true, false)}
                  {renderMatchNode("match-playoff-2", "Match 2", true, false)}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold", textAlign: "center", letterSpacing: "0.05em" }}>LB Quarters</span>
                  {renderMatchNode("match-playoff-3", "Match 3", true, false)}
                  {renderMatchNode("match-playoff-4", "Match 4", true, false)}
                </div>
              </div>

              {/* Column 2: Upper Finals and Lower Semis */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", height: "620px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold", textAlign: "center", letterSpacing: "0.05em" }}>Upper Finals</span>
                  {renderMatchNode("match-playoff-5", true, true)}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold", textAlign: "center", letterSpacing: "0.05em" }}>LB Semis</span>
                  {renderMatchNode("match-playoff-6", true, true)}
                </div>
              </div>

              {/* Column 3: LB Finals */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "620px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "180px" }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold", textAlign: "center", letterSpacing: "0.05em" }}>LB Finals</span>
                  {renderMatchNode("match-playoff-7", "Match 7", true, true)}
                </div>
              </div>

              {/* Column 4: Grand Finals */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "620px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--primary-gold)", textTransform: "uppercase", fontWeight: "900", display: "flex", alignItems: "center", gap: "0.25rem", letterSpacing: "0.05em" }}>
                    <SummonersCup size={14} /> Grand Final
                  </span>
                  {renderMatchNode("match-playoff-8", "Grand Final", false, true)}
                </div>
              </div>

            </div>
          )}

          {/* 2. Winners Bracket View */}
          {activeView === "upper" && (
            <div style={{ display: "flex", gap: "2.5rem", minWidth: "max-content", alignItems: "center", justifyContent: "center", margin: "0 auto", padding: "3rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold", textAlign: "center", letterSpacing: "0.05em" }}>Upper Semifinals</span>
                {renderMatchNode("match-playoff-1", "Match 1", true, false)}
                {renderMatchNode("match-playoff-2", "Match 2", true, false)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold", textAlign: "center", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Upper Finals</span>
                {renderMatchNode("match-playoff-5", "Match 5", false, true)}
              </div>
            </div>
          )}

          {/* 3. Losers Bracket View */}
          {activeView === "lower" && (
            <div style={{ display: "flex", gap: "2.5rem", minWidth: "max-content", alignItems: "center", justifyContent: "center", margin: "0 auto", padding: "3rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold", textAlign: "center", letterSpacing: "0.05em" }}>LB Quarterfinals</span>
                {renderMatchNode("match-playoff-3", "Match 3", true, false)}
                {renderMatchNode("match-playoff-4", "Match 4", true, false)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold", textAlign: "center", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>LB Semifinals</span>
                {renderMatchNode("match-playoff-6", "LB Semis", true, true)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold", textAlign: "center", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>LB Finals</span>
                {renderMatchNode("match-playoff-7", "LB Finals", false, true)}
              </div>
            </div>
          )}

          {/* 4. Grand Finals View */}
          {activeView === "final" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--primary-gold)", textTransform: "uppercase", fontWeight: "900", display: "flex", alignItems: "center", gap: "0.4rem", letterSpacing: "0.05em" }}>
                  <SummonersCup size={18} /> Championship Final
                </span>
                {renderMatchNode("match-playoff-8", "Grand Final", false, false)}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Stats Modal */}
      {selectedStatsMatch && (
        <MatchStatsModal 
          match={selectedStatsMatch}
          teams={teams}
          onClose={() => setSelectedStatsMatch(null)}
        />
      )}
    </div>
  );
}
