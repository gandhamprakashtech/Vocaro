import Dexie, { type Table } from "dexie";

export interface CacheEntry<T = unknown> {
  key: string;
  updatedAt: number;
  data: T;
}

export interface OutboxItem {
  id?: number;
  type:
    | "vocabulary:add"
    | "vocabulary:update"
    | "vocabulary:delete"
    | "reminders:add"
    | "reminders:update"
    | "reminders:delete";
  payload: unknown;
  createdAt: number;
}

class VocaroDB extends Dexie {
  cache!: Table<CacheEntry, string>;
  outbox!: Table<OutboxItem, number>;

  constructor() {
    super("vocaro-db");
    this.version(1).stores({
      cache: "&key, updatedAt",
      outbox: "++id, type, createdAt",
    });
  }
}

export const db = new VocaroDB();

export async function readCache<T>(key: string): Promise<T | null> {
  const entry = await db.cache.get(key);
  return entry ? (entry.data as T) : null;
}

export async function writeCache<T>(key: string, data: T): Promise<void> {
  await db.cache.put({ key, data, updatedAt: Date.now() });
}

export async function addOutboxItem(
  item: Omit<OutboxItem, "id" | "createdAt"> & { createdAt?: number }
): Promise<number> {
  return db.outbox.add({
    ...item,
    createdAt: item.createdAt ?? Date.now(),
  });
}

export async function getOutboxItems(): Promise<OutboxItem[]> {
  return db.outbox.orderBy("createdAt").toArray();
}

export async function removeOutboxItems(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  await db.outbox.bulkDelete(ids);
}
