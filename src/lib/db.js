import { isMockMode, database } from "./firebase";
import { ref, get, set, update, remove, onValue } from "firebase/database";

// ==========================================
// DEFAULT DATA FOR INITIALIZATION
// ==========================================

const DEFAULT_CONFIG = {
  title: "Gear Games Corporate LoL Cup 2026",
  date: "June 25 - July 5, 2026",
  venue: "Gear Games Arena & Online",
  description: "The annual corporate showdown in Summoner's Rift. Eight departments clash for gold, glory, and the corporate trophy.",
  finalized: false
};

const DEFAULT_TEAMS = {
  "team-1": {
    id: "team-1",
    name: "T1 Dynasty (IT Dept)",
    logo: "https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=150&auto=format&fit=crop&q=80",
    group: "A",
    players: [
      { name: "Faker", role: "Mid" },
      { name: "Zeus", role: "Top" },
      { name: "Oner", role: "Jungle" },
      { name: "Gumayusi", role: "ADC" },
      { name: "Keria", role: "Support" }
    ],
    stats: { played: 0, wins: 0, losses: 0, points: 0, gameWins: 0, gameLosses: 0 }
  },
  "team-2": {
    id: "team-2",
    name: "Gen.G Legends (HR Dept)",
    logo: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=150&auto=format&fit=crop&q=80",
    group: "A",
    players: [
      { name: "Chovy", role: "Mid" },
      { name: "Kiin", role: "Top" },
      { name: "Canyon", role: "Jungle" },
      { name: "Peyz", role: "ADC" },
      { name: "Lehends", role: "Support" }
    ],
    stats: { played: 0, wins: 0, losses: 0, points: 0, gameWins: 0, gameLosses: 0 }
  },
  "team-3": {
    id: "team-3",
    name: "G2 Samurai (Marketing)",
    logo: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=150&auto=format&fit=crop&q=80",
    group: "A",
    players: [
      { name: "Caps", role: "Mid" },
      { name: "BrokenBlade", role: "Top" },
      { name: "Yike", role: "Jungle" },
      { name: "Hans Sama", role: "ADC" },
      { name: "Mikyx", role: "Support" }
    ],
    stats: { played: 0, wins: 0, losses: 0, points: 0, gameWins: 0, gameLosses: 0 }
  },
  "team-4": {
    id: "team-4",
    name: "Fnatic Force (Design)",
    logo: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=150&auto=format&fit=crop&q=80",
    group: "A",
    players: [
      { name: "Humanoid", role: "Mid" },
      { name: "Oscarinin", role: "Top" },
      { name: "Razork", role: "Jungle" },
      { name: "Noah", role: "ADC" },
      { name: "Jun", role: "Support" }
    ],
    stats: { played: 0, wins: 0, losses: 0, points: 0, gameWins: 0, gameLosses: 0 }
  },
  "team-5": {
    id: "team-5",
    name: "Cloud9 Tempest (Finance)",
    logo: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=150&auto=format&fit=crop&q=80",
    group: "B",
    players: [
      { name: "Jojopyun", role: "Mid" },
      { name: "Thanatos", role: "Top" },
      { name: "Blaber", role: "Jungle" },
      { name: "Berserker", role: "ADC" },
      { name: "Vulcan", role: "Support" }
    ],
    stats: { played: 0, wins: 0, losses: 0, points: 0, gameWins: 0, gameLosses: 0 }
  },
  "team-6": {
    id: "team-6",
    name: "FlyQuest Rebels (Operations)",
    logo: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=150&auto=format&fit=crop&q=80",
    group: "B",
    players: [
      { name: "Quad", role: "Mid" },
      { name: "Bwipo", role: "Top" },
      { name: "Inspired", role: "Jungle" },
      { name: "Massu", role: "ADC" },
      { name: "Busio", role: "Support" }
    ],
    stats: { played: 0, wins: 0, losses: 0, points: 0, gameWins: 0, gameLosses: 0 }
  },
  "team-7": {
    id: "team-7",
    name: "JD Gaming (Sales Dept)",
    logo: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=150&auto=format&fit=crop&q=80",
    group: "B",
    players: [
      { name: "Yagao", role: "Mid" },
      { name: "Flandre", role: "Top" },
      { name: "Kanavi", role: "Jungle" },
      { name: "Ruler", role: "ADC" },
      { name: "Missing", role: "Support" }
    ],
    stats: { played: 0, wins: 0, losses: 0, points: 0, gameWins: 0, gameLosses: 0 }
  },
  "team-8": {
    id: "team-8",
    name: "Weibo Warriors (Legal)",
    logo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80",
    group: "B",
    players: [
      { name: "Xiaohu", role: "Mid" },
      { name: "Breathe", role: "Top" },
      { name: "Tarzan", role: "Jungle" },
      { name: "Light", role: "ADC" },
      { name: "Crisp", role: "Support" }
    ],
    stats: { played: 0, wins: 0, losses: 0, points: 0, gameWins: 0, gameLosses: 0 }
  }
};

