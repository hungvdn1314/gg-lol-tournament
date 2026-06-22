"use client";

import { useState, useEffect } from "react";
import { Clock, Calendar, Swords, Info } from "lucide-react";
import { subscribeToData } from "@/lib/db";

export default function Schedule() {
  const [matches, setMatches] = useState({});
  const [teams, setTeams] = useState({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");

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
    return statusMatch && stageMatch;
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

  return (
    <div className="container">
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <span className="hero-badge">Tournament Schedule</span>
        <h1 style={{ fontSize: "2.5rem", textTransform: "uppercase", marginBottom: "1rem" }}>Matches & Results</h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto" }}>
          Track live match progression, review past results, and view upcoming match dates for the VNG Corporate LoL Cup.
        </p>

        {/* Filter Toolbar */}
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap", marginTop: "2rem" }}>
          {/* Status Filters */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
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
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setStageFilter("all")}
              className={`btn ${stageFilter === "all" ? "btn-primary" : "btn-outline"}`}
              style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}
            >
              All Stages
            </button>
            <button
              onClick={() => setStageFilter("group")}
              className={`btn ${stageFilter === "group" ? "btn-primary" : "btn-outline"}`}
              style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}
            >
              Group Stage
            </button>
            <button
              onClick={() => setStageFilter("knockout")}
              className={`btn ${stageFilter === "knockout" ? "btn-primary" : "btn-outline"}`}
              style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}
            >
              Knockout Stage
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
                    <Clock size={14} style={{ marginLeft: "0.5rem" }} />
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "1rem 0" }}>
                  {/* Team A */}
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", width: "40%", justifyContent: "flex-end", textAlign: "right", opacity: isCompleted && match.winnerId !== match.teamAId ? 0.5 : 1 }}>
                    <h3 className="match-team-name" style={{ fontSize: "1.1rem", fontWeight: isCompleted && match.winnerId === match.teamAId ? "800" : "500" }}>{teamA?.name || "TBD"}</h3>
                    <img src={teamA?.logo || "https://placehold.co/100x100"} alt={teamA?.name} className="match-team-logo" />
                  </div>

                  {/* Score center */}
                  <div className="match-scores" style={{ padding: "0.4rem 1rem", backgroundColor: isLive ? "rgba(var(--primary-gold-rgb), 0.05)" : "var(--bg-tertiary)" }}>
                    <span className="score-digit" style={{ color: isCompleted && match.winnerId === match.teamAId ? "var(--primary-gold-bright)" : "var(--text-primary)" }}>
                      {match.scoreA}
                    </span>
                    <span className="score-divider">:</span>
                    <span className="score-digit" style={{ color: isCompleted && match.winnerId === match.teamBId ? "var(--primary-gold-bright)" : "var(--text-primary)" }}>
                      {match.scoreB}
                    </span>
                  </div>

                  {/* Team B */}
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", width: "40%", justifyContent: "flex-start", textAlign: "left", opacity: isCompleted && match.winnerId !== match.teamBId ? 0.5 : 1 }}>
                    <img src={teamB?.logo || "https://placehold.co/100x100"} alt={teamB?.name} className="match-team-logo" />
                    <h3 className="match-team-name" style={{ fontSize: "1.1rem", fontWeight: isCompleted && match.winnerId === match.teamBId ? "800" : "500" }}>{teamB?.name || "TBD"}</h3>
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
