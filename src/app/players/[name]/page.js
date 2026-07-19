"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { subscribeToData, subscribeToAllMatchDetails } from "@/lib/db";
import { ArrowLeft, Target, Shield, Sword, Award, Activity, Zap } from "lucide-react";
import { getLatestDDragonVersion } from "@/lib/riot";
import { championPlaceholder } from "@/lib/placeholders";
import { SummonersCup, CrossedSwords } from "@/components/Icons";

export default function PlayerProfile() {
  const params = useParams();
  const router = useRouter();
  const playerName = decodeURIComponent(params.name);

  const [teams, setTeams] = useState({});
  const [matches, setMatches] = useState({});
  const [allMatches, setAllMatches] = useState({});
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState("16.13.1");

  useEffect(() => {
    let teamsLoaded = false;
    let matchesLoaded = false;
    let detailsLoaded = false;
    const checkDone = () => {
      if (teamsLoaded && matchesLoaded && detailsLoaded) setLoading(false);
    };

    const unsubTeams = subscribeToData("teams", (data) => {
      setTeams(data || {});
      teamsLoaded = true;
      checkDone();
    });
    const unsubMatches = subscribeToData("matches", (data) => {
      setMatches(data || {});
      matchesLoaded = true;
      checkDone();
    });
    const unsubDetails = subscribeToAllMatchDetails((data) => {
      setAllMatches(data || {});
      detailsLoaded = true;
      checkDone();
    });

    getLatestDDragonVersion().then((v) => setVersion(v));

    return () => {
      unsubTeams();
      unsubMatches();
      unsubDetails();
    };
  }, []);

  // Find player's team from rosters
  let playerTeam = null;
  let playerDetails = null;

  if (!loading) {
    Object.values(teams).forEach((t) => {
      if (t.players) {
        const found = t.players.find(
          (tp) => tp.name.trim().toLowerCase() === playerName.trim().toLowerCase()
        );
        if (found) {
          playerTeam = t;
          playerDetails = found;
        }
      }
    });
  }

  const getChampionIcon = (championName) => {
    if (!championName) return championPlaceholder(40);
    let cleanName = championName.replace(/[^a-zA-Z0-9]/g, "");
    if (cleanName.toLowerCase() === "velkoz") cleanName = "Velkoz";
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${cleanName}.png`;
  };

  const getFriendlyMatchName = (match) => {
    if (!match) return "Unknown Match";
    const id = match.id || "";
    if (id.startsWith("match-playoff-")) {
      switch (id) {
        case "match-playoff-1": return "UB Semifinals - Match 1";
        case "match-playoff-2": return "UB Semifinals - Match 2";
        case "match-playoff-3": return "LB Round 1 - Match 1";
        case "match-playoff-4": return "LB Round 1 - Match 2";
        case "match-playoff-5": return "UB Finals";
        case "match-playoff-6": return "LB Semifinals";
        case "match-playoff-7": return "LB Finals";
        case "match-playoff-8": return "Grand Final";
        default: return match.name || id;
      }
    }
    if (id.startsWith("match-g-")) {
      const part = id.split("-")[2] || "";
      const groupChar = part[0]?.toUpperCase() || "";
      const matchNum = part.substring(1) || "";
      return `Group ${groupChar} - Match ${matchNum}`;
    }
    return match.name || id;
  };

  // Build player alias maps
  const playerToTeamMap = {};
  const playerAliasToNameMap = {};
  
  Object.entries(teams).forEach(([teamId, team]) => {
    if (team && Array.isArray(team.players)) {
      team.players.forEach((p) => {
        const aliases = [];
        if (p.name) aliases.push(p.name);
        if (p.jerseyName) aliases.push(p.jerseyName);
        if (p.riotId) {
          const parts = p.riotId.split("#");
          if (parts[0]) aliases.push(parts[0]);
        }
        
        aliases.forEach(alias => {
          const normalized = alias.trim().toLowerCase();
          playerToTeamMap[normalized] = teamId;
          playerAliasToNameMap[normalized] = p.name.trim().toLowerCase();
        });
      });
    }
  });

  const myTeamId = playerToTeamMap[playerName.trim().toLowerCase()];

  // Aggregate tournament stats from matches DB
  let totalKills = 0, totalDeaths = 0, totalAssists = 0;
  let totalHealing = 0, totalDamage = 0;
  let gamesPlayed = 0, wins = 0;
  let seriesMvpCount = 0, pentakillCount = 0;
  const champStats = {};
  const matchHistory = [];

  if (!loading && allMatches) {
    Object.entries(allMatches).forEach(([matchId, gamesArray]) => {
      if (!Array.isArray(gamesArray)) return;
      const matchMeta = matches[matchId];
      const matchName = matchMeta?.name || matchId;

      gamesArray.forEach((game, gIdx) => {
        if (!game || !game.participants) return;
        const stat = game.participants.find(
          (p) => {
            if (!p.playerName) return false;
            const normP = p.playerName.trim().toLowerCase();
            return playerAliasToNameMap[normP] === playerName.trim().toLowerCase();
          }
        );
        if (!stat) return;

        gamesPlayed++;
        if (stat.win) wins++;
        const kills = stat.kills || 0;
        const deaths = stat.deaths || 0;
        const assists = stat.assists || 0;
        const healing = stat.healing || 0;
        const damage = stat.damageDealt || 0;

        totalKills += kills;
        totalDeaths += deaths;
        totalAssists += assists;
        totalHealing += healing;
        totalDamage += damage;
        if (stat.pentaKills) pentakillCount += stat.pentaKills;

        const champ = stat.champion || "Unknown";
        if (!champStats[champ]) {
          champStats[champ] = { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
        }
        champStats[champ].games++;
        if (stat.win) champStats[champ].wins++;
        champStats[champ].kills += kills;
        champStats[champ].deaths += deaths;
        champStats[champ].assists += assists;

        // Resolve opponent team name
        const opponentParticipant = game.participants.find(
          (p) => {
            if (!p.playerName) return false;
            const normP = p.playerName.trim().toLowerCase();
            const pTeamId = playerToTeamMap[normP];
            return pTeamId && pTeamId !== myTeamId;
          }
        );
        const opponentTeamId = opponentParticipant ? playerToTeamMap[opponentParticipant.playerName.trim().toLowerCase()] : null;
        const opponentTeamName = opponentTeamId ? (teams[opponentTeamId]?.name || "Opponent") : "Opponent";

        matchHistory.push({
          id: `${matchId}-${game.gameNumber || (gIdx + 1)}`,
          matchId: matchId,
          matchName: matchName,
          matchFriendlyName: getFriendlyMatchName(matchMeta || { id: matchId, name: matchName }),
          opponentTeamName: opponentTeamName,
          gameNumber: game.gameNumber || (gIdx + 1),
          champion: champ,
          kills,
          deaths,
          assists,
          win: stat.win,
          healing,
          damage,
        });
      });
    });
  }

  // Count series MVPs from match metadata
  if (!loading && matches) {
    Object.values(matches).forEach((match) => {
      if (match.mvpPlayer?.trim().toLowerCase() === playerName.trim().toLowerCase()) {
        seriesMvpCount++;
      }
    });
  }

  // Sort history newest first by matchId
  matchHistory.sort((a, b) => b.matchId.localeCompare(a.matchId) || b.gameNumber - a.gameNumber);

  const topChamps = Object.entries(champStats)
    .map(([champ, s]) => ({
      champ,
      ...s,
      winRate: (s.wins / s.games) * 100,
      kda: s.deaths === 0 ? s.kills + s.assists : (s.kills + s.assists) / s.deaths,
    }))
    .sort((a, b) => b.games - a.games || b.winRate - a.winRate)
    .slice(0, 5);

  const overallKda =
    totalDeaths === 0
      ? (totalKills + totalAssists).toFixed(2)
      : ((totalKills + totalAssists) / totalDeaths).toFixed(2);
  const winRate = gamesPlayed > 0 ? ((wins / gamesPlayed) * 100).toFixed(1) : "0.0";
  const avgKills = gamesPlayed > 0 ? (totalKills / gamesPlayed).toFixed(1) : "0.0";
  const avgDeaths = gamesPlayed > 0 ? (totalDeaths / gamesPlayed).toFixed(1) : "0.0";
  const avgAssists = gamesPlayed > 0 ? (totalAssists / gamesPlayed).toFixed(1) : "0.0";
  const avgHealing = gamesPlayed > 0 ? Math.round(totalHealing / gamesPlayed).toLocaleString() : "0";
  const avgDamage = gamesPlayed > 0 ? Math.round(totalDamage / gamesPlayed).toLocaleString() : "0";

  if (loading) {
    return <div style={{ textAlign: "center", padding: "4rem" }}>Loading player profile...</div>;
  }

  if (!playerDetails) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "4rem" }}>
        <h2>Player &ldquo;{playerName}&rdquo; not found in any team roster.</h2>
        <button onClick={() => router.back()} className="btn btn-secondary" style={{ marginTop: "1rem" }}>
          Go Back
        </button>
      </div>
    );
  }

  const riotId = playerDetails.riotId || `${playerName}#vn1`;

  // Deterministic profile icon
  const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };
  const seed = hashString(riotId);
  const iconId = (seed % 1000) + 1;
  const profileIconUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconId}.png`;

  return (
    <div className="container">
      <button
        onClick={() => router.back()}
        className="btn"
        style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem", background: "none", border: "none", color: "var(--primary-gold)", cursor: "pointer", padding: 0 }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* HEADER */}
      <div
        className="card"
        style={{ display: "flex", alignItems: "center", gap: "2rem", marginBottom: "2rem", backgroundImage: "linear-gradient(to right, var(--bg-tertiary), var(--bg-primary))", flexWrap: "wrap", padding: "2rem", border: "1px solid var(--border-gold)" }}
      >
        <div style={{ position: "relative", width: "100px", height: "100px" }}>
          <img
            src={profileIconUrl}
            alt="Profile Icon"
            style={{ width: "100%", height: "100%", borderRadius: "50%", border: "3px solid var(--border-gold)", boxShadow: "0 0 15px rgba(245,176,65,0.2)" }}
            onError={(e) => { e.target.src = "https://ddragon.leagueoflegends.com/cdn/14.3.1/img/profileicon/29.png"; }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "2.2rem", margin: 0, color: "var(--text-primary)", fontWeight: "800", textTransform: "uppercase" }}>{playerName}</h1>
            <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", backgroundColor: "rgba(0,0,0,0.3)", padding: "0.2rem 0.6rem", borderRadius: "4px", border: "1px solid var(--border-dark)" }}>
              {riotId}
            </span>
          </div>
          <div style={{ fontSize: "1rem", color: "var(--text-secondary)", marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            {playerTeam ? (
              <Link href={`/teams?teamId=${playerTeam.id}`} style={{ color: "var(--primary-gold-bright)", textDecoration: "none", fontWeight: "600" }}>
                {playerTeam.name}
              </Link>
            ) : "Free Agent"}
            <span style={{ color: "var(--text-muted)" }}>&bull;</span>
            <span style={{ fontSize: "0.75rem", backgroundColor: "rgba(192, 132, 252, 0.08)", border: "1px solid var(--accent-purple)", color: "var(--accent-purple)", padding: "0.15rem 0.5rem", borderRadius: "4px", fontWeight: "600", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <CrossedSwords size={10} /> ARAM Mayhem
            </span>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: winRate >= 50 ? "var(--primary-gold-bright)" : "var(--text-primary)" }}>
            {winRate}%
          </div>
          <div style={{ color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
            WIN RATE ({wins}W - {gamesPlayed - wins}L)
          </div>
        </div>
      </div>

      {/* STATS OVERVIEW STRIP */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { icon: <Target size={16} />, label: "KDA", value: overallKda, sub: `${avgKills} / ${avgDeaths} / ${avgAssists}`, color: "var(--primary-gold)" },
          { icon: <Award size={16} />, label: "Games Played", value: gamesPlayed, sub: `${wins}W – ${gamesPlayed - wins}L`, color: "var(--primary-gold)" },
          { icon: <SummonersCup size={16} />, label: "Series MVPs", value: seriesMvpCount, sub: "Tournament total", color: "var(--accent-purple)" },
          { icon: <Zap size={16} />, label: "Pentakills", value: pentakillCount, sub: "Tournament total", color: "#ef4444" },
          { icon: <Sword size={16} />, label: "Avg Damage", value: avgDamage, sub: "Per game", color: "var(--color-danger)" },
          { icon: <Activity size={16} />, label: "Avg Healing", value: avgHealing, sub: "Per game", color: "#20C997" },
        ].map((card, i) => (
          <div key={i} className="card" style={{ padding: "1rem", textAlign: "center", border: "1px solid var(--border-dark)" }}>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.4rem", color: card.color, marginBottom: "0.5rem", fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {card.icon} {card.label}
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: "900", color: "var(--text-primary)", lineHeight: 1 }}>{card.value}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>

        {/* TOP CHAMPIONS */}
        <div className="card">
          <h3 style={{ textTransform: "uppercase", fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1rem", letterSpacing: "0.05em" }}>
            Tournament Champions
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {topChamps.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontStyle: "italic", backgroundColor: "var(--bg-tertiary)", borderRadius: "8px", border: "1px solid var(--border-dark)", fontSize: "0.9rem" }}>
                No tournament games recorded yet.
              </div>
            ) : (
              topChamps.map((champ, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.8rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "8px", border: "1px solid var(--border-dark)" }}>
                  <img src={getChampionIcon(champ.champ)} alt={champ.champ} style={{ width: "44px", height: "44px", borderRadius: "50%", border: "2px solid var(--primary-gold)" }}
                    onError={(e) => { e.target.src = championPlaceholder(44); }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", fontSize: "1rem" }}>{champ.champ}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      {champ.kda.toFixed(2)} KDA &nbsp;·&nbsp; {champ.kills}/{champ.deaths}/{champ.assists}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: "bold", color: champ.winRate >= 50 ? "var(--primary-gold)" : "var(--color-danger)" }}>
                      {champ.winRate.toFixed(0)}% WR
                    </div>
                    <div style={{ fontSize: "0.85rem", marginTop: "0.15rem", display: "flex", gap: "0.25rem", justifyContent: "flex-end", alignItems: "center" }}>
                      <span style={{ color: "var(--color-success)", fontWeight: "bold" }}>{champ.wins}W</span>
                      <span style={{ color: "var(--text-muted)" }}>-</span>
                      <span style={{ color: "var(--primary-gold)", fontWeight: "bold" }}>{champ.games - champ.wins}L</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MATCH HISTORY */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <h3 style={{ textTransform: "uppercase", fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1rem", letterSpacing: "0.05em" }}>
            Tournament Match History
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", overflowY: "auto", maxHeight: "480px" }}>
            {matchHistory.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "160px", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "2rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "8px", border: "1px solid var(--border-dark)", fontSize: "0.9rem" }}>
                No tournament games recorded yet.
              </div>
            ) : (
              matchHistory.map((hist, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.85rem", padding: "0.85rem",
                    backgroundColor: hist.win ? "rgba(0, 160, 100, 0.08)" : "rgba(200, 40, 40, 0.08)",
                    borderLeft: `4px solid ${hist.win ? "var(--color-success)" : "var(--color-danger)"}`,
                    borderRadius: "0 8px 8px 0",
                  }}
                >
                  <img src={getChampionIcon(hist.champion)} alt={hist.champion} style={{ width: "38px", height: "38px", borderRadius: "50%" }}
                    onError={(e) => { e.target.src = championPlaceholder(38); }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: hist.win ? "var(--color-success)" : "var(--color-danger)" }}>
                      {hist.win ? "VICTORY" : "DEFEAT"} &nbsp;&ndash;&nbsp; Game {hist.gameNumber}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                      {hist.matchFriendlyName} &nbsp;·&nbsp; vs {hist.opponentTeamName}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: "bold", fontSize: "0.95rem" }}>{hist.kills}/{hist.deaths}/{hist.assists}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      {hist.deaths === 0 ? "Perfect" : ((hist.kills + hist.assists) / hist.deaths).toFixed(2) + " KDA"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
