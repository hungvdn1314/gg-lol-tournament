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
    const { matchId, playerRiotId } = await request.json();
    const apiKey = process.env.RIOT_API_KEY;

    if (!playerRiotId || !playerRiotId.includes("#")) {
      return NextResponse.json({ error: "Invalid Riot ID. Format must be Name#Tag." }, { status: 400 });
    }

    if (!apiKey || apiKey === "placeholder") {
      return NextResponse.json({ error: "Riot API Key is not configured." }, { status: 400 });
    }

    const [gameName, tagLine] = playerRiotId.split("#");

    console.log(`Riot Import: Resolving Riot ID ${gameName}#${tagLine}`);

    // 1. Get PUUID from Riot Account API
    // Account API can be queried on asia.api.riotgames.com or americas.api.riotgames.com
    const accountUrl = `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName.trim())}/${tagLine.trim()}`;
    const accountRes = await fetch(accountUrl, {
      headers: { "X-Riot-Token": apiKey }
    });

    if (!accountRes.ok) {
      const errText = await accountRes.text();
      console.error(`Account API failed: ${accountRes.status} - ${errText}`);
      return NextResponse.json({ error: `Riot Account not found: ${accountRes.status}` }, { status: accountRes.status });
    }

    const account = await accountRes.json();
    const puuid = account.puuid;
    console.log(`Riot Import: Found PUUID: ${puuid}`);

    // 2. Fetch custom games list for the PUUID on sea.api.riotgames.com
    const matchesUrl = `https://sea.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=5`;
    const matchesRes = await fetch(matchesUrl, {
      headers: { "X-Riot-Token": apiKey }
    });

    if (!matchesRes.ok) {
      const errText = await matchesRes.text();
      console.error(`Matches API failed: ${matchesRes.status} - ${errText}`);
      return NextResponse.json({ error: `Could not retrieve match history: ${matchesRes.status}` }, { status: matchesRes.status });
    }

    const matchIds = await matchesRes.json();
    console.log(`Riot Import: Found matches:`, matchIds);

    if (!matchIds || matchIds.length === 0) {
      return NextResponse.json({ error: "No matches found in the player's recent history." }, { status: 404 });
    }

    // Use the latest match ID
    const riotMatchId = matchIds[0];
    const regionalRouting = getRegionalRouting(riotMatchId);
    const matchDetailsUrl = `https://${regionalRouting}.api.riotgames.com/lol/match/v5/matches/${riotMatchId}`;
    
    console.log(`Riot Import: Fetching match details from: ${matchDetailsUrl}`);
    const detailsRes = await fetch(matchDetailsUrl, {
      headers: { "X-Riot-Token": apiKey }
    });

    if (!detailsRes.ok) {
      const errText = await detailsRes.text();
      console.error(`Match Details API failed: ${detailsRes.status} - ${errText}`);
      return NextResponse.json({ error: `Could not retrieve match details: ${detailsRes.status}` }, { status: detailsRes.status });
    }

    const rawMatchData = await detailsRes.json();
    const { info } = rawMatchData;
    
    // Parse stats
    const blueTeamInfo = info.teams.find(t => t.teamId === 100);
    const redTeamInfo = info.teams.find(t => t.teamId === 200);
    const winningTeamSide = blueTeamInfo?.win ? 100 : 200;

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

    const matchDetailsData = {
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

    // If NOT in mock mode, save directly to Firebase
    if (!isMockMode) {
      const { database: db } = await import("@/lib/firebase");
      const { ref, get, set } = await import("firebase/database");
      const { recalculateLeaderboard } = await import("@/lib/db");

      const matchRef = ref(db, `matches/${matchId}`);
      const matchSnapshot = await get(matchRef);

      if (!matchSnapshot.exists()) {
        return NextResponse.json({ error: `Match ID ${matchId} not found in database.` }, { status: 404 });
      }

      const match = matchSnapshot.val();
      
      let scoreA = match.scoreA || 0;
      let scoreB = match.scoreB || 0;

      if (winningTeamSide === 100) {
        scoreA += 1;
      } else {
        scoreB += 1;
      }

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

      await set(matchRef, updatedMatch);
      await set(ref(db, `matchDetails/${matchId}`), matchDetailsData);

      // Handle brackets
      if (status === "completed" && match.type === "knockout") {
        if (matchId === "match-semi1") {
          await set(ref(db, "matches/match-final/teamAId"), winnerId);
          await set(ref(db, "matches/match-third/teamAId"), winnerId === match.teamAId ? match.teamBId : match.teamAId);
        } else if (matchId === "match-semi2") {
          await set(ref(db, "matches/match-final/teamBId"), winnerId);
          await set(ref(db, "matches/match-third/teamBId"), winnerId === match.teamAId ? match.teamBId : match.teamAId);
        }
      }

      await recalculateLeaderboard();

      return NextResponse.json({
        success: true,
        savedInDb: true,
        matchDetails: matchDetailsData,
        winnerSide: winningTeamSide
      });
    }

    // In Mock Mode, return details to be saved on client-side
    return NextResponse.json({
      success: true,
      savedInDb: false,
      matchDetails: matchDetailsData,
      winnerSide: winningTeamSide
    });

  } catch (error) {
    console.error("Riot Import handler error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
