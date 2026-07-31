"use client";

import { useState } from "react";
import { Tv, Radio, Maximize2, ExternalLink } from "lucide-react";

export function getYoutubeEmbedUrl(url) {
  if (!url) return null;
  let videoId = "";
  
  const watchMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|live\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (watchMatch && watchMatch[1]) {
    videoId = watchMatch[1];
  } else if (url.length === 11 && !url.includes("/")) {
    videoId = url;
  }
  
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : null;
}

export default function LivestreamPlayer({ youtubeUrl, isLive = true, matchTitle = "GRAND FINALS BROADCAST" }) {
  const [isTheater, setIsTheater] = useState(false);
  const embedUrl = getYoutubeEmbedUrl(youtubeUrl);

  return (
    <div
      className="card card-gold"
      style={{
        padding: 0,
        overflow: "hidden",
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-gold)",
        borderRadius: "12px",
        position: isTheater ? "fixed" : "relative",
        top: isTheater ? 0 : "auto",
        left: isTheater ? 0 : "auto",
        right: isTheater ? 0 : "auto",
        bottom: isTheater ? 0 : "auto",
        zIndex: isTheater ? 9999 : "auto",
        height: isTheater ? "100vh" : "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1.25rem",
          backgroundColor: "rgba(26, 26, 34, 0.9)",
          borderBottom: "1px solid var(--border-dark)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.2rem 0.6rem",
              borderRadius: "12px",
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#f87171",
              fontSize: "0.7rem",
              fontWeight: 800,
              letterSpacing: "0.05em",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#ef4444" }} />
            {isLive ? "LIVE NOW" : "OFFLINE"}
          </span>
          <h3 style={{ fontFamily: "var(--font-header)", fontSize: "0.9rem", color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Tv size={14} style={{ color: "var(--primary-gold)" }} />
            {matchTitle}
          </h3>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {youtubeUrl && (
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
            >
              <ExternalLink size={12} />
              <span>YouTube</span>
            </a>
          )}
          <button
            onClick={() => setIsTheater(!isTheater)}
            className="btn btn-secondary"
            style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
          >
            <Maximize2 size={12} />
            <span>{isTheater ? "Exit Theater" : "Theater"}</span>
          </button>
        </div>
      </div>

      {/* Video Container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: isTheater ? 0 : "56.25%",
          height: isTheater ? "calc(100vh - 50px)" : "auto",
          backgroundColor: "#050507",
          flexGrow: 1,
        }}
      >
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title="Grand Final Livestream"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              border: "none",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(10, 10, 12, 0.95)",
              textAlign: "center",
              padding: "2rem",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(245, 176, 65, 0.08)",
                  border: "1px solid var(--border-gold)",
                  marginBottom: "1rem",
                }}
              >
                <Radio size={28} style={{ color: "var(--primary-gold)" }} />
              </div>
              <h4 style={{ fontFamily: "var(--font-header)", fontSize: "1.1rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                LIVESTREAM STANDBY
              </h4>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", maxWidth: "420px", margin: "0 auto" }}>
                The stream link for the Grand Final match will be posted shortly. Stay tuned for live coverage!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
