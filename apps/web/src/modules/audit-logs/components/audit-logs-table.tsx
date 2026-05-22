import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

import type { AuditLogListEntry } from '@lakitu/api/audit-log';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/shadcn/table';

import { auditLogsColumns } from './audit-logs-columns';

const HEAD_CLASS =
  'text-dash-muted bg-[#FAFBFD] px-4 py-3 text-left text-[11.5px] font-semibold tracking-[0.04em] whitespace-nowrap uppercase border-dash-line border-b';

const CELL_CLASS = 'border-dash-line-3 border-b px-4 py-3.5 align-middle';

interface AuditLogsTableProps {
  entries: AuditLogListEntry[];
}

export function AuditLogsTable({ entries }: AuditLogsTableProps) {
  const table = useReactTable({
    data: entries,
    columns: auditLogsColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (entries.length === 0) {
    return (
      <div
        data-testid="audit-logs-table"
        className="border-dash-line rounded-[14px] border bg-white"
      >
        <div className="text-dash-muted flex items-center justify-center py-16 text-[14px]">
          No audit log entries
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="audit-logs-table"
      className="border-dash-line overflow-hidden rounded-[14px] border bg-white"
    >
      <Table className="w-full border-collapse text-[13.5px]">
        <TableHeader>
          <TableRow className="border-0 hover:bg-transparent">
            {table.getHeaderGroups().map((headerGroup) =>
              headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={HEAD_CLASS}
                  style={{ width: header.getSize() }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="border-0 hover:bg-[#FAFBFD]">
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className={CELL_CLASS}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
