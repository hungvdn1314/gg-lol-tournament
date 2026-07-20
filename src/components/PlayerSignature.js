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

  // Pick a rotation (-8deg to 4deg)
  const rotation = -8 + (hash % 12);

  // Decide if we add a doodle (Heart or Star)
  const hasHeart = hash % 5 === 0; // 20% chance for a cute heart (like Keria)
  const hasStar = hash % 5 === 1; // 20% chance for a star (like Faker/Zeus)

  return { font, rotation, hasHeart, hasStar };
};

export default function PlayerSignature({ name, size = 120 }) {
  // Clean name: extract first part of name if it contains tags like -10013 or -3108
  const cleanName = name ? name.split("-")[0].split(" ")[0] : "Player";
  
  const { font, rotation, hasHeart, hasStar } = getSignatureStyle(cleanName);

  // Dynamically scale font size based on the name length to keep it inside the circle
  const nameLength = cleanName.length;
  let fontSizeScale = 0.32; // Default for short names (1-4 characters)
  if (nameLength >= 8) {
    fontSizeScale = 0.17;  // Small for long names (e.g. 8+ characters)
  } else if (nameLength >= 5) {
    fontSizeScale = 0.23;  // Medium for average names (e.g. 5-7 characters)
  }

  // If there are doodles, reduce font size slightly more to prevent overflow
  if (hasHeart || hasStar) {
    fontSizeScale *= 0.9;
  }

  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    backgroundColor: "#0d0d11",
    // Clean gold matching the website border system
    border: "2px solid rgba(245, 176, 65, 0.2)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.8), inset 0 2px 10px rgba(255,255,255,0.02)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    userSelect: "none",
    flexShrink: 0,
    boxSizing: "border-box",
  };

  const textStyle = {
    fontFamily: font,
    fontSize: `${size * fontSizeScale}px`,
    // Web theme gold gradient: from bright gold to default championship yellow to darker amber gold
    background: "linear-gradient(135deg, #FFE082 0%, #F5B041 50%, #D68910 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    transform: `rotate(${rotation}deg)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "nowrap",
    padding: "0 8px",
    filter: "drop-shadow(0 2px 6px rgba(245,176,65,0.3))",
    textAlign: "center",
    maxWidth: "92%",
  };

  return (
    <div className="signature-badge" style={containerStyle} title={`${cleanName}'s Signature`}>
      <div style={textStyle}>
        {cleanName}
        
        {/* Heart Doodle (styled in gold to match) */}
        {hasHeart && (
          <span style={{ 
            fontSize: `${size * 0.08}px`, 
            display: "inline-block", 
            marginLeft: "1px", 
            verticalAlign: "super",
            background: "linear-gradient(135deg, #FFE082, #F5B041)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            transform: "rotate(15deg) translateY(-4px)"
          }}>
            ❤️
          </span>
        )}

        {/* Star/Sparkle Doodle (styled in gold to match) */}
        {hasStar && (
          <span style={{ 
            fontSize: `${size * 0.08}px`, 
            display: "inline-block", 
            marginLeft: "1px", 
            verticalAlign: "super",
            background: "linear-gradient(135deg, #FFE082, #D68910)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            transform: "scale(1.1) translateY(-3px)"
          }}>
            ★
          </span>
        )}
      </div>

      {/* Internal overlay gradient ring for a premium gold look */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        borderRadius: "50%",
        border: "1.5px solid transparent",
        background: "linear-gradient(135deg, rgba(255,224,130,0.18), rgba(245,176,65,0.12), rgba(214,137,16,0.08)) border-box",
        WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        pointerEvents: "none"
      }} />
    </div>
  );
}
