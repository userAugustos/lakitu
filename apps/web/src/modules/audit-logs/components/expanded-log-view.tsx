import { flexRender } from '@tanstack/react-table';
import { ChevronRight } from 'lucide-react';
import type { Row } from '@tanstack/react-table';

import type { AuditLogListEntry } from '@lakitu/api/audit-log';

import { TableCell, TableRow } from '@repo/ui/shadcn/table';
import { cn } from '@repo/ui/utils';

import { AuditLogDetailDrawer } from './audit-log-detail-drawer';

const CELL_CLASS = 'border-dash-line-3 border-b px-4 py-3.5 align-middle';

interface ExpandedLogViewProps {
  row: Row<AuditLogListEntry>;
  columnCount: number;
}

export function ExpandedLogView({ row, columnCount }: ExpandedLogViewProps) {
  const { id } = row.original;
  const isExpanded = row.getIsExpanded();

  return (
    <>
      <TableRow data-testid={`audit-log-row-${id}`} className="border-0 hover:bg-[#FAFBFD]">
        <TableCell className={CELL_CLASS} style={{ width: 36 }}>
          <button
            type="button"
            data-testid={`audit-log-row-expand-${id}`}
            className="flex cursor-pointer items-center justify-center p-0.5"
            aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
            aria-expanded={isExpanded}
            onClick={() => row.toggleExpanded()}
          >
            <ChevronRight
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                isExpanded && 'rotate-90'
              )}
            />
          </button>
        </TableCell>
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id} className={CELL_CLASS}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
      {isExpanded && (
        <tr>
          <td colSpan={columnCount} className="p-0">
            <AuditLogDetailDrawer entry={row.original} />
          </td>
        </tr>
      )}
    </>
  );
}
