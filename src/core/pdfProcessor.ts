import { createPdfResult, stripExtension } from './resultTypes';
import type { PdfResult } from './types';

interface PdfBytesInput {
  toolSlug: string;
  sourceFileName: string;
  bytes: Uint8Array;
  pageCount: number;
}

export function getPdfOutputName(sourceFileName: string): string {
  return `${stripExtension(sourceFileName) || 'document'}.pdf`;
}

export function createPdfResultFromBytes(input: PdfBytesInput): PdfResult {
  const blob = new Blob([new Uint8Array(input.bytes)], { type: 'application/pdf' });
  return {
    ...createPdfResult({
      toolSlug: input.toolSlug,
      sourceFileName: input.sourceFileName,
      blob,
      pageCount: input.pageCount
    }),
    outputFileName: getPdfOutputName(input.sourceFileName)
  };
}

export async function createPdfFromImageFiles(files: File[], toolSlug = 'scan-to-pdf'): Promise<PdfResult> {
  if (!files.length) {
    throw new Error('请先选择至少一张图片。');
  }

  const { PDFDocument } = await import('pdf-lib');
  const pdf = await PDFDocument.create();

  for (const file of files) {
    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      throw new Error('PDF 生成首版仅支持 JPG/PNG 图片，WebP 可先在图片工具中转成 JPG。');
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const image = file.type === 'image/png' ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
    const page = pdf.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height
    });
  }

  return createPdfResultFromBytes({
    toolSlug,
    sourceFileName: files.length === 1 ? files[0].name : 'merged-images.pdf',
    bytes: await pdf.save(),
    pageCount: files.length
  });
}

export async function mergePdfFiles(files: File[]): Promise<PdfResult> {
  if (files.length < 2) {
    throw new Error('PDF 合并至少需要 2 个文件。');
  }

  const { PDFDocument } = await import('pdf-lib');
  const output = await PDFDocument.create();

  for (const file of files) {
    const source = await PDFDocument.load(await file.arrayBuffer());
    const pages = await output.copyPages(source, source.getPageIndices());
    pages.forEach((page) => output.addPage(page));
  }

  return createPdfResultFromBytes({
    toolSlug: 'pdf-tools',
    sourceFileName: 'merged.pdf',
    bytes: await output.save(),
    pageCount: output.getPageCount()
  });
}
