import type { SupportedMimeType } from './types';

export const SUPPORTED_IMAGE_TYPES: SupportedMimeType[] = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

export const MAX_LOCAL_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function formatBytes(bytes: number): string {
  if (bytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** exponent;
  const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(1);

  return `${formatted} ${units[exponent]}`;
}

export function getCompressionRate(originalSize: number, outputSize: number): number {
  if (originalSize <= 0 || outputSize >= originalSize) {
    return 0;
  }

  return Math.round(((originalSize - outputSize) / originalSize) * 100);
}

export function isSupportedImageType(type: string): type is SupportedMimeType {
  return SUPPORTED_IMAGE_TYPES.includes(type as SupportedMimeType);
}

export function validateImageFile(file: File): { valid: boolean; reason?: string } {
  if (!isSupportedImageType(file.type)) {
    return {
      valid: false,
      reason: '首版仅支持 JPG、PNG、WebP 图片。'
    };
  }

  if (file.size > MAX_LOCAL_FILE_SIZE_BYTES) {
    return {
      valid: false,
      reason: `图片需小于 ${formatBytes(MAX_LOCAL_FILE_SIZE_BYTES)}，避免手机端卡顿。`
    };
  }

  return { valid: true };
}
