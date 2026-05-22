import { AUDIT_DECISIONS } from '@lakitu/api/audit-log';
import type { AuditDecision } from '@lakitu/api/audit-log';

interface DecisionFilterProps {
  value: AuditDecision | undefined;
  onChange: (val: AuditDecision | undefined) => void;
}

export function DecisionFilter({ value, onChange }: DecisionFilterProps) {
  return (
    <select
      data-testid="decision-filter"
      value={value ?? ''}
      onChange={(e) => onChange((e.target.value || undefined) as AuditDecision | undefined)}
      className="border-dash-line text-dash-ink rounded-lg border bg-white px-3 py-1.5 text-sm"
    >
      <option value="">All decisions</option>
      {AUDIT_DECISIONS.map((d) => (
        <option key={d} value={d}>
          {d.replace('_', ' ')}
        </option>
      ))}
    </select>
  );
}
