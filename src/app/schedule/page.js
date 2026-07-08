"use client";

import { useState, useEffect } from "react";
import { Calendar, Info, Copy, Check, Search, X } from "lucide-react";
import { subscribeToData } from "@/lib/db";
import { ZhonyaHourglass, CrossedSwords } from "@/components/Icons";
import MatchStatsModal from "@/components/MatchStatsModal";

export default function Schedule() {
  const [matches, setMatches] = useState({});
  const [teams, setTeams] = useState({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [selectedStatsMatch, setSelectedStatsMatch] = useState(null);
  const [copiedMatchId, setCopiedMatchId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsubMatches = subscribeToData("matches", setMatches);
    const unsubTeams = subscribeToData("teams", setTeams);

    return () => {
      unsubMatches();
      unsubTeams();
    };
  }, []);

  const matchList = Object.values(matches).sort((a, b) => {
    // Sort completed matches by date descending, others by date ascending
    if (a.status === "completed" && b.status === "completed") {
      return new Date(b.scheduledTime) - new Date(a.scheduledTime);
    }
    if (a.status === "completed") return 1;
    if (b.status === "completed") return -1;
    return new Date(a.scheduledTime) - new Date(b.scheduledTime);
  });

  // Filter matches
  const filteredMatches = matchList.filter((match) => {
    const statusMatch = statusFilter === "all" || match.status === statusFilter;
    const stageMatch = stageFilter === "all" || match.type === stageFilter;
    const groupMatch = groupFilter === "all" || match.group === groupFilter;
    
    const teamA = teams[match.teamAId];
    const teamB = teams[match.teamBId];
    const query = searchQuery.toLowerCase().trim();
    
    const matchesSearch = !query || 
      (teamA?.name || "").toLowerCase().includes(query) || 
      (teamB?.name || "").toLowerCase().includes(query);
      
    return statusMatch && stageMatch && groupMatch && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "live":
        return <span className="match-status-badge live">Live Now</span>;
      case "completed":
        return <span className="match-status-badge completed">Completed</span>;
      default:
        return <span className="match-status-badge scheduled">Scheduled</span>;
    }
  };

  const handleCopyCode = (matchId, code) => {
    navigator.clipboard.writeText(code);
    setCopiedMatchId(matchId);
    setTimeout(() => setCopiedMatchId(null), 2000);
  };

  return (
    <div className="container">
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <span className="hero-badge">Tournament Schedule</span>
        <h1 style={{ fontSize: "2.5rem", textTransform: "uppercase", marginBottom: "1rem" }}>Matches & Results</h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto" }}>
          Track live match progression, review post-game scoreboard analytics, and view upcoming match draft codes.
        </p>

        {/* Search Bar */}
        <div style={{ maxWidth: "400px", margin: "1.5rem auto 0 auto", position: "relative" }}>
          <input
            type="text"
            placeholder="Search by team name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-control"
            style={{
              paddingLeft: "2.5rem",
              paddingRight: "2.5rem",
              borderColor: "var(--border-dark)",
              borderRadius: "20px",
              fontSize: "0.9rem"
            }}
          />
          <Search size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap", marginTop: "2rem" }}>
          {/* Status Filters */}
          <div className="scrollable-tabs" style={{ maxWidth: "100%" }}>
            <button
              onClick={() => setStatusFilter("all")}
              className={`btn ${statusFilter === "all" ? "btn-primary" : "btn-outline"}`}
              style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}
            >
              All Statuses
            </button>
            <button
              onClick={() => setStatusFilter("live")}
              className={`btn ${statusFilter === "live" ? "btn-primary" : "btn-outline"}`}
              style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}
            >
              Live
            </button>
            <button
              onClick={() => setStatusFilter("scheduled")}
              className={`btn ${statusFilter === "scheduled" ? "btn-primary" : "btn-outline"}`}
              style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}
            >
              Upcoming
            </button>
            <button
              onClick={() => setStatusFilter("completed")}
              className={`btn ${statusFilter === "completed" ? "btn-primary" : "btn-outline"}`}
              style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}
            >
              Results
            </button>
          </div>

          <div style={{ width: "1px", height: "30px", backgroundColor: "var(--border-dark)", alignSelf: "center" }}></div>

          {/* Stage Filters */}
          <div className="scrollable-tabs" style={{ maxWidth: "100%" }}>
            <button
              onClick={() => setStageFilter("all")}
              className={`btn ${stageFilter === "all" ? "btn-primary" : "btn-outline"}`}
              style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}
            >
              All Stages
            </button>
            <button
              onClick={() => { setStageFilter("group"); }}
              className={`btn ${stageFilter === "group" && groupFilter === "all" ? "btn-primary" : "btn-outline"}`}
              style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}
            >
              Group Stage
            </button>
            <button
              onClick={() => { setStageFilter("knockout"); setGroupFilter("all"); }}
              className={`btn ${stageFilter === "knockout" ? "btn-primary" : "btn-outline"}`}
              style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}
            >
              Knockout Stage
            </button>
          </div>

          <div style={{ width: "1px", height: "30px", backgroundColor: "var(--border-dark)", alignSelf: "center" }}></div>

          {/* Group Filters */}
          <div className="scrollable-tabs" style={{ maxWidth: "100%" }}>
            <button
              onClick={() => setGroupFilter("all")}
              className={`btn ${groupFilter === "all" ? "btn-primary" : "btn-outline"}`}
              style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}
            >
              All Groups
            </button>
            <button
              onClick={() => { setGroupFilter("A"); setStageFilter("group"); }}
              className={`btn ${groupFilter === "A" ? "btn-primary" : "btn-outline"}`}
              style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}
            >
              Group A
            </button>
            <button
              onClick={() => { setGroupFilter("B"); setStageFilter("group"); }}
              className={`btn ${groupFilter === "B" ? "btn-primary" : "btn-outline"}`}
              style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}
            >
              Group B
            </button>
            <button
              onClick={() => { setGroupFilter("C"); setStageFilter("group"); }}
              className={`btn ${groupFilter === "C" ? "btn-primary" : "btn-outline"}`}
              style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}
            >
              Group C
            </button>
          </div>
        </div>
      </div>

      {/* Match List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "800px", margin: "0 auto 4rem auto" }}>
        {filteredMatches.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontStyle: "italic" }}>
            No matches found matching the selected filters.
          </div>
        ) : (
          filteredMatches.map((match) => {
            const teamA = teams[match.teamAId];
            const teamB = teams[match.teamBId];
            const isLive = match.status === "live";
            const isCompleted = match.status === "completed";

            return (
              <div
                key={match.id}
                className={`card ${isLive ? "card-gold" : ""}`}
                style={{ padding: "1.5rem" }}
              >
                {/* Match Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    <Calendar size={14} />
                    <span>{new Date(match.scheduledTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <ZhonyaHourglass size={14} style={{ marginLeft: "0.5rem" }} />
                    <span>{new Date(match.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span className="hero-badge" style={{ margin: 0, fontSize: "0.65rem", padding: "0.15rem 0.5rem", backgroundColor: "rgba(255,255,255,0.02)", borderColor: "var(--border-dark)", color: "var(--text-muted)" }}>
                      {match.stage} {match.group ? `(Group ${match.group})` : ""} &bull; Bo{match.bestOf}
                    </span>
                    {getStatusBadge(match.status)}
                  </div>
                </div>

                {/* Scoreboard layout */}
                <div className="schedule-scoreboard" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "1rem 0" }}>
                  {/* Team A */}
                  <div className="schedule-team" style={{ display: "flex", alignItems: "center", gap: "1rem", width: "40%", justifyContent: "flex-end", textAlign: "right", opacity: isCompleted && match.winnerId !== match.teamAId ? 0.5 : 1 }}>
                    <h3 className="match-team-name schedule-team-name" style={{ fontSize: "1.1rem", fontWeight: isCompleted && match.winnerId === match.teamAId ? "800" : "500", margin: 0, flex: 1 }}>{teamA?.name || "TBD"}</h3>
                    <img src={teamA?.logo || "https://placehold.co/40x40"} alt={teamA?.name} className="match-team-logo" style={{ flexShrink: 0 }} />
                  </div>

                  {/* Score center */}
                  <div className="match-scores" style={{ padding: "0.4rem 1rem", backgroundColor: isLive ? "rgba(var(--primary-gold-rgb), 0.05)" : "var(--bg-tertiary)", flexShrink: 0 }}>
                    <span className="score-digit" style={{ color: isCompleted && match.winnerId === match.teamAId ? "var(--primary-gold-bright)" : "var(--text-primary)" }}>
                      {match.scoreA}
                    </span>
                    <span className="score-divider">:</span>
                    <span className="score-digit" style={{ color: isCompleted && match.winnerId === match.teamBId ? "var(--primary-gold-bright)" : "var(--text-primary)" }}>
                      {match.scoreB}
                    </span>
                  </div>

                  {/* Team B */}
                  <div className="schedule-team" style={{ display: "flex", alignItems: "center", gap: "1rem", width: "40%", justifyContent: "flex-start", textAlign: "left", opacity: isCompleted && match.winnerId !== match.teamBId ? 0.5 : 1 }}>
                    <img src={teamB?.logo || "https://placehold.co/40x40"} alt={teamB?.name} className="match-team-logo" style={{ flexShrink: 0 }} />
                    <h3 className="match-team-name schedule-team-name" style={{ fontSize: "1.1rem", fontWeight: isCompleted && match.winnerId === match.teamBId ? "800" : "500", margin: 0, flex: 1 }}>{teamB?.name || "TBD"}</h3>
                  </div>
                </div>

                {/* Live stream placeholder or broadcast link if match is live */}
                {isLive && (
                  <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "rgba(220,53,69,0.05)", border: "1px solid rgba(220,53,69,0.15)", borderRadius: "4px", display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.85rem" }}>
                    <span style={{ display: "inline-block", width: "6px", height: "6px", backgroundColor: "var(--color-danger)", borderRadius: "50%", animation: "pulse-live 1.5s infinite" }}></span>
                    <span style={{ color: "var(--text-primary)" }}>
                      <strong>Match is Live:</strong> Updates are broadcasted instantly. Catch the stream on Discord channel <code>#lol-tournament</code>.
                    </span>
                  </div>
                )}

                {/* Tournament Draft Invite Code */}
                {match.tournamentCode && !isCompleted && (
                  <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-dark)", borderRadius: "4px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", fontSize: "0.85rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ color: "var(--primary-gold)" }}>🏆</span>
                      <span style={{ color: "var(--text-secondary)" }}>
                        Draft Code: <code style={{ color: "var(--primary-gold-bright)", backgroundColor: "rgba(0,0,0,0.2)", padding: "0.15rem 0.4rem", borderRadius: "2px", border: "1px solid var(--border-dark)" }}>{match.tournamentCode}</code>
                      </span>
                    </div>
                    <button 
                      onClick={() => handleCopyCode(match.id, match.tournamentCode)}
                      className="btn btn-outline"
                      style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem", height: "28px" }}
                    >
                      {copiedMatchId === match.id ? (
                        <>
                          <Check size={12} style={{ color: "var(--color-success)" }} /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> Copy Code
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Post-Game Stats Inspector Button */}
                {isCompleted && (
                  <div style={{ display: "flex", justifyContent: "center", marginTop: "1.25rem", borderTop: "1px solid var(--border-dark)", paddingTop: "1rem" }}>
                    <button 
                      onClick={() => setSelectedStatsMatch(match)}
                      className="btn btn-secondary"
                      style={{ fontSize: "0.8rem", padding: "0.4rem 1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}
                    >
                      <CrossedSwords size={14} /> Inspect Match Stats
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
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
