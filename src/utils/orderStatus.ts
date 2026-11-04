import { FulfilmentMethod, OrderStatus } from '../types';
import { colors } from './theme';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PLACED: 'Order placed',
  CONFIRMED: 'Confirmed',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  READY_FOR_PICKUP: 'Ready for pickup',
  COLLECTED: 'Collected',
  CANCELLED: 'Cancelled',
};

export const STATUS_COLOR: Record<OrderStatus, string> = {
  PLACED: colors.info,
  CONFIRMED: colors.info,
  PACKED: colors.info,
  SHIPPED: colors.warning,
  OUT_FOR_DELIVERY: colors.warning,
  DELIVERED: colors.success,
  READY_FOR_PICKUP: colors.warning,
  COLLECTED: colors.success,
  CANCELLED: colors.error,
};

const DELIVERY_STEPS: OrderStatus[] = ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const PICKUP_STEPS: OrderStatus[] = ['PLACED', 'CONFIRMED', 'PACKED', 'READY_FOR_PICKUP', 'COLLECTED'];

/** Status steps shown on the order timeline; mirrors toj-backend order.domain.ts. */
export const timelineFor = (f: FulfilmentMethod): OrderStatus[] =>
  f === 'pickup' ? PICKUP_STEPS : DELIVERY_STEPS;

export const PAYMENT_LABEL: Record<string, string> = {
  PAY_AT_STORE: 'Pay at store',
  CARD_SIMULATED: 'Card (simulated)',
  COD: 'Cash on delivery',
};
