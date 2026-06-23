import React from "react";

// 1. Summoner's Cup (Trophy)
export function SummonersCup({ size = 24, className = "", style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      {...props}
    >
      {/* The Cup Bowl */}
      <path d="M6 3h12v5c0 3.31-2.69 6-6 6s-6-2.69-6-6V3z" fill="rgba(194, 157, 56, 0.15)" />
      {/* Base / Stem */}
      <path d="M12 14v4" />
      <path d="M7 21h10" />
      <path d="M9 18h6" />
      {/* Left Winged Handle */}
      <path d="M6 5H3.5C2.5 5 2 5.8 2 7c0 2 2 3.5 4 4V5z" fill="currentColor" opacity="0.35" />
      {/* Right Winged Handle */}
      <path d="M18 5h2.5c1 0 1.5.8 1.5 2 0 2-2 3.5-4 4V5z" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

// 2. LoL Ward (Location MapPin)
export function LoLWard({ size = 24, className = "", style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      {...props}
    >
      {/* Base and stand */}
      <path d="M12 9v11" />
      <path d="M8 20h8" />
      {/* Ward wings / lens housing */}
      <path d="M12 3C7 3 4 5.5 4 8c0 3.5 3.5 5.5 8 7 4.5-1.5 8-3.5 8-7 0-2.5-3-5-8-5z" fill="rgba(194, 157, 56, 0.1)" />
      {/* Glowing core/eye */}
      <circle cx="12" cy="8" r="2" fill="currentColor" />
      <path d="M8 8s1.5-1.2 4-1.2 4 1.2 4 1.2" />
    </svg>
  );
}

// 3. Zhonya's Hourglass (Clocks/Timers)
export function ZhonyaHourglass({ size = 24, className = "", style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      {...props}
    >
      {/* Frames */}
      <path d="M5 2h14v2H5V2z" fill="currentColor" />
      <path d="M5 20h14v2H5v-2z" fill="currentColor" />
      {/* Glass profiles */}
      <path d="M5 4l7 7 7-7" />
      <path d="M5 20l7-7 7 7" />
      {/* Sand */}
      <path d="M12 11c.5 0 1-.5 1-1V5H11v5c0 .5.5 1 1 1z" fill="currentColor" />
      <path d="M9 19c0-1.5 1.5-3 3-3s3 1.5 3 3H9z" fill="currentColor" />
    </svg>
  );
}

// 4. Hextech Crest (Shield/Admin)
export function HextechCrest({ size = 24, className = "", style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      {...props}
    >
      {/* Shield Crest */}
      <path d="M12 2L3 7v6c0 5.52 4.48 10 9 11 4.52-1 9-5.48 9-11V7l-9-5z" fill="rgba(194, 157, 56, 0.15)" />
      {/* Hextech Crystal Gem */}
      <path d="M12 6.5L15.5 10L12 13.5L8.5 10L12 6.5z" fill="currentColor" />
      <path d="M12 13.5v4" />
    </svg>
  );
}

// 5. Crossed Swords (Versus/Matchups)
export function CrossedSwords({ size = 24, className = "", style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      {...props}
    >
      <path d="M3 21l3.5-3.5M21 21l-3.5-3.5" />
      <path d="M6.5 17.5l11-11M17.5 17.5L7 7" />
      {/* Handles */}
      <path d="M18.5 2.5l3 3-1.8 1.8-3-3 1.8-1.8z" fill="currentColor" />
      <path d="M2.5 18.5l3-3 1.8 1.8-3 3-1.8-1.8z" fill="currentColor" />
      <path d="M16 4l4 4M4 16l4 4" />
    </svg>
  );
}

// 6. LoL Minion (Users/Teams)
export function LoLMinion({ size = 24, className = "", style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      {...props}
    >
      {/* Caster hood */}
      <path d="M12 3c-4.5 0-8 3.5-8 8v4c0 3 2.5 5 5 6l3 1 3-1c2.5-1 5-3 5-6v-4c0-4.5-3.5-8-8-8z" fill="rgba(194, 157, 56, 0.15)" />
      {/* Tassels / details */}
      <path d="M12 3v3M4 11s-2-2-2-5c0 0 2 0 4 2M20 11s2-2 2-5c0 0-2 0-4 2" />
      {/* Glowing Eyes */}
      <path d="M9 13.5l1.5-1 1.5 1" fill="currentColor" />
      <path d="M15 13.5l-1.5-1-1.5 1" fill="currentColor" />
    </svg>
  );
}

// 7. Role: Top Lane
export function RoleTop({ size = 18, className = "", style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" />
      {/* Top lane bar indicator */}
      <path d="M3 3h7v2H5v5H3V3z" fill="currentColor" stroke="none" />
      <path d="M3 21L21 3" strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
    </svg>
  );
}

// 8. Role: Jungle
export function RoleJungle({ size = 18, className = "", style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      {...props}
    >
      <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
      {/* Foliage/monster claw shape */}
      <path d="M12 6c0 0-4 3-4 6s2.5 4 4 6c1.5-2 4-3 4-6s-4-6-4-6z" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="var(--bg-primary)" stroke="none" />
    </svg>
  );
}

// 9. Role: Mid Lane
export function RoleMid({ size = 18, className = "", style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" />
      <path d="M3 21L21 3" strokeWidth="1.5" />
      {/* Highlighted middle diamond */}
      <path d="M10 12l2-2 2 2-2 2-2-2z" fill="currentColor" stroke="none" />
    </svg>
  );
}

// 10. Role: ADC (Bot Lane / Marksman)
export function RoleADC({ size = 18, className = "", style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" />
      {/* Bottom lane indicator */}
      <path d="M14 21h7v-7h-2v5h-5v2z" fill="currentColor" stroke="none" />
      <path d="M3 21L21 3" strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
    </svg>
  );
}

// 11. Role: Support
export function RoleSupport({ size = 18, className = "", style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      {...props}
    >
      {/* Crest of protection / ward shape */}
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" stroke="none" />
      <path d="M12 7v6M9 10h6" stroke="var(--bg-primary)" strokeWidth="1.5" />
    </svg>
  );
}
