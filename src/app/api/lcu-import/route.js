import { NextResponse } from "next/server";
import { isMockMode } from "@/lib/firebase";

// Helper to fetch champion name map from Riot DDragon
async function getChampionMap() {
  try {
    const vRes = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
    if (!vRes.ok) throw new Error("Failed to fetch versions");
    const versions = await vRes.json();
    const version = versions[0];
    const cRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`);
    if (!cRes.ok) throw new Error("Failed to fetch champions");
    const cData = await cRes.json();
    const map = {};
    Object.values(cData.data).forEach(champ => {
      map[champ.key] = champ.id;
    });
    return map;
  } catch (e) {
    console.error("Failed to fetch champion map from DDragon:", e);
    return {};
  }
}

export async function POST(request) {
  try {
    const { matchId, gameIndex, lcuData } = await request.json();

    if (!matchId) {
      return NextResponse.json({ error: "Missing matchId" }, { status: 400 });
    }
    if (gameIndex === undefined || gameIndex === null) {
      return NextResponse.json({ error: "Missing gameIndex" }, { status: 400 });
    }
    if (!lcuData || !lcuData.participants || !lcuData.participantIdentities) {
      return NextResponse.json({ error: "Invalid LCU match data structure." }, { status: 400 });
    }

    // 1. Fetch champion map from DDragon to map championId to name
    const championMap = await getChampionMap();

    // 2. Parse participants stats
    // LCU participants format: stats are nested inside .stats object, names in participantIdentities
    const participants = lcuData.participants.map(p => {
      const identity = lcuData.participantIdentities.find(ident => ident.participantId === p.participantId);
      // Fetch names, fallback gracefully
      const playerName = identity?.player?.summonerName || identity?.player?.riotIdGameName || `Player ${p.participantId}`;

      const s = p.stats || {};
      
      return {
        playerName,
        teamId: p.teamId, // 100 is Blue, 200 is Red
        champion: championMap[p.championId] || `Champ ${p.championId}`,
        win: s.win || false,
        kills: s.kills || 0,
        deaths: s.deaths || 0,
        assists: s.assists || 0,
        gold: s.goldEarned || 0,
        cs: (s.totalMinionsKilled || 0) + (s.neutralMinionsKilled || 0),
        vision: s.visionScore || 0,
        damageDealt: s.totalDamageDealtToChampions || 0,
        damageTaken: s.totalDamageTaken || 0,
        healing: s.totalHeal || 0,
        tripleKills: s.tripleKills || 0,
        quadraKills: s.quadraKills || 0,
        pentaKills: s.pentaKills || 0,
        firstBlood: s.firstBloodKill || false,
        controlWards: s.visionWardsBoughtInGame || 0,
        wardsPlaced: s.wardsPlaced || 0,
        wardsKilled: s.wardsKilled || 0,
        turretsKilled: s.turretKills || 0,
        inhibitorsKilled: s.inhibitorKills || 0,
        ccDuration: s.totalTimeCCDealt || 0,
        items: [s.item0, s.item1, s.item2, s.item3, s.item4, s.item5],
        summonerSpells: [p.spell1Id, p.spell2Id],
        runes: {
          keystoneId: s.perk0 || null,
          primaryStyleId: s.perkPrimaryStyle || null
        }
      };
    });

    // 3. Determine the winning side
    // In LCU, 5 players will have win=true and 5 will have win=false
    const blueTeamParticipant = lcuData.participants.find(p => p.teamId === 100);
    const winningTeamSide = blueTeamParticipant?.stats?.win ? 100 : 200;

    // 4. Team details summary
    const blueTeamWin = winningTeamSide === 100;
    const redTeamWin = winningTeamSide === 200;

    // Helper to calculate total team stats
    const sumTeamStat = (teamId, field) => 
      participants.filter(p => p.teamId === teamId).reduce((sum, p) => sum + p[field], 0);

    const matchDetailsData = {
      gameDuration: lcuData.gameDuration,
      teams: {
        100: {
          winner: blueTeamWin,
          bans: [], // LCU matches structure doesn't always contain bans in the same path, leaving empty
          barons: sumTeamStat(100, "barons") || 0,
          dragons: sumTeamStat(100, "dragons") || 0,
          firstBlood: participants.find(p => p.teamId === 100 && p.firstBlood) !== undefined
        },
        200: {
          winner: redTeamWin,
          bans: [],
          barons: sumTeamStat(200, "barons") || 0,
          dragons: sumTeamStat(200, "dragons") || 0,
          firstBlood: participants.find(p => p.teamId === 200 && p.firstBlood) !== undefined
        }
      },
      participants
    };

    console.log(`LCU Import: Mapped matchDetails for gameIndex ${gameIndex}. Winner Side: ${winningTeamSide}`);

    // 5. Database Write (Production Firebase)
    if (!isMockMode) {
      const { database: db } = await import("@/lib/firebase");
      const { ref, get, set } = await import("firebase/database");
      const { recalculateLeaderboard } = await import("@/lib/db");

      // A. Fetch current match configuration
      const matchRef = ref(db, `matches/${matchId}`);
      const matchSnapshot = await get(matchRef);

      if (!matchSnapshot.exists()) {
        return NextResponse.json({ error: `Match ID ${matchId} not found in database.` }, { status: 404 });
      }

      const match = matchSnapshot.val();

      // A1. Fetch teams to map player names
      const teamsRef = ref(db, "teams");
      const teamsSnapshot = await get(teamsRef);
      const teams = teamsSnapshot.exists() ? teamsSnapshot.val() : {};

      // Map participant in-game names to registered player names
      const mappedParticipants = matchDetailsData.participants.map(p => {
        let matchedName = p.playerName;
        Object.values(teams).forEach(team => {
          if (team && Array.isArray(team.players)) {
            const found = team.players.find(tp => {
              const aliases = [];
              if (tp.name) aliases.push(tp.name);
              if (tp.jerseyName) aliases.push(tp.jerseyName);
              if (tp.riotId) {
                const parts = tp.riotId.split("#");
                if (parts[0]) aliases.push(parts[0]);
              }
              const normPlayer = p.playerName.toLowerCase().replace(/[^a-z0-9]/g, "");
              return aliases.some(alias => {
                const normAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, "");
                return normPlayer.includes(normAlias) || normAlias.includes(normPlayer);
              });
            });
            if (found) {
              matchedName = found.name;
            }
          }
        });
        return { ...p, playerName: matchedName };
      });
      matchDetailsData.participants = mappedParticipants;

      // B. Fetch existing match details list to update specific game index
      const detailsRef = ref(db, `matchDetails/${matchId}`);
      const detailsSnapshot = await get(detailsRef);
      let existingDetails = detailsSnapshot.exists() ? detailsSnapshot.val() : [];
      if (!Array.isArray(existingDetails)) {
        existingDetails = [existingDetails];
      }

      // Fill array if it is smaller than gameIndex
      while (existingDetails.length <= gameIndex) {
        existingDetails.push(null);
      }
      existingDetails[gameIndex] = matchDetailsData;

      // C. Save updated matchDetails list to Firebase
      await set(detailsRef, existingDetails);

      // D. Update match scores and status based on all completed games in existingDetails
      let scoreA = 0;
      let scoreB = 0;

      existingDetails.forEach(game => {
        if (game) {
          const isBlueWinner = game.teams[100].winner;
          if (isBlueWinner) {
            scoreA += 1;
          } else {
            scoreB += 1;
          }
        }
      });

      const targetWins = Math.ceil(match.bestOf / 2);
      let status = "live";
      let winnerId = null;

      if (scoreA >= targetWins) {
        status = "completed";
        winnerId = match.teamAId;
      } else if (scoreB >= targetWins) {
        status = "completed";
        winnerId = match.teamBId;
      }

      const updatedMatch = {
        ...match,
        scoreA,
        scoreB,
        status,
        winnerId
      };

      // E. Save updated match metadata to Firebase
      await set(matchRef, updatedMatch);

      // F. Handle Playoff Bracket Advancement
      if (status === "completed" && match.type === "knockout") {
        if (matchId === "match-semi1") {
          const finalSnap = await get(ref(db, "matches/match-final"));
          if (finalSnap.exists()) await set(ref(db, "matches/match-final/teamAId"), winnerId);
          const thirdSnap = await get(ref(db, "matches/match-third"));
          if (thirdSnap.exists()) await set(ref(db, "matches/match-third/teamAId"), winnerId === match.teamAId ? match.teamBId : match.teamAId);
        } else if (matchId === "match-semi2") {
          const finalSnap = await get(ref(db, "matches/match-final"));
          if (finalSnap.exists()) await set(ref(db, "matches/match-final/teamBId"), winnerId);
          const thirdSnap = await get(ref(db, "matches/match-third"));
          if (thirdSnap.exists()) await set(ref(db, "matches/match-third/teamBId"), winnerId === match.teamAId ? match.teamBId : match.teamAId);
        }
      }

      // G. Standings recalculation
      await recalculateLeaderboard();
      console.log("Firebase database successfully updated by LCU Import.");
    } else {
      console.log("Mock Mode Active: LocalStorage client-side write required. Data returned to script.");
    }

    return NextResponse.json({
      success: true,
      winnerSide: winningTeamSide,
      matchDetails: matchDetailsData,
      note: isMockMode ? "Mock mode is active. In-memory data processed but Firebase write was skipped." : "Data written successfully to database."
    });

  } catch (error) {
    console.error("LCU Import endpoint error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
