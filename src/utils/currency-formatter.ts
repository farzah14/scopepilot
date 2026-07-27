export function formatCurrency(
  cents: number | null | undefined,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  if (cents === null || cents === undefined || Number.isNaN(cents)) {
    return 'N/A';
  }

  const amount = cents / 100;

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    });
    return formatter.format(amount);
  } catch {
    const fallbackFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    });
    return fallbackFormatter.format(amount);
  }
}
