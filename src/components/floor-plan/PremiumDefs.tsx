/** Shared SVG patterns, gradients, and filters for premium floor plans. */
export function PremiumDefs() {
  return (
    <defs>
      <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0.08" dy="0.12" stdDeviation="0.18" floodColor="#1a1510" floodOpacity="0.22" />
      </filter>
      <filter id="furniture-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0.05" dy="0.1" stdDeviation="0.12" floodColor="#1a1510" floodOpacity="0.28" />
      </filter>

      {/* Wood planks — kitchen & living */}
      <pattern id="floor-wood" width="2.4" height="2.4" patternUnits="userSpaceOnUse">
        <rect width="2.4" height="2.4" fill="#e8d5b8" />
        <line x1="0" y1="0.8" x2="2.4" y2="0.8" stroke="#d4bc96" strokeWidth="0.06" />
        <line x1="0" y1="1.6" x2="2.4" y2="1.6" stroke="#c9ae88" strokeWidth="0.04" />
        <line x1="1.2" y1="0" x2="1.2" y2="2.4" stroke="#dcc9a8" strokeWidth="0.03" opacity="0.5" />
      </pattern>

      {/* Carpet — bedrooms */}
      <pattern id="floor-carpet" width="1.2" height="1.2" patternUnits="userSpaceOnUse">
        <rect width="1.2" height="1.2" fill="#ddd0bc" />
        <circle cx="0.3" cy="0.4" r="0.08" fill="#cfc2ae" opacity="0.6" />
        <circle cx="0.9" cy="0.2" r="0.06" fill="#c8baa6" opacity="0.5" />
        <circle cx="0.6" cy="0.9" r="0.07" fill="#d5c8b4" opacity="0.55" />
      </pattern>

      {/* Tile — bathrooms */}
      <pattern id="floor-tile" width="1.5" height="1.5" patternUnits="userSpaceOnUse">
        <rect width="1.5" height="1.5" fill="#e5ddd0" />
        <rect x="0.04" y="0.04" width="1.38" height="1.38" fill="#ede5d8" stroke="#d4c8b8" strokeWidth="0.04" />
      </pattern>

      {/* Patio concrete */}
      <pattern id="floor-concrete" width="2" height="2" patternUnits="userSpaceOnUse">
        <rect width="2" height="2" fill="#d8d4cc" />
        <line x1="0" y1="1" x2="2" y2="1" stroke="#ccc8c0" strokeWidth="0.05" />
      </pattern>

      {/* Granite countertop */}
      <pattern id="granite" width="3" height="3" patternUnits="userSpaceOnUse">
        <rect width="3" height="3" fill="#9a9590" />
        <circle cx="0.8" cy="1.2" r="0.35" fill="#b0aaa4" opacity="0.7" />
        <circle cx="2.2" cy="0.6" r="0.25" fill="#8a8580" opacity="0.6" />
        <circle cx="1.5" cy="2.3" r="0.3" fill="#a8a29c" opacity="0.65" />
      </pattern>

      <linearGradient id="wall-external" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4a4038" />
        <stop offset="100%" stopColor="#2e2820" />
      </linearGradient>
      <linearGradient id="wall-internal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#5c5248" />
        <stop offset="100%" stopColor="#3d3630" />
      </linearGradient>

      <linearGradient id="fabric-blue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6b8fb8" />
        <stop offset="100%" stopColor="#4a6f98" />
      </linearGradient>
      <linearGradient id="fabric-navy" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2c4a6e" />
        <stop offset="100%" stopColor="#1a3050" />
      </linearGradient>
      <linearGradient id="wood-furniture" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#c4a574" />
        <stop offset="100%" stopColor="#a08050" />
      </linearGradient>

      <linearGradient id="water-tub" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7eb8d4" />
        <stop offset="100%" stopColor="#5a9ab8" />
      </linearGradient>
    </defs>
  );
}

export function finishPatternId(finish?: string): string {
  switch (finish) {
    case "wood":
      return "url(#floor-wood)";
    case "carpet":
      return "url(#floor-carpet)";
    case "tile":
      return "url(#floor-tile)";
    case "concrete":
      return "url(#floor-concrete)";
    default:
      return "#f5f0e8";
  }
}
