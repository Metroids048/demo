import { describe, expect, it } from 'vitest';
import { disclosures, imageCompressManifest } from '../toolManifest';

describe('tool manifest', () => {
  it('keeps image compression as a legacy local image feature', () => {
    expect(imageCompressManifest.slug).toBe('image-compress');
    expect(imageCompressManifest.launchPhase).toBe('legacy');
    expect(imageCompressManifest.localOnly).toBe(true);
    expect(imageCompressManifest.supportedMimeTypes).toEqual([
      'image/jpeg',
      'image/png',
      'image/webp'
    ]);
    expect(imageCompressManifest.analyticsEvents).toContain('process_success');
  });

  it('discloses the new launch dependencies', () => {
    expect(disclosures.map((item) => item.name)).toEqual(
      expect.arrayContaining(['Tesseract.js', 'pdf-lib', 'React', 'Vite'])
    );
    expect(disclosures.every((item) => item.modifiedSource === false)).toBe(true);
  });
});
