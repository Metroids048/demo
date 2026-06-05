import { describe, expect, it } from 'vitest';
import {
  getLaunchTools,
  getToolBySlug,
  getToolsByCategory,
  toolRegistry
} from '../toolRegistry';

describe('tool registry', () => {
  it('prioritizes the four mass-market launch tools', () => {
    expect(getLaunchTools().map((tool) => tool.slug)).toEqual([
      'photo-ocr',
      'scan-to-pdf',
      'pdf-tools',
      'image-tools'
    ]);
  });

  it('does not over-promise pdf split/extract in launch copy', () => {
    const pdfTool = getToolBySlug('pdf-tools');
    expect(pdfTool?.tagline).toMatch(/合并|图片转 PDF/);
    expect(pdfTool?.tagline).toMatch(/二阶段|暂不支持|不支持/);
  });

  it('keeps image compression as a secondary image feature', () => {
    const imageTools = getToolsByCategory('image');

    expect(imageTools.map((tool) => tool.slug)).toContain('image-tools');
    expect(getToolBySlug('image-compress')?.launchPhase).toBe('legacy');
  });

  it('records demand, complexity, processing mode, and outputs for each public tool', () => {
    for (const tool of toolRegistry) {
      expect(tool.demandScore).toBeGreaterThanOrEqual(1);
      expect(tool.complexityScore).toBeGreaterThanOrEqual(1);
      expect(tool.processingMode).toMatch(/local|hybrid|server/);
      expect(tool.inputTypes?.length).toBeGreaterThan(0);
      expect(tool.outputTypes?.length).toBeGreaterThan(0);
    }
  });
});
