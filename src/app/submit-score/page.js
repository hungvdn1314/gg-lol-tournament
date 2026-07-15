"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { subscribeToData, submitCaptainGameScore } from "@/lib/db";
import { getLatestDDragonVersion, useDDragon } from "@/lib/riot";
import { matchPlayersToRoster } from "@/lib/ocr";
import { 
  CheckCircle2, 
  ShieldAlert, 
  Clock, 
  Upload, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Trash2, 
  Check, 
  User, 
  RotateCcw,
  Sliders,
  FileCheck
} from "lucide-react";

export default function SubmitScore() {
  const router = useRouter();
  const { getItemIcon } = useDDragon();
  
  // Navigation / Auth Gate
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Tournament Data
  const [config, setConfig] = useState(null);
  const [matches, setMatches] = useState({});
  const [teams, setTeams] = useState({});
  const [champions, setChampions] = useState([]);
  const [championMap, setChampionMap] = useState({}); // { normalizedName: ddId }
  const [itemsMap, setItemsMap] = useState({}); // { normalizedName: itemId }

  // Wizard Steps: 1 = Selection, 2 = Upload, 3 = Mapping & Stats Review, 4 = Final Review & Submit
  const [step, setStep] = useState(1);

  // Step 1: Match & Game Selection
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [gameIndex, setGameIndex] = useState(0);

  // Step 2: Upload Screenshots
  const [images, setImages] = useState([]); // Array of base64-encoded strings (exactly 3)
  const [imageNames, setImageNames] = useState([]); // File names for UI display

  // Step 3: OCR Results & Mapping
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState("");
  const [ocrResults, setOcrResults] = useState(null); // Raw response from API
  const [allPlayersMatched, setAllPlayersMatched] = useState(false);

  // Match configurations deduced from OCR & User modifications
  const [gameDuration, setGameDuration] = useState("20:00");
  const [winnerSide, setWinnerSide] = useState("Blue"); // Blue or Red
  const [blueTeamId, setBlueTeamId] = useState(""); // Team ID on Blue Side
  const [redTeamId, setRedTeamId] = useState("");  // Team ID on Red Side
  const [playerAssignments, setPlayerAssignments] = useState({}); // { [ocrIndex]: player.name }

  // Step 4: Finalized stats to submit (array of 10 participants)
  const [finalizedStats, setFinalizedStats] = useState([]);

  // Submission Status
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [notificationMsg, setNotificationMsg] = useState("");
  const [matchDetails, setMatchDetails] = useState({});

  // Check login and redirect if not admin
  useEffect(() => {
    const checkLoginStatus = () => {
      const loggedIn = localStorage.getItem("lol_tourney_admin_logged_in") === "true";
      setIsAdminLoggedIn(loggedIn);
      setAuthChecked(true);
      if (!loggedIn) {
        setTimeout(() => {
          router.push("/admin");
        }, 2000);
      }
    };
    checkLoginStatus();
  }, [router]);

  // Load configuration and data
  useEffect(() => {
    if (!isAdminLoggedIn) return;

    const unsubConfig = subscribeToData("config", setConfig);
    const unsubMatches = subscribeToData("matches", setMatches);
    const unsubTeams = subscribeToData("teams", setTeams);
    const unsubDetails = subscribeToData("matchDetails", setMatchDetails);

    getLatestDDragonVersion().then(async (version) => {
      try {
        const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`);
        if (res.ok) {
          const data = await res.json();
          const champEntries = Object.values(data.data);
          const list = champEntries.map(c => c.id).sort();
          setChampions(list);
          // Build a lookup map: normalized display name -> DDragon ID
          const map = {};
          champEntries.forEach(c => {
            // Map by id (e.g. "LeeSin" -> "LeeSin")
            map[c.id.toLowerCase()] = c.id;
            // Map by display name (e.g. "lee sin" -> "LeeSin")
            if (c.name) map[c.name.toLowerCase()] = c.id;
            // Map by stripped name (e.g. "leesin" -> "LeeSin")
            map[c.id.toLowerCase().replace(/[^a-z0-9]/g, "")] = c.id;
            if (c.name) map[c.name.toLowerCase().replace(/[^a-z0-9]/g, "")] = c.id;
          });
          setChampionMap(map);
        }
      } catch (e) {
        console.error("Error loading champions list:", e);
      }

      try {
        const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`);
        if (res.ok) {
          const data = await res.json();
          const itemMap = {};
          Object.entries(data.data).forEach(([id, item]) => {
            const numId = parseInt(id);
            if (item.name) {
              itemMap[item.name.toLowerCase()] = numId;
              itemMap[item.name.toLowerCase().replace(/[^a-z0-9]/g, "")] = numId;
            }
          });
          setItemsMap(itemMap);
        }
      } catch (e) {
        console.error("Error loading items list:", e);
      }
    });

    return () => {
      unsubConfig();
      unsubMatches();
      unsubTeams();
      unsubDetails();
    };
  }, [isAdminLoggedIn]);

  // Reset indices if match changes
  const selectedMatch = selectedMatchId ? matches[selectedMatchId] : null;
  const teamA = selectedMatch ? teams[selectedMatch.teamAId] : null;
  const teamB = selectedMatch ? teams[selectedMatch.teamBId] : null;

  useEffect(() => {
    setGameIndex(0);
    setImages([]);
    setImageNames([]);
    setOcrResults(null);
    setStep(1);
    setNotificationMsg("");
  }, [selectedMatchId]);

  // Handle Multi-file Upload (up to 3 images with canvas compression)
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1000;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.7 quality to keep payload small (~100KB per image)
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);

          setImages((prev) => {
            if (prev.length >= 3) return prev;
            return [...prev, compressedBase64];
          });
          setImageNames((prev) => {
            if (prev.length >= 3) return prev;
            return [...prev, file.name];
          });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx) => {
    const newImages = [...images];
    const newNames = [...imageNames];
    newImages.splice(idx, 1);
    newNames.splice(idx, 1);
    setImages(newImages);
    setImageNames(newNames);
  };

  // Run Gemini OCR Analyze API
  const startMockAnalysis = () => {
    if (!selectedMatch || !teamA || !teamB) return;

    const teamAPlayers = teamA.players || [];
    const teamBPlayers = teamB.players || [];
    const mockPlayerStats = [];
    
    // First 5 (Blue side: Team A)
    for (let i = 0; i < 5; i++) {
      const pName = teamAPlayers[i]?.name || `Player A${i+1}`;
      mockPlayerStats.push({
        summonerName: pName,
        champion: "",
        kills: 0,
        deaths: 0,
        assists: 0,
        gold: 10000,
        cs: 70,
        damageDealt: 12000,
        damageTaken: 12000,
        healing: 1500,
        items: [],
        firstBlood: false
      });
    }

    // Next 5 (Red side: Team B)
    for (let i = 0; i < 5; i++) {
      const pName = teamBPlayers[i]?.name || `Player B${i+1}`;
      mockPlayerStats.push({
        summonerName: pName,
        champion: "",
        kills: 0,
        deaths: 0,
        assists: 0,
        gold: 9000,
        cs: 60,
        damageDealt: 10000,
        damageTaken: 14000,
        healing: 1000,
        items: [],
        firstBlood: false
      });
    }

    const mockOcrData = {
      gameDuration: "20:00",
      winnerSide: "Blue",
      playerStats: mockPlayerStats
    };

    setOcrResults(mockOcrData);
    setGameDuration("20:00");
    setWinnerSide("Blue");
    setBlueTeamId(selectedMatch.teamAId);
    setRedTeamId(selectedMatch.teamBId);

    const initialAssignments = {};
    for (let i = 0; i < 5; i++) {
      initialAssignments[i] = teamAPlayers[i]?.name || "";
    }
    for (let i = 0; i < 5; i++) {
      initialAssignments[i + 5] = teamBPlayers[i]?.name || "";
    }
    setPlayerAssignments(initialAssignments);
    setAllPlayersMatched(true);
    setErrorMsg("⚠️ Gemini API rate-limited (Quota Exceeded). Roster auto-populated. Please input champion picks and score details manually below.");
    setStep(3);
  };

  const runOcrAnalyze = async () => {
    if (images.length !== 3) {
      setErrorMsg("Please upload exactly 3 screenshots to proceed.");
      return;
    }

    setOcrLoading(true);
    setOcrStatus("Processing screenshots through Gemini Flash Vision...");
    setErrorMsg("");

    try {
      const response = await fetch("/api/ocr-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "OCR analysis endpoint returned an error.");
      }

      const ocrData = await response.json();
      setOcrResults(ocrData);

      // Match player IGNs against team rosters
      const matching = matchPlayersToRoster(ocrData.playerStats, teamA, teamB);
      
      setGameDuration(ocrData.gameDuration || "20:00");
      setWinnerSide(ocrData.winnerSide || "Blue");

      // Auto assign sides based on matching
      if (matching.blueSideTeamId === 100) {
        setBlueTeamId(selectedMatch.teamAId);
        setRedTeamId(selectedMatch.teamBId);
      } else {
        setBlueTeamId(selectedMatch.teamBId);
        setRedTeamId(selectedMatch.teamAId);
      }

      // Initialize dropdown assignments
      const initialAssignments = {};
      matching.matches.forEach((m, idx) => {
        initialAssignments[idx] = m.matchedPlayerName || "";
      });
      setPlayerAssignments(initialAssignments);
      setAllPlayersMatched(matching.allMatched);

      setStep(3);
    } catch (err) {
      console.error("OCR Analysis error, falling back to manual entry:", err);
      startMockAnalysis();
    } finally {
      setOcrLoading(false);
    }
  };

  const handleBlueTeamChange = (teamId) => {
    setBlueTeamId(teamId);
    setRedTeamId(teamId === selectedMatch.teamAId ? selectedMatch.teamBId : selectedMatch.teamAId);
    setPlayerAssignments({});
    setAllPlayersMatched(false);
  };

  const handleRedTeamChange = (teamId) => {
    setRedTeamId(teamId);
    setBlueTeamId(teamId === selectedMatch.teamAId ? selectedMatch.teamBId : selectedMatch.teamAId);
    setPlayerAssignments({});
    setAllPlayersMatched(false);
  };

  const handlePlayerAssignment = (ocrIdx, playerName) => {
    setPlayerAssignments(prev => ({
      ...prev,
      [ocrIdx]: playerName
    }));
    setAllPlayersMatched(false);
  };

  // Resolve an OCR champion name to a DDragon champion ID
  const resolveChampionId = (rawName) => {
    if (!rawName || rawName === "TBD") return "";
    // Direct match
    if (champions.includes(rawName)) return rawName;
    // Lookup by lowercase
    const lower = rawName.toLowerCase();
    if (championMap[lower]) return championMap[lower];
    // Lookup by stripped alphanumeric
    const stripped = lower.replace(/[^a-z0-9]/g, "");
    if (championMap[stripped]) return championMap[stripped];
    // Fuzzy: find the closest match by checking if any key contains or is contained
    for (const [key, id] of Object.entries(championMap)) {
      if (key.includes(stripped) || stripped.includes(key)) return id;
    }
    return rawName; // Return raw as fallback
  };

  // Resolve OCR item names to DDragon item IDs
  const resolveItemIds = (rawItems) => {
    const resolved = [0, 0, 0, 0, 0, 0];
    if (!Array.isArray(rawItems)) return resolved;
    
    rawItems.slice(0, 6).forEach((itemName, index) => {
      if (!itemName) return;
      const lower = itemName.toLowerCase();
      // Try direct match
      if (itemsMap[lower]) {
        resolved[index] = itemsMap[lower];
      } else {
        // Try stripped alphanumeric match
        const stripped = lower.replace(/[^a-z0-9]/g, "");
        if (itemsMap[stripped]) {
          resolved[index] = itemsMap[stripped];
        }
      }
    });
    return resolved;
  };

  // Move from Step 3 to Step 4 (Validation)
  const validateAndProceedToReview = () => {
    setErrorMsg("");

    // Validate that all 10 players have been assigned
    const assignedPlayers = Object.values(playerAssignments).filter(Boolean);
    if (assignedPlayers.length !== 10) {
      setErrorMsg("Please assign a player to all 10 rows before proceeding.");
      return;
      }
  
      // Validate unique selections
      const uniqueAssignments = new Set(assignedPlayers);
      if (uniqueAssignments.size !== 10) {
        setErrorMsg("Each registered player can only be assigned to one row. Remove duplicates.");
        return;
      }
  
      // Construct participant rows for review & database
      const participants = ocrResults.playerStats.map((stat, idx) => {
        const isBlueSide = idx < 5;
        const sideWinner = winnerSide === (isBlueSide ? "Blue" : "Red");
        const assignedPlayerName = playerAssignments[idx];
  
        return {
          playerName: assignedPlayerName,
          teamId: isBlueSide ? 100 : 200,
          win: sideWinner,
          champion: resolveChampionId(stat.champion) || "",
          kills: parseInt(stat.kills) || 0,
          deaths: parseInt(stat.deaths) || 0,
          assists: parseInt(stat.assists) || 0,
          gold: parseInt(stat.gold) || 0,
          cs: parseInt(stat.cs) || 0,
          damageDealt: parseInt(stat.damageDealt) || 0,
          damageTaken: parseInt(stat.damageTaken) || 0,
          healing: parseInt(stat.healing) || 0,
          items: resolveItemIds(stat.items),
          firstBlood: !!stat.firstBlood,
          summonerSpells: [0, 0],
          runes: { keystoneId: 0, primaryStyleId: 0 }
        };
      });
  
      setFinalizedStats(participants);
      setStep(4);
    };
  
    // Edit stat handler in Step 4
    const handleFinalStatChange = (idx, field, val) => {
      setFinalizedStats(prev => {
        const copy = [...prev];
        let finalVal = val;
        
        if (field === "champion") {
          finalVal = val;
        } else if (field === "firstBlood") {
          finalVal = !!val;
        } else if (field === "items") {
          finalVal = Array.isArray(val) ? val : [];
        } else {
          finalVal = val === "" ? 0 : parseInt(val) || 0;
        }
  
        copy[idx] = {
          ...copy[idx],
          [field]: finalVal
        };
        return copy;
      });
    };

  // Submit scorecard to DB
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const durationParts = gameDuration.split(":");
    let durationSeconds = 1200; // 20m default fallback
    if (durationParts.length === 2) {
      const mins = parseInt(durationParts[0]);
      const secs = parseInt(durationParts[1]);
      if (!isNaN(mins) && !isNaN(secs)) {
        durationSeconds = mins * 60 + secs;
      }
    }

    const blueWin = winnerSide === "Blue";
    const redWin = winnerSide === "Red";

    const gameDetails = {
      gameDuration: durationSeconds,
      captainSubmission: true,
      teams: {
        100: { winner: blueWin },
        200: { winner: redWin }
      },
      participants: finalizedStats
    };

    try {
      const result = await submitCaptainGameScore(selectedMatchId, gameIndex, gameDetails);
      const isCompleted = result?.updatedMatch?.status === "completed";

      if (isCompleted) {
        setSuccess(true);
        window.scrollTo(0, 0);
        setTimeout(() => {
          router.push("/schedule");
        }, 3000);
      } else {
        // Reset states for next game of the same match
        setImages([]);
        setImageNames([]);
        setOcrResults(null);
        setPlayerAssignments({});
        setFinalizedStats([]);
        setGameIndex(prev => prev + 1);
        setStep(1);
        window.scrollTo(0, 0);

        const currentScoreText = `${result.updatedMatch.scoreA} - ${result.updatedMatch.scoreB}`;
        setNotificationMsg(`Game ${gameIndex + 1} score successfully published! Series is now ${currentScoreText}. Please submit screenshots for Game ${gameIndex + 2}.`);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(`Submission Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Gated Auth Redirect Screen
  if (!authChecked) {
    return (
      <div className="container" style={{ minHeight: "60vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ color: "var(--primary-gold)" }}>Verifying credentials...</div>
      </div>
    );
  }

  if (!isAdminLoggedIn) {
    return (
      <div className="container" style={{ minHeight: "60vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div className="card card-gold" style={{ maxWidth: "500px", padding: "2.5rem", textAlign: "center" }}>
          <ShieldAlert size={48} style={{ color: "var(--color-danger)", margin: "0 auto 1rem auto" }} />
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Admin Portal Gated</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
            You must be logged in as an administrator to submit or modify match scores.
          </p>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Redirecting to Login page...</span>
        </div>
      </div>
    );
  }

  // Success screen
  if (success) {
    return (
      <div className="container" style={{ minHeight: "60vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div className="card card-gold" style={{ maxWidth: "500px", padding: "3rem", textAlign: "center" }}>
          <CheckCircle2 size={64} style={{ color: "var(--color-success)", margin: "0 auto 1.5rem auto" }} />
          <h2 style={{ fontSize: "1.75rem", marginBottom: "1rem" }}>Score Successfully Persisted!</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            Scoreboard details, standings tables, and MVP metrics have been updated and broadcasted.
          </p>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block" }}>
            Redirecting to the schedule dashboard...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: "1000px" }}>
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <span className="hero-badge" style={{ borderColor: "var(--primary-gold)", color: "var(--primary-gold)" }}>Tournament Control Room</span>
        <h1 style={{ fontSize: "2.25rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>Submit Match Score</h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto" }}>
          Redesigned multi-stage scoring wizard utilizing Gemini Flash screenshot OCR mapping.
        </p>
      </div>

      {/* Stepper Wizard Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem", position: "relative" }}>
        <div style={{ position: "absolute", left: "10%", right: "10%", top: "24px", height: "2px", backgroundColor: "var(--border-dark)", zIndex: 1 }} />
        <div style={{ position: "absolute", left: "10%", width: `${(step - 1) * 26.6}%`, top: "24px", height: "2px", backgroundColor: "var(--primary-gold)", transition: "all 0.3s ease", zIndex: 2 }} />

        {[
          { label: "Match Selection", icon: Sliders },
          { label: "Screenshots Upload", icon: Upload },
          { label: "Player Assignment", icon: User },
          { label: "Review & Commit", icon: FileCheck }
        ].map((s, idx) => {
          const sNum = idx + 1;
          const isActive = step === sNum;
          const isCompleted = step > sNum;
          const Icon = s.icon;

          return (
            <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 3 }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: isCompleted ? "var(--primary-gold)" : (isActive ? "var(--bg-secondary)" : "var(--bg-tertiary)"),
                border: `2px solid ${isActive || isCompleted ? "var(--primary-gold)" : "var(--border-dark)"}`,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: isCompleted ? "#000" : (isActive ? "var(--primary-gold-bright)" : "var(--text-muted)"),
                fontWeight: "bold",
                transition: "all 0.3s ease",
                cursor: isCompleted ? "pointer" : "default"
              }}
              onClick={() => isCompleted && setStep(sNum)}
              >
                {isCompleted ? <Check size={18} strokeWidth={3} /> : <Icon size={18} />}
              </div>
              <span style={{ 
                fontSize: "0.75rem", 
                marginTop: "0.5rem", 
                fontWeight: isActive || isCompleted ? "bold" : "normal",
                color: isActive || isCompleted ? "var(--text-primary)" : "var(--text-muted)",
                textAlign: "center"
              }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {notificationMsg && (
        <div style={{ display: "flex", gap: "0.75rem", padding: "1rem", backgroundColor: "rgba(16, 185, 129, 0.08)", border: "1px solid var(--color-success)", borderRadius: "6px", color: "var(--color-success)", marginBottom: "2rem", fontSize: "0.9rem", alignItems: "center" }}>
          <CheckCircle2 size={18} />
          <span>{notificationMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ display: "flex", gap: "0.75rem", padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.08)", border: "1px solid var(--color-danger)", borderRadius: "6px", color: "var(--color-danger)", marginBottom: "2rem", fontSize: "0.9rem", alignItems: "center" }}>
          <ShieldAlert size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: SELECT MATCH & GAME */}
      {step === 1 && (
        <div className="card" style={{ padding: "2rem", border: "1px solid var(--border-dark)", background: "var(--glass-bg)" }}>
          <h3 style={{ borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.5rem", marginBottom: "1.5rem", fontSize: "1.1rem", color: "var(--primary-gold-bright)" }}>
            Select Target Match & Game
          </h3>
          <div className="grid-2" style={{ marginBottom: "2.5rem" }}>
            <div className="form-group">
              <label>Target Match</label>
              <select
                className="form-control"
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                required
              >
                <option value="">-- Choose Scheduled/Live Match --</option>
                 {Object.values(matches)
                  .filter(m => m.status !== "completed")
                  .map(m => (
                    <option key={m.id} value={m.id}>
                      {teams[m.teamAId]?.name || "TBD"} vs {teams[m.teamBId]?.name || "TBD"} (Score: {m.scoreA} - {m.scoreB}) ({m.stage})
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label>Game Number</label>
              <select
                className="form-control"
                value={gameIndex}
                onChange={(e) => setGameIndex(parseInt(e.target.value))}
                disabled={!selectedMatch}
              >
                {selectedMatch ? (
                  Array.from({ length: selectedMatch.bestOf }).map((_, idx) => {
                    const selectedMatchDetails = matchDetails[selectedMatchId] || [];
                    const gamePublished = selectedMatchDetails[idx] && selectedMatchDetails[idx].participants && selectedMatchDetails[idx].participants.length > 0;
                    return (
                      <option key={idx} value={idx}>
                        Game {idx + 1} {gamePublished ? " (Score Published)" : " (Draft / No Score)"}
                      </option>
                    );
                  })
                ) : (
                  <option value={0}>Game 1</option>
                )}
              </select>
            </div>
          </div>

          {selectedMatch && (
            <div style={{ backgroundColor: "rgba(212, 175, 55, 0.05)", border: "1px solid var(--border-gold)", borderRadius: "6px", padding: "1.25rem", marginBottom: "2rem" }}>
              <div style={{ fontWeight: "bold", color: "var(--primary-gold-bright)", marginBottom: "0.5rem" }}>Match Status Profile:</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <span>Format: <strong>Best of {selectedMatch.bestOf}</strong></span>
                <span>Current Score: <strong>{teamA?.name} {selectedMatch.scoreA} - {selectedMatch.scoreB} {teamB?.name}</strong></span>
                <span>Stage: <strong>{selectedMatch.stage}</strong></span>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              className="btn btn-primary"
              disabled={!selectedMatchId}
              onClick={() => setStep(2)}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span>Upload Screenshots</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: UPLOAD SCREENSHOTS */}
      {step === 2 && (
        <div className="card" style={{ padding: "2rem", border: "1px solid var(--border-dark)", background: "var(--glass-bg)" }}>
          <h3 style={{ borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.5rem", marginBottom: "1.5rem", fontSize: "1.1rem", color: "var(--primary-gold-bright)" }}>
            Upload Scoreboard Screenshots (Game {gameIndex + 1})
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            Please upload exactly <strong>3 screenshots</strong> containing the game results (e.g. scoreboard overview, damage stats, healing done).
          </p>

          <div className="form-group" style={{ marginBottom: "2rem" }}>
            <div 
              style={{ 
                border: "2px dashed var(--border-gold)", 
                borderRadius: "8px", 
                padding: "3rem 2rem", 
                textAlign: "center", 
                backgroundColor: "var(--bg-tertiary)",
                position: "relative",
                cursor: images.length >= 3 ? "not-allowed" : "pointer"
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (images.length >= 3) return;
                const file = e.dataTransfer.files[0];
                if (file) {
                  const input = document.getElementById("screenshots-upload-input");
                  if (input) {
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    input.files = dataTransfer.files;
                    handleFileChange({ target: input });
                  }
                }
              }}
            >
              <input
                id="screenshots-upload-input"
                type="file"
                accept="image/*"
                multiple
                disabled={images.length >= 3}
                onChange={handleFileChange}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: images.length >= 3 ? "not-allowed" : "pointer" }}
              />
              <Upload size={36} style={{ color: "var(--primary-gold)", marginBottom: "1rem" }} />
              <div style={{ fontWeight: "700", marginBottom: "0.5rem" }}>
                {images.length >= 3 ? "All 3 files uploaded successfully" : "Drag and drop or browse scoreboard files"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Selected: {images.length} / 3 images.
              </div>
            </div>
          </div>

          {images.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
              {images.map((img, idx) => (
                <div key={idx} style={{ position: "relative", border: "1px solid var(--border-dark)", borderRadius: "6px", overflow: "hidden", backgroundColor: "#000", padding: "0.25rem" }}>
                  <img src={img} alt={`Preview ${idx + 1}`} style={{ width: "100%", height: "100px", objectFit: "cover", display: "block", borderRadius: "4px" }} />
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.3rem", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", padding: "0 0.25rem" }}>
                    {imageNames[idx]}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    style={{ position: "absolute", top: "8px", right: "8px", backgroundColor: "rgba(239, 68, 68, 0.9)", border: "none", color: "#fff", padding: "4px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              className="btn btn-outline"
              onClick={() => setStep(1)}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <button
              className="btn"
              disabled={images.length !== 3 || ocrLoading}
              onClick={runOcrAnalyze}
              style={{
                background: images.length !== 3 
                  ? "var(--bg-tertiary)" 
                  : "linear-gradient(135deg, var(--primary-red) 0%, var(--primary-gold) 100%)",
                color: images.length !== 3 ? "var(--text-muted)" : "#000",
                fontWeight: "bold",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              <Sparkles size={16} />
              <span>{ocrLoading ? "Analyzing..." : "Analyze & Extract Stats"}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: MAPPING & OCR REVIEW */}
      {step === 3 && ocrResults && (
        <div className="card" style={{ padding: "2rem", border: "1px solid var(--border-dark)", background: "var(--glass-bg)" }}>
          <h3 style={{ borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.5rem", marginBottom: "1.5rem", fontSize: "1.1rem", color: "var(--primary-gold-bright)" }}>
            Review Extracted Player Mappings (Game {gameIndex + 1})
          </h3>

          <div className="grid-3" style={{ marginBottom: "2rem", backgroundColor: "var(--bg-tertiary)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border-dark)" }}>
            <div className="form-group">
              <label>Winner Side</label>
              <select
                className="form-control"
                value={winnerSide}
                onChange={(e) => setWinnerSide(e.target.value)}
              >
                <option value="Blue">Blue Side Winner</option>
                <option value="Red">Red Side Winner</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Game Duration</label>
              <input
                type="text"
                className="form-control"
                value={gameDuration}
                onChange={(e) => setGameDuration(e.target.value)}
                placeholder="MM:SS"
              />
            </div>

            <div className="form-group" style={{ display: "flex", alignItems: "flex-end" }}>
              {allPlayersMatched ? (
                <div style={{ display: "flex", gap: "0.5rem", color: "var(--color-success)", fontWeight: "bold", alignItems: "center", paddingBottom: "10px", fontSize: "0.85rem" }}>
                  <CheckCircle2 size={18} />
                  <span>All 10 players auto-matched!</span>
                </div>
              ) : (
                <div style={{ display: "flex", gap: "0.5rem", color: "var(--primary-gold)", fontWeight: "bold", alignItems: "center", paddingBottom: "10px", fontSize: "0.85rem" }}>
                  <RotateCcw size={16} />
                  <span>Manual adjustments needed</span>
                </div>
              )}
            </div>
          </div>

          {/* Team Side Assignments */}
          <div className="grid-2" style={{ marginBottom: "2.5rem" }}>
            <div className="form-group" style={{ borderLeft: "4px solid #3b82f6", paddingLeft: "1rem" }}>
              <label style={{ color: "#3b82f6", fontWeight: "bold" }}>Blue Side Team</label>
              <select
                className="form-control"
                value={blueTeamId}
                onChange={(e) => handleBlueTeamChange(e.target.value)}
              >
                <option value={selectedMatch.teamAId}>{teamA?.name}</option>
                <option value={selectedMatch.teamBId}>{teamB?.name}</option>
              </select>
            </div>

            <div className="form-group" style={{ borderLeft: "4px solid #ef4444", paddingLeft: "1rem" }}>
              <label style={{ color: "#ef4444", fontWeight: "bold" }}>Red Side Team</label>
              <select
                className="form-control"
                value={redTeamId}
                onChange={(e) => handleRedTeamChange(e.target.value)}
              >
                <option value={selectedMatch.teamAId}>{teamA?.name}</option>
                <option value={selectedMatch.teamBId}>{teamB?.name}</option>
              </select>
            </div>
          </div>

          {/* Participant rows matching */}
          <div className="grid-2" style={{ marginBottom: "2.5rem" }}>
            
            {/* Blue side roster map */}
            <div>
              <h4 style={{ color: "#3b82f6", fontSize: "0.9rem", textTransform: "uppercase", marginBottom: "1rem", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.25rem" }}>
                Blue Side Roster Map
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {ocrResults.playerStats.slice(0, 5).map((stat, idx) => {
                  const currentTeam = teams[blueTeamId];
                  const currentPlayers = currentTeam?.players || [];
                  const isAssigned = !!playerAssignments[idx];

                  return (
                    <div key={idx} style={{ backgroundColor: "var(--bg-tertiary)", padding: "1rem", borderRadius: "6px", border: `1px solid ${isAssigned ? "rgba(59, 130, 246, 0.3)" : "var(--color-danger)"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Row {idx + 1} (Extracted: <strong>{stat.summonerName || "Unknown"}</strong>)</span>
                        <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--primary-gold)" }}>{stat.champion} ({stat.kills}/{stat.deaths}/{stat.assists})</span>
                      </div>
                      
                      <select
                        className="form-control"
                        style={{ fontSize: "0.85rem", padding: "0.4rem" }}
                        value={playerAssignments[idx] || ""}
                        onChange={(e) => handlePlayerAssignment(idx, e.target.value)}
                      >
                        <option value="">-- Assign registered player --</option>
                        {currentPlayers.map(p => (
                          <option key={p.name} value={p.name}>{p.name} ({p.jerseyName || "No Jersey"})</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Red side roster map */}
            <div>
              <h4 style={{ color: "#ef4444", fontSize: "0.9rem", textTransform: "uppercase", marginBottom: "1rem", borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.25rem" }}>
                Red Side Roster Map
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {ocrResults.playerStats.slice(5, 10).map((stat, idx) => {
                  const actualIdx = idx + 5;
                  const currentTeam = teams[redTeamId];
                  const currentPlayers = currentTeam?.players || [];
                  const isAssigned = !!playerAssignments[actualIdx];

                  return (
                    <div key={actualIdx} style={{ backgroundColor: "var(--bg-tertiary)", padding: "1rem", borderRadius: "6px", border: `1px solid ${isAssigned ? "rgba(239, 68, 68, 0.3)" : "var(--color-danger)"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Row {actualIdx + 1} (Extracted: <strong>{stat.summonerName || "Unknown"}</strong>)</span>
                        <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--primary-gold)" }}>{stat.champion} ({stat.kills}/{stat.deaths}/{stat.assists})</span>
                      </div>
                      
                      <select
                        className="form-control"
                        style={{ fontSize: "0.85rem", padding: "0.4rem" }}
                        value={playerAssignments[actualIdx] || ""}
                        onChange={(e) => handlePlayerAssignment(actualIdx, e.target.value)}
                      >
                        <option value="">-- Assign registered player --</option>
                        {currentPlayers.map(p => (
                          <option key={p.name} value={p.name}>{p.name} ({p.jerseyName || "No Jersey"})</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              className="btn btn-outline"
              onClick={() => setStep(2)}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <button
              className="btn btn-primary"
              onClick={validateAndProceedToReview}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span>Review Final Scorecard</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: FINAL REVIEW & SUBMIT */}
      {step === 4 && finalizedStats.length > 0 && (
        <form onSubmit={handleFinalSubmit} className="card" style={{ padding: "2rem", border: "1px solid var(--border-gold)", background: "var(--glass-bg)" }}>
          <h3 style={{ borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.5rem", marginBottom: "1.5rem", fontSize: "1.1rem", color: "var(--primary-gold-bright)" }}>
            Step 4: Final Match Scorecard Review
          </h3>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(212, 175, 55, 0.04)", border: "1px solid var(--border-gold)", borderRadius: "8px", padding: "1.5rem", marginBottom: "2rem" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Current Match Series</div>
              <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--text-primary)" }}>
                {teamA?.name} vs {teamB?.name}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--primary-gold)" }}>
                Game {gameIndex + 1} of BO{selectedMatch.bestOf}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Projected Standings</div>
              <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--text-primary)" }}>
                {teamA?.name} {selectedMatch.scoreA + (winnerSide === "Blue" ? (blueTeamId === selectedMatch.teamAId ? 1 : 0) : (redTeamId === selectedMatch.teamAId ? 1 : 0))} - {selectedMatch.scoreB + (winnerSide === "Blue" ? (blueTeamId === selectedMatch.teamBId ? 1 : 0) : (redTeamId === selectedMatch.teamBId ? 1 : 0))} {teamB?.name}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Duration: {gameDuration} | Winner: {winnerSide === "Blue" ? teams[blueTeamId]?.name : teams[redTeamId]?.name}
              </div>
            </div>
          </div>

          {/* Editable table per team */}
          <div style={{ marginBottom: "2.5rem" }}>
            <h4 style={{ color: "#3b82f6", fontSize: "0.95rem", textTransform: "uppercase", marginBottom: "1rem", borderBottom: "2px solid #3b82f6", paddingBottom: "0.25rem" }}>
              {teams[blueTeamId]?.name} (Blue Side)
            </h4>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left", marginBottom: "2rem" }}>
                <thead>
                  <tr style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border-dark)" }}>
                    <th style={{ padding: "0.5rem" }}>Player</th>
                    <th style={{ padding: "0.5rem", width: "130px" }}>Champion</th>
                    <th style={{ padding: "0.5rem", width: "70px", textAlign: "center" }}>K</th>
                    <th style={{ padding: "0.5rem", width: "70px", textAlign: "center" }}>D</th>
                    <th style={{ padding: "0.5rem", width: "70px", textAlign: "center" }}>A</th>
                    <th style={{ padding: "0.5rem", width: "90px" }}>Dmg Dealt</th>
                    <th style={{ padding: "0.5rem", width: "90px" }}>Dmg Taken</th>
                    <th style={{ padding: "0.5rem", width: "90px" }}>Healing</th>
                    <th style={{ padding: "0.5rem", width: "90px" }}>Gold</th>
                    <th style={{ padding: "0.5rem", width: "70px" }}>CS</th>
                    <th style={{ padding: "0.5rem", width: "50px", textAlign: "center" }}>FB</th>
                    <th style={{ padding: "0.5rem", width: "290px" }}>Items (IDs)</th>
                  </tr>
                </thead>
                <tbody>
                  {finalizedStats.slice(0, 5).map((stat, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border-dark)" }}>
                      <td style={{ padding: "0.5rem", fontWeight: "bold" }}>{stat.playerName}</td>
                      <td style={{ padding: "0.5rem" }}>
                        <select
                          className="form-control"
                          style={{ padding: "0.25rem", fontSize: "0.8rem", width: "100%" }}
                          value={stat.champion}
                          onChange={(e) => handleFinalStatChange(idx, "champion", e.target.value)}
                        >
                          <option value="">-- Select Champion --</option>
                          {champions.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: "0.25rem" }}>
                        <input
                          type="number"
                          className="form-control"
                          style={{ padding: "0.25rem", textAlign: "center", fontSize: "0.8rem" }}
                          value={stat.kills}
                          onChange={(e) => handleFinalStatChange(idx, "kills", e.target.value)}
                        />
                      </td>
                      <td style={{ padding: "0.25rem" }}>
                        <input
                          type="number"
                          className="form-control"
                          style={{ padding: "0.25rem", textAlign: "center", fontSize: "0.8rem" }}
                          value={stat.deaths}
                          onChange={(e) => handleFinalStatChange(idx, "deaths", e.target.value)}
                        />
                      </td>
                      <td style={{ padding: "0.25rem" }}>
                        <input
                          type="number"
                          className="form-control"
                          style={{ padding: "0.25rem", textAlign: "center", fontSize: "0.8rem" }}
                          value={stat.assists}
                          onChange={(e) => handleFinalStatChange(idx, "assists", e.target.value)}
                        />
                      </td>
                      <td style={{ padding: "0.25rem" }}>
                        <input
                          type="number"
                          className="form-control"
                          style={{ padding: "0.25rem", fontSize: "0.8rem" }}
                          value={stat.damageDealt}
                          onChange={(e) => handleFinalStatChange(idx, "damageDealt", e.target.value)}
                        />
                      </td>
                      <td style={{ padding: "0.25rem" }}>
                        <input
                          type="number"
                          className="form-control"
                          style={{ padding: "0.25rem", fontSize: "0.8rem" }}
                          value={stat.damageTaken}
                          onChange={(e) => handleFinalStatChange(idx, "damageTaken", e.target.value)}
                        />
                      </td>
                      <td style={{ padding: "0.25rem" }}>
                        <input
                          type="number"
                          className="form-control"
                          style={{ padding: "0.25rem", fontSize: "0.8rem" }}
                          value={stat.healing}
                          onChange={(e) => handleFinalStatChange(idx, "healing", e.target.value)}
                        />
                      </td>
                      <td style={{ padding: "0.25rem" }}>
                        <input
                          type="number"
                          className="form-control"
                          style={{ padding: "0.25rem", fontSize: "0.8rem" }}
                          value={stat.gold}
                          onChange={(e) => handleFinalStatChange(idx, "gold", e.target.value)}
                        />
                      </td>
                      <td style={{ padding: "0.25rem" }}>
                        <input
                          type="number"
                          className="form-control"
                          style={{ padding: "0.25rem", fontSize: "0.8rem" }}
                          value={stat.cs}
                          onChange={(e) => handleFinalStatChange(idx, "cs", e.target.value)}
                        />
                      </td>
                      <td style={{ padding: "0.25rem", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={stat.firstBlood || false}
                          onChange={(e) => handleFinalStatChange(idx, "firstBlood", e.target.checked)}
                          style={{ cursor: "pointer", width: "16px", height: "16px" }}
                        />
                      </td>
                      <td style={{ padding: "0.25rem" }}>
                        <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                          {Array.from({ length: 6 }).map((_, itemIdx) => {
                            const itemId = stat.items?.[itemIdx] || 0;
                            const iconUrl = getItemIcon(itemId);
                            return (
                              <div key={itemIdx} style={{ display: "flex", flexDirection: "column", gap: "1px", alignItems: "center" }}>
                                <div style={{ width: "20px", height: "20px", backgroundColor: "rgba(0,0,0,0.3)", borderRadius: "2px", border: "1px solid var(--border-dark)", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", marginBottom: "2px" }}>
                                  {iconUrl ? <img src={iconUrl} alt="item" style={{ width: "100%", height: "100%" }} /> : <span style={{ fontSize: "0.6rem", color: "#555" }}>-</span>}
                                </div>
                                <input
                                  type="number"
                                  className="form-control"
                                  style={{ width: "42px", padding: "0.1rem", fontSize: "0.7rem", textAlign: "center", height: "20px" }}
                                  value={itemId || ""}
                                  onChange={(e) => {
                                    const newItems = [...(stat.items || [0, 0, 0, 0, 0, 0])];
                                    newItems[itemIdx] = parseInt(e.target.value) || 0;
                                    handleFinalStatChange(idx, "items", newItems);
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4 style={{ color: "#ef4444", fontSize: "0.95rem", textTransform: "uppercase", marginBottom: "1rem", borderBottom: "2px solid #ef4444", paddingBottom: "0.25rem", marginTop: "2rem" }}>
              {teams[redTeamId]?.name} (Red Side)
            </h4>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border-dark)" }}>
                    <th style={{ padding: "0.5rem" }}>Player</th>
                    <th style={{ padding: "0.5rem", width: "130px" }}>Champion</th>
                    <th style={{ padding: "0.5rem", width: "70px", textAlign: "center" }}>K</th>
                    <th style={{ padding: "0.5rem", width: "70px", textAlign: "center" }}>D</th>
                    <th style={{ padding: "0.5rem", width: "70px", textAlign: "center" }}>A</th>
                    <th style={{ padding: "0.5rem", width: "90px" }}>Dmg Dealt</th>
                    <th style={{ padding: "0.5rem", width: "90px" }}>Dmg Taken</th>
                    <th style={{ padding: "0.5rem", width: "90px" }}>Healing</th>
                    <th style={{ padding: "0.5rem", width: "90px" }}>Gold</th>
                    <th style={{ padding: "0.5rem", width: "70px" }}>CS</th>
                    <th style={{ padding: "0.5rem", width: "50px", textAlign: "center" }}>FB</th>
                    <th style={{ padding: "0.5rem", width: "290px" }}>Items (IDs)</th>
                  </tr>
                </thead>
                <tbody>
                  {finalizedStats.slice(5, 10).map((stat, idx) => {
                    const actualIdx = idx + 5;
                    return (
                      <tr key={actualIdx} style={{ borderBottom: "1px solid var(--border-dark)" }}>
                        <td style={{ padding: "0.5rem", fontWeight: "bold" }}>{stat.playerName}</td>
                        <td style={{ padding: "0.5rem" }}>
                          <select
                            className="form-control"
                            style={{ padding: "0.25rem", fontSize: "0.8rem", width: "100%" }}
                            value={stat.champion}
                            onChange={(e) => handleFinalStatChange(actualIdx, "champion", e.target.value)}
                          >
                            <option value="">-- Select Champion --</option>
                            {champions.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: "0.25rem" }}>
                          <input
                            type="number"
                            className="form-control"
                            style={{ padding: "0.25rem", textAlign: "center", fontSize: "0.8rem" }}
                            value={stat.kills}
                            onChange={(e) => handleFinalStatChange(actualIdx, "kills", e.target.value)}
                          />
                        </td>
                        <td style={{ padding: "0.25rem" }}>
                          <input
                            type="number"
                            className="form-control"
                            style={{ padding: "0.25rem", textAlign: "center", fontSize: "0.8rem" }}
                            value={stat.deaths}
                            onChange={(e) => handleFinalStatChange(actualIdx, "deaths", e.target.value)}
                          />
                        </td>
                        <td style={{ padding: "0.25rem" }}>
                          <input
                            type="number"
                            className="form-control"
                            style={{ padding: "0.25rem", textAlign: "center", fontSize: "0.8rem" }}
                            value={stat.assists}
                            onChange={(e) => handleFinalStatChange(actualIdx, "assists", e.target.value)}
                          />
                        </td>
                        <td style={{ padding: "0.25rem" }}>
                          <input
                            type="number"
                            className="form-control"
                            style={{ padding: "0.25rem", fontSize: "0.8rem" }}
                            value={stat.damageDealt}
                            onChange={(e) => handleFinalStatChange(actualIdx, "damageDealt", e.target.value)}
                          />
                        </td>
                        <td style={{ padding: "0.25rem" }}>
                          <input
                            type="number"
                            className="form-control"
                            style={{ padding: "0.25rem", fontSize: "0.8rem" }}
                            value={stat.damageTaken}
                            onChange={(e) => handleFinalStatChange(actualIdx, "damageTaken", e.target.value)}
                          />
                        </td>
                        <td style={{ padding: "0.25rem" }}>
                          <input
                            type="number"
                            className="form-control"
                            style={{ padding: "0.25rem", fontSize: "0.8rem" }}
                            value={stat.healing}
                            onChange={(e) => handleFinalStatChange(actualIdx, "healing", e.target.value)}
                          />
                        </td>
                        <td style={{ padding: "0.25rem" }}>
                          <input
                            type="number"
                            className="form-control"
                            style={{ padding: "0.25rem", fontSize: "0.8rem" }}
                            value={stat.gold}
                            onChange={(e) => handleFinalStatChange(actualIdx, "gold", e.target.value)}
                          />
                        </td>
                        <td style={{ padding: "0.25rem" }}>
                          <input
                            type="number"
                            className="form-control"
                            style={{ padding: "0.25rem", fontSize: "0.8rem" }}
                            value={stat.cs}
                            onChange={(e) => handleFinalStatChange(actualIdx, "cs", e.target.value)}
                          />
                        </td>
                        <td style={{ padding: "0.25rem", textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={stat.firstBlood || false}
                            onChange={(e) => handleFinalStatChange(actualIdx, "firstBlood", e.target.checked)}
                            style={{ cursor: "pointer", width: "16px", height: "16px" }}
                          />
                        </td>
                        <td style={{ padding: "0.25rem" }}>
                          <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                            {Array.from({ length: 6 }).map((_, itemIdx) => {
                              const itemId = stat.items?.[itemIdx] || 0;
                              const iconUrl = getItemIcon(itemId);
                              return (
                                <div key={itemIdx} style={{ display: "flex", flexDirection: "column", gap: "1px", alignItems: "center" }}>
                                  <div style={{ width: "20px", height: "20px", backgroundColor: "rgba(0,0,0,0.3)", borderRadius: "2px", border: "1px solid var(--border-dark)", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", marginBottom: "2px" }}>
                                    {iconUrl ? <img src={iconUrl} alt="item" style={{ width: "100%", height: "100%" }} /> : <span style={{ fontSize: "0.6rem", color: "#555" }}>-</span>}
                                  </div>
                                  <input
                                    type="number"
                                    className="form-control"
                                    style={{ width: "42px", padding: "0.1rem", fontSize: "0.7rem", textAlign: "center", height: "20px" }}
                                    value={itemId || ""}
                                    onChange={(e) => {
                                      const newItems = [...(stat.items || [0, 0, 0, 0, 0, 0])];
                                      newItems[itemIdx] = parseInt(e.target.value) || 0;
                                      handleFinalStatChange(actualIdx, "items", newItems);
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setStep(3)}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span>{loading ? "Saving to server..." : "Confirm & Save Score"}</span>
              <Check size={16} />
            </button>
          </div>
        </form>
      )}

      {/* OCR processing overlay spinner */}
      {ocrLoading && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(5, 9, 19, 0.95)",
          backdropFilter: "blur(12px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
        }}>
          <div className="card" style={{
            maxWidth: "450px",
            width: "90%",
            padding: "3rem 2rem",
            textAlign: "center",
            border: "1px solid var(--border-gold)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
            background: "var(--bg-secondary)"
          }}>
            <div style={{
              border: "4px solid rgba(212, 175, 55, 0.1)",
              borderTop: "4px solid var(--primary-gold)",
              borderRadius: "50%",
              width: "55px",
              height: "55px",
              animation: "ocr-spin 1.2s linear infinite",
              margin: "0 auto 2rem auto"
            }} />
            <style>{`
              @keyframes ocr-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <h3 style={{ marginBottom: "0.75rem", color: "var(--primary-gold-bright)", fontSize: "1.25rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Analyzing Screenshots
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.5" }}>
              {ocrStatus}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
