"use client";

import React from "react";

// Deterministic helper to select a signature style based on the player's name
const getSignatureStyle = (playerName) => {
  if (!playerName) return { fontClass: "font-caveat", rotation: -5, hasHeart: false, hasStar: false };

  let hash = 0;
  for (let i = 0; i < playerName.length; i++) {
    hash = playerName.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  // Pick a font from our CSS variable definitions
  const fonts = [
    "var(--font-alex-brush)",
    "var(--font-mr-de-haviland)",
    "var(--font-cedarville-cursive)",
    "var(--font-caveat)"
  ];
  const font = fonts[hash % fonts.length];

  // Pick a rotation (-15deg to 5deg)
  const rotation = -15 + (hash % 20);

  // Decide if we add a doodle (Heart or Star)
  const hasHeart = hash % 5 === 0; // 20% chance for a cute heart (like Keria)
  const hasStar = hash % 5 === 1; // 20% chance for a star (like Faker/Zeus)

  return { font, rotation, hasHeart, hasStar };
};

export default function PlayerSignature({ name, size = 120 }) {
  // Clean name: extract first part of name if it contains tags like -10013 or -3108
  const cleanName = name ? name.split("-")[0].split(" ")[0] : "Player";
  
  const { font, rotation, hasHeart, hasStar } = getSignatureStyle(cleanName);

  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    backgroundColor: "#0d0d11",
    border: "2px solid rgba(255, 255, 255, 0.04)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6), inset 0 2px 10px rgba(255,255,255,0.02)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    userSelect: "none",
    flexShrink: 0,
  };

  const textStyle = {
    fontFamily: font,
    fontSize: size > 80 ? `${size * 0.3}px` : `${size * 0.34}px`,
    background: "linear-gradient(135deg, #a8ff78 0%, #78ffd6 40%, #00f2fe 75%, #a18cf5 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    transform: `rotate(${rotation}deg)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "nowrap",
    padding: "0 10px",
    filter: "drop-shadow(0 2px 5px rgba(120,255,214,0.15))",
  };

  return (
    <div className="signature-badge" style={containerStyle} title={`${cleanName}'s Signature`}>
      <div style={textStyle}>
        {cleanName}
        
        {/* Heart Doodle (like Keria) */}
        {hasHeart && (
          <span style={{ 
            fontSize: `${size * 0.08}px`, 
            display: "inline-block", 
            marginLeft: "2px", 
            verticalAlign: "super",
            background: "linear-gradient(135deg, #78ffd6, #00f2fe)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            transform: "rotate(15deg) translateY(-8px)"
          }}>
            ❤️
          </span>
        )}

        {/* Star/Sparkle Doodle (like Faker) */}
        {hasStar && (
          <span style={{ 
            fontSize: `${size * 0.08}px`, 
            display: "inline-block", 
            marginLeft: "2px", 
            verticalAlign: "super",
            background: "linear-gradient(135deg, #00f2fe, #a18cf5)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            transform: "scale(1.2) translateY(-6px)"
          }}>
            ★
          </span>
        )}
      </div>

      {/* Internal overlay gradient ring for a premium look */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        borderRadius: "50%",
        border: "1px solid transparent",
        background: "linear-gradient(135deg, rgba(168,255,120,0.15), rgba(0,242,254,0.1), rgba(161,140,245,0.08)) border-box",
        WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        pointerEvents: "none"
      }} />
    </div>
  );
}
