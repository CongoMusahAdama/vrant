import TablePagination from '@/components/ui/TablePagination';

export const ORDERS_PAGE_SIZE = 5;

type OrdersTablePaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
};

const OrdersTablePagination = (props: OrdersTablePaginationProps) => (
  <TablePagination
    {...props}
    pageSize={ORDERS_PAGE_SIZE}
    itemLabel="orders"
    showWhenSinglePage
  />
);

export default OrdersTablePagination;
