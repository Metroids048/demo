import { describe, expect, it } from 'vitest';
import {
  createPdfResult,
  createTextResult,
  isPdfResult,
  isTextResult
} from '../resultTypes';

describe('unified processing results', () => {
  it('creates text results that can be copied or exported', () => {
    const result = createTextResult({
      toolSlug: 'photo-ocr',
      sourceFileName: 'receipt.jpg',
      text: '合计 128 元',
      confidence: 0.91,
      durationMs: 1200
    });

    expect(isTextResult(result)).toBe(true);
    expect(result.copyableText).toBe('合计 128 元');
    expect(result.outputFileName).toBe('receipt-ocr.txt');
  });

  it('creates pdf results with page count and file metadata', () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' });
    const result = createPdfResult({
      toolSlug: 'scan-to-pdf',
      sourceFileName: 'scan.jpg',
      blob,
      pageCount: 3
    });

    expect(isPdfResult(result)).toBe(true);
    expect(result.pageCount).toBe(3);
    expect(result.outputFileName).toBe('scan.pdf');
    expect(result.outputSize).toBe(blob.size);
  });
});
