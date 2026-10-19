export function formatGhs(amount: number) {
  return `₵${amount.toLocaleString('en-GH', { maximumFractionDigits: 0 })}`;
}

export function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
