import type { ColumnDef } from '@tanstack/react-table';

import { AgentCell } from './agent-cell';
import { ClawkeyBadge } from './clawkey-pill';
import { PermissionsBadge } from './permissions-badge';
import { RowActions } from './row-actions';
import { StatusBadge } from './status-pill';
import { TimeCell } from './time-cell';
import type { AgentDisplayRow } from '../lib/agent-display';

export const agentsColumns: ColumnDef<AgentDisplayRow>[] = [
  {
    accessorKey: 'name',
    header: 'Agent',
    size: 280,
    cell: ({ row }) => (
      <AgentCell
        name={row.original.name}
        id={row.original.id}
        colorVariant={row.original.colorVariant}
        isRevoked={row.original.isRevoked}
      />
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 120,
    cell: ({ row }) => (
      <StatusBadge status={row.original.status} label={row.original.statusLabel} />
    ),
  },
  {
    accessorKey: 'permissionCount',
    header: 'Permissions',
    size: 120,
    cell: ({ row }) => <PermissionsBadge count={row.original.permissionCount} />,
  },
  {
    accessorKey: 'editedRelative',
    header: 'Last edited',
    size: 160,
    cell: ({ row }) => (
      <TimeCell relative={row.original.editedRelative} absolute={row.original.editedAbsolute} />
    ),
  },
  {
    accessorKey: 'clawkeyState',
    header: 'Clawkey',
    size: 200,
    cell: ({ row }) => (
      <ClawkeyBadge
        state={row.original.clawkeyState}
        label={row.original.clawkeyLabel}
        note={row.original.clawkeyNote}
      />
    ),
  },
  {
    id: 'actions',
    header: 'Actions',
    size: 120,
    cell: ({ row }) => (
      <RowActions
        agentId={row.original.agentId}
        agentName={row.original.name}
        isRevoked={row.original.isRevoked}
      />
    ),
  },
];
