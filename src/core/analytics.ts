import type { AnalyticsEvent, AnalyticsEventName, AnalyticsEventProperties } from './types';

export const ANALYTICS_STORAGE_KEY = 'office-tools.analytics';
const LEGACY_ANALYTICS_KEY = 'image-compress.analytics';
const MAX_EVENTS = 200;

export function getFileSizeBucket(bytes?: number): string | undefined {
  if (bytes === undefined) {
    return undefined;
  }

  if (bytes <= 1024 * 1024) {
    return 'le_1mb';
  }

  if (bytes <= 5 * 1024 * 1024) {
    return 'le_5mb';
  }

  if (bytes <= 10 * 1024 * 1024) {
    return 'le_10mb';
  }

  return 'gt_10mb';
}

export function getDurationBucket(durationMs?: number): string | undefined {
  if (durationMs === undefined) {
    return undefined;
  }

  if (durationMs <= 3000) {
    return 'le_3s';
  }

  if (durationMs <= 10000) {
    return 'le_10s';
  }

  if (durationMs <= 30000) {
    return 'le_30s';
  }

  return 'gt_30s';
}

export function detectAnalyticsChannel(search = ''): AnalyticsEventProperties['channel'] {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const channel = params.get('channel');

  if (channel === 'wechat' || channel === 'mini-program' || channel === 'content') {
    return channel;
  }

  if (params.get('from') === 'mini-program') {
    return 'mini-program';
  }

  if (typeof navigator !== 'undefined' && /MicroMessenger/i.test(navigator.userAgent)) {
    return 'wechat';
  }

  return channel ? 'unknown' : 'direct';
}

export function normalizeAnalyticsProperties(
  properties?: AnalyticsEventProperties
): AnalyticsEventProperties {
  const channel =
    properties?.channel ??
    (typeof window !== 'undefined' ? detectAnalyticsChannel(window.location.search) : 'direct');

  return {
    ...properties,
    channel,
    isMiniProgram: properties?.isMiniProgram ?? false
  };
}

function readStoredEvents(storage: StorageLike): AnalyticsEvent[] {
  const raw = storage.getItem(ANALYTICS_STORAGE_KEY) ?? storage.getItem(LEGACY_ANALYTICS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredEvents(storage: StorageLike, events: AnalyticsEvent[]): AnalyticsEvent[] {
  storage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(events.slice(0, MAX_EVENTS)));
  return events.slice(0, MAX_EVENTS);
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function trackEventWithStorage(
  storage: StorageLike,
  name: AnalyticsEventName,
  properties?: AnalyticsEventProperties
): AnalyticsEvent {
  const event: AnalyticsEvent = {
    name,
    createdAt: new Date().toISOString(),
    properties: normalizeAnalyticsProperties(properties)
  };

  const next = [event, ...readStoredEvents(storage)].slice(0, MAX_EVENTS);
  writeStoredEvents(storage, next);
  return event;
}

export function getAnalyticsEvents(storage: StorageLike = window.localStorage): AnalyticsEvent[] {
  return readStoredEvents(storage);
}

export function exportAnalyticsEvents(storage: StorageLike = window.localStorage): string {
  return JSON.stringify(getAnalyticsEvents(storage), null, 2);
}

export function clearAnalyticsEvents(storage: StorageLike = window.localStorage): void {
  storage.removeItem(ANALYTICS_STORAGE_KEY);
  storage.removeItem(LEGACY_ANALYTICS_KEY);
}

export function trackEvent(
  name: AnalyticsEventName,
  properties?: AnalyticsEventProperties
): AnalyticsEvent {
  return trackEventWithStorage(window.localStorage, name, properties);
}
