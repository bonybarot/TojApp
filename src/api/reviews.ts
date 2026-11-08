import { api } from './client';

/** ADR-0028: verified-purchase reviews (server checks the order was collected). */
export interface ProductReviews {
  count: number;
  average: number | null;
  items: { id: string; rating: number; body: string; author: string; createdAt: string }[];
}
export interface MyReview {
  productId: string;
  rating: number;
  body: string;
}

export const productReviews = (productId: string) => api<ProductReviews>(`/products/${productId}/reviews`);
export const myReviews = () => api<MyReview[]>('/me/reviews');
export const saveReview = (productId: string, rating: number, body: string) =>
  api<MyReview>(`/me/reviews/${productId}`, { method: 'PUT', body: { rating, body } });
export const deleteReview = (productId: string) => api(`/me/reviews/${productId}`, { method: 'DELETE' });

export const stars = (n: number) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
