import fs from "fs";

// 1. Load config and API Key
const envPath = "./.env.local";
if (!fs.existsSync(envPath)) {
  console.error("No .env.local file found.");
  process.exit(1);
}
const envContent = fs.readFileSync(envPath, "utf8");

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`${name}\\s*=\\s*([^\\n\\r]+)`));
  return match ? match[1].trim() : null;
};

const apiKey = getEnvVar("RIOT_API_KEY");
if (!apiKey) {
  console.error("Riot API Key not found.");
  process.exit(1);
}

const matchIdsToFetch = ["VN2_1269542240", "VN2_1200150909", "VN2_1200143873"];

async function fetchAndMapGames() {
  const gameDetailsList = [];

  for (let idx = 0; idx < matchIdsToFetch.length; idx++) {
    const rId = matchIdsToFetch[idx];
    console.log(`Fetching game ${idx + 1}: ${rId}...`);
    
    const url = `https://sea.api.riotgames.com/lol/match/v5/matches/${rId}`;
    const res = await fetch(url, { headers: { "X-Riot-Token": apiKey } });
    if (!res.ok) {
      throw new Error(`Failed to fetch match ${rId} from Riot API (Status ${res.status})`);
    }
    const matchData = await res.json();
    const info = matchData.info || {};

    const participants = info.participants.map(p => {
      return {
        playerName: p.riotIdGameName || p.summonerName,
        teamId: p.teamId, // 100 or 200
        win: p.win,
        kills: p.kills || 0,
        deaths: p.deaths || 0,
        assists: p.assists || 0,
        gold: p.goldEarned || 0,
        cs: (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0),
        vision: p.visionScore || 0,
        damageDealt: p.totalDamageDealtToChampions || 0,
        damageTaken: p.totalDamageTaken || 0,
        healing: (p.totalHealsOnTeammates || 0) + (p.totalDamageShieldedOnTeammates || 0),
        tripleKills: p.tripleKills || 0,
        quadraKills: p.quadraKills || 0,
        pentaKills: p.pentaKills || 0,
        firstBlood: p.firstBloodKill || p.firstBloodAssist || false,
        turretsKilled: p.turretKills || 0,
        inhibitorsKilled: p.inhibitorKills || 0,
        champion: p.championName,
        items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5],
        summonerSpells: [p.summoner1Id, p.summoner2Id],
        runes: {
          keystoneId: p.perks?.styles?.[0]?.selections?.[0]?.perk || null,
          primaryStyleId: p.perks?.styles?.[0]?.style || null
        }
      };
    });

    const blueTeamWin = info.teams.find(t => t.teamId === 100)?.win || false;
    const redTeamWin = info.teams.find(t => t.teamId === 200)?.win || false;

    const gameDetails = {
      gameDuration: info.gameDuration,
      teams: {
        100: {
          winner: blueTeamWin,
          bans: [],
          barons: 0,
          dragons: 0,
          firstBlood: participants.some(p => p.teamId === 100 && p.firstBlood)
        },
        200: {
          winner: redTeamWin,
          bans: [],
          barons: 0,
          dragons: 0,
          firstBlood: participants.some(p => p.teamId === 200 && p.firstBlood)
        }
      },
      participants
    };

    gameDetailsList.push(gameDetails);
  }

  console.log("Modifying src/lib/db.js to inject match-g-a1 results...");
  let dbContent = fs.readFileSync("./src/lib/db.js", "utf8");

  // 1. Inject DEFAULT_MATCH_DETAILS definition
  const matchDetailsString = `const DEFAULT_MATCH_DETAILS = {\n  "match-g-a1": ${JSON.stringify(gameDetailsList, null, 2)}\n};\n\n`;
  
  if (!dbContent.includes("const DEFAULT_MATCH_DETAILS")) {
    // Insert DEFAULT_MATCH_DETAILS right after DEFAULT_TEAMS (or at the top level)
    const insertIndex = dbContent.indexOf("const DEFAULT_TEAMS = {");
    if (insertIndex === -1) throw new Error("Could not find DEFAULT_TEAMS insertion hook");
    dbContent = dbContent.slice(0, insertIndex) + matchDetailsString + dbContent.slice(insertIndex);
  } else {
    // Replace existing DEFAULT_MATCH_DETAILS
    const startIdx = dbContent.indexOf("const DEFAULT_MATCH_DETAILS = {");
    let braceCount = 1;
    let currIdx = startIdx + "const DEFAULT_MATCH_DETAILS = {".length;
    while (braceCount > 0 && currIdx < dbContent.length) {
      if (dbContent[currIdx] === "{") braceCount++;
      if (dbContent[currIdx] === "}") braceCount--;
      currIdx++;
    }
    // consume semicolon if exists
    if (dbContent[currIdx] === ";") currIdx++;
    dbContent = dbContent.slice(0, startIdx) + matchDetailsString + dbContent.slice(currIdx);
  }

  // 2. Update match-g-a1 in DEFAULT_MATCHES
  const targetMatchString = `"match-g-a1": {
    "id": "match-g-a1",
    "type": "group",
    "stage": "Group Stage",
    "group": "A",
    "teamAId": "team-u40",
    "teamBId": "team-gapvibe",
    "scoreA": 0,
    "scoreB": 0,
    "status": "scheduled",
    "bestOf": 3,
    "scheduledTime": "2026-07-22T12:00:00.000Z",
    "winnerId": null
  }`;

  const updatedMatchString = `"match-g-a1": {
    "id": "match-g-a1",
    "type": "group",
    "stage": "Group Stage",
    "group": "A",
    "teamAId": "team-u40",
    "teamBId": "team-gapvibe",
    "scoreA": 1,
    "scoreB": 2,
    "status": "completed",
    "bestOf": 3,
    "scheduledTime": "2026-07-22T12:00:00.000Z",
    "winnerId": "team-gapvibe"
  }`;

  if (dbContent.includes(targetMatchString)) {
    dbContent = dbContent.replace(targetMatchString, updatedMatchString);
  } else {
    // Soft fallback if spacing differs
    console.log("Warning: Match template mismatch. Doing regex replace.");
    const regex = /"match-g-a1":\s*\{[^}]*scoreA"[^}]*status"[^}]*\}/s;
    dbContent = dbContent.replace(regex, updatedMatchString);
  }

  // 3. Replace all fallback getMockStorage("matchDetails", {}) with DEFAULT_MATCH_DETAILS
  dbContent = dbContent.replaceAll('getMockStorage("matchDetails", {})', 'getMockStorage("matchDetails", DEFAULT_MATCH_DETAILS)');
  dbContent = dbContent.replaceAll('setMockStorage("matchDetails", {})', 'setMockStorage("matchDetails", DEFAULT_MATCH_DETAILS)');
  dbContent = dbContent.replaceAll('callback(getMockStorage("matchDetails", {}));', 'callback(getMockStorage("matchDetails", DEFAULT_MATCH_DETAILS));');

  // Save back to db.js
  fs.writeFileSync("./src/lib/db.js", dbContent, "utf8");
  console.log("Successfully wrote seed data into src/lib/db.js.");

  // 4. Force local dev environment to Mock Mode
  console.log("Updating .env.local to NEXT_PUBLIC_MOCK_MODE=true...");
  let envUpdated = envContent.replace(/NEXT_PUBLIC_MOCK_MODE\s*=\s*\w+/, "NEXT_PUBLIC_MOCK_MODE=true");
  fs.writeFileSync(envPath, envUpdated, "utf8");

  console.log("Sync complete! Please restart your next dev server if needed.");
  process.exit(0);
}

fetchAndMapGames().catch(e => {
  console.error("Failure:", e);
  process.exit(1);
});
