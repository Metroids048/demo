import { describe, expect, it } from 'vitest';
import { createPdfFromImageFiles, createPdfResultFromBytes, getPdfOutputName } from '../pdfProcessor';

describe('PDF processor helpers', () => {
  it('creates stable output names for generated pdf files', () => {
    expect(getPdfOutputName('lecture.photo.jpg')).toBe('lecture.photo.pdf');
    expect(getPdfOutputName('')).toBe('document.pdf');
  });

  it('wraps generated pdf bytes into a unified result', () => {
    const bytes = new Uint8Array([37, 80, 68, 70]);
    const result = createPdfResultFromBytes({
      toolSlug: 'scan-to-pdf',
      sourceFileName: 'scan.jpg',
      bytes,
      pageCount: 1
    });

    expect(result.kind).toBe('pdf');
    expect(result.pageCount).toBe(1);
    expect(result.outputMimeType).toBe('application/pdf');
    expect(result.outputSize).toBe(4);
  });

  it('rejects image formats pdf-lib cannot embed directly', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'screen.webp', { type: 'image/webp' });

    await expect(createPdfFromImageFiles([file])).rejects.toThrow('PDF 生成首版仅支持 JPG/PNG 图片');
  });
});
