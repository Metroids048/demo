import { describe, expect, it } from 'vitest';
import {
  getGrowthAsset,
  getSeedContentByTool,
  miniProgramSearchKeywords,
  seedContentTemplates,
  toolGrowthAssets
} from '../growthAssets';

describe('growth assets', () => {
  it('defines share and keyword assets for each launch tool', () => {
    expect(toolGrowthAssets.map((item) => item.slug)).toEqual([
      'photo-ocr',
      'scan-to-pdf',
      'pdf-tools',
      'image-tools'
    ]);

    for (const asset of toolGrowthAssets) {
      expect(asset.keywords.length).toBeGreaterThanOrEqual(3);
      expect(asset.shareTitle.length).toBeGreaterThan(0);
      expect(asset.cta.length).toBeGreaterThan(0);
    }
  });

  it('fills mini program keyword slots up to the platform limit', () => {
    expect(miniProgramSearchKeywords.length).toBe(10);
  });

  it('provides at least ten seed content templates for launch testing', () => {
    expect(seedContentTemplates.length).toBeGreaterThanOrEqual(10);
    expect(getSeedContentByTool('photo-ocr').length).toBeGreaterThanOrEqual(2);
    expect(getGrowthAsset('pdf-tools')?.shareTitle).toMatch(/PDF/);
  });
});
