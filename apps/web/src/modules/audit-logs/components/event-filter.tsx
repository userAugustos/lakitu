import { AUDIT_DECISIONS } from '@lakitu/api/audit-log';
import type { AuditDecision } from '@lakitu/api/audit-log';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/shadcn/select';

interface EventFilterProps {
  value: AuditDecision | undefined;
  onChange: (value: AuditDecision | undefined) => void;
}

export function EventFilter({ value, onChange }: EventFilterProps) {
  return (
    <Select
      value={value ?? 'all'}
      onValueChange={(v) => onChange(v === 'all' ? undefined : (v as AuditDecision))}
    >
      <SelectTrigger data-testid="event-filter" className="h-9 w-[180px]">
        <SelectValue placeholder="All decisions" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All decisions</SelectItem>
        {AUDIT_DECISIONS.map((d) => (
          <SelectItem key={d} value={d}>
            {d.replace('_', ' ')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
