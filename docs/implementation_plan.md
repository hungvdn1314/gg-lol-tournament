# Implementation Plan - Riot Tournament API Integration

This document details the architectural and code changes to integrate Riot Games' Tournament-v5 endpoints, enabling automatic lobby codes and post-game webhooks.

## User Review Required

> [!IMPORTANT]
> **Riot Developer Key Access:**
> - To make real production requests, you must register a **Personal Project** on the [Riot Developer Portal](https://developer.riotgames.com/) and request access to the `Tournament-v5` endpoints.
> - Because Riot's webhooks require a public URL, they cannot hit `localhost:3000` directly. 
> - **Local Testing Strategy:** We will add a **"Simulate Webhook"** dashboard in the Admin Panel. This will simulate a webhook call with full mock game telemetry so you can verify the standings update and detailed stats UI locally without needing a live webhook or tunnel (like ngrok).

---

## Technical Architecture & Database Updates

### Database Schema Updates
We will add two new nodes to represent tournament codes and detailed analytics:
1. `matches/{matchId}/tournamentCode`: String (holds the generated Riot draft code).
2. `matchDetails/{matchId}`: Deep statistics object populated by the webhook:
   ```json
   {
     "gameDuration": 1820,
     "teams": {
       "100": { "winner": true, "bans": ["Teemo", "Zed"], "barons": 1, "dragons": 2, "firstBlood": true },
       "200": { "winner": false, "bans": ["Yasuo", "Yuumi"], "barons": 0, "dragons": 1, "firstBlood": false }
     },
     "participants": [
       {
         "playerName": "Faker",
         "teamId": 100,
         "champion": "Azir",
         "kills": 5, "deaths": 1, "assists": 8,
         "gold": 12400, "cs": 220, "vision": 35,
         "damageDealt": 28400,
         "items": [3006, 6655, 3089, 3157, 0, 0]
       }
     ]
   }
   ```

---

## Proposed Changes

### 1. Backend Server Routes (Next.js API)
#### [NEW] [route.js](file:///Users/ma108/Documents/antigravity/busy-bose/src/app/api/tournament-code/route.js)
POST endpoint triggered by the Admin Panel to request a tournament code from Riot's endpoint:
`POST https://americas.api.riotgames.com/lol/tournament/v5/codes`
It updates the corresponding match in Firebase with the generated code.

#### [NEW] [route.js](file:///Users/ma108/Documents/antigravity/busy-bose/src/app/api/riot-webhook/route.js)
POST endpoint representing the webhook listener. When Riot sends the match report:
1. It validates the request header token.
2. It fetches full match details from the Riot SEA match API:
   `GET https://sea.api.riotgames.com/lol/match/v5/matches/{matchId}`
3. It sets the match score and status to "completed" in Firebase.
4. It saves the deep analytical data into `matchDetails/{matchId}`.
5. It runs `recalculateLeaderboard()` to update group standings automatically.

---

### 2. Frontend Updates & UI
#### [MODIFY] [page.js](file:///Users/ma108/Documents/antigravity/busy-bose/src/app/schedule/page.js)
- If a match is scheduled and has a `tournamentCode`, show a **"Copy Invite Code"** button.
- If a match is completed and has a `matchDetails` record, show an **"Inspect Match Stats"** button. Clicking this will expand to show a detailed esports post-game card (showing champion picks, items purchased, damage-dealt comparison charts, and team objectives).

#### [MODIFY] [page.js](file:///Users/ma108/Documents/antigravity/busy-bose/src/app/admin/page.js)
- Add a **"Riot Integration"** tab.
- Allow the admin to register the Provider ID and Tournament ID (Step 3.1) and generate tournament codes.
- Add a **"Simulate Riot Webhook"** dashboard. Clicking this sends mock game results (featuring typical stats and champion lineups) directly to `/api/riot-webhook` to test the entire processing pipeline locally.

#### [MODIFY] [db.js](file:///Users/ma108/Documents/antigravity/busy-bose/src/lib/db.js)
Add helper functions to fetch/save `matchDetails`.

---

## Verification Plan

### Automated Tests
- Check that `npm run build` compiles with the new API routes.

### Manual Verification
1. Open the Admin Panel, select the **Riot Integration** tab, and enter a placeholder developer token.
2. Generate a code for a scheduled match. Verify it is saved and shown as a copyable badge in the schedule page.
3. Open the **Simulate Webhook** dashboard and click "Simulate Match Complete".
4. Verify that:
   - The match updates to "completed" with the correct score.
   - Standings are recalculated and teams adjust on the Leaderboard.
   - The Schedule page now displays the **"Inspect Match Stats"** button, showing player metrics, champion icons, and items.