const DEFAULT_MATCHES = {
  // Group A Matches
  "match-g1": {
    id: "match-g1",
    type: "group",
    stage: "Group Stage",
    group: "A",
    teamAId: "team-1",
    teamBId: "team-2",
    scoreA: 2,
    scoreB: 1,
    status: "completed",
    bestOf: 3,
    scheduledTime: "2026-06-25T18:00:00.000Z",
    winnerId: "team-1"
  },
  "match-g2": {
    id: "match-g2",
    type: "group",
    stage: "Group Stage",
    group: "A",
    teamAId: "team-3",
    teamBId: "team-4",
    scoreA: 2,
    scoreB: 0,
    status: "completed",
    bestOf: 3,
    scheduledTime: "2026-06-26T18:00:00.000Z",
    winnerId: "team-3"
  },
  "match-g3": {
    id: "match-g3",
    type: "group",
    stage: "Group Stage",
    group: "A",
    teamAId: "team-1",
    teamBId: "team-3",
    scoreA: 1,
    scoreB: 1,
    status: "live",
    bestOf: 3,
    scheduledTime: "2026-06-27T18:00:00.000Z",
    winnerId: null
  },
  "match-g4": {
    id: "match-g4",
    type: "group",
    stage: "Group Stage",
    group: "A",
    teamAId: "team-2",
    teamBId: "team-4",
    scoreA: 0,
    scoreB: 0,
    status: "scheduled",
    bestOf: 3,
    scheduledTime: "2026-06-28T18:00:00.000Z",
    winnerId: null
  },
  "match-g5": {
    id: "match-g5",
    type: "group",
    stage: "Group Stage",
    group: "A",
    teamAId: "team-1",
    teamBId: "team-4",
    scoreA: 0,
    scoreB: 0,
    status: "scheduled",
    bestOf: 3,
    scheduledTime: "2026-06-29T18:00:00.000Z",
    winnerId: null
  },
  "match-g6": {
    id: "match-g6",
    type: "group",
    stage: "Group Stage",
    group: "A",
    teamAId: "team-2",
    teamBId: "team-3",
    scoreA: 0,
    scoreB: 0,
    status: "scheduled",
    bestOf: 3,
    scheduledTime: "2026-06-29T20:30:00.000Z",
    winnerId: null
  },

  // Group B Matches
  "match-g7": {
    id: "match-g7",
    type: "group",
    stage: "Group Stage",
    group: "B",
    teamAId: "team-5",
    teamBId: "team-6",
    scoreA: 2,
    scoreB: 0,
    status: "completed",
    bestOf: 3,
    scheduledTime: "2026-06-25T20:30:00.000Z",
    winnerId: "team-5"
  },
  "match-g8": {
    id: "match-g8",
    type: "group",
    stage: "Group Stage",
    group: "B",
    teamAId: "team-7",
    teamBId: "team-8",
    scoreA: 1,
    scoreB: 2,
    status: "completed",
    bestOf: 3,
    scheduledTime: "2026-06-26T20:30:00.000Z",
    winnerId: "team-8"
  },
  "match-g9": {
    id: "match-g9",
    type: "group",
    stage: "Group Stage",
    group: "B",
    teamAId: "team-5",
    teamBId: "team-7",
    scoreA: 0,
    scoreB: 0,
    status: "scheduled",
    bestOf: 3,
    scheduledTime: "2026-06-27T20:30:00.000Z",
    winnerId: null
  },
  "match-g10": {
    id: "match-g10",
    type: "group",
    stage: "Group Stage",
    group: "B",
    teamAId: "team-6",
    teamBId: "team-8",
    scoreA: 0,
    scoreB: 0,
    status: "scheduled",
    bestOf: 3,
    scheduledTime: "2026-06-28T20:30:00.000Z",
    winnerId: null
  },
  "match-g11": {
    id: "match-g11",
    type: "group",
    stage: "Group Stage",
    group: "B",
    teamAId: "team-5",
    teamBId: "team-8",
    scoreA: 0,
    scoreB: 0,
    status: "scheduled",
    bestOf: 3,
    scheduledTime: "2026-06-30T18:00:00.000Z",
    winnerId: null
  },
  "match-g12": {
    id: "match-g12",
    type: "group",
    stage: "Group Stage",
    group: "B",
    teamAId: "team-6",
    teamBId: "team-7",
    scoreA: 0,
    scoreB: 0,
    status: "scheduled",
    bestOf: 3,
    scheduledTime: "2026-06-30T20:30:00.000Z",
    winnerId: null
  },

  // Knockout Stage (initialized but empty teams until group stage finishes)
  "match-semi1": {
    id: "match-semi1",
    type: "knockout",
    stage: "Semifinals",
    teamAId: null, // Top Group A
    teamBId: null, // 2nd Group B
    scoreA: 0,
    scoreB: 0,
    status: "scheduled",
    bestOf: 3,
    scheduledTime: "2026-07-02T18:00:00.000Z",
    winnerId: null,
    bracketPosition: { round: 0, matchIndex: 0 }
  },
  "match-semi2": {
    id: "match-semi2",
    type: "knockout",
    stage: "Semifinals",
    teamAId: null, // Top Group B
    teamBId: null, // 2nd Group A
    scoreA: 0,
    scoreB: 0,
    status: "scheduled",
    bestOf: 3,
    scheduledTime: "2026-07-02T20:30:00.000Z",
    winnerId: null,
    bracketPosition: { round: 0, matchIndex: 1 }
  },
  "match-third": {
    id: "match-third",
    type: "knockout",
    stage: "3rd Place Match",
    teamAId: null, // Loser Semi 1
    teamBId: null, // Loser Semi 2
    scoreA: 0,
    scoreB: 0,
    status: "scheduled",
    bestOf: 3,
    scheduledTime: "2026-07-04T18:00:00.000Z",
    winnerId: null,
    bracketPosition: { round: 1, matchIndex: 1 }
  },
  "match-final": {
    id: "match-final",
    type: "knockout",
    stage: "Grand Final",
    teamAId: null, // Winner Semi 1
    teamBId: null, // Winner Semi 2
    scoreA: 0,
    scoreB: 0,
    status: "scheduled",
    bestOf: 5,
    scheduledTime: "2026-07-05T18:00:00.000Z",
    winnerId: null,
    bracketPosition: { round: 1, matchIndex: 0 }
  }
};

