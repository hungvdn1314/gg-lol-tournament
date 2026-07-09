"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { subscribeToAllMatchDetails } from "@/lib/db";
import { SummonersCup, HextechCrest } from "@/components/Icons";
import { Award, Eye, Crosshair, Shield, Coins, Target } from "lucide-react";
import { getLatestDDragonVersion } from "@/lib/riot";

// Helper MVP calculator copied to use for aggregated logic
const calculateGameMVP = (participants, gameDuration) => {
  if (!participants || participants.length === 0) return [];

  // Calculate team-level statistics directly from participants
  const teamTotals = {
    100: { kills: 0, dmgDealt: 0, dmgTaken: 0, healing: 0 },
    200: { kills: 0, dmgDealt: 0, dmgTaken: 0, healing: 0 }
  };

  participants.forEach(p => {
    const team = teamTotals[p.teamId];
    if (team) {
      team.kills += (p.kills || 0);
      team.dmgDealt += (p.damageDealt || 0);
      team.dmgTaken += (p.damageTaken || 0);
      team.healing += (p.healing || 0);
    }
  });

  const scored = participants.map(p => {
    const team = teamTotals[p.teamId] || { kills: 0, dmgDealt: 0, dmgTaken: 0, healing: 0 };

    // 1. KDA (Max 1.5 pts) - capped at 6.0 KDA for full points, no 0-death multiplier
    const kda = (p.kills + (p.assists || 0)) / Math.max(p.deaths || 0, 1);
    const kdaScore = Math.min(kda * 0.25, 1.5);

    // 2. Kill Participation (Max 2.5 pts)
    const kp = team.kills > 0 ? (p.kills + (p.assists || 0)) / team.kills : 0;
    const kpScore = kp * 2.5;

    // 3. Damage Share (Max 2.0 pts)
    const damageShare = team.dmgDealt > 0 ? (p.damageDealt || 0) / team.dmgDealt : 0;
    const dmgScore = damageShare * 2.0;

    // 4. Defense & Utility Share (Max 2.5 pts)
    const dmgTakenShare = team.dmgTaken > 0 ? (p.damageTaken || 0) / team.dmgTaken : 0;
    const healingShare = team.healing > 0 ? (p.healing || 0) / team.healing : 0;
    const defUtilScore = Math.max(dmgTakenShare, healingShare) * 2.5;

    // 5. Objective & Hype Events (Max 1.5 pts)
    const firstBloodBonus = p.firstBlood ? 0.3 : 0;
    const turretInhibBonus = ((p.turretsKilled || 0) + (p.inhibitorsKilled || 0)) * 0.2;
    const tripleBonus = (p.tripleKills || 0) > 0 ? 0.2 : 0;
    const quadraBonus = (p.quadraKills || 0) > 0 ? 0.4 : 0;
    const pentaBonus = (p.pentaKills || 0) > 0 ? 0.6 : 0;
    const hypeScore = Math.min(firstBloodBonus + turretInhibBonus + tripleBonus + quadraBonus + pentaBonus, 1.5);

    // 6. Win Bonus (Max 1.0 pt)
    const winBonus = p.win ? 1.0 : 0;

    const totalScore = kdaScore + kpScore + dmgScore + defUtilScore + hypeScore + winBonus;

    return { ...p, totalScore };
  });
  
  return scored.sort((a, b) => b.totalScore - a.totalScore);
};

