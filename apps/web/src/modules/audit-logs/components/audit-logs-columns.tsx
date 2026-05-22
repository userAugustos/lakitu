import type { ColumnDef } from '@tanstack/react-table';

import type { AuditLogListEntry } from '@lakitu/api/audit-log';

import { DecisionBadge } from './decision-badge';

export const auditLogsColumns: ColumnDef<AuditLogListEntry>[] = [
  {
    accessorKey: 'agent_name',
    header: 'Agent',
    size: 180,
  },
  {
    accessorKey: 'action',
    header: 'Action',
    size: 200,
  },
  {
    accessorKey: 'decision',
    header: 'Decision',
    size: 160,
    cell: ({ row }) => <DecisionBadge decision={row.original.decision} />,
  },
  {
    accessorKey: 'reasons',
    header: 'Reasons',
    size: 260,
    cell: ({ row }) => {
      const reasons = row.original.reasons;
      return reasons.length > 0 ? reasons.join(', ') : '—';
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Timestamp',
    size: 200,
    cell: ({ row }) => new Date(row.original.created_at).toLocaleString(),
  },
];
