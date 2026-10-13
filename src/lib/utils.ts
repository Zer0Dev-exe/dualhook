import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

export const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o));

type AnyObj = Record<string, unknown>;
const isObj = (x: unknown): x is AnyObj => !!x && typeof x === 'object' && !Array.isArray(x);

/** Asigna `_id` a todo objeto que viva dentro de un array (y a los accesorios de sección). */
export function ensureIds<T>(node: T, force = false): T {
  if (Array.isArray(node)) {
    for (const x of node) {
      if (isObj(x) && (force || !x._id)) x._id = uid();
      ensureIds(x, force);
    }
  } else if (isObj(node)) {
    for (const [k, v] of Object.entries(node)) {
      if (k === 'accessory' && isObj(v) && (force || !v._id)) v._id = uid();
      ensureIds(v, force);
    }
  }
  return node;
}

/** Copia profunda con ids nuevos (para duplicar). */
export function withNewIds<T>(obj: T): T {
  const c = clone(obj);
  if (isObj(c)) (c as AnyObj)._id = uid();
  return ensureIds(c, true);
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/* ---------- colores ---------- */
export const hexToInt = (hex: string | null | undefined): number | null => {
  if (!hex) return null;
  const n = parseInt(hex.replace('#', ''), 16);
  return Number.isFinite(n) ? n : null;
};
export const intToHex = (n: number | null | undefined) => (n == null ? '' : '#' + n.toString(16).padStart(6, '0'));

/* ---------- base64url utf-8 ---------- */
export const b64encode = (str: string) => {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
export const b64decode = (b64: string) => {
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

/* ---------- formato ---------- */
const LOCALE = 'es-ES';
export const fmtDate = (ts: number) =>
  new Date(ts).toLocaleString(LOCALE, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const fmtSize = (b: number) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(2)} MB`;

export function discordTime(unix: number, style: string) {
  const d = new Date(unix * 1000);
  if (isNaN(+d)) return 'Fecha inválida';
  const time = d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
  const date = d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
  switch (style) {
    case 't': return time;
    case 'T': return d.toLocaleTimeString(LOCALE);
    case 'd': return d.toLocaleDateString(LOCALE);
    case 'D': return date;
    case 'F': return `${d.toLocaleDateString(LOCALE, { weekday: 'long' })}, ${date} ${time}`;
    case 'R': {
      const diff = Math.round((+d - Date.now()) / 1000);
      const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });
      const abs = Math.abs(diff);
      if (abs < 60) return rtf.format(diff, 'second');
      if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
      if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
      if (abs < 2592000) return rtf.format(Math.round(diff / 86400), 'day');
      if (abs < 31536000) return rtf.format(Math.round(diff / 2592000), 'month');
      return rtf.format(Math.round(diff / 31536000), 'year');
    }
    default: return `${date} ${time}`;
  }
}

export const slug = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'backup';

/* ---------- ficheros ---------- */
export function download(name: string, text: string, mime = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function pickFiles(accept = '', multiple = false): Promise<File[]> {
  return new Promise((resolve) => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = accept;
    inp.multiple = multiple;
    inp.style.display = 'none';
    inp.addEventListener('change', () => {
      resolve([...(inp.files ?? [])]);
      inp.remove();
    });
    document.body.appendChild(inp);
    inp.click();
  });
}
