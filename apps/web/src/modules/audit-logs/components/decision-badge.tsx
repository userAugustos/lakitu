import type { AuditDecision } from '@lakitu/api/audit-log';

import { Badge } from '@repo/ui/shadcn/badge';
import { cn } from '@repo/ui/utils';

const decisionStyles: Record<AuditDecision, string> = {
  allow: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  deny: 'border-red-200 bg-red-50 text-red-700',
  denied: 'border-red-200 bg-red-50 text-red-700',
  approval_required: 'border-amber-200 bg-amber-50 text-amber-700',
  expired: 'border-gray-200 bg-gray-50 text-gray-500',
};

const decisionLabels: Record<AuditDecision, string> = {
  allow: 'Allow',
  approved: 'Approved',
  deny: 'Deny',
  denied: 'Denied',
  approval_required: 'Approval Required',
  expired: 'Expired',
};

interface DecisionBadgeProps {
  decision: AuditDecision;
}

export function DecisionBadge({ decision }: DecisionBadgeProps) {
  return (
    <Badge data-testid="decision-badge" className={cn('font-medium', decisionStyles[decision])}>
      {decisionLabels[decision]}
    </Badge>
  );
}
