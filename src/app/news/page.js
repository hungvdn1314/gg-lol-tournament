"use client";

import { useState, useEffect } from "react";
import { subscribeToNews } from "@/lib/db";
import { HextechCrest } from "@/components/Icons";

export default function NewsPage() {
  const [news, setNews] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToNews((data) => {
      setNews(data || {});
      setLoading(false);
    });
    return unsub;
  }, []);

  const newsList = Object.values(news).sort((a, b) => b.timestamp - a.timestamp);

  const getCategoryColor = (category) => {
    switch (category) {
      case "Rules": return "#DC3545"; // Red
      case "Patch Notes": return "#0D6EFD"; // Blue
      case "Announcement": return "var(--primary-gold)"; // Gold
      default: return "#6C757D"; // Gray
    }
  };

  return (
    <div className="container">
      <div style={{ textAlign: "center", marginBottom: "3rem", position: "relative", paddingTop: "1.5rem" }}>
        <span className="hero-badge" style={{ backgroundColor: "rgba(245,176,65,0.08)", border: "1px solid var(--border-gold)", color: "var(--primary-gold)", textTransform: "uppercase", fontSize: "0.8rem", fontWeight: "700", padding: "0.3rem 1rem", borderRadius: "20px", display: "inline-block", marginBottom: "1rem" }}>Tournament Updates</span>
        <h1 style={{ fontSize: "2.8rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem", background: "linear-gradient(to bottom, #FFFFFF, var(--primary-gold-bright))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>News &amp; Announcements</h1>
        <p style={{ color: "var(--text-muted)", maxWidth: "600px", margin: "0 auto", fontSize: "0.95rem", lineHeight: "1.6" }}>
          Stay up to date with the latest rules, patch notes, and official tournament announcements.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem" }}>Loading news...</div>
      ) : newsList.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
          <HextechCrest size={48} style={{ opacity: 0.2, marginBottom: "1rem" }} />
          <div>No announcements yet. Check back later!</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "800px", margin: "0 auto" }}>
          {newsList.map((item) => (
            <div key={item.id} className="card" style={{ border: "1px solid var(--border-dark)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", backgroundColor: getCategoryColor(item.category) }}></div>
              <div style={{ padding: "0.5rem 1rem 1.5rem 1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: "bold", color: getCategoryColor(item.category), letterSpacing: "0.05em" }}>
                    {item.category}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "var(--text-primary)" }}>{item.title}</h2>
                <div style={{ color: "var(--text-secondary)", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                  {item.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
