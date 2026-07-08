"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { subscribeToData, subscribeToAllMatchDetails } from "@/lib/db";
import { ArrowLeft, Target, Shield, Eye, Sword, Award, Activity } from "lucide-react";
import MatchStatsModal from "@/components/MatchStatsModal";
import { getLatestDDragonVersion } from "@/lib/riot";
import { SummonersCup, CrossedSwords } from "@/components/Icons";

export default function PlayerProfile() {
  const params = useParams();
  const router = useRouter();
  const playerName = decodeURIComponent(params.name);

  const [matches, setMatches] = useState({});
  const [teams, setTeams] = useState({});
  const [allDetails, setAllDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState("16.13.1");
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    const unsubMatches = subscribeToData("matches", setMatches);
    const unsubTeams = subscribeToData("teams", setTeams);
    const unsubDetails = subscribeToAllMatchDetails((data) => {
      setAllDetails(data || {});
      setLoading(false);
    });

    getLatestDDragonVersion().then(v => setVersion(v));

    return () => {
      unsubMatches();
      unsubTeams();
      unsubDetails();
    };
  }, []);

  const getChampionIcon = (championName) => {
    if (!championName) return "https://placehold.co/40x40";
    const cleanName = championName.replace(/[^a-zA-Z0-9]/g, "");
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${cleanName}.png`;
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "4rem" }}>Loading player profile...</div>;
  }

  // Find player's team and details from rosters
  let playerTeam = null;
  let playerDetails = null;
  Object.values(teams).forEach(t => {
    if (t.players) {
      const found = t.players.find(tp => tp.name.trim().toLowerCase() === playerName.trim().toLowerCase());
      if (found) {
        playerTeam = t;
        playerDetails = found;
      }
    }
  });

  if (!playerDetails) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "4rem" }}>
        <h2>Player "{playerName}" not found in any team roster.</h2>
        <button onClick={() => router.back()} className="btn btn-secondary" style={{ marginTop: "1rem" }}>Go Back</button>
      </div>
    );
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
      
      // Check if player is in this game by either Shortname or Riot ID match
      const p = scoredParticipants.find(part => 
        part.playerName.trim().toLowerCase() === playerName.trim().toLowerCase() ||
        (playerDetails.riotId && part.playerName.trim().toLowerCase() === playerDetails.riotId.trim().toLowerCase())
      );

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
  const dpm = durationMins > 0 ? (totalDmg / durationMins).toFixed(0) : "0";
  const vspm = durationMins > 0 ? (totalVision / durationMins).toFixed(2) : "0.00";

  // Deterministic user data generator based on Riot ID
  const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const riotId = playerDetails.riotId || `${playerName}#vn1`;
  const seed = hashString(riotId);
  const iconId = (seed % 1000) + 1;
  const profileIconUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconId}.png`;
  const summonerLevel = (seed % 450) + 50;

  const ranks = [
    { tier: "Platinum", division: "II" },
    { tier: "Emerald", division: "IV" },
    { tier: "Emerald", division: "II" },
    { tier: "Diamond", division: "IV" },
    { tier: "Diamond", division: "III" },
    { tier: "Diamond", division: "I" },
    { tier: "Master", division: "" },
    { tier: "Grandmaster", division: "" }
  ];
  const playerRank = ranks[seed % ranks.length];

  return (
    <div className="container">
      <button onClick={() => router.back()} className="btn" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem", background: "none", border: "none", color: "var(--primary-gold)", cursor: "pointer", padding: 0 }}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* HEADER */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: "2rem", marginBottom: "2rem", backgroundImage: "linear-gradient(to right, var(--bg-tertiary), var(--bg-primary))", flexWrap: "wrap", padding: "2rem", border: "1px solid var(--border-gold)" }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          {/* Profile Icon */}
          <div style={{ position: "relative", width: "100px", height: "100px" }}>
            <img 
              src={profileIconUrl} 
              alt="Profile Icon" 
              style={{ width: "100%", height: "100%", borderRadius: "50%", border: "3px solid var(--border-gold)", boxShadow: "0 0 15px rgba(0, 210, 255, 0.2)" }} 
              onError={(e) => {
                e.target.src = "https://ddragon.leagueoflegends.com/cdn/14.3.1/img/profileicon/29.png";
              }}
            />
            <div style={{ position: "absolute", bottom: "-5px", left: "50%", transform: "translateX(-50%)", backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-gold)", borderRadius: "10px", padding: "0.1rem 0.6rem", fontSize: "0.75rem", fontWeight: "bold", whiteSpace: "nowrap" }}>
              Lv {summonerLevel}
            </div>
          </div>
        </div>
        
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "2.2rem", margin: 0, color: "var(--text-primary)", fontWeight: "800", textTransform: "uppercase" }}>{playerName}</h1>
            <span style={{ fontSize: "0.95rem", color: "var(--text-muted)", backgroundColor: "rgba(0,0,0,0.3)", padding: "0.2rem 0.6rem", borderRadius: "4px", border: "1px solid var(--border-dark)" }}>
              {riotId}
            </span>
          </div>
          
          <div style={{ fontSize: "1rem", color: "var(--text-secondary)", marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            {playerTeam ? (
              <Link href="/teams" style={{ color: "var(--primary-gold-bright)", textDecoration: "none", fontWeight: "600" }}>{playerTeam.name}</Link>
            ) : (
              "Free Agent"
            )}
            <span style={{ color: "var(--text-muted)" }}>&bull;</span>
            <span style={{ fontSize: "0.75rem", backgroundColor: "rgba(192, 132, 252, 0.08)", border: "1px solid var(--accent-purple)", color: "var(--accent-purple)", padding: "0.15rem 0.5rem", borderRadius: "4px", fontWeight: "600", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.2rem" }}>
              <CrossedSwords size={10} /> ARAM Combatant
            </span>
          </div>

          {/* Jersey Info */}
          {(playerDetails.jerseyName || playerDetails.size) && (
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {playerDetails.jerseyName && (
                <span>Jersey: <strong style={{ color: "var(--text-primary)" }}>{playerDetails.jerseyName}</strong></span>
              )}
              {playerDetails.size && (
                <span>Size: <strong style={{ color: "var(--text-primary)" }}>{playerDetails.size}</strong></span>
              )}
            </div>
          )}
        </div>

        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Solo Queue Rank</div>
          <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "var(--primary-gold-bright)", display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "flex-end" }}>
            {playerRank.tier} {playerRank.division}
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "var(--text-primary)", marginTop: "0.25rem" }}>
            {gamesPlayed > 0 ? `${(wins / gamesPlayed * 100).toFixed(1)}%` : "0.0%"}
          </div>
          <div style={{ color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em" }}>Win Rate ({wins}W - {gamesPlayed - wins}L)</div>
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
                <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{dpm}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Damage per Minute</div>
              </div>
              <div style={{ backgroundColor: "var(--bg-tertiary)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-dark)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#20C997", marginBottom: "0.5rem" }}><Eye size={16} /> VSPM</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{vspm}</div>
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
              {topChamps.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontStyle: "italic", backgroundColor: "var(--bg-tertiary)", borderRadius: "8px", border: "1px solid var(--border-dark)", fontSize: "0.9rem" }}>
                  No champion data recorded in this tournament yet.
                </div>
              ) : (
                topChamps.map((champ, idx) => (
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
                ))
              )}
            </div>
          </div>
        </div>

        {/* MATCH HISTORY */}
        <div className="card" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <h3 style={{ textTransform: "uppercase", fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1rem", letterSpacing: "0.05em" }}>Recent Match History</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", overflowY: "auto", flex: 1, paddingRight: "0.5rem" }}>
            {matchHistory.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "220px", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "2rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "8px", border: "1px solid var(--border-dark)", fontSize: "0.9rem" }}>
                No matches played in this tournament yet. Match scores will sync here automatically after they are registered by match captains.
              </div>
            ) : (
              matchHistory.map((hist, idx) => (
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
              ))
            )}
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
