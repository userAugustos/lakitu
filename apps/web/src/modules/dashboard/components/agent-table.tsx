import type { ReactNode } from 'react';

import { AgentRow } from './agent-row';
import type { AgentDisplayRow } from '../lib/agent-display';

interface AgentTableProps {
  agents: AgentDisplayRow[];
  footer?: ReactNode;
}

export function AgentTable({ agents, footer }: AgentTableProps) {
  if (agents.length === 0) {
    return (
      <div className="border-dash-line rounded-[14px] border bg-white">
        <div className="text-dash-muted flex items-center justify-center py-16 text-[14px]">
          No agents yet
        </div>
      </div>
    );
  }

  return (
    <div className="border-dash-line overflow-hidden rounded-[14px] border bg-white">
      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          <tr>
            <th
              className="text-dash-muted border-dash-line border-b bg-[#FAFBFD] px-4 py-3 text-left text-[11.5px] font-semibold tracking-[0.04em] whitespace-nowrap uppercase"
              style={{ width: '32%' }}
            >
              Agent
            </th>
            <th
              className="text-dash-muted border-dash-line border-b bg-[#FAFBFD] px-4 py-3 text-left text-[11.5px] font-semibold tracking-[0.04em] whitespace-nowrap uppercase"
              style={{ width: '14%' }}
            >
              Status
            </th>
            <th
              className="text-dash-muted border-dash-line border-b bg-[#FAFBFD] px-4 py-3 text-left text-[11.5px] font-semibold tracking-[0.04em] whitespace-nowrap uppercase"
              style={{ width: '18%' }}
            >
              Last edited
            </th>
            <th
              className="text-dash-muted border-dash-line border-b bg-[#FAFBFD] px-4 py-3 text-left text-[11.5px] font-semibold tracking-[0.04em] whitespace-nowrap uppercase"
              style={{ width: '22%' }}
            >
              Clawkey
            </th>
            <th
              className="text-dash-muted border-dash-line border-b bg-[#FAFBFD] px-4 py-3 text-right text-[11.5px] font-semibold tracking-[0.04em] whitespace-nowrap uppercase"
              style={{ width: '14%' }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <AgentRow key={agent.id} agent={agent} />
          ))}
        </tbody>
      </table>
      {footer}
    </div>
  );
}
