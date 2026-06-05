import type { RecentTask } from './types';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const RECENT_TASKS_KEY = 'image-compress.recent';
const MAX_RECENT_TASKS = 5;

export function createMemoryStorage(): StorageLike {
  const store = new Map<string, string>();

  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => {
      store.delete(key);
    }
  };
}

export class RecentTaskStore {
  constructor(private readonly storage: StorageLike, private readonly key = RECENT_TASKS_KEY) {}

  list(): RecentTask[] {
    const raw = this.storage.getItem(this.key);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_TASKS) : [];
    } catch {
      return [];
    }
  }

  add(task: RecentTask): RecentTask[] {
    const existing = this.list().filter((item) => item.id !== task.id);
    const next = [task, ...existing].slice(0, MAX_RECENT_TASKS);
    this.storage.setItem(this.key, JSON.stringify(next));
    return next;
  }

  clear(): void {
    this.storage.removeItem(this.key);
  }
}

export function createBrowserRecentTaskStore(): RecentTaskStore {
  return new RecentTaskStore(window.localStorage);
}
