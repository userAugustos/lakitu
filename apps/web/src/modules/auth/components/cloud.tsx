import type { CSSProperties } from 'react';

interface CloudProps {
  style?: CSSProperties;
  scale?: number;
  opacity?: number;
}

export function Cloud({ style, scale = 1, opacity = 1 }: CloudProps) {
  return (
    <svg
      width={220 * scale}
      height={90 * scale}
      viewBox="0 0 220 90"
      style={{ position: 'absolute', opacity, ...style }}
      aria-hidden="true"
    >
      <g fill="#ffffff">
        <ellipse cx="50" cy="60" rx="42" ry="28" />
        <ellipse cx="95" cy="48" rx="40" ry="34" />
        <ellipse cx="140" cy="42" rx="38" ry="36" />
        <ellipse cx="180" cy="58" rx="34" ry="26" />
        <rect x="40" y="60" width="150" height="22" />
      </g>
      <g fill="#0e1726" opacity="0.06">
        <ellipse cx="50" cy="76" rx="38" ry="6" />
        <ellipse cx="120" cy="80" rx="80" ry="6" />
      </g>
    </svg>
  );
}
