"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import PlayerSignature from "./PlayerSignature";

export default function ImageZoomOverlay() {
  const [zoomedItem, setZoomedItem] = useState(null); // { type: 'image', src, alt } or { type: 'signature', name }

  useEffect(() => {
    // Dynamically identify and tag zoomable images on hover
    const handleMouseOver = (e) => {
      const img = e.target.closest("img");
      if (!img) return;

      // Skip already processed or specifically ignored images
      if (
        img.classList.contains("zoomable-image") ||
        img.classList.contains("no-zoom") ||
        img.closest(".no-zoom")
      ) {
        return;
      }

      // Exclude header company logo and footer poro
      if (
        img.src.includes("company_logo.png") ||
        img.closest(".footer-poro") ||
        img.closest(".app-header")
      ) {
        img.classList.add("no-zoom");
        return;
      }

      // Exclude tiny icons (like 20px - 36px icons)
      if (img.clientWidth > 0 && img.clientWidth <= 40) {
        img.classList.add("no-zoom");
        return;
      }

      // Mark the image as zoomable (applies cursor and hover scale/brightness CSS)
      img.classList.add("zoomable-image");
    };

    // Capture click events on zoomable elements (images and player signatures)
    const handleGlobalClick = (e) => {
      // 1. Check if a player signature badge was clicked
      const signature = e.target.closest(".signature-badge");
      if (signature) {
        const playerName = signature.getAttribute("data-player-name");
        if (playerName) {
          e.preventDefault();
          e.stopPropagation();
          setZoomedItem({
            type: "signature",
            name: playerName,
          });
          return;
        }
      }

      // 2. Check if a zoomable image was clicked
      const img = e.target.closest("img");
      if (!img) return;

      // Verify that this image is indeed zoomable and not ignored
      if (
        img.classList.contains("no-zoom") ||
        img.closest(".no-zoom") ||
        img.src.includes("company_logo.png") ||
        img.closest(".footer-poro") ||
        img.closest(".app-header")
      ) {
        return;
      }

      if (img.clientWidth > 0 && img.clientWidth <= 40) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      setZoomedItem({
        type: "image",
        src: img.src,
        alt: img.alt || "Tournament Image",
      });
    };

    document.addEventListener("mouseover", handleMouseOver, true);
    document.addEventListener("click", handleGlobalClick, true);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver, true);
      document.removeEventListener("click", handleGlobalClick, true);
    };
  }, []);

  // Escape key support to close the modal
  useEffect(() => {
    if (!zoomedItem) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setZoomedItem(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomedItem]);

  // Lock page scrolling when the modal is active
  useEffect(() => {
    if (zoomedItem) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [zoomedItem]);

  return (
    <AnimatePresence>
      {zoomedItem && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={() => setZoomedItem(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            backgroundColor: "rgba(6, 6, 8, 0.9)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            cursor: "zoom-out",
          }}
        >
          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setZoomedItem(null);
            }}
            style={{
              position: "fixed",
              top: "1.5rem",
              right: "1.5rem",
              backgroundColor: "rgba(20, 20, 25, 0.6)",
              border: "1px solid rgba(245, 176, 65, 0.3)",
              borderRadius: "50%",
              width: "48px",
              height: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary-gold-bright)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              zIndex: 100000,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--primary-gold)";
              e.currentTarget.style.color = "#000";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(20, 20, 25, 0.6)";
              e.currentTarget.style.color = "var(--primary-gold-bright)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <X size={20} />
          </button>

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.92, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 15, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.5rem",
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          >
            {/* Conditional Rendering based on Zoom Item Type */}
            {zoomedItem.type === "image" ? (
              /* Zoomed Image View */
              <div
                style={{
                  position: "relative",
                  border: "2px solid var(--primary-gold)",
                  borderRadius: "12px",
                  overflow: "hidden",
                  backgroundColor: "#0d0d12",
                  boxShadow: "0 24px 64px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 176, 65, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  maxHeight: "75vh",
                  maxWidth: "90vw",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={zoomedItem.src}
                  alt={zoomedItem.alt}
                  style={{
                    maxHeight: "75vh",
                    maxWidth: "90vw",
                    objectFit: "contain",
                    display: "block",
                    cursor: "zoom-out",
                  }}
                  onClick={() => setZoomedItem(null)}
                />
              </div>
            ) : (
              /* Zoomed Player Signature Badge View */
              <div
                style={{
                  position: "relative",
                  boxShadow: "0 24px 64px rgba(0, 0, 0, 0.9), 0 0 40px rgba(245, 176, 65, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  cursor: "zoom-out",
                  padding: "6px",
                  background: "linear-gradient(135deg, var(--primary-gold), #D68910)",
                }}
                onClick={() => setZoomedItem(null)}
              >
                <PlayerSignature name={zoomedItem.name} size={280} />
              </div>
            )}

            {/* Caption Info */}
            <div
              style={{
                textAlign: "center",
                color: "var(--text-primary)",
                fontFamily: "var(--font-chakra-petch), sans-serif",
                textShadow: "0 2px 4px rgba(0,0,0,0.8)",
                maxWidth: "600px",
                padding: "0 1rem",
              }}
            >
              <h4
                style={{
                  fontSize: "1.1rem",
                  margin: "0 0 0.35rem 0",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--primary-gold-bright)",
                  fontWeight: "700",
                }}
              >
                {zoomedItem.type === "image" ? zoomedItem.alt : `${zoomedItem.name}'s Signature`}
              </h4>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                Click anywhere to close modal
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