const DEFAULT_BRACKET = {
  size: 4,
  rounds: [
    {
      name: "Semifinals",
      matches: ["match-semi1", "match-semi2"]
    },
    {
      name: "Finals",
      matches: ["match-final", "match-third"] // Grand Final is index 0, 3rd place is index 1
    }
  ]
};

// ==========================================
// STORAGE MANAGEMENT (LOCAL STORAGE MOCK)
// ==========================================

const subscribers = {
  config: [],
  teams: [],
  matches: [],
  bracket: [],
  matchDetails: []
};

function getMockStorage(key, defaultValue) {
  if (typeof window === "undefined") return defaultValue;
  const val = localStorage.getItem(`lol_tourney_${key}`);
  if (!val) {
    localStorage.setItem(`lol_tourney_${key}`, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(val);
  } catch (e) {
    return defaultValue;
  }
}

function setMockStorage(key, value) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`lol_tourney_${key}`, JSON.stringify(value));
  // Notify local subscribers
  if (subscribers[key]) {
    subscribers[key].forEach(callback => callback(value));
  }
}

// Initialise Local Storage defaults if not present
if (typeof window !== "undefined") {
  getMockStorage("config", DEFAULT_CONFIG);
  getMockStorage("teams", DEFAULT_TEAMS);
  getMockStorage("matches", DEFAULT_MATCHES);
  getMockStorage("bracket", DEFAULT_BRACKET);
  getMockStorage("matchDetails", {});
}

