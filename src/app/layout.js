import { Russo_One, Chakra_Petch } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const russoOne = Russo_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-russo-one",
});

const chakraPetch = Chakra_Petch({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-chakra-petch",
});

export const metadata = {
  title: "Gear Games LoL Cup 2026",
  description: "Web portal for the company League of Legends tournament - live brackets, team standings, and match schedules.",
  openGraph: {
    title: "Gear Games LoL Cup 2026",
    description: "Web portal for the company League of Legends tournament - live brackets, team standings, and match schedules.",
    type: "website",
    images: [{ url: "/company_logo.png" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${russoOne.variable} ${chakraPetch.variable}`}>
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
              <a href="/news">News</a>
              <a href="/leaderboard">Leaderboard</a>
              <a href="/rankings">Rankings</a>
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
