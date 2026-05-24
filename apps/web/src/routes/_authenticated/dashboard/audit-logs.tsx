import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';

import type { AuditDecision } from '@lakitu/api/audit-log';

import { Input } from '@repo/ui/shadcn/input';
import { AuditLogsTable } from '@/modules/audit-logs/components/audit-logs-table';
import { EventFilter } from '@/modules/audit-logs/components/event-filter';
import { VerifyChainButton } from '@/modules/audit-logs/components/verify-chain-button';
import { auditLogsQueryOptions } from '@/modules/audit-logs/lib/audit-logs-query';

export const Route = createFileRoute('/_authenticated/dashboard/audit-logs')({
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const [decision, setDecision] = useState<AuditDecision | undefined>(undefined);
  const [globalFilter, setGlobalFilter] = useState('');
  const { data, isLoading } = useQuery(auditLogsQueryOptions({ decision }));
  const entries = useMemo(() => data?.entries ?? [], [data?.entries]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3 max-[720px]:items-start">
        <h1 className="text-dash-ink text-xl font-semibold">Audit Logs</h1>
        <div className="flex items-center gap-2 max-[720px]:w-full max-[720px]:flex-col max-[720px]:items-stretch">
          <Input
            data-testid="audit-logs-global-filter"
            type="search"
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Search audit logs"
            className="h-9 w-[240px] rounded-lg px-3 py-1.5 max-[720px]:w-full"
          />
          <EventFilter value={decision} onChange={setDecision} />
          <VerifyChainButton />
        </div>
      </div>
      {isLoading ? (
        <div className="text-dash-muted flex items-center justify-center py-16 text-sm">
          Loading...
        </div>
      ) : (
        <AuditLogsTable
          entries={entries}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
        />
      )}
    </div>
  );
}
