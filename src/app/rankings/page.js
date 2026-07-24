"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { subscribeToAllMatchDetails, subscribeToData } from "@/lib/db";
import { SummonersCup, HextechCrest } from "@/components/Icons";
import { Award, Eye, Crosshair, Shield, Coins, Target, Heart, Zap, Crown } from "lucide-react";
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
  const [sortColumn, setSortColumn] = useState(queryTab === "teams" ? "positionScore" : "seriesMvpCount");
  const [sortOrder, setSortOrder] = useState("desc");
  const [version, setVersion] = useState("16.13.1");
  const [concept, setConcept] = useState(searchParams.get("concept") || "concept3");



  // Sort options
  const playerMetrics = [
    { id: "seriesMvpCount", label: "Series MVPs", icon: <Crown size={14} /> },
    { id: "kda", label: "KDA", icon: <Crosshair size={14} /> },
    { id: "damageDealt", label: "Damage Dealt", icon: <Target size={14} /> },
    { id: "damageTaken", label: "Damage Taken", icon: <Shield size={14} /> },
    { id: "healing", label: "Healing & Shielding", icon: <Heart size={14} /> }
  ];

  const teamMetrics = [
    { id: "positionScore", label: "Final Position", icon: <Award size={14} /> },
    { id: "avgDmg", label: "Fighting Stats", icon: <Target size={14} /> },
    { id: "avgKills", label: "KDA Stats", icon: <Crosshair size={14} /> },
  ];

  const metrics = rankingType === "player" ? playerMetrics : teamMetrics;

  const renderSortableHeader = (metric) => (
    <th 
      key={metric.id} 
      onClick={() => handleSort(metric.id)}
      style={{ padding: "0.75rem", cursor: "pointer", color: sortColumn === metric.id ? "white" : "var(--text-muted)" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", justifyContent: "center" }}>
        {metric.icon} {metric.label}
        {sortColumn === metric.id && (sortOrder === "desc" ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
      </div>
    </th>
  );

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

    const isGroup = matchId.startsWith("match-g-");
    const isPlayoff = matchId.startsWith("match-playoff-") && matchId !== "match-playoff-8";
    const isGrandFinal = matchId === "match-playoff-8";

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
      const bH = bP.reduce((s, p) => s + (p.healing || 0), 0);
      const rH = rP.reduce((s, p) => s + (p.healing || 0), 0);

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
            totalGameDtpm: 0,
            totalGameDmgTakenShare: 0,
            totalGameHpm: 0,
            totalGameHealingShare: 0,
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
        const teamH = p.teamId === 100 ? bH : rH;

        const gameKda = ((p.kills || 0) + (p.assists || 0)) / Math.max(p.deaths || 0, 1);
        const gameDpm = durationMins > 0 ? (p.damageDealt || 0) / durationMins : 0;
        const gameDmgShare = teamD > 0 ? ((p.damageDealt || 0) / teamD) * 100 : 0;
        const gameKp = teamK > 0 ? (((p.kills || 0) + (p.assists || 0)) / teamK) * 100 : 0;
        const gameGpm = durationMins > 0 ? (p.gold || 0) / durationMins : 0;
        const gameDtpm = durationMins > 0 ? (p.damageTaken || 0) / durationMins : 0;
        const gameDmgTakenShare = teamDT > 0 ? ((p.damageTaken || 0) / teamDT) * 100 : 0;
        const gameHpm = durationMins > 0 ? (p.healing || 0) / durationMins : 0;
        const gameHealingShare = teamH > 0 ? ((p.healing || 0) / teamH) * 100 : 0;
        const gameCspm = durationMins > 0 ? (p.cs || 0) / durationMins : 0;

        stats.totalGameKda = (stats.totalGameKda || 0) + gameKda;
        stats.totalGameDpm = (stats.totalGameDpm || 0) + gameDpm;
        stats.totalGameDmgShare = (stats.totalGameDmgShare || 0) + gameDmgShare;
        stats.totalGameKp = (stats.totalGameKp || 0) + gameKp;
        stats.totalGameGpm = (stats.totalGameGpm || 0) + gameGpm;
        stats.totalGameDtpm = (stats.totalGameDtpm || 0) + gameDtpm;
        stats.totalGameDmgTakenShare = (stats.totalGameDmgTakenShare || 0) + gameDmgTakenShare;
        stats.totalGameHpm = (stats.totalGameHpm || 0) + gameHpm;
        stats.totalGameHealingShare = (stats.totalGameHealingShare || 0) + gameHealingShare;
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
    const totalKda = p.deaths > 0 ? (p.kills + p.assists) / p.deaths : (p.kills + p.assists);
    
    return {
      ...p,
      topChamp,
      kda: totalKda,
      dpm: p.gamesPlayed > 0 ? p.totalGameDpm / p.gamesPlayed : 0,
      dmgShare: p.gamesPlayed > 0 ? p.totalGameDmgShare / p.gamesPlayed : 0,
      dtpm: p.gamesPlayed > 0 ? p.totalGameDtpm / p.gamesPlayed : 0,
      dmgTakenShare: p.gamesPlayed > 0 ? p.totalGameDmgTakenShare / p.gamesPlayed : 0,
      hpm: p.gamesPlayed > 0 ? p.totalGameHpm / p.gamesPlayed : 0,
      healingShare: p.gamesPlayed > 0 ? p.totalGameHealingShare / p.gamesPlayed : 0,
      kp: p.gamesPlayed > 0 ? p.totalGameKp / p.gamesPlayed : 0,
      gpm: p.gamesPlayed > 0 ? p.totalGameGpm / p.gamesPlayed : 0,
      cspm: p.gamesPlayed > 0 ? p.totalGameCspm / p.gamesPlayed : 0,
      avgMvpScore: p.gamesWon > 0 ? p.totalMvpScore / p.gamesWon : 0,
      groupAvgMvpScore: p.groupGamesWon > 0 ? p.groupTotalMvpScore / p.groupGamesWon : 0,
      playoffAvgMvpScore: p.playoffGamesWon > 0 ? p.playoffTotalMvpScore / p.playoffGamesWon : 0,
      grandFinalAvgMvpScore: p.grandFinalGamesWon > 0 ? p.grandFinalTotalMvpScore / p.grandFinalGamesWon : 0,
    };
  });

  // Calculate advanced metrics for teams
  const rankedTeams = Object.values(teamsData).map(t => {
    const teamKda = t.deaths > 0 ? (t.kills + t.assists) / t.deaths : (t.kills + t.assists);
    return {
      ...t,
      kda: teamKda,
      winRate: t.gamesPlayed > 0 ? (t.wins / t.gamesPlayed) * 100 : 0,
      avgDmg: t.gamesPlayed > 0 ? t.damageDealt / t.gamesPlayed : 0,
      avgTaken: t.gamesPlayed > 0 ? t.damageTaken / t.gamesPlayed : 0,
      avgHealing: t.gamesPlayed > 0 ? t.healing / t.gamesPlayed : 0,
      avgKills: t.gamesPlayed > 0 ? t.kills / t.gamesPlayed : 0,
      avgDeaths: t.gamesPlayed > 0 ? t.deaths / t.gamesPlayed : 0,
      avgAssists: t.gamesPlayed > 0 ? t.assists / t.gamesPlayed : 0,
    };
  });

  let rankedItems = rankingType === "player" ? [...rankedPlayers] : [...rankedTeams];

  // Filter requirement 7: Player/Team must have stats for the specific selected metric
  if (rankingType === "player") {
    if (sortBy === "seriesMvpCount") {
      rankedItems = rankedItems.filter(p => (p.seriesMvpCount || 0) > 0);
    } else if (sortBy === "groupMvpCount") {
      rankedItems = rankedItems.filter(p => (p.groupMvpCount || 0) > 0);
    } else if (sortBy === "playoffMvpCount") {
      rankedItems = rankedItems.filter(p => (p.playoffMvpCount || 0) > 0);
    } else if (sortBy === "grandFinalMvpCount") {
      rankedItems = rankedItems.filter(p => (p.grandFinalMvpCount || 0) > 0);
    } else if (["kda", "kills", "deaths", "assists"].includes(sortBy)) {
      rankedItems = rankedItems.filter(p => (p.gamesPlayed || 0) > 0);
    } else if (["damageDealt", "dpm", "dmgShare"].includes(sortBy)) {
      rankedItems = rankedItems.filter(p => (p.damageDealt || 0) > 0);
    } else if (["damageTaken", "dtpm", "dmgTakenShare"].includes(sortBy)) {
      rankedItems = rankedItems.filter(p => (p.damageTaken || 0) > 0);
    } else if (["healing", "hpm", "healingShare"].includes(sortBy)) {
      rankedItems = rankedItems.filter(p => (p.healing || 0) > 0);
    } else if (sortBy === "pentaKills") {
      rankedItems = rankedItems.filter(p => (p.pentaKills || 0) > 0);
    } else {
      rankedItems = rankedItems.filter(p => (p.gamesPlayed || 0) > 0);
    }
  } else {
    // Team filter groups
    if (["positionScore", "winRate", "kda"].includes(sortBy)) {
      rankedItems = rankedItems.filter(t => (t.gamesPlayed || 0) > 0);
    } else if (["avgDmg", "avgTaken", "avgHealing"].includes(sortBy)) {
      rankedItems = rankedItems.filter(t => (t.damageDealt || 0) > 0);
    } else if (["avgKills", "avgDeaths", "avgAssists"].includes(sortBy)) {
      rankedItems = rankedItems.filter(t => (t.gamesPlayed || 0) > 0);
    } else {
      rankedItems = rankedItems.filter(t => (t.gamesPlayed || 0) > 0);
    }
  }

  const handleSort = (colKey) => {
    if (!colKey) return;
    if (sortColumn === colKey) {
      setSortOrder(prev => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortColumn(colKey);
      setSortOrder(colKey === "avgDeaths" || colKey === "deaths" ? "asc" : "desc");
    }
  };

  rankedItems.sort((a, b) => {
    let result = 0;
    const col = sortColumn || sortBy;
    if (rankingType === "player") {
      if (col === "seriesMvpCount") {
        if (b.seriesMvpCount !== a.seriesMvpCount) result = b.seriesMvpCount - a.seriesMvpCount;
        else if (b.matchMvpCount !== a.matchMvpCount) result = b.matchMvpCount - a.matchMvpCount;
        else if (b.avgMvpScore !== a.avgMvpScore) result = b.avgMvpScore - a.avgMvpScore;
        else result = (b.kda || 0) - (a.kda || 0);
      } else if (col === "groupMvpCount") {
        if (b.groupMvpCount !== a.groupMvpCount) result = b.groupMvpCount - a.groupMvpCount;
        else if (b.groupMatchMvpCount !== a.groupMatchMvpCount) result = b.groupMatchMvpCount - a.groupMatchMvpCount;
        else if (b.groupAvgMvpScore !== a.groupAvgMvpScore) result = b.groupAvgMvpScore - a.groupAvgMvpScore;
        else result = (b.kda || 0) - (a.kda || 0);
      } else if (col === "playoffMvpCount") {
        if (b.playoffMvpCount !== a.playoffMvpCount) result = b.playoffMvpCount - a.playoffMvpCount;
        else if (b.playoffMatchMvpCount !== a.playoffMatchMvpCount) result = b.playoffMatchMvpCount - a.playoffMatchMvpCount;
        else if (b.playoffAvgMvpScore !== a.playoffAvgMvpScore) result = b.playoffAvgMvpScore - a.playoffAvgMvpScore;
        else result = (b.kda || 0) - (a.kda || 0);
      } else if (col === "grandFinalMvpCount") {
        if (b.grandFinalMvpCount !== a.grandFinalMvpCount) result = b.grandFinalMvpCount - a.grandFinalMvpCount;
        else if (b.grandFinalMatchMvpCount !== a.grandFinalMatchMvpCount) result = b.grandFinalMatchMvpCount - a.grandFinalMatchMvpCount;
        else if (b.grandFinalAvgMvpScore !== a.grandFinalAvgMvpScore) result = b.grandFinalAvgMvpScore - a.grandFinalAvgMvpScore;
        else result = (b.kda || 0) - (a.kda || 0);
      } else {
        if ((b[col] || 0) !== (a[col] || 0)) {
          result = (b[col] || 0) - (a[col] || 0);
        } else {
          result = (b.kda || 0) - (a.kda || 0);
        }
      }
    } else if (rankingType === "team") {
      if (col === "avgDeaths") {
        if (a.avgDeaths !== b.avgDeaths) result = (a.avgDeaths || 0) - (b.avgDeaths || 0);
        else result = (b.kda || 0) - (a.kda || 0);
      } else if ((b[col] || 0) !== (a[col] || 0)) {
        result = (b[col] || 0) - (a[col] || 0);
      } else {
        result = (b.winRate || 0) - (a.winRate || 0);
      }
    }
    return sortOrder === "asc" ? -result : result;
  });

  const top1 = rankedItems[0];
  const top2 = rankedItems[1];
  const top3 = rankedItems[2];

  const renderStatPills = (item, metricId) => {
    if (!item) return null;
    if (["seriesMvpCount", "groupMvpCount", "playoffMvpCount", "grandFinalMvpCount", "matchMvpCount", "avgMvpScore"].includes(metricId)) {
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

      const isMatch = metricId === "matchMvpCount";
      const isAvg = metricId === "avgMvpScore";

      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }}>
          {/* Main Sorted Badge */}
          {isMatch ? (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "0.25rem",
              fontWeight: "900", fontSize: "0.82rem", color: "#c084fc",
              backgroundColor: "rgba(192,132,252,0.15)", border: "1px solid rgba(192,132,252,0.4)",
              padding: "0.2rem 0.6rem", borderRadius: "14px", whiteSpace: "nowrap"
            }}>
              <Award size={12} /> {matchVal} Match MVP{matchVal !== 1 ? "s" : ""}
            </span>
          ) : isAvg ? (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "0.25rem",
              fontWeight: "900", fontSize: "0.82rem", color: "#60a5fa",
              backgroundColor: "rgba(96,165,250,0.15)", border: "1px solid rgba(96,165,250,0.4)",
              padding: "0.2rem 0.6rem", borderRadius: "14px", whiteSpace: "nowrap"
            }}>
              <Zap size={12} /> Avg {avgVal.toFixed(1)} Score
            </span>
          ) : (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "0.25rem",
              fontWeight: "900", fontSize: "0.82rem", color: "#fbbf24",
              backgroundColor: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.4)",
              padding: "0.2rem 0.6rem", borderRadius: "14px", whiteSpace: "nowrap"
            }}>
              <Crown size={12} /> {seriesVal} Series MVP{seriesVal !== 1 ? "s" : ""}
            </span>
          )}

          {/* Sub Stats Row */}
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", whiteSpace: "nowrap", fontWeight: "600" }}>
            {isMatch
              ? `${seriesVal} Series · Avg ${avgVal.toFixed(1)}`
              : isAvg
              ? `${seriesVal} Series · ${matchVal} Match`
              : `${matchVal} Match · Avg ${avgVal.toFixed(1)}`}
          </span>
        </div>
      );
    }

    const val = item[metricId];
    if (typeof val !== "number") return null;

    let displayStr = `${val.toFixed(2)} pts`;
    if (metricId === "positionScore") {
      if (val === 100) displayStr = "Champion";
      else if (val === 80) displayStr = "Runner-up";
      else if (val === 60) displayStr = "3rd Place";
      else if (val === 55) displayStr = "Top 3";
      else if (val === 40) displayStr = "4th Place";
      else if (val === 35) displayStr = "Top 4";
      else if (val === 20) displayStr = "5th-6th Place";
      else displayStr = "Group Stage";
    } else if (metricId === "kda") displayStr = `${val.toFixed(2)} KDA`;
    else if (["dmgShare", "kp", "dmgTakenShare"].includes(metricId)) displayStr = `${val.toFixed(1)}%`;
    else if (metricId === "winRate") displayStr = `${val.toFixed(1)}% WR`;
    else if (["dpm", "gpm", "cspm"].includes(metricId)) displayStr = `${Math.round(val).toLocaleString()}/m`;
    else if (metricId === "pentaKills") displayStr = `${val} Pentakill${val !== 1 ? 's' : ''}`;
    else if (["healing", "kills"].includes(metricId)) displayStr = val.toLocaleString();
    else if (["dpg", "gpg", "hpg", "cspg"].includes(metricId)) displayStr = `${Math.round(val).toLocaleString()}/game`;

    return (
      <span style={{
        fontWeight: "800", fontSize: "0.82rem", whiteSpace: "nowrap",
        color: "var(--primary-gold-bright)",
        backgroundColor: "rgba(212,175,55,0.08)",
        border: "1px solid rgba(212,175,55,0.2)",
        padding: "0.15rem 0.6rem", borderRadius: "16px"
      }}>
        {displayStr}
      </span>
    );
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

  const renderBroadcastHeroBanner = () => {
    const topPlayer = rankedPlayers[0];

    return (
      <div style={{
        width: "100%", gridColumn: "1 / -1", marginBottom: "1.5rem",
        background: "linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(15,23,42,0.95) 70%)",
        border: "1px solid rgba(212,175,55,0.4)", borderRadius: "20px", padding: "2rem",
        boxShadow: "0 12px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15)",
        display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "2rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          {topPlayer && (
            <div style={{ filter: "drop-shadow(0 0 20px rgba(212,175,55,0.5))" }}>
              <PlayerSignature name={topPlayer.playerName} size={90} />
            </div>
          )}
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: "900", color: "var(--primary-gold)", textTransform: "uppercase", letterSpacing: "0.15em", backgroundColor: "rgba(0,0,0,0.5)", padding: "0.25rem 0.75rem", borderRadius: "14px", border: "1px solid rgba(212,175,55,0.3)" }}>
              📺 LCK BROADCAST SPOTLIGHT MVP
            </span>
            <h2 style={{ fontSize: "2.2rem", fontWeight: "900", color: "#fff", margin: "0.5rem 0 0.2rem" }}>
              {topPlayer ? topPlayer.playerName : "No Player"}
            </h2>
            <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: "600" }}>
              {topPlayer ? (playerToTeamMap[topPlayer.playerName?.trim().toLowerCase()]?.name || "Free Agent") : ""}
            </span>
          </div>
        </div>

        {topPlayer && (
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ backgroundColor: "rgba(0,0,0,0.5)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: "14px", padding: "0.75rem 1.25rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>SERIES MVPS</div>
              <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#fbbf24" }}>{topPlayer.seriesMvpCount || 0}</div>
            </div>
            <div style={{ backgroundColor: "rgba(0,0,0,0.5)", border: "1px solid rgba(192,132,252,0.3)", borderRadius: "14px", padding: "0.75rem 1.25rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>MATCH MVPS</div>
              <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#c084fc" }}>{topPlayer.matchMvpCount || 0}</div>
            </div>
            <div style={{ backgroundColor: "rgba(0,0,0,0.5)", border: "1px solid rgba(96,165,250,0.3)", borderRadius: "14px", padding: "0.75rem 1.25rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>AVG SCORE (WINS)</div>
              <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#60a5fa" }}>{(topPlayer.avgMvpScore || 0).toFixed(1)}</div>
            </div>
          </div>
        )}
      </div>
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
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.2rem" }}>
          {teamObj.players.map(p => (
            <Link
              key={p.name}
              href={`/players/${encodeURIComponent(p.name)}?backUrl=${encodeURIComponent(`/rankings?tab=awards`)}`}
              style={{ display: "flex", alignItems: "center", gap: "0.3rem", backgroundColor: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "0.15rem 0.55rem 0.15rem 0.3rem", textDecoration: "none", transition: "border-color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(212,175,55,0.5)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
            >
              <PlayerSignature name={p.name} size={20} />
              <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", whiteSpace: "nowrap", fontWeight: "600" }}>{p.name}</span>
            </Link>
          ))}
        </div>
      );
    };

    const renderTeamRow = (teamObj, teamId, rankLabel, accentColor) => (
      <div style={{
        backgroundColor: `rgba(${accentColor}, 0.05)`, padding: "1rem 1.25rem", borderRadius: "14px",
        border: `1px solid rgba(${accentColor}, 0.25)`, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <span style={{ fontSize: "1.6rem", lineHeight: 1 }}>{rankLabel}</span>
          {teamObj ? (
            <Link href={`/teams?teamId=${teamId}&backUrl=${encodeURIComponent(`/rankings?tab=awards`)}`} className="no-zoom">
              <img
                src={teamObj.logo || (typeof teamLogoPlaceholder === "function" ? teamLogoPlaceholder(teamObj.name, 40) : "")}
                alt={teamObj.name}
                className="no-zoom"
                style={{ width: "40px", height: "40px", objectFit: "contain", borderRadius: "8px", backgroundColor: "rgba(0,0,0,0.4)", padding: "2px", flexShrink: 0, border: `1px solid rgba(${accentColor}, 0.3)` }}
              />
            </Link>
          ) : (
            <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>?</div>
          )}
          <div style={{ textAlign: "left" }}>
            {teamObj ? (
              <Link href={`/teams?teamId=${teamId}&backUrl=${encodeURIComponent(`/rankings?tab=awards`)}`} style={{ fontWeight: "900", color: `rgb(${accentColor})`, textDecoration: "none", fontSize: "1.1rem", display: "block" }}>
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
      <div style={{
        background: "linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(0,0,0,0.85) 100%)",
        border: "1px solid rgba(212, 175, 55, 0.35)",
        borderRadius: "20px", padding: "2rem", textAlign: "center",
        boxShadow: "0 12px 36px rgba(0,0,0,0.5), inset 0 0 20px rgba(212, 175, 55, 0.05)"
      }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: "900", color: "var(--primary-gold)", textTransform: "uppercase", letterSpacing: "0.15em", backgroundColor: "rgba(0,0,0,0.6)", padding: "0.25rem 0.8rem", borderRadius: "14px", border: "1px solid rgba(212,175,55,0.3)", display: "inline-block", marginBottom: "0.4rem" }}>
            🏆 REWARD CATEGORY
          </span>
          <h2 style={{ fontSize: "1.8rem", fontWeight: "900", textTransform: "uppercase", color: "var(--primary-gold-bright)", margin: "0 0 0.3rem 0" }}>
            Championship Standings
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
            Awarded to the top placing teams in the tournament playoffs.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {renderTeamRow(champ, champId, "🥇", "212,175,55")}
          {renderTeamRow(runner, runnerId, "🥈", "192,192,192")}
          {renderTeamRow(third, thirdId, "🥉", "205,127,50")}
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

  const renderBentoMvpCards = () => {
    const sortedGroupPlayers = [...rankedPlayers].sort((a, b) => {
      if (b.groupMvpCount !== a.groupMvpCount) return b.groupMvpCount - a.groupMvpCount;
      if (b.groupMatchMvpCount !== a.groupMatchMvpCount) return b.groupMatchMvpCount - a.groupMatchMvpCount;
      return b.groupAvgMvpScore - a.groupAvgMvpScore;
    });
    const topGroupMvp = sortedGroupPlayers[0];

    const sortedPlayoffPlayers = [...rankedPlayers].sort((a, b) => {
      if (b.playoffMvpCount !== a.playoffMvpCount) return b.playoffMvpCount - a.playoffMvpCount;
      if (b.playoffMatchMvpCount !== a.playoffMatchMvpCount) return b.playoffMatchMvpCount - a.playoffMatchMvpCount;
      return b.playoffAvgMvpScore - a.playoffAvgMvpScore;
    });
    const topPlayoffMvp = sortedPlayoffPlayers[0];

    const sortedGfPlayers = [...rankedPlayers].sort((a, b) => {
      if (b.grandFinalMvpCount !== a.grandFinalMvpCount) return b.grandFinalMvpCount - a.grandFinalMvpCount;
      if (b.grandFinalMatchMvpCount !== a.grandFinalMatchMvpCount) return b.grandFinalMatchMvpCount - a.grandFinalMatchMvpCount;
      return b.grandFinalAvgMvpScore - a.grandFinalAvgMvpScore;
    });
    const topGfMvp = sortedGfPlayers[0];

    const bentoItems = [
      { title: "Grand Final MVP", player: topGfMvp, color: "#fbbf24", bg: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(0,0,0,0.85))", border: "rgba(251,191,36,0.45)", seriesKey: "grandFinalMvpCount", matchKey: "grandFinalMatchMvpCount", avgKey: "grandFinalAvgMvpScore" },
      { title: "Playoff Stage MVP", player: topPlayoffMvp, color: "#c084fc", bg: "linear-gradient(135deg, rgba(192,132,252,0.15), rgba(0,0,0,0.85))", border: "rgba(192,132,252,0.45)", seriesKey: "playoffMvpCount", matchKey: "playoffMatchMvpCount", avgKey: "playoffAvgMvpScore" },
      { title: "Group Stage MVP", player: topGroupMvp, color: "#60a5fa", bg: "linear-gradient(135deg, rgba(96,165,250,0.15), rgba(0,0,0,0.85))", border: "rgba(96,165,250,0.45)", seriesKey: "groupMvpCount", matchKey: "groupMatchMvpCount", avgKey: "groupAvgMvpScore" },
    ];

    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", width: "100%", gridColumn: "1 / -1", marginBottom: "1rem" }}>
        {bentoItems.map((item, i) => {
          const p = item.player;
          const seriesVal = p ? (p[item.seriesKey] || 0) : 0;
          const matchVal = p ? (p[item.matchKey] || 0) : 0;
          const avgVal = p ? (p[item.avgKey] || 0) : 0;

          return (
            <div key={i} style={{
              background: item.bg, border: `1px solid ${item.border}`,
              borderRadius: "16px", padding: "1.5rem", backdropFilter: "blur(12px)",
              display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "180px",
              boxShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)`
            }}>
              <div>
                <span style={{ fontSize: "0.7rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.12em", color: item.color }}>
                  {item.title}
                </span>
                {p ? (
                  <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <PlayerSignature name={p.playerName} size={54} />
                    <div>
                      <Link href={`/players/${encodeURIComponent(p.playerName)}?backUrl=${encodeURIComponent(`/rankings?tab=awards`)}`} style={{ fontSize: "1.2rem", fontWeight: "900", color: "var(--text-primary)", textDecoration: "none", display: "block" }}>
                        {p.playerName}
                      </Link>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {playerToTeamMap[p.playerName?.trim().toLowerCase()]?.name || "Free Agent"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "1.5rem 0", color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.85rem" }}>TBD – In Progress</div>
                )}
              </div>

              {p && (
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "1.2rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "900", color: item.color, backgroundColor: "rgba(0,0,0,0.5)", border: `1px solid ${item.border}`, padding: "0.2rem 0.55rem", borderRadius: "12px" }}>
                    👑 {seriesVal} Series
                  </span>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: item.color, backgroundColor: "rgba(0,0,0,0.5)", border: `1px solid ${item.border}`, padding: "0.2rem 0.55rem", borderRadius: "12px" }}>
                    ⭐ {matchVal} Match
                  </span>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: item.color, backgroundColor: "rgba(0,0,0,0.5)", border: `1px solid ${item.border}`, padding: "0.2rem 0.55rem", borderRadius: "12px" }}>
                    🔥 Avg {avgVal.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderTradingMvpCards = () => {
    const sortedGroupPlayers = [...rankedPlayers].sort((a, b) => {
      if (b.groupMvpCount !== a.groupMvpCount) return b.groupMvpCount - a.groupMvpCount;
      if (b.groupMatchMvpCount !== a.groupMatchMvpCount) return b.groupMatchMvpCount - a.groupMatchMvpCount;
      return b.groupAvgMvpScore - a.groupAvgMvpScore;
    });
    const topGroupMvp = sortedGroupPlayers[0];

    const sortedPlayoffPlayers = [...rankedPlayers].sort((a, b) => {
      if (b.playoffMvpCount !== a.playoffMvpCount) return b.playoffMvpCount - a.playoffMvpCount;
      if (b.playoffMatchMvpCount !== a.playoffMatchMvpCount) return b.playoffMatchMvpCount - a.playoffMatchMvpCount;
      return b.playoffAvgMvpScore - a.playoffAvgMvpScore;
    });
    const topPlayoffMvp = sortedPlayoffPlayers[0];

    const sortedGfPlayers = [...rankedPlayers].sort((a, b) => {
      if (b.grandFinalMvpCount !== a.grandFinalMvpCount) return b.grandFinalMvpCount - a.grandFinalMvpCount;
      if (b.grandFinalMatchMvpCount !== a.grandFinalMatchMvpCount) return b.grandFinalMatchMvpCount - a.grandFinalMatchMvpCount;
      return b.grandFinalAvgMvpScore - a.grandFinalAvgMvpScore;
    });
    const topGfMvp = sortedGfPlayers[0];

    const cards = [
      { title: "GRAND FINAL MVP", player: topGfMvp, color: "#fbbf24", foil: "linear-gradient(135deg, rgba(251,191,36,0.3) 0%, rgba(212,175,55,0.05) 50%, rgba(0,0,0,0.9) 100%)", border: "2px solid #fbbf24", seriesKey: "grandFinalMvpCount", matchKey: "grandFinalMatchMvpCount", avgKey: "grandFinalAvgMvpScore" },
      { title: "PLAYOFF MVP", player: topPlayoffMvp, color: "#c084fc", foil: "linear-gradient(135deg, rgba(192,132,252,0.3) 0%, rgba(168,85,247,0.05) 50%, rgba(0,0,0,0.9) 100%)", border: "2px solid #c084fc", seriesKey: "playoffMvpCount", matchKey: "playoffMatchMvpCount", avgKey: "playoffAvgMvpScore" },
      { title: "GROUP STAGE MVP", player: topGroupMvp, color: "#60a5fa", foil: "linear-gradient(135deg, rgba(96,165,250,0.3) 0%, rgba(59,130,246,0.05) 50%, rgba(0,0,0,0.9) 100%)", border: "2px solid #60a5fa", seriesKey: "groupMvpCount", matchKey: "groupMatchMvpCount", avgKey: "groupAvgMvpScore" },
    ];

    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", width: "100%", gridColumn: "1 / -1", marginBottom: "1rem" }}>
        {cards.map((c, i) => {
          const p = c.player;
          const seriesVal = p ? (p[c.seriesKey] || 0) : 0;
          const matchVal = p ? (p[c.matchKey] || 0) : 0;
          const avgVal = p ? (p[c.avgKey] || 0) : 0;

          return (
            <div key={i} style={{
              background: c.foil, border: c.border, borderRadius: "20px", padding: "1.75rem",
              boxShadow: `0 12px 36px rgba(0,0,0,0.5), inset 0 0 20px ${c.color}22`,
              display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative"
            }}>
              <span style={{ fontSize: "0.72rem", fontWeight: "900", letterSpacing: "0.15em", color: c.color, backgroundColor: "rgba(0,0,0,0.6)", padding: "0.25rem 0.8rem", borderRadius: "14px", border: `1px solid ${c.color}44`, marginBottom: "1.2rem" }}>
                {c.title}
              </span>

              {p ? (
                <>
                  <div style={{ position: "relative", marginBottom: "0.75rem" }}>
                    <PlayerSignature name={p.playerName} size={72} />
                  </div>
                  <Link href={`/players/${encodeURIComponent(p.playerName)}?backUrl=${encodeURIComponent(`/rankings?tab=awards`)}`} style={{ fontSize: "1.25rem", fontWeight: "900", color: "#fff", textDecoration: "none", marginBottom: "0.2rem" }}>
                    {p.playerName}
                  </Link>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.2rem" }}>
                    {playerToTeamMap[p.playerName?.trim().toLowerCase()]?.name || "Free Agent"}
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", width: "100%", marginTop: "auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", backgroundColor: "rgba(0,0,0,0.4)", padding: "0.4rem 0.8rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <span style={{ color: "var(--text-muted)" }}>Series MVPs</span>
                      <span style={{ fontWeight: "900", color: c.color }}>{seriesVal}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", backgroundColor: "rgba(0,0,0,0.4)", padding: "0.4rem 0.8rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <span style={{ color: "var(--text-muted)" }}>Match MVPs</span>
                      <span style={{ fontWeight: "900", color: c.color }}>{matchVal}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", backgroundColor: "rgba(0,0,0,0.4)", padding: "0.4rem 0.8rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <span style={{ color: "var(--text-muted)" }}>Won Game Avg Score</span>
                      <span style={{ fontWeight: "900", color: c.color }}>{avgVal.toFixed(1)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ color: "var(--text-muted)", fontStyle: "italic", margin: "2rem 0" }}>TBD – In Progress</div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderPentakillSlayerCard = () => {
    const pentakillPlayers = rankedPlayers.filter(p => p.pentaKills > 0).sort((a, b) => b.pentaKills - a.pentaKills);
    const hasPentakills = pentakillPlayers.length > 0;

    return (
      <div style={{
        background: "linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(0,0,0,0.85) 100%)",
        border: "1px solid rgba(239, 68, 68, 0.35)",
        borderRadius: "20px", padding: "2rem", textAlign: "center",
        boxShadow: "0 12px 36px rgba(0,0,0,0.5), inset 0 0 20px rgba(239, 68, 68, 0.05)"
      }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: "900", color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.15em", backgroundColor: "rgba(0,0,0,0.6)", padding: "0.25rem 0.8rem", borderRadius: "14px", border: "1px solid rgba(239,68,68,0.3)", display: "inline-block", marginBottom: "0.4rem" }}>
            ⚡ BOUNTY REWARDS
          </span>
          <h2 style={{ fontSize: "1.8rem", fontWeight: "900", textTransform: "uppercase", color: "#ef4444", margin: "0 0 0.3rem 0" }}>
            Pentakill Slayers
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
            Rewarded to players per pentakill secured during the tournament.
          </p>
        </div>

        {hasPentakills ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
            {pentakillPlayers.map(player => (
              <div key={player.playerName} style={{
                display: "flex", alignItems: "center", gap: "1rem",
                backgroundColor: "rgba(0,0,0,0.4)", padding: "0.9rem 1.1rem", borderRadius: "14px",
                border: "1px solid rgba(239, 68, 68, 0.25)", boxShadow: "0 4px 16px rgba(0,0,0,0.3)"
              }}>
                <PlayerSignature name={player.playerName} size={44} />
                <div style={{ minWidth: 0, flex: 1, textAlign: "left" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <Link
                      href={`/players/${encodeURIComponent(player.playerName)}?backUrl=${encodeURIComponent(`/rankings?tab=awards`)}`}
                      style={{ fontWeight: "900", color: "var(--text-primary)", fontSize: "1rem", textDecoration: "none", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", marginRight: "0.5rem" }}
                    >
                      {player.playerName}
                    </Link>
                    <span style={{ fontWeight: "900", color: "#ef4444", fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.25rem", whiteSpace: "nowrap", flexShrink: 0 }}>
                      <span>{player.pentaKills}</span>
                      <Zap size={14} style={{ color: "#ef4444" }} />
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
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
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2.5rem 1rem", color: "var(--text-muted)", backgroundColor: "rgba(0,0,0,0.3)", borderRadius: "14px", border: "1px dashed rgba(239, 68, 68, 0.25)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚡</div>
            <div style={{ fontSize: "0.9rem", textAlign: "center", fontWeight: "bold", color: "var(--text-primary)" }}>Bounty Unclaimed!</div>
            <div style={{ fontSize: "0.78rem", textAlign: "center", marginTop: "0.25rem" }}>No Pentakills recorded yet in this tournament.</div>
          </div>
        )}
      </div>
    );
  };

  const renderMultiColumnTable = () => {
    const isTeam = rankingType === "team";
    const isMvpMetric = ["seriesMvpCount", "groupMvpCount", "playoffMvpCount", "grandFinalMvpCount"].includes(sortBy);
    const isKdaGroup = ["kda", "kills", "deaths", "assists"].includes(sortBy) && !isTeam;
    const isDmgMetric = ["damageDealt", "dpm", "dmgShare"].includes(sortBy) && !isTeam;
    const isTakenMetric = ["damageTaken", "dtpm", "dmgTakenShare"].includes(sortBy) && !isTeam;
    const isHealMetric = ["healing", "hpm", "healingShare"].includes(sortBy) && !isTeam;

    const isTeamFinalPos = ["positionScore", "winRate", "kda"].includes(sortBy) && isTeam;
    const isTeamFighting = ["avgDmg", "avgHealing", "avgTaken"].includes(sortBy) && isTeam;
    const isTeamKdaGroup = ["avgKills", "avgDeaths", "avgAssists"].includes(sortBy) && isTeam;

    let colTemplate = (sortBy === "kda" || sortBy === "avgKills") 
      ? "70px 2.2fr 1fr 1fr 1fr 1fr 1fr" 
      : "70px 2.2fr 1.2fr 1.2fr 1.2fr 1fr";

    const renderSortableHeader = (label, colKey, alignment = "center") => {
      const isSelected = sortColumn === colKey;
      const arrow = isSelected ? (sortOrder === "asc" ? "▲" : "▼") : "↕";
      const activeColor = rankingType === "player" ? "#c084fc" : "var(--primary-gold-bright)";

      return (
        <div
          onClick={() => handleSort(colKey)}
          style={{
            textAlign: alignment,
            cursor: "pointer",
            userSelect: "none",
            color: isSelected ? activeColor : "var(--text-muted)",
            fontWeight: isSelected ? "900" : "700",
            display: "flex",
            alignItems: "center",
            justifyContent: alignment === "right" ? "flex-end" : alignment === "left" ? "flex-start" : "center",
            gap: "0.25rem",
            transition: "color 0.2s"
          }}
          title={`Sort by ${label} (${isSelected && sortOrder === "desc" ? "Click for Ascending" : "Click for Descending"})`}
        >
          <span>{label}</span>
          <span style={{ fontSize: "0.75rem", opacity: isSelected ? 1 : 0.35 }}>{arrow}</span>
        </div>
      );
    };

    return (
      <div style={{ backgroundColor: "rgba(0,0,0,0.4)", border: "1px solid var(--border-dark)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 12px 36px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "grid", gridTemplateColumns: colTemplate, padding: "1rem 1.25rem", backgroundColor: "rgba(255,255,255,0.03)", borderBottom: "1px solid var(--border-dark)", fontSize: "0.75rem", fontWeight: "900", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          <div>RANK</div>
          <div>{isTeam ? "TEAM" : "PLAYER & TEAM"}</div>
          {sortBy === "seriesMvpCount" ? (
            <>
              {renderSortableHeader("SERIES MVPS", "seriesMvpCount")}
              {renderSortableHeader("MATCH MVPS", "matchMvpCount")}
              {renderSortableHeader("AVG SCORE", "avgMvpScore")}
              {renderSortableHeader("GAMES", "gamesPlayed")}
            </>
          ) : sortBy === "kda" ? (
            <>
              {renderSortableHeader("KDA RATIO", "kda")}
              {renderSortableHeader("KILLS", "kills")}
              {renderSortableHeader("DEATHS", "deaths")}
              {renderSortableHeader("ASSISTS", "assists")}
              {renderSortableHeader("GAMES", "gamesPlayed")}
            </>
          ) : sortBy === "damageDealt" ? (
            <>
              {renderSortableHeader("TOTAL DAMAGE", "damageDealt")}
              {renderSortableHeader("DMG / MIN", "dpm")}
              {renderSortableHeader("DMG SHARE %", "dmgShare")}
              {renderSortableHeader("GAMES", "gamesPlayed")}
            </>
          ) : sortBy === "damageTaken" ? (
            <>
              {renderSortableHeader("TOTAL TAKEN", "damageTaken")}
              {renderSortableHeader("TAKEN / MIN", "dtpm")}
              {renderSortableHeader("TAKEN SHARE %", "dmgTakenShare")}
              {renderSortableHeader("GAMES", "gamesPlayed")}
            </>
          ) : sortBy === "healing" ? (
            <>
              {renderSortableHeader("TOTAL HEALING", "healing")}
              {renderSortableHeader("HEAL / MIN", "hpm")}
              {renderSortableHeader("HEAL SHARE %", "healingShare")}
              {renderSortableHeader("GAMES", "gamesPlayed")}
            </>
          ) : sortBy === "positionScore" ? (
            <>
              {renderSortableHeader("FINAL POSITION", "positionScore")}
              {renderSortableHeader("WIN RATE", "winRate")}
              {renderSortableHeader("KDA RATIO", "kda")}
              {renderSortableHeader("GAMES", "gamesPlayed")}
            </>
          ) : sortBy === "avgDmg" ? (
            <>
              {renderSortableHeader("AVG DAMAGE", "avgDmg")}
              {renderSortableHeader("AVG HEALING", "avgHealing")}
              {renderSortableHeader("AVG TAKEN", "avgTaken")}
              {renderSortableHeader("GAMES", "gamesPlayed")}
            </>
          ) : sortBy === "avgKills" ? (
            <>
              {renderSortableHeader("AVG KILLS", "avgKills")}
              {renderSortableHeader("AVG DEATHS", "avgDeaths")}
              {renderSortableHeader("AVG ASSISTS", "avgAssists")}
              {renderSortableHeader("KDA RATIO", "kda")}
              {renderSortableHeader("GAMES", "gamesPlayed")}
            </>
          ) : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {rankedItems.map((item, idx) => {
            const rank = idx + 1;
            return (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: colTemplate, alignItems: "center", padding: "0.9rem 1.25rem", borderBottom: idx < rankedItems.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <div style={{ fontWeight: "900", fontSize: "1.1rem", color: rank === 1 ? "#fbbf24" : rank === 2 ? "#e2e8f0" : rank === 3 ? "#f97316" : "var(--text-muted)" }}>
                  {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", minWidth: 0 }}>
                  {isTeam ? (
                    <img src={item.logo} alt={item.teamName} style={{ width: "36px", height: "36px", borderRadius: "8px" }} />
                  ) : (
                    <PlayerSignature name={item.playerName} size={36} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: "800", color: "#fff" }}>{isTeam ? item.teamName : item.playerName}</div>
                    {!isTeam && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{playerToTeamMap[item.playerName?.trim().toLowerCase()]?.name || "Free Agent"}</div>}
                  </div>
                </div>
                {sortBy === "seriesMvpCount" ? (
                  <>
                    <div style={{ textAlign: "center", color: "#fbbf24", fontWeight: "800" }}>{item.seriesMvpCount || 0}</div>
                    <div style={{ textAlign: "center", color: "#c084fc", fontWeight: "800" }}>{item.matchMvpCount || 0}</div>
                    <div style={{ textAlign: "center", color: "#60a5fa", fontWeight: "800" }}>{(item.avgMvpScore || 0).toFixed(1)}</div>
                    <div style={{ textAlign: "center", color: "var(--text-muted)" }}>{item.gamesPlayed || 0}</div>
                  </>
                ) : sortBy === "kda" ? (
                  <>
                    <div style={{ textAlign: "center", color: "#c084fc", fontWeight: "900" }}>{(item.kda || 0).toFixed(2)}</div>
                    <div style={{ textAlign: "center", color: "#fbbf24", fontWeight: "800" }}>{item.kills || 0}</div>
                    <div style={{ textAlign: "center", color: "#ef4444", fontWeight: "800" }}>{item.deaths || 0}</div>
                    <div style={{ textAlign: "center", color: "#34d399", fontWeight: "800" }}>{item.assists || 0}</div>
                    <div style={{ textAlign: "center", color: "var(--text-muted)" }}>{item.gamesPlayed || 0}</div>
                  </>
                ) : sortBy === "damageDealt" ? (
                  <>
                    <div style={{ textAlign: "center", color: "#ef4444", fontWeight: "800" }}>{(item.damageDealt || 0).toLocaleString()}</div>
                    <div style={{ textAlign: "center", color: "#fbbf24", fontWeight: "800" }}>{(item.dpm || 0).toFixed(0)}</div>
                    <div style={{ textAlign: "center", color: "#c084fc", fontWeight: "900" }}>{(item.dmgShare || 0).toFixed(1)}%</div>
                    <div style={{ textAlign: "center", color: "var(--text-muted)" }}>{item.gamesPlayed || 0}</div>
                  </>
                ) : sortBy === "damageTaken" ? (
                  <>
                    <div style={{ textAlign: "center", color: "#60a5fa", fontWeight: "800" }}>{(item.damageTaken || 0).toLocaleString()}</div>
                    <div style={{ textAlign: "center", color: "#fbbf24", fontWeight: "800" }}>{(item.dtpm || 0).toFixed(0)}</div>
                    <div style={{ textAlign: "center", color: "#c084fc", fontWeight: "900" }}>{(item.dmgTakenShare || 0).toFixed(1)}%</div>
                    <div style={{ textAlign: "center", color: "var(--text-muted)" }}>{item.gamesPlayed || 0}</div>
                  </>
                ) : sortBy === "healing" ? (
                  <>
                    <div style={{ textAlign: "center", color: "#34d399", fontWeight: "800" }}>{(item.healing || 0).toLocaleString()}</div>
                    <div style={{ textAlign: "center", color: "#fbbf24", fontWeight: "800" }}>{(item.hpm || 0).toFixed(0)}</div>
                    <div style={{ textAlign: "center", color: "#c084fc", fontWeight: "900" }}>{(item.healingShare || 0).toFixed(1)}%</div>
                    <div style={{ textAlign: "center", color: "var(--text-muted)" }}>{item.gamesPlayed || 0}</div>
                  </>
                ) : sortBy === "positionScore" ? (
                  <>
                    <div style={{ textAlign: "center" }}>{getPositionBadge(item.position)}</div>
                    <div style={{ textAlign: "center", color: "#60a5fa", fontWeight: "800" }}>{(item.winRate || 0).toFixed(1)}%</div>
                    <div style={{ textAlign: "center", color: "#c084fc", fontWeight: "800" }}>{(item.kda || 0).toFixed(2)}</div>
                    <div style={{ textAlign: "center", color: "var(--text-muted)" }}>{item.gamesPlayed || 0}</div>
                  </>
                ) : sortBy === "avgDmg" ? (
                  <>
                    <div style={{ textAlign: "center", color: "#ef4444", fontWeight: "800" }}>{Math.round(item.avgDmg || 0).toLocaleString()}</div>
                    <div style={{ textAlign: "center", color: "#34d399", fontWeight: "800" }}>{Math.round(item.avgHealing || 0).toLocaleString()}</div>
                    <div style={{ textAlign: "center", color: "#60a5fa", fontWeight: "800" }}>{Math.round(item.avgTaken || 0).toLocaleString()}</div>
                    <div style={{ textAlign: "center", color: "var(--text-muted)" }}>{item.gamesPlayed || 0}</div>
                  </>
                ) : sortBy === "avgKills" ? (
                  <>
                    <div style={{ textAlign: "center", color: "#fbbf24", fontWeight: "800" }}>{(item.avgKills || 0).toFixed(1)}</div>
                    <div style={{ textAlign: "center", color: "#ef4444", fontWeight: "800" }}>{(item.avgDeaths || 0).toFixed(1)}</div>
                    <div style={{ textAlign: "center", color: "#c084fc", fontWeight: "800" }}>{(item.avgAssists || 0).toFixed(1)}</div>
                    <div style={{ textAlign: "center", color: "#34d399", fontWeight: "800" }}>{(item.kda || 0).toFixed(2)}</div>
                    <div style={{ textAlign: "center", color: "var(--text-muted)" }}>{item.gamesPlayed || 0}</div>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSpotlightLeaderboard = () => {
    const heroItem = rankedItems[0];
    if (!heroItem) {
      return (
        <div style={{
          backgroundColor: "rgba(0,0,0,0.4)", border: "1px dashed var(--border-dark)",
          borderRadius: "16px", padding: "3rem 1.5rem", textAlign: "center", color: "var(--text-muted)"
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🏆</div>
          <div style={{ fontSize: "1rem", fontWeight: "700", color: "#fff", marginBottom: "0.25rem" }}>No Stats Available</div>
          <div style={{ fontSize: "0.85rem" }}>No {rankingType === "player" ? "players" : "teams"} have recorded stats for this category yet.</div>
        </div>
      );
    }

    const isTeam = rankingType === "team";
    const accentColor = isTeam ? "#fbbf24" : "#c084fc";
    const gradientBg = isTeam
      ? "linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(15,23,42,0.95) 70%)"
      : "linear-gradient(135deg, rgba(192,132,252,0.18) 0%, rgba(15,23,42,0.95) 70%)";
    const borderColor = isTeam ? "rgba(212,175,55,0.4)" : "rgba(192,132,252,0.4)";

    const isMvpMetric = ["seriesMvpCount", "groupMvpCount", "playoffMvpCount", "grandFinalMvpCount"].includes(sortBy);

    const titleName = isTeam ? heroItem.teamName : heroItem.playerName;
    const subTitle = isTeam
      ? (heroItem.position || "Group Stage")
      : (playerToTeamMap[heroItem.playerName?.trim().toLowerCase()]?.name || "Free Agent");

    // Dynamic stats to highlight in hero banner
    let statCards = [];

    if (isMvpMetric && !isTeam) {
      statCards = [
        { label: "SERIES MVPS", value: heroItem.seriesMvpCount || 0, color: "#fbbf24", border: "rgba(251,191,36,0.3)" },
        { label: "MATCH MVPS", value: heroItem.matchMvpCount || 0, color: "#c084fc", border: "rgba(192,132,252,0.3)" },
        { label: "AVG SCORE", value: (heroItem.avgMvpScore || 0).toFixed(1), color: "#60a5fa", border: "rgba(96,165,250,0.3)" },
      ];
    } else if (["kda", "kills", "deaths", "assists"].includes(sortBy) && !isTeam) {
      const highlightVal = sortBy === "kills" ? heroItem.kills
        : sortBy === "deaths" ? heroItem.deaths
        : sortBy === "assists" ? heroItem.assists
        : (heroItem.kda || 0).toFixed(2);
      const highlightLabel = sortBy === "kills" ? "KILLS" : sortBy === "deaths" ? "DEATHS" : sortBy === "assists" ? "ASSISTS" : "KDA RATIO";
      statCards = [
        { label: highlightLabel, value: highlightVal, color: "#c084fc", border: "rgba(192,132,252,0.3)" },
        { label: "K / D / A", value: `${heroItem.kills} / ${heroItem.deaths} / ${heroItem.assists}`, color: "#fbbf24", border: "rgba(251,191,36,0.3)" },
        { label: "GAMES PLAYED", value: heroItem.gamesPlayed || 0, color: "#60a5fa", border: "rgba(96,165,250,0.3)" },
      ];
    } else if (["damageDealt", "dpm", "dmgShare"].includes(sortBy) && !isTeam) {
      statCards = [
        { label: "TOTAL DAMAGE", value: (heroItem.damageDealt || 0).toLocaleString(), color: "#ef4444", border: "rgba(239,68,68,0.3)" },
        { label: "DMG / MIN", value: (heroItem.dpm || 0).toFixed(0), color: "#fbbf24", border: "rgba(251,191,36,0.3)" },
        { label: "DMG SHARE %", value: `${(heroItem.dmgShare || 0).toFixed(1)}%`, color: "#c084fc", border: "rgba(192,132,252,0.3)" },
      ];
    } else if (["damageTaken", "dtpm", "dmgTakenShare"].includes(sortBy) && !isTeam) {
      statCards = [
        { label: "TOTAL TAKEN", value: (heroItem.damageTaken || 0).toLocaleString(), color: "#60a5fa", border: "rgba(96,165,250,0.3)" },
        { label: "TAKEN / MIN", value: (heroItem.dtpm || 0).toFixed(0), color: "#fbbf24", border: "rgba(251,191,36,0.3)" },
        { label: "TAKEN SHARE %", value: `${(heroItem.dmgTakenShare || 0).toFixed(1)}%`, color: "#c084fc", border: "rgba(192,132,252,0.3)" },
      ];
    } else if (["healing", "hpm", "healingShare"].includes(sortBy) && !isTeam) {
      statCards = [
        { label: "TOTAL HEALING", value: (heroItem.healing || 0).toLocaleString(), color: "#34d399", border: "rgba(52,211,153,0.3)" },
        { label: "HEAL / MIN", value: (heroItem.hpm || 0).toFixed(0), color: "#fbbf24", border: "rgba(251,191,36,0.3)" },
        { label: "HEAL SHARE %", value: `${(heroItem.healingShare || 0).toFixed(1)}%`, color: "#c084fc", border: "rgba(192,132,252,0.3)" },
      ];
    } else if (isTeam) {
      if (["positionScore", "winRate", "kda"].includes(sortBy)) {
        statCards = [
          { label: "FINAL POSITION", value: heroItem.position || "Group Stage", color: "#fbbf24", border: "rgba(251,191,36,0.3)" },
          { label: "WIN RATE", value: `${(heroItem.winRate || 0).toFixed(1)}%`, color: "#60a5fa", border: "rgba(96,165,250,0.3)" },
          { label: "TEAM KDA", value: (heroItem.kda || 0).toFixed(2), color: "#c084fc", border: "rgba(192,132,252,0.3)" },
        ];
      } else if (["avgDmg", "avgHealing", "avgTaken"].includes(sortBy)) {
        statCards = [
          { label: "AVG DAMAGE", value: Math.round(heroItem.avgDmg || 0).toLocaleString(), color: "#ef4444", border: "rgba(239,68,68,0.3)" },
          { label: "AVG HEALING", value: Math.round(heroItem.avgHealing || 0).toLocaleString(), color: "#34d399", border: "rgba(52,211,153,0.3)" },
          { label: "AVG TAKEN", value: Math.round(heroItem.avgTaken || 0).toLocaleString(), color: "#60a5fa", border: "rgba(96,165,250,0.3)" },
        ];
      } else if (["avgKills", "avgDeaths", "avgAssists"].includes(sortBy)) {
        statCards = [
          { label: "AVG KILLS / GAME", value: (heroItem.avgKills || 0).toFixed(1), color: "#fbbf24", border: "rgba(251,191,36,0.3)" },
          { label: "AVG DEATHS / GAME", value: (heroItem.avgDeaths || 0).toFixed(1), color: "#ef4444", border: "rgba(239,68,68,0.3)" },
          { label: "AVG ASSISTS / GAME", value: (heroItem.avgAssists || 0).toFixed(1), color: "#c084fc", border: "rgba(192,132,252,0.3)" },
        ];
      }
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Spotlight Hero Card */}
        <div style={{
          background: gradientBg, border: `1px solid ${borderColor}`,
          borderRadius: "20px", padding: "2rem",
          boxShadow: "0 12px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15)",
          display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "2rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div style={{ filter: `drop-shadow(0 0 20px ${accentColor}88)` }}>
              {isTeam ? (
                <Link href={`/teams?teamId=${heroItem.teamId}&backUrl=${encodeURIComponent(`/rankings?tab=teams`)}`} className="no-zoom">
                  <img
                    src={heroItem.logo || (typeof teamLogoPlaceholder === "function" ? teamLogoPlaceholder(heroItem.teamName, 80) : "")}
                    alt={heroItem.teamName} className="no-zoom"
                    style={{ width: "80px", height: "80px", borderRadius: "14px", border: `3px solid ${accentColor}`, objectFit: "contain", padding: "4px", backgroundColor: "rgba(255,255,255,0.04)" }}
                  />
                </Link>
              ) : (
                <PlayerSignature name={heroItem.playerName} size={84} />
              )}
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: "900", color: accentColor, textTransform: "uppercase", letterSpacing: "0.15em", backgroundColor: "rgba(0,0,0,0.6)", padding: "0.25rem 0.75rem", borderRadius: "14px", border: `1px solid ${accentColor}44` }}>
                👑 #1 {isTeam ? "TEAM" : "PLAYER"} SPOTLIGHT
              </span>
              <h2 style={{ fontSize: "2.2rem", fontWeight: "900", color: "#fff", margin: "0.5rem 0 0.2rem" }}>
                {isTeam ? (
                  <Link href={`/teams?teamId=${heroItem.teamId}&backUrl=${encodeURIComponent(`/rankings?tab=teams`)}`} style={{ color: "#fff", textDecoration: "none" }}>
                    {titleName}
                  </Link>
                ) : (
                  <Link href={`/players/${encodeURIComponent(titleName)}?backUrl=${encodeURIComponent(`/rankings?tab=players`)}`} style={{ color: "#fff", textDecoration: "none" }}>
                    {titleName}
                  </Link>
                )}
              </h2>
              <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: "600" }}>
                {subTitle}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {statCards.map((sc, idx) => (
              <div key={idx} style={{ backgroundColor: "rgba(0,0,0,0.5)", border: `1px solid ${sc.border}`, borderRadius: "14px", padding: "0.75rem 1.25rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>{sc.label}</div>
                <div style={{ fontSize: "1.8rem", fontWeight: "900", color: sc.color }}>{sc.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Multi-Column Table Grid for All Items */}
        {renderMultiColumnTable()}
      </div>
    );
  };

  const getMetricLabel = (metricId) => {
    if (metricId === "seriesMvpCount") return "Total Series MVPs";
    if (metricId === "groupMvpCount") return "Group Stage MVPs";
    if (metricId === "playoffMvpCount") return "Playoff MVPs";
    if (metricId === "grandFinalMvpCount") return "Grand Final MVP";
    if (metricId === "damageDealt") return "Total Damage Dealt";
    if (metricId === "dpm") return "Damage Per Minute";
    if (metricId === "dmgShare") return "Damage Share %";
    if (metricId === "damageTaken") return "Total Damage Taken";
    if (metricId === "dtpm") return "Damage Taken / Min";
    if (metricId === "dmgTakenShare") return "Damage Taken Share %";
    if (metricId === "healing") return "Total Healing";
    if (metricId === "hpm") return "Healing Per Minute";
    if (metricId === "healingShare") return "Healing Share %";
    if (metricId === "kills") return "Total Kills";
    if (metricId === "deaths") return "Total Deaths";
    if (metricId === "assists") return "Total Assists";
    if (metricId === "positionScore") return "Final Position";
    if (metricId === "winRate") return "Win Rate";
    if (metricId === "avgDmg") return "Avg Damage";
    if (metricId === "avgHealing") return "Avg Healing / Game";
    if (metricId === "avgTaken") return "Avg Damage Taken / Game";
    if (metricId === "avgKills") return "Avg Kills / Game";
    if (metricId === "avgDeaths") return "Avg Deaths / Game";
    if (metricId === "avgAssists") return "Avg Assists / Game";
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
              setSortColumn("seriesMvpCount");
              setSortOrder("desc");
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
              setSortColumn("positionScore");
              setSortOrder("desc");
            }}
          >
            👥 Team Stats
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)", fontSize: "1.1rem" }}>
          Loading statistics...
        </div>
      ) : (
        <>
          {activeTab === "awards" && (
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "2.5rem" }}>
              {/* 1. Championship Standings (Top) */}
              <div style={{ width: "100%" }}>
                {renderChampionshipCard()}
              </div>

              {/* 2. MVP Trading Cards (Middle) */}
              <div>
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                  <span style={{ color: "#c084fc", fontWeight: "bold", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.12em", display: "inline-block", marginBottom: "0.3rem" }}>
                    👑 TOURNAMENT HONOR ROLL
                  </span>
                  <h2 style={{ fontSize: "1.8rem", fontWeight: "900", color: "#c084fc", textTransform: "uppercase", margin: 0 }}>
                    MVP Trading Cards
                  </h2>
                </div>
                {renderTradingMvpCards()}
              </div>

              {/* 3. Pentakill Slayers (Bottom) */}
              <div style={{ width: "100%" }}>
                {renderPentakillSlayerCard()}
              </div>
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
                      const isActive = sortBy === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => {
                            setSortBy(m.id);
                            setSortColumn(m.id);
                            setSortOrder("desc");
                          }}
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

                {concept === "concept2" && renderMultiColumnTable()}
                {concept === "concept3" && renderSpotlightLeaderboard()}

                {rankedItems.length === 0 && (
                  <div style={{
                    backgroundColor: "rgba(0,0,0,0.4)", border: "1px dashed var(--border-dark)",
                    borderRadius: "16px", padding: "3rem 1.5rem", textAlign: "center", color: "var(--text-muted)"
                  }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🏆</div>
                    <div style={{ fontSize: "1rem", fontWeight: "700", color: "#fff", marginBottom: "0.25rem" }}>No Stats Available</div>
                    <div style={{ fontSize: "0.85rem" }}>No {rankingType === "player" ? "players" : "teams"} have recorded stats for this category yet.</div>
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
