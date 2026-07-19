/**
 * Parses raw text recognized by OCR from a post-game scoreboard screenshot.
 * It identifies the match duration, player champion picks, and KDA stats.
 * 
 * @param {string} rawText - The raw text extracted from the screenshot.
 * @param {object} teamA - Team A details (containing list of players).
 * @param {object} teamB - Team B details (containing list of players).
 * @param {string[]} champions - Sorted list of all champion names.
 * @returns {object} Parsed game data containing duration and player-by-player stats.
 */
export function parseOcrText(rawText, teamA, teamB, champions) {
  const text = rawText || "";
  const lines = text.split("\n");

  // 1. Duration Detection
  let duration = "";
  // Look for MM:SS or H:MM:SS format
  const durationRegex = /\b(?:[0-5]?\d:)?([0-5]?\d):([0-5]\d)\b/;
  const durationMatch = text.match(durationRegex);
  if (durationMatch) {
    duration = durationMatch[0];
  } else {
    // Look for e.g. "23m 45s" or similar
    const durationRegex2 = /\b([0-5]?\d)m\s*([0-5]\d)s\b/i;
    const durationMatch2 = text.match(durationRegex2);
    if (durationMatch2) {
      duration = `${durationMatch2[1]}:${durationMatch2[2]}`;
    }
  }

  const resultStats = {};

  const processPlayer = (player, teamId) => {
    // Identify name variations
    const nameAliases = [];
    if (player.name) nameAliases.push(player.name);
    if (player.jerseyName) nameAliases.push(player.jerseyName);
    if (player.riotId) {
      const parts = player.riotId.split("#");
      if (parts[0]) nameAliases.push(parts[0].trim());
    }

    // Clean and normalize alias array (lowercase alphanumeric, length > 1)
    const cleanAliases = Array.from(new Set(
      nameAliases
        .map(a => a.toLowerCase().replace(/[^a-z0-9]/g, ""))
        .filter(a => a.length > 1)
    ));

    // Try line-by-line first
    let matchedLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const lineLower = lines[i].toLowerCase().replace(/[^a-z0-9]/g, "");
      const isMatch = cleanAliases.some(alias => lineLower.includes(alias));
      if (isMatch) {
        matchedLineIndex = i;
        break;
      }
    }

    let searchArea = "";
    if (matchedLineIndex !== -1) {
      // Gather lines around the matched line for context (current, previous, next)
      const start = Math.max(0, matchedLineIndex - 1);
      const end = Math.min(lines.length - 1, matchedLineIndex + 1);
      searchArea = lines.slice(start, end + 1).join(" ");
    } else {
      // Fallback: search the entire text if the player's name wasn't matched on a specific line
      searchArea = text;
    }

    // A. Detect Champion
    let detectedChampion = "";
    const sortedChamps = [...champions].sort((a, b) => b.length - a.length);
    for (const champ of sortedChamps) {
      const normalizedChamp = champ.toLowerCase().replace(/[^a-z0-9]/g, "");
      const normalizedSearchArea = searchArea.toLowerCase().replace(/[^a-z0-9]/g, "");
      
      if (normalizedSearchArea.includes(normalizedChamp)) {
        detectedChampion = champ;
        break;
      }
    }

    // B. Detect KDA
    let kills = "";
    let deaths = "";
    let assists = "";

    // Regex patterns for KDA
    // 1. Standard format: K/D/A with slashes, e.g. "12/3/15" or "1/10/2"
    const kdaRegexSlashes = /\b(\d{1,2})\s*[\/\\|]\s*(\d{1,2})\s*[\/\\|]\s*(\d{1,2})\b/;
    // 2. Separate numbers: e.g. "12 3 15" with spaces (often found on scorecard when columns are read)
    const kdaRegexSpaces = /\b(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\b/;

    let kdaMatch = searchArea.match(kdaRegexSlashes);
    if (!kdaMatch) {
      kdaMatch = searchArea.match(kdaRegexSpaces);
    }

    if (kdaMatch) {
      kills = kdaMatch[1];
      deaths = kdaMatch[2];
      assists = kdaMatch[3];
    }

    resultStats[player.name] = {
      teamId,
      champion: detectedChampion || "",
      kills: kills !== "" ? parseInt(kills) : 0,
      deaths: deaths !== "" ? parseInt(deaths) : 0,
      assists: assists !== "" ? parseInt(assists) : 0
    };
  };

  const teamAPlayers = teamA?.players || [];
  const teamBPlayers = teamB?.players || [];

  teamAPlayers.forEach(p => processPlayer(p, 100));
  teamBPlayers.forEach(p => processPlayer(p, 200));

  return {
    gameDuration: duration,
    playerStats: resultStats
  };
}

