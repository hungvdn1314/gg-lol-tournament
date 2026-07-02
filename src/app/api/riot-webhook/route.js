import { NextResponse } from "next/server";
import { isMockMode } from "@/lib/firebase";

// Helper to determine regional routing for match details query
function getRegionalRouting(matchId) {
  if (!matchId) return "sea";
  const id = matchId.toUpperCase();
  if (id.startsWith("VN") || id.startsWith("SG") || id.startsWith("PH") || id.startsWith("TH") || id.startsWith("MY") || id.startsWith("TW")) return "sea";
  if (id.startsWith("NA") || id.startsWith("BR") || id.startsWith("LA")) return "americas";
  if (id.startsWith("EU") || id.startsWith("TR") || id.startsWith("RU")) return "europe";
  if (id.startsWith("KR") || id.startsWith("JP")) return "asia";
  return "sea"; // default
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log("Riot Webhook received payload:", body);

    const apiKey = process.env.RIOT_API_KEY;
    const { tournamentCode, matchId: riotMatchId, metaData } = body;

    // Parse internal database match ID from metadata
    let internalMatchId = null;
    try {
      const parsedMeta = typeof metaData === "string" ? JSON.parse(metaData) : metaData;
      internalMatchId = parsedMeta?.match_id;
    } catch (e) {
      console.warn("Could not parse metadata, falling back to matchId:", e);
    }
    
    if (!internalMatchId) {
      internalMatchId = body.matchId; // fallback
    }

    if (!internalMatchId) {
      return NextResponse.json({ error: "Missing match reference ID" }, { status: 400 });
    }

    let matchDetailsData = null;
    let winningTeamSide = 100; // Default Blue side (Team A)

    // Check if it is a local simulator test or mock mode
    const isSimulation = body.isSimulation === true || !apiKey || apiKey === "placeholder";

    if (isSimulation) {
      console.log("Processing simulated webhook payload.");
      winningTeamSide = body.simulatedWinnerSide || 100;
      
      // Generate realistic mock telemetry
      matchDetailsData = {
        gameDuration: 1654, // ~27 minutes
        teams: {
          100: { winner: winningTeamSide === 100, bans: ["Zed", "Yasuo", "Yone"], barons: 1, dragons: 3, firstBlood: true },
          200: { winner: winningTeamSide === 200, bans: ["Yuumi", "Teemo", "Briar"], barons: 0, dragons: 1, firstBlood: false }
        },
        participants: [
          // Blue Team (Team A)
          { playerName: "Zeus", teamId: 100, champion: "Ornn", win: winningTeamSide === 100, kills: 2, deaths: 1, assists: 9, gold: 11200, cs: 210, vision: 24, damageDealt: 18400, damageTaken: 29500, healing: 1500, tripleKills: 0, quadraKills: 0, pentaKills: 0, firstBlood: false, controlWards: 2, wardsPlaced: 12, wardsKilled: 3, turretsKilled: 1, inhibitorsKilled: 0, ccDuration: 42, items: [3068, 3075, 3111, 3001, 0, 0], summonerSpells: [12, 4], runes: { keystoneId: 8437, primaryStyleId: 8400 } },
          { playerName: "Oner", teamId: 100, champion: "Sejuani", win: winningTeamSide === 100, kills: 1, deaths: 2, assists: 12, gold: 9800, cs: 165, vision: 32, damageDealt: 12100, damageTaken: 28400, healing: 2200, tripleKills: 0, quadraKills: 0, pentaKills: 0, firstBlood: true, controlWards: 4, wardsPlaced: 18, wardsKilled: 5, turretsKilled: 0, inhibitorsKilled: 0, ccDuration: 55, items: [3068, 3111, 3109, 0, 0, 0], summonerSpells: [11, 4], runes: { keystoneId: 8439, primaryStyleId: 8400 } },
          { playerName: "Faker", teamId: 100, champion: "Azir", win: winningTeamSide === 100, kills: 6, deaths: 1, assists: 7, gold: 13500, cs: 245, vision: 28, damageDealt: 29400, damageTaken: 11400, healing: 900, tripleKills: 1, quadraKills: 0, pentaKills: 0, firstBlood: false, controlWards: 3, wardsPlaced: 15, wardsKilled: 4, turretsKilled: 2, inhibitorsKilled: 1, ccDuration: 18, items: [3006, 6655, 3089, 3157, 0, 0], summonerSpells: [12, 4], runes: { keystoneId: 8021, primaryStyleId: 8000 } },
          { playerName: "Gumayusi", teamId: 100, champion: "Aphelios", win: winningTeamSide === 100, kills: 5, deaths: 0, assists: 5, gold: 14200, cs: 265, vision: 18, damageDealt: 27500, damageTaken: 9400, healing: 2100, tripleKills: 0, quadraKills: 0, pentaKills: 0, firstBlood: false, controlWards: 1, wardsPlaced: 10, wardsKilled: 2, turretsKilled: 2, inhibitorsKilled: 0, ccDuration: 8, items: [3006, 6672, 3031, 3046, 0, 0], summonerSpells: [7, 4], runes: { keystoneId: 8008, primaryStyleId: 8000 } },
          { playerName: "Keria", teamId: 100, champion: "Thresh", win: winningTeamSide === 100, kills: 1, deaths: 2, assists: 10, gold: 7500, cs: 42, vision: 65, damageDealt: 4500, damageTaken: 14200, healing: 1100, tripleKills: 0, quadraKills: 0, pentaKills: 0, firstBlood: false, controlWards: 8, wardsPlaced: 35, wardsKilled: 12, turretsKilled: 0, inhibitorsKilled: 0, ccDuration: 48, items: [3158, 3859, 3190, 0, 0, 0], summonerSpells: [14, 4], runes: { keystoneId: 8465, primaryStyleId: 8400 } },
          // Red Team (Team B)
          { playerName: "Kiin", teamId: 200, champion: "K'Sante", win: winningTeamSide === 200, kills: 1, deaths: 3, assists: 2, gold: 9200, cs: 195, vision: 19, damageDealt: 14100, damageTaken: 32100, healing: 3500, tripleKills: 0, quadraKills: 0, pentaKills: 0, firstBlood: false, controlWards: 1, wardsPlaced: 9, wardsKilled: 2, turretsKilled: 0, inhibitorsKilled: 0, ccDuration: 29, items: [3068, 3111, 3001, 0, 0, 0], summonerSpells: [12, 4], runes: { keystoneId: 8437, primaryStyleId: 8400 } },
          { playerName: "Canyon", teamId: 200, champion: "Maokai", win: winningTeamSide === 200, kills: 0, deaths: 4, assists: 4, gold: 8100, cs: 145, vision: 41, damageDealt: 8900, damageTaken: 25400, healing: 1800, tripleKills: 0, quadraKills: 0, pentaKills: 0, firstBlood: false, controlWards: 5, wardsPlaced: 22, wardsKilled: 6, turretsKilled: 0, inhibitorsKilled: 0, ccDuration: 52, items: [3068, 3111, 3109, 0, 0, 0], summonerSpells: [11, 4], runes: { keystoneId: 8010, primaryStyleId: 8000 } },
          { playerName: "Chovy", teamId: 200, champion: "Yone", win: winningTeamSide === 200, kills: 3, deaths: 3, assists: 1, gold: 11500, cs: 232, vision: 21, damageDealt: 19200, damageTaken: 18400, healing: 1200, tripleKills: 0, quadraKills: 0, pentaKills: 0, firstBlood: false, controlWards: 2, wardsPlaced: 11, wardsKilled: 3, turretsKilled: 1, inhibitorsKilled: 0, ccDuration: 15, items: [3006, 6672, 3031, 0, 0, 0], summonerSpells: [12, 4], runes: { keystoneId: 8010, primaryStyleId: 8000 } },
          { playerName: "Peyz", teamId: 200, champion: "Zeri", win: winningTeamSide === 200, kills: 2, deaths: 2, assists: 2, gold: 12100, cs: 250, vision: 15, damageDealt: 21400, damageTaken: 11200, healing: 800, tripleKills: 0, quadraKills: 0, pentaKills: 0, firstBlood: false, controlWards: 2, wardsPlaced: 8, wardsKilled: 1, turretsKilled: 0, inhibitorsKilled: 0, ccDuration: 4, items: [3006, 6672, 3046, 0, 0, 0], summonerSpells: [7, 4], runes: { keystoneId: 8008, primaryStyleId: 8000 } },
          { playerName: "Lehends", teamId: 200, champion: "Lulu", win: winningTeamSide === 200, kills: 0, deaths: 3, assists: 4, gold: 6800, cs: 35, vision: 54, damageDealt: 3200, damageTaken: 12500, healing: 4200, tripleKills: 0, quadraKills: 0, pentaKills: 0, firstBlood: false, controlWards: 6, wardsPlaced: 28, wardsKilled: 8, turretsKilled: 0, inhibitorsKilled: 0, ccDuration: 34, items: [3158, 3859, 3190, 0, 0, 0], summonerSpells: [14, 4], runes: { keystoneId: 8214, primaryStyleId: 8200 } }
        ]
      };
    } else {
      // Real Riot API request to fetch match data
      const regionalRouting = getRegionalRouting(riotMatchId);
      const riotUrl = `https://${regionalRouting}.api.riotgames.com/lol/match/v5/matches/${riotMatchId}`;
      
      console.log(`Querying Riot API for match details: ${riotUrl}`);
      const response = await fetch(riotUrl, {
        headers: {
          "X-Riot-Token": apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Riot match API returned status ${response.status}`);
      }

      const rawMatchData = await response.json();
      
      // Extract stats from Riot standard JSON schema
      const { info } = rawMatchData;
      const blueTeamInfo = info.teams.find(t => t.teamId === 100);
      const redTeamInfo = info.teams.find(t => t.teamId === 200);

      winningTeamSide = blueTeamInfo?.win ? 100 : 200;

      // Map participant data
      const participants = info.participants.map(p => ({
        playerName: p.riotIdGameName || p.summonerName,
        teamId: p.teamId,
        champion: p.championName,
        win: p.win,
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        gold: p.goldEarned,
        cs: p.totalMinionsKilled + p.neutralMinionsKilled,
        vision: p.visionScore,
        damageDealt: p.totalDamageDealtToChampions,
        damageTaken: p.totalDamageTaken,
        healing: p.totalHeal,
        tripleKills: p.tripleKills || 0,
        quadraKills: p.quadraKills || 0,
        pentaKills: p.pentaKills || 0,
        firstBlood: p.firstBloodKill || p.firstBloodAssist || false,
        controlWards: p.visionWardsBoughtInGame || 0,
        wardsPlaced: p.wardsPlaced || 0,
        wardsKilled: p.wardsKilled || 0,
        turretsKilled: p.turretKills || 0,
        inhibitorsKilled: p.inhibitorKills || 0,
        ccDuration: p.totalTimeCCDealt || 0,
        items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5],
        summonerSpells: [p.summoner1Id, p.summoner2Id],
        runes: {
          keystoneId: p.perks?.styles?.[0]?.selections?.[0]?.perk || null,
          primaryStyleId: p.perks?.styles?.[0]?.style || null
        }
      }));

      matchDetailsData = {
        gameDuration: info.gameDuration,
        teams: {
          100: { 
            winner: blueTeamInfo?.win, 
            bans: blueTeamInfo?.bans?.map(b => b.championId) || [], 
            barons: blueTeamInfo?.objectives?.baron?.kills || 0, 
            dragons: blueTeamInfo?.objectives?.dragon?.kills || 0,
            firstBlood: blueTeamInfo?.objectives?.champion?.first || false
          },
          200: { 
            winner: redTeamInfo?.win, 
            bans: redTeamInfo?.bans?.map(b => b.championId) || [], 
            barons: redTeamInfo?.objectives?.baron?.kills || 0, 
            dragons: redTeamInfo?.objectives?.dragon?.kills || 0,
            firstBlood: redTeamInfo?.objectives?.champion?.first || false
          }
        },
        participants
      };
    }

    // Server-Side Firebase Write (If we are NOT in Mock Mode)
    if (!isMockMode) {
      // Dynamic imports of firebase admin or client SDK to update values
      const { database: db } = await import("@/lib/firebase");
      const { ref, get, set } = await import("firebase/database");
      const { recalculateLeaderboard } = await import("@/lib/db");

      // 1. Fetch current match configuration
      const matchRef = ref(db, `matches/${internalMatchId}`);
      const matchSnapshot = await get(matchRef);

      if (matchSnapshot.exists()) {
        const match = matchSnapshot.val();
        
        // 2. Increment score based on winning team
        let scoreA = match.scoreA || 0;
        let scoreB = match.scoreB || 0;

        if (winningTeamSide === 100) {
          scoreA += 1;
        } else {
          scoreB += 1;
        }

        // 3. Determine if series is completed (e.g. Bo3 reaches 2 wins)
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

        // 4. Save updated match to Firebase
        await set(matchRef, updatedMatch);

        // 5. Save detailed match telemetry
        await set(ref(db, `matchDetails/${internalMatchId}`), matchDetailsData);

        // 6. Handle Playoff Bracket Advancement
        if (status === "completed" && match.type === "knockout") {
          if (internalMatchId === "match-semi1") {
            const finalRef = ref(db, "matches/match-final");
            const thirdRef = ref(db, "matches/match-third");
            
            const finalSnap = await get(finalRef);
            if (finalSnap.exists()) {
              await set(ref(db, "matches/match-final/teamAId"), winnerId);
            }
            const thirdSnap = await get(thirdRef);
            if (thirdSnap.exists()) {
              await set(ref(db, "matches/match-third/teamAId"), winnerId === match.teamAId ? match.teamBId : match.teamAId);
            }
          } else if (internalMatchId === "match-semi2") {
            const finalRef = ref(db, "matches/match-final");
            const thirdRef = ref(db, "matches/match-third");
            
            const finalSnap = await get(finalRef);
            if (finalSnap.exists()) {
              await set(ref(db, "matches/match-final/teamBId"), winnerId);
            }
            const thirdSnap = await get(thirdRef);
            if (thirdSnap.exists()) {
              await set(ref(db, "matches/match-third/teamBId"), winnerId === match.teamAId ? match.teamBId : match.teamAId);
            }
          }
        }

        // 7. Trigger leaderboard standings update
        await recalculateLeaderboard();

        console.log("Firebase database successfully updated by Riot Webhook.");
      } else {
        console.error(`Match ID ${internalMatchId} not found in database.`);
      }
    } else {
      console.log("Mock Mode Active: Firebase writes bypassed. Simulation results will be processed client-side.");
    }

    return NextResponse.json({ 
      success: true, 
      matchId: internalMatchId,
      winner: winningTeamSide === 100 ? "Team A" : "Team B",
      simulation: isSimulation,
      details: matchDetailsData
    });
  } catch (error) {
    console.error("Riot Webhook handler error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
