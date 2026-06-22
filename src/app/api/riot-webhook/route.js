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
          { playerName: "Zeus", teamId: 100, champion: "Ornn", kills: 2, deaths: 1, assists: 9, gold: 11200, cs: 210, vision: 24, damageDealt: 18400, items: [3068, 3075, 3111, 3001, 0, 0] },
          { playerName: "Oner", teamId: 100, champion: "Sejuani", kills: 1, deaths: 2, assists: 12, gold: 9800, cs: 165, vision: 32, damageDealt: 12100, items: [3068, 3111, 3109, 0, 0, 0] },
          { playerName: "Faker", teamId: 100, champion: "Azir", kills: 6, deaths: 1, assists: 7, gold: 13500, cs: 245, vision: 28, damageDealt: 29400, items: [3006, 6655, 3089, 3157, 0, 0] },
          { playerName: "Gumayusi", teamId: 100, champion: "Aphelios", kills: 5, deaths: 0, assists: 5, gold: 14200, cs: 265, vision: 18, damageDealt: 27500, items: [3006, 6672, 3031, 3046, 0, 0] },
          { playerName: "Keria", teamId: 100, champion: "Thresh", kills: 1, deaths: 2, assists: 10, gold: 7500, cs: 42, vision: 65, damageDealt: 4500, items: [3158, 3859, 3190, 0, 0, 0] },
          // Red Team (Team B)
          { playerName: "Kiin", teamId: 200, champion: "K'Sante", kills: 1, deaths: 3, assists: 2, gold: 9200, cs: 195, vision: 19, damageDealt: 14100, items: [3068, 3111, 3001, 0, 0, 0] },
          { playerName: "Canyon", teamId: 200, champion: "Maokai", kills: 0, deaths: 4, assists: 4, gold: 8100, cs: 145, vision: 41, damageDealt: 8900, items: [3068, 3111, 3109, 0, 0, 0] },
          { playerName: "Chovy", teamId: 200, champion: "Yone", kills: 3, deaths: 3, assists: 1, gold: 11500, cs: 232, vision: 21, damageDealt: 19200, items: [3006, 6672, 3031, 0, 0, 0] },
          { playerName: "Peyz", teamId: 200, champion: "Zeri", kills: 2, deaths: 2, assists: 2, gold: 12100, cs: 250, vision: 15, damageDealt: 21400, items: [3006, 6672, 3046, 0, 0, 0] },
          { playerName: "Lehends", teamId: 200, champion: "Lulu", kills: 0, deaths: 3, assists: 4, gold: 6800, cs: 35, vision: 54, damageDealt: 3200, items: [3158, 3859, 3190, 0, 0, 0] }
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
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        gold: p.goldEarned,
        cs: p.totalMinionsKilled + p.neutralMinionsKilled,
        vision: p.visionScore,
        damageDealt: p.totalDamageDealtToChampions,
        items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5]
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