/**
 * Fuzzy-matches players extracted from OCR against registered team rosters.
 * Determines team side assignments and map extracted rows to player names.
 */
export function matchPlayersToRoster(extractedPlayers, teamA, teamB) {
  if (!extractedPlayers || !Array.isArray(extractedPlayers)) {
    return { allMatched: false, matches: [], blueSideTeamId: 100, redSideTeamId: 200 };
  }

  const teamAPlayers = teamA?.players || [];
  const teamBPlayers = teamB?.players || [];

  const normalize = (str) => {
    if (!str) return "";
    return str.toLowerCase().replace(/[^a-z0-9]/g, "");
  };

  const matches = [];
  let matchedCount = 0;

  extractedPlayers.forEach((ep, idx) => {
    const normSummoner = normalize(ep.summonerName);
    let matchedPlayer = null;
    let detectedTeamId = null;

    const findInRoster = (players) => {
      // Pass 1: Match against riotId prefix (in-game name)
      for (const p of players) {
        if (p.riotId) {
          const prefix = normalize(p.riotId.split("#")[0]);
          if (prefix && (normSummoner.includes(prefix) || prefix.includes(normSummoner))) {
            return p;
          }
        }
      }
      // Pass 2: Match against jerseyName
      for (const p of players) {
        if (p.jerseyName) {
          const jName = normalize(p.jerseyName);
          if (jName && (normSummoner.includes(jName) || jName.includes(normSummoner))) {
            return p;
          }
        }
      }
      // Pass 3: Match against name (Employee ID)
      for (const p of players) {
        if (p.name) {
          const pName = normalize(p.name);
          if (pName && (normSummoner.includes(pName) || pName.includes(normSummoner))) {
            return p;
          }
        }
      }
      return null;
    };

    // Check team A
    matchedPlayer = findInRoster(teamAPlayers);
    if (matchedPlayer) {
      detectedTeamId = 100;
    } else {
      // Check team B
      matchedPlayer = findInRoster(teamBPlayers);
      if (matchedPlayer) {
        detectedTeamId = 200;
      }
    }

    if (matchedPlayer) {
      matchedCount++;
    }

    matches.push({
      extracted: ep,
      matchedPlayerName: matchedPlayer ? matchedPlayer.name : null,
      detectedTeamId,
      originalIndex: idx
    });
  });

  // Count majority matches for side assignment
  // Scoreboard is split in 2: first 5 are side A, next 5 are side B
  let side1TeamACount = 0;
  let side1TeamBCount = 0;
  let side2TeamACount = 0;
  let side2TeamBCount = 0;

  for (let i = 0; i < 10; i++) {
    const m = matches[i];
    if (m.detectedTeamId) {
      if (i < 5) {
        if (m.detectedTeamId === 100) side1TeamACount++;
        else side1TeamBCount++;
      } else {
        if (m.detectedTeamId === 100) side2TeamACount++;
        else side2TeamBCount++;
      }
    }
  }

  // Assign side colors
  let blueSideTeamId = 100; // Default Team A
  let redSideTeamId = 200;  // Default Team B

  if (side1TeamBCount + side2TeamACount > side1TeamACount + side2TeamBCount) {
    // If side 1 matches Team B players and side 2 matches Team A players
    blueSideTeamId = 200; // Team B is on blue side
    redSideTeamId = 100;  // Team A is on red side
  }

  const allMatched = matchedCount === 10;

  return {
    allMatched,
    matches,
    blueSideTeamId,
    redSideTeamId
  };
}

