"use client";

import { Trophy, Swords, Shield, Star, Calendar, Clock } from "lucide-react";

const ROLES = [
  { key: "top", label: "TOP", icon: "⚔️" },
  { key: "jungle", label: "JUNGLE", icon: "🌲" },
  { key: "mid", label: "MID", icon: "🔮" },
  { key: "adc", label: "BOT / ADC", icon: "🏹" },
  { key: "support", label: "SUPPORT", icon: "🛡️" },
];

export default function GrandFinalHeader({ match, team1, team2, winningTeamId }) {
  const team1Score = match?.team1Score ?? 0;
  const team2Score = match?.team2Score ?? 0;
  const isTeam1Winner = winningTeamId === team1?.id || (match?.completed && team1Score > team2Score);
  const isTeam2Winner = winningTeamId === team2?.id || (match?.completed && team2Score > team1Score);

  // Best of 5 indicator slots
  const bo5Games = [1, 2, 3, 4, 5];

  return (
    <div className="grand-final-header-card">
      {/* Top Banner Tag */}
      <div className="header-top-tag">
        <Trophy className="w-5 h-5 text-amber-400 animate-bounce" />
        <span className="trophy-title">GRAND FINALS CHAMPIONSHIP MATCH</span>
        <Trophy className="w-5 h-5 text-amber-400 animate-bounce" />
      </div>

      {/* Main Clash Area */}
      <div className="clash-container">
        {/* Team 1 */}
        <div className={`team-hero-side ${isTeam1Winner ? "winner-side" : ""}`}>
          {isTeam1Winner && <span className="winner-badge">CHAMPION</span>}
          <div className="team-logo-glow">
            {team1?.logo ? (
              <img src={team1.logo} alt={team1.name} className="team-logo-img" />
            ) : (
              <div className="team-logo-fallback">{team1?.tag || team1?.name?.substring(0, 3) || "T1"}</div>
            )}
          </div>
          <h2 className="team-name-title">{team1?.name || "Team 1"}</h2>
          <p className="team-meta-tag">{team1?.tag ? `[${team1.tag}]` : "Finalist"}</p>
        </div>

        {/* Center Versus & Score */}
        <div className="center-score-box">
          <div className="vs-badge">
            <Swords className="w-6 h-6 text-amber-400" />
            <span>VS</span>
          </div>

          {/* Current Score Display */}
          <div className="bo5-score-display">
            <span className={`score-num ${team1Score > team2Score ? "text-amber-400" : "text-white"}`}>
              {team1Score}
            </span>
            <span className="score-divider">:</span>
            <span className={`score-num ${team2Score > team1Score ? "text-amber-400" : "text-white"}`}>
              {team2Score}
            </span>
          </div>

          <div className="bo5-format-tag">BEST OF 5 SERIES</div>

          {/* Game Dots */}
          <div className="bo5-dots-wrap">
            {bo5Games.map((gNum) => {
              const played = team1Score + team2Score >= gNum;
              const isT1Win = played && gNum <= team1Score;
              const isT2Win = played && gNum > team1Score && gNum <= team1Score + team2Score;
              
              return (
                <div
                  key={gNum}
                  className={`bo5-dot ${
                    isT1Win
                      ? "t1-win"
                      : isT2Win
                      ? "t2-win"
                      : played
                      ? "played"
                      : "upcoming"
                  }`}
                  title={`Game ${gNum}`}
                >
                  <span>G{gNum}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team 2 */}
        <div className={`team-hero-side ${isTeam2Winner ? "winner-side" : ""}`}>
          {isTeam2Winner && <span className="winner-badge">CHAMPION</span>}
          <div className="team-logo-glow">
            {team2?.logo ? (
              <img src={team2.logo} alt={team2.name} className="team-logo-img" />
            ) : (
              <div className="team-logo-fallback">{team2?.tag || team2?.name?.substring(0, 3) || "T2"}</div>
            )}
          </div>
          <h2 className="team-name-title">{team2?.name || "Team 2"}</h2>
          <p className="team-meta-tag">{team2?.tag ? `[${team2.tag}]` : "Finalist"}</p>
        </div>
      </div>

      {/* Head to Head Lane Rosters */}
      {(team1?.roster || team2?.roster) && (
        <div className="lane-h2h-section">
          <h4 className="lane-h2h-heading flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>LANE MATCH-UPS & ROSTERS</span>
          </h4>

          <div className="lane-grid">
            {ROLES.map((role) => {
              const p1 = team1?.roster?.[role.key] || team1?.players?.find(p => p.role?.toLowerCase() === role.key);
              const p2 = team2?.roster?.[role.key] || team2?.players?.find(p => p.role?.toLowerCase() === role.key);
              
              const p1Name = typeof p1 === "string" ? p1 : p1?.ign || p1?.name || "-";
              const p2Name = typeof p2 === "string" ? p2 : p2?.ign || p2?.name || "-";

              return (
                <div key={role.key} className="lane-row flex items-center justify-between">
                  <div className="lane-player text-left text-amber-200 font-semibold truncate flex-1">
                    {p1Name}
                  </div>
                  <div className="lane-role-badge flex items-center gap-1.5 px-3 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-bold text-amber-400">
                    <span>{role.icon}</span>
                    <span>{role.label}</span>
                  </div>
                  <div className="lane-player text-right text-amber-200 font-semibold truncate flex-1">
                    {p2Name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        .grand-final-header-card {
          background: radial-gradient(circle at top center, rgba(245, 176, 65, 0.12) 0%, rgba(18, 18, 22, 0.95) 70%);
          border: 1px solid rgba(245, 176, 65, 0.3);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(245, 176, 65, 0.15);
          position: relative;
          overflow: hidden;
        }

        .header-top-tag {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 8px 16px;
          background: rgba(245, 176, 65, 0.1);
          border: 1px solid rgba(245, 176, 65, 0.3);
          border-radius: 20px;
          width: max-content;
          margin: 0 auto 24px auto;
        }

        .trophy-title {
          font-family: var(--font-header), sans-serif;
          color: #f5b041;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.1em;
        }

        .clash-container {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 20px;
          align-items: center;
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .clash-container {
            grid-template-columns: 1fr;
            text-align: center;
          }
        }

        .team-hero-side {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          padding: 16px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
        }

        .winner-side {
          background: radial-gradient(circle, rgba(245, 176, 65, 0.15) 0%, rgba(18, 18, 22, 0.4) 100%);
          border-color: rgba(245, 176, 65, 0.5);
          box-shadow: 0 0 25px rgba(245, 176, 65, 0.2);
        }

        .winner-badge {
          position: absolute;
          top: -12px;
          background: linear-gradient(135deg, #f5b041 0%, #d68910 100%);
          color: #0a0a0c;
          font-size: 10px;
          font-weight: 900;
          padding: 2px 10px;
          border-radius: 10px;
          letter-spacing: 0.1em;
          box-shadow: 0 2px 8px rgba(245, 176, 65, 0.4);
        }

        .team-logo-glow {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(26, 26, 34, 0.9);
          border: 2px solid rgba(245, 176, 65, 0.3);
          margin-bottom: 12px;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
        }

        .team-logo-img {
          max-width: 70%;
          max-height: 70%;
          object-fit: contain;
        }

        .team-logo-fallback {
          font-family: var(--font-header), sans-serif;
          font-size: 24px;
          font-weight: 900;
          color: #f5b041;
        }

        .team-name-title {
          font-family: var(--font-header), sans-serif;
          font-size: 20px;
          color: #ffffff;
          margin-bottom: 4px;
          text-align: center;
        }

        .team-meta-tag {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 600;
        }

        .center-score-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .vs-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #f5b041;
          font-weight: 900;
          font-size: 14px;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
        }

        .bo5-score-display {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: var(--font-header), sans-serif;
          font-size: 44px;
          font-weight: 900;
          line-height: 1;
          margin-bottom: 8px;
        }

        .score-divider {
          color: #475569;
        }

        .bo5-format-tag {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 0.1em;
          margin-bottom: 12px;
        }

        .bo5-dots-wrap {
          display: flex;
          gap: 6px;
        }

        .bo5-dot {
          width: 30px;
          height: 24px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: #64748b;
        }

        .bo5-dot.t1-win {
          background: rgba(245, 176, 65, 0.25);
          border-color: #f5b041;
          color: #ffe082;
        }

        .bo5-dot.t2-win {
          background: rgba(59, 130, 246, 0.25);
          border-color: #3b82f6;
          color: #93c5fd;
        }

        .lane-h2h-section {
          background: rgba(10, 10, 12, 0.6);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 16px;
          margin-top: 12px;
        }

        .lane-h2h-heading {
          font-size: 12px;
          font-weight: 800;
          color: #cbd5e1;
          letter-spacing: 0.08em;
          margin-bottom: 12px;
        }

        .lane-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .lane-row {
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
}
