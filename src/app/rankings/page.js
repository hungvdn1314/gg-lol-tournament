"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  return (
    <Suspense fallback={<div className="container" style={{ textAlign: "center", padding: "4rem" }}>Loading rankings...</div>}>
      <RankingsContent />
    </Suspense>
  );
}

function RankingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryTab = searchParams.get("tab") || "awards";

  const [allMatches, setAllMatches] = useState({});
  const [teams, setTeams] = useState({});
  const [matches, setMatches] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(queryTab); // awards, players, teams
  const [rankingType, setRankingType] = useState(queryTab === "teams" ? "team" : "player"); // player, team
  const [sortBy, setSortBy] = useState(queryTab === "teams" ? "positionScore" : "seriesMvpCount");
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
      const bA = bP.reduce((s, p) => s + (p.assists || 0), 0);
      const rA = rP.reduce((s, p) => s + (p.assists || 0), 0);
      const bDeaths = bP.reduce((s, p) => s + (p.deaths || 0), 0);
      const rDeaths = rP.reduce((s, p) => s + (p.deaths || 0), 0);
      const bD = bP.reduce((s, p) => s + (p.damageDealt || 0), 0);
      const rD = rP.reduce((s, p) => s + (p.damageDealt || 0), 0);
      const bG = bP.reduce((s, p) => s + (p.gold || 0), 0);
      const rG = rP.reduce((s, p) => s + (p.gold || 0), 0);
      const bDT = bP.reduce((s, p) => s + (p.damageTaken || 0), 0);
      const rDT = rP.reduce((s, p) => s + (p.damageTaken || 0), 0);

      // Accumulate team per-game KDA
      const bGameKda = (bK + bA) / Math.max(bDeaths, 1);
      const rGameKda = (rK + rA) / Math.max(rDeaths, 1);
      if (bP[0]) {
        const playerTeam = playerToTeamMap[bP[0].playerName?.trim().toLowerCase()];
        const actualTeamId = playerTeam ? playerTeam.id : bP[0].teamId;
        if (teamsData[actualTeamId]) {
          teamsData[actualTeamId].totalGameKda = (teamsData[actualTeamId].totalGameKda || 0) + bGameKda;
        }
      }
      if (rP[0]) {
        const playerTeam = playerToTeamMap[rP[0].playerName?.trim().toLowerCase()];
        const actualTeamId = playerTeam ? playerTeam.id : rP[0].teamId;
        if (teamsData[actualTeamId]) {
          teamsData[actualTeamId].totalGameKda = (teamsData[actualTeamId].totalGameKda || 0) + rGameKda;
        }
      }

      const scored = calculateGameMVP(game.participants, game.gameDuration);
      const gameMvp = scored[0]?.playerName;

      game.participants.forEach(p => {
        if (!players[p.playerName]) {
          players[p.playerName] = {
            playerName: p.playerName,
            championCounts: {}, // to find most played champ
            gamesPlayed: 0,
            gamesWon: 0,
            kills: 0, deaths: 0, assists: 0,
            totalGameKda: 0,
            totalGameDpm: 0,
            totalGameDmgShare: 0,
            totalGameKp: 0,
            totalGameGpm: 0,
            totalGameDmgTakenShare: 0,
            totalGameCspm: 0,
            damageDealt: 0, damageTaken: 0,
            gold: 0, cs: 0,
            teamKills: 0, teamDamageDealt: 0, teamDamageTaken: 0,
            durationMins: 0,
            matchMvpCount: 0,
            seriesMvpCount: 0,
            groupMvpCount: 0,
            groupMatchMvpCount: 0,
            groupGamesWon: 0,
            groupTotalMvpScore: 0,
            playoffMvpCount: 0,
            playoffMatchMvpCount: 0,
            playoffGamesWon: 0,
            playoffTotalMvpScore: 0,
            grandFinalMvpCount: 0,
            grandFinalMatchMvpCount: 0,
            grandFinalGamesWon: 0,
            grandFinalTotalMvpScore: 0,
            totalMvpScore: 0,
            avgMvpScore: 0,
            pentaKills: 0,
            healing: 0
          };
        }

        const stats = players[p.playerName];
        stats.gamesPlayed += 1;
        stats.championCounts[p.champion] = (stats.championCounts[p.champion] || 0) + 1;
        
        const durationMins = game.gameDuration ? game.gameDuration / 60 : 0;
        const teamK = p.teamId === 100 ? bK : rK;
        const teamD = p.teamId === 100 ? bD : rD;
        const teamDT = p.teamId === 100 ? bDT : rDT;

        const gameKda = ((p.kills || 0) + (p.assists || 0)) / Math.max(p.deaths || 0, 1);
        const gameDpm = durationMins > 0 ? (p.damageDealt || 0) / durationMins : 0;
        const gameDmgShare = teamD > 0 ? ((p.damageDealt || 0) / teamD) * 100 : 0;
        const gameKp = teamK > 0 ? (((p.kills || 0) + (p.assists || 0)) / teamK) * 100 : 0;
        const gameGpm = durationMins > 0 ? (p.gold || 0) / durationMins : 0;
        const gameDmgTakenShare = teamDT > 0 ? ((p.damageTaken || 0) / teamDT) * 100 : 0;
        const gameCspm = durationMins > 0 ? (p.cs || 0) / durationMins : 0;

        stats.totalGameKda = (stats.totalGameKda || 0) + gameKda;
        stats.totalGameDpm = (stats.totalGameDpm || 0) + gameDpm;
        stats.totalGameDmgShare = (stats.totalGameDmgShare || 0) + gameDmgShare;
        stats.totalGameKp = (stats.totalGameKp || 0) + gameKp;
        stats.totalGameGpm = (stats.totalGameGpm || 0) + gameGpm;
        stats.totalGameDmgTakenShare = (stats.totalGameDmgTakenShare || 0) + gameDmgTakenShare;
        stats.totalGameCspm = (stats.totalGameCspm || 0) + gameCspm;

        stats.kills += (p.kills || 0);
        stats.deaths += (p.deaths || 0);
        stats.assists += (p.assists || 0);
        stats.damageDealt += (p.damageDealt || 0);
        stats.damageTaken += (p.damageTaken || 0);
        stats.gold += (p.gold || 0);
        stats.cs += (p.cs || 0);
        stats.durationMins += durationMins;
        stats.pentaKills += (p.pentaKills || 0);
        stats.healing += (p.healing || 0);

        stats.teamKills += teamK;
        stats.teamDamageDealt += teamD;
        stats.teamDamageTaken += teamDT;

        if (p.playerName === gameMvp) {
          stats.matchMvpCount += 1;
          if (isGroup) stats.groupMatchMvpCount += 1;
          if (isPlayoff) stats.playoffMatchMvpCount += 1;
          if (isGrandFinal) stats.grandFinalMatchMvpCount += 1;
        }

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
          if (pScored.totalScore > 0) {
            stats.gamesWon += 1;
            if (isGroup) stats.groupGamesWon += 1;
            if (isPlayoff) stats.playoffGamesWon += 1;
            if (isGrandFinal) stats.grandFinalGamesWon += 1;
          }
          stats.totalMvpScore = (stats.totalMvpScore || 0) + pScored.totalScore;
          if (isGroup) stats.groupTotalMvpScore = (stats.groupTotalMvpScore || 0) + pScored.totalScore;
          if (isPlayoff) stats.playoffTotalMvpScore = (stats.playoffTotalMvpScore || 0) + pScored.totalScore;
          if (isGrandFinal) stats.grandFinalTotalMvpScore = (stats.grandFinalTotalMvpScore || 0) + pScored.totalScore;

          seriesScores[p.playerName] = (seriesScores[p.playerName] || 0) + pScored.totalScore;
        }
      });
    });

    // Determine Series MVP
    const seriesMvp = Object.entries(seriesScores).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (seriesMvp && players[seriesMvp]) {
      players[seriesMvp].seriesMvpCount += 1;
      if (isGroup) {
        players[seriesMvp].groupMvpCount += 1;
      } else if (isPlayoff) {
        players[seriesMvp].playoffMvpCount += 1;
      } else if (isGrandFinal) {
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
      kda: p.gamesPlayed > 0 ? p.totalGameKda / p.gamesPlayed : 0,
      dpm: p.gamesPlayed > 0 ? p.totalGameDpm / p.gamesPlayed : 0,
      dmgShare: p.gamesPlayed > 0 ? p.totalGameDmgShare / p.gamesPlayed : 0,
      kp: p.gamesPlayed > 0 ? p.totalGameKp / p.gamesPlayed : 0,
      gpm: p.gamesPlayed > 0 ? p.totalGameGpm / p.gamesPlayed : 0,
      dmgTakenShare: p.gamesPlayed > 0 ? p.totalGameDmgTakenShare / p.gamesPlayed : 0,
      cspm: p.gamesPlayed > 0 ? p.totalGameCspm / p.gamesPlayed : 0,
      avgMvpScore: p.gamesWon > 0 ? p.totalMvpScore / p.gamesWon : 0,
      groupAvgMvpScore: p.groupGamesWon > 0 ? p.groupTotalMvpScore / p.groupGamesWon : 0,
      playoffAvgMvpScore: p.playoffGamesWon > 0 ? p.playoffTotalMvpScore / p.playoffGamesWon : 0,
      grandFinalAvgMvpScore: p.grandFinalGamesWon > 0 ? p.grandFinalTotalMvpScore / p.grandFinalGamesWon : 0,
    };
  });

  // Calculate advanced metrics for teams
  const rankedTeams = Object.values(teamsData).map(t => {
    return {
      ...t,
      kda: t.gamesPlayed > 0 ? (t.totalGameKda || 0) / t.gamesPlayed : 0,
      winRate: t.gamesPlayed > 0 ? (t.wins / t.gamesPlayed) * 100 : 0,
      dpg: t.gamesPlayed > 0 ? t.damageDealt / t.gamesPlayed : 0,
      gpg: t.gamesPlayed > 0 ? t.gold / t.gamesPlayed : 0,
      hpg: t.gamesPlayed > 0 ? t.healing / t.gamesPlayed : 0,
      cspg: t.gamesPlayed > 0 ? t.cs / t.gamesPlayed : 0
    };
  });

  const rankedItems = rankingType === "player" ? rankedPlayers : rankedTeams;
  rankedItems.sort((a, b) => {
    if (rankingType === "player") {
      if (sortBy === "seriesMvpCount") {
        if (b.seriesMvpCount !== a.seriesMvpCount) return b.seriesMvpCount - a.seriesMvpCount;
        if (b.matchMvpCount !== a.matchMvpCount) return b.matchMvpCount - a.matchMvpCount;
        if (b.avgMvpScore !== a.avgMvpScore) return b.avgMvpScore - a.avgMvpScore;
        return (b.kda || 0) - (a.kda || 0);
      }
      if (sortBy === "groupMvpCount") {
        if (b.groupMvpCount !== a.groupMvpCount) return b.groupMvpCount - a.groupMvpCount;
        if (b.groupMatchMvpCount !== a.groupMatchMvpCount) return b.groupMatchMvpCount - a.groupMatchMvpCount;
        if (b.groupAvgMvpScore !== a.groupAvgMvpScore) return b.groupAvgMvpScore - a.groupAvgMvpScore;
        return (b.kda || 0) - (a.kda || 0);
      }
      if (sortBy === "playoffMvpCount") {
        if (b.playoffMvpCount !== a.playoffMvpCount) return b.playoffMvpCount - a.playoffMvpCount;
        if (b.playoffMatchMvpCount !== a.playoffMatchMvpCount) return b.playoffMatchMvpCount - a.playoffMatchMvpCount;
        if (b.playoffAvgMvpScore !== a.playoffAvgMvpScore) return b.playoffAvgMvpScore - a.playoffAvgMvpScore;
        return (b.kda || 0) - (a.kda || 0);
      }
      if (sortBy === "grandFinalMvpCount") {
        if (b.grandFinalMvpCount !== a.grandFinalMvpCount) return b.grandFinalMvpCount - a.grandFinalMvpCount;
        if (b.grandFinalMatchMvpCount !== a.grandFinalMatchMvpCount) return b.grandFinalMatchMvpCount - a.grandFinalMatchMvpCount;
        if (b.grandFinalAvgMvpScore !== a.grandFinalAvgMvpScore) return b.grandFinalAvgMvpScore - a.grandFinalAvgMvpScore;
        return (b.kda || 0) - (a.kda || 0);
      }
      if (sortBy === "matchMvpCount") {
        if (b.matchMvpCount !== a.matchMvpCount) return b.matchMvpCount - a.matchMvpCount;
        if (b.seriesMvpCount !== a.seriesMvpCount) return b.seriesMvpCount - a.seriesMvpCount;
        if (b.avgMvpScore !== a.avgMvpScore) return b.avgMvpScore - a.avgMvpScore;
        return (b.kda || 0) - (a.kda || 0);
      }
      if (b[sortBy] !== a[sortBy]) {
        return b[sortBy] - a[sortBy];
      }
      return (b.kda || 0) - (a.kda || 0);
    }
    if (rankingType === "team") {
      if (b[sortBy] !== a[sortBy]) {
        return b[sortBy] - a[sortBy];
      }
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
      let seriesVal = item.seriesMvpCount || 0;
      let matchVal = item.matchMvpCount || 0;
      let avgVal = item.avgMvpScore || 0;

      if (metricId === "groupMvpCount") {
        seriesVal = item.groupMvpCount || 0;
        matchVal = item.groupMatchMvpCount || 0;
        avgVal = item.groupAvgMvpScore || 0;
      } else if (metricId === "playoffMvpCount") {
        seriesVal = item.playoffMvpCount || 0;
        matchVal = item.playoffMatchMvpCount || 0;
        avgVal = item.playoffAvgMvpScore || 0;
      } else if (metricId === "grandFinalMvpCount") {
        seriesVal = item.grandFinalMvpCount || 0;
        matchVal = item.grandFinalMatchMvpCount || 0;
        avgVal = item.grandFinalAvgMvpScore || 0;
      }

      return `${seriesVal} Series MVP${seriesVal !== 1 ? 's' : ''} · ${matchVal} Match MVP${matchVal !== 1 ? 's' : ''} (Avg: ${avgVal.toFixed(1)})`;
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
    
    const champId = gf && gf.status === "completed" ? gf.winnerId : null;
    const runnerId = gf && gf.status === "completed" ? (gf.winnerId === gf.teamAId ? gf.teamBId : gf.teamAId) : null;
    const thirdId = lbf && lbf.status === "completed" ? (lbf.winnerId === lbf.teamAId ? lbf.teamBId : lbf.teamAId) : null;

    const champ = champId ? teams[champId] : null;
    const runner = runnerId ? teams[runnerId] : null;
    const third = thirdId ? teams[thirdId] : null;

    const renderRosterChips = (teamObj) => {
      if (!teamObj || !Array.isArray(teamObj.players) || teamObj.players.length === 0) {
        return <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>No roster registered</span>;
      }
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.5rem" }}>
          {teamObj.players.map(p => (
            <Link
              key={p.name}
              href={`/players/${encodeURIComponent(p.name)}?backUrl=${encodeURIComponent(`/rankings?tab=awards`)}`}
              style={{ display: "flex", alignItems: "center", gap: "0.3rem", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid var(--border-dark)", borderRadius: "20px", padding: "0.15rem 0.5rem 0.15rem 0.25rem", textDecoration: "none", transition: "border-color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-dark)"}
            >
              <PlayerSignature name={p.name} size={20} />
              <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", whiteSpace: "nowrap", fontWeight: "600" }}>{p.name}</span>
            </Link>
          ))}
        </div>
      );
    };

    const renderTeamRow = (teamObj, teamId, rankLabel, accentColor, borderColor) => (
      <div style={{ backgroundColor: `rgba(${accentColor}, 0.04)`, padding: "0.9rem 1rem", borderRadius: "10px", border: `1px solid rgba(${accentColor}, 0.2)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: teamObj ? "0.5rem" : "0" }}>
          <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>{rankLabel}</span>
          {teamObj ? (
            <Link href={`/teams?teamId=${teamId}&backUrl=${encodeURIComponent(`/rankings?tab=awards`)}`} className="no-zoom">
              <img
                src={teamObj.logo || (typeof teamLogoPlaceholder === "function" ? teamLogoPlaceholder(teamObj.name, 36) : "")}
                alt={teamObj.name}
                className="no-zoom"
                style={{ width: "36px", height: "36px", objectFit: "contain", borderRadius: "6px", backgroundColor: "rgba(255,255,255,0.03)", padding: "2px", flexShrink: 0 }}
              />
            </Link>
          ) : (
            <div style={{ width: "36px", height: "36px", borderRadius: "6px", backgroundColor: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>?</div>
          )}
          <div style={{ minWidth: 0 }}>
            {teamObj ? (
              <Link href={`/teams?teamId=${teamId}&backUrl=${encodeURIComponent(`/rankings?tab=awards`)}`} style={{ fontWeight: "700", color: `rgb(${accentColor})`, textDecoration: "none", fontSize: "1rem", display: "block" }}>
                {teamObj.name}
              </Link>
            ) : (
              <em style={{ color: "var(--text-muted)", fontWeight: "normal", fontSize: "0.9rem" }}>TBD – Playoffs in progress</em>
            )}
          </div>
        </div>
        {teamObj && renderRosterChips(teamObj)}
      </div>
    );

    return (
      <div className="card" style={{
        background: "linear-gradient(135deg, rgba(212, 175, 55, 0.06), rgba(0,0,0,0.7))",
        border: "1px solid rgba(212, 175, 55, 0.3)",
        boxShadow: "0 8px 30px rgba(0,0,0,0.4), 0 0 20px rgba(212, 175, 55, 0.05)",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        minHeight: "420px",
        transition: "transform 0.3s ease, border-color 0.3s ease",
        borderRadius: "12px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <span style={{ color: "var(--primary-gold)", fontWeight: "bold", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>🏆 Reward Category</span>
          <span style={{ color: "var(--primary-gold-bright)", fontWeight: "900", fontSize: "1.2rem" }}>🥇 🥈 🥉</span>
        </div>
        <h3 style={{ fontSize: "1.5rem", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: "800", letterSpacing: "0.03em", color: "var(--primary-gold-bright)" }}>Championship Standings</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
          Awarded to the top placing teams in the tournament playoffs.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {renderTeamRow(champ, champId, "🥇", "212,175,55", "gold")}
          {renderTeamRow(runner, runnerId, "🥈", "192,192,192", "silver")}
          {renderTeamRow(third, thirdId, "🥉", "205,127,50", "bronze")}
        </div>
      </div>
    );
  };

  const renderMvpAwardCard = () => {
    const sortedGroupPlayers = [...rankedPlayers].sort((a, b) => {
      if (b.groupMvpCount !== a.groupMvpCount) return b.groupMvpCount - a.groupMvpCount;
      if (b.groupMatchMvpCount !== a.groupMatchMvpCount) return b.groupMatchMvpCount - a.groupMatchMvpCount;
      return b.groupAvgMvpScore - a.groupAvgMvpScore;
    });
    const topGroupMvp = sortedGroupPlayers[0];
    const hasGroupMvp = topGroupMvp && (topGroupMvp.groupMvpCount > 0 || topGroupMvp.groupMatchMvpCount > 0);

    const sortedPlayoffPlayers = [...rankedPlayers].sort((a, b) => {
      if (b.playoffMvpCount !== a.playoffMvpCount) return b.playoffMvpCount - a.playoffMvpCount;
      if (b.playoffMatchMvpCount !== a.playoffMatchMvpCount) return b.playoffMatchMvpCount - a.playoffMatchMvpCount;
      return b.playoffAvgMvpScore - a.playoffAvgMvpScore;
    });
    const topPlayoffMvp = sortedPlayoffPlayers[0];
    const hasPlayoffMvp = topPlayoffMvp && (topPlayoffMvp.playoffMvpCount > 0 || topPlayoffMvp.playoffMatchMvpCount > 0);

    const sortedGfPlayers = [...rankedPlayers].sort((a, b) => {
      if (b.grandFinalMvpCount !== a.grandFinalMvpCount) return b.grandFinalMvpCount - a.grandFinalMvpCount;
      if (b.grandFinalMatchMvpCount !== a.grandFinalMatchMvpCount) return b.grandFinalMatchMvpCount - a.grandFinalMatchMvpCount;
      return b.grandFinalAvgMvpScore - a.grandFinalAvgMvpScore;
    });
    const topGfMvp = sortedGfPlayers[0];
    const hasGfMvp = topGfMvp && (topGfMvp.grandFinalMvpCount > 0 || topGfMvp.grandFinalMatchMvpCount > 0);

    const stageColors = {
      GP: { bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.3)", text: "#60a5fa", label: "Group Stage MVP", seriesKey: "groupMvpCount", matchKey: "groupMatchMvpCount", avgKey: "groupAvgMvpScore" },
      PO: { bg: "rgba(192,132,252,0.12)", border: "rgba(192,132,252,0.3)", text: "#c084fc", label: "Playoff MVP", seriesKey: "playoffMvpCount", matchKey: "playoffMatchMvpCount", avgKey: "playoffAvgMvpScore" },
      GF: { bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.35)", text: "#fbbf24", label: "Grand Final MVP", seriesKey: "grandFinalMvpCount", matchKey: "grandFinalMatchMvpCount", avgKey: "grandFinalAvgMvpScore" },
    };

    const renderMvpRow = (player, hasMvp, stage) => {
      const sc = stageColors[stage];
      const seriesCount = player ? (player[sc.seriesKey] || 0) : 0;
      const matchCount = player ? (player[sc.matchKey] || 0) : 0;
      const avgScore = player ? (player[sc.avgKey] || 0) : 0;

      return (
        <div style={{ backgroundColor: sc.bg, padding: "0.9rem 1rem", borderRadius: "10px", border: `1px solid ${sc.border}` }}>
          {/* Stage label */}
          <div style={{ marginBottom: hasMvp ? "0.65rem" : "0" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.1em", color: sc.text }}>{sc.label}</span>
          </div>
          {hasMvp ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <PlayerSignature name={player.playerName} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Player name */}
                <Link
                  href={`/players/${encodeURIComponent(player.playerName)}?backUrl=${encodeURIComponent(`/rankings?tab=awards`)}`}
                  style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "1rem", textDecoration: "none", display: "block", lineHeight: 1.2 }}
                >
                  {player.playerName}
                </Link>
                {/* Team name */}
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginTop: "0.15rem" }}>
                  {playerToTeamMap[player.playerName?.trim().toLowerCase()]?.name || "Free Agent"}
                </span>
                {/* Combined Stats row — Series MVP + Match MVP + Avg Score */}
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.4rem", marginTop: "0.45rem" }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "0.25rem",
                    fontWeight: "900", fontSize: "0.85rem", color: sc.text,
                    backgroundColor: `${sc.bg}`, border: `1px solid ${sc.border}`,
                    padding: "0.15rem 0.5rem", borderRadius: "20px"
                  }}>
                    <Award size={12} />
                    {seriesCount} Series MVP{seriesCount !== 1 ? "s" : ""}
                  </span>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "0.25rem",
                    fontWeight: "800", fontSize: "0.85rem", color: sc.text,
                    backgroundColor: `${sc.bg}`, border: `1px solid ${sc.border}`,
                    padding: "0.15rem 0.5rem", borderRadius: "20px", opacity: 0.9
                  }}>
                    {matchCount} Match MVP{matchCount !== 1 ? "s" : ""}
                  </span>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "0.25rem",
                    fontWeight: "800", fontSize: "0.85rem", color: sc.text,
                    backgroundColor: `${sc.bg}`, border: `1px solid ${sc.border}`,
                    padding: "0.15rem 0.5rem", borderRadius: "20px", opacity: 0.85
                  }}>
                    Avg {avgScore.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", fontStyle: "italic" }}>TBD – No MVPs awarded yet</div>
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
        minHeight: "420px",
        borderRadius: "12px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <span style={{ color: "#c084fc", fontWeight: "bold", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>👑 MVP Awards</span>
          <span style={{ color: "#c084fc", fontWeight: "900", fontSize: "1.2rem" }}>👑</span>
        </div>
        <h3 style={{ fontSize: "1.5rem", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: "800", letterSpacing: "0.03em", color: "#c084fc" }}>Tournament MVPs</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
          Ranked by Series MVPs, Match MVPs, and phase average MVP scores per stage.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {renderMvpRow(topGroupMvp, hasGroupMvp, "GP")}
          {renderMvpRow(topPlayoffMvp, hasPlayoffMvp, "PO")}
          {renderMvpRow(topGfMvp, hasGfMvp, "GF")}
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
        minHeight: "420px",
        maxHeight: "calc(80vh - 2rem)",
        boxSizing: "border-box",
        borderRadius: "12px"
      }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
            <span style={{ color: "#ef4444", fontWeight: "bold", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>⚡ Bounty Rewards</span>
            <span style={{ color: "#ef4444", fontWeight: "900", fontSize: "1.2rem" }}>⚡</span>
          </div>
          <h3 style={{ fontSize: "1.5rem", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: "800", letterSpacing: "0.03em", color: "#ef4444" }}>Pentakill Slayers</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Rewarded to players per pentakill secured during the tournament.
          </p>

          {hasPentakills ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto", flex: 1, minHeight: 0, paddingRight: "2px" }}>
              {pentakillPlayers.map(player => (
                <div key={player.playerName} style={{ display: "flex", alignItems: "center", gap: "1rem", backgroundColor: "rgba(239, 68, 68, 0.05)", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                  <PlayerSignature name={player.playerName} size={40} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <Link 
                        href={`/players/${encodeURIComponent(player.playerName)}?backUrl=${encodeURIComponent(`/rankings?tab=awards`)}`} 
                        style={{ fontWeight: "bold", color: "var(--text-primary)", fontSize: "0.95rem", textDecoration: "none", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", marginRight: "0.5rem" }}
                      >
                        {player.playerName}
                      </Link>
                      <span style={{ fontWeight: "bold", color: "#ef4444", fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.25rem", whiteSpace: "nowrap", flexShrink: 0 }}>
                        <span>{player.pentaKills}</span>
                        <Zap size={14} style={{ color: "#ef4444" }} />
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                      <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", marginRight: "0.5rem" }}>
                        {playerToTeamMap[player.playerName?.trim().toLowerCase()]?.name || "Free Agent"}
                      </span>
                      <span style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
                        Total Kills: {player.kills}
                      </span>
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

          {(activeTab === "players" || activeTab === "teams") && (() => {
            const maxVal = rankedItems.length > 0 ? rankedItems[0][sortBy] : 1;

            return (
              <>
                {/* ── Section header ── */}
                <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                  <span style={{
                    display: "inline-block", marginBottom: "0.75rem",
                    backgroundColor: rankingType === "player" ? "rgba(192,132,252,0.08)" : "rgba(212,175,55,0.08)",
                    border: `1px solid ${rankingType === "player" ? "rgba(192,132,252,0.35)" : "var(--border-gold)"}`,
                    color: rankingType === "player" ? "#c084fc" : "var(--primary-gold)",
                    textTransform: "uppercase", fontSize: "0.75rem", fontWeight: "800",
                    padding: "0.3rem 1.1rem", borderRadius: "20px", letterSpacing: "0.12em"
                  }}>
                    {rankingType === "player" ? "Player Leaderboard" : "Team Leaderboard"}
                  </span>
                  <h2 style={{
                    fontSize: "2rem", fontWeight: "900", textTransform: "uppercase",
                    letterSpacing: "0.06em", margin: "0 auto 0.4rem",
                    color: rankingType === "player" ? "#c084fc" : "var(--primary-gold-bright)"
                  }}>
                    {getMetricLabel(sortBy)}
                  </h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    {rankingType === "player"
                      ? "Ranked by performance across all tournament matches."
                      : "Ranked by team results throughout the tournament."}
                  </p>
                </div>

                {/* ── Metric selector strip ── */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
                  <div style={{
                    display: "flex", gap: "0", overflowX: "auto", flexWrap: "nowrap",
                    backgroundColor: "rgba(0,0,0,0.4)", border: "1px solid var(--border-dark)",
                    borderRadius: "12px", padding: "6px"
                  }}>
                    {metrics.map(m => {
                      const isActive = sortBy === m.id ||
                        (m.id === "seriesMvpCount" && ["seriesMvpCount","groupMvpCount","playoffMvpCount","grandFinalMvpCount"].includes(sortBy));
                      return (
                        <button
                          key={m.id}
                          onClick={() => setSortBy(m.id)}
                          style={{
                            display: "flex", alignItems: "center", gap: "0.4rem",
                            padding: "0.45rem 1rem", borderRadius: "8px", border: "none",
                            background: isActive
                              ? (rankingType === "player" ? "rgba(192,132,252,0.15)" : "rgba(212,175,55,0.12)")
                              : "transparent",
                            color: isActive
                              ? (rankingType === "player" ? "#c084fc" : "var(--primary-gold-bright)")
                              : "var(--text-muted)",
                            fontWeight: isActive ? "800" : "500",
                            fontSize: "0.8rem", cursor: "pointer", whiteSpace: "nowrap",
                            transition: "all 0.2s ease",
                            borderBottom: isActive
                              ? `2px solid ${rankingType === "player" ? "#c084fc" : "var(--primary-gold)"}`
                              : "2px solid transparent",
                            boxShadow: isActive
                              ? `0 0 12px ${rankingType === "player" ? "rgba(192,132,252,0.2)" : "rgba(212,175,55,0.15)"}`
                              : "none"
                          }}
                        >
                          {m.icon}
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Sub-selector for MVP stages ── */}
                {activeTab === "players" && ["seriesMvpCount","groupMvpCount","playoffMvpCount","grandFinalMvpCount"].includes(sortBy) && (
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "2.5rem" }}>
                    <div style={{ display: "flex", gap: "0.4rem", backgroundColor: "rgba(192,132,252,0.06)", border: "1px solid rgba(192,132,252,0.2)", borderRadius: "8px", padding: "5px" }}>
                      {[
                        { id: "seriesMvpCount", label: "All Stages" },
                        { id: "groupMvpCount", label: "Group Stage" },
                        { id: "playoffMvpCount", label: "Playoffs" },
                        { id: "grandFinalMvpCount", label: "Grand Final" },
                      ].map(s => (
                        <button key={s.id} onClick={() => setSortBy(s.id)} style={{
                          padding: "0.3rem 0.9rem", borderRadius: "5px", border: "none", cursor: "pointer",
                          background: sortBy === s.id ? "rgba(192,132,252,0.25)" : "transparent",
                          color: sortBy === s.id ? "#c084fc" : "var(--text-muted)",
                          fontWeight: sortBy === s.id ? "800" : "500",
                          fontSize: "0.75rem", transition: "all 0.2s",
                          boxShadow: sortBy === s.id ? "0 0 8px rgba(192,132,252,0.2)" : "none"
                        }}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Top 3 Podium ── */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "3rem" }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "1.5rem", marginBottom: "0" }}>

                    {/* 2nd Place */}
                    {top2 && (
                      <div
                        style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "150px", cursor: "pointer" }}
                        onClick={e => { if (!e.target.closest("a")) router.push(rankingType === "team" ? `/teams?teamId=${top2.teamId}&backUrl=${encodeURIComponent(`/rankings?tab=teams`)}` : `/players/${encodeURIComponent(top2.playerName)}?backUrl=${encodeURIComponent(`/rankings?tab=players`)}`); }}
                      >
                        <div style={{ marginBottom: "0.75rem", filter: "drop-shadow(0 0 10px rgba(192,192,192,0.4))" }}>
                          {rankingType === "player" ? (
                            <PlayerSignature name={top2.playerName} size={60} />
                          ) : (
                            <Link href={`/teams?teamId=${top2.teamId}&backUrl=${encodeURIComponent(`/rankings?tab=teams`)}`} className="no-zoom">
                              <img src={top2.logo || (typeof teamLogoPlaceholder === "function" ? teamLogoPlaceholder(top2.teamName, 60) : "")} alt={top2.teamName} className="no-zoom"
                                style={{ width: "60px", height: "60px", borderRadius: "10px", border: "2px solid #C0C0C0", objectFit: "contain", padding: "4px", backgroundColor: "rgba(255,255,255,0.04)" }} />
                            </Link>
                          )}
                        </div>
                        <Link href={rankingType === "player" ? `/players/${encodeURIComponent(top2.playerName)}?backUrl=${encodeURIComponent(`/rankings?tab=players`)}` : `/teams?teamId=${top2.teamId}&backUrl=${encodeURIComponent(`/rankings?tab=teams`)}`}
                          style={{ fontWeight: "700", fontSize: "0.85rem", textAlign: "center", textDecoration: "none", color: "#C0C0C0", marginBottom: "0.2rem", display: "block" }}>
                          {rankingType === "player" ? top2.playerName : top2.teamName}
                        </Link>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>{top2.gamesPlayed} Games</div>
                        {/* Pedestal */}
                        <div style={{
                          width: "100%", height: "120px", borderRadius: "8px 8px 0 0",
                          background: "linear-gradient(180deg, rgba(192,192,192,0.15) 0%, rgba(192,192,192,0.04) 100%)",
                          border: "1px solid rgba(192,192,192,0.35)", borderBottom: "none",
                          boxShadow: "0 -6px 20px rgba(192,192,192,0.12)",
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.3rem"
                        }}>
                          <div style={{ fontSize: "2rem", fontWeight: "900", color: "#C0C0C0", lineHeight: 1 }}>2</div>
                          <div style={{ fontSize: "0.85rem", fontWeight: "800", color: "#C0C0C0", textAlign: "center", padding: "0 8px" }}>
                            {formatStat(top2[sortBy], sortBy, top2)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 1st Place */}
                    {top1 && (
                      <div
                        style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "170px", cursor: "pointer" }}
                        onClick={e => { if (!e.target.closest("a")) router.push(rankingType === "team" ? `/teams?teamId=${top1.teamId}&backUrl=${encodeURIComponent(`/rankings?tab=teams`)}` : `/players/${encodeURIComponent(top1.playerName)}?backUrl=${encodeURIComponent(`/rankings?tab=players`)}`); }}
                      >
                        <div style={{ position: "relative", marginBottom: "0.75rem" }}>
                          <SummonersCup size={28} style={{ color: "var(--primary-gold)", position: "absolute", top: "-28px", left: "50%", transform: "translateX(-50%)", filter: "drop-shadow(0 0 8px var(--primary-gold))" }} />
                          <div style={{ filter: "drop-shadow(0 0 16px rgba(212,175,55,0.6))" }}>
                            {rankingType === "player" ? (
                              <PlayerSignature name={top1.playerName} size={80} />
                            ) : (
                              <Link href={`/teams?teamId=${top1.teamId}&backUrl=${encodeURIComponent(`/rankings?tab=teams`)}`} className="no-zoom">
                                <img src={top1.logo || (typeof teamLogoPlaceholder === "function" ? teamLogoPlaceholder(top1.teamName, 80) : "")} alt={top1.teamName} className="no-zoom"
                                  style={{ width: "80px", height: "80px", borderRadius: "12px", border: "3px solid var(--primary-gold)", objectFit: "contain", padding: "6px", backgroundColor: "rgba(255,255,255,0.04)" }} />
                              </Link>
                            )}
                          </div>
                        </div>
                        <Link href={rankingType === "player" ? `/players/${encodeURIComponent(top1.playerName)}?backUrl=${encodeURIComponent(`/rankings?tab=players`)}` : `/teams?teamId=${top1.teamId}&backUrl=${encodeURIComponent(`/rankings?tab=teams`)}`}
                          style={{ fontWeight: "800", fontSize: "1rem", textAlign: "center", textDecoration: "none", color: "var(--primary-gold-bright)", marginBottom: "0.2rem", display: "block" }}>
                          {rankingType === "player" ? top1.playerName : top1.teamName}
                        </Link>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>{top1.gamesPlayed} Games</div>
                        {/* Pedestal */}
                        <div style={{
                          width: "100%", height: "165px", borderRadius: "8px 8px 0 0",
                          background: "linear-gradient(180deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 100%)",
                          border: "1px solid rgba(212,175,55,0.5)", borderBottom: "none",
                          boxShadow: "0 -12px 40px rgba(212,175,55,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.4rem"
                        }}>
                          <div style={{ fontSize: "2.8rem", fontWeight: "900", color: "var(--primary-gold)", lineHeight: 1, textShadow: "0 0 20px rgba(212,175,55,0.5)" }}>1</div>
                          <div style={{ fontSize: "1rem", fontWeight: "900", color: "var(--primary-gold-bright)", textAlign: "center", padding: "0 8px", textShadow: "0 0 12px rgba(212,175,55,0.3)" }}>
                            {formatStat(top1[sortBy], sortBy, top1)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3rd Place */}
                    {top3 && (
                      <div
                        style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "150px", cursor: "pointer" }}
                        onClick={e => { if (!e.target.closest("a")) router.push(rankingType === "team" ? `/teams?teamId=${top3.teamId}&backUrl=${encodeURIComponent(`/rankings?tab=teams`)}` : `/players/${encodeURIComponent(top3.playerName)}?backUrl=${encodeURIComponent(`/rankings?tab=players`)}`); }}
                      >
                        <div style={{ marginBottom: "0.75rem", filter: "drop-shadow(0 0 8px rgba(205,127,50,0.35))" }}>
                          {rankingType === "player" ? (
                            <PlayerSignature name={top3.playerName} size={60} />
                          ) : (
                            <Link href={`/teams?teamId=${top3.teamId}&backUrl=${encodeURIComponent(`/rankings?tab=teams`)}`} className="no-zoom">
                              <img src={top3.logo || (typeof teamLogoPlaceholder === "function" ? teamLogoPlaceholder(top3.teamName, 60) : "")} alt={top3.teamName} className="no-zoom"
                                style={{ width: "60px", height: "60px", borderRadius: "10px", border: "2px solid #CD7F32", objectFit: "contain", padding: "4px", backgroundColor: "rgba(255,255,255,0.04)" }} />
                            </Link>
                          )}
                        </div>
                        <Link href={rankingType === "player" ? `/players/${encodeURIComponent(top3.playerName)}?backUrl=${encodeURIComponent(`/rankings?tab=players`)}` : `/teams?teamId=${top3.teamId}&backUrl=${encodeURIComponent(`/rankings?tab=teams`)}`}
                          style={{ fontWeight: "700", fontSize: "0.85rem", textAlign: "center", textDecoration: "none", color: "#CD7F32", marginBottom: "0.2rem", display: "block" }}>
                          {rankingType === "player" ? top3.playerName : top3.teamName}
                        </Link>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>{top3.gamesPlayed} Games</div>
                        {/* Pedestal */}
                        <div style={{
                          width: "100%", height: "95px", borderRadius: "8px 8px 0 0",
                          background: "linear-gradient(180deg, rgba(205,127,50,0.12) 0%, rgba(205,127,50,0.03) 100%)",
                          border: "1px solid rgba(205,127,50,0.3)", borderBottom: "none",
                          boxShadow: "0 -4px 16px rgba(205,127,50,0.1)",
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.25rem"
                        }}>
                          <div style={{ fontSize: "1.4rem", fontWeight: "900", color: "#CD7F32", lineHeight: 1 }}>3</div>
                          <div style={{ fontSize: "0.85rem", fontWeight: "800", color: "#CD7F32", textAlign: "center", padding: "0 8px" }}>
                            {formatStat(top3[sortBy], sortBy, top3)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Podium ground line */}
                  <div style={{ width: "100%", maxWidth: "560px", height: "2px", background: "linear-gradient(90deg, transparent, var(--border-dark), var(--primary-gold), var(--border-dark), transparent)" }} />
                </div>

                {/* ── Ranking list (4th+) ── */}
                {rankedItems.slice(3).length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {rankedItems.slice(3).map((item, idx) => {
                      const rank = idx + 4;
                      const pct = maxVal > 0 ? ((item[sortBy] || 0) / maxVal) * 100 : 0;
                      const accentColor = rankingType === "player" ? "rgba(192,132,252," : "rgba(212,175,55,";

                      return (
                        <div
                          key={idx}
                          style={{
                            display: "flex", alignItems: "center", gap: "1rem",
                            backgroundColor: "rgba(255,255,255,0.02)",
                            border: "1px solid var(--border-dark)",
                            borderLeft: `3px solid ${rankingType === "player" ? "rgba(192,132,252,0.35)" : "rgba(212,175,55,0.35)"}`,
                            borderRadius: "10px", padding: "0.8rem 1.1rem",
                            transition: "background 0.2s, border-color 0.2s, box-shadow 0.2s",
                            cursor: "pointer"
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = `${accentColor}0.05)`;
                            e.currentTarget.style.borderColor = `${accentColor}0.4)`;
                            e.currentTarget.style.boxShadow = `0 2px 16px ${accentColor}0.08)`;
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.02)";
                            e.currentTarget.style.borderColor = "var(--border-dark)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                          onClick={e => {
                            if (e.target.closest("a")) return; // let inner Links handle their own navigation
                            if (rankingType === "team") {
                              router.push(`/teams?teamId=${item.teamId}&backUrl=${encodeURIComponent(`/rankings?tab=teams`)}`);
                            } else {
                              router.push(`/players/${encodeURIComponent(item.playerName)}?backUrl=${encodeURIComponent(`/rankings?tab=players`)}`);
                            }
                          }}
                        >
                          {/* Rank badge */}
                          <div style={{
                            minWidth: "32px", height: "32px", borderRadius: "8px",
                            backgroundColor: "rgba(255,255,255,0.04)",
                            border: "1px solid var(--border-dark)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: "800", fontSize: "0.8rem", color: "var(--text-muted)"
                          }}>
                            {rank}
                          </div>

                          {/* Avatar / logo */}
                          {rankingType === "player" ? (
                            <PlayerSignature name={item.playerName} size={36} />
                          ) : (
                            <Link href={`/teams?teamId=${item.teamId}&backUrl=${encodeURIComponent(`/rankings?tab=teams`)}`} className="no-zoom">
                              <img src={item.logo || (typeof teamLogoPlaceholder === "function" ? teamLogoPlaceholder(item.teamName, 36) : "")} alt={item.teamName} className="no-zoom"
                                style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "contain", padding: "2px", backgroundColor: "rgba(255,255,255,0.04)" }} />
                            </Link>
                          )}

                          {/* Name + stat bar */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                              <Link
                                href={rankingType === "player" ? `/players/${encodeURIComponent(item.playerName)}?backUrl=${encodeURIComponent(`/rankings?tab=players`)}` : `/teams?teamId=${item.teamId}&backUrl=${encodeURIComponent(`/rankings?tab=teams`)}`}
                                style={{ fontWeight: "700", textDecoration: "none", color: "var(--text-primary)", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
                              >
                                {rankingType === "player" ? item.playerName : item.teamName}
                                {rankingType === "team" && getPositionBadge(item.position)}
                              </Link>
                              {/* Stat pill */}
                              <span style={{
                                fontWeight: "800", fontSize: "0.88rem", whiteSpace: "nowrap", flexShrink: 0,
                                color: rankingType === "player" ? "#c084fc" : "var(--primary-gold-bright)",
                                backgroundColor: rankingType === "player" ? "rgba(192,132,252,0.1)" : "rgba(212,175,55,0.08)",
                                border: `1px solid ${rankingType === "player" ? "rgba(192,132,252,0.25)" : "rgba(212,175,55,0.2)"}`,
                                padding: "0.15rem 0.6rem", borderRadius: "20px"
                              }}>
                                {formatStat(item[sortBy], sortBy, item)}
                              </span>
                            </div>
                            {/* Comparison bar */}
                            <div style={{ marginTop: "0.35rem", height: "3px", borderRadius: "2px", backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                              <div style={{
                                height: "100%", borderRadius: "2px", width: `${pct}%`,
                                background: rankingType === "player"
                                  ? "linear-gradient(90deg, rgba(192,132,252,0.4), #c084fc)"
                                  : "linear-gradient(90deg, rgba(212,175,55,0.4), var(--primary-gold))",
                                transition: "width 0.6s ease"
                              }} />
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                              {item.gamesPlayed} games played
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {rankedItems.length <= 3 && (
                  <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    No other {rankingType === "player" ? "players" : "teams"} to display.
                  </div>
                )}
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}
