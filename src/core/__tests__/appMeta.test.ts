import { describe, expect, it } from 'vitest';
import {
  PRODUCT_NAME,
  SEO_DESCRIPTION,
  SEO_TITLE,
  capabilityBoundaries,
  deferredCapabilities,
  getCapabilityBoundary,
  isH5Available,
  isMiniProgramNative
} from '../appMeta';

describe('app meta', () => {
  it('uses the office assistant positioning instead of image-compress-only branding', () => {
    expect(PRODUCT_NAME).toContain('手机办公文件处理助手');
    expect(SEO_TITLE).toContain('手机办公文件处理助手');
    expect(SEO_DESCRIPTION).toMatch(/拍图识字|PDF|本地/);
    expect(SEO_TITLE).not.toBe('图片压缩助手');
  });

  it('documents first-version capability boundaries for all launch tools', () => {
    expect(capabilityBoundaries.map((item) => item.slug)).toEqual([
      'photo-ocr',
      'scan-to-pdf',
      'pdf-tools',
      'image-tools'
    ]);
    expect(getCapabilityBoundary('pdf-tools')?.summary).toMatch(/合并|图片转 PDF/);
    expect(getCapabilityBoundary('pdf-tools')?.summary).toMatch(/暂不支持|不支持/);
  });

  it('marks deferred capabilities explicitly', () => {
    expect(deferredCapabilities.some((item) => item.includes('拆分'))).toBe(true);
    expect(deferredCapabilities.some((item) => item.includes('云 OCR'))).toBe(true);
  });

  it('distinguishes H5 availability from mini program native support', () => {
    expect(isH5Available('photo-ocr')).toBe(true);
    expect(isMiniProgramNative('photo-ocr')).toBe(false);
    expect(isMiniProgramNative('image-tools')).toBe(true);
  });
});
