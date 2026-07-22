import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { images, champions, teamPlayers } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured on the server." }, { status: 500 });
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "No screenshots provided." }, { status: 400 });
    }

    // Prepare content parts for Gemini API
    const imageParts = images.map((img) => {
      const parts = img.split(";base64,");
      const mimeType = parts[0].split(":")[1] || "image/jpeg";
      const base64Data = parts[1] || parts[0];
      return {
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      };
    });

    const validChampsText = champions && Array.isArray(champions) && champions.length > 0
      ? `\nVALID CHAMPIONS LIST:\nUse this list to map the champion played. You MUST select/map the champion name EXACTLY from this list:\n${champions.join(", ")}\n`
      : "";

    const registeredPlayersText = teamPlayers && Array.isArray(teamPlayers) && teamPlayers.length > 0
      ? `\nREGISTERED MATCH PLAYERS LIST:\nThis match consists of these players. Use their registered names, jersey names, or Riot IDs to help you map their extracted in-game summoner names (which are shown in the screenshots):\n${teamPlayers.map(p => `- Name: ${p.name}, Jersey: ${p.jerseyName || "None"}, RiotID: ${p.riotId || "None"}`).join("\n")}\n`
      : "";

    const promptText = `
Extract the post-game statistics for the 10 players from these screenshots of a League of Legends match.
Multiple screenshots are provided (up to 3 images).

CRITICAL INSTRUCTION FOR EXTRACTING CHAMPION/HERO NAMES:
1. LOCATE THE SCOREBOARD OVERVIEW SCREENSHOT:
   - First, scan the 3 provided images and find the main Scoreboard overview image (titled "BẢNG ĐIỂM" or showing the 10 players/heroes layout split into 2 team sections, 5 rows each).
2. EXTRACT HERO/CHAMPION NAME DIRECTLY BELOW THE IGN / RIOT ID:
   - On that Scoreboard image, inspect each of the 10 player rows.
   - Each player row shows the player's in-game name (IGN / Riot ID) on the top text line.
   - DIRECTLY BELOW the IGN / Riot ID, the text name of the hero/champion is explicitly written (e.g. under "Phucego" it explicitly says "Zed", under "Amadeus" it says "Corki", under "LôngDàiVlLẩuThái" it says "Sona", under "DarkTurquois" it says "Maokai", under "mmbl" it says "Rakan").
   - Extract the hero/champion name strictly from this printed text line directly below the IGN / Riot ID.
   - DO NOT guess or infer champions from circular avatar icons on stats, damage, or healing tabs. Always use the text printed directly below the IGN on the Scoreboard layout.
${validChampsText}${registeredPlayersText}
For each player, extract:
1. "summonerName": The in-game name/Riot ID shown in the screenshot. Do not guess jersey name/employee ID if not present in the screenshot, just extract the name literally shown.
2. "champion": The name of the hero/champion played, extracted from the text line directly BELOW the IGN / Riot ID on the Scoreboard layout screen, mapped to the exact spelling in the VALID CHAMPIONS LIST.
3. "kills": Integer number of kills.
4. "deaths": Integer number of deaths.
5. "assists": Integer number of assists.
6. "gold": Integer total gold earned.
7. "cs": Integer Creep Score (minions/monsters killed).
8. "damageDealt": Integer total damage dealt to champions.
9. "damageTaken": Integer total damage taken.
10. "healing": Integer representing the total ally heal/shield value. This MUST be the sum of "Ally Healing" and "Ally Shielding" shown in the screenshots under the 'DAMAGE TAKEN AND HEALED' section (DO NOT include 'Damage Healed'; if a row is missing or has no value, treat it as 0). For example, if a player has 22474 Damage Healed, 17157 Ally Healing, and 11013 Ally Shielding, the "healing" value should be 17157 + 11013 = 28170.

Format the response strictly as a JSON object with this exact structure:
{
  "gameDuration": "MM:SS",
  "winnerSide": "Blue" | "Red",
  "playerStats": [
    {
      "summonerName": "Name",
      "champion": "ChampionName",
      "kills": 0,
      "deaths": 0,
      "assists": 0,
      "gold": 0,
      "cs": 0,
      "damageDealt": 0,
      "damageTaken": 0,
      "healing": 0
    }
  ]
}
Ensure there are exactly 10 players in "playerStats". Do not return any other text outside the JSON block.
`;

    const payload = {
      contents: [
        {
          parts: [
            { text: promptText },
            ...imageParts
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            gameDuration: { type: "STRING" },
            winnerSide: { type: "STRING", enum: ["Blue", "Red"] },
            playerStats: {
              type: "ARRAY",
              minItems: 10,
              maxItems: 10,
              items: {
                type: "OBJECT",
                properties: {
                  summonerName: { type: "STRING" },
                  champion: { type: "STRING" },
                  kills: { type: "INTEGER" },
                  deaths: { type: "INTEGER" },
                  assists: { type: "INTEGER" },
                  gold: { type: "INTEGER" },
                  cs: { type: "INTEGER" },
                  damageDealt: { type: "INTEGER" },
                  damageTaken: { type: "INTEGER" },
                  healing: { type: "INTEGER" }
                },
                required: ["summonerName", "champion", "kills", "deaths", "assists", "gold", "cs", "damageDealt", "damageTaken", "healing"]
              }
            }
          },
          required: ["gameDuration", "winnerSide", "playerStats"]
        }
      }
    };

    const trials = [
      { version: "v1beta", model: "gemini-flash-lite-latest" },
      { version: "v1beta", model: "gemini-3.1-flash-lite" },
      { version: "v1beta", model: "gemini-flash-latest" },
      { version: "v1beta", model: "gemini-3.5-flash" },
      { version: "v1", model: "gemini-flash-lite-latest" },
      { version: "v1", model: "gemini-3.1-flash-lite" },
      { version: "v1", model: "gemini-flash-latest" },
      { version: "v1", model: "gemini-3.5-flash" },
      { version: "v1beta", model: "gemini-2.0-flash-lite" },
      { version: "v1beta", model: "gemini-2.0-flash" }
    ];

    let lastError = null;
    let response = null;
    let successfulModel = "";
    let successfulVersion = "";

    for (const trial of trials) {
      const url = `https://generativelanguage.googleapis.com/${trial.version}/models/${trial.model}:generateContent?key=${apiKey}`;
      console.log(`Trying Gemini API (${trial.version}/${trial.model})...`);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          response = res;
          successfulModel = trial.model;
          successfulVersion = trial.version;
          break;
        } else {
          const errText = await res.text();
          console.warn(`Trial failed for ${trial.version}/${trial.model}: ${res.status} - ${errText}`);
          lastError = new Error(`Gemini API (${trial.version}/${trial.model}) returned status ${res.status}: ${errText}`);
        }
      } catch (err) {
        console.warn(`Fetch error for ${trial.version}/${trial.model}:`, err.message);
        lastError = err;
      }
    }

    if (!response) {
      throw lastError || new Error("All Gemini API models and versions failed.");
    }

    console.log(`Successfully parsed screenshots using ${successfulVersion}/${successfulModel}`);

    const resData = await response.json();
    const candidateText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error("No output candidate text returned from Gemini.");
    }

    // Try parsing candidateText as JSON
    const parsedData = JSON.parse(candidateText.trim());
    return NextResponse.json(parsedData);
  } catch (error) {
    console.error("OCR Analyze API Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
