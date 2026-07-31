"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Sparkles, Tv, Award, Calendar } from "lucide-react";
import { subscribeToData, subscribeToGrandFinalConfig, subscribeToMvpVotes } from "@/lib/db";
import GrandFinalHeader from "@/components/GrandFinalHeader";
import LivestreamPlayer from "@/components/LivestreamPlayer";
import MvpVoting from "@/components/MvpVoting";

export default function GrandFinalPage() {
  const [config, setConfig] = useState(null);
  const [matches, setMatches] = useState({});
  const [teams, setTeams] = useState({});
  const [gfConfig, setGfConfig] = useState({});
  const [mvpVotes, setMvpVotes] = useState({});

  useEffect(() => {
    const unsubConfig = subscribeToData("config", setConfig);
    const unsubMatches = subscribeToData("matches", setMatches);
    const unsubTeams = subscribeToData("teams", setTeams);
    const unsubGfConfig = subscribeToGrandFinalConfig(setGfConfig);
    const unsubMvpVotes = subscribeToMvpVotes(setMvpVotes);

    return () => {
      unsubConfig();
      unsubMatches();
      unsubTeams();
      unsubGfConfig();
      unsubMvpVotes();
    };
  }, []);

  // Find the Grand Final match
  const matchArray = Object.values(matches);
  let grandFinalMatch = null;

  if (gfConfig?.grandFinalMatchId && matches[gfConfig.grandFinalMatchId]) {
    grandFinalMatch = matches[gfConfig.grandFinalMatchId];
  } else {
    // Fallback: search by stage or round
    grandFinalMatch = matchArray.find(
      (m) =>
        m.stage === "grand_final" ||
        m.round === "Grand Finals" ||
        m.title?.toLowerCase().includes("grand final")
    ) || matchArray[matchArray.length - 1]; // Fallback to last match
  }

  // Identify Team 1 and Team 2
  const team1 = grandFinalMatch?.team1Id ? teams[grandFinalMatch.team1Id] : null;
  const team2 = grandFinalMatch?.team2Id ? teams[grandFinalMatch.team2Id] : null;

  // Identify Winning Team (from gfConfig or match result)
  let winningTeam = null;
  if (gfConfig?.winningTeamId && teams[gfConfig.winningTeamId]) {
    winningTeam = teams[gfConfig.winningTeamId];
  } else if (grandFinalMatch?.completed) {
    if ((grandFinalMatch.team1Score || 0) > (grandFinalMatch.team2Score || 0)) {
      winningTeam = team1;
    } else if ((grandFinalMatch.team2Score || 0) > (grandFinalMatch.team1Score || 0)) {
      winningTeam = team2;
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-bold tracking-wider">
            <Trophy className="w-3.5 h-3.5" />
            <span>SEASON 2026 FINALS</span>
          </div>
        </div>

        {/* Grand Final Header / Clash Banner */}
        <GrandFinalHeader
          match={grandFinalMatch}
          team1={team1}
          team2={team2}
          winningTeamId={winningTeam?.id}
        />

        {/* Livestream Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-lg font-bold text-white uppercase tracking-wide">
            <Tv className="w-5 h-5 text-amber-400" />
            <h2>GRAND FINAL BROADCAST</h2>
          </div>
          <LivestreamPlayer
            youtubeUrl={gfConfig?.youtubeUrl}
            isLive={gfConfig?.isLive ?? true}
            matchTitle={`${team1?.name || "Team 1"} vs ${team2?.name || "Team 2"} - Grand Finals`}
          />
        </section>

        {/* MVP Voting Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-lg font-bold text-white uppercase tracking-wide">
            <Award className="w-5 h-5 text-amber-400" />
            <h2>FINALS MVP FAN VOTE</h2>
          </div>
          <MvpVoting
            winningTeam={winningTeam}
            isVotingOpen={gfConfig?.isVotingOpen ?? false}
            isVotingFinished={gfConfig?.isVotingFinished ?? false}
            votes={mvpVotes}
          />
        </section>
      </div>
    </div>
  );
}
