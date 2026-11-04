export interface ColorOption {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  title: string;
  /** Integer minor units (cents). */
  price: number;
  compareAtPrice?: number;
  categoryId: string;
  image: string;
  images: string[];
  description: string;
  details: string[];
  colors: ColorOption[];
  sizes: string[];
  /** Units in stock keyed by `${colorName}|${size}`. */
  stock: Record<string, number>;
  pickupAvailable: boolean;
  tag?: 'New' | 'Bestseller';
  /** Present when loaded from the API; cart and stock calls are keyed by variant id. */
  variants?: Variant[];
}

export interface Variant {
  id: string;
  sku: string;
  color: string;
  size: string;
  stock: number;
}

export interface Category {
  id: string;
  title: string;
  image: string;
}

export interface CartLine {
  lineId: string;
  productId: string;
  color: string;
  size: string;
  quantity: number;
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
}

export type FulfilmentMethod = 'delivery' | 'pickup';

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'READY_FOR_PICKUP'
  | 'COLLECTED'
  | 'CANCELLED';

export interface OrderItem {
  productId: string;
  variantId?: string;
  sku?: string;
  title: string;
  image: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  placedAt: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  fulfilment: FulfilmentMethod;
  address?: Address;
  pickupStore?: string;
  paymentMethod: string;
  orderNumber?: number;
  paymentStatus?: 'PENDING' | 'PAID' | 'REFUNDED';
  cancelReason?: string | null;
  timeline?: { status: OrderStatus; at: string; actor: string; note?: string | null }[];
}

export interface PickupLocation {
  id: string;
  name: string;
  address: string;
  hours: string;
}
