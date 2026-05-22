import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import type { ColumnFiltersState } from '@tanstack/react-table';

import { AgentSectionHeader } from '@/modules/dashboard/components/agent-section-header';
import { AgentTable } from '@/modules/dashboard/components/agent-table';
import { toAgentDisplayRow } from '@/modules/dashboard/lib/agent-display';
import { agentsQueryOptions } from '@/modules/dashboard/lib/agents-query';

export const Route = createFileRoute('/_authenticated/dashboard/')({
  component: DashboardIndex,
});

function DashboardIndex() {
  const { data } = useQuery(agentsQueryOptions);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const displayAgents = useMemo(() => (data?.agents ?? []).map(toAgentDisplayRow), [data?.agents]);

  const nameFilter =
    (columnFilters.find((f) => f.id === 'name')?.value as string | undefined) ?? '';
  const onSearchChange = (value: string) => setColumnFilters(value ? [{ id: 'name', value }] : []);

  return (
    <div>
      <AgentSectionHeader searchValue={nameFilter} onSearchChange={onSearchChange} />
      <AgentTable
        agents={displayAgents}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
      />
    </div>
  );
}
