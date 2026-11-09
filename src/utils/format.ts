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

// Joined by hand: iOS writes "18 Aug at 2:35 PM", Android "18 Aug, 2:35 pm" for the same options.
export const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  const h = d.getHours();
  return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

// Pasted or autofilled "+91 98765 43210" / "098765 43210": drop the prefix, not the last digits.
export const localPhone = (t: string) => {
  const d = t.replace(/\D/g, '');
  return (d.length > 10 ? d.replace(/^(91|0)/, '') : d).slice(0, 10);
};
