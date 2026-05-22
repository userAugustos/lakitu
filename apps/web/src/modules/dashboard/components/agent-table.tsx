import { agentsColumns } from './agents-columns';
import { AgentsDataTable } from './agents-data-table';
import type { AgentDisplayRow } from '../lib/agent-display';

interface AgentTableProps {
  agents: AgentDisplayRow[];
}

export function AgentTable({ agents }: AgentTableProps) {
  return <AgentsDataTable columns={agentsColumns} data={agents} />;
}
