# Implementation Plan: Comprehensive Scoreboard & Player Leaderboard Stats

This plan outlines the expansion of the post-game Match Stats Modal to collect a comprehensive dataset for each participant. By saving all relevant player stats (damage, healing, wards placed, cc duration, multikills, etc.) from the Riot Games API, we establish the database records needed to generate future player leaderboards (e.g. KDA Leaders, Vision Kings, Gold Farmers).

## Proposed Changes

### 1. Database Schema Updates (`matchDetails/{matchId}`)
We will expand the participant schema under `matchDetails/{matchId}/participants` to store the following stats:
* `win`: Boolean (whether the player won the game)
* `kills`, `deaths`, `assists`: Numbers (core KDA)
* `gold`: Number (gold earned)
* `cs`: Number (minions + neutral monsters)
* `vision`: Number (total vision score)
* `damageDealt`: Number (damage to champions)
* `damageTaken`: Number (total damage taken)
* `healing`: Number (total heal amount)
* `tripleKills`, `quadraKills`, `pentaKills`: Numbers (multikills)
* `firstBlood`: Boolean (got First Blood kill or assist)
* `controlWards`: Number (`visionWardsBoughtInGame`)
* `wardsPlaced`: Number (wards placed)
* `wardsKilled`: Number (wards destroyed)
* `turretsKilled`: Number (turrets destroyed)
* `inhibitorsKilled`: Number (inhibitors destroyed)
* `ccDuration`: Number (crowd control time dealt in seconds)

---

### 2. Backend API Updates (Riot Import, Webhook, and Simulator)
We will modify the participant mapping to extract all these fields from Riot's standard schema and update all simulation payloads so mock games also generate realistic datasets.

#### [MODIFY] [route.js](file:///c:/Users/Admin/Documents/GitHub/gg-lol-tournament/src/app/api/riot-import/route.js)
Extract all expanded fields from `info.participants`:
* `win`: `p.win`
* `healing`: `p.totalHeal`
* `damageTaken`: `p.totalDamageTaken`
* `tripleKills`: `p.tripleKills`
* `quadraKills`: `p.quadraKills`
* `pentaKills`: `p.pentaKills`
* `firstBlood`: `p.firstBloodKill || p.firstBloodAssist`
* `controlWards`: `p.visionWardsBoughtInGame`
* `wardsPlaced`: `p.wardsPlaced`
* `wardsKilled`: `p.wardsKilled`
* `turretsKilled`: `p.turretKills`
* `inhibitorsKilled`: `p.inhibitorKills`
* `ccDuration`: `p.totalTimeCCDealt`

#### [MODIFY] [route.js](file:///c:/Users/Admin/Documents/GitHub/gg-lol-tournament/src/app/api/riot-webhook/route.js)
Update both the real Riot parser and the webhook simulator mock generator to parse and populate the complete dataset.

#### [MODIFY] [page.js](file:///c:/Users/Admin/Documents/GitHub/gg-lol-tournament/src/app/admin/page.js)
Update the client-side simulator dataset to include realistic values for healing, damage taken, CC duration, wards, and multikills.

---

### 3. Frontend UI Redesign
#### [MODIFY] [MatchStatsModal.js](file:///c:/Users/Admin/Documents/GitHub/gg-lol-tournament/src/components/MatchStatsModal.js)
Redesign the modal into a beautiful tabbed view:
1. **Tab 1: Scoreboard (Default)**
   * Shows champion icon, player name, roles, KDA, items, gold, CS, and vision score.
   * Renders badges for Triple, Quadra, or Penta kills.
2. **Tab 2: Combat Charts (Combat Stats)**
   * Multi-bar toggle selector to view:
     - **Damage Dealt to Champions** (Gold/Red bars)
     - **Damage Taken from Champions** (Purple/Grey bars)
     - **Healing Done** (Green/White bars)
3. **Tab 3: Utility & Vision Stats**
   * Table displaying detailed support and macro stats:
     - Wards Placed / Wards Destroyed / Control Wards Bought
     - Crowd Control (CC) Duration (seconds)
     - Turret / Inhibitor Kills
4. **Tab 4: Team Comparison**
   * Side-by-side card comparing:
     - Total Team Gold (with a comparison lead indicator)
     - Total Team Kills
     - Team Objectives (Dragons, Barons, First Blood)

---

## Verification Plan

### Automated Verification
* Run `npm run build` to verify Next.js compiles the modified files successfully.

### Manual Verification
1. Log in to the Admin Panel (`/admin`) and go to the **Riot Tournament API** tab.
2. Trigger a simulated webhook for a scheduled match, or import your VN2 game.
3. Open the **Schedule** page (`/schedule`) and click **Inspect Match Stats**.
4. Check the tabs:
   - **Scoreboard**: Verify KDA, CS, Gold, and multikill badges render.
   - **Combat Charts**: Click the different metrics (Damage Dealt, Damage Taken, Healing) to see the bar charts update.
   - **Utility & Vision**: Verify the custom table renders correct counts for CC duration and wards.
   - **Team Comparison**: Verify the total gold summation and objective comparison are displayed.
