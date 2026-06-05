import { getCompressionRate, validateImageFile } from './metrics';
import type { CompressionOptions, ImageResult, LocalProcessor, ProcessingInput, SupportedMimeType } from './types';

interface LoadedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  close?: () => void;
}

export class BrowserImageCompressor implements LocalProcessor {
  async process(
    input: ProcessingInput,
    onProgress?: (progress: number, label: string) => void
  ): Promise<ImageResult> {
    const validation = validateImageFile(input.file);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    onProgress?.(0.12, '读取图片');
    const loaded = await loadImage(input.file);

    onProgress?.(0.36, '计算输出尺寸');
    const size = fitWithinBounds(loaded.width, loaded.height, input.options.maxWidth);
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;

    const context = canvas.getContext('2d', {
      alpha: input.options.outputType === 'image/png'
    });

    if (!context) {
      throw new Error('当前浏览器不支持本地图片处理。');
    }

    context.drawImage(loaded.source, 0, 0, size.width, size.height);
    loaded.close?.();

    onProgress?.(0.72, '生成压缩结果');
    const outputBlob = await canvasToBlob(canvas, input.options);
    const outputFileName = createOutputFileName(input.file.name, input.options.outputType);

    onProgress?.(1, '处理完成');
    return {
      id: crypto.randomUUID(),
      kind: 'image',
      toolSlug: 'image-tools',
      sourceFileName: input.file.name,
      originalFileName: input.file.name,
      originalSize: input.file.size,
      outputSize: outputBlob.size,
      outputBlob,
      outputFileName,
      outputMimeType: input.options.outputType,
      previewUrl: URL.createObjectURL(outputBlob),
      compressionRate: getCompressionRate(input.file.size, outputBlob.size),
      width: size.width,
      height: size.height,
      createdAt: new Date().toISOString(),
      options: input.options
    };
  }
}

async function loadImage(file: File): Promise<LoadedImage> {
  if ('createImageBitmap' in window) {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close()
    };
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('图片读取失败，请换一张图片重试。'));
      element.src = url;
    });

    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function fitWithinBounds(width: number, height: number, maxWidth: number): { width: number; height: number } {
  if (width <= maxWidth) {
    return { width, height };
  }

  const ratio = maxWidth / width;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio)
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, options: CompressionOptions): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('图片导出失败，请降低尺寸后重试。'));
          return;
        }
        resolve(blob);
      },
      options.outputType,
      options.outputType === 'image/png' ? undefined : options.quality
    );
  });
}

function createOutputFileName(fileName: string, outputType: SupportedMimeType): string {
  const extensionByType: Record<SupportedMimeType, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
  };
  const baseName = fileName.replace(/\.[^.]+$/, '');
  return `${baseName || 'compressed'}-compressed.${extensionByType[outputType]}`;
}
