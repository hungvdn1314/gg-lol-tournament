"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { subscribeToAllMatchDetails, subscribeToData } from "@/lib/db";
import { SummonersCup, HextechCrest } from "@/components/Icons";
import { Award, Eye, Crosshair, Shield, Coins, Target, Heart, Zap } from "lucide-react";
import { getLatestDDragonVersion } from "@/lib/riot";
import { championPlaceholder, teamLogoPlaceholder } from "@/lib/placeholders";
import PlayerSignature from "@/components/PlayerSignature";

class ConfettiShower {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.colors = ['#84cc16', '#22d3ee', '#a855f7', '#f43f5e', '#eab308'];
    this.animationFrame = null;
  }

  start() {
    this.stop();
    if (typeof window === "undefined") return;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'confetti-canvas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '9999';
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    
    const handler = () => this.resize();
    window.addEventListener('resize', handler);
    this.resizeHandler = handler;

    for (let i = 0; i < 120; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height - this.canvas.height,
        r: Math.random() * 4 + 3,
        d: Math.random() * this.canvas.height,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        tilt: Math.random() * 8 - 4,
        tiltAngleIncremental: Math.random() * 0.05 + 0.02,
        tiltAngle: 0,
        speed: Math.random() * 2 + 1.5
      });
    }

    const draw = () => {
      if (!this.ctx || !this.canvas) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      let activeParticles = 0;
      this.particles.forEach(p => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += p.speed;
        p.x += Math.sin(p.tiltAngle) * 0.5;
        p.tilt = Math.sin(p.tiltAngle - p.r/2) * 4;

        this.ctx.beginPath();
        this.ctx.lineWidth = p.r;
        this.ctx.strokeStyle = p.color;
        this.ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        this.ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        this.ctx.stroke();

        if (p.y <= this.canvas.height) {
          activeParticles++;
        }
      });

      if (activeParticles > 0) {
        this.animationFrame = requestAnimationFrame(draw);
      } else {
        this.stop();
      }
    };

    draw();
  }

  resize() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  }

  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
      this.ctx = null;
    }
    this.particles = [];
  }
}

// Helper MVP calculator copied to use for aggregated logic
const calculateGameMVP = (participants, gameDuration) => {
  if (!participants || participants.length === 0) return [];

  // Identify the winning team side
  const winningParticipant = participants.find(p => p.win);
  const winningTeamId = winningParticipant ? winningParticipant.teamId : null;

  if (winningTeamId === null) return [];

  // Calculate team-level statistics for the winning team
  const teamTotals = {
    kills: 0,
    dmgDealt: 0,
    dmgTaken: 0,
    healing: 0,
    kdaSum: 0
  };

  const participantsWithKda = participants.map(p => {
    const kda = (p.kills + (p.assists || 0)) / Math.max(p.deaths || 0, 1);
    return { ...p, kda };
  });

  participantsWithKda.forEach(p => {
    if (p.teamId === winningTeamId) {
      teamTotals.kills += (p.kills || 0);
      teamTotals.dmgDealt += (p.damageDealt || 0);
      teamTotals.dmgTaken += (p.damageTaken || 0);
      teamTotals.healing += (p.healing || 0);
      teamTotals.kdaSum += p.kda;
    }
  });

  const scored = participantsWithKda.map(p => {
    if (p.teamId !== winningTeamId) {
      return {
        ...p,
        totalScore: 0,
        mvpBreakdown: { kdaScore: 0, kpScore: 0, dmgScore: 0, defUtilScore: 0, hypeScore: 0, winBonus: 0, totalScore: 0 }
      };
    }

    // 1. Kill Participation (45% -> max 450)
    const kp = teamTotals.kills > 0 ? (p.kills + (p.assists || 0)) / teamTotals.kills : 0;
    const kpScore = kp * 450;

    // 2. Damage Share (20% -> max 200)
    const damageShare = teamTotals.dmgDealt > 0 ? (p.damageDealt || 0) / teamTotals.dmgDealt : 0;
    const dmgScore = damageShare * 200;

    // 3. Damage Taken Share (15% -> max 150)
    const dmgTakenShare = teamTotals.dmgTaken > 0 ? (p.damageTaken || 0) / teamTotals.dmgTaken : 0;
    const defUtilScore = dmgTakenShare * 150;

    // 4. Healing Share (10% -> max 100)
    const healingShare = teamTotals.healing > 0 ? (p.healing || 0) / teamTotals.healing : 0;
    const hypeScore = healingShare * 100;

    // 5. KDA Share (10% -> max 100)
    const kdaShare = teamTotals.kdaSum > 0 ? p.kda / teamTotals.kdaSum : 0;
    const winBonus = kdaShare * 100;

    const totalScore = kpScore + dmgScore + defUtilScore + hypeScore + winBonus;

    return {
      ...p,
      totalScore,
      mvpBreakdown: { kdaScore: winBonus, kpScore, dmgScore, defUtilScore, hypeScore, winBonus: 0, totalScore }
    };
  });
  
  return scored.sort((a, b) => b.totalScore - a.totalScore);
};

