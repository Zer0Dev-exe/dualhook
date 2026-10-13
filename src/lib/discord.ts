/* Cliente mínimo de la API de webhooks de Discord (Discord permite CORS en estas rutas). */
import { buildPayload } from './payload';
import type { Message, WebhookInfo } from './types';
import { sleep } from './utils';

const API = 'https://discord.com/api/v10';

export function parseWebhookUrl(url: string) {
  const m = (url || '').trim().match(/^https?:\/\/(?:(?:canary|ptb)\.)?discord(?:app)?\.com\/api(?:\/v\d+)?\/webhooks\/(\d+)\/([\w-]+)/);
  return m ? { id: m[1], token: m[2], base: `${API}/webhooks/${m[1]}/${m[2]}` } : null;
}

export function parseMessageId(input: string) {
  const s = (input || '').trim();
  const link = s.match(/channels\/(?:\d+|@me)\/(\d+)\/(\d+)/);
  if (link) return { channelId: link[1], messageId: link[2] };
  if (/^\d{15,21}$/.test(s)) return { messageId: s };
  return null;
}

export class DiscordError extends Error {
  constructor(message: string, public status: number, public data: unknown) {
    super(message);
  }
}

interface ErrorTree {
  _errors?: { message: string }[];
  [k: string]: unknown;
}

function formatDiscordError(data: { message?: string; code?: number; errors?: ErrorTree } | null, status: number) {
  if (!data) return `HTTP ${status}`;
  const lines = [`${data.message || 'Error'} (HTTP ${status}${data.code ? `, código ${data.code}` : ''})`];
  const walk = (o: unknown, path: string) => {
    if (!o || typeof o !== 'object') return;
    const t = o as ErrorTree;
    t._errors?.forEach((e) => lines.push(`• ${path || 'payload'}: ${e.message}`));
    for (const [k, v] of Object.entries(t)) if (k !== '_errors') walk(v, path ? `${path}.${k}` : k);
  };
  walk(data.errors, '');
  return lines.join('\n');
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (e) {
      throw new Error(`No se pudo conectar con Discord.\n${(e as Error).message}`);
    }
    if (res.status === 429) {
      const j = await res.json().catch(() => ({}));
      await sleep(((j as { retry_after?: number }).retry_after || 1) * 1000 + 150);
      continue;
    }
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (!res.ok) throw new DiscordError(formatDiscordError(data, res.status), res.status, data);
    return data as T;
  }
  throw new Error('Rate limit: demasiadas peticiones, prueba en unos segundos.');
}

function hook(url: string) {
  const w = parseWebhookUrl(url);
  if (!w) throw new Error('La URL del webhook no es válida.\nDebe ser como https://discord.com/api/webhooks/ID/TOKEN');
  return w;
}

function msgRef(input: string) {
  const p = parseMessageId(input);
  if (!p) throw new Error('El ID o enlace del mensaje no es válido.');
  return p;
}

const threadQs = (threadId?: string) => (threadId?.trim() ? `?thread_id=${encodeURIComponent(threadId.trim())}` : '');

export interface ApiMessage {
  id: string;
  channel_id: string;
  flags?: number;
  attachments?: unknown[];
  [k: string]: unknown;
}

export const discord = {
  async getWebhook(url: string): Promise<WebhookInfo> {
    const d = await request<{ id: string; name: string; avatar: string | null; channel_id: string; guild_id?: string; application_id?: string | null }>(hook(url).base);
    return {
      name: d.name,
      avatarUrl: d.avatar ? `https://cdn.discordapp.com/avatars/${d.id}/${d.avatar}.png?size=128` : null,
      channel_id: d.channel_id,
      guild_id: d.guild_id,
      application_id: d.application_id || null,
      checkedAt: Date.now(),
    };
  },

  async send(m: Message, url: string, files: File[]): Promise<ApiMessage> {
    const w = hook(url);
    const edit = m.editMessageId ? msgRef(m.editMessageId) : null;
    const payload = buildPayload(m, files, { forEdit: !!edit });
    const qs = new URLSearchParams();
    if (!edit) qs.set('wait', 'true');
    if (payload.components?.length) qs.set('with_components', 'true');
    if (m.thread_id.trim()) qs.set('thread_id', m.thread_id.trim());
    const endpoint = (edit ? `${w.base}/messages/${edit.messageId}` : w.base) + (qs.size ? `?${qs}` : '');
    const init: RequestInit = { method: edit ? 'PATCH' : 'POST' };
    if (files.length) {
      const fd = new FormData();
      fd.append('payload_json', JSON.stringify(payload));
      files.forEach((f, i) => fd.append(`files[${i}]`, f, f.name));
      init.body = fd;
    } else {
      init.headers = { 'Content-Type': 'application/json' };
      init.body = JSON.stringify(payload);
    }
    return request<ApiMessage>(endpoint, init);
  },

  fetchMessage(url: string, message: string, threadId?: string) {
    return request<ApiMessage>(`${hook(url).base}/messages/${msgRef(message).messageId}${threadQs(threadId)}`);
  },

  deleteMessage(url: string, message: string, threadId?: string) {
    return request<null>(`${hook(url).base}/messages/${msgRef(message).messageId}${threadQs(threadId)}`, { method: 'DELETE' });
  },
};
