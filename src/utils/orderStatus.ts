import { OrderStatus } from '../types';
import { colors } from './theme';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PLACED: 'Order placed',
  CONFIRMED: 'Confirmed',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const STATUS_COLOR: Record<OrderStatus, string> = {
  PLACED: colors.info,
  CONFIRMED: colors.info,
  PACKED: colors.info,
  SHIPPED: colors.warning,
  OUT_FOR_DELIVERY: colors.warning,
  DELIVERED: colors.success,
  CANCELLED: colors.error,
};

export const TIMELINE: OrderStatus[] = [
  'PLACED',
  'CONFIRMED',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];
