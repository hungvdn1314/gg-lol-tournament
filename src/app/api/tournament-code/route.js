import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { tournamentId, matchId, bestOf } = await request.json();
    const apiKey = process.env.RIOT_API_KEY;

    // Check if we are running in mock mode or have no key
    if (!apiKey || apiKey === "placeholder") {
      console.log("Mock Mode Active: Generating simulated tournament code.");
      const mockCode = `MOCK-VN2-${matchId}-${Date.now().toString().slice(-4)}`;
      return NextResponse.json({ code: mockCode });
    }

    // Default tournamentId fallback if not registered yet
    const tId = tournamentId || "7899"; // Default fallback

    const url = `https://americas.api.riotgames.com/lol/tournament/v5/codes?tournamentId=${tId}`;

    const payload = {
      allowedSummonerIds: [],
      mapType: "SUMMONERS_RIFT",
      metadata: JSON.stringify({ match_id: matchId }),
      pickType: "TOURNAMENT_DRAFT",
      spectatorType: "ALL",
      teamSize: 5
    };

    console.log(`Sending request to Riot Tournament API: ${url}`);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Riot-Token": apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Riot Tournament API error: ${response.status} - ${errorText}`);
      throw new Error(`Riot API returned status ${response.status}`);
    }

    const data = await response.json(); // Returns an array of codes e.g. ["VN2_1234"]
    const code = data[0] || `VN2-FALLBACK-${matchId}`;

    return NextResponse.json({ code });
  } catch (error) {
    console.error("Tournament Code API error:", error);
    // Graceful fallback to mock code if API is down or key lacks tournament permission
    const fallbackCode = `TEMP-VN2-${Date.now().toString().slice(-6)}`;
    return NextResponse.json({ 
      error: error.message, 
      code: fallbackCode,
      note: "Falling back to temporary code. Make sure your Riot key has Tournament endpoints enabled."
    }, { status: 200 }); // Status 200 to not break the UI flow, returning a temp code instead
  }
}
