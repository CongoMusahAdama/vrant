import type { CartItem } from '@/contexts/CartContext';
import type { ShopProduct } from '@/data/products';
import { getProductById } from '@/data/products';
import type { DeliveryDetails, ShopOrder } from '@/types/customer';

/** Set in .env as VITE_WHATSAPP_NUMBER=233XXXXXXXXX (country code, no + or spaces) */
const rawNumber = import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined;

export const WHATSAPP_NUMBER = (rawNumber || '233200906851').replace(/\D/g, '');

const DIVIDER = '────────────────';

/** Public URL for product images (WhatsApp prefilled text supports links, not embedded images) */
export function absoluteImageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const origin =
    typeof window !== 'undefined' ? window.location.origin : import.meta.env.VITE_SITE_URL || '';
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

export function openWhatsApp(message: string) {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function formatCedis(amount: number) {
  return `₵${amount.toLocaleString('en-GH')}`;
}

function section(title: string) {
  return [`*${title}*`, DIVIDER];
}

function greeting(intro: string) {
  return ['Hello VRANT Team,', '', intro, ''];
}

function closing(note: string) {
  return ['', note, '', 'Thank you.'];
}

function formatDeliveryForWhatsApp(delivery: DeliveryDetails): string[] {
  const lines = [
    ...section('DELIVERY'),
    `Name: ${delivery.fullName}`,
    `Phone: ${delivery.phone}`,
    `Country: ${delivery.country}`,
  ];

  if (delivery.deliveryMethod === 'pickup') {
    lines.push('Method: Pickup');
    lines.push(`Pickup location: ${delivery.pickupStation}`);
    if (delivery.city || delivery.region) {
      lines.push(`Area: ${[delivery.city, delivery.region].filter(Boolean).join(', ')}`);
    }
  } else {
    lines.push('Method: Home delivery');
    lines.push(`Address: ${delivery.street}`);
    lines.push(`${delivery.city}, ${delivery.region}`);
  }

  return lines;
}

function deliverySection(delivery?: DeliveryDetails | null) {
  if (!delivery) return [];
  return ['', ...formatDeliveryForWhatsApp(delivery)];
}

function imageLines(imagePath: string, label: string) {
  const url = absoluteImageUrl(imagePath);
  if (!url) return [];
  return [`${label}: ${url}`];
}

function formatCartItem(item: CartItem, index: number): string[] {
  const subtotal = item.priceAmount * item.quantity;
  return [
    `${index + 1}. *${item.name}*`,
    `   Size: ${item.size}  ·  Qty: ${item.quantity}  ·  ${item.price} each`,
    `   Subtotal: ${formatCedis(subtotal)}`,
    ...imageLines(item.frontImage, 'Image').map((line) => `   ${line}`),
    '',
  ];
}

export function buildSingleProductOrderMessage(
  product: ShopProduct,
  size: string,
  quantity = 1,
  delivery?: DeliveryDetails | null,
  options?: { colorPreference?: string }
) {
  const lineTotal = product.priceAmount * quantity;
  const extraImages = product.images?.length > 1 ? product.images.slice(1, 4) : [];

  const productLines = [
    ...section('PRODUCT'),
    `Name: ${product.name}`,
    `Size: ${size}`,
    `Quantity: ${quantity}`,
    ...(options?.colorPreference?.trim()
      ? [`Color preference: ${options.colorPreference.trim()}`]
      : []),
    `Unit price: ${product.price}`,
    `Line total: ${formatCedis(lineTotal)}`,
  ];

  const imageSection =
    product.frontImage || extraImages.length
      ? [
          '',
          ...section('PRODUCT IMAGES'),
          ...imageLines(product.frontImage, 'Front view'),
          ...extraImages.flatMap((src, i) => imageLines(src, `View ${i + 2}`)),
        ]
      : [];

  return [
    ...greeting('I would like to place a new order. Details are below.'),
    ...productLines,
    ...imageSection,
    ...deliverySection(delivery),
    ...closing(
      'Please confirm availability, delivery timeline, and payment details when ready.'
    ),
  ]
    .filter((line, i, arr) => line !== '' || (i > 0 && arr[i - 1] !== ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function buildOrderFollowUpMessage(order: ShopOrder) {
  const date = new Date(order.createdAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const status = STATUS_LABEL[order.status] || order.status;
  const payment =
    order.channel === 'paystack'
      ? order.paymentStatus === 'paid'
        ? 'Paid via Paystack'
        : order.paymentStatus === 'failed'
          ? 'Payment failed (Paystack)'
          : 'Awaiting Paystack payment'
      : 'WhatsApp checkout';

  const itemLines = order.items.flatMap((item, i) => {
    const product = getProductById(item.productId);
    const img = product?.frontImage ? imageLines(product.frontImage, 'Image') : [];
    const color = item.colorPreference ? `  ·  ${item.colorPreference}` : '';
    return [
      `${i + 1}. *${item.name}*`,
      `   Size: ${item.size}  ·  Qty: ${item.quantity}  ·  ${item.price}${color}`,
      ...img.map((line) => `   ${line}`),
      '',
    ];
  });

  return [
    ...greeting('I would like to follow up on my order.'),
    ...section('ORDER REFERENCE'),
    `Order number: ${order.orderNumber}`,
    `Date placed: ${date}`,
    `Status: ${status}`,
    `Payment: ${payment}`,
    `Total: ${formatCedis(order.totalAmount)}`,
    '',
    ...section(`ITEMS (${order.items.length})`),
    ...itemLines,
    ...deliverySection(order.shippingAddress),
    ...closing('Please advise on delivery or payment status at your earliest convenience.'),
  ]
    .filter((line, i, arr) => line !== '' || (i > 0 && arr[i - 1] !== ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

export function buildCartOrderMessage(
  items: CartItem[],
  total: number,
  delivery?: DeliveryDetails | null
) {
  const itemBlocks = items.flatMap((item, i) => formatCartItem(item, i));

  return [
    ...greeting('I would like to check out the following order.'),
    ...section(`ITEMS (${items.length})`),
    ...itemBlocks,
    ...section('ORDER SUMMARY'),
    `Total: ${formatCedis(total)}`,
    ...deliverySection(delivery),
    ...closing(
      'Please confirm item availability, delivery arrangements, and payment details.'
    ),
    '',
    '_Tap image links above to view product photos._',
  ]
    .filter((line, i, arr) => line !== '' || (i > 0 && arr[i - 1] !== ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

export function buildSupportMessage() {
  return [
    ...greeting('I would like assistance with an order or a general enquiry.'),
    'Please let me know how you can help.',
    '',
    'Thank you.',
  ].join('\n');
}
