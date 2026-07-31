"use client";

import { useState, useEffect } from "react";
import { Award, CheckCircle2, Lock, Sparkles, User, Trophy, BarChart2 } from "lucide-react";
import { submitMvpVote } from "@/lib/db";

export default function MvpVoting({ winningTeam, isVotingOpen, isVotingFinished, votes = {} }) {
  const [votedPlayerId, setVotedPlayerId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [clientMounted, setClientMounted] = useState(false);

  useEffect(() => {
    setClientMounted(true);
    const saved = localStorage.getItem("gg_lol_mvp_voted_player");
    if (saved) {
      setVotedPlayerId(saved);
    }
  }, []);

  // Compute roster candidates
  const candidates = getRosterCandidates(winningTeam);

  // Compute vote totals
  const totalVotes = Object.values(votes).reduce((acc, curr) => acc + (Number(curr) || 0), 0);

  // Determine top MVP player
  let topMvpCandidate = null;
  if (candidates.length > 0) {
    let maxVotes = -1;
    candidates.forEach((candidate) => {
      const pVotes = votes[candidate.id] || 0;
      if (pVotes > maxVotes) {
        maxVotes = pVotes;
        topMvpCandidate = candidate;
      }
    });
  }

  const handleVote = async (playerId) => {
    if (!isVotingOpen || votedPlayerId || submitting) return;
    setSubmitting(true);
    try {
      await submitMvpVote(playerId);
      setVotedPlayerId(playerId);
      if (typeof window !== "undefined") {
        localStorage.setItem("gg_lol_mvp_voted_player", playerId);
      }
    } catch (e) {
      console.error("Error submitting vote:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const showResults = votedPlayerId || isVotingFinished || !isVotingOpen;

  if (!winningTeam) {
    return (
      <div className="mvp-card-empty">
        <Lock className="w-8 h-8 text-amber-400 opacity-60 mb-2 mx-auto" />
        <h4 className="text-lg font-bold text-white mb-1">FINALS MVP VOTING LOCKED</h4>
        <p className="text-slate-400 text-sm">
          MVP Voting unlocks once the admin declares the Grand Final champion team. Check back during the live match!
        </p>
      </div>
    );
  }

  return (
    <div className="mvp-voting-container">
      {/* Header */}
      <div className="mvp-header">
        <div className="flex items-center gap-3">
          <div className="award-icon-wrap">
            <Award className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              FINALS MVP VOTING
              <span className="team-winner-tag">CHAMPION: {winningTeam.name}</span>
            </h3>
            <p className="text-xs text-slate-400">
              {isVotingFinished
                ? "Voting is closed. Official Finals MVP declared below!"
                : isVotingOpen
                ? "Vote for the most valuable player of the winning team!"
                : "Voting is currently paused by admin."}
            </p>
          </div>
        </div>

        <div className="total-votes-pill flex items-center gap-1.5">
          <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
          <span>{totalVotes} Total Votes</span>
        </div>
      </div>

      {/* Top Winner Highlight Card if Voting Finished */}
      {isVotingFinished && topMvpCandidate && (
        <div className="mvp-crown-banner">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <span>OFFICIAL FINALS MVP: </span>
          <strong className="text-amber-300 underline">{topMvpCandidate.name}</strong>
          <Trophy className="w-5 h-5 text-amber-300" />
        </div>
      )}

      {/* Player Candidate Cards Grid */}
      <div className="candidates-grid">
        {candidates.map((candidate) => {
          const pVotes = votes[candidate.id] || 0;
          const percentage = totalVotes > 0 ? Math.round((pVotes / totalVotes) * 100) : 0;
          const isUserVotedThis = votedPlayerId === candidate.id;
          const isTopMvp = topMvpCandidate?.id === candidate.id && isVotingFinished;

          return (
            <div
              key={candidate.id}
              className={`candidate-card ${isUserVotedThis ? "user-voted" : ""} ${isTopMvp ? "top-mvp" : ""}`}
            >
              {isUserVotedThis && (
                <div className="voted-badge">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>YOUR VOTE</span>
                </div>
              )}

              {isTopMvp && (
                <div className="mvp-winner-badge">
                  <Trophy className="w-3.5 h-3.5 text-amber-950" />
                  <span>MVP WINNER</span>
                </div>
              )}

              {/* Avatar / Champion Image */}
              <div className="candidate-avatar-wrap">
                {candidate.avatar ? (
                  <img src={candidate.avatar} alt={candidate.name} className="candidate-avatar-img" />
                ) : (
                  <div className="candidate-avatar-fallback">
                    <User className="w-8 h-8 text-amber-400 opacity-80" />
                  </div>
                )}
              </div>

              <h4 className="candidate-name">{candidate.name}</h4>
              <p className="candidate-role">{candidate.role || "Player"}</p>

              {/* Voting Button or Results Progress Bar */}
              {isVotingOpen && !votedPlayerId && !isVotingFinished ? (
                <button
                  onClick={() => handleVote(candidate.id)}
                  disabled={submitting}
                  className="vote-action-btn"
                >
                  {submitting ? "Voting..." : "VOTE MVP"}
                </button>
              ) : (
                <div className="results-progress-wrap">
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${percentage}%` }} />
                  </div>
                  <div className="progress-stats">
                    <span className="text-amber-400 font-bold">{percentage}%</span>
                    <span className="text-slate-400 text-xs">{pVotes} votes</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .mvp-voting-container {
          background: rgba(18, 18, 22, 0.95);
          border: 1px solid rgba(245, 176, 65, 0.3);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        .mvp-card-empty {
          background: rgba(18, 18, 22, 0.8);
          border: 1px border-slate-800;
          border-radius: 16px;
          padding: 32px;
          text-align: center;
        }

        .mvp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .award-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(245, 176, 65, 0.12);
          border: 1px solid rgba(245, 176, 65, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .team-winner-tag {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 4px;
          background: rgba(245, 176, 65, 0.15);
          border: 1px solid rgba(245, 176, 65, 0.3);
          color: #f5b041;
          font-weight: 700;
        }

        .total-votes-pill {
          padding: 4px 12px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #e2e8f0;
          font-size: 12px;
          font-weight: 600;
        }

        .mvp-crown-banner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px;
          background: linear-gradient(135deg, rgba(245, 176, 65, 0.25) 0%, rgba(214, 137, 16, 0.25) 100%);
          border: 1px solid rgba(245, 176, 65, 0.5);
          border-radius: 10px;
          color: #fff;
          font-weight: 800;
          font-size: 15px;
          margin-bottom: 20px;
        }

        .candidates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
        }

        .candidate-card {
          position: relative;
          background: rgba(26, 26, 34, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: all 0.3s ease;
        }

        .candidate-card:hover {
          border-color: rgba(245, 176, 65, 0.4);
          transform: translateY(-2px);
        }

        .candidate-card.user-voted {
          border-color: rgba(16, 185, 129, 0.5);
          background: rgba(16, 185, 129, 0.05);
        }

        .candidate-card.top-mvp {
          border-color: rgba(245, 176, 65, 0.8);
          background: rgba(245, 176, 65, 0.1);
          box-shadow: 0 0 20px rgba(245, 176, 65, 0.2);
        }

        .voted-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 9px;
          font-weight: 800;
          color: #34d399;
          background: rgba(16, 185, 129, 0.15);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .mvp-winner-badge {
          position: absolute;
          top: -10px;
          background: #f5b041;
          color: #0a0a0c;
          font-size: 9px;
          font-weight: 900;
          padding: 2px 8px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .candidate-avatar-wrap {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          overflow: hidden;
          background: rgba(10, 10, 12, 0.8);
          border: 2px solid rgba(245, 176, 65, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
        }

        .candidate-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .candidate-name {
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 2px;
        }

        .candidate-role {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .vote-action-btn {
          width: 100%;
          padding: 8px;
          border-radius: 6px;
          background: linear-gradient(135deg, #f5b041 0%, #d68910 100%);
          border: none;
          color: #0a0a0c;
          font-weight: 800;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .vote-action-btn:hover {
          opacity: 0.9;
          transform: scale(1.02);
        }

        .results-progress-wrap {
          width: 100%;
          margin-top: 4px;
        }

        .progress-bar-bg {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 4px;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #f5b041 0%, #ffe082 100%);
          border-radius: 3px;
          transition: width 0.5s ease;
        }

        .progress-stats {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
        }
      `}</style>
    </div>
  );
}

function getRosterCandidates(team) {
  if (!team) return [];
  
  // If team has roster object (e.g. { top: "Player1", mid: "Player2" })
  if (team.roster && typeof team.roster === "object") {
    const roles = ["top", "jungle", "mid", "adc", "support"];
    return roles
      .filter((r) => team.roster[r])
      .map((r) => {
        const val = team.roster[r];
        return {
          id: typeof val === "string" ? `${team.id}_${r}_${val}` : val.id || val.ign,
          name: typeof val === "string" ? val : val.ign || val.name,
          role: r.toUpperCase(),
          avatar: typeof val === "object" ? val.avatar : null,
        };
      });
  }

  // If team has players array
  if (Array.isArray(team.players) && team.players.length > 0) {
    return team.players.map((p, idx) => ({
      id: p.id || p.ign || `p_${idx}`,
      name: p.ign || p.name || p,
      role: p.role || "Roster Player",
      avatar: p.avatar || null,
    }));
  }

  // Fallback 5 default player slots if roster is empty
  return [
    { id: `${team.id}_top`, name: `${team.name} Top`, role: "TOP" },
    { id: `${team.id}_jungle`, name: `${team.name} Jungle`, role: "JUNGLE" },
    { id: `${team.id}_mid`, name: `${team.name} Mid`, role: "MID" },
    { id: `${team.id}_adc`, name: `${team.name} ADC`, role: "ADC" },
    { id: `${team.id}_support`, name: `${team.name} Support`, role: "SUPPORT" },
  ];
}
