import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';

import type { PendingAction } from '@lakitu/api/pending-actions';

import { RiskBadge } from '@repo/ui/components/risk-badge';
import type { RiskLevel } from '@repo/ui/components/risk-badge';
import { toolsQueryOptions } from '@/modules/tools/lib/tools-query';

import { ApprovalStatusBadge } from './approval-status-badge';

function formatEpochRelative(epoch: number): string {
  const diff = Date.now() - epoch;
  const absDiff = Math.abs(diff);
  const isFuture = diff < 0;
  const seconds = Math.floor(absDiff / 1000);
  if (seconds < 60) return isFuture ? 'In <1m' : 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return isFuture ? `In ${minutes}m` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return isFuture ? `In ${hours}h` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return isFuture ? `In ${days}d` : `${days}d ago`;
}

function formatEpochAbsolute(epoch: number): string {
  return new Date(epoch).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function RiskCell({ toolKey }: { toolKey: string }) {
  const { data } = useQuery(toolsQueryOptions());
  const tool = data?.tools.find((t) => t.key === toolKey);
  if (!tool) return null;
  return <RiskBadge level={tool.risk_level as RiskLevel} />;
}

export const approvalsColumns: ColumnDef<PendingAction>[] = [
  {
    accessorKey: 'agent_name',
    header: 'Agent',
    size: 180,
    cell: ({ row }) => (
      <span className="text-dash-ink text-[13.5px] font-medium">{row.original.agent_name}</span>
    ),
  },
  {
    accessorKey: 'tool_key',
    header: 'Tool',
    size: 200,
    cell: ({ row }) => (
      <span className="text-dash-ink-2 font-mono text-[12.5px]">{row.original.tool_key}</span>
    ),
  },
  {
    id: 'risk',
    header: 'Risk',
    size: 100,
    cell: ({ row }) => <RiskCell toolKey={row.original.tool_key} />,
  },
  {
    accessorKey: 'policy_hit',
    header: 'Policy Hit',
    size: 200,
    cell: ({ row }) => (
      <span className="text-dash-ink-2 text-[13px]">{row.original.policy_hit}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 120,
    filterFn: 'equals',
    cell: ({ row }) => <ApprovalStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    size: 160,
    cell: ({ row }) => (
      <div className="text-dash-ink-2">
        {formatEpochRelative(row.original.created_at)}
        <span className="text-dash-muted block text-[11.5px]">
          {formatEpochAbsolute(row.original.created_at)}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'expires_at',
    header: 'Expires',
    size: 160,
    cell: ({ row }) => (
      <div className="text-dash-ink-2">
        {formatEpochRelative(row.original.expires_at)}
        <span className="text-dash-muted block text-[11.5px]">
          {formatEpochAbsolute(row.original.expires_at)}
        </span>
      </div>
    ),
  },
];
