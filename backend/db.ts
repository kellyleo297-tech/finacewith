import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Server-side Supabase client — uses service key for full DB access
export const db = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || ''
);

// ── Helpers: type-safe query wrappers ──────────────────
export async function query(table: string, q: any) {
  return db.from(table).select(q.select || '*').match(q.match || {}).order(q.order || 'created_at', { ascending: false });
}

export async function insert(table: string, data: any) {
  return db.from(table).insert(data).select().single();
}

export async function update(table: string, id: string, data: any) {
  return db.from(table).update(data).eq('id', id).select().single();
}

export async function remove(table: string, id: string) {
  return db.from(table).delete().eq('id', id);
}
