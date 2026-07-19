# 🏆 Gear Games LoL Cup 2026

An esports-themed, responsive tournament portal for managing and displaying League of Legends matches, team standings, brackets, and detailed player statistics.

Built on **Next.js (App Router)** and styled with **Vanilla CSS**, this portal provides a visual dashboard for players and coordinators, supporting both local mock development and live Firebase databases.

---

## 🚀 Key Features

* **Real-Time Leaderboards & Standings**
  * Auto-calculated standings for Group A and Group B.
  * Sorts automatically based on tournament rules: Points → Game Record → Game Wins → Alphabetical.
  * Standings list animates dynamically when scores change.

* **Interactive Knockout Bracket**
  * A custom visual tournament tree connecting Semifinals, Grand Finals, and the Bronze Match.
  * Real-time bracket advancement based on match completions.

* **Inspect Match Scorecard Stats**
  * Interactive overlay modal displaying post-game telemetry for completed matches.
  * Fetches champion portraits, spells, and items directly from the official Riot Data Dragon CDN.
  * Tracks player K/D/A, Gold, CS, Vision Score, and visual Damage Dealt/Taken charts.

* **Support-Focused Healing Calculation**
  * To honor support/utility players, the scoreboard's **healing** statistic is calculated specifically as:
    $$\text{Healing Stat} = \text{Ally Healing} + \text{Ally Shielding}$$
  * Self-healing (`Damage Healed`) is intentionally excluded.

* **Gemini Flash Screenshot OCR Wizard**
  * In the score submission dashboard, coordinators can upload 3 post-game screenshots (Scoreboard, Damage Dealt, and Damage Taken/Healed).
  * The system uses Gemini Vision to automatically read the screenshots, sum the correct ally heal/shield stats, and fuzzy-match the players to registration rosters.

* **Admin Coordinator Dashboard (`/admin`)**
  * Secure admin gate for managers.
  * Credentials for mock coordinator mode:
    * **Email:** `admin@geargames.com`
    * **Password:** `admin`
  * Lobby Code Generator: Requests official tournament draft lobby codes directly from Riot's servers.
  * Webhook Simulator: Simulates a match-completed callback payload to test real-time statistics updating.

---

## 🛠️ Tech Stack & Integrations

* **Core:** Next.js 16 (App Router), React 19, Framer Motion
* **Styling:** Vanilla CSS (Tailored dark theme, glassmorphism, responsive grid layouts)
* **OCR engine:** Gemini Flash API
* **Database Modes:**
  * **Mock Mode (Default):** Saves data to the browser's `localStorage` for quick local development.
  * **Production Mode:** Integrates with Firebase Realtime Database & Firebase Authentication.
* **Imports supported:**
  * **LCU Import:** Direct import of League Client Update JSON match file.
  * **Riot API Match-v5 Import:** Direct match sync using a Riot Developer Match ID.

---

## 💻 Getting Started

### 1. Installation
Clone the repository and install npm packages:
```bash
git clone https://github.com/HungVdn/gg-lol-tournament.git
cd gg-lol-tournament
npm install
```

### 2. Environment Configurations
Rename `.env.local.example` to `.env.local` and configure your credentials:
```ini
# Firebase Config (Optional - only if NEXT_PUBLIC_MOCK_MODE=false)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_firebase_db_url
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id

# Riot Developer API Credentials
RIOT_API_KEY=your_riot_developer_api_key

# Gemini API Key (Required for Screenshot OCR)
GEMINI_API_KEY=your_gemini_api_key

# Development mode selector
NEXT_PUBLIC_MOCK_MODE=true
```

### 3. Launch Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📄 Project Documentation

* **[docs/implementation_plan.md](file:///c:/Users/Admin/Documents/GitHub/gg-lol-tournament/docs/implementation_plan.md)**: Architectural patterns and DB structure.
* **[docs/task.md](file:///c:/Users/Admin/Documents/GitHub/gg-lol-tournament/docs/task.md)**: Implementation checklist.
* **[docs/walkthrough.md](file:///c:/Users/Admin/Documents/GitHub/gg-lol-tournament/docs/walkthrough.md)**: Testing walkthrough.
