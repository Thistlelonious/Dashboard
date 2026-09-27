export type Saved = { id: string; updatedAt: string; deletedAt?: string }

export function newRecord<T extends object>(fields: T, now: string): T & Saved {
  return { ...fields, id: crypto.randomUUID(), updatedAt: now }
}

export function touch<T extends { updatedAt: string }>(record: T, now: string): T {
  return { ...record, updatedAt: now }
}

export function softDelete<T extends Saved>(record: T, now: string): T {
  return touch({ ...record, deletedAt: now }, now)
}

export function live<T extends Saved>(records: readonly T[]): T[] {
  return records.filter((record) => record.deletedAt === undefined)
}
