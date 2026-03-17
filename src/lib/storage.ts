import { openDB } from "idb";
import type { PersistedTranslationData } from "../types/translation";

const DB_NAME = "vertimai-db";
const STORE_NAME = "translation-files";
const STORE_KEY = "active";

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME);
    }
  },
});

export async function savePersistedData(data: PersistedTranslationData) {
  const db = await dbPromise;
  await db.put(STORE_NAME, data, STORE_KEY);
}

export async function loadPersistedData(): Promise<PersistedTranslationData | null> {
  const db = await dbPromise;
  return (await db.get(STORE_NAME, STORE_KEY)) ?? null;
}

export async function clearPersistedData() {
  const db = await dbPromise;
  await db.delete(STORE_NAME, STORE_KEY);
}