export default function PlayerRankings() {
  const [allMatches, setAllMatches] = useState({});
  const [teams, setTeams] = useState({});
  const [matches, setMatches] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("awards"); // awards, players, teams
  const [rankingType, setRankingType] = useState("player"); // player, team
  const [sortBy, setSortBy] = useState("seriesMvpCount");
  const [version, setVersion] = useState("16.13.1");
  
  // Sort options
  const playerMetrics = [
    { id: "seriesMvpCount", label: "Series MVPs", icon: <SummonersCup size={14} /> },
    { id: "matchMvpCount", label: "Match MVPs", icon: <Award size={14} /> },
    { id: "avgMvpScore", label: "Avg MVP Score", icon: <Award size={14} /> },
    { id: "kda", label: "KDA Ratio", icon: <Crosshair size={14} /> },
    { id: "dpm", label: "DMG / Min", icon: <Target size={14} /> },
    { id: "dmgShare", label: "DMG Share %", icon: <Target size={14} /> },
    { id: "kp", label: "Kill Part %", icon: <HextechCrest size={14} /> },
    { id: "gpm", label: "Gold / Min", icon: <Coins size={14} /> },
    { id: "dmgTakenShare", label: "DMG Taken %", icon: <Shield size={14} /> },
    { id: "cspm", label: "CS / Min", icon: <Crosshair size={14} /> },
    { id: "pentaKills", label: "Pentakills", icon: <Zap size={14} /> },
    { id: "healing", label: "Total Healing", icon: <Heart size={14} /> }
  ];

  const teamMetrics = [
    { id: "winRate", label: "Win Rate", icon: <SummonersCup size={14} /> },
    { id: "positionScore", label: "Final Position", icon: <Award size={14} /> },
    { id: "kda", label: "KDA Ratio", icon: <Crosshair size={14} /> },
    { id: "kills", label: "Total Kills", icon: <Target size={14} /> },
    { id: "dpg", label: "Avg DMG / Game", icon: <Target size={14} /> },
    { id: "healing", label: "Total Healing", icon: <Heart size={14} /> },
    { id: "pentaKills", label: "Pentakills", icon: <Zap size={14} /> },
    { id: "gpg", label: "Avg Gold / Game", icon: <Coins size={14} /> },
    { id: "cspg", label: "Avg CS / Game", icon: <Crosshair size={14} /> }
  ];

  const metrics = rankingType === "player" ? playerMetrics : teamMetrics;

  useEffect(() => {
    const unsubMatches = subscribeToAllMatchDetails((data) => {
      setAllMatches(data || {});
      setLoading(false);
    });

    const unsubTeams = subscribeToData("teams", setTeams);
    const unsubMatchesMeta = subscribeToData("matches", setMatches);

    getLatestDDragonVersion().then(v => setVersion(v));

    return () => {
      unsubMatches();
      unsubTeams();
      unsubMatchesMeta();
    };
  }, []);

  const getChampionIcon = (championName) => {
    if (!championName) return championPlaceholder(40);
    let cleanName = championName.replace(/[^a-zA-Z0-9]/g, "");
    if (cleanName.toLowerCase() === "velkoz") cleanName = "Velkoz";
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${cleanName}.png`;
  };

  // Get positions mapping from double-elimination playoff bracket
  const positions = {};
  
  // 1st and 2nd from Grand Final (match-playoff-8)
  const gf = matches?.["match-playoff-8"];
  if (gf && gf.status === "completed") {
    const winnerId = gf.winnerId;
    if (winnerId) {
      positions[winnerId] = "Champion";
      const loserId = (winnerId === gf.teamAId) ? gf.teamBId : gf.teamAId;
      if (loserId) positions[loserId] = "Runner-up";
    }
  } else if (gf) {
    if (gf.teamAId) positions[gf.teamAId] = "Finalist";
    if (gf.teamBId) positions[gf.teamBId] = "Finalist";
  }

  // 3rd place from Lower Bracket Final (match-playoff-7)
  const lbf = matches?.["match-playoff-7"];
  if (lbf && lbf.status === "completed") {
    const winnerId = lbf.winnerId;
    const loserId = (winnerId === lbf.teamAId) ? lbf.teamBId : lbf.teamAId;
    if (loserId) positions[loserId] = "3rd Place";
  } else if (lbf) {
    if (lbf.teamAId && !positions[lbf.teamAId]) positions[lbf.teamAId] = "Top 3";
    if (lbf.teamBId && !positions[lbf.teamBId]) positions[lbf.teamBId] = "Top 3";
  }

  // 4th place from Lower Bracket Semifinal (match-playoff-6)
  const lbs = matches?.["match-playoff-6"];
  if (lbs && lbs.status === "completed") {
    const winnerId = lbs.winnerId;
    const loserId = (winnerId === lbs.teamAId) ? lbs.teamBId : lbs.teamAId;
    if (loserId) positions[loserId] = "4th Place";
  } else if (lbs) {
    if (lbs.teamAId && !positions[lbs.teamAId]) positions[lbs.teamAId] = "Top 4";
    if (lbs.teamBId && !positions[lbs.teamBId]) positions[lbs.teamBId] = "Top 4";
  }

  // 5th-6th place from Lower Bracket Round 1 (match-playoff-3 and match-playoff-4)
  const lbr1_1 = matches?.["match-playoff-3"];
  if (lbr1_1 && lbr1_1.status === "completed") {
    const winnerId = lbr1_1.winnerId;
    const loserId = (winnerId === lbr1_1.teamAId) ? lbr1_1.teamBId : lbr1_1.teamAId;
    if (loserId) positions[loserId] = "5th-6th Place";
  }
  const lbr1_2 = matches?.["match-playoff-4"];
  if (lbr1_2 && lbr1_2.status === "completed") {
    const winnerId = lbr1_2.winnerId;
    const loserId = (winnerId === lbr1_2.teamAId) ? lbr1_2.teamBId : lbr1_2.teamAId;
    if (loserId) positions[loserId] = "5th-6th Place";
  }

  const getPositionScore = (pos) => {
    if (pos === "Champion") return 100;
    if (pos === "Runner-up") return 80;
    if (pos === "3rd Place" || pos === "Top 3") return 60;
    if (pos === "4th Place" || pos === "Top 4") return 40;
    if (pos === "5th-6th Place") return 20;
    return 0; // Group Stage
  };

  // Confetti effect hook when Tournament Honors tab is active and Champion is determined
  useEffect(() => {
    if (activeTab === "awards" && Object.values(positions).includes("Champion")) {
      const shower = new ConfettiShower();
      shower.start();
      return () => {
        shower.stop();
      };
    }
  }, [activeTab, Object.values(positions).join(",")]);

  // Aggregate stats!
  const players = {};
  const teamsData = {};

  // Build a map of player names to their corresponding team objects
  const playerToTeamMap = {};
  Object.entries(teams).forEach(([teamId, team]) => {
    if (team && Array.isArray(team.players)) {
      team.players.forEach(p => {
        playerToTeamMap[p.name.trim().toLowerCase()] = { ...team, id: teamId };
      });
    }
  });

  // Pre-initialize teamsData with all registered teams
  Object.entries(teams).forEach(([teamId, team]) => {
    if (team) {
      teamsData[teamId] = {
        teamId: teamId,
        teamName: team.name || `Team ${teamId}`,
        logo: team.logo || (typeof teamLogoPlaceholder === "function" ? teamLogoPlaceholder(team.name || "?", 60) : ""),
        position: positions[teamId] || "Group Stage",
        positionScore: getPositionScore(positions[teamId] || "Group Stage"),
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        damageDealt: 0,
        damageTaken: 0,
        healing: 0,
        gold: 0,
        cs: 0,
        pentaKills: 0
      };
    }
  });

  Object.entries(allMatches).forEach(([matchId, gamesArray]) => {
    if (!Array.isArray(gamesArray)) return;

    // To calculate Series MVP, we need a separate aggregator for just this series
    const seriesScores = {};

    gamesArray.forEach(game => {
      if (!game || !game.participants) return;

      const winningParticipant = game.participants.find(p => p.win);
      const winningTeamId = winningParticipant ? winningParticipant.teamId : null;

      // Determine which actual teams are playing in this game based on rosters
      const gameTeamIds = Array.from(new Set(game.participants.map(p => {
        const playerTeam = playerToTeamMap[p.playerName?.trim().toLowerCase()];
        return playerTeam ? playerTeam.id : p.teamId;
      })));

      // Resolve actual team ID for the winning side
      let winningActualTeamId = null;
      if (winningTeamId !== null) {
        const winningPlayer = game.participants.find(p => p.teamId === winningTeamId);
        if (winningPlayer) {
          const playerTeam = playerToTeamMap[winningPlayer.playerName?.trim().toLowerCase()];
          winningActualTeamId = playerTeam ? playerTeam.id : winningTeamId;
        }
      }

      gameTeamIds.forEach(teamId => {
        const playerTeam = teams[teamId];
        const teamName = playerTeam?.name || `Team ${teamId}`;
        if (!teamsData[teamId]) {
          teamsData[teamId] = {
            teamId: teamId,
            teamName: teamName,
            logo: playerTeam?.logo || (typeof teamLogoPlaceholder === "function" ? teamLogoPlaceholder(teamName, 60) : ""),
            position: positions[teamId] || "Group Stage",
            positionScore: getPositionScore(positions[teamId] || "Group Stage"),
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            kills: 0,
            deaths: 0,
            assists: 0,
            damageDealt: 0,
            damageTaken: 0,
            healing: 0,
            gold: 0,
            cs: 0,
            pentaKills: 0
          };
        }
        const teamStats = teamsData[teamId];
        teamStats.gamesPlayed += 1;
        if (winningActualTeamId !== null) {
          if (teamId === winningActualTeamId) {
            teamStats.wins += 1;
          } else {
            teamStats.losses += 1;
          }
        }
      });
      
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
            seriesMvpCount: 0,
            groupMvpCount: 0,
            playoffMvpCount: 0,
            grandFinalMvpCount: 0,
            totalMvpScore: 0,
            avgMvpScore: 0,
            pentaKills: 0,
            healing: 0
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
        stats.pentaKills += (p.pentaKills || 0);
        stats.healing += (p.healing || 0);

        stats.teamKills += (p.teamId === 100 ? bK : rK);
        stats.teamDamageDealt += (p.teamId === 100 ? bD : rD);
        stats.teamDamageTaken += (p.teamId === 100 ? bDT : rDT);

        if (p.playerName === gameMvp) stats.matchMvpCount += 1;

        // Accumulate player stats into actual team totals
        const playerTeam = playerToTeamMap[p.playerName?.trim().toLowerCase()];
        const actualTeamId = playerTeam ? playerTeam.id : p.teamId;
        const teamStats = teamsData[actualTeamId];
        if (teamStats) {
          teamStats.kills += (p.kills || 0);
          teamStats.deaths += (p.deaths || 0);
          teamStats.assists += (p.assists || 0);
          teamStats.damageDealt += (p.damageDealt || 0);
          teamStats.damageTaken += (p.damageTaken || 0);
          teamStats.healing += (p.healing || 0);
          teamStats.gold += (p.gold || 0);
          teamStats.cs += (p.cs || 0);
          teamStats.pentaKills += (p.pentaKills || 0);
        }

        // Add to series scores
        const pScored = scored.find(s => s.playerName === p.playerName);
        if (pScored) {
          stats.totalMvpScore = (stats.totalMvpScore || 0) + pScored.totalScore;
          seriesScores[p.playerName] = (seriesScores[p.playerName] || 0) + pScored.totalScore;
        }
      });
    });

    // Determine Series MVP
    const seriesMvp = Object.entries(seriesScores).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (seriesMvp && players[seriesMvp]) {
      players[seriesMvp].seriesMvpCount += 1;
      if (matchId.startsWith("match-g-")) {
        players[seriesMvp].groupMvpCount += 1;
      } else if (matchId.startsWith("match-playoff-") && matchId !== "match-playoff-8") {
        players[seriesMvp].playoffMvpCount += 1;
      } else if (matchId === "match-playoff-8") {
        players[seriesMvp].grandFinalMvpCount += 1;
      }
    }
  });

  // Calculate advanced metrics for players
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
      cspm: p.cs / p.durationMins,
      avgMvpScore: p.gamesPlayed > 0 ? p.totalMvpScore / p.gamesPlayed : 0
    };
  });

  // Calculate advanced metrics for teams
  const rankedTeams = Object.values(teamsData).map(t => {
    return {
      ...t,
      kda: t.deaths === 0 ? (t.kills + t.assists) : (t.kills + t.assists) / t.deaths,
      winRate: t.gamesPlayed > 0 ? (t.wins / t.gamesPlayed) * 100 : 0,
      dpg: t.gamesPlayed > 0 ? t.damageDealt / t.gamesPlayed : 0,
      gpg: t.gamesPlayed > 0 ? t.gold / t.gamesPlayed : 0,
      hpg: t.gamesPlayed > 0 ? t.healing / t.gamesPlayed : 0,
      cspg: t.gamesPlayed > 0 ? t.cs / t.gamesPlayed : 0
    };
  });

  const rankedItems = rankingType === "player" ? rankedPlayers : rankedTeams;
  rankedItems.sort((a, b) => {
    if (b[sortBy] !== a[sortBy]) {
      return b[sortBy] - a[sortBy];
    }
    if (rankingType === "player") {
      if (["seriesMvpCount", "groupMvpCount", "playoffMvpCount", "grandFinalMvpCount", "matchMvpCount"].includes(sortBy)) {
        if (b.avgMvpScore !== a.avgMvpScore) {
          return b.avgMvpScore - a.avgMvpScore;
        }
      }
      return (b.kda || 0) - (a.kda || 0);
    }
    if (rankingType === "team") {
      return (b.winRate || 0) - (a.winRate || 0);
    }
    return 0;
  });

  const top1 = rankedItems[0];
  const top2 = rankedItems[1];
  const top3 = rankedItems[2];

  const formatStat = (val, metricId, item) => {
    if (metricId === "positionScore") {
      if (val === 100) return "Champion";
      if (val === 80) return "Runner-up";
      if (val === 60) return "3rd Place";
      if (val === 55) return "Top 3";
      if (val === 40) return "4th Place";
      if (val === 35) return "Top 4";
      if (val === 20) return "5th-6th Place";
      return "Group Stage";
    }
    if (["seriesMvpCount", "groupMvpCount", "playoffMvpCount", "grandFinalMvpCount", "matchMvpCount"].includes(metricId)) {
      const avgStr = item && typeof item.avgMvpScore === "number" ? ` (Avg: ${item.avgMvpScore.toFixed(1)})` : "";
      return `${val} MVP${val !== 1 ? 's' : ''}${avgStr}`;
    }
    if (metricId === "kda") return `${val.toFixed(2)} KDA`;
    if (["dmgShare", "kp", "dmgTakenShare"].includes(metricId)) return val.toFixed(1) + "%";
    if (metricId === "winRate") return val.toFixed(1) + "% WR";
    if (["dpm", "gpm", "cspm"].includes(metricId)) return `${Math.round(val).toLocaleString()}/m`;
    if (metricId === "pentaKills") return `${val} Pentakill${val !== 1 ? 's' : ''}`;
    if (["healing", "kills"].includes(metricId)) return val.toLocaleString();
    if (["dpg", "gpg", "hpg", "cspg"].includes(metricId)) return `${Math.round(val).toLocaleString()}/game`;
    return `${val.toFixed(2)} pts`;
  };

  const handleRankingTypeChange = (type) => {
    setRankingType(type);
    setSortBy(type === "player" ? "seriesMvpCount" : "positionScore");
  };

  const getPositionBadge = (pos) => {
    if (!pos || pos === "Group Stage") {
      return (
        <span style={{
          padding: "2px 6px",
          borderRadius: "4px",
          fontSize: "0.65rem",
          fontWeight: "bold",
          backgroundColor: "rgba(255,255,255,0.03)",
          color: "var(--text-muted)",
          border: "1px solid var(--border-dark)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          display: "inline-block"
        }}>
          Group Stage
        </span>
      );
    }
    
    let bgColor = "rgba(255,255,255,0.05)";
    let textColor = "var(--text-primary)";
    let borderColor = "var(--border-dark)";
    
    if (pos === "Champion") {
      bgColor = "rgba(212, 175, 55, 0.15)";
      textColor = "var(--primary-gold-bright)";
      borderColor = "var(--primary-gold)";
    } else if (pos === "Runner-up") {
      bgColor = "rgba(148, 163, 184, 0.15)";
      textColor = "#e2e8f0";
      borderColor = "#94a3b8";
    } else if (pos === "3rd Place" || pos === "Top 3") {
      bgColor = "rgba(249, 115, 22, 0.15)";
      textColor = "#f97316";
      borderColor = "#ea580c";
    } else if (pos === "4th Place" || pos === "Top 4") {
      bgColor = "rgba(148, 163, 184, 0.1)";
      textColor = "#94a3b8";
      borderColor = "#475569";
    } else if (pos === "5th-6th Place") {
      bgColor = "rgba(100, 116, 139, 0.05)";
      textColor = "#64748b";
      borderColor = "#334155";
    } else if (pos === "Finalist") {
      bgColor = "rgba(212, 175, 55, 0.1)";
      textColor = "var(--primary-gold-bright)";
      borderColor = "rgba(212, 175, 55, 0.5)";
    }

    return (
      <span style={{
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "0.65rem",
        fontWeight: "bold",
        backgroundColor: bgColor,
        color: textColor,
        border: `1px solid ${borderColor}`,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        display: "inline-block",
        boxShadow: pos === "Champion" ? "0 0 10px rgba(212, 175, 55, 0.2)" : "none"
      }}>
        {pos}
      </span>
    );
  };

  const renderChampionshipCard = () => {
    const gf = matches?.["match-playoff-8"];
    const lbf = matches?.["match-playoff-7"];
    
    const champ = gf && gf.status === "completed" ? teams[gf.winnerId] : null;
    const runner = gf && gf.status === "completed" ? teams[gf.winnerId === gf.teamAId ? gf.teamBId : gf.teamAId] : null;
    const third = lbf && lbf.status === "completed" ? teams[lbf.winnerId === lbf.teamAId ? lbf.teamBId : lbf.teamAId] : null;

    const renderRoster = (teamObj) => {
      if (!teamObj || !Array.isArray(teamObj.players)) return "No roster registered";
      return teamObj.players.map(p => p.name).join(", ");
    };

    return (
      <div className="card" style={{
        background: "linear-gradient(135deg, rgba(212, 175, 55, 0.06), rgba(0,0,0,0.7))",
        border: "1px solid rgba(212, 175, 55, 0.3)",
        boxShadow: "0 8px 30px rgba(0,0,0,0.4), 0 0 20px rgba(212, 175, 55, 0.05)",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "420px",
        transition: "transform 0.3s ease, border-color 0.3s ease",
        borderRadius: "12px"
      }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
            <span style={{ color: "var(--primary-gold)", fontWeight: "bold", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>🏆 Reward Category</span>
            <span style={{ color: "var(--primary-gold-bright)", fontWeight: "900", fontSize: "1.2rem" }}>🥇 🥈 🥉</span>
          </div>
          <h3 style={{ fontSize: "1.5rem", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: "800", letterSpacing: "0.03em" }}>Championship Standings</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "2rem" }}>
            Awarded to the top placing teams in the tournament playoffs.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            {/* Champion */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", backgroundColor: "rgba(212,175,55,0.05)", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(212,175,55,0.2)" }}>
              <div style={{ fontSize: "1.8rem" }}>🥇</div>
              <img 
                src={champ?.logo || (typeof teamLogoPlaceholder === "function" ? teamLogoPlaceholder(champ?.name || "?", 40) : "")} 
                alt="Champion" 
                style={{ width: "40px", height: "40px", objectFit: "contain", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.03)", padding: "2px" }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: "bold", color: "var(--primary-gold-bright)", fontSize: "1.05rem" }}>
                  {champ ? champ.name : <em style={{ color: "var(--text-muted)", fontWeight: "normal" }}>TBD (Playoffs in progress)</em>}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                  {champ ? renderRoster(champ) : "Roster will appear here"}
                </div>
              </div>
            </div>

            {/* Runner-up */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", backgroundColor: "rgba(255,255,255,0.02)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-dark)" }}>
              <div style={{ fontSize: "1.8rem" }}>🥈</div>
              <img 
                src={runner?.logo || (typeof teamLogoPlaceholder === "function" ? teamLogoPlaceholder(runner?.name || "?", 40) : "")} 
                alt="Runner-up" 
                style={{ width: "40px", height: "40px", objectFit: "contain", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.03)", padding: "2px" }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: "bold", color: "var(--text-primary)", fontSize: "1rem" }}>
                  {runner ? runner.name : <em style={{ color: "var(--text-muted)", fontWeight: "normal" }}>TBD</em>}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                  {runner ? renderRoster(runner) : "Roster will appear here"}
                </div>
              </div>
            </div>

            {/* 3rd Place */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", backgroundColor: "rgba(255,255,255,0.01)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-dark)" }}>
              <div style={{ fontSize: "1.8rem" }}>🥉</div>
              <img 
                src={third?.logo || (typeof teamLogoPlaceholder === "function" ? teamLogoPlaceholder(third?.name || "?", 40) : "")} 
                alt="3rd Place" 
                style={{ width: "40px", height: "40px", objectFit: "contain", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.03)", padding: "2px" }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: "bold", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                  {third ? third.name : <em style={{ color: "var(--text-muted)", fontWeight: "normal" }}>TBD</em>}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                  {third ? renderRoster(third) : "Roster will appear here"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMvpAwardCard = () => {
    const sortedGroupPlayers = [...rankedPlayers].sort((a, b) => {
      if (b.groupMvpCount !== a.groupMvpCount) return b.groupMvpCount - a.groupMvpCount;
      return b.avgMvpScore - a.avgMvpScore;
    });
    const topGroupMvp = sortedGroupPlayers[0];
    const hasGroupMvp = topGroupMvp && topGroupMvp.groupMvpCount > 0;

    const sortedPlayoffPlayers = [...rankedPlayers].sort((a, b) => {
      if (b.playoffMvpCount !== a.playoffMvpCount) return b.playoffMvpCount - a.playoffMvpCount;
      return b.avgMvpScore - a.avgMvpScore;
    });
    const topPlayoffMvp = sortedPlayoffPlayers[0];
    const hasPlayoffMvp = topPlayoffMvp && topPlayoffMvp.playoffMvpCount > 0;

    const sortedGfPlayers = [...rankedPlayers].sort((a, b) => {
      if (b.grandFinalMvpCount !== a.grandFinalMvpCount) return b.grandFinalMvpCount - a.grandFinalMvpCount;
      return b.avgMvpScore - a.avgMvpScore;
    });
    const topGfMvp = sortedGfPlayers[0];
    const hasGfMvp = topGfMvp && topGfMvp.grandFinalMvpCount > 0;

    const renderMvpRow = (player, hasMvp, countKey, stageBadge) => {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", backgroundColor: "rgba(255,255,255,0.02)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-dark)" }}>
          <div style={{ fontSize: "1.2rem", fontWeight: "bold", minWidth: "40px", color: "#c084fc", textTransform: "uppercase" }}>{stageBadge}</div>
          {hasMvp ? (
            <>
              <img 
                src={getChampionIcon(player.topChamp)} 
                alt={player.topChamp} 
                style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid #c084fc", backgroundColor: "rgba(255,255,255,0.05)" }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <Link 
                    href={`/players/${encodeURIComponent(player.playerName)}`} 
                    style={{ fontWeight: "bold", color: "var(--text-primary)", fontSize: "0.95rem", textDecoration: "none" }}
                  >
                    {player.playerName}
                  </Link>
                  <span style={{ fontWeight: "bold", color: "#c084fc", fontSize: "0.9rem" }}>
                    {player[countKey]} MVP{player[countKey] !== 1 ? "s" : ""}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                  <span>{playerToTeamMap[player.playerName?.trim().toLowerCase()]?.name || "Free Agent"}</span>
                  <span>Avg MVP Score: {player.avgMvpScore.toFixed(1)}</span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic", flex: 1 }}>
              TBD (No MVPs awarded yet)
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="card" style={{
        background: "linear-gradient(135deg, rgba(168, 85, 247, 0.06), rgba(0,0,0,0.7))",
        border: "1px solid rgba(168, 85, 247, 0.3)",
        boxShadow: "0 8px 30px rgba(0,0,0,0.4), 0 0 20px rgba(168, 85, 247, 0.05)",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "420px",
        borderRadius: "12px"
      }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
            <span style={{ color: "#c084fc", fontWeight: "bold", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>👑 MVP Awards</span>
            <span style={{ color: "#c084fc", fontWeight: "900", fontSize: "1.2rem" }}>👑</span>
          </div>
          <h3 style={{ fontSize: "1.5rem", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: "800", letterSpacing: "0.03em" }}>Tournament MVPs</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "2.5rem" }}>
            Rewarded by tournament stages based on Series MVP counts (tiebroken by average MVP score).
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            {/* Group Stage MVP */}
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "bold", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Group Stage MVP</div>
              {renderMvpRow(topGroupMvp, hasGroupMvp, "groupMvpCount", "GP")}
            </div>

            {/* Playoff MVP */}
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "bold", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Playoff MVP</div>
              {renderMvpRow(topPlayoffMvp, hasPlayoffMvp, "playoffMvpCount", "PO")}
            </div>

            {/* Grand Final MVP */}
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "bold", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Grand Final MVP</div>
              {renderMvpRow(topGfMvp, hasGfMvp, "grandFinalMvpCount", "GF")}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPentakillSlayerCard = () => {
    const pentakillPlayers = rankedPlayers.filter(p => p.pentaKills > 0).sort((a, b) => b.pentaKills - a.pentaKills);
    const hasPentakills = pentakillPlayers.length > 0;

    return (
      <div className="card" style={{
        background: "linear-gradient(135deg, rgba(239, 68, 68, 0.06), rgba(0,0,0,0.7))",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        boxShadow: "0 8px 30px rgba(0,0,0,0.4), 0 0 20px rgba(239, 68, 68, 0.05)",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "420px",
        borderRadius: "12px"
      }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
            <span style={{ color: "#ef4444", fontWeight: "bold", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>⚡ Bounty Rewards</span>
            <span style={{ color: "#ef4444", fontWeight: "900", fontSize: "1.2rem" }}>⚡</span>
          </div>
          <h3 style={{ fontSize: "1.5rem", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: "800", letterSpacing: "0.03em" }}>Pentakill Slayers</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "2.5rem" }}>
            Rewarded to players per pentakill secured during the tournament.
          </p>

          {hasPentakills ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", overflowY: pentakillPlayers.length > 3 ? "auto" : "visible", maxHeight: "280px", paddingRight: "4px" }}>
              {pentakillPlayers.map(player => (
                <div key={player.playerName} style={{ display: "flex", alignItems: "center", gap: "1rem", backgroundColor: "rgba(239, 68, 68, 0.05)", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                  <img 
                    src={getChampionIcon(player.topChamp)} 
                    alt={player.topChamp} 
                    style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid #ef4444", backgroundColor: "rgba(255,255,255,0.05)" }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <Link 
                        href={`/players/${encodeURIComponent(player.playerName)}`} 
                        style={{ fontWeight: "bold", color: "var(--text-primary)", fontSize: "0.95rem", textDecoration: "none" }}
                      >
                        {player.playerName}
                      </Link>
                      <span style={{ fontWeight: "bold", color: "#ef4444", fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <span>{player.pentaKills}</span>
                        <Zap size={14} style={{ color: "#ef4444" }} />
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                      <span>{playerToTeamMap[player.playerName?.trim().toLowerCase()]?.name || "Free Agent"}</span>
                      <span>Total Kills: {player.kills}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", color: "var(--text-muted)", height: "200px", border: "1px dashed rgba(239, 68, 68, 0.2)", borderRadius: "8px" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚡</div>
              <div style={{ fontSize: "0.85rem", textAlign: "center", fontWeight: "bold", color: "var(--text-primary)" }}>Bounty Unclaimed!</div>
              <div style={{ fontSize: "0.75rem", textAlign: "center", marginTop: "0.25rem" }}>No Pentakills recorded yet in this tournament.</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const activeMetric = metrics.find(m => m.id === sortBy) || metrics.find(m => m.id === "seriesMvpCount");

  const getMetricLabel = (metricId) => {
    if (metricId === "seriesMvpCount") return "Total Series MVPs";
    if (metricId === "groupMvpCount") return "Group Stage MVPs";
    if (metricId === "playoffMvpCount") return "Playoff MVPs";
    if (metricId === "grandFinalMvpCount") return "Grand Final MVP";
    return metrics.find(m => m.id === metricId)?.label || "Stat";
  };

  return (
    <div className="container" style={{ paddingBottom: "4rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2.5rem", position: "relative", paddingTop: "1.5rem" }}>
        <span className="hero-badge" style={{ backgroundColor: "rgba(245,176,65,0.08)", border: "1px solid var(--border-gold)", color: "var(--primary-gold)", textTransform: "uppercase", fontSize: "0.8rem", fontWeight: "700", padding: "0.3rem 1rem", borderRadius: "20px", display: "inline-block", marginBottom: "1rem" }}>Leaderboards</span>
        <h1 style={{ fontSize: "2.8rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem", background: "linear-gradient(to bottom, #FFFFFF, var(--primary-gold-bright))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Tournament Rankings</h1>
        <p style={{ color: "var(--text-muted)", maxWidth: "600px", margin: "0 auto", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "2rem" }}>
          Explore the top performers and tournament awards across the entire tournament.
        </p>

        {/* Main Tab Switcher Toggle */}
        <div style={{ display: "inline-flex", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-dark)", padding: "4px", borderRadius: "30px" }}>
          <button 
            className={`btn ${activeTab === "awards" ? "btn-primary" : ""}`}
            style={{ borderRadius: "20px", padding: "0.4rem 1.5rem", fontSize: "0.85rem", background: activeTab === "awards" ? "" : "transparent", border: "none", color: activeTab === "awards" ? "#000" : "var(--text-muted)", fontWeight: "bold" }}
            onClick={() => setActiveTab("awards")}
          >
            🏆 Tournament Honors
          </button>
          <button 
            className={`btn ${activeTab === "players" ? "btn-primary" : ""}`}
            style={{ borderRadius: "20px", padding: "0.4rem 1.5rem", fontSize: "0.85rem", background: activeTab === "players" ? "" : "transparent", border: "none", color: activeTab === "players" ? "#000" : "var(--text-muted)", fontWeight: "bold" }}
            onClick={() => {
              setActiveTab("players");
              setRankingType("player");
              setSortBy("seriesMvpCount");
            }}
          >
            📊 Player Stats
          </button>
          <button 
            className={`btn ${activeTab === "teams" ? "btn-primary" : ""}`}
            style={{ borderRadius: "20px", padding: "0.4rem 1.5rem", fontSize: "0.85rem", background: activeTab === "teams" ? "" : "transparent", border: "none", color: activeTab === "teams" ? "#000" : "var(--text-muted)", fontWeight: "bold" }}
            onClick={() => {
              setActiveTab("teams");
              setRankingType("team");
              setSortBy("positionScore");
            }}
          >
            👥 Team Stats
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem" }}>Loading tournament stats...</div>
      ) : (
        <>
          {activeTab === "awards" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem", marginTop: "2rem" }}>
              {/* Championship Standings Card */}
              {renderChampionshipCard()}

              {/* Series MVP Award Card */}
              {renderMvpAwardCard()}

              {/* Pentakill Slayer Card */}
              {renderPentakillSlayerCard()}
            </div>
          )}

          {(activeTab === "players" || activeTab === "teams") && (
            <>
              {/* Stat Categories */}
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.5rem", marginBottom: "3rem" }}>
                {metrics.map(m => {
                  const isActive = sortBy === m.id || 
                    (m.id === "seriesMvpCount" && ["seriesMvpCount", "groupMvpCount", "playoffMvpCount", "grandFinalMvpCount"].includes(sortBy));
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSortBy(m.id)}
                      className={`btn ${isActive ? "btn-primary" : "btn-outline"}`}
                      style={{ padding: "0.4rem 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
                    >
                      {m.icon}
                      {m.label}
                    </button>
                  );
                })}
              </div>

              {/* Sub-selector for Player Series MVPs stages */}
              {activeTab === "players" && ["seriesMvpCount", "groupMvpCount", "playoffMvpCount", "grandFinalMvpCount"].includes(sortBy) && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: "-1.5rem", marginBottom: "3rem" }}>
                  <div style={{ display: "inline-flex", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-dark)", padding: "4px", borderRadius: "30px" }}>
                    <button 
                      className={`btn ${sortBy === "seriesMvpCount" ? "btn-primary" : ""}`}
                      style={{ borderRadius: "20px", padding: "0.4rem 1.2rem", fontSize: "0.8rem", background: sortBy === "seriesMvpCount" ? "" : "transparent", border: "none", color: sortBy === "seriesMvpCount" ? "#000" : "var(--text-muted)", fontWeight: "bold" }}
                      onClick={() => setSortBy("seriesMvpCount")}
                    >
                      All Matches
                    </button>
                    <button 
                      className={`btn ${sortBy === "groupMvpCount" ? "btn-primary" : ""}`}
                      style={{ borderRadius: "20px", padding: "0.4rem 1.2rem", fontSize: "0.8rem", background: sortBy === "groupMvpCount" ? "" : "transparent", border: "none", color: sortBy === "groupMvpCount" ? "#000" : "var(--text-muted)", fontWeight: "bold" }}
                      onClick={() => setSortBy("groupMvpCount")}
                    >
                      Group Stage
                    </button>
                    <button 
                      className={`btn ${sortBy === "playoffMvpCount" ? "btn-primary" : ""}`}
                      style={{ borderRadius: "20px", padding: "0.4rem 1.2rem", fontSize: "0.8rem", background: sortBy === "playoffMvpCount" ? "" : "transparent", border: "none", color: sortBy === "playoffMvpCount" ? "#000" : "var(--text-muted)", fontWeight: "bold" }}
                      onClick={() => setSortBy("playoffMvpCount")}
                    >
                      Playoffs
                    </button>
                    <button 
                      className={`btn ${sortBy === "grandFinalMvpCount" ? "btn-primary" : ""}`}
                      style={{ borderRadius: "20px", padding: "0.4rem 1.2rem", fontSize: "0.8rem", background: sortBy === "grandFinalMvpCount" ? "" : "transparent", border: "none", color: sortBy === "grandFinalMvpCount" ? "#000" : "var(--text-muted)", fontWeight: "bold" }}
                      onClick={() => setSortBy("grandFinalMvpCount")}
                    >
                      Grand Final
                    </button>
                  </div>
                </div>
              )}

              {/* Top 3 Podium */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "4rem" }}>
                <h2 style={{ textTransform: "uppercase", fontSize: "1.2rem", letterSpacing: "0.05em", color: "var(--primary-gold)", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem" }}>
                  {activeMetric?.icon}
                  Top 3: {getMetricLabel(sortBy)}
                </h2>
                
                <div className="podium-container" style={{ display: "flex", alignItems: "flex-end", gap: "1rem", marginTop: "2rem", minHeight: "300px" }}>
                  {/* 2nd Place */}
                  {top2 && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "140px" }}>
                      <img 
                        src={rankingType === "player" ? getChampionIcon(top2.topChamp) : (top2.logo || (typeof teamLogoPlaceholder === "function" ? teamLogoPlaceholder(top2.teamName, 60) : ""))} 
                        alt={rankingType === "player" ? top2.topChamp : top2.teamName} 
                        style={{ 
                          width: "60px", 
                          height: "60px", 
                          borderRadius: rankingType === "player" ? "50%" : "8px", 
                          border: "2px solid #C0C0C0", 
                          marginBottom: "0.5rem",
                          objectFit: "contain",
                          padding: rankingType === "player" ? "0" : "4px",
                          backgroundColor: rankingType === "player" ? "transparent" : "rgba(255,255,255,0.05)"
                        }} 
                      />
                      <Link 
                        href={rankingType === "player" ? `/players/${encodeURIComponent(top2.playerName)}` : `/teams?teamId=${top2.teamId}`} 
                        style={{ fontWeight: "bold", fontSize: "0.9rem", textAlign: "center", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", width: "100%", textDecoration: "none", color: rankingType === "player" ? "var(--text-primary)" : "var(--primary-gold-bright)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}
                      >
                        <span>{rankingType === "player" ? top2.playerName : top2.teamName}</span>
                        {rankingType === "team" && getPositionBadge(top2.position)}
                      </Link>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem", marginTop: rankingType === "team" ? "0.25rem" : "0" }}>{top2.gamesPlayed} Games</div>
                      <div style={{ width: "100%", height: "135px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid #C0C0C0", borderBottom: "none", display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "center", paddingTop: "0.5rem", boxSizing: "border-box" }}>
                        <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#C0C0C0" }}>2</div>
                        {rankingType === "player" && (
                          <div style={{ margin: "0.15rem 0" }}>
                            <PlayerSignature name={top2.playerName} size={50} />
                          </div>
                        )}
                        <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--text-primary)", marginTop: "0.25rem", textAlign: "center", padding: "0 8px", width: "100%", boxSizing: "border-box", lineHeight: "1.2" }}>
                          {formatStat(top2[sortBy], sortBy, top2)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 1st Place */}
                  {top1 && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "160px" }}>
                      <div style={{ position: "relative" }}>
                        <SummonersCup size={30} style={{ color: "var(--primary-gold)", position: "absolute", top: "-25px", left: "50%", transform: "translateX(-50%)" }} />
                        <img 
                          src={rankingType === "player" ? getChampionIcon(top1.topChamp) : (top1.logo || (typeof teamLogoPlaceholder === "function" ? teamLogoPlaceholder(top1.teamName, 80) : ""))} 
                          alt={rankingType === "player" ? top1.topChamp : top1.teamName} 
                          style={{ 
                            width: "80px", 
                            height: "80px", 
                            borderRadius: rankingType === "player" ? "50%" : "8px", 
                            border: "3px solid var(--primary-gold)", 
                            marginBottom: "0.5rem",
                            objectFit: "contain",
                            padding: rankingType === "player" ? "0" : "6px",
                            backgroundColor: rankingType === "player" ? "transparent" : "rgba(255,255,255,0.05)"
                          }} 
                        />
                      </div>
                      <Link 
                        href={rankingType === "player" ? `/players/${encodeURIComponent(top1.playerName)}` : `/teams?teamId=${top1.teamId}`} 
                        style={{ fontWeight: "bold", fontSize: "1.1rem", textAlign: "center", color: "var(--primary-gold-bright)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", width: "100%", textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}
                      >
                        <span>{rankingType === "player" ? top1.playerName : top1.teamName}</span>
                        {rankingType === "team" && getPositionBadge(top1.position)}
                      </Link>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem", marginTop: rankingType === "team" ? "0.25rem" : "0" }}>{top1.gamesPlayed} Games</div>
                      <div style={{ width: "100%", height: "180px", backgroundColor: "rgba(228,179,60,0.1)", border: "1px solid var(--border-gold)", borderBottom: "none", display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "center", paddingTop: "0.5rem", boxShadow: "0 -10px 30px rgba(228,179,60,0.15)", boxSizing: "border-box" }}>
                        <div style={{ fontSize: "2.5rem", fontWeight: "900", color: "var(--primary-gold)", lineHeight: "1" }}>1</div>
                        {rankingType === "player" && (
                          <div style={{ margin: "0.25rem 0" }}>
                            <PlayerSignature name={top1.playerName} size={65} />
                          </div>
                        )}
                        <div style={{ fontSize: "0.9rem", fontWeight: "bold", color: "var(--primary-gold-bright)", marginTop: "0.25rem", textAlign: "center", padding: "0 8px", width: "100%", boxSizing: "border-box", lineHeight: "1.2" }}>
                          {formatStat(top1[sortBy], sortBy, top1)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {top3 && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "140px" }}>
                      <img 
                        src={rankingType === "player" ? getChampionIcon(top3.topChamp) : (top3.logo || (typeof teamLogoPlaceholder === "function" ? teamLogoPlaceholder(top3.teamName, 60) : ""))} 
                        alt={rankingType === "player" ? top3.topChamp : top3.teamName} 
                        style={{ 
                          width: "60px", 
                          height: "60px", 
                          borderRadius: rankingType === "player" ? "50%" : "8px", 
                          border: "2px solid #CD7F32", 
                          marginBottom: "0.5rem",
                          objectFit: "contain",
                          padding: rankingType === "player" ? "0" : "4px",
                          backgroundColor: rankingType === "player" ? "transparent" : "rgba(255,255,255,0.05)"
                        }} 
                      />
                      <Link 
                        href={rankingType === "player" ? `/players/${encodeURIComponent(top3.playerName)}` : `/teams?teamId=${top3.teamId}`} 
                        style={{ fontWeight: "bold", fontSize: "0.9rem", textAlign: "center", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", width: "100%", textDecoration: "none", color: "var(--text-primary)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}
                      >
                        <span>{rankingType === "player" ? top3.playerName : top3.teamName}</span>
                        {rankingType === "team" && getPositionBadge(top3.position)}
                      </Link>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem", marginTop: rankingType === "team" ? "0.25rem" : "0" }}>{top3.gamesPlayed} Games</div>
                      <div style={{ width: "100%", height: "115px", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid #CD7F32", borderBottom: "none", display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "center", paddingTop: "0.5rem", boxSizing: "border-box" }}>
                        <div style={{ fontSize: "1.2rem", fontWeight: "900", color: "#CD7F32" }}>3</div>
                        {rankingType === "player" && (
                          <div style={{ margin: "0.15rem 0" }}>
                            <PlayerSignature name={top3.playerName} size={45} />
                          </div>
                        )}
                        <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--text-primary)", marginTop: "0.25rem", textAlign: "center", padding: "0 8px", width: "100%", boxSizing: "border-box", lineHeight: "1.2" }}>
                          {formatStat(top3[sortBy], sortBy, top3)}
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
                        <th style={{ padding: "1rem", textAlign: "left" }}>{rankingType === "player" ? "Player" : "Team"}</th>
                        <th style={{ padding: "1rem", textAlign: "center" }}>Games</th>
                        <th style={{ padding: "1rem", textAlign: "right", color: "var(--primary-gold-bright)" }}>
                          {getMetricLabel(sortBy)}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankedItems.slice(3).map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--border-dark)", transition: "background 0.2s" }}>
                          <td style={{ padding: "1rem", textAlign: "center", fontWeight: "bold", color: "var(--text-muted)" }}>
                            {idx + 4}
                          </td>
                          <td style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                            <img 
                              src={rankingType === "player" ? getChampionIcon(item.topChamp) : (item.logo || (typeof teamLogoPlaceholder === "function" ? teamLogoPlaceholder(item.teamName, 32) : ""))} 
                              alt={rankingType === "player" ? item.topChamp : item.teamName} 
                              style={{ 
                                width: "32px", 
                                height: "32px", 
                                borderRadius: rankingType === "player" ? "4px" : "4px",
                                objectFit: "contain",
                                padding: rankingType === "player" ? "0" : "2px",
                                backgroundColor: rankingType === "player" ? "transparent" : "rgba(255,255,255,0.05)"
                              }} 
                            />
                            <Link 
                              href={rankingType === "player" ? `/players/${encodeURIComponent(item.playerName)}` : `/teams?teamId=${item.teamId}`} 
                              style={{ fontWeight: "bold", textDecoration: "none", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}
                            >
                              <span>{rankingType === "player" ? item.playerName : item.teamName}</span>
                              {rankingType === "team" && getPositionBadge(item.position)}
                            </Link>
                          </td>
                          <td style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)" }}>
                            {item.gamesPlayed}
                          </td>
                          <td style={{ padding: "1rem", textAlign: "right", fontWeight: "bold", color: "var(--text-primary)" }}>
                            {formatStat(item[sortBy], sortBy, item)}
                          </td>
                        </tr>
                      ))}
                      {rankedItems.length <= 3 && (
                        <tr>
                          <td colSpan="4" style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                            No other {rankingType === "player" ? "players" : "teams"} to display.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
