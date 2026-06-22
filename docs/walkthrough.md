# Walkthrough - LoL Tournament Web Portal

We have successfully initialized, coded, and verified the League of Legends tournament web portal. The project compiles without errors and runs in **Mock Mode** using browser `localStorage` by default (enabling instant previews). Once Firebase credentials are provided in a `.env.local` file, the portal seamlessly links to a live production database.

---

## Technical Accomplishments & Changes

1. **Next.js & React Framework:** Implemented using the App Router with standalone pages:
   - **Home (`/`):** Hero showcase, countdown widget to the next match, live match banner, recent results, and upcoming schedules.
   - **Teams (`/teams`):** Cards displaying rosters (Top, Jungle, Mid, ADC, Support roles) and detailed statistics.
   - **Schedule (`/schedule`):** Chronological, filterable calendars (All, Live, Scheduled, Completed). Includes tournament draft codes for copy/paste and an **Inspect Match Stats** button to open detailed game scorecards.
   - **Leaderboard (`/leaderboard`):** Stands for Group A and Group B. Features a 3D Podium for overall Top 1, 2, and 3. Table rows dynamically slide up/down on update using `framer-motion`.
   - **Bracket (`/bracket`):** Single-elimination championship tree connecting Semifinals to Grand Finals and 3rd Place Match.
   - **Admin Panel (`/admin`):** Coordinator dashboard to manage configurations, edit teams/rosters, schedule games, generate Riot tournament codes, and simulate Riot match-completion webhooks.
2. **Riot Games Tournament Integration:**
   - **Lobby Code API Route (`/api/tournament-code`):** Server endpoint that requests custom tournament codes dynamically using the provided Riot API Key.
   - **Match Webhook API Route (`/api/riot-webhook`):** Server endpoint that receives callback payloads from Riot, queries match details from Riot CDN/APIs, updates match scores, saves item builds/KDAs/objectives, and recalculates leaderboards.
   - **Data Dragon CDN Assets:** Resolves champion and item images directly from Riot’s official public CDN (`ddragon.leagueoflegends.com`) dynamically based on game stats.
3. **ESports Design System (`globals.css`):** Styled from scratch using pure Vanilla CSS. Adheres to a premium dark theme (`#080A0C` background, `#E4B33C` gold accent color, `#FFFFFF` headers, glassmorphism panel outlines, and responsive hamburger navigations).
4. **Dual-Mode Data Client (`db.js` & `firebase.js`):** Unified CRUD APIs that sync to Firebase Realtime Database when configured, or store data in browser `localStorage` as a fallback.

---

## Running and Previewing Locally

### 1. Launch the Server
To start the Next.js development server, run the following command in your terminal inside the project directory:
```bash
npm run dev
```
Once started, open your browser and navigate to:
[http://localhost:3000](http://localhost:3000)

### 2. Access the Admin Control Panel
1. Click **Login** in the top navigation bar or go directly to [http://localhost:3000/admin](http://localhost:3000/admin).
2. Since the app runs in **Mock Mode** by default, use the following preloaded credentials:
   - **Email:** `admin@vng.com`
   - **Password:** `admin`
3. Click **Login** to enter the coordinator dashboard.

---

## Verification Scenarios to Try

> [!TIP]
> **Generating Lobby Codes:**
> Go to **Admin Panel > Riot Tournament API** tab. Select an upcoming scheduled match and click **Generate Invite Code**. Navigate to the **Schedule** page. The match will now display a golden code box. Click **Copy Code** to copy the invite code to your clipboard.

> [!IMPORTANT]
> **Webhook Simulation (Score & Stats Populator):**
> 1. Go to **Admin Panel > Riot Tournament API** tab.
> 2. Under **Riot Webhook Simulator**, select any upcoming match (e.g. *T1 Dynasty vs Gen.G Legends*).
> 3. Select a simulated winning team (Blue Side or Red Side) and click **Trigger Simulated Webhook**.
> 4. In Mock Mode, this immediately simulates a Riot post-game payload client-side, saves item and champion statistics, increments the series score, and recalculates the standings.
> 5. Go to the **Schedule** page, find the completed match, and click **Inspect Match Stats**. A premium post-game scorecard modal will pop up showing the champion images, KDA records, items bought, objectives captured, and a damage-dealt comparison chart!

---

## Deployment to Vercel

The application is structured to be 100% compatible with Vercel deployment:
1. Push this codebase to your GitHub repository.
2. Link the repository to your Vercel Account.
3. In Vercel's **Environment Variables** configuration section, enter the Firebase credentials matching `.env.local.example` and your **Riot API Key**:
   - `RIOT_API_KEY`: `RGAPI-7888d889-061f-4813-b604-8c22a092d5a7`
4. Vercel will automatically build the production bundle (`next build`) and deploy it to a live production server.
