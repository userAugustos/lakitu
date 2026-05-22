import type { ColumnDef } from '@tanstack/react-table';

import { AgentCell } from './agent-cell';
import { ClawkeyBadge } from './clawkey-pill';
import { RowActions } from './row-actions';
import { StatusBadge } from './status-pill';
import { TimeCell } from './time-cell';
import type { AgentDisplayRow } from '../lib/agent-display';

export const agentsColumns: ColumnDef<AgentDisplayRow>[] = [
  {
    accessorKey: 'name',
    header: 'Agent',
    size: 320,
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
    size: 140,
    cell: ({ row }) => (
      <StatusBadge status={row.original.status} label={row.original.statusLabel} />
    ),
  },
  {
    accessorKey: 'editedRelative',
    header: 'Last edited',
    size: 180,
    cell: ({ row }) => (
      <TimeCell relative={row.original.editedRelative} absolute={row.original.editedAbsolute} />
    ),
  },
  {
    accessorKey: 'clawkeyState',
    header: 'Clawkey',
    size: 220,
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
    size: 140,
    cell: ({ row }) => <RowActions isRevoked={row.original.isRevoked} />,
  },
];
