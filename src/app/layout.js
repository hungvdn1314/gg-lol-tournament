import { Outfit } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

export const metadata = {
  title: "Gear Games LoL Cup 2026",
  description: "Web portal for the company League of Legends tournament - live brackets, team standings, and match schedules.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={outfit.variable}>
      <body>
        <Header />
        
        <main style={{ flex: 1, padding: "2rem 0" }}>
          {children}
        </main>
        
        <footer className="app-footer">
          <div className="container footer-content">
            <p>&copy; 2026 Gear Games. All rights reserved.</p>
            <p>This tournament is not affiliated with or sponsored by Riot Games, Inc. or League of Legends Esports.</p>
            <div className="footer-links">
              <a href="/">Home</a>
              <a href="/leaderboard">Leaderboard</a>
              <a href="/bracket">Bracket</a>
              <a href="/schedule">Schedule</a>
              <a href="/teams">Teams</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
