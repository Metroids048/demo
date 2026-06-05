import { describe, expect, it } from 'vitest';
import {
  ANALYTICS_STORAGE_KEY,
  clearAnalyticsEvents,
  detectAnalyticsChannel,
  exportAnalyticsEvents,
  getDurationBucket,
  getFileSizeBucket,
  normalizeAnalyticsProperties,
  trackEventWithStorage
} from '../analytics';
import { createMemoryStorage } from '../recentTasks';

describe('analytics', () => {
  it('normalizes required attribution fields', () => {
    const normalized = normalizeAnalyticsProperties({
      toolSlug: 'photo-ocr',
      category: 'ocr',
      inputType: 'image/jpeg',
      outputType: 'text',
      sourceContentId: 'ocr-pain-01'
    });

    expect(normalized.toolSlug).toBe('photo-ocr');
    expect(normalized.channel).toBeDefined();
    expect(normalized.isMiniProgram).toBe(false);
  });

  it('detects mini program and content channels from query params', () => {
    expect(detectAnalyticsChannel('?from=mini-program')).toBe('mini-program');
    expect(detectAnalyticsChannel('?channel=content&content=ocr-pain-01')).toBe('content');
  });

  it('stores and exports events for verification', () => {
    const storage = createMemoryStorage();
    trackEventWithStorage(storage, 'process_success', {
      toolSlug: 'pdf-tools',
      category: 'pdf',
      outputType: 'pdf',
      fileSizeBucket: getFileSizeBucket(2 * 1024 * 1024),
      durationBucket: getDurationBucket(4200)
    });

    const exported = JSON.parse(exportAnalyticsEvents(storage));
    expect(exported).toHaveLength(1);
    expect(exported[0].name).toBe('process_success');
    expect(exported[0].properties.fileSizeBucket).toBe('le_5mb');
    expect(exported[0].properties.durationBucket).toBe('le_10s');

    clearAnalyticsEvents(storage);
    expect(storage.getItem(ANALYTICS_STORAGE_KEY)).toBeNull();
  });
});
