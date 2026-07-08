"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { subscribeToData, submitCaptainGameScore } from "@/lib/db";
import { getLatestDDragonVersion } from "@/lib/riot";
import { CheckCircle2, ShieldAlert, Award, Eye, Clock, Upload, ArrowRight } from "lucide-react";

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
        vision: isWinner ? 15 : 10,
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
              <div style={{ marginTop: "1rem", border: "1px solid var(--border-dark)", borderRadius: "4px", padding: "0.5rem", backgroundColor: "#000", display: "inline-block", maxWidth: "200px" }}>
                <img src={screenshot} alt="Preview" style={{ width: "100%", height: "auto", display: "block", borderRadius: "2px" }} />
              </div>
            )}
          </div>

          {/* Section 3: Player stats tracking */}
          {selectedMatch && Object.keys(playerStats).length > 0 && (
            <div style={{ marginBottom: "2.5rem" }}>
              <h3 style={{ borderBottom: "1px solid var(--border-dark)", paddingBottom: "0.5rem", marginBottom: "1.5rem", fontSize: "1.1rem", color: "var(--primary-gold-bright)" }}>
                3. Player Champions & KDA (Optional)
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.5rem", lineHeight: "1.4" }}>
                Entering player statistics helps feed player profile dashboards and overall tournament leaderboard stats. If left empty, default values will be logged.
              </p>

              <div className="grid-2">
                {/* Team A stats */}
                <div>
                  <h4 style={{ color: "#00d2ff", marginBottom: "1rem", textTransform: "uppercase", fontSize: "0.9rem", borderBottom: "2px solid #005b70", paddingBottom: "0.25rem" }}>
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
      </div>
    </div>
  );
}
