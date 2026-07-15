"use client";

import { useState, useEffect } from "react";
import { Calendar, Info, Copy, Check, Search, X, MapPin, ExternalLink } from "lucide-react";
import { subscribeToData } from "@/lib/db";
import { ZhonyaHourglass, CrossedSwords } from "@/components/Icons";
import MatchStatsModal from "@/components/MatchStatsModal";
import { teamLogoPlaceholder } from "@/lib/placeholders";

export default function Schedule() {
  const [matches, setMatches] = useState({});
  const [teams, setTeams] = useState({});
  const [stageFilter, setStageFilter] = useState("all");
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
    const stageMatch = stageFilter === "all" || match.type === stageFilter;
    
    const teamA = teams[match.teamAId];
    const teamB = teams[match.teamBId];
    const query = searchQuery.toLowerCase().trim();
    
    const matchesSearch = !query || 
      (teamA?.name || "").toLowerCase().includes(query) || 
      (teamB?.name || "").toLowerCase().includes(query);
      
    return stageMatch && matchesSearch;
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

        {/* Tournament Venues */}
        <div style={{ maxWidth: "800px", margin: "2rem auto 0 auto", textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", justifyContent: "center" }}>
            <MapPin size={18} style={{ color: "var(--primary-gold)" }} />
            <h2 style={{ fontSize: "1.1rem", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "700" }}>Tournament Venues</h2>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
            {/* Hanoi Venue */}
            <div className="card card-gold" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.5rem" }}>
                <span style={{ fontWeight: "700", color: "var(--primary-gold-bright)", textTransform: "uppercase", fontSize: "0.9rem", letterSpacing: "0.05em" }}>Hà Nội</span>
                <span className="hero-badge" style={{ margin: 0, fontSize: "0.65rem", padding: "0.15rem 0.5rem", backgroundColor: "rgba(255,255,255,0.02)", borderColor: "var(--border-dark)", color: "var(--text-muted)" }}>2 Venues</span>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <a 
                  href="https://www.google.com/maps/search/?api=1&query=Net+Vikings+15+Đoàn+Trần+Nghiệp+Hà+Nội"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="venue-link"
                  style={{ display: "block", textDecoration: "none", color: "inherit" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Vòng bảng & playoffs</div>
                      <div style={{ fontWeight: "700", fontSize: "1rem", color: "var(--text-primary)", marginTop: "0.1rem", display: "flex", alignItems: "center", gap: "0.25rem" }} className="venue-name">
                        Net Vikings
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.2rem" }}>
                        <MapPin size={12} style={{ color: "var(--primary-gold)", flexShrink: 0 }} />
                        <span>15 Đoàn Trần Nghiệp, Hai Bà Trưng</span>
                      </div>
                    </div>
                    <ExternalLink size={12} style={{ color: "var(--text-muted)", marginTop: "0.25rem" }} className="venue-external-icon" />
                  </div>
                </a>
                
                <div style={{ borderTop: "1px dashed var(--border-dark)", paddingTop: "0.85rem" }}>
                  <a 
                    href="https://www.google.com/maps/search/?api=1&query=Vikings+Cyber+697+Giải+Phóng+Hà+Nội"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="venue-link"
                    style={{ display: "block", textDecoration: "none", color: "inherit" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Vòng chung kết</div>
                        <div style={{ fontWeight: "700", fontSize: "1rem", color: "var(--text-primary)", marginTop: "0.1rem", display: "flex", alignItems: "center", gap: "0.25rem" }} className="venue-name">
                          Vikings Cyber
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.2rem" }}>
                          <MapPin size={12} style={{ color: "var(--primary-gold)", flexShrink: 0 }} />
                          <span>697 Giải Phóng, Hoàng Mai</span>
                        </div>
                      </div>
                      <ExternalLink size={12} style={{ color: "var(--text-muted)", marginTop: "0.25rem" }} className="venue-external-icon" />
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* Da Nang Venue */}
            <div className="card card-gold" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.5rem" }}>
                <span style={{ fontWeight: "700", color: "var(--primary-gold-bright)", textTransform: "uppercase", fontSize: "0.9rem", letterSpacing: "0.05em" }}>Đà Nẵng</span>
                <span className="hero-badge" style={{ margin: 0, fontSize: "0.65rem", padding: "0.15rem 0.5rem", backgroundColor: "rgba(255,255,255,0.02)", borderColor: "var(--border-dark)", color: "var(--text-muted)" }}>1 Venue</span>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", justifyContent: "center", flex: 1 }}>
                <a 
                  href="https://www.google.com/maps/search/?api=1&query=Gen+Z+Arena+49+Phan+Đăng+Lưu+Đà+Nẵng"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="venue-link"
                  style={{ display: "block", textDecoration: "none", color: "inherit" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Tất cả các vòng</div>
                      <div style={{ fontWeight: "700", fontSize: "1rem", color: "var(--text-primary)", marginTop: "0.1rem", display: "flex", alignItems: "center", gap: "0.25rem" }} className="venue-name">
                        Gen Z Arena
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.2rem" }}>
                        <MapPin size={12} style={{ color: "var(--primary-gold)", flexShrink: 0 }} />
                        <span>49 Phan Đăng Lưu, Hải Châu</span>
                      </div>
                    </div>
                    <ExternalLink size={12} style={{ color: "var(--text-muted)", marginTop: "0.25rem" }} className="venue-external-icon" />
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", flexWrap: "wrap", margin: "2.5rem auto 0 auto", maxWidth: "800px" }}>
          {/* Search Bar */}
          <div style={{ flex: "1 1 300px", position: "relative" }}>
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
                fontSize: "0.9rem",
                width: "100%"
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

          {/* Stage Filters */}
          <div className="scrollable-tabs" style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setStageFilter("all")}
              className={`btn ${stageFilter === "all" ? "btn-primary" : "btn-outline"}`}
              style={{ padding: "0.4rem 1rem", fontSize: "0.8rem", borderRadius: "20px" }}
            >
              All Stages
            </button>
            <button
              onClick={() => setStageFilter("group")}
              className={`btn ${stageFilter === "group" ? "btn-primary" : "btn-outline"}`}
              style={{ padding: "0.4rem 1rem", fontSize: "0.8rem", borderRadius: "20px" }}
            >
              Group Stage
            </button>
            <button
              onClick={() => setStageFilter("knockout")}
              className={`btn ${stageFilter === "knockout" ? "btn-primary" : "btn-outline"}`}
              style={{ padding: "0.4rem 1rem", fontSize: "0.8rem", borderRadius: "20px" }}
            >
              Playoffs
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
                    <img src={teamA?.logo || teamLogoPlaceholder(teamA?.name, 40)} alt={teamA?.name} className="match-team-logo" style={{ flexShrink: 0 }} />
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
                    <img src={teamB?.logo || teamLogoPlaceholder(teamB?.name, 40)} alt={teamB?.name} className="match-team-logo" style={{ flexShrink: 0 }} />
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
