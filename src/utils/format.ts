export const CURRENCY_SYMBOL = '₹';

/** Integer paise to "₹2,999" (Indian digit grouping; paise shown only when non-zero). */
export const formatPrice = (minor: number): string => {
  const rupees = Math.floor(minor / 100);
  const paise = minor % 100;
  const grouped = String(rupees).replace(/(\d)(?=(\d\d)+\d$)/g, '$1,');
  return `${CURRENCY_SYMBOL}${grouped}${paise ? `.${String(paise).padStart(2, '0')}` : ''}`;
};

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
