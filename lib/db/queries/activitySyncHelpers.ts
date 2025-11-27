import { getDatabase } from '../database';

// Generic pending fetcher for local tables
export const getPending = async (table: string) => {
  const db = await getDatabase();
  return db.getAllAsync(`SELECT * FROM ${table} WHERE pending_sync = 1 AND deleted = 0`);
};

export const markSynced = async (table: string, id: string) => {
  const db = await getDatabase();
  await db.runAsync(`UPDATE ${table} SET pending_sync = 0 WHERE id = ?`, [id]);
};
