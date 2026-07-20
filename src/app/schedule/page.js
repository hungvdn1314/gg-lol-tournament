"use client";

import { useState, useEffect } from "react";
import { Calendar, Info, Copy, Check, Search, X, MapPin, ExternalLink, Utensils, Coffee, Trophy } from "lucide-react";
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
      <div style={{ textAlign: "center", marginBottom: "3rem", position: "relative", paddingTop: "1.5rem" }}>
        <span className="hero-badge" style={{ backgroundColor: "rgba(245,176,65,0.08)", border: "1px solid var(--border-gold)", color: "var(--primary-gold)", textTransform: "uppercase", fontSize: "0.8rem", fontWeight: "700", padding: "0.3rem 1rem", borderRadius: "20px", display: "inline-block", marginBottom: "1rem" }}>Tournament Schedule</span>
        <h1 style={{ fontSize: "2.8rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem", background: "linear-gradient(to bottom, #FFFFFF, var(--primary-gold-bright))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Matches &amp; Results</h1>
        <p style={{ color: "var(--text-muted)", maxWidth: "600px", margin: "0 auto", fontSize: "0.95rem", lineHeight: "1.6" }}>
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
                <span style={{ fontWeight: "700", color: "var(--primary-gold-bright)", textTransform: "uppercase", fontSize: "0.9rem", letterSpacing: "0.05em" }}>Ha Noi</span>
                <span className="hero-badge" style={{ margin: 0, fontSize: "0.65rem", padding: "0.15rem 0.5rem", backgroundColor: "rgba(255,255,255,0.02)", borderColor: "var(--border-dark)", color: "var(--text-muted)" }}>All Matches</span>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <a 
                  href="https://www.google.com/maps/search/?api=1&query=Vikings+Cyber+697+Giai+Phong+Ha+Noi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="venue-link"
                  style={{ display: "block", textDecoration: "none", color: "inherit" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                    <div>
                      <div style={{ fontWeight: "700", fontSize: "1.05rem", color: "var(--text-primary)", marginTop: "0", display: "flex", alignItems: "center", gap: "0.25rem" }} className="venue-name">
                        Vikings Cyber
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.25rem" }}>
                        <MapPin size={12} style={{ color: "var(--primary-gold)", flexShrink: 0 }} />
                        <span>697 Giai Phong, Hoang Mai</span>
                      </div>
                    </div>
                    <ExternalLink size={12} style={{ color: "var(--text-muted)", marginTop: "0.25rem" }} className="venue-external-icon" />
                  </div>
                </a>
              </div>
            </div>

            {/* Da Nang Venue */}
            <div className="card card-gold" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.5rem" }}>
                <span style={{ fontWeight: "700", color: "var(--primary-gold-bright)", textTransform: "uppercase", fontSize: "0.9rem", letterSpacing: "0.05em" }}>Da Nang</span>
                <span className="hero-badge" style={{ margin: 0, fontSize: "0.65rem", padding: "0.15rem 0.5rem", backgroundColor: "rgba(255,255,255,0.02)", borderColor: "var(--border-dark)", color: "var(--text-muted)" }}>1 Venue</span>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", justifyContent: "center", flex: 1 }}>
                <a 
                  href="https://www.google.com/maps/search/?api=1&query=Gen+Z+Arena+49+Phan+Dang+Luu+Da+Nang"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="venue-link"
                  style={{ display: "block", textDecoration: "none", color: "inherit" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                    <div>
                      <div style={{ fontWeight: "700", fontSize: "1rem", color: "var(--text-primary)", marginTop: "0", display: "flex", alignItems: "center", gap: "0.25rem" }} className="venue-name">
                        Gen Z Arena
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.25rem" }}>
                        <MapPin size={12} style={{ color: "var(--primary-gold)", flexShrink: 0 }} />
                        <span>49 Phan Dang Luu, Hai Chau</span>
                      </div>
                    </div>
                    <ExternalLink size={12} style={{ color: "var(--text-muted)", marginTop: "0.25rem" }} className="venue-external-icon" />
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Food & Drink Orders */}
        <div style={{ maxWidth: "800px", margin: "2rem auto 0 auto", textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", justifyContent: "center" }}>
            <Utensils size={18} style={{ color: "var(--primary-gold)" }} />
            <h2 style={{ fontSize: "1.1rem", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "700" }}>Food &amp; Drink Orders</h2>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
            {/* Hanoi Office Order */}
            <div className="card card-gold" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.5rem" }}>
                <span style={{ fontWeight: "700", color: "var(--primary-gold-bright)", textTransform: "uppercase", fontSize: "0.9rem", letterSpacing: "0.05em" }}>HN Office</span>
                <span className="hero-badge" style={{ margin: 0, fontSize: "0.65rem", padding: "0.15rem 0.5rem", backgroundColor: "rgba(255,255,255,0.02)", borderColor: "var(--border-dark)", color: "var(--text-muted)" }}>Hanoi</span>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", justifyContent: "space-between", flex: 1 }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Pre-order Catering</div>
                  <div style={{ fontWeight: "700", fontSize: "1rem", color: "var(--text-primary)", marginTop: "0.1rem" }}>
                    HN Office Food &amp; Beverage
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.5rem", lineHeight: "1.4" }}>
                    Place your orders before matches begin. Food and drinks will be prepared and delivered directly to the gaming zone at the Hanoi office.
                  </div>
                </div>
                
                <a 
                  href="https://docs.google.com/spreadsheets/d/1AqTLc6oc9_ymPbV8xn66bp_NYuKMTrR4HxvgqJv2D6g/edit?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ 
                    display: "flex", 
                    justifyContent: "center", 
                    alignItems: "center", 
                    gap: "0.5rem", 
                    fontSize: "0.85rem", 
                    padding: "0.6rem 1rem", 
                    marginTop: "0.5rem",
                    textDecoration: "none"
                  }}
                >
                  <Coffee size={14} />
                  <span>Order at HN Office</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Da Nang Office Order */}
            <div className="card card-gold" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.5rem" }}>
                <span style={{ fontWeight: "700", color: "var(--primary-gold-bright)", textTransform: "uppercase", fontSize: "0.9rem", letterSpacing: "0.05em" }}>DN Office</span>
                <span className="hero-badge" style={{ margin: 0, fontSize: "0.65rem", padding: "0.15rem 0.5rem", backgroundColor: "rgba(255,255,255,0.02)", borderColor: "var(--border-dark)", color: "var(--text-muted)" }}>Da Nang</span>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", justifyContent: "space-between", flex: 1 }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Pre-order Catering</div>
                  <div style={{ fontWeight: "700", fontSize: "1rem", color: "var(--text-primary)", marginTop: "0.1rem" }}>
                    DN Office Food &amp; Beverage
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.5rem", lineHeight: "1.4" }}>
                    Place your orders before matches begin. Food and drinks will be prepared and delivered directly to the gaming zone at the Da Nang office.
                  </div>
                </div>
                
                <a 
                  href="https://docs.google.com/spreadsheets/d/1Rsm9Z6ptriChYKY_DBh_gcT_F-1wfOIo_Z0Ar48YX1M/edit?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ 
                    display: "flex", 
                    justifyContent: "center", 
                    alignItems: "center", 
                    gap: "0.5rem", 
                    fontSize: "0.85rem", 
                    padding: "0.6rem 1rem", 
                    marginTop: "0.5rem",
                    textDecoration: "none"
                  }}
                >
                  <Coffee size={14} />
                  <span>Order at DN Office</span>
                  <ExternalLink size={12} />
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
          <div style={{ display: "inline-flex", backgroundColor: "var(--bg-secondary)", padding: "4px", borderRadius: "30px", border: "1px solid var(--border-dark)", flexShrink: 0 }}>
            {[
              { id: "all", label: "All Stages" },
              { id: "group", label: "Group Stage" },
              { id: "knockout", label: "Playoffs" },
            ].map((f) => (
              <button
                key={f.id}
                className={`btn ${stageFilter === f.id ? "btn-primary" : ""}`}
                onClick={() => setStageFilter(f.id)}
                style={{ borderRadius: "20px", padding: "0.4rem 1.2rem", fontSize: "0.8rem", background: stageFilter === f.id ? "" : "transparent", border: "none", color: stageFilter === f.id ? "#000" : "var(--text-muted)", fontWeight: "bold" }}
              >
                {f.label}
              </button>
            ))}
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
                      <Trophy size={14} style={{ color: "var(--primary-gold)" }} />
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
