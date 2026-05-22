import type { ColumnFiltersState, OnChangeFn } from '@tanstack/react-table';

import { agentsColumns } from './agents-columns';
import { AgentsDataTable } from './agents-data-table';
import type { AgentDisplayRow } from '../lib/agent-display';

interface AgentTableProps {
  agents: AgentDisplayRow[];
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
}

export function AgentTable({ agents, columnFilters, onColumnFiltersChange }: AgentTableProps) {
  return (
    <AgentsDataTable
      columns={agentsColumns}
      data={agents}
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
    />
  );
}
