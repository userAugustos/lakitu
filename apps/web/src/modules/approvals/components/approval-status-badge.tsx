import type { PendingActionStatusValue } from '@lakitu/api/pending-actions';

import { Badge } from '@repo/ui/shadcn/badge';

const STATUS_STYLES: Record<
  PendingActionStatusValue,
  { badge: string; dot: string; label: string }
> = {
  pending: {
    badge: 'bg-dash-amber-bg text-dash-amber',
    dot: 'bg-dash-amber',
    label: 'Pending',
  },
  approved: {
    badge: 'bg-dash-green-bg text-dash-green',
    dot: 'bg-dash-green',
    label: 'Approved',
  },
  denied: {
    badge: 'bg-dash-red-bg text-dash-red',
    dot: 'bg-dash-red',
    label: 'Denied',
  },
  expired: {
    badge: 'bg-[#F4F4F6] text-dash-muted',
    dot: 'bg-dash-muted',
    label: 'Expired',
  },
};

interface ApprovalStatusBadgeProps {
  status: PendingActionStatusValue;
}

export function ApprovalStatusBadge({ status }: ApprovalStatusBadgeProps) {
  const styles = STATUS_STYLES[status];

  return (
    <Badge
      className={`h-[22px] gap-1.5 border-transparent py-[3px] pr-[9px] pl-[7px] text-[12px] leading-none font-semibold ${styles.badge}`}
    >
      <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${styles.dot}`} />
      {styles.label}
    </Badge>
  );
}
