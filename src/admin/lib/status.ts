import { ORDER_STATUSES, ORDER_STATUS_LABEL } from '@/lib/order-status';

export { ORDER_STATUSES };

export const STATUS_LABEL: Record<string, string> = {
  ...ORDER_STATUS_LABEL,
  paid: 'Paid',
  unpaid: 'Unpaid',
};
