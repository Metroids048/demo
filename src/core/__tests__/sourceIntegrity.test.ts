import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(process.cwd());

describe('source integrity', () => {
  it('aligns H5 SEO metadata with office assistant positioning', () => {
    const html = readFileSync(resolve(root, 'index.html'), 'utf8');
    expect(html).toContain('手机办公文件处理助手');
    expect(html).not.toContain('<title>图片压缩助手</title>');
  });

  it('removes fake OCR completion and H5-primary copy from mini program source', () => {
    const ocrSource = readFileSync(resolve(root, 'miniprogram/pages/ocr/ocr.js'), 'utf8');
    const ocrView = readFileSync(resolve(root, 'miniprogram/pages/ocr/ocr.wxml'), 'utf8');
    expect(ocrSource).not.toMatch(/预留.*OCR|固定占位|识别结果.*预留|openH5/);
    expect(ocrSource).toMatch(/ocrRecognize|callCloudFunction/);
    expect(ocrView).not.toContain('在 H5');
  });

  it('routes legacy mini program index page to home', () => {
    const indexSource = readFileSync(resolve(root, 'miniprogram/pages/index/index.js'), 'utf8');
    expect(indexSource).toMatch(/pages\/home\/home/);
  });
});
