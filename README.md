# VNG Corporate LoL Cup 2026 - Tournament Portal

This is a premium, esports-themed web portal for managing a company League of Legends tournament. It includes real-time dashboards, standings, schedule calendars, an interactive knockout bracket, post-game scoreboard statistics, and an admin coordinator panel with automatic Riot lobby code generation and webhook simulators.

Built using **Next.js (App Router)** and styled entirely with **Vanilla CSS**, it is designed to be highly responsive for both mobile and desktop screens. It supports both **Firebase Realtime Database** for production hosting and a fallback **Mock Mode (LocalStorage)** for local development and offline previewing.

---

## 🚀 Getting Started

### 1. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/HungVdn/gg-lol-tournament.git
cd gg-lol-tournament
npm install
```

### 2. Local Environment Setup
By default, the application runs in **Mock Mode** using the browser's `localStorage` to simulate database records (no Firebase setup required).

If you want to connect a live **Firebase Realtime Database & Authentication** service:
1. Rename `.env.local.example` to `.env.local`.
2. Enter your Firebase config credentials.
3. Add your Riot Developer API Key to `RIOT_API_KEY`.
   *(A valid Riot API Key is pre-configured in `.env.local` for your convenience).*

### 3. Launch Development Server
Start the local server:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🛡️ Admin Panel & Authentication
To manage matches, teams, generate Riot tournament codes, and record scores:
1. Go to the login gate at **[http://localhost:3000/admin](http://localhost:3000/admin)**.
2. In Mock Mode, use these preloaded mock coordinator credentials:
   - **Email:** `admin@vng.com`
   - **Password:** `admin`
3. Logging in reveals controls to register teams, adjust rosters, modify schedules, and manage scores.

---

## 🏆 Key Features & Verification Steps

* **Leaderboard & Stands:** Features Group A and Group B standings tables with automatic tiebreaker sorting (Points > Game Record > Game Wins > Alphabetical). Standing rows slide up or down dynamically on score changes.
* **Knockout Bracket:** Interactive visual tournament tree connecting Semifinal matches to the Grand Finals and Bronze Match.
* **Match Scorecard Stats:** Completed matches display an **"Inspect Match Stats"** button opening an overlay dashboard. It pulls official champion portraits and item assets directly from Riot's public CDN, tracking player K/D/A, vision score, objectives, and damage charts.
* **Lobby Code Generator (Riot API):** Coordinator dashboard allows requesting tournament draft codes dynamically from Riot's servers.
* **Webhook Simulator:** Simulate post-game match completion events directly inside the admin panel. Triggering it updates scores, saves detailed player telemetry, and updates standings instantly.

---

## 📄 Project Documentation
Full documentation is committed in the `/docs` folder:
- **[docs/implementation_plan.md](file:///Users/ma108/Documents/antigravity/busy-bose/docs/implementation_plan.md)**: Architectural structure and database schemas.
- **[docs/task.md](file:///Users/ma108/Documents/antigravity/busy-bose/docs/task.md)**: Project checklist and completion history.
- **[docs/walkthrough.md](file:///Users/ma108/Documents/antigravity/busy-bose/docs/walkthrough.md)**: Walkthrough guide and testing scenarios.
