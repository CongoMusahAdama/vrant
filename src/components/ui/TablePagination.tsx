import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TablePaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** e.g. "orders", "products", "customers" */
  itemLabel?: string;
  className?: string;
  /** Show bar even when everything fits on one page */
  showWhenSinglePage?: boolean;
};

const TablePagination = ({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  itemLabel = 'items',
  className,
  showWhenSinglePage = false,
}: TablePaginationProps) => {
  if (total <= 0) return null;
  if (totalPages <= 1 && !showWhenSinglePage) return null;

  const safePage = Math.min(Math.max(1, page), Math.max(1, totalPages));
  const start = (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);
  const label = total === 1 ? itemLabel.replace(/s$/, '') : itemLabel;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 px-4 py-4 border-t border-black/10 bg-black/[0.02]',
        className
      )}
    >
      <p className="text-[9px] font-bold uppercase tracking-wider text-black/45 text-center sm:text-left">
        Showing {start}–{end} of {total} {label}
        {totalPages > 1 ? ` · page ${safePage} of ${totalPages}` : ''}
      </p>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex sm:justify-end sm:gap-2">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="inline-flex items-center justify-center gap-1 border border-black/20 px-3 py-3 min-h-[48px] text-[9px] font-bold tracking-[0.12em] uppercase disabled:opacity-40 hover:bg-black/[0.04] active:bg-black/[0.06] transition-colors sm:min-w-[96px]"
        >
          <ChevronLeft className="w-4 h-4" />
          Prev
        </button>
        <span className="text-[10px] font-bold uppercase tracking-wider text-black tabular-nums text-center px-2 sm:hidden">
          {safePage} / {totalPages}
        </span>
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="inline-flex items-center justify-center gap-1 border border-black/20 px-3 py-3 min-h-[48px] text-[9px] font-bold tracking-[0.12em] uppercase disabled:opacity-40 hover:bg-black/[0.04] active:bg-black/[0.06] transition-colors sm:min-w-[96px]"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default TablePagination;
