interface CheckeredStripeProps {
  rows?: number;
  cols?: number;
  cell?: number;
}

export function CheckeredStripe({ rows = 2, cols = 28, cell = 22 }: CheckeredStripeProps) {
  const squares = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dark = (r + c) % 2 === 0;
      squares.push(
        <rect
          key={`${r}-${c}`}
          x={c * cell}
          y={r * cell}
          width={cell}
          height={cell}
          fill={dark ? '#0e1726' : '#ffffff'}
        />
      );
    }
  }
  return (
    <svg
      width="100%"
      height={rows * cell}
      viewBox={`0 0 ${cols * cell} ${rows * cell}`}
      preserveAspectRatio="none"
      style={{ display: 'block' }}
    >
      {squares}
    </svg>
  );
}
