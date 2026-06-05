import { validateImageFile } from './metrics';
import { createTextResult } from './resultTypes';
import type { TextResult } from './types';

export interface OcrInput {
  file: File;
  language: string;
}

export interface OcrAdapter {
  recognize(file: File, language: string): Promise<{
    text: string;
    confidence: number;
  }>;
}

export class BrowserOcrProcessor {
  constructor(private readonly adapter: OcrAdapter = new TesseractOcrAdapter()) {}

  async process(input: OcrInput): Promise<TextResult> {
    const validation = validateImageFile(input.file);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    const startedAt = performance.now();

    try {
      const recognized = await this.adapter.recognize(input.file, input.language);
      return createTextResult({
        toolSlug: 'photo-ocr',
        sourceFileName: input.file.name,
        text: recognized.text,
        confidence: recognized.confidence,
        durationMs: Math.round(performance.now() - startedAt)
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'unknown';
      throw new Error(`OCR 识别失败，请换一张更清晰的图片重试。(${detail})`);
    }
  }
}

class TesseractOcrAdapter implements OcrAdapter {
  async recognize(file: File, language: string): Promise<{ text: string; confidence: number }> {
    const { recognize } = await import('tesseract.js');
    const result = await recognize(file, language);

    return {
      text: result.data.text,
      confidence: result.data.confidence
    };
  }
}
