import { describe, expect, it } from 'vitest';
import { BrowserOcrProcessor } from '../ocrProcessor';

describe('OCR processor', () => {
  it('returns normalized text results from an OCR adapter', async () => {
    const processor = new BrowserOcrProcessor({
      recognize: async () => ({
        text: '  发票号码 12345  ',
        confidence: 88
      })
    });
    const file = new File(['image'], 'invoice.jpg', { type: 'image/jpeg' });

    const result = await processor.process({ file, language: 'chi_sim+eng' });

    expect(result.kind).toBe('text');
    expect(result.copyableText).toBe('发票号码 12345');
    expect(result.confidence).toBe(0.88);
    expect(result.outputFileName).toBe('invoice-ocr.txt');
  });

  it('surfaces adapter failures with a recoverable message', async () => {
    const processor = new BrowserOcrProcessor({
      recognize: async () => {
        throw new Error('worker failed');
      }
    });
    const file = new File(['image'], 'invoice.jpg', { type: 'image/jpeg' });

    await expect(processor.process({ file, language: 'chi_sim+eng' })).rejects.toThrow(
      'OCR 识别失败'
    );
  });
});
