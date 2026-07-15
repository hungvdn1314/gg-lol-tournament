"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";
import { LoLWard, ZhonyaHourglass, CrossedSwords } from "@/components/Icons";
import { subscribeToData } from "@/lib/db";
import { teamLogoPlaceholder } from "@/lib/placeholders";

export default function Home() {
  const [config, setConfig] = useState(null);
  const [matches, setMatches] = useState({});
  const [teams, setTeams] = useState({});
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [nextMatch, setNextMatch] = useState(null);

  useEffect(() => {
    // Subscribe to tournament configurations, matches, and teams
    const unsubConfig = subscribeToData("config", setConfig);
    const unsubMatches = subscribeToData("matches", setMatches);
    const unsubTeams = subscribeToData("teams", setTeams);

    return () => {
      unsubConfig();
      unsubMatches();
      unsubTeams();
    };
  }, []);

  // Find the next scheduled match and update countdown
  useEffect(() => {
    const matchArray = Object.values(matches);
    const scheduled = matchArray
      .filter((m) => m.status === "scheduled" && m.scheduledTime)
      .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));

    if (scheduled.length > 0) {
      const targetMatch = scheduled[0];
      setNextMatch(targetMatch);

      const interval = setInterval(() => {
        const now = new Date().getTime();
        const dest = new Date(targetMatch.scheduledTime).getTime();
        const diff = dest - now;

        if (diff > 0) {
          const d = Math.floor(diff / (1000 * 60 * 60 * 24));
          const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          setCountdown({ days: d, hours: h, minutes: m, seconds: s });
        } else {
          setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setNextMatch(null);
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    }
  }, [matches]);

  const liveMatches = Object.values(matches).filter((m) => m.status === "live");
  const recentCompleted = Object.values(matches)
    .filter((m) => m.status === "completed")
    .sort((a, b) => new Date(b.scheduledTime) - new Date(a.scheduledTime))
    .slice(0, 3);

  const upcomingMatches = Object.values(matches)
    .filter((m) => m.status === "scheduled" && m.id !== nextMatch?.id)
    .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime))
    .slice(0, 3);

  if (!config) {
    return (
      <div className="container" style={{ display: "flex", flexDirection: "column", gap: "2rem", paddingTop: "2rem" }}>
        <div className="skeleton" style={{ width: "100%", height: "400px", borderRadius: "8px" }}></div>
        <div className="grid-2">
          <div className="skeleton" style={{ width: "100%", height: "200px", borderRadius: "8px" }}></div>
          <div className="skeleton" style={{ width: "100%", height: "200px", borderRadius: "8px" }}></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="hero-banner">
        {/* Company Logo at top */}
        <div style={{ marginBottom: "1.25rem" }}>
          <img 
            src="/company_logo.png" 
            alt="Gear Games Logo" 
            style={{ height: "38px", objectFit: "contain", filter: "drop-shadow(0 0 10px rgba(255,255,255,0.15))" }}
          />
        </div>
        
        {/* Slanted LEAGUE OF LEGENDS badge */}
        <div className="poster-badge">
          <span>League of Legends</span>
        </div>
        
        {/* Metallic gradient CHAMPIONSHIP title */}
        <div>
          <h1 className="poster-title" style={{ fontSize: "clamp(1.8rem, 5.5vw, 3.8rem)", letterSpacing: "0.03em" }}>Gear Games LoL Championship</h1>
        </div>
        
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem" }}>
            <ZhonyaHourglass size={18} className="text-primary-gold" style={{ color: "var(--primary-gold)" }} />
            <span>{config.date}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem" }}>
            <LoLWard size={18} className="text-primary-gold" style={{ color: "var(--primary-gold)" }} />
            <span>{config.venue}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/schedule" className="btn btn-primary">
            View Schedule
          </Link>
          <Link href="/leaderboard" className="btn btn-secondary">
            View Standings
          </Link>
        </div>
      </section>

      {/* Event Timeline & Next Match Countdown Section */}
      <section style={{ padding: "4rem 0", backgroundColor: "#0A0A0C", borderBottom: "1px solid var(--border-dark)" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: nextMatch ? "repeat(auto-fit, minmax(320px, 1fr))" : "1fr", gap: "3rem", alignItems: "center" }}>
            
            {/* Left Column: Timeline */}
            <div>
              <div style={{ marginBottom: "2rem" }}>
                <span className="hero-badge" style={{ borderColor: "var(--primary-gold)", color: "var(--primary-gold)", background: "rgba(245, 176, 65, 0.08)", margin: 0 }}>Tournament Schedule</span>
                <h2 style={{ fontSize: "1.75rem", color: "var(--text-primary)", margin: "0.5rem 0", textTransform: "uppercase" }}>Event Timeline</h2>
              </div>
              
              <div className="timeline-container side-view" style={{ margin: "0", padding: "1rem 0" }}>
                {/* Timeline Item 1: Group Stage */}
                <div className="timeline-item">
                  <div className="timeline-node"></div>
                  <div className="timeline-content">
                    <div className="timeline-date-badge">
                      <span>Jul 22 - Jul 24</span>
                    </div>
                    <h3 className="timeline-stage-title">Group Stage</h3>
                  </div>
                </div>

                {/* Timeline Item 2: Playoffs */}
                <div className="timeline-item">
                  <div className="timeline-node"></div>
                  <div className="timeline-content">
                    <div className="timeline-date-badge">
                      <span>Jul 27 - Jul 30</span>
                    </div>
                    <h3 className="timeline-stage-title">Playoffs</h3>
                  </div>
                </div>

                {/* Timeline Item 3: Grand Final */}
                <div className="timeline-item">
                  <div className="timeline-node"></div>
                  <div className="timeline-content">
                    <div className="timeline-date-badge">
                      <span>Aug 3</span>
                    </div>
                    <h3 className="timeline-stage-title final">
                      🏆 Grand Final
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Countdown */}
            {nextMatch && (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div className="card card-hud" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "340px", width: "100%", margin: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--primary-gold)", textTransform: "uppercase", fontSize: "0.8rem", fontWeight: "700", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
                    <ZhonyaHourglass size={14} className="indicator-pulse" style={{ color: "var(--primary-gold)" }} /> Next Match Countdown
                  </div>
                  <h3 style={{ fontSize: "1.1rem", marginBottom: "1.5rem", textAlign: "center" }}>
                    {teams[nextMatch.teamAId]?.name || "TBD"} vs {teams[nextMatch.teamBId]?.name || "TBD"}
                  </h3>
                  
                  <div className="countdown-section">
                    <div className="countdown-box">
                      <div className="countdown-val">{String(countdown.days).padStart(2, "0")}</div>
                      <div className="countdown-lbl">Days</div>
                    </div>
                    <div className="countdown-box">
                      <div className="countdown-val">{String(countdown.hours).padStart(2, "0")}</div>
                      <div className="countdown-lbl">Hrs</div>
                    </div>
                    <div className="countdown-box">
                      <div className="countdown-val">{String(countdown.minutes).padStart(2, "0")}</div>
                      <div className="countdown-lbl">Mins</div>
                    </div>
                    <div className="countdown-box">
                      <div className="countdown-val">{String(countdown.seconds).padStart(2, "0")}</div>
                      <div className="countdown-lbl">Secs</div>
                    </div>
                  </div>
                  <div style={{ marginTop: "1.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Scheduled for: {new Date(nextMatch.scheduledTime).toLocaleString()}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* Main Home Sections */}
      <div className="container" style={{ marginTop: "3rem" }}>
        {/* Live Match Alert */}
        {liveMatches.length > 0 && (
          <div style={{ marginBottom: "3rem" }}>
            <h2 style={{ textTransform: "uppercase", fontSize: "1.25rem", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.5rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--color-danger)", display: "inline-block", animation: "pulse-live 1.5s infinite" }}></span>
              Live Matches Now
            </h2>
            <div className="grid-1">
              {liveMatches.map((match) => {
                const teamA = teams[match.teamAId];
                const teamB = teams[match.teamBId];
                return (
                  <div key={match.id} className="card card-gold" style={{ padding: "1.5rem 2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                      <span className="match-status-badge live">Live Now</span>
                      <span className="countdown-lbl" style={{ color: "var(--text-muted)" }}>{match.stage} {match.group ? `(Group ${match.group})` : ""} &bull; Bo{match.bestOf}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "1.5rem 0", flexWrap: "wrap", gap: "1.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, justifyContent: "flex-end", textAlign: "right" }}>
                        <h3 className="match-team-name">{teamA?.name || "TBD"}</h3>
                        <img src={teamA?.logo || teamLogoPlaceholder(teamA?.name, 100)} alt={teamA?.name} className="match-team-logo" />
                      </div>
                      <div className="match-scores" style={{ margin: "0 2rem", scale: "1.2" }}>
                        <span className="score-digit">{match.scoreA}</span>
                        <span className="score-divider">:</span>
                        <span className="score-digit">{match.scoreB}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, justifyContent: "flex-start", textAlign: "left" }}>
                        <img src={teamB?.logo || teamLogoPlaceholder(teamB?.name, 100)} alt={teamB?.name} className="match-team-logo" />
                        <h3 className="match-team-name">{teamB?.name || "TBD"}</h3>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <Link href="/schedule" className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}>
                        Match Details <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent & Upcoming Matches Section */}
        <div className="grid-2" style={{ marginTop: "3rem" }}>
          {/* Upcoming Matches */}
          <div>
            <h2 style={{ textTransform: "uppercase", fontSize: "1.15rem", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>Upcoming Matches</h2>
            {upcomingMatches.length === 0 && !nextMatch ? (
              <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No upcoming matches scheduled.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {nextMatch && (
                  <div className="match-strip" style={{ borderColor: "var(--primary-gold)" }}>
                    <div className="match-team team-a">
                      <span className="match-team-name">{teams[nextMatch.teamAId]?.name || "TBD"}</span>
                    </div>
                    <div className="match-score-center">
                      <span className="match-status-badge scheduled">Next Up</span>
                      <span className="countdown-lbl" style={{ fontSize: "0.65rem", marginTop: "0.25rem" }}>
                        {new Date(nextMatch.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="match-team team-b">
                      <span className="match-team-name">{teams[nextMatch.teamBId]?.name || "TBD"}</span>
                    </div>
                  </div>
                )}
                {upcomingMatches.map((match) => (
                  <div key={match.id} className="match-strip">
                    <div className="match-team team-a">
                      <span className="match-team-name">{teams[match.teamAId]?.name || "TBD"}</span>
                    </div>
                    <div className="match-score-center">
                      <span className="match-status-badge scheduled">Scheduled</span>
                      <span className="countdown-lbl" style={{ fontSize: "0.65rem", marginTop: "0.25rem" }}>
                        {new Date(match.scheduledTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="match-team team-b">
                      <span className="match-team-name">{teams[match.teamBId]?.name || "TBD"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Results */}
          <div>
            <h2 style={{ textTransform: "uppercase", fontSize: "1.15rem", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>Recent Results</h2>
            {recentCompleted.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No matches completed yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {recentCompleted.map((match) => {
                  const teamA = teams[match.teamAId];
                  const teamB = teams[match.teamBId];
                  return (
                    <div key={match.id} className="match-strip">
                      <div className="match-team team-a" style={{ opacity: match.winnerId === match.teamAId ? 1 : 0.6 }}>
                        <span className="match-team-name" style={{ fontWeight: match.winnerId === match.teamAId ? "800" : "500" }}>{teamA?.name}</span>
                      </div>
                      <div className="match-score-center">
                        <div className="match-scores">
                          <span className="score-digit" style={{ color: match.winnerId === match.teamAId ? "var(--primary-gold-bright)" : "var(--text-secondary)" }}>{match.scoreA}</span>
                          <span className="score-divider">:</span>
                          <span className="score-digit" style={{ color: match.winnerId === match.teamBId ? "var(--primary-gold-bright)" : "var(--text-secondary)" }}>{match.scoreB}</span>
                        </div>
                        <span className="countdown-lbl" style={{ fontSize: "0.65rem", marginTop: "0.25rem" }}>{match.stage}</span>
                      </div>
                      <div className="match-team team-b" style={{ opacity: match.winnerId === match.teamBId ? 1 : 0.6 }}>
                        <span className="match-team-name" style={{ fontWeight: match.winnerId === match.teamBId ? "800" : "500" }}>{teamB?.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
