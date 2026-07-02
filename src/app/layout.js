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
          <div className="container footer-content" style={{ textAlign: "center" }}>
            <p>&copy; 2026 Gear Games. All rights reserved.</p>
            <p style={{ fontSize: "0.75rem", opacity: 0.7, maxWidth: "700px", margin: "0.5rem auto 1rem auto", lineHeight: "1.4" }}>
              Gear Games LoL Cup Portal is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
            </p>
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
