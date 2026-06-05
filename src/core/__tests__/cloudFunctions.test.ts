import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const root = process.cwd();

describe('CloudBase cloud functions', () => {
  it('returns a clear configuration error when OCR credentials are missing', async () => {
    const { createMain } = require(resolve(root, 'cloudfunctions/ocrRecognize/index.js'));
    const main = createMain({
      env: {},
      cloud: {},
      now: () => 1000
    });

    const result = await main({ fileID: 'cloud://demo/photo.jpg', language: 'zh_en' });

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('OCR_NOT_CONFIGURED');
    expect(result.message).toContain('OCR 服务未配置');
  });

  it('recognizes OCR text through an injected provider without fake success', async () => {
    const { createMain } = require(resolve(root, 'cloudfunctions/ocrRecognize/index.js'));
    const main = createMain({
      env: { TENCENTCLOUD_SECRET_ID: 'id', TENCENTCLOUD_SECRET_KEY: 'key' },
      cloud: {
        downloadFile: vi.fn(async () => ({ fileContent: Buffer.from('image') }))
      },
      ocrProvider: {
        recognize: vi.fn(async () => ({
          text: '发票金额 128 元',
          confidence: 0.92,
          blocks: [{ text: '发票金额 128 元', confidence: 0.92 }]
        }))
      },
      now: vi.fn().mockReturnValueOnce(1000).mockReturnValueOnce(1450)
    });

    const result = await main({ fileID: 'cloud://demo/photo.jpg', language: 'zh_en' });

    expect(result).toMatchObject({
      ok: true,
      text: '发票金额 128 元',
      confidence: 0.92,
      durationMs: 450,
      provider: 'tencentcloud-ocr'
    });
  });

  it('rejects PDF processing without files', async () => {
    const { createMain } = require(resolve(root, 'cloudfunctions/pdfProcess/index.js'));
    const main = createMain({ cloud: {} });

    const result = await main({ mode: 'imagesToPdf', fileIDs: [] });

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('NO_FILES');
  });

  it('stores feedback when a database adapter is available', async () => {
    const add = vi.fn(async () => ({ _id: 'feedback-1' }));
    const { createMain } = require(resolve(root, 'cloudfunctions/feedbackSubmit/index.js'));
    const main = createMain({
      db: {
        collection: vi.fn(() => ({ add }))
      },
      now: () => '2026-06-05T00:00:00.000Z'
    });

    const result = await main({
      toolSlug: 'photo-ocr',
      rating: 4,
      category: 'accuracy',
      content: '识别速度可以，表格还需要优化',
      context: { channel: 'mini-program' }
    });

    expect(result.ok).toBe(true);
    expect(add).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ toolSlug: 'photo-ocr', rating: 4 })
    }));
  });
});
