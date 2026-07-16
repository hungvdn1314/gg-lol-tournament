"use client";

import { useState } from "react";
import { BookOpen, Trophy, Shield, Info, Swords, Users, Key, HelpCircle } from "lucide-react";

export default function RulesPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview & Format", icon: <BookOpen size={16} /> },
    { id: "group", label: "Group Stage", icon: <Swords size={16} /> },
    { id: "playoffs", label: "Playoffs", icon: <Trophy size={16} /> },
    { id: "prizes", label: "Prizes & MVP", icon: <Trophy size={16} /> },
    { id: "login", label: "Game Login", icon: <Key size={16} /> },
    { id: "general", label: "General Rules", icon: <Shield size={16} /> }
  ];

  return (
    <div className="container" style={{ paddingTop: "1rem" }}>
      <div style={{ textAlign: "center", marginBottom: "3rem", position: "relative", paddingTop: "1.5rem" }}>
        <span className="hero-badge" style={{ backgroundColor: "rgba(245,176,65,0.08)", border: "1px solid var(--border-gold)", color: "var(--primary-gold)", textTransform: "uppercase", fontSize: "0.8rem", fontWeight: "700", padding: "0.3rem 1rem", borderRadius: "20px", display: "inline-block", marginBottom: "1rem" }}>Tournament Guidelines</span>
        <h1 style={{ fontSize: "2.8rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem", background: "linear-gradient(to bottom, #FFFFFF, var(--primary-gold-bright))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Rules &amp; Regulations</h1>
        <p style={{ color: "var(--text-muted)", maxWidth: "600px", margin: "0 auto", fontSize: "0.95rem", lineHeight: "1.6" }}>
          Official format, guidelines, and policies for the Gear Games League of Legend Championship 2026.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: "2rem", minHeight: "500px" }} className="admin-grid">
        {/* Navigation Tabs */}
        <aside style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`admin-nav-item ${activeTab === tab.id ? "active" : ""}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                width: "100%",
                padding: "0.75rem 1rem",
                border: "none",
                borderRadius: "4px",
                textAlign: "left",
                fontSize: "0.9rem",
                fontWeight: "600",
                cursor: "pointer",
                background: "transparent",
                color: activeTab === tab.id ? "var(--primary-gold-bright)" : "var(--text-secondary)",
                transition: "all var(--transition-speed) ease"
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Tab Contents */}
        <main className="card" style={{ border: "1px solid var(--border-dark)", padding: "2rem" }}>
          
          {/* TAB 1: OVERVIEW & FORMAT */}
          {activeTab === "overview" && (
            <div>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "var(--primary-gold-bright)", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.5rem" }}>1. Tournament Overview</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                <p><strong>Tournament Name:</strong> Gear Games League of Legend Championship 2026</p>
                <p><strong>Date:</strong> July 22 - August 3, 2026</p>
                <p><strong>Game Mode:</strong> ARAM Mayhem – 5v5</p>
                <p><strong>Number of Teams:</strong> 9 teams</p>
                <p><strong>Game Patch:</strong> The latest patch at the time of the opening match is used consistently throughout the tournament, except in cases of a mandatory publisher update.</p>
                
                <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "rgba(245, 176, 65, 0.05)", border: "1px solid var(--border-gold)", borderRadius: "4px" }}>
                  <h3 style={{ fontSize: "1rem", color: "var(--primary-gold)", marginBottom: "0.5rem" }}>The 9 Registered Teams</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", fontSize: "0.85rem" }}>
                    <div>&bull; Kỳ Lân Parky</div>
                    <div>&bull; 36 Lõi Kim Cương</div>
                    <div>&bull; TEAM 4ĐTL</div>
                    <div>&bull; TEAM Liên minh đá bay</div>
                    <div>&bull; U40-500KG</div>
                    <div>&bull; Gap Vibe</div>
                    <div>&bull; BoDoi</div>
                    <div>&bull; Pick Me</div>
                    <div>&bull; TEAM SIUUUUUU</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GROUP STAGE */}
          {activeTab === "group" && (
            <div>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "var(--primary-gold-bright)", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.5rem" }}>2. Group Stage Format</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <li>The 9 teams are drawn evenly into 3 groups: Group A, Group B, and Group C (3 teams each).</li>
                  <li>Within each group, teams play a single round-robin against the other teams in their group.</li>
                  <li><strong>Match Format:</strong> Best-of-3 (Bo3) series.</li>
                  <li><strong>Scoring System:</strong> Win = 3 points | Loss = 0 points.</li>
                  <li>At the end of the Group Stage, the top 2 teams in each group advance to the Playoffs.</li>
                </ul>

                <h3 style={{ fontSize: "1.1rem", color: "var(--primary-gold)", marginTop: "1.5rem", marginBottom: "0.75rem" }}>3. Standings Tie-breaker Criteria</h3>
                <p style={{ fontSize: "0.9rem" }}>If two or more teams are tied in points at the end of the group stage, standings will be resolved using the following order of criteria:</p>
                <ol style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.85rem" }}>
                  <li><strong>Head-to-head record:</strong> Direct match result between the tied teams.</li>
                  <li><strong>Game differential:</strong> Game wins minus game losses (e.g. +1, -1).</li>
                  <li><strong>Kill differential:</strong> Total kills minus total deaths in all group matches.</li>
                  <li><strong>Total completion time:</strong> Comparing total game completion time (faster wins favored).</li>
                  <li><strong>Random draw:</strong> Conducted if all above values remain identical.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: PLAYOFFS */}
          {activeTab === "playoffs" && (
            <div>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "var(--primary-gold-bright)", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.5rem" }}>4. Playoffs Format (6 Teams)</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                <p>The 6 advancing teams (Top 2 from Groups A, B, and C) compete in a Double Elimination bracket (Winners & Losers bracket). A team must lose 2 matches to be eliminated from the tournament.</p>
                
                <h3 style={{ fontSize: "1.1rem", color: "var(--primary-gold)", marginTop: "1rem", marginBottom: "0.75rem" }}>Playoff Bracket Structure</h3>
                <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem" }}>
                  <li><strong>Quarterfinals (Match 1 & 2):</strong> Best-of-3 (Bo3)</li>
                  <li><strong>Losers Round 1 (Match 3 & 4):</strong> Best-of-3 (Bo3)</li>
                  <li><strong>Winners Semifinals & Final (Match 5):</strong> Best-of-3 (Bo3)</li>
                  <li><strong>Losers Semifinals (Match 6):</strong> Best-of-3 (Bo3)</li>
                  <li><strong>Losers Bracket Final (Match 7):</strong> Best-of-5 (Bo5)</li>
                  <li><strong>Grand Final (Match 8):</strong> Best-of-5 (Bo5)</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: PRIZES */}
          {activeTab === "prizes" && (
            <div>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "var(--primary-gold-bright)", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.5rem" }}>5. Prize Structure</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                  <div className="card" style={{ padding: "1rem", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid var(--border-dark)" }}>
                    <h3 style={{ fontSize: "1rem", color: "var(--primary-gold)", marginBottom: "0.5rem" }}>Podium Placements</h3>
                    <ul style={{ listStyleType: "none", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <li><strong>Champion:</strong> 5,000,000 VND + Trophy & Medals</li>
                      <li><strong>Runner-up:</strong> 4,000,000 VND + Medals</li>
                      <li><strong>3rd Place:</strong> 3,000,000 VND + Medals</li>
                    </ul>
                  </div>
                  <div className="card" style={{ padding: "1rem", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid var(--border-dark)" }}>
                    <h3 style={{ fontSize: "1rem", color: "var(--primary-gold)", marginBottom: "0.5rem" }}>Special Awards</h3>
                    <ul style={{ listStyleType: "none", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <li><strong>MVPs:</strong> 300,000 VND + Certificate</li>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic", display: "block" }}>(Group Stage MVP, Playoff MVP, and Grand Final MVP)</span>
                      <li style={{ marginTop: "0.25rem" }}><strong>Pentakill:</strong> 100,000 VND per Pentakill</li>
                    </ul>
                  </div>
                </div>

                <h3 style={{ fontSize: "1.1rem", color: "var(--primary-gold)", marginBottom: "0.75rem" }}>MVP Selection Policy</h3>
                <p style={{ fontSize: "0.9rem" }}>The MVP of each match and of the tournament is determined by an automated aggregate scoring system using in-game statistics. <strong>Only players from the winning team of each game are eligible to receive MVP points/scores.</strong></p>
                <div style={{ padding: "1rem", backgroundColor: "rgba(245,176,65,0.05)", border: "1px solid var(--border-gold)", borderRadius: "4px", fontSize: "0.85rem" }}>
                  <strong>MVP Score Formula (Out of 1000):</strong><br />
                  <code>MVP Score = 45% Kill Participation + 20% Damage Share + 15% Damage Taken Share + 10% Healing Share + 10% KDA Share</code>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GAME LOGIN */}
          {activeTab === "login" && (
            <div>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "var(--primary-gold-bright)", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.5rem" }}>6. Game Login Regulations</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                <p>Players are free to choose their in-game name (IGN), but inappropriate or offensive names are strictly prohibited.</p>
                
                <ol style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem" }}>
                  <li><strong>Remind:</strong> At the start of each match day, the Organizing Committee (OC) will create a daily match thread to remind the teams of the schedule on Slack.</li>
                  <li><strong>Confirm:</strong> Team captains must comment to confirm their team's attendance in the thread.</li>
                  <li><strong>Host Room:</strong> At match time, one of the captains will host a Custom Room.</li>
                  <li><strong>Settings:</strong> 
                    <ul style={{ paddingLeft: "1.25rem", marginTop: "0.25rem", fontSize: "0.85rem" }}>
                      <li>Room Name: <code>Group [A/B/C] | [Match Date]</code></li>
                      <li>Password: <code>geargames</code></li>
                    </ul>
                  </li>
                  <li><strong>Share:</strong> The host captain must share the room info in the match thread so players from both regions can join.</li>
                  <li><strong>Reporting:</strong> After the match, one of the team captains must take a screenshot of the match results and post it in the thread to confirm the outcome.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 6: GENERAL RULES */}
          {activeTab === "general" && (
            <div>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "var(--primary-gold-bright)", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.5rem" }}>7. General Rules & Policies</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", color: "var(--text-secondary)", lineHeight: "1.6", fontSize: "0.9rem" }}>
                
                <h3 style={{ fontSize: "1.1rem", color: "var(--primary-gold)", marginBottom: "0.5rem" }}>Attendance & Tardiness</h3>
                <p>Teams must arrive and be ready to play on schedule. If a team is more than 15 minutes late without a valid reason, the match will still begin. The shorthanded team must play with their current number of players (e.g. 4v5), and no match postponements will be granted.</p>

                <h3 style={{ fontSize: "1.1rem", color: "var(--primary-gold)", marginTop: "1rem", marginBottom: "0.5rem" }}>Substitute Players</h3>
                <p>The OC encourages teams to stick with their registered lineup. However, if unexpected situations happen:</p>
                <ul style={{ paddingLeft: "1.25rem" }}>
                  <li>Captain must inform the OC and their opponent by declaring the situation and stating who the substitute player will be in the daily match thread before <strong>4:30 PM</strong> on the match day.</li>
                  <li>If no substitute is available, the match is played 4v5. The schedule remains fixed unless force majeure applies (natural disasters, power outages, etc.).</li>
                </ul>

                <h3 style={{ fontSize: "1.1rem", color: "var(--primary-gold)", marginTop: "1rem", marginBottom: "0.5rem" }}>Disconnections & Remakes</h3>
                <ul style={{ paddingLeft: "1.25rem" }}>
                  <li><strong>Within first 3 minutes:</strong> The game is cancelled and remade if both teams agree or as decided by the referee.</li>
                  <li><strong>After minute 3:</strong> The game is paused. Teams are allowed up to 10 minutes to reconnect. Beyond 10 minutes, the OC decides outcome based on current status.</li>
                  <li>Deliberately disconnecting to manipulate results is strictly prohibited and subject to immediate disqualification.</li>
                </ul>

                <h3 style={{ fontSize: "1.1rem", color: "var(--primary-gold)", marginTop: "1rem", marginBottom: "0.5rem" }}>Disputes & Rulings</h3>
                <p>Any dispute over a match result must be reported to the organizer immediately after the match ends, along with supporting evidence (video, screenshots, etc.). The Organizing Committee's decision on any matter is final.</p>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
