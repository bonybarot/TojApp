export const CURRENCY_SYMBOL = '$';

export const formatPrice = (minor: number): string =>
  `${CURRENCY_SYMBOL}${(minor / 100).toFixed(2)}`;

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
