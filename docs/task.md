# LoL Tournament Web Portal Tasks

- [x] Initialize Next.js project in workspace
- [x] Create core database logic with Local Storage mock provider (Vercel-ready with Firebase variables capability)
- [x] Implement dark-gold-white esports style sheet in global CSS
- [x] Create layout and navbar component with responsive styling
- [x] Build Home Page (hero, tournament status, countdown, quick links)
- [x] Build Teams Page (cards, roster information, stats)
- [x] Build Schedule Page (match listing, filter states, live status)
- [x] Build Leaderboard Page (animated team ranks, automatic group standing calculation, Top 3 podium)
- [x] Build Bracket Page (SVG tree connector, dynamic size representation)
- [x] Build Admin Panel (auth login page, tournament setup config, team manager, match scheduler, live match dashboard)
- [x] Build and verify application locally
- [x] Create walkthrough documenting verification and UI screenshots

## Riot Tournament API Integration
- [x] Save Riot API Credentials in `.env.local`
- [x] Implement `matchDetails` helper functions in `src/lib/db.js`
- [x] Create Next.js API route `src/app/api/tournament-code/route.js` to request draft codes from Riot
- [x] Create Next.js API route `src/app/api/riot-webhook/route.js` to receive match telemetry
- [x] Update Schedule UI (`src/app/schedule/page.js`) with code copying and post-game stats inspector
- [x] Update Admin Dashboard (`src/app/admin/page.js`) with code generation and local webhook simulator
- [x] Compile and verify locally, then push to GitHub
