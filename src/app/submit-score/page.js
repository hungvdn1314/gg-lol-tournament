"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { subscribeToData, submitCaptainGameScore } from "@/lib/db";
import { getLatestDDragonVersion } from "@/lib/riot";
import { CheckCircle2, ShieldAlert, Award, Eye, Clock, Upload, ArrowRight, Sparkles } from "lucide-react";
import { parseOcrText } from "@/lib/ocr";

export default function SubmitScore() {
  const router = useRouter();
  const [config, setConfig] = useState(null);
  const [matches, setMatches] = useState({});
  const [teams, setTeams] = useState({});
  const [champions, setChampions] = useState([]);
  
  // Form states
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [gameIndex, setGameIndex] = useState(0);
  const [winnerSide, setWinnerSide] = useState(100); // 100 for Blue, 200 for Red
  const [gameDuration, setGameDuration] = useState("20:00");
  const [passcode, setPasscode] = useState("");
  const [screenshot, setScreenshot] = useState("");
  const [screenshotFileName, setScreenshotFileName] = useState("");
  const [playerStats, setPlayerStats] = useState({}); // { playerName: { champion: "", kills: 0, deaths: 0, assists: 0 } }
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // OCR States
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrResults, setOcrResults] = useState(null);

  useEffect(() => {
    const unsubConfig = subscribeToData("config", setConfig);
    const unsubMatches = subscribeToData("matches", setMatches);
    const unsubTeams = subscribeToData("teams", setTeams);

    // Fetch champion list from DDragon
    getLatestDDragonVersion().then(async (version) => {
      try {
        const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`);
        if (res.ok) {
          const data = await res.json();
          const list = Object.values(data.data).map(c => c.id).sort();
          setChampions(list);
        }
      } catch (e) {
        console.error("Error loading champions list:", e);
      }
    });

    return () => {
      unsubConfig();
      unsubMatches();
      unsubTeams();
    };
  }, []);

  const selectedMatch = selectedMatchId ? matches[selectedMatchId] : null;
  const teamA = selectedMatch ? teams[selectedMatch.teamAId] : null;
  const teamB = selectedMatch ? teams[selectedMatch.teamBId] : null;

  // Initialise player stats when match selection changes
  useEffect(() => {
    if (selectedMatch && teamA && teamB) {
      const stats = {};
      const teamAPlayers = teamA.players || [];
      const teamBPlayers = teamB.players || [];

      teamAPlayers.forEach(p => {
        stats[p.name] = { teamId: 100, champion: "", kills: 0, deaths: 0, assists: 0 };
      });
      teamBPlayers.forEach(p => {
        stats[p.name] = { teamId: 200, champion: "", kills: 0, deaths: 0, assists: 0 };
      });
      setPlayerStats(stats);
    } else {
      setPlayerStats({});
    }
  }, [selectedMatchId, teams]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setScreenshotFileName(file.name);
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

        // Compress image using JPEG format with 0.7 quality
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        setScreenshot(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handlePlayerStatChange = (playerName, field, val) => {
    setPlayerStats(prev => ({
      ...prev,
      [playerName]: {
        ...prev[playerName],
        [field]: val
      }
    }));
  };

  const runOcrOnScreenshot = async () => {
    if (!screenshot) return;
    setOcrLoading(true);
    setOcrStatus("Initializing OCR Engine...");
    setOcrProgress(0);

    try {
      // Dynamic import of tesseract.js for performance optimization
      const Tesseract = (await import("tesseract.js")).default;
      
      setOcrStatus("Processing image...");
      
      const result = await Tesseract.recognize(
        screenshot,
        "eng",
        {
          logger: (m) => {
            if (m.status === "recognizing text") {
              setOcrStatus(`Extracting text... ${Math.round(m.progress * 100)}%`);
              setOcrProgress(m.progress);
            } else {
              // Map nice status descriptions
              const statusMap = {
                "loading tesseract core": "Loading OCR Engine Core...",
                "initializing tesseract": "Initializing OCR Engine...",
                "initialized tesseract": "OCR Engine Ready.",
                "loading language traineddata": "Loading Language Dictionary...",
                "loaded language traineddata": "Language Dictionary Loaded.",
                "initializing api": "Starting Text Reader...",
                "initialized api": "Text Reader Started."
              };
              setOcrStatus(statusMap[m.status] || m.status);
            }
          }
        }
      );

      const text = result.data.text;
      console.log("OCR Extracted Text:\n", text);

      const parsed = parseOcrText(text, teamA, teamB, champions);
      setOcrResults(parsed);
    } catch (err) {
      console.error("OCR Error:", err);
      setErrorMsg(`OCR recognition failed: ${err.message}. You can still fill stats manually.`);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleOcrResultStatChange = (playerName, field, val) => {
    setOcrResults(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        playerStats: {
          ...prev.playerStats,
          [playerName]: {
            ...prev.playerStats[playerName],
            [field]: field === "champion" ? val : (val === "" ? 0 : parseInt(val) || 0)
          }
        }
      };
    });
  };

  const applyOcrResults = () => {
    if (!ocrResults) return;
    if (ocrResults.gameDuration) {
      setGameDuration(ocrResults.gameDuration);
    }
    setPlayerStats(ocrResults.playerStats);
    setOcrResults(null);
    
    // Auto-scroll to stats section
    setTimeout(() => {
      const statsSection = document.getElementById("stats-section-heading");
      if (statsSection) {
        statsSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    if (!selectedMatchId) {
      setErrorMsg("Please select a target match.");
      setLoading(false);
      return;
    }
    if (!screenshot) {
      setErrorMsg("Please upload the end-game score screenshot.");
      setLoading(false);
      return;
    }

    // Passcode check
    const expectedPasscode = config?.captainPasscode || "aram2026";
    if (passcode.trim() !== expectedPasscode.trim()) {
      setErrorMsg("Invalid Captain Passcode. Please coordinate with the admin.");
      setLoading(false);
      return;
    }

    // Game duration parsing
    const durationParts = gameDuration.split(":");
    let durationSeconds = 1200; // default 20 mins
    if (durationParts.length === 2) {
      const mins = parseInt(durationParts[0]);
      const secs = parseInt(durationParts[1]);
      if (!isNaN(mins) && !isNaN(secs)) {
        durationSeconds = mins * 60 + secs;
      }
    }

    // Construct participant objects
    const participants = Object.entries(playerStats).map(([name, stats]) => {
      const isWinner = stats.teamId === parseInt(winnerSide);
      return {
        playerName: name,
        teamId: stats.teamId,
        champion: stats.champion || "TBD",
        win: isWinner,
        kills: parseInt(stats.kills) || 0,
        deaths: parseInt(stats.deaths) || 0,
        assists: parseInt(stats.assists) || 0,
        gold: isWinner ? 12000 : 9000, // mock fallback gold
        cs: isWinner ? 110 : 80, // mock fallback cs
        damageDealt: (parseInt(stats.kills) || 0) * 2000 + 8000, // mock approximate damage
        damageTaken: isWinner ? 12000 : 18000,
        healing: 1500,
        items: [0, 0, 0, 0, 0, 0] // dummy items list
      };
    });

    const blueWin = parseInt(winnerSide) === 100;
    const redWin = parseInt(winnerSide) === 200;

    const gameDetails = {
      gameDuration: durationSeconds,
      screenshot,
      captainSubmission: true,
      teams: {
        100: { winner: blueWin },
        200: { winner: redWin }
      },
      participants
    };

    try {
      await submitCaptainGameScore(selectedMatchId, parseInt(gameIndex), gameDetails);
      setSuccess(true);
      window.scrollTo(0, 0);
      setTimeout(() => {
        router.push("/schedule");
      }, 3000);
    } catch (e) {
      console.error(e);
      setErrorMsg(`Submission failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container" style={{ minHeight: "60vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div className="card card-gold" style={{ maxWidth: "500px", padding: "3rem", textAlign: "center" }}>
          <CheckCircle2 size={64} style={{ color: "var(--color-success)", margin: "0 auto 1.5rem auto" }} />
          <h2 style={{ fontSize: "1.75rem", marginBottom: "1rem" }}>Score Submitted!</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            The match scores, playoff bracket status, and player stats have been updated successfully.
          </p>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block" }}>
            Redirecting you to the schedule page...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: "900px" }}>
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <span className="hero-badge" style={{ borderColor: "var(--accent-purple)", color: "var(--accent-purple)" }}>Captain Portal</span>
        <h1 style={{ fontSize: "2.5rem", textTransform: "uppercase", marginBottom: "1rem" }}>Score Submission</h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto" }}>
          Verify results for scheduled/live games by uploading the end-game scoreboard screenshot.
        </p>
      </div>

      <div className="card" style={{ padding: "2rem", border: "1px solid var(--border-gold)", background: "var(--glass-bg)", backdropFilter: "blur(12px)" }}>
        {errorMsg && (
          <div style={{ display: "flex", gap: "0.75rem", padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.08)", border: "1px solid var(--color-danger)", borderRadius: "6px", color: "var(--color-danger)", marginBottom: "2rem", fontSize: "0.9rem", alignItems: "center" }}>
            <ShieldAlert size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Match details */}
          <h3 style={{ borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.5rem", marginBottom: "1.5rem", fontSize: "1.1rem", color: "var(--primary-gold-bright)" }}>
            1. Select Match & Game Index
          </h3>
          <div className="grid-2" style={{ marginBottom: "2rem" }}>
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
                      {teams[m.teamAId]?.name || "TBD"} vs {teams[m.teamBId]?.name || "TBD"} ({m.stage})
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label>Game Index</label>
              <select
                className="form-control"
                value={gameIndex}
                onChange={(e) => setGameIndex(parseInt(e.target.value))}
                disabled={!selectedMatch}
              >
                {selectedMatch ? (
                  Array.from({ length: selectedMatch.bestOf }).map((_, idx) => (
                    <option key={idx} value={idx}>Game {idx + 1}</option>
                  ))
                ) : (
                  <option value={0}>Game 1</option>
                )}
              </select>
            </div>
          </div>

          {/* Section 2: Results & Verification */}
          <h3 style={{ borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.5rem", marginBottom: "1.5rem", fontSize: "1.1rem", color: "var(--primary-gold-bright)" }}>
            2. Match Results & Screenshot
          </h3>
          <div className="grid-2" style={{ marginBottom: "2rem" }}>
            <div className="form-group">
              <label>Game Winner</label>
              {selectedMatch ? (
                <div style={{ display: "flex", gap: "1rem" }}>
                  <button
                    type="button"
                    className={`btn ${winnerSide === 100 ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setWinnerSide(100)}
                    style={{ flex: 1, padding: "0.75rem", fontSize: "0.9rem" }}
                  >
                    {teamA?.name || "Team A (Blue)"}
                  </button>
                  <button
                    type="button"
                    className={`btn ${winnerSide === 200 ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setWinnerSide(200)}
                    style={{ flex: 1, padding: "0.75rem", fontSize: "0.9rem" }}
                  >
                    {teamB?.name || "Team B (Red)"}
                  </button>
                </div>
              ) : (
                <div style={{ color: "var(--text-muted)", fontStyle: "italic", padding: "0.5rem" }}>
                  Please select a match first.
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Game Duration (MM:SS)</label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 23:45"
                  value={gameDuration}
                  onChange={(e) => setGameDuration(e.target.value)}
                  style={{ paddingLeft: "2.5rem" }}
                  required
                />
                <Clock size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              </div>
            </div>
          </div>

          {/* Screenshot upload with canvas compression */}
          <div className="form-group" style={{ marginBottom: "2rem" }}>
            <label>End Game Score Screen Capture</label>
            <div 
              style={{ 
                border: "2px dashed var(--border-gold)", 
                borderRadius: "8px", 
                padding: "2rem", 
                textAlign: "center", 
                backgroundColor: "var(--bg-tertiary)",
                position: "relative",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) {
                  const input = document.getElementById("screenshot-upload-input");
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
                id="screenshot-upload-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
              />
              <Upload size={32} style={{ color: "var(--primary-gold)", marginBottom: "1rem" }} />
              <div style={{ fontWeight: "700", marginBottom: "0.5rem" }}>
                {screenshotFileName ? screenshotFileName : "Drag and drop or browse screenshot"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Supports PNG, JPG, JPEG. Image will be compressed client-side to save database space.
              </div>
            </div>
            {screenshot && (
              <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", marginTop: "1rem", backgroundColor: "rgba(11, 28, 51, 0.3)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-dark)", flexWrap: "wrap" }}>
                <div style={{ border: "1px solid var(--border-gold)", borderRadius: "4px", padding: "0.25rem", backgroundColor: "#000", display: "inline-block", maxWidth: "150px" }}>
                  <img src={screenshot} alt="Preview" style={{ width: "100%", height: "auto", display: "block", borderRadius: "2px" }} />
                </div>
                <div style={{ flex: "1 1 300px" }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={runOcrOnScreenshot}
                    disabled={ocrLoading || !selectedMatchId}
                    style={{
                      background: !selectedMatchId 
                        ? "var(--bg-tertiary)" 
                        : "linear-gradient(135deg, #7b2cbf 0%, #3bf0ff 100%)",
                      color: !selectedMatchId ? "var(--text-muted)" : "#fff",
                      border: "none",
                      padding: "0.85rem 1.75rem",
                      fontSize: "0.95rem",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      boxShadow: !selectedMatchId ? "none" : "0 0 15px rgba(59, 240, 255, 0.3)",
                      cursor: !selectedMatchId ? "not-allowed" : "pointer",
                      borderRadius: "6px",
                      transition: "all 0.2s"
                    }}
                    onMouseOver={(e) => {
                      if (selectedMatchId) {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 0 25px rgba(59, 240, 255, 0.6)";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (selectedMatchId) {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "0 0 15px rgba(59, 240, 255, 0.3)";
                      }
                    }}
                  >
                    <Sparkles size={18} className={ocrLoading ? "animate-pulse" : ""} />
                    <span>✨ Auto-Detect Score & Stats (OCR)</span>
                  </button>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.6rem", lineHeight: "1.4" }}>
                    {!selectedMatchId 
                      ? "⚠️ Please select a match first to enable auto-detection." 
                      : "Scan the uploaded scoreboard image to automatically extract match duration, champion selections, and player KDA."
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Player stats tracking */}
          {selectedMatch && Object.keys(playerStats).length > 0 && (
            <div style={{ marginBottom: "2.5rem" }}>
              <h3 id="stats-section-heading" style={{ borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.5rem", marginBottom: "1.5rem", fontSize: "1.1rem", color: "var(--primary-gold-bright)" }}>
                3. Player Champions & KDA (Optional)
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.5rem", lineHeight: "1.4" }}>
                Entering player statistics helps feed player profile dashboards and overall tournament leaderboard stats. If left empty, default values will be logged.
              </p>

              <div className="grid-2">
                {/* Team A stats */}
                <div>
                  <h4 style={{ color: "var(--primary-red)", marginBottom: "1rem", textTransform: "uppercase", fontSize: "0.9rem", borderBottom: "2px solid var(--border-gold)", paddingBottom: "0.25rem" }}>
                    {teamA?.name} (Blue)
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {teamA?.players?.map((player) => (
                      <div key={player.name} style={{ backgroundColor: "var(--bg-tertiary)", padding: "1rem", borderRadius: "6px", border: "1px solid var(--border-dark)" }}>
                        <div style={{ fontWeight: "bold", fontSize: "0.85rem", marginBottom: "0.50rem", color: "var(--text-primary)" }}>{player.name}</div>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          <select
                            className="form-control"
                            style={{ flex: 1, minWidth: "100px", fontSize: "0.8rem", padding: "0.25rem" }}
                            value={playerStats[player.name]?.champion || ""}
                            onChange={(e) => handlePlayerStatChange(player.name, "champion", e.target.value)}
                          >
                            <option value="">Champion</option>
                            {champions.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <div style={{ display: "flex", gap: "4px", width: "120px", alignItems: "center" }}>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="K"
                              style={{ padding: "0.25rem", textAlign: "center", fontSize: "0.8rem" }}
                              value={playerStats[player.name]?.kills || ""}
                              onChange={(e) => handlePlayerStatChange(player.name, "kills", e.target.value)}
                            />
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>/</span>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="D"
                              style={{ padding: "0.25rem", textAlign: "center", fontSize: "0.8rem" }}
                              value={playerStats[player.name]?.deaths || ""}
                              onChange={(e) => handlePlayerStatChange(player.name, "deaths", e.target.value)}
                            />
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>/</span>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="A"
                              style={{ padding: "0.25rem", textAlign: "center", fontSize: "0.8rem" }}
                              value={playerStats[player.name]?.assists || ""}
                              onChange={(e) => handlePlayerStatChange(player.name, "assists", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team B stats */}
                <div>
                  <h4 style={{ color: "#c084fc", marginBottom: "1rem", textTransform: "uppercase", fontSize: "0.9rem", borderBottom: "2px solid #8b5cf6", paddingBottom: "0.25rem" }}>
                    {teamB?.name} (Red)
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {teamB?.players?.map((player) => (
                      <div key={player.name} style={{ backgroundColor: "var(--bg-tertiary)", padding: "1rem", borderRadius: "6px", border: "1px solid var(--border-dark)" }}>
                        <div style={{ fontWeight: "bold", fontSize: "0.85rem", marginBottom: "0.50rem", color: "var(--text-primary)" }}>{player.name}</div>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          <select
                            className="form-control"
                            style={{ flex: 1, minWidth: "100px", fontSize: "0.8rem", padding: "0.25rem" }}
                            value={playerStats[player.name]?.champion || ""}
                            onChange={(e) => handlePlayerStatChange(player.name, "champion", e.target.value)}
                          >
                            <option value="">Champion</option>
                            {champions.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <div style={{ display: "flex", gap: "4px", width: "120px", alignItems: "center" }}>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="K"
                              style={{ padding: "0.25rem", textAlign: "center", fontSize: "0.8rem" }}
                              value={playerStats[player.name]?.kills || ""}
                              onChange={(e) => handlePlayerStatChange(player.name, "kills", e.target.value)}
                            />
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>/</span>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="D"
                              style={{ padding: "0.25rem", textAlign: "center", fontSize: "0.8rem" }}
                              value={playerStats[player.name]?.deaths || ""}
                              onChange={(e) => handlePlayerStatChange(player.name, "deaths", e.target.value)}
                            />
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>/</span>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="A"
                              style={{ padding: "0.25rem", textAlign: "center", fontSize: "0.8rem" }}
                              value={playerStats[player.name]?.assists || ""}
                              onChange={(e) => handlePlayerStatChange(player.name, "assists", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Security verification */}
          <h3 style={{ borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.5rem", marginBottom: "1.5rem", fontSize: "1.1rem", color: "var(--primary-gold-bright)" }}>
            4. Captain Verification
          </h3>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "2rem" }}>
            <div className="form-group" style={{ flex: 1, minWidth: "250px" }}>
              <label>Captain Passcode</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter passcode to authorize"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ display: "flex", gap: "0.5rem", height: "45px", alignItems: "center" }}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Game Score"}
              <ArrowRight size={16} />
            </button>
          </div>
        </form>

        {/* OCR Processing Overlay */}
        {ocrLoading && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(5, 9, 19, 0.9)",
            backdropFilter: "blur(10px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}>
            <div className="card" style={{
              maxWidth: "500px",
              width: "90%",
              padding: "3rem 2rem",
              textAlign: "center",
              border: "1px solid var(--border-dark)",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
              background: "var(--bg-secondary)"
            }}>
              <div style={{
                border: "4px solid rgba(var(--primary-red-rgb), 0.1)",
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
              <h3 style={{ marginBottom: "1rem", color: "var(--primary-gold-bright)", fontSize: "1.35rem", letterSpacing: "0.08em" }}>
                Analyzing Screenshot
              </h3>
              <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "0.95rem" }}>
                {ocrStatus}
              </p>
              {ocrProgress > 0 && (
                <div style={{ width: "100%", height: "6px", backgroundColor: "var(--bg-tertiary)", borderRadius: "3px", overflow: "hidden", position: "relative" }}>
                  <div style={{
                    width: `${ocrProgress * 100}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, var(--primary-red), var(--primary-gold))",
                    transition: "width 0.25s ease-out",
                    boxShadow: "0 0 10px rgba(var(--primary-red-rgb), 0.3)"
                  }} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* OCR Results Review Modal */}
        {ocrResults && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9998,
            overflowY: "auto",
            padding: "2rem 1rem"
          }}>
            <div className="card" style={{
              maxWidth: "850px",
              width: "100%",
              padding: "2.5rem",
              border: "1px solid var(--border-dark)",
              backgroundColor: "var(--bg-secondary)",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)",
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div>
                  <h2 style={{ color: "var(--primary-gold-bright)", marginBottom: "0.25rem", fontSize: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Sparkles size={20} />
                    OCR Detection Results
                  </h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    Review and correct any misread stats before applying them to the scorecard.
                  </p>
                </div>
              </div>

              {/* Game Duration */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "var(--bg-tertiary)",
                padding: "1rem",
                borderRadius: "6px",
                border: "1px solid var(--border-dark)",
                marginBottom: "1.5rem"
              }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Detected Game Duration</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: "var(--primary-gold-bright)", marginTop: "0.25rem" }}>
                    {ocrResults.gameDuration || "Not detected"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Adjust Duration:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 21:30"
                    style={{ width: "120px", textAlign: "center", fontSize: "0.9rem", padding: "0.5rem" }}
                    value={ocrResults.gameDuration || ""}
                    onChange={(e) => setOcrResults(prev => ({ ...prev, gameDuration: e.target.value }))}
                  />
                </div>
              </div>

              {/* Players stats list */}
              <div style={{ flex: 1, overflowY: "auto", marginBottom: "2rem", paddingRight: "0.5rem" }}>
                <div className="grid-2">
                  {/* Blue Team */}
                  <div>
                    <h4 style={{ color: "var(--primary-red)", marginBottom: "1rem", textTransform: "uppercase", fontSize: "0.85rem", borderBottom: "2px solid var(--border-gold)", paddingBottom: "0.25rem", display: "flex", justifyContent: "space-between" }}>
                      <span>{teamA?.name || "Team A"} (Blue)</span>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Detected</span>
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {teamA?.players?.map(player => {
                        const stat = ocrResults.playerStats[player.name] || { champion: "", kills: 0, deaths: 0, assists: 0 };
                        return (
                          <div key={player.name} style={{ backgroundColor: "var(--bg-tertiary)", padding: "0.85rem", borderRadius: "6px", border: "1px solid var(--border-dark)" }}>
                            <div style={{ fontWeight: "bold", fontSize: "0.85rem", marginBottom: "0.6rem", color: "var(--text-primary)" }}>{player.name}</div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <select
                                className="form-control"
                                style={{ flex: 1.5, fontSize: "0.8rem", padding: "0.35rem" }}
                                value={stat.champion || ""}
                                onChange={(e) => handleOcrResultStatChange(player.name, "champion", e.target.value)}
                              >
                                <option value="">Champion</option>
                                {champions.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                              <div style={{ display: "flex", gap: "3px", width: "110px", alignItems: "center" }}>
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="K"
                                  style={{ padding: "0.35rem 0.25rem", textAlign: "center", fontSize: "0.8rem" }}
                                  value={stat.kills !== undefined ? stat.kills : ""}
                                  onChange={(e) => handleOcrResultStatChange(player.name, "kills", e.target.value)}
                                />
                                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>/</span>
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="D"
                                  style={{ padding: "0.35rem 0.25rem", textAlign: "center", fontSize: "0.8rem" }}
                                  value={stat.deaths !== undefined ? stat.deaths : ""}
                                  onChange={(e) => handleOcrResultStatChange(player.name, "deaths", e.target.value)}
                                />
                                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>/</span>
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="A"
                                  style={{ padding: "0.35rem 0.25rem", textAlign: "center", fontSize: "0.8rem" }}
                                  value={stat.assists !== undefined ? stat.assists : ""}
                                  onChange={(e) => handleOcrResultStatChange(player.name, "assists", e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Red Team */}
                  <div>
                    <h4 style={{ color: "#c084fc", marginBottom: "1rem", textTransform: "uppercase", fontSize: "0.85rem", borderBottom: "2px solid #8b5cf6", paddingBottom: "0.25rem", display: "flex", justifyContent: "space-between" }}>
                      <span>{teamB?.name || "Team B"} (Red)</span>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Detected</span>
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {teamB?.players?.map(player => {
                        const stat = ocrResults.playerStats[player.name] || { champion: "", kills: 0, deaths: 0, assists: 0 };
                        return (
                          <div key={player.name} style={{ backgroundColor: "var(--bg-tertiary)", padding: "0.85rem", borderRadius: "6px", border: "1px solid var(--border-dark)" }}>
                            <div style={{ fontWeight: "bold", fontSize: "0.85rem", marginBottom: "0.6rem", color: "var(--text-primary)" }}>{player.name}</div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <select
                                className="form-control"
                                style={{ flex: 1.5, fontSize: "0.8rem", padding: "0.35rem" }}
                                value={stat.champion || ""}
                                onChange={(e) => handleOcrResultStatChange(player.name, "champion", e.target.value)}
                              >
                                <option value="">Champion</option>
                                {champions.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                              <div style={{ display: "flex", gap: "3px", width: "110px", alignItems: "center" }}>
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="K"
                                  style={{ padding: "0.35rem 0.25rem", textAlign: "center", fontSize: "0.8rem" }}
                                  value={stat.kills !== undefined ? stat.kills : ""}
                                  onChange={(e) => handleOcrResultStatChange(player.name, "kills", e.target.value)}
                                />
                                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>/</span>
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="D"
                                  style={{ padding: "0.35rem 0.25rem", textAlign: "center", fontSize: "0.8rem" }}
                                  value={stat.deaths !== undefined ? stat.deaths : ""}
                                  onChange={(e) => handleOcrResultStatChange(player.name, "deaths", e.target.value)}
                                />
                                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>/</span>
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="A"
                                  style={{ padding: "0.35rem 0.25rem", textAlign: "center", fontSize: "0.8rem" }}
                                  value={stat.assists !== undefined ? stat.assists : ""}
                                  onChange={(e) => handleOcrResultStatChange(player.name, "assists", e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", borderTop: "1px solid var(--border-dark)", paddingTop: "1.5rem" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setOcrResults(null)}
                  style={{ padding: "0.75rem 1.5rem" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={applyOcrResults}
                  style={{
                    padding: "0.75rem 2rem",
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                    background: "linear-gradient(135deg, var(--primary-red) 0%, var(--primary-gold) 100%)",
                    border: "none",
                    boxShadow: "0 4px 15px rgba(var(--primary-red-rgb), 0.2)"
                  }}
                >
                  <span>Apply Detected Stats</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
