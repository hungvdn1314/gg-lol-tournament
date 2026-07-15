/**
 * Generates inline SVG data URIs for placeholder images.
 * Eliminates dependency on external services like placehold.co.
 */

/**
 * Generate a team logo placeholder with initials on a dark background.
 * @param {string} teamName - The team name to extract initials from.
 * @param {number} size - The width/height of the SVG.
 * @returns {string} A data URI for an SVG image.
 */
export function teamLogoPlaceholder(teamName = "?", size = 50) {
  const initials = teamName
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="6" fill="#1a1a2e"/>
    <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="#D4AF37" font-family="sans-serif" font-weight="bold" font-size="${size * 0.4}">${initials}</text>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Generate a generic square placeholder icon.
 * @param {number} size - The width/height of the SVG.
 * @returns {string} A data URI for an SVG image.
 */
export function genericPlaceholder(size = 40) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="4" fill="#1a1a2e" stroke="#333" stroke-width="1"/>
    <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="#555" font-family="sans-serif" font-size="${size * 0.35}">?</text>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Generate a champion icon placeholder.
 * @param {number} size - The width/height of the SVG.
 * @returns {string} A data URI for an SVG image.
 */
export function championPlaceholder(size = 40) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="4" fill="#1a1a2e" stroke="#D4AF37" stroke-width="1" stroke-opacity="0.3"/>
    <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="#D4AF37" font-family="sans-serif" font-size="${size * 0.35}" opacity="0.6">⚔</text>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
