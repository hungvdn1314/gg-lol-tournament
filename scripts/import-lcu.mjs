import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';

// Disable self-signed SSL certificate warnings for LCU local API
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

function findLockfile() {
  const macPath = path.join(os.homedir(), 'Library/Application Support/Riot Games/League of Legends/lockfile');
  const winPath = 'C:\\Riot Games\\League of Legends\\lockfile';

  if (fs.existsSync(macPath)) {
    return macPath;
  }
  if (fs.existsSync(winPath)) {
    return winPath;
  }
  return null;
}

async function main() {
  console.log("=========================================");
  console.log("League of Legends LCU Custom Match Sync");
  console.log("=========================================");

  let lockfilePath = findLockfile();
  
  if (!lockfilePath) {
    console.log("Could not locate League of Legends lockfile in default system locations.");
    const manualPath = await question("Please enter the path to your LoL lockfile manually (or drag and drop it here):\n> ");
    lockfilePath = manualPath.trim().replace(/^['"]|['"]$/g, ''); // Remove wrapping quotes if dragged and dropped
  }

  if (!fs.existsSync(lockfilePath)) {
    console.error(`❌ Error: Lockfile not found at path: ${lockfilePath}`);
    console.log("Please ensure the League of Legends client is running.");
    rl.close();
    process.exit(1);
  }

  console.log(`\nReading lockfile at: ${lockfilePath}`);
  let lockfileContent;
  try {
    lockfileContent = fs.readFileSync(lockfilePath, 'utf8');
  } catch (err) {
    console.error("❌ Error reading lockfile:", err.message);
    rl.close();
    process.exit(1);
  }

  const parts = lockfileContent.split(':');
  if (parts.length < 5) {
    console.error("❌ Error: Lockfile is invalid or corrupt.");
    rl.close();
    process.exit(1);
  }

  const port = parts[2];
  const token = parts[3];
  const authHeader = 'Basic ' + Buffer.from(`riot:${token}`).toString('base64');
  const baseUrl = `https://127.0.0.1:${port}`;

  console.log(`Connecting to League Client LCU API at ${baseUrl}...`);

  let matchHistory;
  try {
    const response = await fetch(`${baseUrl}/lol-match-history/v1/products/lol/current-summoner/matches`, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`LCU returned HTTP ${response.status} - ${response.statusText}`);
    }

    matchHistory = await response.json();
  } catch (err) {
    console.error("❌ Failed to connect to League client LCU API:", err.message);
    console.log("Verify that the League Client is open, logged in, and responsive.");
    rl.close();
    process.exit(1);
  }

  const games = matchHistory.games?.games || [];
  if (games.length === 0) {
    console.log("❌ No recent games found in your client match history.");
    rl.close();
    process.exit(0);
  }

  console.log("\nRecent Games in Client History:");
  const recentGames = games.slice(0, 5);
  recentGames.forEach((g, idx) => {
    const date = new Date(g.gameCreation).toLocaleString();
    const duration = `${Math.floor(g.gameDuration / 60)}m ${g.gameDuration % 60}s`;
    const queueType = g.queueId === 0 ? "Custom" : `Queue ${g.queueId}`;
    console.log(`[${idx + 1}] ID: ${g.gameId} | Mode: ${queueType} | Duration: ${duration} | Created: ${date}`);
  });

  const choiceStr = await question("\nSelect a game to import (1-5) [default: 1]: ");
  const choice = parseInt(choiceStr.trim()) || 1;
  if (choice < 1 || choice > recentGames.length) {
    console.error("❌ Invalid selection.");
    rl.close();
    process.exit(1);
  }

  const selectedGameSummary = recentGames[choice - 1];
  const gameId = selectedGameSummary.gameId;

  console.log(`\nFetching detailed statistics for Game ID ${gameId}...`);
  let lcuData;
  try {
    const gameRes = await fetch(`${baseUrl}/lol-match-history/v1/games/${gameId}`, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    });

    if (!gameRes.ok) {
      throw new Error(`LCU returned status ${gameRes.status}`);
    }

    lcuData = await gameRes.json();
  } catch (err) {
    console.error("❌ Failed to retrieve detailed stats from LCU:", err.message);
    rl.close();
    process.exit(1);
  }

  console.log("\n✅ Game details loaded successfully!");
  console.log(`Game Duration: ${Math.floor(lcuData.gameDuration / 60)}m ${lcuData.gameDuration % 60}s`);
  console.log("Game Participants:");

  lcuData.participants.forEach(p => {
    const identity = lcuData.participantIdentities.find(ident => ident.participantId === p.participantId);
    const name = identity?.player?.summonerName || identity?.player?.riotIdGameName || `Player ${p.participantId}`;
    const team = p.teamId === 100 ? "Blue (Team A)" : "Red (Team B)";
    const result = p.stats.win ? "WIN" : "LOSS";
    console.log(`  - [${team}] ${name} - Champ ID ${p.championId} - KDA ${p.stats.kills}/${p.stats.deaths}/${p.stats.assists} (${result})`);
  });

  console.log("\n=========================================");
  console.log("Target Tournament Connection Settings");
  console.log("=========================================");

  const portalUrlInput = await question("Enter Tournament Portal URL [default: http://localhost:3000]: ");
  const portalUrl = portalUrlInput.trim().replace(/\/$/, '') || "http://localhost:3000";

  const matchId = await question("Enter Target Tournament Match ID (e.g. match-semi1, match-final):\n> ");
  if (!matchId.trim()) {
    console.error("❌ Error: Tournament Match ID is required.");
    rl.close();
    process.exit(1);
  }

  const gameIndexStr = await question("Enter Game Number in the series (1 for Game 1, 2 for Game 2, etc.) [default: 1]: ");
  const gameIndex = parseInt(gameIndexStr.trim()) || 1;

  console.log(`\nSyncing Game ${gameId} to match '${matchId.trim()}' as Game ${gameIndex}...`);

  try {
    const syncRes = await fetch(`${portalUrl}/api/lcu-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        matchId: matchId.trim(),
        gameIndex: gameIndex - 1, // 0-indexed on server
        lcuData
      })
    });

    const syncData = await syncRes.json();
    if (!syncRes.ok) {
      console.error(`\n❌ Error syncing match telemetry: ${syncData.error || 'Server error'}`);
    } else {
      console.log(`\n✅ Success: Match telemetry synced successfully!`);
      console.log(`Winner detected: Team ${syncData.winnerSide === 100 ? 'Blue (Team A)' : 'Red (Team B)'}`);
      console.log(`Status: ${syncData.note}`);
    }
  } catch (err) {
    console.error("\n❌ Failed to connect to tournament portal:", err.message);
  }

  rl.close();
}

main().catch(err => {
  console.error("Fatal Error:", err);
  rl.close();
});
