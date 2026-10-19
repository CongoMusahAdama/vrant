export type DeliveryMethod = 'delivery' | 'pickup';

export interface UserAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isDefault?: boolean;
  deliveryMethod?: DeliveryMethod;
  pickupStation?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  phone?: string;
  phoneVerified?: boolean;
  addresses?: UserAddress[];
  wishlist?: number[];
  avatar?: string;
  lastLogin?: string;
}

export interface DeliveryDetails {
  fullName: string;
  phone: string;
  deliveryMethod: DeliveryMethod;
  /** Home delivery — street / area */
  street: string;
  city: string;
  region: string;
  country: string;
  /** Pickup — station or where customer will collect */
  pickupStation: string;
}

export interface ShopOrderItem {
  productId: number;
  mongoProductId?: string;
  name: string;
  size: string;
  quantity: number;
  price: string;
  priceAmount: number;
  colorPreference?: string;
}

export interface OrderStatusHistoryEntry {
  status: string;
  changedAt: string;
  changedBy?: string;
  note?: string;
}

export interface ShopOrder {
  _id: string;
  orderNumber: string;
  items: ShopOrderItem[];
  shippingAddress: DeliveryDetails & {
    deliveryMethod?: DeliveryMethod;
    pickupStation?: string;
  };
  totalAmount: number;
  status: string;
  channel: string;
  paymentStatus?: 'pending' | 'paid' | 'failed';
  paystackReference?: string;
  statusHistory?: OrderStatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}
