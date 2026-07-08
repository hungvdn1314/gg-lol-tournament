import { NextResponse } from "next/server";

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
    const { playerRiotId } = await request.json();
    const apiKey = process.env.RIOT_API_KEY;

    if (!playerRiotId) {
      return NextResponse.json({ error: "Riot ID is required." }, { status: 400 });
    }

    if (!apiKey || apiKey === "placeholder") {
      return NextResponse.json({ error: "Riot API Key is not configured." }, { status: 400 });
    }

    const [gameName, tagLine] = playerRiotId.split("#");
    const tagsToTry = playerRiotId.includes("#") ? [tagLine] : ["VN2", "VN1", "VN"];
    let puuid = null;
    let lastStatus = 404;

    for (const tag of tagsToTry) {
      const accountUrl = `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName.trim())}/${encodeURIComponent(tag.trim())}`;
      try {
        const accountRes = await fetch(accountUrl, {
          headers: { "X-Riot-Token": apiKey }
        });
        if (accountRes.ok) {
          const account = await accountRes.json();
          puuid = account.puuid;
          break;
        } else {
          lastStatus = accountRes.status;
        }
      } catch (e) {
        console.error(`Fetch failed for tag ${tag}:`, e);
      }
    }

    if (!puuid) {
      return NextResponse.json({ error: `Riot Account not found for ${gameName}. Status ${lastStatus}` }, { status: lastStatus });
    }

    // 2. Fetch last 15 matches
    const matchesUrl = `https://sea.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=15`;
    const matchesRes = await fetch(matchesUrl, {
      headers: { "X-Riot-Token": apiKey }
    });

    if (!matchesRes.ok) {
      return NextResponse.json({ error: `Could not retrieve match history: ${matchesRes.status}` }, { status: matchesRes.status });
    }

    const matchIds = await matchesRes.json();

    if (!matchIds || matchIds.length === 0) {
      return NextResponse.json({ error: "No matches found in the player's recent history." }, { status: 404 });
    }

    // 3. Fetch basic info for these 5 matches
    const matchPromises = matchIds.map(async (matchId) => {
      const routing = getRegionalRouting(matchId);
      const url = `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
      const res = await fetch(url, { headers: { "X-Riot-Token": apiKey } });
      if (!res.ok) return null;
      
      const rawMatchData = await res.json();
      const { info } = rawMatchData;
      
      // Find the specific player in the match
      const participant = info.participants.find(p => p.puuid === puuid);
      if (!participant) return null;

      return {
        matchId: matchId,
        gameDuration: info.gameDuration,
        gameCreation: info.gameCreation,
        queueId: info.queueId,
        champion: participant.championName,
        kills: participant.kills,
        deaths: participant.deaths,
        assists: participant.assists,
        win: participant.win
      };
    });

    const matchesList = (await Promise.all(matchPromises)).filter(m => m !== null);

    return NextResponse.json({ matches: matchesList });
  } catch (error) {
    console.error("Error in riot-matches API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
