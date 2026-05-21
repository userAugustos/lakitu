interface LakituLogoProps {
  size?: number;
}

export function LakituLogo({ size = 36 }: LakituLogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="lk-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7cc6ff" />
          <stop offset="1" stopColor="#3a8fe0" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#lk-sky)" />
      <g fill="#ffffff">
        <ellipse cx="16" cy="30" rx="8" ry="6" />
        <ellipse cx="24" cy="26" rx="9" ry="7" />
        <ellipse cx="32" cy="30" rx="7" ry="5" />
        <rect x="14" y="29" width="20" height="6" />
      </g>
      <rect x="33" y="8" width="1.6" height="18" fill="#0e1726" />
      <g>
        <rect x="24" y="8" width="9" height="7" fill="#ffffff" />
        <rect x="24" y="8" width="3" height="3.5" fill="#0e1726" />
        <rect x="30" y="8" width="3" height="3.5" fill="#0e1726" />
        <rect x="27" y="11.5" width="3" height="3.5" fill="#0e1726" />
      </g>
    </svg>
  );
}
