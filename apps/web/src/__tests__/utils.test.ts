import { describe, it, expect } from 'vitest';
import {
  cn,
  formatOdds,
  formatCurrency,
  shortenAddress,
  calculatePotentialReturn,
} from '../lib/utils';

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      const result = cn('foo', 'bar');
      expect(result).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'included', false && 'excluded');
      expect(result).toBe('base included');
    });

    it('should merge tailwind classes correctly', () => {
      const result = cn('p-4', 'p-2');
      expect(result).toBe('p-2');
    });
  });

  describe('formatOdds', () => {
    it('should format odds to 2 decimal places', () => {
      expect(formatOdds(2.5)).toBe('2.50');
      expect(formatOdds(1.333)).toBe('1.33');
      expect(formatOdds(10)).toBe('10.00');
    });
  });

  describe('formatCurrency', () => {
    it('should format amount with USDC', () => {
      expect(formatCurrency(1000)).toBe('1,000.00 USDC');
    });

    it('should format amount with custom currency', () => {
      expect(formatCurrency(500, 'SOL')).toBe('500.00 SOL');
    });

    it('should handle decimals', () => {
      expect(formatCurrency(99.99)).toBe('99.99 USDC');
    });
  });

  describe('shortenAddress', () => {
    it('should shorten wallet address', () => {
      const address = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
      expect(shortenAddress(address)).toBe('7xKX...gAsU');
    });

    it('should use custom length', () => {
      const address = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
      expect(shortenAddress(address, 6)).toBe('7xKXtg...osgAsU');
    });

    it('should handle short addresses', () => {
      // Function always shortens, even short strings
      expect(shortenAddress('short')).toBe('shor...hort');
    });
  });

  describe('calculatePotentialReturn', () => {
    it('should calculate potential return', () => {
      expect(calculatePotentialReturn(100, 2.5)).toBe(250);
      expect(calculatePotentialReturn(50, 1.5)).toBe(75);
    });

    it('should handle zero stake', () => {
      expect(calculatePotentialReturn(0, 2.0)).toBe(0);
    });
  });
});
