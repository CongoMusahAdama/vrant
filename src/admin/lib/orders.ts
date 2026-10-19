import type { AdminShopOrder } from '@/admin/types/admin';
import type { ShopOrder } from '@/types/customer';
import { getProductById } from '@/data/products';

export function customerLabel(order: AdminShopOrder) {
  const c = order.customer;
  if (c && typeof c === 'object') {
    return { name: c.name, email: c.email, phone: c.phone };
  }
  const addr = order.shippingAddress;
  return {
    name: addr?.fullName || 'Customer',
    email: '',
    phone: addr?.phone,
  };
}

export function paymentStatus(order: ShopOrder) {
  if (order.channel === 'paystack') {
    return order.paymentStatus || 'pending';
  }
  return 'whatsapp';
}

export function orderItemImages(order: ShopOrder) {
  return order.items.map((item) => {
    const product = getProductById(item.productId);
    return {
      key: `${item.productId}-${item.size}`,
      src: product?.frontImage || '',
      name: item.name,
    };
  });
}

export function itemsSummary(order: ShopOrder) {
  const first = order.items[0];
  if (!first) return '—';
  const extra = order.items.length > 1 ? ` +${order.items.length - 1} more` : '';
  const color = first.colorPreference ? ` · ${first.colorPreference}` : '';
  return `${first.name} (${first.size}×${first.quantity})${extra}${color}`;
}
