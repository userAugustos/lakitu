import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { AgentSectionHeader } from '@/modules/dashboard/components/agent-section-header';
import { AgentTable } from '@/modules/dashboard/components/agent-table';
import { toAgentDisplayRow } from '@/modules/dashboard/lib/agent-display';
import { agentsQueryOptions } from '@/modules/dashboard/lib/agents-query';

export const Route = createFileRoute('/_authenticated/dashboard/')({
  component: DashboardIndex,
});

function DashboardIndex() {
  const { data } = useQuery(agentsQueryOptions);
  const [search, setSearch] = useState('');
  const agents = data?.agents ?? [];
  const displayAgents = agents.map(toAgentDisplayRow);

  return (
    <div>
      <AgentSectionHeader searchValue={search} onSearchChange={setSearch} />
      <AgentTable agents={displayAgents} nameFilter={search} />
    </div>
  );
}
