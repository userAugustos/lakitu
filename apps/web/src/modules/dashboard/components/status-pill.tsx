const STATUS_STYLES: Record<string, { pill: string; dot: string }> = {
  active: {
    pill: 'bg-dash-green-bg text-dash-green',
    dot: 'bg-dash-green',
  },
  idle: {
    pill: 'bg-dash-gray-bg text-dash-ink-2',
    dot: 'bg-dash-ink-2',
  },
  degraded: {
    pill: 'bg-dash-amber-bg text-dash-amber',
    dot: 'bg-dash-amber',
  },
  warn: {
    pill: 'bg-dash-amber-bg text-dash-amber',
    dot: 'bg-dash-amber',
  },
  errored: {
    pill: 'bg-dash-red-bg text-dash-red',
    dot: 'bg-dash-red',
  },
  error: {
    pill: 'bg-dash-red-bg text-dash-red',
    dot: 'bg-dash-red',
  },
  revoked: {
    pill: 'bg-[#F4F4F6] text-dash-muted line-through',
    dot: 'bg-dash-muted',
  },
};

const DEFAULT_STYLE = { pill: 'bg-dash-gray-bg text-dash-ink-2', dot: 'bg-dash-ink-2' };

interface StatusPillProps {
  status: string;
  label: string;
}

export function StatusPill({ status, label }: StatusPillProps) {
  const styles = STATUS_STYLES[status] ?? DEFAULT_STYLE;

  return (
    <span
      className={`inline-flex h-[22px] items-center gap-1.5 rounded-full py-[3px] pr-[9px] pl-[7px] text-[12px] leading-none font-semibold ${styles.pill}`}
    >
      <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${styles.dot}`} />
      {label}
    </span>
  );
}
