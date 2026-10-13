/**
 * El contenido del espacio de trabajo viaja en el enlace (`#data=…`), como en Discohook:
 * si se cierra la pestaña sin guardar un backup, el enlace sigue teniendo los mensajes.
 *
 * Formato: `#data=z<base64url(deflate(json))>` (o `j<base64url(json)>` si el navegador no
 * soporta CompressionStream). Nunca incluye la URL ni el token del webhook, ni los archivos.
 */
import { normalizeMessage } from './factory';
import type { Message } from './types';

const PREFIX = '#data=';

const toB64url = (bytes: Uint8Array) => {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

/** JSON compacto: sin los ids internos (se regeneran al cargar). */
const serialize = (messages: Message[]) =>
  JSON.stringify({ v: 1, messages }, (k, v) => (k === '_id' || k === 'id' ? undefined : v));

export async function encodeMessages(messages: Message[]) {
  const bytes = new TextEncoder().encode(serialize(messages));
  if (typeof CompressionStream === 'undefined') return `j${toB64url(bytes)}`;
  return `z${toB64url(await pipe(bytes, new CompressionStream('deflate-raw')))}`;
}

export async function decodeMessages(data: string): Promise<Message[]> {
  const kind = data[0];
  let bytes = fromB64url(data.slice(1));
  if (kind === 'z') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
  else if (kind !== 'j') throw new Error('Formato de enlace desconocido');
  const parsed = JSON.parse(new TextDecoder().decode(bytes)) as { messages?: Partial<Message>[] };
  if (!Array.isArray(parsed.messages)) throw new Error('El enlace no contiene mensajes');
  return parsed.messages.map(normalizeMessage);
}

/** Lee `#data=` del enlace actual (null si no hay). */
export const readHashData = () => (location.hash.startsWith(PREFIX) ? location.hash.slice(PREFIX.length) : null);

/** Sustituye el hash sin añadir entradas al historial del navegador. */
export const writeHashData = (data: string) => history.replaceState(null, '', `${location.pathname}${location.search}${PREFIX}${data}`);

export const linkFor = (data: string) => `${location.origin}${location.pathname}${PREFIX}${data}`;
