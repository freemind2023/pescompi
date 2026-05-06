import { supabase } from './supabase';
import { randomUUID } from 'crypto';

export interface SessionData {
  analysis?: Record<string, unknown>;
  messages?: Record<string, unknown>[];
  alerts?: Record<string, unknown>[];
}

export async function createSession(): Promise<string> {
  const id = randomUUID();
  await supabase.from('pes_sessions').insert({
    id,
    data: {},
    expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  });
  return id;
}

export async function getSession(id: string): Promise<SessionData | null> {
  const { data, error } = await supabase
    .from('pes_sessions')
    .select('data')
    .eq('id', id)
    .gt('expires_at', new Date().toISOString())
    .single();
  if (error || !data) return null;
  return data.data as SessionData;
}

export async function updateSession(id: string, updates: Partial<SessionData>): Promise<void> {
  const session = await getSession(id);
  if (!session) return;
  const newData = { ...session, ...updates };
  await supabase.from('pes_sessions').update({ data: newData }).eq('id', id);
}

export async function sessionExists(id: string): Promise<boolean> {
  const session = await getSession(id);
  return session !== null;
}

export async function addMessage(id: string, message: Record<string, unknown>): Promise<void> {
  const session = await getSession(id);
  if (!session) return;
  const messages = [...(session.messages || []), message];
  await updateSession(id, { messages });
}

export async function purgeExpired(): Promise<void> {
  await supabase.from('pes_sessions').delete().lt('expires_at', new Date().toISOString());
}
