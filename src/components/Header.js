"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { SummonersCup, HextechCrest } from "@/components/Icons";
import { isMockMode } from "@/lib/firebase";

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    // Check if admin is logged in (mock or real)
    const checkLoginStatus = () => {
      if (isMockMode) {
        const loggedIn = localStorage.getItem("lol_tourney_admin_logged_in") === "true";
        setIsAdminLoggedIn(loggedIn);
      } else {
        // For real firebase auth, check current session
        const loggedIn = localStorage.getItem("lol_tourney_admin_logged_in") === "true";
        setIsAdminLoggedIn(loggedIn);
      }
    };

    checkLoginStatus();
    // Listen for storage events (to update state immediately if changed in other pages/tabs)
    window.addEventListener("storage", checkLoginStatus);
    
    // Custom event listener for same-window logins
    window.addEventListener("admin_auth_changed", checkLoginStatus);

    return () => {
      window.removeEventListener("storage", checkLoginStatus);
      window.removeEventListener("admin_auth_changed", checkLoginStatus);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("lol_tourney_admin_logged_in");
    window.dispatchEvent(new Event("admin_auth_changed"));
    window.location.href = "/";
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/rules", label: "Rules" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/rankings", label: "Rankings" },
    { href: "/bracket", label: "Bracket" },
    { href: "/schedule", label: "Schedule" },
    { href: "/teams", label: "Teams" },
    { href: "/submit-score", label: "Submit Score" }
  ];

  return (
    <header className="app-header">
      <div className="header-container">
        <Link href="/" className="logo-section">
          <Image 
            src="/company_logo.png" 
            alt="Company Logo" 
            width={86} 
            height={32} 
            style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} 
          />
        </Link>

        {/* Navigation */}
        <nav className={`nav-links ${mobileMenuOpen ? "mobile-open" : ""}`}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${pathname === link.href ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {isAdminLoggedIn ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Link href="/admin" className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                <HextechCrest size={14} /> Admin
              </Link>
              <button 
                onClick={handleLogout} 
                className="btn btn-outline" 
                style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", cursor: "pointer", display: "flex", gap: "0.25rem", alignItems: "center" }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <Link href="/admin" className="nav-link" style={{ border: "1px solid var(--border-gold)", borderRadius: "4px", padding: "0.3rem 0.6rem" }}>
              Login
            </Link>
          )}
        </nav>

        {/* Mobile menu trigger */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="nav-links mobile-open">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${pathname === link.href ? "active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isAdminLoggedIn ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", marginTop: "1rem" }}>
                <Link
                  href="/admin"
                  className="btn btn-secondary"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <HextechCrest size={16} /> Admin Panel
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="btn btn-outline"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            ) : (
              <Link
                href="/admin"
                className="btn btn-secondary"
                style={{ width: "100%", justifyContent: "center", marginTop: "1rem" }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Login
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
