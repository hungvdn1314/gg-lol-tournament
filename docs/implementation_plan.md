# Implementation Plan: Riot Match Import Tool

This plan describes how we will implement a Riot Match Import feature. Because Riot's Tournament Stub codes (`STUB-...`) are not accepted by the Vietnam (VN2) game client, players must play regular custom games in the client. This tool allows the administrator to fetch and sync the results of those custom games using any participant's Riot ID.

## Proposed Changes

### 1. Backend Import Route
#### [NEW] [route.js](file:///c:/Users/Admin/Documents/GitHub/gg-lol-tournament/src/app/api/riot-import/route.js)
We will create a new API route `POST /api/riot-import` that:
1. Receives the `matchId` and `playerRiotId` (e.g. `IrrationaL\u8903\u5b50#1337`).
2. Looks up the player's account details on `asia.api.riotgames.com` to retrieve their `puuid`.
3. Fetches the player's 5 most recent custom games from `sea.api.riotgames.com/lol/match/v5/matches/by-puuid/{puuid}/ids?count=5`.
4. Retrieves the latest match details from `sea.api.riotgames.com/lol/match/v5/matches/{matchId}`.
5. Maps the game's metrics (winner, game duration, champion, kills/deaths/assists, damage dealt, creep score, vision, items, team objectives).
6. Updates the database (LocalStorage in mock mode, Firebase in production) with the score, match details, bracket advancement, and triggers standings recalculation.

---

### 2. Admin UI Updates
#### [MODIFY] [page.js](file:///c:/Users/Admin/Documents/GitHub/gg-lol-tournament/src/app/admin/page.js)
We will add a new sub-tab under "Riot Tournament API" called **Manual Riot Match Sync**:
* Displays input fields for:
  - **Select Match:** A dropdown of scheduled/live matches.
  - **Player Riot ID:** E.g., `IrrationaL\u8903\u5b50#1337`.
* Displays a **"Fetch & Sync Match Stats"** button.
* Includes status logs and error handling notifications (e.g., "Match fetched successfully!", "Account not found", etc.).

---

### 3. Local Environment Configurations
* Verify the fallback code path handles the case when Firebase is offline (saves match data to LocalStorage client-side).

## Verification Plan

### Automated Verification
* Run `npm run build` to verify there are no Turbopack build or route errors.

### Manual Verification
1. Open the Admin Panel (`/admin`) and select the **Riot Tournament API** tab.
2. In the "Manual Riot Match Sync" section, select a scheduled match (e.g. *T1 Dynasty vs Gen.G Legends*).
3. Input player Riot ID `IrrationaL\u8903\u5b50#1337`.
4. Click **Fetch & Sync Match Stats**.
5. Verify that:
   - The match status changes to `completed`.
   - The standings table on the Leaderboard recalculates.
   - The Schedule page shows **Inspect Match Stats** with the actual game details (duration, champion picks, CS, items, visual damage bars) from your real game!
