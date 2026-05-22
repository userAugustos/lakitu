import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import type { AuditDecision } from '@lakitu/api/audit-log';

import { AuditLogsTable } from '@/modules/audit-logs/components/audit-logs-table';
import { DecisionFilter } from '@/modules/audit-logs/components/decision-filter';
import { auditLogsQueryOptions } from '@/modules/audit-logs/lib/audit-logs-query';

export const Route = createFileRoute('/_authenticated/dashboard/audit-logs')({
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const [decision, setDecision] = useState<AuditDecision | undefined>(undefined);
  const { data, isLoading } = useQuery(auditLogsQueryOptions(decision));
  const entries = data?.entries ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-dash-ink text-xl font-semibold">Audit Logs</h1>
        <DecisionFilter value={decision} onChange={setDecision} />
      </div>
      {isLoading ? (
        <div className="text-dash-muted flex items-center justify-center py-16 text-sm">
          Loading...
        </div>
      ) : (
        <AuditLogsTable entries={entries} />
      )}
    </div>
  );
}
