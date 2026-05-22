import { ChevronLeftIcon, ChevronRightIcon } from '../lib/dashboard-icons';

interface TableFooterProps {
  total: number;
  pageSize: number;
  currentPage: number;
}

export function TableFooter({ total, pageSize, currentPage }: TableFooterProps) {
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div
      data-testid="table-footer"
      className="text-dash-muted border-dash-line flex items-center justify-between border-t bg-[#FAFBFD] px-4 py-3 text-[12.5px]"
    >
      <span>
        Showing{' '}
        <b className="text-dash-ink">
          {start}&ndash;{end}
        </b>{' '}
        of {total} agents
      </span>
      <div className="inline-flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous"
          className="border-dash-line text-dash-ink-2 hover:bg-dash-gray-bg inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[7px] border bg-white"
        >
          <ChevronLeftIcon />
        </button>
        {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((page) => (
          <span
            key={page}
            className={`inline-flex h-7 items-center rounded-[7px] px-2.5 text-[12.5px] font-semibold ${
              page === currentPage ? 'bg-dash-ink text-white' : 'text-dash-ink-2'
            }`}
          >
            {page}
          </span>
        ))}
        <button
          type="button"
          aria-label="Next"
          className="border-dash-line text-dash-ink-2 hover:bg-dash-gray-bg inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[7px] border bg-white"
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
}
