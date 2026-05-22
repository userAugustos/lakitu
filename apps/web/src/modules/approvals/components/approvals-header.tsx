import type { PendingActionStatusValue } from '@lakitu/api/pending-actions';

import { Button } from '@repo/ui/shadcn/button';

const STATUSES: { value: PendingActionStatusValue | ''; label: string }[] = [
  { value: '', label: 'All' },
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
        <label htmlFor="status-filter" className="text-dash-muted text-[12px] font-semibold">
          Filter:
        </label>
        <select
          id="status-filter"
          data-testid="filter-select"
          value={statusFilter ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            onFilterChange(val ? (val as PendingActionStatusValue) : undefined);
          }}
          className="border-dash-line text-dash-ink h-8 appearance-none rounded-lg border bg-white px-3 text-[13px] outline-none"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <Button
        type="button"
        data-testid="simulate-btn"
        variant="outline"
        size="sm"
        className="h-8 w-auto px-3.5 text-[13px]"
        onClick={onTriggerAction}
      >
        Trigger Action
      </Button>
    </div>
  );
}
