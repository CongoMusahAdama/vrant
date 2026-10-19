import TablePagination from '@/components/ui/TablePagination';

type AdminPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  className?: string;
};

const AdminPagination = ({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  itemLabel = 'items',
  className,
}: AdminPaginationProps) => (
  <TablePagination
    page={page}
    totalPages={totalPages}
    total={total}
    pageSize={pageSize}
    onPageChange={onPageChange}
    itemLabel={itemLabel}
    className={className ?? 'mt-4 pt-4'}
    showWhenSinglePage
  />
);

export default AdminPagination;
