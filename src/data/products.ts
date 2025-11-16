export interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  description: string;
  images?: string[];
}

export const products: Product[] = [
  {
    id: '1',
    title: 'Classic White T-Shirt',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    category: 'Tops',
    description: 'Comfortable and versatile white t-shirt made from 100% organic cotton. Perfect for everyday wear.',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400',
    ],
  },
  {
    id: '2',
    title: 'Slim Fit Jeans',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
    category: 'Bottoms',
    description: 'Premium denim jeans with a modern slim fit. Comfortable stretch fabric for all-day wear.',
    images: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400',
    ],
  },
  {
    id: '3',
    title: 'Black Leather Jacket',
    price: 199.99,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
    category: 'Outerwear',
    description: 'Classic black leather jacket with a timeless design. Perfect for adding edge to any outfit.',
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
      'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=400',
    ],
  },
  {
    id: '4',
    title: 'Cotton Hoodie',
    price: 59.99,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
    category: 'Outerwear',
    description: 'Soft and cozy cotton hoodie with a relaxed fit. Perfect for casual days and cool evenings.',
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400',
    ],
  },
  {
    id: '5',
    title: 'Chino Pants',
    price: 69.99,
    image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400',
    category: 'Bottoms',
    description: 'Versatile chino pants that work for both casual and business casual occasions.',
    images: [
      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400',
    ],
  },
  {
    id: '6',
    title: 'Polo Shirt',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400',
    category: 'Tops',
    description: 'Classic polo shirt in a comfortable cotton blend. Perfect for smart casual looks.',
    images: [
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    ],
  },
  {
    id: '7',
    title: 'Wool Coat',
    price: 249.99,
    image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400',
    category: 'Outerwear',
    description: 'Elegant wool coat perfect for winter. Classic design with modern tailoring.',
    images: [
      'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400',
      'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=400',
    ],
  },
  {
    id: '8',
    title: 'Cargo Shorts',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1591195853828-11a59f114b1f?w=400',
    category: 'Bottoms',
    description: 'Functional cargo shorts with multiple pockets. Great for outdoor activities.',
    images: [
      'https://images.unsplash.com/photo-1591195853828-11a59f114b1f?w=400',
      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400',
    ],
  },
  {
    id: '9',
    title: 'Denim Shirt',
    price: 54.99,
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400',
    category: 'Tops',
    description: 'Classic denim shirt that pairs well with jeans or chinos. Versatile wardrobe staple.',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400',
    ],
  },
  {
    id: '10',
    title: 'Sweatpants',
    price: 44.99,
    image: 'https://images.unsplash.com/photo-1506629905607-0c0b2c4c0a8a?w=400',
    category: 'Bottoms',
    description: 'Comfortable sweatpants perfect for lounging or workouts. Soft and breathable fabric.',
    images: [
      'https://images.unsplash.com/photo-1506629905607-0c0b2c4c0a8a?w=400',
      'https://images.unsplash.com/photo-1591195853828-11a59f114b1f?w=400',
    ],
  },
  {
    id: '11',
    title: 'Button-Down Shirt',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1594938291221-94f313b0e3d3?w=400',
    category: 'Tops',
    description: 'Crisp button-down shirt suitable for office or casual wear. Easy-care fabric.',
    images: [
      'https://images.unsplash.com/photo-1594938291221-94f313b0e3d3?w=400',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400',
    ],
  },
  {
    id: '12',
    title: 'Bomber Jacket',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
    category: 'Outerwear',
    description: 'Stylish bomber jacket with a modern fit. Lightweight and perfect for transitional weather.',
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
    ],
  },
  {
    id: '13',
    title: 'Tank Top',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    category: 'Tops',
    description: 'Lightweight tank top perfect for warm weather or layering. Soft cotton material.',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400',
    ],
  },
  {
    id: '14',
    title: 'Joggers',
    price: 54.99,
    image: 'https://images.unsplash.com/photo-1506629905607-0c0b2c4c0a8a?w=400',
    category: 'Bottoms',
    description: 'Modern joggers with tapered fit. Perfect for athleisure or casual wear.',
    images: [
      'https://images.unsplash.com/photo-1506629905607-0c0b2c4c0a8a?w=400',
      'https://images.unsplash.com/photo-1591195853828-11a59f114b1f?w=400',
    ],
  },
  {
    id: '15',
    title: 'Windbreaker',
    price: 74.99,
    image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=400',
    category: 'Outerwear',
    description: 'Lightweight windbreaker perfect for outdoor activities. Water-resistant and breathable.',
    images: [
      'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=400',
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
    ],
  },
];

