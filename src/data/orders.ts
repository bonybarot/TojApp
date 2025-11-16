export interface OrderItem {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  total: number;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
}

export const orders: Order[] = [
  {
    id: 'ORD-001',
    date: '2024-01-15',
    status: 'delivered',
    items: [
      {
        id: '1',
        title: 'Classic White T-Shirt',
        price: 29.99,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
        quantity: 2,
      },
      {
        id: '2',
        title: 'Slim Fit Jeans',
        price: 79.99,
        image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
        quantity: 1,
      },
    ],
    total: 139.97,
    shippingAddress: {
      name: 'John Doe',
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    },
    paymentMethod: 'Credit Card ending in 1234',
  },
  {
    id: 'ORD-002',
    date: '2024-01-20',
    status: 'shipped',
    items: [
      {
        id: '3',
        title: 'Black Leather Jacket',
        price: 199.99,
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
        quantity: 1,
      },
    ],
    total: 199.99,
    shippingAddress: {
      name: 'John Doe',
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    },
    paymentMethod: 'Credit Card ending in 1234',
  },
  {
    id: 'ORD-003',
    date: '2024-02-01',
    status: 'processing',
    items: [
      {
        id: '4',
        title: 'Cotton Hoodie',
        price: 59.99,
        image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
        quantity: 1,
      },
      {
        id: '5',
        title: 'Chino Pants',
        price: 69.99,
        image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400',
        quantity: 1,
      },
    ],
    total: 129.98,
    shippingAddress: {
      name: 'John Doe',
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    },
    paymentMethod: 'PayPal',
  },
  {
    id: 'ORD-004',
    date: '2024-02-10',
    status: 'pending',
    items: [
      {
        id: '6',
        title: 'Polo Shirt',
        price: 39.99,
        image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400',
        quantity: 3,
      },
    ],
    total: 119.97,
    shippingAddress: {
      name: 'John Doe',
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    },
    paymentMethod: 'Credit Card ending in 1234',
  },
];

