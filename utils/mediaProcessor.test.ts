import { describe, it, expect } from 'vitest';
import { formatBytes, formatDuration } from './mediaProcessor';

describe('mediaProcessor utilities', () => {
  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
    });

    it('should handle decimal places', () => {
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1572864)).toBe('1.5 MB');
    });

    it('should use custom decimal places', () => {
      expect(formatBytes(1536, 0)).toBe('2 KB');
      expect(formatBytes(1536, 1)).toBe('1.5 KB');
    });
  });

  describe('formatDuration', () => {
    it('should format seconds to time string', () => {
      expect(formatDuration(0)).toBe('00:00');
      expect(formatDuration(30)).toBe('00:30');
      expect(formatDuration(60)).toBe('01:00');
      expect(formatDuration(90)).toBe('01:30');
    });

    it('should format hours correctly', () => {
      expect(formatDuration(3600)).toBe('01:00:00');
      expect(formatDuration(3661)).toBe('01:01:01');
      expect(formatDuration(7200)).toBe('02:00:00');
    });

    it('should handle edge cases', () => {
      expect(formatDuration(NaN)).toBe('00:00');
      expect(formatDuration(Infinity)).toBe('00:00');
    });

    it('should pad with zeros', () => {
      expect(formatDuration(3)).toBe('00:03');
      expect(formatDuration(303)).toBe('05:03');
    });
  });
});
