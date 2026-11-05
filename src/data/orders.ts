import { Order } from '../types';
import { products } from './products';

const item = (productId: string, color: string, size: string, quantity: number) => {
  const p = products.find(x => x.id === productId)!;
  return { productId, title: p.title, image: p.image, color, size, quantity, unitPrice: p.price };
};

const mk = (
  id: string,
  placedAt: string,
  status: Order['status'],
  items: Order['items'],
  fulfilment: Order['fulfilment'],
): Order => {
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const deliveryFee = fulfilment === 'pickup' || subtotal >= 10000 ? 0 : 599;
  return {
    id,
    placedAt,
    status,
    items,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    fulfilment,
    address:
      fulfilment === 'delivery'
        ? { id: 'seed', label: 'Home', fullName: 'Demo Customer', phone: '9876543210', line1: '24 Garden Road', city: 'Your City', postalCode: '400001' }
        : undefined,
    pickupStore: fulfilment === 'pickup' ? 'TOJ Flagship Store' : undefined,
    paymentMethod: fulfilment === 'pickup' ? 'Pay at store' : 'Cash on delivery',
  };
};

export const seedOrders = (): Order[] => [
  mk('TOJ-1004', '2026-09-20T10:15:00Z', 'OUT_FOR_DELIVERY', [item('1', 'White', 'M', 2)], 'delivery'),
  mk('TOJ-1003', '2026-09-02T16:40:00Z', 'DELIVERED', [item('2', 'Black', '32', 1), item('6', 'Black', 'M', 1)], 'delivery'),
  mk('TOJ-1002', '2026-08-18T09:05:00Z', 'DELIVERED', [item('5', 'Stone', '32', 1)], 'pickup'),
  mk('TOJ-1001', '2026-07-30T13:20:00Z', 'CANCELLED', [item('7', 'Charcoal', 'L', 1)], 'delivery'),
];
