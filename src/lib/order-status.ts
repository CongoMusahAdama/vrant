export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  paid: 'Paid',
  pending: 'Awaiting payment',
  failed: 'Payment failed',
};

/** Customer-facing status badge styles */
export function orderStatusBadgeClass(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-50 text-emerald-900 border-emerald-300';
    case 'processing':
      return 'bg-sky-50 text-sky-900 border-sky-300';
    case 'shipped':
      return 'bg-indigo-50 text-indigo-900 border-indigo-300';
    case 'delivered':
      return 'bg-black text-white border-black';
    case 'cancelled':
      return 'bg-red-50 text-red-800 border-red-200';
    default:
      return 'bg-amber-50 text-amber-900 border-amber-200';
  }
}

export function orderStatusMessage(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'Your order has been confirmed by VRANT.';
    case 'processing':
      return 'Your order is being prepared.';
    case 'shipped':
      return 'Your order is on the way.';
    case 'delivered':
      return 'Your order has been delivered.';
    case 'cancelled':
      return 'This order was cancelled.';
    default:
      return 'We are reviewing your order.';
  }
}
