import { describe, expect, it } from 'vitest';
import {
  formatBytes,
  getCompressionRate,
  isSupportedImageType,
  validateImageFile
} from '../metrics';

describe('image compression metrics', () => {
  it('formats bytes for result cards', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3 MB');
  });

  it('calculates saved ratio without negative values', () => {
    expect(getCompressionRate(1000, 250)).toBe(75);
    expect(getCompressionRate(1000, 1000)).toBe(0);
    expect(getCompressionRate(1000, 1200)).toBe(0);
  });

  it('recognizes first-version supported image types only', () => {
    expect(isSupportedImageType('image/jpeg')).toBe(true);
    expect(isSupportedImageType('image/png')).toBe(true);
    expect(isSupportedImageType('image/webp')).toBe(true);
    expect(isSupportedImageType('image/gif')).toBe(false);
  });

  it('validates file type and size for local processing', () => {
    const ok = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    const badType = new File(['x'], 'photo.gif', { type: 'image/gif' });
    const tooLarge = new File([new Uint8Array(11 * 1024 * 1024)], 'big.jpg', {
      type: 'image/jpeg'
    });

    expect(validateImageFile(ok).valid).toBe(true);
    expect(validateImageFile(badType).valid).toBe(false);
    expect(validateImageFile(tooLarge).valid).toBe(false);
  });
});