// ==========================================
// UNIFIED DATABASE ACTIONS
// ==========================================

// Realtime subscriptions
export function subscribeToData(key, callback) {
  if (isMockMode) {
    // Return initial value
    const data = getMockStorage(key, key === "config" ? DEFAULT_CONFIG : key === "teams" ? DEFAULT_TEAMS : key === "matches" ? DEFAULT_MATCHES : key === "bracket" ? DEFAULT_BRACKET : {});
    callback(data);
    
    // Register subscription
    subscribers[key].push(callback);
    
    // Return unsubscribe function
    return () => {
      subscribers[key] = subscribers[key].filter(cb => cb !== callback);
    };
  } else {
    const dbRef = ref(database, key);
    return onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      callback(data || {});
    }, (error) => {
      console.error(`Firebase subscription error for ${key}:`, error);
    });
  }
}

// Single fetch (Promise-based)
export async function fetchData(key) {
  if (isMockMode) {
    return getMockStorage(key, key === "config" ? DEFAULT_CONFIG : key === "teams" ? DEFAULT_TEAMS : key === "matches" ? DEFAULT_MATCHES : key === "bracket" ? DEFAULT_BRACKET : {});
  } else {
    try {
      const dbRef = ref(database, key);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return key === "config" ? DEFAULT_CONFIG : key === "teams" ? DEFAULT_TEAMS : key === "matches" ? DEFAULT_MATCHES : key === "bracket" ? DEFAULT_BRACKET : {};
    } catch (e) {
      console.error(`Firebase fetch error for ${key}:`, e);
      return key === "config" ? DEFAULT_CONFIG : key === "teams" ? DEFAULT_TEAMS : key === "matches" ? DEFAULT_MATCHES : key === "bracket" ? DEFAULT_BRACKET : {};
    }
  }
}

// Save functions
export async function saveConfig(newConfig) {
  if (isMockMode) {
    setMockStorage("config", newConfig);
    return newConfig;
  } else {
    const dbRef = ref(database, "config");
    await set(dbRef, newConfig);
    return newConfig;
  }
}

export async function saveTeam(team) {
  if (isMockMode) {
    const teams = getMockStorage("teams", DEFAULT_TEAMS);
    teams[team.id] = team;
    setMockStorage("teams", teams);
    await recalculateLeaderboard();
    return team;
  } else {
    const dbRef = ref(database, `teams/${team.id}`);
    await set(dbRef, team);
    await recalculateLeaderboard();
    return team;
  }
}

export async function deleteTeam(teamId) {
  if (isMockMode) {
    const teams = getMockStorage("teams", DEFAULT_TEAMS);
    delete teams[teamId];
    setMockStorage("teams", teams);
    await recalculateLeaderboard();
    return teamId;
  } else {
    const dbRef = ref(database, `teams/${teamId}`);
    await remove(dbRef);
    await recalculateLeaderboard();
    return teamId;
  }
}

export async function saveMatch(match) {
  if (isMockMode) {
    const matches = getMockStorage("matches", DEFAULT_MATCHES);
    matches[match.id] = match;
    setMockStorage("matches", matches);
    await recalculateLeaderboard();
    return match;
  } else {
    const dbRef = ref(database, `matches/${match.id}`);
    await set(dbRef, match);
    await recalculateLeaderboard();
    return match;
  }
}

export async function deleteMatch(matchId) {
  if (isMockMode) {
    const matches = getMockStorage("matches", DEFAULT_MATCHES);
    delete matches[matchId];
    setMockStorage("matches", matches);
    await recalculateLeaderboard();
    return matchId;
  } else {
    const dbRef = ref(database, `matches/${matchId}`);
    await remove(dbRef);
    await recalculateLeaderboard();
    return matchId;
  }
}

export async function saveBracket(bracket) {
  if (isMockMode) {
    setMockStorage("bracket", bracket);
    return bracket;
  } else {
    const dbRef = ref(database, "bracket");
    await set(dbRef, bracket);
    return bracket;
  }
}

