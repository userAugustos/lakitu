import { Badge } from '@repo/ui/shadcn/badge';

const STATUS_STYLES: Record<string, { badge: string; dot: string }> = {
  active: {
    badge: 'bg-dash-green-bg text-dash-green',
    dot: 'bg-dash-green',
  },
  idle: {
    badge: 'bg-dash-gray-bg text-dash-ink-2',
    dot: 'bg-dash-ink-2',
  },
  degraded: {
    badge: 'bg-dash-amber-bg text-dash-amber',
    dot: 'bg-dash-amber',
  },
  warn: {
    badge: 'bg-dash-amber-bg text-dash-amber',
    dot: 'bg-dash-amber',
  },
  errored: {
    badge: 'bg-dash-red-bg text-dash-red',
    dot: 'bg-dash-red',
  },
  error: {
    badge: 'bg-dash-red-bg text-dash-red',
    dot: 'bg-dash-red',
  },
  revoked: {
    badge: 'bg-[#F4F4F6] text-dash-muted line-through',
    dot: 'bg-dash-muted',
  },
};

const DEFAULT_STYLE = { badge: 'bg-dash-gray-bg text-dash-ink-2', dot: 'bg-dash-ink-2' };

interface StatusBadgeProps {
  status: string;
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const styles = STATUS_STYLES[status] ?? DEFAULT_STYLE;

  return (
    <Badge
      className={`h-[22px] gap-1.5 border-transparent py-[3px] pr-[9px] pl-[7px] text-[12px] leading-none font-semibold ${styles.badge}`}
    >
      <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${styles.dot}`} />
      {label}
    </Badge>
  );
}
