import fs from "fs";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, update } from "firebase/database";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

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
const firebaseConfig = {
  apiKey: getEnvVar("NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: getEnvVar("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  databaseURL: getEnvVar("NEXT_PUBLIC_FIREBASE_DATABASE_URL"),
  projectId: getEnvVar("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: getEnvVar("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnvVar("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnvVar("NEXT_PUBLIC_FIREBASE_APP_ID")
};

if (!apiKey) {
  console.error("Riot API Key not found.");
  process.exit(1);
}

// 2. Initialize Firebase
console.log("Connecting to Firebase database:", firebaseConfig.databaseURL);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Match details we want to sync
const matchId = "match-g-a1";
const matchIdsToFetch = ["VN2_1269542240", "VN2_1200150909", "VN2_1200143873"];

// Fetch and map each game
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
      // Map Riot API fields to our DB Schema
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

    // Helper to calculate total team stats
    const sumTeamStat = (teamId, field) => 
      participants.filter(p => p.teamId === teamId).reduce((sum, p) => sum + p[field], 0);

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

  // Calculate overall match score
  let scoreA = 0;
  let scoreB = 0;
  gameDetailsList.forEach(game => {
    if (game.teams[100].winner) scoreA++;
    else if (game.teams[200].winner) scoreB++;
  });

  const winnerId = scoreA > scoreB ? "team-u40" : "team-gapvibe";
  const status = "completed";

  // Authenticate as Admin
  console.log("Authenticating as admin...");
  await signInWithEmailAndPassword(auth, "admin@geargames.com", "admin");
  console.log("Authentication successful.");

  console.log(`Writing match details to Firebase for match ${matchId}...`);
  await set(ref(database, `matchDetails/${matchId}`), gameDetailsList);

  console.log(`Updating match score/status: Score A (Blue/u40) = ${scoreA}, Score B (Red/gapvibe) = ${scoreB}...`);
  await update(ref(database, `matches/${matchId}`), {
    scoreA,
    scoreB,
    status,
    winnerId
  });

  console.log("Success! Match synced successfully.");
  process.exit(0);
}

fetchAndMapGames().catch(e => {
  console.error("Sync failed:", e);
  process.exit(1);
});
