import type { ColumnDef } from '@tanstack/react-table';

import type { AuditLogListEntry } from '@lakitu/api/audit-log';

import { DecisionBadge } from './decision-badge';

export const auditLogsColumns: ColumnDef<AuditLogListEntry>[] = [
  {
    accessorKey: 'created_at',
    header: 'Time',
    size: 180,
    cell: ({ row }) => new Date(row.original.created_at).toLocaleString(),
  },
  {
    accessorKey: 'agent_name',
    header: 'Actor',
    size: 160,
  },
  {
    accessorKey: 'action',
    header: 'Event',
    size: 200,
  },
  {
    accessorKey: 'decision',
    header: 'Decision',
    size: 140,
    cell: ({ row }) => <DecisionBadge decision={row.original.decision} />,
  },
  {
    accessorKey: 'reasons',
    header: 'Reasons',
    size: 240,
    cell: ({ row }) => {
      const reasons = row.original.reasons;
      return reasons.length > 0 ? reasons.join(', ') : '—';
    },
  },
];
