import { agentsColumns } from './agents-columns';
import { AgentsDataTable } from './agents-data-table';
import type { AgentDisplayRow } from '../lib/agent-display';

interface AgentTableProps {
  agents: AgentDisplayRow[];
  globalFilter?: string;
}

export function AgentTable({ agents, globalFilter }: AgentTableProps) {
  return <AgentsDataTable columns={agentsColumns} data={agents} globalFilter={globalFilter} />;
}
