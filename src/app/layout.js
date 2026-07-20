import { Russo_One, Chakra_Petch, Alex_Brush, Mr_De_Haviland, Caveat, Cedarville_Cursive } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import ImageZoomOverlay from "@/components/ImageZoomOverlay";
import Link from "next/link";

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

const alexBrush = Alex_Brush({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-alex-brush",
});

const mrDeHaviland = Mr_De_Haviland({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-mr-de-haviland",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-caveat",
});

const cedarvilleCursive = Cedarville_Cursive({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-cedarville-cursive",
});

export const metadata = {
  title: "Gear Games League of Legend Championship",
  description: "Web portal for the company League of Legends tournament - live brackets, team standings, and match schedules.",
  openGraph: {
    title: "Gear Games League of Legend Championship",
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
    <html lang="en" className={`${russoOne.variable} ${chakraPetch.variable} ${alexBrush.variable} ${mrDeHaviland.variable} ${caveat.variable} ${cedarvilleCursive.variable}`}>
      <body>
        <Header />
        
        <main style={{ flex: 1, padding: "2rem 0" }}>
          {children}
        </main>
        
        <ImageZoomOverlay />
        
        <footer className="app-footer">
          <div className="container footer-content" style={{ textAlign: "center" }}>
            <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem", color: "var(--text-muted)" }}>
              <span>&copy; 2026 Gear Games. All rights reserved.</span>
              <svg 
                className="footer-poro" 
                viewBox="0 0 100 100"
                title="ARAM Poro!"
              >
                {/* Body - fluffy off-white */}
                <ellipse cx="50" cy="55" rx="35" ry="30" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2" />
                <circle cx="28" cy="45" r="12" fill="#F1F5F9" />
                <circle cx="72" cy="45" r="12" fill="#F1F5F9" />
                <circle cx="35" cy="72" r="14" fill="#F1F5F9" />
                <circle cx="65" cy="72" r="14" fill="#F1F5F9" />
                <circle cx="50" cy="75" r="15" fill="#F1F5F9" />

                {/* Fur details */}
                <path d="M42,50 C45,55 55,55 58,50" fill="none" stroke="#94A3B8" strokeWidth="1.5" />
                <path d="M45,58 C47,62 53,62 55,58" fill="none" stroke="#94A3B8" strokeWidth="1.5" />

                {/* Golden Horns */}
                <path d="M25,35 C15,25 20,10 32,18 C30,22 28,26 28,30" fill="#F5B041" stroke="#D68910" strokeWidth="1.5" />
                <path d="M75,35 C85,25 80,10 68,18 C70,22 72,26 72,30" fill="#F5B041" stroke="#D68910" strokeWidth="1.5" />

                {/* Eyes */}
                <circle cx="36" cy="48" r="4.5" fill="#0F172A" />
                <circle cx="35" cy="46" r="1.5" fill="#FFFFFF" />
                <circle cx="64" cy="48" r="4.5" fill="#0F172A" />
                <circle cx="63" cy="46" r="1.5" fill="#FFFFFF" />

                {/* Cute pink cheeks */}
                <circle cx="27" cy="55" r="5" fill="#FF5E6A" opacity="0.4" />
                <circle cx="73" cy="55" r="5" fill="#FF5E6A" opacity="0.4" />

                {/* Tongue (sticks out on hover via CSS class poro-tongue!) */}
                <path className="poro-tongue" d="M45,58 C45,68 55,68 55,58 Z" fill="#FF5E6A" stroke="#D32F2F" strokeWidth="1" />

                {/* Nose */}
                <polygon points="48,51 52,51 50,54" fill="#0F172A" />
              </svg>
            </p>
            <p style={{ fontSize: "0.75rem", opacity: 0.7, maxWidth: "700px", margin: "0.5rem auto 1rem auto", lineHeight: "1.4" }}>
              Gear Games LoL Cup Portal is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
            </p>
            <div className="footer-links">
              <Link href="/">Home</Link>
              <Link href="/rules">Rules</Link>
              <Link href="/leaderboard">Leaderboard</Link>
              <Link href="/rankings">Rankings</Link>
              <Link href="/bracket">Bracket</Link>
              <Link href="/schedule">Schedule</Link>
              <Link href="/teams">Teams</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
