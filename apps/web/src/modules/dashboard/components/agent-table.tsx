import { agentsColumns } from './agents-columns';
import { AgentsDataTable } from './agents-data-table';
import type { AgentDisplayRow } from '../lib/agent-display';

interface AgentTableProps {
  agents: AgentDisplayRow[];
  nameFilter?: string;
}

export function AgentTable({ agents, nameFilter }: AgentTableProps) {
  return <AgentsDataTable columns={agentsColumns} data={agents} nameFilter={nameFilter} />;
}
