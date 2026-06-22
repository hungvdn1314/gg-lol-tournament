# Walkthrough: Riot Match Import Tool

We have implemented the **Riot Match Import** tool. This tool allows tournament coordinators to import actual game data from custom matches played in the League of Legends client into the tournament portal. This provides a direct, one-click replacement for automatic webhooks (which are not supported in client by the Riot Tournament Stub API on the VN2/Vietnam server).

---

## 🛠️ Changes Implemented

1. **New Backend Route:** Created [api/riot-import/route.js](file:///c:/Users/Admin/Documents/GitHub/gg-lol-tournament/src/app/api/riot-import/route.js) to resolve Riot IDs, fetch match histories, load match details from `sea.api.riotgames.com`, parse the results, and either save them (production Firebase mode) or return them to the client (mock mode).
2. **Updated Admin Dashboard UI:** Modified [src/app/admin/page.js](file:///c:/Users/Admin/Documents/GitHub/gg-lol-tournament/src/app/admin/page.js) to add the **Manual Riot Match Sync** card and form inputs for selecting a match and entering a Riot ID.
3. **Mock Mode Client-Side Persistence:** Programmed a fallback path in the admin page handler that writes the imported match data and updates series scores directly into the browser's `localStorage` when running in Mock Mode, ensuring standings update instantly.

---

## 🚀 How to Verify the Feature

### Step 1: Open the Admin Dashboard
1. Go to [http://localhost:3000/admin](http://localhost:3000/admin) in your browser.
2. Log in using the mock credentials:
   - **Email:** `admin@vng.com`
   - **Password:** `admin`

### Step 2: Sync Match Stats
1. Click the **Riot Tournament API** tab.
2. Under **Manual Riot Match Sync**, configure the form:
   - **Select Target Match:** Select any upcoming scheduled match (e.g. *T1 Dynasty vs Gen.G Legends*).
   - **Participant's Riot ID:** Enter your Riot ID: `IrrationaL\u8903\u5b50#1337`.
3. Click **Sync Match Stats**.
4. The system will retrieve your real match history from Riot's servers and display a success popup indicating the winner of the game.

### Step 3: Verify the Leaderboard & Schedule
1. Open the **Schedule** page (`/schedule`). You will see the match series score update.
2. Click **Inspect Match Stats** on the completed match. You will see champion icons, item builds, KDAs, and creep score loaded directly from your real custom game!
3. Open the **Leaderboard** page (`/leaderboard`) to check that group standings and team points have been automatically updated.
