import type { PendingActionStatusValue } from '@lakitu/api/pending-actions';

import { Button } from '@repo/ui/shadcn/button';
import { Label } from '@repo/ui/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/shadcn/select';

const STATUSES: { value: PendingActionStatusValue; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'denied', label: 'Denied' },
  { value: 'expired', label: 'Expired' },
];

interface ApprovalsHeaderProps {
  statusFilter: PendingActionStatusValue | undefined;
  onFilterChange: (status: PendingActionStatusValue | undefined) => void;
  onTriggerAction: () => void;
}

export function ApprovalsHeader({
  statusFilter,
  onFilterChange,
  onTriggerAction,
}: ApprovalsHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Label htmlFor="status-filter" className="text-muted-foreground text-xs font-semibold">
          Filter:
        </Label>
        <Select
          value={statusFilter ?? 'all'}
          onValueChange={(v) =>
            onFilterChange(v === 'all' ? undefined : (v as PendingActionStatusValue))
          }
        >
          <SelectTrigger data-testid="filter-select" id="status-filter" className="h-8 w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        data-testid="simulate-btn"
        variant="outline"
        size="sm"
        onClick={onTriggerAction}
      >
        Trigger Action
      </Button>
    </div>
  );
}
