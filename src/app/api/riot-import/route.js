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
    const { riotMatchId } = await request.json();
    const apiKey = process.env.RIOT_API_KEY;

    if (!riotMatchId) {
      return NextResponse.json({ error: "Missing riotMatchId." }, { status: 400 });
    }

    if (!apiKey || apiKey === "placeholder") {
      return NextResponse.json({ error: "Riot API Key is not configured." }, { status: 400 });
    }
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
      win: p.win,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      gold: p.goldEarned,
      cs: p.totalMinionsKilled + p.neutralMinionsKilled,
      vision: p.visionScore,
      damageDealt: p.totalDamageDealtToChampions,
      damageTaken: p.totalDamageTaken,
      healing: (p.totalHealsOnTeammates || 0) + (p.totalDamageShieldedOnTeammates || 0),
      tripleKills: p.tripleKills || 0,
      quadraKills: p.quadraKills || 0,
      pentaKills: p.pentaKills || 0,
      firstBlood: p.firstBloodKill || false,
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

    // Return details to be saved on client-side (where user is authenticated)
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
