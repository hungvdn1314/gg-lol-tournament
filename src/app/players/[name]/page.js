"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { subscribeToData, subscribeToAllMatchDetails } from "@/lib/db";
import { ArrowLeft, Target, Shield, Eye, Sword, Award, Activity } from "lucide-react";
import MatchStatsModal from "@/components/MatchStatsModal";

export default function PlayerProfile() {
  const params = useParams();
  const router = useRouter();
  const playerName = decodeURIComponent(params.name);

  const [matches, setMatches] = useState({});
  const [teams, setTeams] = useState({});
  const [allDetails, setAllDetails] = useState({});
  const [loading, setLoading] = useState(true);

  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    const unsubMatches = subscribeToData("matches", setMatches);
    const unsubTeams = subscribeToData("teams", setTeams);
    const unsubDetails = subscribeToAllMatchDetails((data) => {
      setAllDetails(data || {});
      setLoading(false);
    });

    return () => {
      unsubMatches();
      unsubTeams();
      unsubDetails();
    };
  }, []);

  const getChampionIcon = (championName) => {
    if (!championName) return "https://placehold.co/40x40";
    const cleanName = championName.replace(/[^a-zA-Z0-9]/g, "");
    return `https://ddragon.leagueoflegends.com/cdn/16.12.1/img/champion/${cleanName}.png`;
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "4rem" }}>Loading player profile...</div>;
  }

  // Aggregate stats
  let totalKills = 0, totalDeaths = 0, totalAssists = 0;
  let totalDmg = 0, totalDmgTaken = 0, totalVision = 0, totalCS = 0, totalGold = 0;
  let totalGameDuration = 0;
  let matchMvps = 0;
  let gamesPlayed = 0;
  let wins = 0;
  const champStats = {}; // { champName: { games, wins, kills, deaths, assists } }
  const matchHistory = []; // list of game objects

  // Helper MVP calculation from ranking page
  const calculateMVP = (participants, bKills, rKills, bDmg, rDmg, bGold, rGold, gameDuration) => {
    if (!participants || participants.length === 0) return [];
    const durationMins = gameDuration / 60;
    return participants.map(p => {
      const teamKills = p.teamId === 100 ? bKills : rKills;
      const teamDmg = p.teamId === 100 ? bDmg : rDmg;
      const teamGold = p.teamId === 100 ? bGold : rGold;

      const kda = p.deaths === 0 ? (p.kills + p.assists) * 1.5 : (p.kills + p.assists) / p.deaths;
      const kp = teamKills > 0 ? (p.kills + p.assists) / teamKills : 0;
      const damageShare = teamDmg > 0 ? (p.damageDealt || 0) / teamDmg : 0;
      const goldShare = teamGold > 0 ? (p.gold || 0) / teamGold : 0;
      const visionPerMin = (p.vision || 0) / durationMins;

      const kdaScore = Math.min(kda * 0.5, 3.0);
      const kpScore = kp * 2.5;
      const dmgScore = damageShare * 2.0;
      const goldScore = goldShare * 1.5;
      const visionScore = Math.min(visionPerMin, 1.0);
      const winBonus = p.win ? 1.0 : 0;

      const totalScore = kdaScore + kpScore + dmgScore + goldScore + visionScore + winBonus;
      return { ...p, mvpScore: totalScore };
    });
  };

  Object.entries(allDetails).forEach(([matchId, seriesDetails]) => {
    const parentMatch = matches[matchId];
    if (!parentMatch) return;

    const games = Array.isArray(seriesDetails) ? seriesDetails : [seriesDetails];

    games.forEach((game, gameIdx) => {
      if (!game.participants) return;
      
      const bKills = game.participants.filter(p => p.teamId === 100).reduce((sum, p) => sum + (p.kills || 0), 0);
      const rKills = game.participants.filter(p => p.teamId === 200).reduce((sum, p) => sum + (p.kills || 0), 0);
      const bDmg = game.participants.filter(p => p.teamId === 100).reduce((sum, p) => sum + (p.damageDealt || 0), 0);
      const rDmg = game.participants.filter(p => p.teamId === 200).reduce((sum, p) => sum + (p.damageDealt || 0), 0);
      const bGold = game.participants.filter(p => p.teamId === 100).reduce((sum, p) => sum + (p.gold || 0), 0);
      const rGold = game.participants.filter(p => p.teamId === 200).reduce((sum, p) => sum + (p.gold || 0), 0);
      
      const scoredParticipants = calculateMVP(game.participants, bKills, rKills, bDmg, rDmg, bGold, rGold, game.gameDuration);
      
      // Check if player is in this game
      const p = scoredParticipants.find(part => part.playerName === playerName);
      if (p) {
        gamesPlayed++;
        if (p.win) wins++;
        totalKills += (p.kills || 0);
        totalDeaths += (p.deaths || 0);
        totalAssists += (p.assists || 0);
        totalDmg += (p.damageDealt || 0);
        totalDmgTaken += (p.damageTaken || 0);
        totalVision += (p.vision || 0);
        totalCS += (p.cs || 0);
        totalGold += (p.gold || 0);
        totalGameDuration += (game.gameDuration || 0);

        // Check MVP
        const topMvpScore = Math.max(...scoredParticipants.map(sp => sp.mvpScore));
        if (p.mvpScore === topMvpScore) matchMvps++;

        // Champ stats
        if (!champStats[p.champion]) {
          champStats[p.champion] = { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
        }
        champStats[p.champion].games++;
        if (p.win) champStats[p.champion].wins++;
        champStats[p.champion].kills += p.kills || 0;
        champStats[p.champion].deaths += p.deaths || 0;
        champStats[p.champion].assists += p.assists || 0;

        // History
        const enemyTeamId = p.teamId === 100 ? parentMatch.teamBId : parentMatch.teamAId;
        matchHistory.push({
          parentMatch,
          gameIdx,
          game,
          playerStats: p,
          enemyTeam: teams[enemyTeamId]?.name || "Unknown Team"
        });
      }
    });
  });

  if (gamesPlayed === 0) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "4rem" }}>
        <h2>Player not found or has no recorded matches.</h2>
        <button onClick={() => router.back()} className="btn btn-secondary" style={{ marginTop: "1rem" }}>Go Back</button>
      </div>
    );
  }

  // Sort history newest first
  matchHistory.sort((a, b) => b.parentMatch.id.localeCompare(a.parentMatch.id) || b.gameIdx - a.gameIdx);

  // Top champs
  const topChamps = Object.entries(champStats)
    .map(([champ, stats]) => ({
      champ,
      ...stats,
      winRate: (stats.wins / stats.games) * 100,
      kda: stats.deaths === 0 ? stats.kills + stats.assists : (stats.kills + stats.assists) / stats.deaths
    }))
    .sort((a, b) => b.games - a.games || b.winRate - a.winRate)
    .slice(0, 3);

  const durationMins = totalGameDuration / 60;
  const overallKda = totalDeaths === 0 ? totalKills + totalAssists : ((totalKills + totalAssists) / totalDeaths);

  // Find player's team
  let playerTeam = null;
  Object.values(teams).forEach(t => {
    if (t.players && t.players.some(tp => tp.name === playerName)) {
      playerTeam = t;
    }
  });

  return (
    <div className="container">
      <button onClick={() => router.back()} className="btn" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem", background: "none", border: "none", color: "var(--primary-gold)", cursor: "pointer", padding: 0 }}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* HEADER */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: "2rem", marginBottom: "2rem", backgroundImage: "linear-gradient(to right, var(--bg-tertiary), var(--bg-primary))" }}>
        <div style={{ position: "relative" }}>
          <img src={playerTeam?.logo || "https://placehold.co/150x150"} alt="Team" style={{ width: "120px", height: "120px", borderRadius: "8px", objectFit: "cover", border: "2px solid var(--primary-gold)" }} />
        </div>
        <div>
          <h1 style={{ fontSize: "3rem", margin: 0, color: "var(--primary-gold)", textTransform: "uppercase" }}>{playerName}</h1>
          <div style={{ fontSize: "1.2rem", color: "var(--text-secondary)", marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {playerTeam ? playerTeam.name : "Free Agent"} 
            <span style={{ fontSize: "0.8rem", backgroundColor: "var(--bg-lighter)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
              {playerTeam?.players?.find(p => p.name === playerName)?.role || "Flex"}
            </span>
          </div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "var(--text-primary)" }}>{(wins / gamesPlayed * 100).toFixed(1)}%</div>
          <div style={{ color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.8rem", letterSpacing: "0.05em" }}>Win Rate ({wins}W - {gamesPlayed - wins}L)</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
        
        {/* LIFETIME STATS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className="card">
            <h3 style={{ textTransform: "uppercase", fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1rem", letterSpacing: "0.05em" }}>Career Statistics</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ backgroundColor: "var(--bg-tertiary)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-dark)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--primary-gold)", marginBottom: "0.5rem" }}><Target size={16} /> KDA Ratio</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{overallKda.toFixed(2)}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{totalKills} / {totalDeaths} / {totalAssists}</div>
              </div>
              <div style={{ backgroundColor: "var(--bg-tertiary)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-dark)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-danger)", marginBottom: "0.5rem" }}><Sword size={16} /> DPM</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{(totalDmg / durationMins).toFixed(0)}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Damage per Minute</div>
              </div>
              <div style={{ backgroundColor: "var(--bg-tertiary)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-dark)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#20C997", marginBottom: "0.5rem" }}><Eye size={16} /> VSPM</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{(totalVision / durationMins).toFixed(2)}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Vision Score/Min</div>
              </div>
              <div style={{ backgroundColor: "var(--bg-tertiary)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-dark)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#D4AF37", marginBottom: "0.5rem" }}><Award size={16} /> Match MVPs</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{matchMvps}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Player of the Game</div>
              </div>
            </div>
          </div>

          {/* TOP CHAMPIONS */}
          <div className="card">
            <h3 style={{ textTransform: "uppercase", fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1rem", letterSpacing: "0.05em" }}>Most Played Champions</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {topChamps.map((champ, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.8rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "8px", border: "1px solid var(--border-dark)" }}>
                  <img src={getChampionIcon(champ.champ)} alt={champ.champ} style={{ width: "48px", height: "48px", borderRadius: "50%", border: "2px solid var(--primary-gold)" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{champ.champ}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{champ.kda.toFixed(2)} KDA ({champ.kills}/{champ.deaths}/{champ.assists})</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: "bold", color: champ.winRate >= 50 ? "var(--primary-gold)" : "var(--color-danger)" }}>{champ.winRate.toFixed(0)}%</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{champ.games} Games</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MATCH HISTORY */}
        <div className="card" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <h3 style={{ textTransform: "uppercase", fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1rem", letterSpacing: "0.05em" }}>Recent Match History</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", overflowY: "auto", flex: 1, paddingRight: "0.5rem" }}>
            {matchHistory.map((hist, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedMatch(hist.parentMatch)}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "1rem", 
                  padding: "1rem", 
                  backgroundColor: hist.playerStats.win ? "rgba(0, 90, 130, 0.2)" : "rgba(130, 0, 0, 0.2)", 
                  borderLeft: `4px solid ${hist.playerStats.win ? "#005A82" : "#820000"}`,
                  borderRadius: "0 8px 8px 0",
                  cursor: "pointer",
                  transition: "transform 0.1s"
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = "translateX(5px)"}
                onMouseOut={(e) => e.currentTarget.style.transform = "none"}
              >
                <img src={getChampionIcon(hist.playerStats.champion)} alt={hist.playerStats.champion} style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: "bold", color: hist.playerStats.win ? "var(--primary-gold)" : "var(--text-primary)" }}>
                    {hist.playerStats.win ? "VICTORY" : "DEFEAT"} <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: "normal" }}>vs {hist.enemyTeam}</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {hist.parentMatch.stage} - Game {hist.gameIdx + 1}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: "bold", fontSize: "1rem" }}>{hist.playerStats.kills}/{hist.playerStats.deaths}/{hist.playerStats.assists}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {hist.playerStats.deaths === 0 ? "Perfect" : ((hist.playerStats.kills + hist.playerStats.assists) / hist.playerStats.deaths).toFixed(2) + " KDA"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {selectedMatch && (
        <MatchStatsModal 
          match={selectedMatch} 
          teams={teams} 
          onClose={() => setSelectedMatch(null)} 
        />
      )}
    </div>
  );
}
