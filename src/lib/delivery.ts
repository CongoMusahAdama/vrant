import type { AuthUser, DeliveryDetails, UserAddress } from '@/types/customer';

export function getDeliveryFromUser(user: AuthUser | null): DeliveryDetails | null {
  if (!user) return null;
  const addr: UserAddress | undefined =
    user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];
  if (!addr) return null;

  const method = addr.deliveryMethod || 'delivery';
  const hasDelivery = Boolean(addr.street?.trim() && addr.city?.trim());
  const hasPickup = Boolean(addr.pickupStation?.trim() || (method === 'pickup' && addr.street?.trim()));

  if (!hasDelivery && !hasPickup) return null;

  return {
    fullName: user.name,
    phone: user.phone || '',
    deliveryMethod: method,
    street: method === 'delivery' ? addr.street || '' : '',
    city: addr.city || '',
    region: addr.state || '',
    country: addr.country || 'Ghana',
    pickupStation:
      addr.pickupStation || (method === 'pickup' ? addr.street || '' : ''),
  };
}

export function isDeliveryComplete(delivery: DeliveryDetails | null): boolean {
  if (!delivery) return false;
  const base =
    delivery.fullName?.trim() &&
    delivery.phone?.trim() &&
    delivery.country?.trim() &&
    delivery.city?.trim() &&
    delivery.region?.trim();

  if (!base) return false;

  if (delivery.deliveryMethod === 'pickup') {
    return Boolean(delivery.pickupStation?.trim());
  }

  return Boolean(delivery.street?.trim());
}

export function deliveryToAddressPayload(delivery: DeliveryDetails) {
  const isPickup = delivery.deliveryMethod === 'pickup';
  return {
    name: delivery.fullName,
    phone: delivery.phone,
    addresses: [
      {
        street: isPickup ? delivery.pickupStation : delivery.street,
        city: delivery.city,
        state: delivery.region,
        country: delivery.country || 'Ghana',
        deliveryMethod: delivery.deliveryMethod,
        pickupStation: isPickup ? delivery.pickupStation : '',
        isDefault: true,
      },
    ],
  };
}

export function formatDeliveryBlock(delivery: DeliveryDetails): string {
  const lines = [
    'Delivery details:',
    `Name: ${delivery.fullName}`,
    `Phone: ${delivery.phone}`,
    `Country: ${delivery.country}`,
  ];

  if (delivery.deliveryMethod === 'pickup') {
    lines.push('Method: Pickup');
    lines.push(`Pickup station / location: ${delivery.pickupStation}`);
    if (delivery.city || delivery.region) {
      lines.push(`Area: ${[delivery.city, delivery.region].filter(Boolean).join(', ')}`);
    }
  } else {
    lines.push('Method: Home delivery');
    lines.push(`Address: ${delivery.street}`);
    lines.push(`${delivery.city}, ${delivery.region}`);
  }

  return lines.join('\n');
}
