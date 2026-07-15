import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { images } = await request.json();
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

    const promptText = `
Extract the post-game statistics for the 10 players from these screenshots of a League of Legends ARAM match.
There are up to 3 screenshots provided. They show the scoreboard overview, damage stats, healing, gold, minion kills (CS), player items, etc.
Combine the data across all screenshots into exactly 10 player records.

For each player, extract:
1. "summonerName": The in-game name/Riot ID (e.g., 'TuanDV', 'TriTM-1529').
2. "champion": The name of the champion played (e.g., 'Jhin', 'Ryze', 'Akali').
3. "kills": Integer number of kills.
4. "deaths": Integer number of deaths.
5. "assists": Integer number of assists.
6. "gold": Integer total gold earned.
7. "cs": Integer Creep Score (minions/monsters killed).
8. "damageDealt": Integer total damage dealt to champions.
9. "damageTaken": Integer total damage taken.
10. "healing": Integer total healing done.
11. "items": Array of strings representing names of items built by the player, up to 6 items (e.g., ["Infinity Edge", "Guardian Angel"]). Leave empty array if not visible or none.

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
      "healing": 0,
      "items": ["Item1", "Item2"]
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
                  healing: { type: "INTEGER" },
                  items: {
                    type: "ARRAY",
                    items: { type: "STRING" }
                  }
                },
                required: ["summonerName", "champion", "kills", "deaths", "assists", "gold", "cs", "damageDealt", "damageTaken", "healing", "items"]
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