// Reset entire database to default mock structures
export async function resetToDefaultData() {
  if (isMockMode) {
    setMockStorage("config", DEFAULT_CONFIG);
    setMockStorage("teams", DEFAULT_TEAMS);
    setMockStorage("matches", DEFAULT_MATCHES);
    setMockStorage("bracket", DEFAULT_BRACKET);
    setMockStorage("matchDetails", {});
    await recalculateLeaderboard();
  } else {
    await set(ref(database, "config"), DEFAULT_CONFIG);
    await set(ref(database, "teams"), DEFAULT_TEAMS);
    await set(ref(database, "matches"), DEFAULT_MATCHES);
    await set(ref(database, "bracket"), DEFAULT_BRACKET);
    await set(ref(database, "matchDetails"), {});
    await recalculateLeaderboard();
  }
}

// ==========================================
// DYNAMIC STANDINGS CALCULATION (ROUND ROBIN)
// ==========================================

export async function recalculateLeaderboard() {
  const teams = await fetchData("teams");
  const matches = await fetchData("matches");

  // Reset team stats
  Object.keys(teams).forEach((id) => {
    teams[id].stats = {
      played: 0,
      wins: 0,
      losses: 0,
      points: 0,
      gameWins: 0,
      gameLosses: 0
    };
  });

  // Calculate stats based on COMPLETED matches
  Object.values(matches).forEach((match) => {
    if (match.type === "group" && match.status === "completed") {
      const teamA = teams[match.teamAId];
      const teamB = teams[match.teamBId];

      if (teamA && teamB) {
        teamA.stats.played += 1;
        teamB.stats.played += 1;

        teamA.stats.gameWins += match.scoreA;
        teamA.stats.gameLosses += match.scoreB;
        teamB.stats.gameWins += match.scoreB;
        teamB.stats.gameLosses += match.scoreA;

        if (match.winnerId === match.teamAId) {
          teamA.stats.wins += 1;
          teamA.stats.points += 3; // 3 points for win
          teamB.stats.losses += 1;
        } else if (match.winnerId === match.teamBId) {
          teamB.stats.wins += 1;
          teamB.stats.points += 3;
          teamA.stats.losses += 1;
        } else {
          // Tie/Draw if possible in some formats (e.g. Bo2)
          teamA.stats.points += 1;
          teamB.stats.points += 1;
        }
      }
    }
  });

  // Save the updated team data
  if (isMockMode) {
    setMockStorage("teams", teams);
  } else {
    await set(ref(database, "teams"), teams);
  }
}

// ==========================================
// MATCH DETAILS OPERATIONS
// ==========================================

export async function saveMatchDetails(matchId, details) {
  if (isMockMode) {
    const allDetails = getMockStorage("matchDetails", {});
    allDetails[matchId] = details;
    setMockStorage("matchDetails", allDetails);
    return details;
  } else {
    const dbRef = ref(database, `matchDetails/${matchId}`);
    await set(dbRef, details);
    return details;
  }
}

export async function fetchMatchDetails(matchId) {
  if (isMockMode) {
    const allDetails = getMockStorage("matchDetails", {});
    return allDetails[matchId] || null;
  } else {
    try {
      const dbRef = ref(database, `matchDetails/${matchId}`);
      const snapshot = await get(dbRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (e) {
      console.error(`Firebase fetch error for matchDetails/${matchId}:`, e);
      return null;
    }
  }
}

export function subscribeToMatchDetails(matchId, callback) {
  if (isMockMode) {
    const allDetails = getMockStorage("matchDetails", {});
    callback(allDetails[matchId] || null);

    const handler = (newAllDetails) => {
      callback(newAllDetails[matchId] || null);
    };

    subscribers.matchDetails.push(handler);
    return () => {
      subscribers.matchDetails = subscribers.matchDetails.filter(cb => cb !== handler);
    };
  } else {
    const dbRef = ref(database, `matchDetails/${matchId}`);
    return onValue(dbRef, (snapshot) => {
      callback(snapshot.val() || null);
    }, (error) => {
      console.error(`Firebase subscription error for matchDetails/${matchId}:`, error);
    });
  }
}
