"use client";

import { useState, useEffect } from "react";
import { 
  Settings, Calendar, Plus, Trash2, Edit2, Save, RotateCcw, AlertTriangle, Info, Activity 
} from "lucide-react";
import { HextechCrest, LoLMinion, CrossedSwords } from "@/components/Icons";
import { isMockMode, auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { 
  subscribeToData, saveConfig, saveTeam, deleteTeam, saveMatch, deleteMatch, resetToDefaultData, recalculateLeaderboard,
  subscribeToNews, saveNews, deleteNews
} from "@/lib/db";
import { getLatestDDragonVersion } from "@/lib/riot";

export default function Admin() {
  // Authentication State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Tournament Data State
  const [config, setConfig] = useState(null);
  const [teams, setTeams] = useState({});
  const [matches, setMatches] = useState({});
  const [news, setNews] = useState({});
  const [activeTab, setActiveTab] = useState("config");

  // Edit State
  const [editingTeam, setEditingTeam] = useState(null);
  const [editingMatch, setEditingMatch] = useState(null);
  const [scoreManagingMatch, setScoreManagingMatch] = useState(null);

  // Riot API specific state
  const [selectedMatchForCode, setSelectedMatchForCode] = useState("");
  const [codeGenerating, setCodeGenerating] = useState(false);
  const [simulatingMatchId, setSimulatingMatchId] = useState("");
  const [simulatedWinnerSide, setSimulatedWinnerSide] = useState(100);
  const [simulating, setSimulating] = useState(false);

  // Riot Match Import state
  const [selectedMatchForImport, setSelectedMatchForImport] = useState("");
  const [selectedGameToSync, setSelectedGameToSync] = useState(null);
  const [importPlayerRiotId, setImportPlayerRiotId] = useState("");
  const [importing, setImporting] = useState(false);
  const [recentMatches, setRecentMatches] = useState([]);
  const [fetchingMatches, setFetchingMatches] = useState(false);
  const [currentSyncDetails, setCurrentSyncDetails] = useState([]);
  const [fetchingSyncDetails, setFetchingSyncDetails] = useState(false);

  // Form State
  const [version, setVersion] = useState("16.13.1");

  useEffect(() => {
    getLatestDDragonVersion().then(v => setVersion(v));
  }, []);
  const [configForm, setConfigForm] = useState({ title: "", date: "", venue: "", description: "", providerId: "", tournamentId: "" });
  const [teamForm, setTeamForm] = useState({ id: "", name: "", logo: "", group: "A", players: [
    { role: "Top", name: "", riotId: "" },
    { role: "Jungle", name: "", riotId: "" },
    { role: "Mid", name: "", riotId: "" },
    { role: "ADC", name: "", riotId: "" },
    { role: "Support", name: "", riotId: "" }
  ]});
  const [matchForm, setMatchForm] = useState({ 
    id: "", type: "group", stage: "Group Stage", group: "A", 
    teamAId: "", teamBId: "", date: "", time: "", bestOf: 1,
    status: "scheduled", scoreA: 0, scoreB: 0, winnerId: ""
  });
  const [newsForm, setNewsForm] = useState({ id: "", title: "", content: "", category: "Announcement" });

  useEffect(() => {
    // Check local storage session first
    const checkSession = () => {
      const loggedIn = localStorage.getItem("lol_tourney_admin_logged_in") === "true";
      setIsLoggedIn(loggedIn);
    };
    checkSession();
  }, []);

  useEffect(() => {
    const unsubMatches = subscribeToData("matches", (data) => setMatches(data || {}));
    const unsubTeams = subscribeToData("teams", (data) => setTeams(data || {}));
    const unsubNews = subscribeToNews((data) => setNews(data || {}));
    return () => {
      unsubMatches();
      unsubTeams();
      unsubNews();
    };
  }, []);

  useEffect(() => {
    if (activeTab === "sync" && selectedMatchForImport) {
      setFetchingSyncDetails(true);
      import("@/lib/db").then(({ fetchMatchDetails }) => {
        fetchMatchDetails(selectedMatchForImport).then(details => {
          if (!details) setCurrentSyncDetails([]);
          else if (!Array.isArray(details)) setCurrentSyncDetails([details]);
          else setCurrentSyncDetails(details);
        }).finally(() => {
          setFetchingSyncDetails(false);
        });
      });
    } else {
      setCurrentSyncDetails([]);
    }
  }, [activeTab, selectedMatchForImport]);

  useEffect(() => {
    if (isLoggedIn) {
      const unsubConfig = subscribeToData("config", (data) => {
        setConfig(data);
        if (data) {
          setConfigForm({
            title: data.title || "",
            date: data.date || "",
            venue: data.venue || "",
            description: data.description || "",
            providerId: data.providerId || "",
            tournamentId: data.tournamentId || ""
          });
        }
      });
      const unsubTeams = subscribeToData("teams", setTeams);
      const unsubMatches = subscribeToData("matches", setMatches);

      return () => {
        unsubConfig();
        unsubTeams();
        unsubMatches();
      };
    }
  }, [isLoggedIn]);

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    if (isMockMode) {
      // Mock Auth check
      if (email === "admin@geargames.com" && password === "admin") {
        localStorage.setItem("lol_tourney_admin_logged_in", "true");
        setIsLoggedIn(true);
        window.dispatchEvent(new Event("admin_auth_changed"));
      } else {
        setAuthError("Invalid mock credentials. Use admin@geargames.com / admin");
      }
      setAuthLoading(false);
    } else {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        localStorage.setItem("lol_tourney_admin_logged_in", "true");
        setIsLoggedIn(true);
        window.dispatchEvent(new Event("admin_auth_changed"));
      } catch (error) {
        setAuthError(error.message || "Failed to authenticate with Firebase.");
      } finally {
        setAuthLoading(false);
      }
    }
  };

  // Config Update
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      await saveConfig(configForm);
      alert("Tournament settings updated successfully!");
    } catch (e) {
      alert("Error updating settings: " + e.message);
    }
  };

  const handleGenerateRiotCode = async (matchId) => {
    if (!matchId) return alert("Please select a match.");
    setCodeGenerating(true);
    try {
      const response = await fetch("/api/tournament-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId: config.tournamentId || "7899",
          matchId
        })
      });
      const data = await response.json();
      if (data.code) {
        const match = matches[matchId];
        match.tournamentCode = data.code;
        await saveMatch(match);
        alert(`Tournament Code generated successfully: ${data.code}`);
      } else {
        alert("Failed to generate code: " + (data.error || "Unknown error"));
      }
    } catch (e) {
      alert("Error generating code: " + e.message);
    } finally {
      setCodeGenerating(false);
    }
  };

  const handleSimulateWebhook = async (matchId, winnerSide) => {
    if (!matchId) return alert("Please select a match to simulate.");
    setSimulating(true);

    try {
      if (isMockMode) {
        // CLIENT-SIDE LOCALSTORAGE WEBHOOK PROCESSING FOR MOCK MODE
        console.log("Mock Mode: Processing simulated webhook client-side.");
        
        const match = matches[matchId];
        if (!match) throw new Error("Match not found");

        const gameIndex = (match.scoreA || 0) + (match.scoreB || 0);
        let scoreA = match.scoreA || 0;
        let scoreB = match.scoreB || 0;

        if (winnerSide === 100) {
          scoreA += 1;
        } else {
          scoreB += 1;
        }

        const targetWins = Math.ceil(match.bestOf / 2);
        let status = "live";
        let winnerId = null;

        if (scoreA >= targetWins) {
          status = "completed";
          winnerId = match.teamAId;
        } else if (scoreB >= targetWins) {
          status = "completed";
          winnerId = match.teamBId;
        }

        const updatedMatch = {
          ...match,
          scoreA,
          scoreB,
          status,
          winnerId
        };

        // Generate realistic mock matchDetails with summonerSpells and runes
        const mockDetails = {
          gameDuration: 1654,
          teams: {
            100: { winner: winnerSide === 100, bans: ["Zed", "Yasuo", "Yone"], barons: 1, dragons: 3, firstBlood: true },
            200: { winner: winnerSide === 200, bans: ["Yuumi", "Teemo", "Briar"], barons: 0, dragons: 1, firstBlood: false }
          },
          participants: [
            // Blue Team (Team A)
            { playerName: "Zeus", teamId: 100, champion: "Ornn", win: winnerSide === 100, kills: 2, deaths: 1, assists: 9, gold: 11200, cs: 210, vision: 24, damageDealt: 18400, damageTaken: 29500, healing: 1500, tripleKills: 0, quadraKills: 0, pentaKills: 0, firstBlood: false, controlWards: 2, wardsPlaced: 12, wardsKilled: 3, turretsKilled: 1, inhibitorsKilled: 0, ccDuration: 42, items: [3068, 3075, 3111, 3001, 0, 0], summonerSpells: [12, 4], runes: { keystoneId: 8437, primaryStyleId: 8400 } },
            { playerName: "Oner", teamId: 100, champion: "Sejuani", win: winnerSide === 100, kills: 1, deaths: 2, assists: 12, gold: 9800, cs: 165, vision: 32, damageDealt: 12100, damageTaken: 28400, healing: 2200, tripleKills: 0, quadraKills: 0, pentaKills: 0, firstBlood: true, controlWards: 4, wardsPlaced: 18, wardsKilled: 5, turretsKilled: 0, inhibitorsKilled: 0, ccDuration: 55, items: [3068, 3111, 3109, 0, 0, 0], summonerSpells: [11, 4], runes: { keystoneId: 8439, primaryStyleId: 8400 } },
            { playerName: "Faker", teamId: 100, champion: "Azir", win: winnerSide === 100, kills: 6, deaths: 1, assists: 7, gold: 13500, cs: 245, vision: 28, damageDealt: 29400, damageTaken: 11400, healing: 900, tripleKills: 1, quadraKills: 0, pentaKills: 0, firstBlood: false, controlWards: 3, wardsPlaced: 15, wardsKilled: 4, turretsKilled: 2, inhibitorsKilled: 1, ccDuration: 18, items: [3006, 6655, 3089, 3157, 0, 0], summonerSpells: [12, 4], runes: { keystoneId: 8021, primaryStyleId: 8000 } },
            { playerName: "Gumayusi", teamId: 100, champion: "Aphelios", win: winnerSide === 100, kills: 5, deaths: 0, assists: 5, gold: 14200, cs: 265, vision: 18, damageDealt: 27500, damageTaken: 9400, healing: 2100, tripleKills: 0, quadraKills: 0, pentaKills: 0, firstBlood: false, controlWards: 1, wardsPlaced: 10, wardsKilled: 2, turretsKilled: 2, inhibitorsKilled: 0, ccDuration: 8, items: [3006, 6672, 3031, 3046, 0, 0], summonerSpells: [7, 4], runes: { keystoneId: 8008, primaryStyleId: 8000 } },
            { playerName: "Keria", teamId: 100, champion: "Thresh", win: winnerSide === 100, kills: 1, deaths: 2, assists: 10, gold: 7500, cs: 42, vision: 65, damageDealt: 4500, damageTaken: 14200, healing: 1100, tripleKills: 0, quadraKills: 0, pentaKills: 0, firstBlood: false, controlWards: 8, wardsPlaced: 35, wardsKilled: 12, turretsKilled: 0, inhibitorsKilled: 0, ccDuration: 48, items: [3158, 3859, 3190, 0, 0, 0], summonerSpells: [14, 4], runes: { keystoneId: 8465, primaryStyleId: 8400 } },
            // Red Team (Team B)
            { playerName: "Kiin", teamId: 200, champion: "K'Sante", win: winnerSide === 200, kills: 1, deaths: 3, assists: 2, gold: 9200, cs: 195, vision: 19, damageDealt: 14100, damageTaken: 32100, healing: 3500, tripleKills: 0, quadraKills: 0, pentaKills: 0, firstBlood: false, controlWards: 1, wardsPlaced: 9, wardsKilled: 2, turretsKilled: 0, inhibitorsKilled: 0, ccDuration: 29, items: [3068, 3111, 3001, 0, 0, 0], summonerSpells: [12, 4], runes: { keystoneId: 8437, primaryStyleId: 8400 } },
            { playerName: "Canyon", teamId: 200, champion: "Maokai", win: winnerSide === 200, kills: 0, deaths: 4, assists: 4, gold: 8100, cs: 145, vision: 41, damageDealt: 8900, damageTaken: 25400, healing: 1800, tripleKills: 0, quadraKills: 0, pentaKills: 0, firstBlood: false, controlWards: 5, wardsPlaced: 22, wardsKilled: 6, turretsKilled: 0, inhibitorsKilled: 0, ccDuration: 52, items: [3068, 3111, 3109, 0, 0, 0], summonerSpells: [11, 4], runes: { keystoneId: 8010, primaryStyleId: 8000 } },
            { playerName: "Chovy", teamId: 200, champion: "Yone", win: winnerSide === 200, kills: 3, deaths: 3, assists: 1, gold: 11500, cs: 232, vision: 21, damageDealt: 19200, damageTaken: 18400, healing: 1200, tripleKills: 0, quadraKills: 0, pentaKills: 0, firstBlood: false, controlWards: 2, wardsPlaced: 11, wardsKilled: 3, turretsKilled: 1, inhibitorsKilled: 0, ccDuration: 15, items: [3006, 6672, 3031, 0, 0, 0], summonerSpells: [12, 4], runes: { keystoneId: 8010, primaryStyleId: 8000 } },
            { playerName: "Peyz", teamId: 200, champion: "Zeri", win: winnerSide === 200, kills: 2, deaths: 2, assists: 2, gold: 12100, cs: 250, vision: 15, damageDealt: 21400, damageTaken: 11200, healing: 800, tripleKills: 0, quadraKills: 0, pentaKills: 0, firstBlood: false, controlWards: 2, wardsPlaced: 8, wardsKilled: 1, turretsKilled: 0, inhibitorsKilled: 0, ccDuration: 4, items: [3006, 6672, 3046, 0, 0, 0], summonerSpells: [7, 4], runes: { keystoneId: 8008, primaryStyleId: 8000 } },
            { playerName: "Lehends", teamId: 200, champion: "Lulu", win: winnerSide === 200, kills: 0, deaths: 3, assists: 4, gold: 6800, cs: 35, vision: 54, damageDealt: 3200, damageTaken: 12500, healing: 4200, tripleKills: 0, quadraKills: 0, pentaKills: 0, firstBlood: false, controlWards: 6, wardsPlaced: 28, wardsKilled: 8, turretsKilled: 0, inhibitorsKilled: 0, ccDuration: 34, items: [3158, 3859, 3190, 0, 0, 0], summonerSpells: [14, 4], runes: { keystoneId: 8214, primaryStyleId: 8200 } }
          ]
        };

        const { fetchMatchDetails, saveMatchDetails } = await import("@/lib/db");
        let existingDetails = await fetchMatchDetails(matchId);
        if (!existingDetails) {
          existingDetails = [];
        } else if (!Array.isArray(existingDetails)) {
          existingDetails = [existingDetails];
        }
        while (existingDetails.length <= gameIndex) {
          existingDetails.push(null);
        }
        existingDetails[gameIndex] = mockDetails;

        await saveMatch(updatedMatch);
        await saveMatchDetails(matchId, existingDetails);

        // Advance knockout bracket
        if (status === "completed" && match.type === "knockout") {
          if (matchId === "match-semi1") {
            const finalMatch = matches["match-final"];
            if (finalMatch) { finalMatch.teamAId = winnerId; await saveMatch(finalMatch); }
            const thirdMatch = matches["match-third"];
            if (thirdMatch) { thirdMatch.teamAId = winnerId === match.teamAId ? match.teamBId : match.teamAId; await saveMatch(thirdMatch); }
          } else if (matchId === "match-semi2") {
            const finalMatch = matches["match-final"];
            if (finalMatch) { finalMatch.teamBId = winnerId; await saveMatch(finalMatch); }
            const thirdMatch = matches["match-third"];
            if (thirdMatch) { thirdMatch.teamBId = winnerId === match.teamAId ? match.teamBId : match.teamAId; await saveMatch(thirdMatch); }
          }
        }

        await recalculateLeaderboard();
        alert("Mock Webhook Sim completed! Match scores updated, stats saved, standings updated.");
      } else {
        // SERVER-SIDE HTTP POST IN PRODUCTION WITH FIREBASE
        const response = await fetch("/api/riot-webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isSimulation: true,
            simulatedWinnerSide: winnerSide,
            matchId: matchId,
            metaData: JSON.stringify({ match_id: matchId }),
            tournamentCode: matches[matchId]?.tournamentCode || "SIM-CODE"
          })
        });

        const data = await response.json();
        if (data.success) {
          alert(`Real Firebase Webhook simulation triggered. Winner: ${data.winner}`);
        } else {
          alert("Simulation failed: " + (data.error || "Unknown error"));
        }
      }
    } catch (e) {
      alert("Error running simulation: " + e.message);
    } finally {
      setSimulating(false);
    }
  };

  const handleFetchRecentMatches = async (playerRiotId) => {
    if (!playerRiotId || !playerRiotId.includes("#")) {
      return alert("Please enter a valid player Riot ID in the format Name#Tag.");
    }
    
    setFetchingMatches(true);
    setRecentMatches([]);
    try {
      const response = await fetch("/api/riot-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerRiotId })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch matches");
      }
      
      setRecentMatches(data.matches);
    } catch (e) {
      alert("Error fetching recent matches: " + e.message);
    } finally {
      setFetchingMatches(false);
    }
  };

  const handleImportRiotMatch = async (matchId, riotMatchId, gameIndex) => {
    if (!matchId) return alert("Please select a match to sync.");
    if (!riotMatchId) return alert("Please select a Riot game to sync.");
    if (gameIndex === undefined || gameIndex === null) return alert("Please select which Game (1, 2, 3...) to sync to.");
    
    setImporting(true);
    try {
      const response = await fetch("/api/riot-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riotMatchId })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch match details");
      }
      
      console.log("Writing imported game details to database.");
      const match = matches[matchId];
      if (!match) throw new Error("Match not found in local state");
      
      let scoreA = match.scoreA || 0;
      let scoreB = match.scoreB || 0;
      
      if (data.winnerSide === 100) {
        scoreA += 1;
      } else {
        scoreB += 1;
      }
      
      const targetWins = Math.ceil(match.bestOf / 2);
      let status = "live";
      let winnerId = null;
      
      if (scoreA >= targetWins) {
        status = "completed";
        winnerId = match.teamAId;
      } else if (scoreB >= targetWins) {
        status = "completed";
        winnerId = match.teamBId;
      }
      
      const updatedMatch = {
        ...match,
        scoreA,
        scoreB,
        status,
        winnerId
      };
      
      const { fetchMatchDetails, saveMatchDetails } = await import("@/lib/db");
      await saveMatch(updatedMatch);
      
      let existingDetails = await fetchMatchDetails(matchId);
      if (!existingDetails) {
        existingDetails = [];
      } else if (!Array.isArray(existingDetails)) {
        existingDetails = [existingDetails];
      }
      // Fill array if it's smaller than gameIndex
      while (existingDetails.length <= gameIndex) {
        existingDetails.push(null);
      }
      existingDetails[gameIndex] = data.matchDetails;
      
      await saveMatchDetails(matchId, existingDetails);
      setCurrentSyncDetails(existingDetails);
      
      if (status === "completed" && match.type === "knockout") {
        if (matchId === "match-semi1") {
          const finalMatch = matches["match-final"];
          if (finalMatch) { finalMatch.teamAId = winnerId; await saveMatch(finalMatch); }
          const thirdMatch = matches["match-third"];
          if (thirdMatch) { thirdMatch.teamAId = winnerId === match.teamAId ? match.teamBId : match.teamAId; await saveMatch(thirdMatch); }
        } else if (matchId === "match-semi2") {
          const finalMatch = matches["match-final"];
          if (finalMatch) { finalMatch.teamBId = winnerId; await saveMatch(finalMatch); }
          const thirdMatch = matches["match-third"];
          if (thirdMatch) { thirdMatch.teamBId = winnerId === match.teamAId ? match.teamBId : match.teamAId; await saveMatch(thirdMatch); }
        }
      }
      
      const { recalculateLeaderboard } = await import("@/lib/db");
      await recalculateLeaderboard();
      alert(`Successfully imported match! Winner of this game: ${data.winnerSide === 100 ? "Blue Side" : "Red Side"}. Database and stats updated.`);
      
      setImportPlayerRiotId("");
      setSelectedGameToSync(null);
      setRecentMatches([]);
    } catch (e) {
      alert("Error importing game details: " + e.message);
    } finally {
      setImporting(false);
    }
  };

  // Team Create / Update
  const handleSaveTeam = async (e) => {
    e.preventDefault();
    if (!teamForm.name) return alert("Team name is required.");

    const id = teamForm.id || "team-" + Date.now();
    const teamData = { ...teamForm, id };

    try {
      await saveTeam(teamData);
      setTeamForm({ id: "", name: "", logo: "", group: "A", players: [
        { role: "Top", name: "", riotId: "" },
        { role: "Jungle", name: "", riotId: "" },
        { role: "Mid", name: "", riotId: "" },
        { role: "ADC", name: "", riotId: "" },
        { role: "Support", name: "", riotId: "" }
      ]});
      setEditingTeam(null);
      alert("Team saved successfully!");
    } catch (err) {
      alert("Error saving team: " + err.message);
    }
  };

  const handleEditTeam = (team) => {
    setEditingTeam(team.id);
    setTeamForm(JSON.parse(JSON.stringify(team))); // deep clone
    setActiveTab("teams");
  };

  const handleDeleteTeam = async (teamId) => {
    if (confirm("Are you sure you want to delete this team? This might affect standings.")) {
      try {
        await deleteTeam(teamId);
        alert("Team deleted successfully!");
      } catch (err) {
        alert("Error deleting team: " + err.message);
      }
    }
  };

  // Match Create / Update
  const handleSaveMatch = async (e) => {
    e.preventDefault();
    if (!matchForm.teamAId || !matchForm.teamBId) return alert("Both teams must be specified.");
    if (matchForm.teamAId === matchForm.teamBId) return alert("Teams cannot play against themselves.");

    const id = matchForm.id || "match-" + Date.now();
    const matchData = { ...matchForm, id };

    try {
      await saveMatch(matchData);
      setMatchForm({ 
        id: "", type: "group", stage: "Group Stage", group: "A", 
        teamAId: "", teamBId: "", scoreA: 0, scoreB: 0, 
        status: "scheduled", bestOf: 3, scheduledTime: "" 
      });
      setEditingMatch(null);
      alert("Match scheduled successfully!");
    } catch (err) {
      alert("Error scheduling match: " + err.message);
    }
  };

  const handleEditMatch = (match) => {
    setEditingMatch(match.id);
    setMatchForm(JSON.parse(JSON.stringify(match)));
    setActiveTab("matches");
  };

  const handleDeleteMatch = async (matchId) => {
    if (confirm("Are you sure you want to delete this match?")) {
      try {
        await deleteMatch(matchId);
        alert("Match deleted successfully!");
      } catch (err) {
        alert("Error deleting match: " + err.message);
      }
    }
  };

  // News Handlers
  const handleSaveNews = () => {
    if (!newsForm.title || !newsForm.content) return alert("Title and content are required");
    const newsItem = {
      ...newsForm,
      id: newsForm.id || `news-${Date.now()}`,
      timestamp: newsForm.id ? news[newsForm.id].timestamp : Date.now()
    };
    saveNews(newsItem);
    setNewsForm({ id: "", title: "", content: "", category: "Announcement" });
  };

  const handleEditNews = (item) => {
    setNewsForm(item);
    window.scrollTo(0, 0);
  };

  const handleDeleteNews = (id) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      deleteNews(id);
    }
  };

  // Live Score Update & Bracket Advancement
  const handleUpdateMatchScore = async (e) => {
    e.preventDefault();
    if (!scoreManagingMatch) return;

    const match = scoreManagingMatch;
    
    // Auto-winner setting if completed
    let winnerId = null;
    if (match.status === "completed") {
      if (match.scoreA > match.scoreB) {
        winnerId = match.teamAId;
      } else if (match.scoreB > match.scoreA) {
        winnerId = match.teamBId;
      } else {
        return alert("Completed matches must have a clear winner (Bo1/3/5 cannot tie).");
      }
    }

    const updatedMatch = {
      ...match,
      winnerId
    };

    try {
      await saveMatch(updatedMatch);

      // AUTOMATED KNOCKOUT ADVANCEMENT LOGIC
      if (match.status === "completed" && match.type === "knockout") {
        const updatedMatches = { ...matches, [match.id]: updatedMatch };
        
        if (match.id === "match-semi1") {
          const finalMatch = matches["match-final"];
          const thirdMatch = matches["match-third"];
          
          if (finalMatch) {
            finalMatch.teamAId = winnerId;
            await saveMatch(finalMatch);
          }
          if (thirdMatch) {
            thirdMatch.teamAId = winnerId === match.teamAId ? match.teamBId : match.teamAId;
            await saveMatch(thirdMatch);
          }
        } else if (match.id === "match-semi2") {
          const finalMatch = matches["match-final"];
          const thirdMatch = matches["match-third"];
          
          if (finalMatch) {
            finalMatch.teamBId = winnerId;
            await saveMatch(finalMatch);
          }
          if (thirdMatch) {
            thirdMatch.teamBId = winnerId === match.teamAId ? match.teamBId : match.teamAId;
            await saveMatch(thirdMatch);
          }
        }
      }

      setScoreManagingMatch(null);
      alert("Match score and status updated successfully!");
    } catch (err) {
      alert("Error saving scores: " + err.message);
    }
  };

  const handleResetDatabase = async () => {
    if (confirm("WARNING: This will overwrite ALL current teams, matches, and configurations with the default mock tournament data. Proceed?")) {
      try {
        await resetToDefaultData();
        alert("Database successfully reset to defaults!");
      } catch (err) {
        alert("Error resetting database: " + err.message);
      }
    }
  };

  // Login Form Gate
  if (!isLoggedIn) {
    return (
      <div className="container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div className="card" style={{ width: "100%", maxWidth: "400px", padding: "2.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <HextechCrest size={48} style={{ color: "var(--primary-gold)", margin: "0 auto 1rem auto" }} />
            <h2 style={{ textTransform: "uppercase" }}>Admin Panel Login</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
              Authenticate to manage teams, schedule matches, and post live score adjustments.
            </p>
          </div>

          {isMockMode && (
            <div style={{ backgroundColor: "rgba(228,179,60,0.05)", border: "1px solid var(--border-gold)", borderRadius: "4px", padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--primary-gold-bright)", marginBottom: "1.5rem", display: "flex", gap: "0.5rem" }}>
              <Info size={16} style={{ flexShrink: 0 }} />
              <div>
                <strong>Mock Mode Active:</strong> Use the login below:<br />
                Email: <code>admin@geargames.com</code><br />
                Password: <code>admin</code>
              </div>
            </div>
          )}

          {authError && (
            <div style={{ backgroundColor: "rgba(220,53,69,0.1)", border: "1px solid var(--color-danger)", borderRadius: "4px", padding: "0.75rem 1rem", color: "var(--color-danger)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                className="form-control" 
                placeholder="email@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: "2rem" }}>
              <label>Password</label>
              <input 
                type="password" 
                className="form-control" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={authLoading}>
              {authLoading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="admin-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-dark)", paddingBottom: "1rem" }}>
        <div>
          <span className="hero-badge">Coordinator Access</span>
          <h1 style={{ fontSize: "2rem", textTransform: "uppercase" }}>Tournament Control Panel</h1>
        </div>
        <button onClick={handleResetDatabase} className="btn btn-outline" style={{ display: "flex", gap: "0.5rem", color: "var(--color-danger)", borderColor: "rgba(220,53,69,0.3)" }}>
          <RotateCcw size={16} /> Reset Default Data
        </button>
      </div>

      <div className="admin-grid">
        {/* Navigation Sidebar */}
        <aside className="admin-sidebar">
          <button 
            onClick={() => { setActiveTab("config"); setScoreManagingMatch(null); }}
            className={`admin-nav-item ${activeTab === "config" ? "active" : ""}`}
          >
            <Settings size={18} /> Config Settings
          </button>
          <button 
            onClick={() => { setActiveTab("teams"); setScoreManagingMatch(null); }}
            className={`admin-nav-item ${activeTab === "teams" ? "active" : ""}`}
          >
            <LoLMinion size={18} /> Manage Teams ({Object.keys(teams).length})
          </button>
          <button 
            onClick={() => { setActiveTab("matches"); setScoreManagingMatch(null); }}
            className={`admin-nav-item ${activeTab === "matches" ? "active" : ""}`}
          >
            <Calendar size={18} /> Match Scheduler ({Object.keys(matches).length})
          </button>
          <button 
            onClick={() => { setActiveTab("scores"); setScoreManagingMatch(null); }}
            className={`admin-nav-item ${activeTab === "scores" ? "active" : ""}`}
          >
            <CrossedSwords size={18} /> Live Score Center
          </button>
          <button 
            onClick={() => { setActiveTab("sync"); setScoreManagingMatch(null); }}
            className={`admin-nav-item ${activeTab === "sync" ? "active" : ""}`}
          >
            <Activity size={18} /> Score Center
          </button>
          <button 
            onClick={() => { setActiveTab("riot"); setScoreManagingMatch(null); }}
            className={`admin-nav-item ${activeTab === "riot" ? "active" : ""}`}
          >
            <HextechCrest size={18} /> Riot Tournament API
          </button>
          <button 
            onClick={() => { setActiveTab("news"); setScoreManagingMatch(null); }}
            className={`admin-nav-item ${activeTab === "news" ? "active" : ""}`}
          >
            <Info size={18} /> News & Announcements
          </button>
        </aside>

        {/* Content Pane */}
        <section className="admin-content">
          
          {/* TAB 1: TOURNAMENT CONFIGURATION */}
          {activeTab === "config" && config && (
            <div>
              <h2 style={{ textTransform: "uppercase", fontSize: "1.25rem", marginBottom: "1.5rem" }}>General Settings</h2>
              <form onSubmit={handleSaveConfig}>
                <div className="form-group">
                  <label>Tournament Title</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={configForm.title}
                    onChange={(e) => setConfigForm({ ...configForm, title: e.target.value })}
                    required
                  />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Tournament Dates</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={configForm.date}
                      onChange={(e) => setConfigForm({ ...configForm, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Venue / Location</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={configForm.venue}
                      onChange={(e) => setConfigForm({ ...configForm, venue: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: "2rem" }}>
                  <label>Description</label>
                  <textarea 
                    rows={4}
                    className="form-control" 
                    value={configForm.description}
                    onChange={(e) => setConfigForm({ ...configForm, description: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> Save Settings
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: TEAMS MANAGER */}
          {activeTab === "teams" && (
            <div>
              <h2 style={{ textTransform: "uppercase", fontSize: "1.25rem", marginBottom: "1.5rem" }}>
                {editingTeam ? "Edit Team Roster" : "Register New Team"}
              </h2>
              
              <form onSubmit={handleSaveTeam} style={{ marginBottom: "3rem", borderBottom: "1px solid var(--border-dark)", paddingBottom: "3rem" }}>
                <div className="grid-3">
                  <div className="form-group">
                    <label>Team Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. IT Department"
                      value={teamForm.name}
                      onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Logo Image URL</label>
                    <input 
                      type="url" 
                      className="form-control" 
                      placeholder="https://example.com/logo.png"
                      value={teamForm.logo}
                      onChange={(e) => setTeamForm({ ...teamForm, logo: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Group Stage Pool</label>
                    <select 
                      className="form-control"
                      value={teamForm.group}
                      onChange={(e) => setTeamForm({ ...teamForm, group: e.target.value })}
                    >
                      <option value="A">Group A</option>
                      <option value="B">Group B</option>
                    </select>
                  </div>
                </div>

                <h3 style={{ textTransform: "uppercase", fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1rem", marginTop: "1rem" }}>
                  Roster Lineup (5 Players)
                </h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {teamForm.players.map((player, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                      <span style={{ fontSize: "0.85rem", width: "80px", color: "var(--primary-gold)" }}>{player.role}:</span>
                      <div style={{ display: "flex", gap: "1rem", flex: 1 }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Player Name"
                          value={player.name}
                          onChange={(e) => {
                            const players = [...teamForm.players];
                            players[idx].name = e.target.value;
                            setTeamForm({ ...teamForm, players });
                          }}
                          required
                        />
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Riot ID (e.g. Faker#KR1)"
                          value={player.riotId || ""}
                          onChange={(e) => {
                            const players = [...teamForm.players];
                            players[idx].riotId = e.target.value;
                            setTeamForm({ ...teamForm, players });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                  <button type="submit" className="btn btn-primary">
                    <Save size={16} /> {editingTeam ? "Update Team" : "Register Team"}
                  </button>
                  {editingTeam && (
                    <button 
                      type="button" 
                      className="btn btn-outline"
                      onClick={() => {
                        setEditingTeam(null);
                        setTeamForm({ id: "", name: "", logo: "", group: "A", players: [
                          { role: "Top", name: "", riotId: "" },
                          { role: "Jungle", name: "", riotId: "" },
                          { role: "Mid", name: "", riotId: "" },
                          { role: "ADC", name: "", riotId: "" },
                          { role: "Support", name: "", riotId: "" }
                        ]});
                      }}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>

              <h2 style={{ textTransform: "uppercase", fontSize: "1.25rem", marginBottom: "1.5rem" }}>Registered Teams</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {Object.values(teams).map((team) => (
                  <div key={team.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--bg-tertiary)", padding: "1rem 1.5rem", borderRadius: "4px", border: "1px solid var(--border-dark)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <img src={team.logo || "https://placehold.co/50x50"} alt={team.name} style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} />
                      <div>
                        <strong style={{ color: "var(--text-primary)" }}>{team.name}</strong>
                        <span className="hero-badge" style={{ margin: "0 0 0 0.5rem", fontSize: "0.6rem", padding: "0.1rem 0.4rem" }}>Group {team.group}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => handleEditTeam(team)} className="btn btn-outline" style={{ padding: "0.4rem 0.75rem" }}><Edit2 size={14} /></button>
                      <button onClick={() => handleDeleteTeam(team.id)} className="btn btn-outline" style={{ padding: "0.4rem 0.75rem", color: "var(--color-danger)" }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: MATCH SCHEDULER */}
          {activeTab === "matches" && (
            <div>
              <h2 style={{ textTransform: "uppercase", fontSize: "1.25rem", marginBottom: "1.5rem" }}>
                {editingMatch ? "Modify Match Schedule" : "Schedule New Match"}
              </h2>

              <form onSubmit={handleSaveMatch} style={{ marginBottom: "3rem", borderBottom: "1px solid var(--border-dark)", paddingBottom: "3rem" }}>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Team A (Home)</label>
                    <select
                      className="form-control"
                      value={matchForm.teamAId}
                      onChange={(e) => setMatchForm({ ...matchForm, teamAId: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Team A --</option>
                      {Object.values(teams).map((team) => (
                        <option key={team.id} value={team.id}>{team.name} (Group {team.group})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Team B (Away)</label>
                    <select
                      className="form-control"
                      value={matchForm.teamBId}
                      onChange={(e) => setMatchForm({ ...matchForm, teamBId: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Team B --</option>
                      {Object.values(teams).map((team) => (
                        <option key={team.id} value={team.id}>{team.name} (Group {team.group})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid-4">
                  <div className="form-group">
                    <label>Match Type</label>
                    <select
                      className="form-control"
                      value={matchForm.type}
                      onChange={(e) => setMatchForm({ ...matchForm, type: e.target.value })}
                    >
                      <option value="group">Group Stage</option>
                      <option value="knockout">Knockout Stage</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Stage Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Semifinals"
                      value={matchForm.stage}
                      onChange={(e) => setMatchForm({ ...matchForm, stage: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Best Of series</label>
                    <select
                      className="form-control"
                      value={matchForm.bestOf}
                      onChange={(e) => setMatchForm({ ...matchForm, bestOf: parseInt(e.target.value) })}
                    >
                      <option value={1}>Bo1</option>
                      <option value={3}>Bo3</option>
                      <option value={5}>Bo5</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Group (if applicable)</label>
                    <select
                      className="form-control"
                      value={matchForm.group || ""}
                      onChange={(e) => setMatchForm({ ...matchForm, group: e.target.value || null })}
                    >
                      <option value="">None</option>
                      <option value="A">Group A</option>
                      <option value="B">Group B</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: "2rem" }}>
                  <label>Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={matchForm.scheduledTime ? matchForm.scheduledTime.substring(0, 16) : ""}
                    onChange={(e) => setMatchForm({ ...matchForm, scheduledTime: new Date(e.target.value).toISOString() })}
                    required
                  />
                </div>

                <div style={{ display: "flex", gap: "1rem" }}>
                  <button type="submit" className="btn btn-primary">
                    <Save size={16} /> {editingMatch ? "Update Match" : "Schedule Match"}
                  </button>
                  {editingMatch && (
                    <button 
                      type="button" 
                      className="btn btn-outline"
                      onClick={() => {
                        setEditingMatch(null);
                        setMatchForm({ 
                          id: "", type: "group", stage: "Group Stage", group: "A", 
                          teamAId: "", teamBId: "", scoreA: 0, scoreB: 0, 
                          status: "scheduled", bestOf: 3, scheduledTime: "" 
                        });
                      }}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>

              <h2 style={{ textTransform: "uppercase", fontSize: "1.25rem", marginBottom: "1.5rem" }}>Scheduled Matches</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {Object.values(matches).sort((a,b) => new Date(a.scheduledTime) - new Date(b.scheduledTime)).map((match) => (
                  <div key={match.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--bg-tertiary)", padding: "1rem 1.5rem", borderRadius: "4px", border: "1px solid var(--border-dark)" }}>
                    <div>
                      <strong style={{ color: "var(--text-primary)" }}>
                        {teams[match.teamAId]?.name || "TBD"} vs {teams[match.teamBId]?.name || "TBD"}
                      </strong>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                        {match.stage} &bull; {new Date(match.scheduledTime).toLocaleString()} &bull; Bo{match.bestOf}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => handleEditMatch(match)} className="btn btn-outline" style={{ padding: "0.4rem 0.75rem" }}><Edit2 size={14} /></button>
                      <button onClick={() => handleDeleteMatch(match.id)} className="btn btn-outline" style={{ padding: "0.4rem 0.75rem", color: "var(--color-danger)" }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: LIVE SCORE CENTER */}
          {activeTab === "scores" && (
            <div>
              <h2 style={{ textTransform: "uppercase", fontSize: "1.25rem", marginBottom: "1.5rem" }}>Match List & Results Control</h2>
              
              {!scoreManagingMatch ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {Object.values(matches).sort((a,b) => new Date(b.scheduledTime) - new Date(a.scheduledTime)).map((match) => {
                    const teamA = teams[match.teamAId];
                    const teamB = teams[match.teamBId];
                    return (
                      <div key={match.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--bg-tertiary)", padding: "1.25rem 1.5rem", borderRadius: "4px", border: "1px solid var(--border-dark)" }}>
                        <div>
                          <span className={`match-status-badge ${match.status}`} style={{ display: "inline-block", marginBottom: "0.5rem" }}>
                            {match.status}
                          </span>
                          <strong style={{ display: "block", color: "var(--text-primary)", fontSize: "1.1rem" }}>
                            {teamA?.name || "TBD"} ({match.scoreA}) vs ({match.scoreB}) {teamB?.name || "TBD"}
                          </strong>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{match.stage} &bull; Bo{match.bestOf}</span>
                        </div>
                        <button 
                          onClick={() => setScoreManagingMatch(JSON.parse(JSON.stringify(match)))}
                          className="btn btn-secondary"
                          style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}
                        >
                          Manage Scores
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="card card-gold" style={{ padding: "2rem" }}>
                  <h3 style={{ textTransform: "uppercase", fontSize: "1.1rem", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.75rem", marginBottom: "1.5rem" }}>
                    Manage Score &bull; {scoreManagingMatch.stage}
                  </h3>
                  
                  <form onSubmit={handleUpdateMatchScore}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                      {/* Team A */}
                      <div style={{ width: "40%", textAlign: "right" }}>
                        <h4 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>{teams[scoreManagingMatch.teamAId]?.name || "TBD"}</h4>
                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.5rem" }}>
                          <button 
                            type="button" 
                            className="btn btn-outline" 
                            style={{ padding: "0.3rem 0.6rem" }}
                            onClick={() => setScoreManagingMatch({ ...scoreManagingMatch, scoreA: Math.max(0, scoreManagingMatch.scoreA - 1) })}
                          >-</button>
                          <span style={{ fontSize: "2rem", fontWeight: "800", minWidth: "50px", textAlign: "center", color: "var(--text-primary)" }}>{scoreManagingMatch.scoreA}</span>
                          <button 
                            type="button" 
                            className="btn btn-outline" 
                            style={{ padding: "0.3rem 0.6rem" }}
                            onClick={() => setScoreManagingMatch({ ...scoreManagingMatch, scoreA: scoreManagingMatch.scoreA + 1 })}
                          >+</button>
                        </div>
                      </div>

                      <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--text-muted)" }}>VS</div>

                      {/* Team B */}
                      <div style={{ width: "40%", textAlign: "left" }}>
                        <h4 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>{teams[scoreManagingMatch.teamBId]?.name || "TBD"}</h4>
                        <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "0.5rem" }}>
                          <button 
                            type="button" 
                            className="btn btn-outline" 
                            style={{ padding: "0.3rem 0.6rem" }}
                            onClick={() => setScoreManagingMatch({ ...scoreManagingMatch, scoreB: Math.max(0, scoreManagingMatch.scoreB - 1) })}
                          >-</button>
                          <span style={{ fontSize: "2rem", fontWeight: "800", minWidth: "50px", textAlign: "center", color: "var(--text-primary)" }}>{scoreManagingMatch.scoreB}</span>
                          <button 
                            type="button" 
                            className="btn btn-outline" 
                            style={{ padding: "0.3rem 0.6rem" }}
                            onClick={() => setScoreManagingMatch({ ...scoreManagingMatch, scoreB: scoreManagingMatch.scoreB + 1 })}
                          >+</button>
                        </div>
                      </div>
                    </div>

                    <div className="grid-2" style={{ marginBottom: "2rem" }}>
                      <div className="form-group">
                        <label>Match Status</label>
                        <select
                          className="form-control"
                          value={scoreManagingMatch.status}
                          onChange={(e) => setScoreManagingMatch({ ...scoreManagingMatch, status: e.target.value })}
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="live">Live</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ display: "flex", alignItems: "flex-end" }}>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.5" }}>
                          <AlertTriangle size={14} style={{ display: "inline-block", color: "var(--primary-gold)", marginRight: "0.25rem", verticalAlign: "middle" }} />
                          Setting status to <strong>Completed</strong> will declare a winner and automatically recalculate group stage leaderboard points or advance playoff brackets.
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "1rem" }}>
                      <button type="submit" className="btn btn-primary">
                        <Save size={16} /> Save Score Updates
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline"
                        onClick={() => setScoreManagingMatch(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SCORE CENTER (MATCH SYNC) */}
          {activeTab === "sync" && (
            <div>
              <h2 style={{ textTransform: "uppercase", fontSize: "1.25rem", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.75rem", marginBottom: "1.5rem" }}>
                Score Center
              </h2>
              <div className="card" style={{ marginBottom: "3rem", border: "1px solid var(--border-dark)" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", backgroundColor: "rgba(228,179,60,0.05)", border: "1px solid var(--border-gold)", borderRadius: "4px", padding: "1rem", marginBottom: "1.5rem", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                  <Info size={18} style={{ color: "var(--primary-gold)", flexShrink: 0, marginTop: "0.1rem" }} />
                  <div>
                    <strong>Custom Game Result Tracking:</strong><br />
                    Since custom games are not available on public Riot APIs, do one of the following to update scores and stats:<br />
                    • <strong>LCU Match Exporter (Auto-Sync Stats):</strong> Run the local exporter script in your project root using command <code>npm run import-lcu</code> on any machine running the League client that participated in the custom lobby. This reads the client's local match history and uploads detailed post-game stats.<br />
                    • <strong>Score Center Search:</strong> If you are not using custom games (e.g. normals/ranked) and have a public Riot API Key, you can search via a player's Riot ID below.<br />
                    • <strong>Manual Override:</strong> Use the <strong>Live Score Center</strong> tab to manually set match scores (winner only, detailed statistics scorecard won't be generated).
                  </div>
                </div>

                <div className="form-group">
                  <label>Select Target Match</label>
                  <select
                    className="form-control"
                    value={selectedMatchForImport}
                    onChange={(e) => {
                      setSelectedMatchForImport(e.target.value);
                      setSelectedGameToSync(null);
                      setRecentMatches([]);
                    }}
                  >
                    <option value="">-- Select Scheduled/Live Match --</option>
                    {Object.values(matches)
                      .filter(m => m.status !== "completed")
                      .map(m => (
                        <option key={m.id} value={m.id}>
                          {teams[m.teamAId]?.name || "TBD"} vs {teams[m.teamBId]?.name || "TBD"} ({m.stage})
                        </option>
                      ))}
                  </select>
                </div>

                {selectedMatchForImport && matches[selectedMatchForImport] && (
                  <div style={{ marginTop: "2rem" }}>
                    <h3 style={{ fontSize: "1rem", marginBottom: "1rem", textTransform: "uppercase", color: "var(--primary-gold)" }}>
                      Game Sync Status (Best of {matches[selectedMatchForImport].bestOf || 3})
                    </h3>
                    
                    {fetchingSyncDetails ? (
                      <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Loading existing match telemetry...</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {Array.from({ length: matches[selectedMatchForImport].bestOf || 3 }).map((_, i) => {
                          const isSynced = currentSyncDetails[i] !== null && currentSyncDetails[i] !== undefined;
                          const isSelected = selectedGameToSync === i;
                          
                          return (
                            <div key={i} style={{ border: `1px solid ${isSelected ? "var(--primary-gold)" : "var(--border-dark)"}`, borderRadius: "4px", backgroundColor: isSelected ? "rgba(228,179,60,0.05)" : "var(--bg-tertiary)", overflow: "hidden" }}>
                              {/* Game Header */}
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                  <strong style={{ fontSize: "1.1rem" }}>Game {i + 1}</strong>
                                  {isSynced ? (
                                    <span style={{ backgroundColor: "rgba(32, 201, 151, 0.1)", color: "#20C997", padding: "0.2rem 0.5rem", borderRadius: "2px", fontSize: "0.7rem", fontWeight: "bold" }}>SYNCED</span>
                                  ) : (
                                    <span style={{ backgroundColor: "rgba(255, 77, 79, 0.1)", color: "#ff4d4f", padding: "0.2rem 0.5rem", borderRadius: "2px", fontSize: "0.7rem", fontWeight: "bold" }}>NOT SYNCED</span>
                                  )}
                                </div>
                                <button 
                                  onClick={() => setSelectedGameToSync(isSelected ? null : i)}
                                  className={`btn ${isSelected ? "btn-outline" : "btn-primary"}`}
                                  style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}
                                >
                                  {isSelected ? "Cancel" : (isSynced ? "Resync Data" : "Sync Data")}
                                </button>
                              </div>
                              
                              {/* Sync UI for Selected Game */}
                              {isSelected && (
                                <div style={{ padding: "1.5rem", borderTop: "1px solid var(--border-dark)" }}>
                                  {(() => {
                                    const teamA = teams[matches[selectedMatchForImport].teamAId];
                                    const autoSyncRiotId = teamA?.players?.find(p => p.riotId)?.riotId;
                                    
                                    return (
                                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center", backgroundColor: "var(--bg-tertiary)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border-dark)", marginBottom: "1.5rem" }}>
                                        {autoSyncRiotId ? (
                                          <>
                                            <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", textAlign: "center" }}>
                                              Auto-Sync uses <strong>{teamA.name}</strong>'s saved Riot ID (<span style={{ color: "var(--primary-gold)" }}>{autoSyncRiotId}</span>) to fetch recent matches.
                                            </div>
                                            <button 
                                              className="btn btn-primary" 
                                              onClick={() => handleFetchRecentMatches(autoSyncRiotId)}
                                              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                                              disabled={fetchingMatches}
                                            >
                                              <Activity size={16} /> 
                                              {fetchingMatches ? "Fetching..." : `Fetch Recent Matches`}
                                            </button>
                                          </>
                                        ) : (
                                          <div style={{ color: "var(--color-danger)", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <AlertTriangle size={16} />
                                            No Riot IDs found for {teamA?.name}. Please edit their Team Roster and add a Riot ID to use Auto-Sync.
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  {recentMatches.length > 0 && (
                                    <div>
                                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", textTransform: "uppercase" }}>Select Telemetry to Sync into Game {i + 1}</label>
                                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "300px", overflowY: "auto" }}>
                                        {recentMatches.map((rm) => {
                                          const getQueueType = (id) => {
                                            if (id === 450) return "ARAM";
                                            if (id === 420) return "Ranked Solo";
                                            if (id === 440) return "Ranked Flex";
                                            if (id === 400 || id === 430) return "Normal";
                                            if (id === 700) return "Clash";
                                            return "Match";
                                          };
                                          
                                          return (
                                            <div 
                                              key={rm.matchId} 
                                              style={{ 
                                                display: "flex", 
                                                alignItems: "center", 
                                                justifyContent: "space-between", 
                                                padding: "0.75rem", 
                                                backgroundColor: "var(--bg-secondary)", 
                                                border: "1px solid var(--border-dark)",
                                                borderRadius: "4px" 
                                              }}
                                            >
                                              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                                <img 
                                                  src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${rm.champion.replace(/[^a-zA-Z0-9]/g, "")}.png`} 
                                                  alt={rm.champion} 
                                                  style={{ width: "32px", height: "32px", borderRadius: "4px" }} 
                                                  onError={(e) => { e.target.src = "https://placehold.co/32x32" }}
                                                />
                                                <div>
                                                  <div style={{ fontWeight: "bold", color: rm.win ? "var(--primary-gold-bright)" : "var(--text-secondary)" }}>
                                                    {rm.win ? "VICTORY" : "DEFEAT"} - {rm.champion} <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "0.5rem", fontWeight: "normal" }}>({getQueueType(rm.queueId)})</span>
                                                  </div>
                                                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                                    {Math.floor(rm.gameDuration / 60)}:{(rm.gameDuration % 60).toString().padStart(2, "0")} &bull; KDA: {rm.kills}/{rm.deaths}/{rm.assists}
                                                  </div>
                                                </div>
                                              </div>
                                              <button
                                                onClick={() => handleImportRiotMatch(selectedMatchForImport, rm.matchId, i)}
                                                className="btn btn-primary"
                                                disabled={importing}
                                              >
                                                {importing ? "..." : "Sync"}
                                              </button>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: RIOT TOURNAMENT API CONFIG & WEBHOOK SIMULATION */}
          {activeTab === "riot" && config && (
            <div>
              <h2 style={{ textTransform: "uppercase", fontSize: "1.25rem", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.75rem", marginBottom: "1.5rem" }}>
                Riot Games Tournament API Config
              </h2>

              <form onSubmit={handleSaveConfig} style={{ marginBottom: "3rem", borderBottom: "1px solid var(--border-dark)", paddingBottom: "2rem" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", backgroundColor: "rgba(228,179,60,0.05)", border: "1px solid var(--border-gold)", borderRadius: "4px", padding: "1rem", marginBottom: "1.5rem", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                  <Info size={18} style={{ color: "var(--primary-gold)", flexShrink: 0, marginTop: "0.1rem" }} />
                  <div>
                    <strong>Webhook Listener Target:</strong><br />
                    Configure your Riot Provider URL to point to:<br />
                    <code>https://your-deployed-domain.vercel.app/api/riot-webhook</code>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label>Riot Provider ID</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. 456"
                      value={configForm.providerId}
                      onChange={(e) => setConfigForm({ ...configForm, providerId: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Riot Tournament ID</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. 7899"
                      value={configForm.tournamentId}
                      onChange={(e) => setConfigForm({ ...configForm, tournamentId: e.target.value })}
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> Save Riot Credentials
                </button>
              </form>

              {/* Tournament Code Generator */}
              <h2 style={{ textTransform: "uppercase", fontSize: "1.25rem", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.75rem", marginBottom: "1.5rem" }}>
                Lobby Code Generator
              </h2>
              <div className="card" style={{ marginBottom: "3rem", border: "1px solid var(--border-dark)" }}>
                <div className="form-group">
                  <label>Select Scheduled Match</label>
                  <select
                    className="form-control"
                    value={selectedMatchForCode}
                    onChange={(e) => setSelectedMatchForCode(e.target.value)}
                  >
                    <option value="">-- Select Scheduled Match --</option>
                    {Object.values(matches)
                      .filter(m => m.status !== "completed")
                      .map(m => (
                        <option key={m.id} value={m.id}>
                          {teams[m.teamAId]?.name || "TBD"} vs {teams[m.teamBId]?.name || "TBD"} ({m.stage})
                        </option>
                      ))}
                  </select>
                </div>
                <button 
                  onClick={() => handleGenerateRiotCode(selectedMatchForCode)}
                  className="btn btn-secondary" 
                  disabled={codeGenerating || !selectedMatchForCode}
                  style={{ display: "flex", gap: "0.5rem" }}
                >
                  {codeGenerating ? "Requesting..." : "Generate Invite Code"}
                </button>
              </div>

              {/* Local Webhook Simulator */}
              <h2 style={{ textTransform: "uppercase", fontSize: "1.25rem", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.75rem", marginBottom: "1.5rem" }}>
                Riot Webhook Simulator (Local Testing)
              </h2>
              <div className="card" style={{ border: "1px solid var(--border-dark)" }}>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Select Match to Complete</label>
                    <select
                      className="form-control"
                      value={simulatingMatchId}
                      onChange={(e) => setSimulatingMatchId(e.target.value)}
                    >
                      <option value="">-- Select Target Match --</option>
                      {Object.values(matches)
                        .filter(m => m.status !== "completed")
                        .map(m => (
                          <option key={m.id} value={m.id}>
                            {teams[m.teamAId]?.name || "TBD"} vs {teams[m.teamBId]?.name || "TBD"} ({m.stage})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Simulated Winner</label>
                    <select
                      className="form-control"
                      value={simulatedWinnerSide}
                      onChange={(e) => setSimulatedWinnerSide(parseInt(e.target.value))}
                      disabled={!simulatingMatchId}
                    >
                      <option value={100}>Blue Side (Team A: {teams[matches[simulatingMatchId]?.teamAId]?.name || "TBD"})</option>
                      <option value={200}>Red Side (Team B: {teams[matches[simulatingMatchId]?.teamBId]?.name || "TBD"})</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => handleSimulateWebhook(simulatingMatchId, simulatedWinnerSide)}
                  className="btn btn-primary"
                  style={{ backgroundColor: "var(--color-danger)", borderColor: "var(--color-danger)", display: "flex", gap: "0.5rem" }}
                  disabled={simulating || !simulatingMatchId}
                >
                  {simulating ? "Processing..." : "Trigger Simulated Webhook"}
                </button>
              </div>
            </div>
          )}

          {/* TAB: NEWS MANAGEMENT */}
          {activeTab === "news" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h2>News & Announcements</h2>
              </div>
              
              <div className="card" style={{ marginBottom: "2rem" }}>
                <h3>{newsForm.id ? "Edit Announcement" : "Create New Announcement"}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label>Title</label>
                    <input type="text" className="form-control" value={newsForm.title} onChange={(e) => setNewsForm({...newsForm, title: e.target.value})} placeholder="Patch 16.12 is Live!" />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select className="form-control" value={newsForm.category} onChange={(e) => setNewsForm({...newsForm, category: e.target.value})}>
                      <option value="Announcement">Announcement</option>
                      <option value="Patch Notes">Patch Notes</option>
                      <option value="Rules">Rules</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Content (Markdown supported in future, use plaintext for now)</label>
                  <textarea className="form-control" rows="5" value={newsForm.content} onChange={(e) => setNewsForm({...newsForm, content: e.target.value})} placeholder="Write the announcement details here..."></textarea>
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <button onClick={handleSaveNews} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Save size={16} /> {newsForm.id ? "Update News" : "Publish News"}
                  </button>
                  {newsForm.id && (
                    <button onClick={() => setNewsForm({ id: "", title: "", content: "", category: "Announcement" })} className="btn btn-secondary">
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>

              <div className="card">
                <h3>Published News ({Object.keys(news).length})</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
                  {Object.values(news).sort((a,b) => b.timestamp - a.timestamp).map((item) => (
                    <div key={item.id} style={{ padding: "1rem", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid var(--border-dark)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                          <span style={{ fontSize: "0.7rem", backgroundColor: "var(--bg-lighter)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>{item.category}</span>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }} suppressHydrationWarning>{new Date(item.timestamp).toLocaleDateString()}</span>
                        </div>
                        <h4 style={{ margin: "0 0 0.5rem 0", color: "var(--primary-gold)" }}>{item.title}</h4>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button onClick={() => handleEditNews(item)} className="btn btn-secondary" style={{ padding: "0.4rem" }}>
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteNews(item.id)} className="btn btn-secondary" style={{ padding: "0.4rem", color: "var(--color-danger)" }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
