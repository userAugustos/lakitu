import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/shadcn/table';

import { ChevronLeftIcon, ChevronRightIcon } from '../lib/dashboard-icons';

interface AgentsDataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
}

const PAGE_SIZE = 8;

const HEAD_CLASS =
  'text-dash-muted bg-[#FAFBFD] px-4 py-3 text-left text-[11.5px] font-semibold tracking-[0.04em] whitespace-nowrap uppercase border-dash-line border-b';

const CELL_CLASS = 'border-dash-line-3 border-b px-4 py-3.5 align-middle';

export function AgentsDataTable<TData>({ columns, data }: AgentsDataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: PAGE_SIZE },
    },
  });

  if (data.length === 0) {
    return (
      <div className="border-dash-line rounded-[14px] border bg-white">
        <div className="text-dash-muted flex items-center justify-center py-16 text-[14px]">
          No agents yet
        </div>
      </div>
    );
  }

  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const start = pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalRows);
  const pageCount = table.getPageCount();

  return (
    <div className="border-dash-line overflow-hidden rounded-[14px] border bg-white">
      <Table className="w-full border-collapse text-[13.5px]">
        <TableHeader>
          <TableRow className="border-0 hover:bg-transparent">
            {table.getHeaderGroups().map((headerGroup) =>
              headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={`${HEAD_CLASS} ${header.column.id === 'actions' ? 'text-right' : ''}`}
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
            <TableRow
              key={row.id}
              className={`border-0 hover:bg-[#FAFBFD] ${(row.original as { isRevoked?: boolean }).isRevoked ? 'is-revoked' : ''}`}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={`${CELL_CLASS} ${cell.column.id === 'actions' ? 'text-right' : ''}`}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div
        data-testid="table-footer"
        className="text-dash-muted border-dash-line flex items-center justify-between border-t bg-[#FAFBFD] px-4 py-3 text-[12.5px]"
      >
        <span>
          Showing{' '}
          <b className="text-dash-ink">
            {start}&ndash;{end}
          </b>{' '}
          of {totalRows} agents
        </span>
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous page"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            className="border-dash-line text-dash-ink-2 hover:bg-dash-gray-bg inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[7px] border bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeftIcon />
          </button>
          {Array.from({ length: pageCount }, (_, i) => i).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => table.setPageIndex(page)}
              className={`inline-flex h-7 cursor-pointer items-center rounded-[7px] border border-transparent px-2.5 text-[12.5px] font-semibold ${
                page === pageIndex ? 'bg-dash-ink text-white' : 'text-dash-ink-2'
              }`}
            >
              {page + 1}
            </button>
          ))}
          <button
            type="button"
            aria-label="Next page"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            className="border-dash-line text-dash-ink-2 hover:bg-dash-gray-bg inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[7px] border bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
