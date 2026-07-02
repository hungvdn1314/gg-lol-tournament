# Walkthrough: Custom Game Telemetry Integration

We have successfully integrated a local League Client Update (LCU) match stats exporter tool and a Next.js server import endpoint to track and sync custom game results for your tournament on the VN2 server.

---

## 🛠️ Changes Implemented

1. **Next.js LCU Import API Route** (`/src/app/api/lcu-import/route.js`):
   - Created a server-side endpoint that handles POST requests containing raw JSON payloads fetched from the local League client's LCU API (`/lol-match-history/v1/games/{gameId}`).
   - Fetches the latest champion name-to-id mapping from Riot's Data Dragon CDN.
   - Maps LCU's legacy nested schema structure to our Firebase/mock tournament database schema (kills, deaths, assists, damage dealt/taken, items, cs, wards, healing, cc duration, first blood).
   - Dynamically updates match scores, playoff bracket advancement, and group stage standings.

2. **Local Client Exporter Script** (`/scripts/import-lcu.mjs`):
   - Created a CLI tool that automatically searches for the local League client's `lockfile` in standard paths (macOS: `~/Library/Application Support/Riot Games/League of Legends/lockfile`, Windows: `C:\Riot Games\League of Legends\lockfile`).
   - Connects to the local client LCU API securely.
   - Retrieves your 5 most recent games, filters for custom lobby games, prints a summary (champion, KDA, win/loss), and allows you to select which game to import.
   - Prompts for the portal URL and target Match ID and Game index, then POSTs the telemetry payload.

3. **Admin Page Instructions** (`/src/app/admin/page.js`):
   - Updated the instructions banner under the **Score Center** (Tab 5) to document the LCU exporter script execution and manual override alternatives.

4. **NPM Script Hook** (`/package.json`):
   - Registered `"import-lcu": "node scripts/import-lcu.mjs"` to make executing the utility extremely easy.

---

## 🧪 Verification & Results

### Compilation Verification
We ran `npm run build` to verify the Next.js compiler correctly builds both static and dynamic routes. The build was completed successfully:

```bash
> busy-bose@0.1.0 build
> next build

▲ Next.js 16.2.9 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 1896ms
  Running TypeScript ...
  Finished TypeScript in 75ms ...
  Collecting page data using 9 workers ...
  ...
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /admin
├ ƒ /api/lcu-import
├ ƒ /api/riot-import
  ...
✓ Generating static pages using 9 workers (17/17) in 167ms
  Finalizing page optimization ...
```

---

## 📖 Instructions for Use

To sync custom lobby game results:

1. **Launch the League of Legends client** on a computer that played in the custom lobby match. Ensure you are logged in.
2. Ensure your local tournament portal server is running (or configure the URL to point to your deployed production app).
3. Open a terminal in the project root folder and execute:
   ```bash
   npm run import-lcu
   ```
4. The script will output the list of recent matches from your client. Select the index of the custom lobby match (e.g., `1` for the most recent game).
5. Enter the target **Tournament Match ID** (e.g. `match-semi1` or `match-1` which are displayed in the Admin panel) and the **Game Number** in the series (e.g. `1` for Game 1, `2` for Game 2).
6. Confirm the target portal URL (defaults to `http://localhost:3000`).
7. Press enter. The script will securely upload the telemetry, automatically update match scores, trigger bracket advancement, update standings, and save detailed player stats scorecards.
