"use client";

import { useState } from "react";
import { Tv, Play, Radio, Maximize2, ExternalLink } from "lucide-react";

export function getYoutubeEmbedUrl(url) {
  if (!url) return null;
  let videoId = "";
  
  // Handles youtube.com/watch?v=ID, youtube.com/live/ID, youtu.be/ID, or direct ID
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
    <div className={`livestream-card ${isTheater ? "theater-mode" : ""}`}>
      {/* Header Bar */}
      <div className="livestream-header">
        <div className="flex items-center gap-3">
          <span className="live-status-pill">
            <span className="live-dot animated-pulse"></span>
            {isLive ? "LIVE NOW" : "OFFLINE"}
          </span>
          <h3 className="livestream-title flex items-center gap-2">
            <Tv className="w-4 h-4 text-amber-400" />
            {matchTitle}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {youtubeUrl && (
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="livestream-btn-secondary"
              title="Open on YouTube"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>YouTube</span>
            </a>
          )}
          <button
            onClick={() => setIsTheater(!isTheater)}
            className="livestream-btn-secondary"
            title="Toggle Theater Mode"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{isTheater ? "Normal View" : "Theater"}</span>
          </button>
        </div>
      </div>

      {/* Video Container */}
      <div className="video-aspect-container">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title="Grand Final Livestream"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="video-iframe"
          />
        ) : (
          <div className="video-placeholder">
            <div className="placeholder-content">
              <div className="placeholder-icon-wrap">
                <Radio className="w-12 h-12 text-amber-400 opacity-60" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">LIVESTREAM STANDBY</h4>
              <p className="text-slate-400 text-sm max-w-md mx-auto mb-4">
                The broadcast stream for the Grand Final match will be linked soon by the admin. Stay tuned for kickoff!
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .livestream-card {
          background: rgba(18, 18, 22, 0.95);
          border: 1px solid rgba(245, 176, 65, 0.25);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(245, 176, 65, 0.1);
          transition: all 0.3s ease;
        }

        .livestream-card.theater-mode {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          border-radius: 0;
          border: none;
          display: flex;
          flex-direction: column;
          background: #000;
        }

        .livestream-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          background: rgba(26, 26, 34, 0.8);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .live-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #f87171;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #ef4444;
        }

        .animated-pulse {
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        .livestream-title {
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }

        .livestream-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .livestream-btn-secondary:hover {
          background: rgba(245, 176, 65, 0.15);
          border-color: rgba(245, 176, 65, 0.4);
          color: #f5b041;
        }

        .video-aspect-container {
          position: relative;
          width: 100%;
          padding-top: 56.25%; /* 16:9 Aspect Ratio */
          background: #050507;
          flex-grow: 1;
        }

        .theater-mode .video-aspect-container {
          padding-top: 0;
          height: calc(100vh - 50px);
        }

        .video-iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
        }

        .video-placeholder {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, rgba(26, 26, 34, 0.8) 0%, rgba(10, 10, 12, 0.95) 100%);
          text-align: center;
          padding: 24px;
        }

        .placeholder-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(245, 176, 65, 0.08);
          border: 1px solid rgba(245, 176, 65, 0.2);
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
}
