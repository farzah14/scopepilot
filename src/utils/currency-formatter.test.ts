import { describe, expect, it } from 'vitest';
import { formatCurrency } from '@/utils/currency-formatter';

describe('currency-formatter', () => {
  it('formats USD cents correctly', () => {
    expect(formatCurrency(150000, 'USD', 'en-US')).toBe('$1,500');
    expect(formatCurrency(150050, 'USD', 'en-US')).toBe('$1,500.50');
  });

  it('formats IDR cents correctly', () => {
    const formatted = formatCurrency(500000000, 'IDR', 'id-ID');
    expect(formatted).toContain('5.000.000');
  });

  it('formats EUR cents correctly', () => {
    const formatted = formatCurrency(250000, 'EUR', 'de-DE');
    expect(formatted).toContain('2.500');
  });

  it('returns N/A for null, undefined, or NaN', () => {
    expect(formatCurrency(null)).toBe('N/A');
    expect(formatCurrency(undefined)).toBe('N/A');
    expect(formatCurrency(NaN)).toBe('N/A');
  });

  it('handles zero cents', () => {
    expect(formatCurrency(0, 'USD', 'en-US')).toBe('$0');
  });
});
