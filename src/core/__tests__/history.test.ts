import { describe, expect, it } from 'vitest';
import { createMemoryStorage, RecentTaskStore } from '../recentTasks';

describe('recent task store', () => {
  it('keeps the newest five local tasks', () => {
    const store = new RecentTaskStore(createMemoryStorage());

    for (let index = 1; index <= 6; index += 1) {
      store.add({
        id: `task-${index}`,
        fileName: `photo-${index}.jpg`,
        createdAt: `2026-06-0${index}T00:00:00.000Z`,
        originalSize: index * 1000,
        outputSize: index * 500,
        quality: 0.8,
        maxWidth: 1600,
        mimeType: 'image/jpeg'
      });
    }

    const tasks = store.list();
    expect(tasks).toHaveLength(5);
    expect(tasks[0].id).toBe('task-6');
    expect(tasks.at(-1)?.id).toBe('task-2');
  });

  it('ignores corrupted storage instead of breaking the app', () => {
    const storage = createMemoryStorage();
    storage.setItem('image-compress.recent', 'not-json');

    const store = new RecentTaskStore(storage);

    expect(store.list()).toEqual([]);
  });
});
