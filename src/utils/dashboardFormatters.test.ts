import { describe, expect, it } from 'vitest';

import { formatWorkDaysFromHours } from './dashboardFormatters';

describe('formatWorkDaysFromHours', () => {
  it('formats full days and remaining hours', () => {
    expect(formatWorkDaysFromHours(18)).toBe('(2d 2h)');
  });

  it('returns zero hours for invalid or negative values', () => {
    expect(formatWorkDaysFromHours(-4)).toBe('(0h)');
    expect(formatWorkDaysFromHours(Number.NaN)).toBe('(0h)');
  });

  it('supports rendering without parentheses', () => {
    expect(formatWorkDaysFromHours(8, false)).toBe('1d');
  });
});