export default function PlayerRankings() {
  const [allMatches, setAllMatches] = useState({});
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("seriesMvpCount");
  const [version, setVersion] = useState("16.13.1");
  
  // Sort options
  const metrics = [
    { id: "seriesMvpCount", label: "Series MVPs", icon: <SummonersCup size={14} /> },
    { id: "matchMvpCount", label: "Match MVPs", icon: <Award size={14} /> },
    { id: "kda", label: "KDA Ratio", icon: <Crosshair size={14} /> },
    { id: "dpm", label: "DMG / Min", icon: <Target size={14} /> },
    { id: "dmgShare", label: "DMG Share %", icon: <Target size={14} /> },
    { id: "kp", label: "Kill Part %", icon: <HextechCrest size={14} /> },
    { id: "gpm", label: "Gold / Min", icon: <Coins size={14} /> },
    { id: "dmgTakenShare", label: "DMG Taken %", icon: <Shield size={14} /> },
    { id: "cspm", label: "CS / Min", icon: <Crosshair size={14} /> }
  ];

  useEffect(() => {
    const unsub = subscribeToAllMatchDetails((data) => {
      setAllMatches(data || {});
      setLoading(false);
    });

    getLatestDDragonVersion().then(v => setVersion(v));

    return unsub;
  }, []);

  const getChampionIcon = (championName) => {
    if (!championName) return "https://placehold.co/40x40";
    const cleanName = championName.replace(/[^a-zA-Z0-9]/g, "");
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${cleanName}.png`;
  };

  // Aggregate stats!
  const players = {};

  Object.entries(allMatches).forEach(([matchId, gamesArray]) => {
    if (!Array.isArray(gamesArray)) return;

    // To calculate Series MVP, we need a separate aggregator for just this series
    const seriesScores = {};

    gamesArray.forEach(game => {
      if (!game || !game.participants) return;
      
      const bP = game.participants.filter(p => p.teamId === 100);
      const rP = game.participants.filter(p => p.teamId === 200);
      const bK = bP.reduce((s, p) => s + (p.kills || 0), 0);
      const rK = rP.reduce((s, p) => s + (p.kills || 0), 0);
      const bD = bP.reduce((s, p) => s + (p.damageDealt || 0), 0);
      const rD = rP.reduce((s, p) => s + (p.damageDealt || 0), 0);
      const bG = bP.reduce((s, p) => s + (p.gold || 0), 0);
      const rG = rP.reduce((s, p) => s + (p.gold || 0), 0);
      const bDT = bP.reduce((s, p) => s + (p.damageTaken || 0), 0);
      const rDT = rP.reduce((s, p) => s + (p.damageTaken || 0), 0);

      const scored = calculateGameMVP(game.participants, game.gameDuration);
      const gameMvp = scored[0]?.playerName;

      game.participants.forEach(p => {
        if (!players[p.playerName]) {
          players[p.playerName] = {
            playerName: p.playerName,
            championCounts: {}, // to find most played champ
            gamesPlayed: 0,
            kills: 0, deaths: 0, assists: 0,
            damageDealt: 0, damageTaken: 0,
            gold: 0, cs: 0,
            teamKills: 0, teamDamageDealt: 0, teamDamageTaken: 0,
            durationMins: 0,
            matchMvpCount: 0,
            seriesMvpCount: 0
          };
        }

        const stats = players[p.playerName];
        stats.gamesPlayed += 1;
        stats.championCounts[p.champion] = (stats.championCounts[p.champion] || 0) + 1;
        
        stats.kills += (p.kills || 0);
        stats.deaths += (p.deaths || 0);
        stats.assists += (p.assists || 0);
        stats.damageDealt += (p.damageDealt || 0);
        stats.damageTaken += (p.damageTaken || 0);
        stats.gold += (p.gold || 0);
        stats.cs += (p.cs || 0);
        stats.durationMins += (game.gameDuration / 60);

        stats.teamKills += (p.teamId === 100 ? bK : rK);
        stats.teamDamageDealt += (p.teamId === 100 ? bD : rD);
        stats.teamDamageTaken += (p.teamId === 100 ? bDT : rDT);

        if (p.playerName === gameMvp) stats.matchMvpCount += 1;

        // Add to series scores
        const pScored = scored.find(s => s.playerName === p.playerName);
        if (pScored) {
          seriesScores[p.playerName] = (seriesScores[p.playerName] || 0) + pScored.totalScore;
        }
      });
    });

    // Determine Series MVP
    const seriesMvp = Object.entries(seriesScores).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (seriesMvp && players[seriesMvp]) {
      players[seriesMvp].seriesMvpCount += 1;
    }
  });

  // Calculate advanced metrics
  const rankedPlayers = Object.values(players).map(p => {
    // Most played champion
    const topChamp = Object.entries(p.championCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    
    return {
      ...p,
      topChamp,
      kda: p.deaths === 0 ? (p.kills + p.assists) : (p.kills + p.assists) / p.deaths,
      dpm: p.damageDealt / p.durationMins,
      dmgShare: p.teamDamageDealt > 0 ? (p.damageDealt / p.teamDamageDealt) * 100 : 0,
      kp: p.teamKills > 0 ? ((p.kills + p.assists) / p.teamKills) * 100 : 0,
      gpm: p.gold / p.durationMins,
      dmgTakenShare: p.teamDamageTaken > 0 ? (p.damageTaken / p.teamDamageTaken) * 100 : 0,
      cspm: p.cs / p.durationMins
    };
  });

  rankedPlayers.sort((a, b) => b[sortBy] - a[sortBy]);

  const top1 = rankedPlayers[0];
  const top2 = rankedPlayers[1];
  const top3 = rankedPlayers[2];

  const formatStat = (val, metricId) => {
    if (["seriesMvpCount", "matchMvpCount"].includes(metricId)) return `${val} MVP${val !== 1 ? 's' : ''}`;
    if (metricId === "kda") return `${val.toFixed(2)} KDA`;
    if (["dmgShare", "kp", "dmgTakenShare"].includes(metricId)) return val.toFixed(1) + "%";
    if (["dpm", "gpm", "cspm"].includes(metricId)) return `${Math.round(val).toLocaleString()}/m`;
    return `${val.toFixed(2)} pts`;
  };

  return (
    <div className="container">
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <span className="hero-badge">Player Statistics</span>
        <h1 style={{ fontSize: "2.5rem", textTransform: "uppercase", marginBottom: "1rem" }}>Tournament Rankings</h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto" }}>
          Explore the top performers across the entire tournament. Statistics are aggregated from all synchronized matches.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem" }}>Loading player stats...</div>
      ) : rankedPlayers.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
          No match telemetry available yet. Check back after games are synced!
        </div>
      ) : (
        <>
          {/* Stat Categories */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.5rem", marginBottom: "3rem" }}>
            {metrics.map(m => (
              <button
                key={m.id}
                onClick={() => setSortBy(m.id)}
                className={`btn ${sortBy === m.id ? "btn-primary" : "btn-outline"}`}
                style={{ padding: "0.4rem 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>

          {/* Top 3 Podium */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "4rem" }}>
            <h2 style={{ textTransform: "uppercase", fontSize: "1.2rem", letterSpacing: "0.05em", color: "var(--primary-gold)", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem" }}>
              {metrics.find(m => m.id === sortBy)?.icon}
              Top 3: {metrics.find(m => m.id === sortBy)?.label}
            </h2>
            
            <div className="podium-container" style={{ display: "flex", alignItems: "flex-end", gap: "1rem", marginTop: "2rem", minHeight: "300px" }}>
              {/* 2nd Place */}
              {top2 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "140px" }}>
                  <img src={getChampionIcon(top2.topChamp)} alt={top2.topChamp} style={{ width: "60px", height: "60px", borderRadius: "50%", border: "2px solid #C0C0C0", marginBottom: "0.5rem" }} />
                  <Link href={`/players/${encodeURIComponent(top2.playerName)}`} style={{ fontWeight: "bold", fontSize: "0.9rem", textAlign: "center", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", width: "100%", textDecoration: "none", color: "var(--text-primary)" }}>{top2.playerName}</Link>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>{top2.gamesPlayed} Games</div>
                  <div style={{ width: "100%", height: "120px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid #C0C0C0", borderBottom: "none", display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "center", paddingTop: "1rem" }}>
                    <div style={{ fontSize: "2rem", fontWeight: "900", color: "#C0C0C0" }}>2</div>
                    <div style={{ fontSize: "1rem", fontWeight: "bold", color: "var(--text-primary)", marginTop: "0.5rem" }}>
                      {formatStat(top2[sortBy], sortBy)}
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {top1 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "160px" }}>
                  <div style={{ position: "relative" }}>
                    <SummonersCup size={30} style={{ color: "var(--primary-gold)", position: "absolute", top: "-25px", left: "50%", transform: "translateX(-50%)" }} />
                    <img src={getChampionIcon(top1.topChamp)} alt={top1.topChamp} style={{ width: "80px", height: "80px", borderRadius: "50%", border: "3px solid var(--primary-gold)", marginBottom: "0.5rem" }} />
                  </div>
                  <Link href={`/players/${encodeURIComponent(top1.playerName)}`} style={{ fontWeight: "bold", fontSize: "1.1rem", textAlign: "center", color: "var(--primary-gold-bright)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", width: "100%", textDecoration: "none" }}>{top1.playerName}</Link>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>{top1.gamesPlayed} Games</div>
                  <div style={{ width: "100%", height: "160px", backgroundColor: "rgba(228,179,60,0.1)", border: "1px solid var(--border-gold)", borderBottom: "none", display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "center", paddingTop: "1rem", boxShadow: "0 -10px 30px rgba(228,179,60,0.15)" }}>
                    <div style={{ fontSize: "3rem", fontWeight: "900", color: "var(--primary-gold)", lineHeight: "1" }}>1</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--primary-gold-bright)", marginTop: "0.5rem" }}>
                      {formatStat(top1[sortBy], sortBy)}
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {top3 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "140px" }}>
                  <img src={getChampionIcon(top3.topChamp)} alt={top3.topChamp} style={{ width: "60px", height: "60px", borderRadius: "50%", border: "2px solid #CD7F32", marginBottom: "0.5rem" }} />
                  <Link href={`/players/${encodeURIComponent(top3.playerName)}`} style={{ fontWeight: "bold", fontSize: "0.9rem", textAlign: "center", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", width: "100%", textDecoration: "none", color: "var(--text-primary)" }}>{top3.playerName}</Link>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>{top3.gamesPlayed} Games</div>
                  <div style={{ width: "100%", height: "100px", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid #CD7F32", borderBottom: "none", display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "center", paddingTop: "1rem" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: "900", color: "#CD7F32" }}>3</div>
                    <div style={{ fontSize: "0.9rem", fontWeight: "bold", color: "var(--text-primary)", marginTop: "0.5rem" }}>
                      {formatStat(top3[sortBy], sortBy)}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Podium Base Line */}
            <div style={{ width: "100%", maxWidth: "600px", height: "4px", backgroundColor: "var(--border-dark)", borderRadius: "2px" }}></div>
          </div>

          {/* Ranking Table */}
          <div className="card" style={{ padding: "0", overflow: "hidden" }}>
            <div className="table-responsive">
              <table className="teams-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ backgroundColor: "rgba(0,0,0,0.5)", borderBottom: "1px solid var(--border-dark)" }}>
                  <tr>
                    <th style={{ padding: "1rem", textAlign: "center", width: "60px" }}>Rank</th>
                    <th style={{ padding: "1rem", textAlign: "left" }}>Player</th>
                    <th style={{ padding: "1rem", textAlign: "center" }}>Games</th>
                    <th style={{ padding: "1rem", textAlign: "right", color: "var(--primary-gold-bright)" }}>
                      {metrics.find(m => m.id === sortBy)?.label}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rankedPlayers.slice(3).map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border-dark)", transition: "background 0.2s" }}>
                      <td style={{ padding: "1rem", textAlign: "center", fontWeight: "bold", color: "var(--text-muted)" }}>
                        {idx + 4}
                      </td>
                      <td style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                        <img src={getChampionIcon(p.topChamp)} alt={p.topChamp} style={{ width: "32px", height: "32px", borderRadius: "4px" }} />
                        <Link href={`/players/${encodeURIComponent(p.playerName)}`} style={{ fontWeight: "bold", textDecoration: "none", color: "var(--text-primary)" }}>{p.playerName}</Link>
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)" }}>
                        {p.gamesPlayed}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right", fontWeight: "bold", color: "var(--text-primary)" }}>
                        {formatStat(p[sortBy], sortBy)}
                      </td>
                    </tr>
                  ))}
                  {rankedPlayers.length <= 3 && (
                    <tr>
                      <td colSpan="4" style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                        No other players to display.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
