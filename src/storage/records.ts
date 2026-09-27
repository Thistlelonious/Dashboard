export type Saved = { id: string; updatedAt: string; deletedAt?: string }

export function newRecord<T extends object>(fields: T, now: string): T & Saved {
  return { ...fields, id: crypto.randomUUID(), updatedAt: now }
}

export function touch<T extends { updatedAt: string }>(record: T, now: string): T {
  return { ...record, updatedAt: now }
}

// A merge keeps the copy with the newer updatedAt, so a delete has to be newer than the live copies it replaces.
export function softDelete<T extends Saved>(record: T, now: string): T {
  return { ...record, deletedAt: now, updatedAt: now }
}

export function live<T extends Saved>(records: readonly T[]): T[] {
  return records.filter((record) => record.deletedAt === undefined)
}
