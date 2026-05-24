import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { FilterFn, OnChangeFn } from '@tanstack/react-table';

import type { AuditLogListEntry } from '@lakitu/api/audit-log';

import { Button } from '@repo/ui/shadcn/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@repo/ui/shadcn/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/shadcn/table';
import { ChevronLeftIcon, ChevronRightIcon } from '@/modules/dashboard/lib/dashboard-icons';

import { AuditLogDetailDrawer } from './audit-log-detail-drawer';
import { auditLogsColumns } from './audit-logs-columns';

const PAGE_SIZE = 8;

const HEAD_CLASS =
  'text-dash-muted bg-[#FAFBFD] px-4 py-3 text-left text-[11.5px] font-semibold tracking-[0.04em] whitespace-nowrap uppercase border-dash-line border-b';

const CELL_CLASS = 'border-dash-line-3 border-b px-4 py-3.5 align-middle';

const auditLogGlobalFilter: FilterFn<AuditLogListEntry> = (row, _columnId, filterValue) => {
  const query = String(filterValue ?? '')
    .trim()
    .toLowerCase();

  if (!query) return true;

  const entry = row.original;
  return [
    entry.agent_name,
    entry.action,
    entry.decision,
    entry.reasons.join(' '),
    entry.policy_hit,
    entry.request_id,
    new Date(entry.created_at).toLocaleString(),
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(query));
};

interface AuditLogsTableProps {
  entries: AuditLogListEntry[];
  globalFilter: string;
  onGlobalFilterChange: OnChangeFn<string>;
}

export function AuditLogsTable({
  entries,
  globalFilter,
  onGlobalFilterChange,
}: AuditLogsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const table = useReactTable({
    data: entries,
    columns: auditLogsColumns,
    state: { globalFilter },
    onGlobalFilterChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: auditLogGlobalFilter,
    initialState: {
      pagination: { pageSize: PAGE_SIZE },
    },
  });

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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

  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const start = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalRows);
  const pageCount = table.getPageCount();

  return (
    <div
      data-testid="audit-logs-table"
      className="border-dash-line overflow-hidden rounded-[14px] border bg-white"
    >
      <Table className="w-full border-collapse text-[13.5px]">
        <TableHeader>
          <TableRow className="border-0 hover:bg-transparent">
            <TableHead className={HEAD_CLASS} style={{ width: 36 }} />
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
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => {
              const isExpanded = expandedRows.has(row.original.id);
              return (
                <Collapsible
                  key={row.id}
                  open={isExpanded}
                  onOpenChange={() => toggleRow(row.original.id)}
                >
                  <TableRow
                    data-testid={`audit-log-row-${row.original.id}`}
                    className="border-0 hover:bg-[#FAFBFD]"
                  >
                    <TableCell className={CELL_CLASS} style={{ width: 36 }}>
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          data-testid={`audit-log-row-expand-${row.original.id}`}
                          className="flex items-center justify-center p-0.5"
                          aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </CollapsibleTrigger>
                    </TableCell>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={CELL_CLASS}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  <CollapsibleContent asChild>
                    <tr>
                      <td colSpan={auditLogsColumns.length + 1} className="p-0">
                        <AuditLogDetailDrawer entry={row.original} />
                      </td>
                    </tr>
                  </CollapsibleContent>
                </Collapsible>
              );
            })
          ) : (
            <TableRow className="border-0 hover:bg-transparent">
              <TableCell colSpan={auditLogsColumns.length + 1} className="px-4 py-12 text-center">
                <span className="text-dash-muted text-[14px]">No audit log entries found</span>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="text-dash-muted border-dash-line flex items-center justify-between border-t bg-[#FAFBFD] px-4 py-3 text-[12.5px]">
        <span>
          Showing{' '}
          <b className="text-dash-ink">
            {start}&ndash;{end}
          </b>{' '}
          of {totalRows} entries
        </span>
        {pageCount > 1 && (
          <div className="inline-flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Previous page"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              className="h-7 w-7 rounded-[7px]"
            >
              <ChevronLeftIcon />
            </Button>
            {Array.from({ length: pageCount }, (_, i) => i).map((page) => (
              <Button
                key={page}
                type="button"
                variant={page === pageIndex ? 'default' : 'ghost'}
                size="sm"
                onClick={() => table.setPageIndex(page)}
                className="h-7 min-w-[28px] rounded-[7px] px-2.5 text-[12.5px] font-semibold"
              >
                {page + 1}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Next page"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
              className="h-7 w-7 rounded-[7px]"
            >
              <ChevronRightIcon />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
