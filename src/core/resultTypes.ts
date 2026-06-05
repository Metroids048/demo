import type { PdfResult, ProcessingResult, TextResult } from './types';

interface TextResultInput {
  toolSlug: string;
  sourceFileName: string;
  text: string;
  confidence: number;
  durationMs: number;
}

interface PdfResultInput {
  toolSlug: string;
  sourceFileName: string;
  blob: Blob;
  pageCount: number;
}

export function createTextResult(input: TextResultInput): TextResult {
  const normalizedText = input.text.trim();

  return {
    id: crypto.randomUUID(),
    kind: 'text',
    toolSlug: input.toolSlug,
    sourceFileName: input.sourceFileName,
    text: normalizedText,
    copyableText: normalizedText,
    confidence: normalizeConfidence(input.confidence),
    durationMs: input.durationMs,
    outputFileName: `${stripExtension(input.sourceFileName) || 'result'}-ocr.txt`,
    outputMimeType: 'text/plain',
    createdAt: new Date().toISOString()
  };
}

export function createPdfResult(input: PdfResultInput): PdfResult {
  const blob = input.blob.type === 'application/pdf'
    ? input.blob
    : new Blob([input.blob], { type: 'application/pdf' });

  return {
    id: crypto.randomUUID(),
    kind: 'pdf',
    toolSlug: input.toolSlug,
    sourceFileName: input.sourceFileName,
    outputBlob: blob,
    outputFileName: `${stripExtension(input.sourceFileName) || 'document'}.pdf`,
    outputMimeType: 'application/pdf',
    outputSize: blob.size,
    pageCount: input.pageCount,
    createdAt: new Date().toISOString()
  };
}

export function isTextResult(result: ProcessingResult): result is TextResult {
  return result.kind === 'text';
}

export function isPdfResult(result: ProcessingResult): result is PdfResult {
  return result.kind === 'pdf';
}

export function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '');
}

function normalizeConfidence(confidence: number): number {
  if (confidence > 1) {
    return Math.round(confidence) / 100;
  }

  return Math.max(0, Math.min(1, confidence));
}
