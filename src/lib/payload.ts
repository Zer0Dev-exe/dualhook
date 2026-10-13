/* Construcción de payloads, parseo de mensajes de Discord, conversión V1<->V2 e importación. */
import { FLAGS, make, normalizeMessage } from './factory';
import type {
  ActionRow,
  ButtonComponent,
  ButtonStyle,
  ContainerChild,
  Embed,
  GalleryItem,
  Message,
  TopLevelComponent,
} from './types';
import { clone, ensureIds, hexToInt, intToHex, withNewIds } from './utils';

type Api = Record<string, any>;

/* ---------- emojis ---------- */
export interface ApiEmoji {
  name?: string;
  id?: string;
  animated?: boolean;
}
export function parseEmoji(input: string): ApiEmoji | undefined {
  const s = (input || '').trim();
  if (!s) return undefined;
  const m = s.match(/^<(a?):(\w+):(\d+)>$/) || s.match(/^(a?):?(\w+):(\d+)$/);
  if (m) return { name: m[2], id: m[3], animated: !!m[1] };
  if (/^\d{15,21}$/.test(s)) return { id: s };
  return { name: s };
}
export const emojiToString = (e?: ApiEmoji | null) =>
  !e ? '' : e.id ? `<${e.animated ? 'a' : ''}:${e.name || 'emoji'}:${e.id}>` : e.name || '';

/* ---------- interno -> API ---------- */
function cleanButton(b: ButtonComponent): Api {
  const o: Api = { type: 2, style: b.style || 5 };
  if (b.label) o.label = b.label;
  const em = parseEmoji(b.emoji);
  if (em) o.emoji = em;
  if (o.style === 5) o.url = b.url;
  else o.custom_id = b.custom_id || `hf_${b._id}`;
  if (b.disabled) o.disabled = true;
  return o;
}
const cleanRow = (r: ActionRow): Api => ({ type: 1, components: r.components.map(cleanButton) });

function cleanMedia(item: { media: { url: string }; description: string; spoiler: boolean }, type?: number): Api {
  const o: Api = type ? { type } : {};
  o.media = { url: item.media.url };
  if (item.description) o.description = item.description;
  if (item.spoiler) o.spoiler = true;
  return o;
}

function cleanV2(c: TopLevelComponent): Api {
  switch (c.type) {
    case 10: return { type: 10, content: c.content };
    case 9: return { type: 9, components: c.components.map(cleanV2), accessory: c.accessory.type === 2 ? cleanButton(c.accessory) : cleanMedia(c.accessory, 11) };
    case 12: return { type: 12, items: c.items.map((it) => cleanMedia(it)) };
    case 13: return { type: 13, file: { url: c.file.url }, ...(c.spoiler ? { spoiler: true } : {}) };
    case 14: return { type: 14, divider: c.divider, spacing: c.spacing };
    case 17: {
      const o: Api = { type: 17, components: c.components.map(cleanV2) };
      const color = hexToInt(c.accent_color);
      if (color != null) o.accent_color = color;
      if (c.spoiler) o.spoiler = true;
      return o;
    }
    case 1: return cleanRow(c);
  }
}

function cleanEmbed(e: Embed): Api {
  const o: Api = {};
  if (e.author.name) {
    o.author = { name: e.author.name };
    if (e.author.url) o.author.url = e.author.url;
    if (e.author.icon_url) o.author.icon_url = e.author.icon_url;
  }
  if (e.title) o.title = e.title;
  if (e.url) o.url = e.url;
  if (e.description) o.description = e.description;
  if (e.fields.length) o.fields = e.fields.map((f) => ({ name: f.name, value: f.value, inline: f.inline }));
  if (e.image) o.image = { url: e.image };
  if (e.thumbnail) o.thumbnail = { url: e.thumbnail };
  if (e.footer.text) {
    o.footer = { text: e.footer.text };
    if (e.footer.icon_url) o.footer.icon_url = e.footer.icon_url;
  }
  if (e.timestamp) {
    const d = new Date(e.timestamp);
    if (!isNaN(+d)) o.timestamp = d.toISOString();
  }
  const color = hexToInt(e.color);
  if (color != null) o.color = color;
  return o;
}

export const isEmbedEmpty = (e: Embed) => Object.keys(cleanEmbed(e)).filter((k) => k !== 'color').length === 0;

/** Payload que se envía a Discord. Solo incluye el borrador del modo activo. */
export function buildPayload(m: Message, files: File[] = [], { forEdit = false } = {}): Api {
  const p: Api = {};
  if (!forEdit) {
    if (m.username) p.username = m.username;
    if (m.avatar_url) p.avatar_url = m.avatar_url;
    if (m.thread_name) p.thread_name = m.thread_name;
  }
  let flags = 0;
  if (m.mode === 'v1') {
    if (m.v1.content) p.content = m.v1.content;
    const embeds = m.v1.embeds.filter((e) => !isEmbedEmpty(e)).map(cleanEmbed);
    if (embeds.length) p.embeds = embeds;
    const rows = m.v1.components.filter((r) => r.components.length).map(cleanRow);
    if (rows.length) p.components = rows;
    if (m.suppressEmbeds) flags |= FLAGS.SUPPRESS_EMBEDS;
    if (forEdit) {
      p.content ??= '';
      p.embeds ??= [];
      p.components ??= [];
    }
  } else {
    flags |= FLAGS.IS_COMPONENTS_V2;
    p.components = m.v2.components.map(cleanV2);
  }
  if (m.suppressNotifications && !forEdit) flags |= FLAGS.SUPPRESS_NOTIFICATIONS;
  if (flags) p.flags = flags;
  if (files.length) p.attachments = files.map((f, i) => ({ id: i, filename: f.name }));
  return p;
}

/* ---------- API -> interno ---------- */
function fromApiButton(c: Api): ButtonComponent {
  return make.button({
    style: (c.style || 5) as ButtonStyle,
    label: c.label || '',
    url: c.url || '',
    custom_id: c.custom_id || '',
    emoji: emojiToString(c.emoji),
    disabled: !!c.disabled,
  });
}
const fromApiItem = (it: Api): GalleryItem => ({ ...make.galleryItem(it.media?.url || ''), description: it.description || '', spoiler: !!it.spoiler });

function fromApiComp(c: Api): TopLevelComponent | null {
  if (!c || typeof c !== 'object') return null;
  switch (c.type) {
    case 1: return make.actionRow((c.components || []).filter((x: Api) => x?.type === 2).map(fromApiButton));
    case 10: return make.text(c.content || '');
    case 9: {
      const acc = c.accessory;
      return make.section({
        components: (c.components || []).filter((x: Api) => x?.type === 10).map((x: Api) => make.text(x.content || '')),
        accessory: acc?.type === 2 ? fromApiButton(acc) : { ...make.thumbnail(acc?.media?.url || ''), description: acc?.description || '', spoiler: !!acc?.spoiler },
      });
    }
    case 12: return { ...make.gallery([]), items: (c.items || []).map(fromApiItem) };
    case 13: return { ...make.file(c.file?.url || ''), spoiler: !!c.spoiler };
    case 14: return make.separator({ divider: c.divider !== false, spacing: c.spacing === 2 ? 2 : 1 });
    case 17:
      return make.container({
        accent_color: c.accent_color != null ? intToHex(c.accent_color) : null,
        spoiler: !!c.spoiler,
        components: (c.components || []).map(fromApiComp).filter((x: TopLevelComponent | null): x is ContainerChild => !!x && x.type !== 17),
      });
    default: return null;
  }
}

function fromApiEmbed(e: Api): Embed {
  return {
    ...make.embed(),
    color: e.color != null ? intToHex(e.color) : '',
    author: { name: e.author?.name || '', url: e.author?.url || '', icon_url: e.author?.icon_url || '' },
    title: e.title || '',
    url: e.url || '',
    description: e.description || '',
    fields: (e.fields || []).map((f: Api) => make.field({ name: f.name || '', value: f.value || '', inline: !!f.inline })),
    image: e.image?.url || '',
    thumbnail: e.thumbnail?.url || '',
    footer: { text: e.footer?.text || '', icon_url: e.footer?.icon_url || '' },
    timestamp: e.timestamp || '',
  };
}

/** Convierte un payload/mensaje de Discord (o de Discohook) en un mensaje interno. */
export function parseApiMessage(api: Api | null | undefined): Message {
  const a = api || {};
  const flags: number = a.flags || 0;
  const m = make.message(flags & FLAGS.IS_COMPONENTS_V2 ? 'v2' : 'v1');
  if (m.mode === 'v2') {
    m.v2.components = (a.components || []).map(fromApiComp).filter(Boolean);
  } else {
    m.v1.content = a.content || '';
    m.v1.embeds = (a.embeds || []).filter((e: Api) => !e.type || e.type === 'rich').map(fromApiEmbed);
    m.v1.components = (a.components || []).map(fromApiComp).filter((r: TopLevelComponent | null): r is ActionRow => r?.type === 1);
  }
  m.username = a.username || '';
  m.avatar_url = a.avatar_url || '';
  m.thread_name = a.thread_name || '';
  m.suppressEmbeds = !!(flags & FLAGS.SUPPRESS_EMBEDS);
  m.suppressNotifications = !!(flags & FLAGS.SUPPRESS_NOTIFICATIONS);
  return m;
}

/* ---------- importación ---------- */
export interface ImportResult {
  messages: Message[] | null;
  backups: { name: string; kind?: string; createdAt?: number; messages: Message[] }[];
  targets: { name?: string; url: string }[];
}

/** Acepta: export de Dualhook (o de su nombre anterior, Hookforge), backup/estado de Discohook, payload suelto o array de payloads. */
export function importAny(obj: Api): ImportResult {
  const toMsg = (x: Api): Message =>
    x && (x.v1 || x.v2) ? normalizeMessage({ ...withNewIds(x as Message), id: undefined }) : parseApiMessage(x?.data || x);
  const res: ImportResult = { messages: null, backups: [], targets: [] };
  if (!obj || typeof obj !== 'object') throw new Error('El archivo no contiene JSON válido');
  if (obj.app === 'dualhook' || obj.app === 'hookforge') {
    if (Array.isArray(obj.messages)) res.messages = obj.messages.map(toMsg);
    if (Array.isArray(obj.backups)) res.backups = obj.backups.map((b: Api) => ({ ...b, name: b.name || 'Importado', messages: (b.messages || []).map(toMsg) }));
    if (Array.isArray(obj.targets)) res.targets = obj.targets;
  } else if (Array.isArray(obj.backups)) {
    res.backups = obj.backups.map((b: Api) => ({ name: b.name || 'Backup importado', messages: (b.messages || []).map(toMsg) }));
  } else if (Array.isArray(obj.messages)) {
    res.messages = obj.messages.map(toMsg);
  } else if (Array.isArray(obj)) {
    res.messages = obj.map(toMsg);
  } else if ('content' in obj || 'embeds' in obj || 'components' in obj || obj.v1 || obj.v2) {
    res.messages = [toMsg(obj)];
  } else {
    throw new Error('Formato no reconocido');
  }
  return res;
}

/* ---------- conversión entre modos ---------- */
export function convertV1toV2(m: Message): TopLevelComponent[] {
  const out: TopLevelComponent[] = [];
  const d = m.v1;
  if (d.content.trim()) out.push(make.text(d.content));
  for (const e of d.embeds) {
    if (isEmbedEmpty(e)) continue;
    const children: ContainerChild[] = [];
    const head: string[] = [];
    if (e.author.name) head.push(`-# ${e.author.url ? `[${e.author.name}](${e.author.url})` : e.author.name}`);
    if (e.title) head.push(`## ${e.url ? `[${e.title}](${e.url})` : e.title}`);
    if (e.description) head.push(e.description);
    if (head.length) {
      const txt = make.text(head.join('\n'));
      children.push(e.thumbnail ? make.section({ components: [txt], accessory: make.thumbnail(e.thumbnail) }) : txt);
    }
    if (e.fields.length) children.push(make.text(e.fields.map((f) => `**${f.name}**\n${f.value}`).join('\n\n')));
    if (e.image) children.push(make.gallery([e.image]));
    const foot = [e.footer.text, e.timestamp ? `<t:${Math.floor(+new Date(e.timestamp) / 1000)}:f>` : ''].filter(Boolean).join(' • ');
    if (foot) children.push(make.separator(), make.text(`-# ${foot}`));
    out.push(make.container({ accent_color: e.color || null, components: children.length ? children : [make.text('​')] }));
  }
  for (const r of d.components) out.push(withNewIds(r));
  return out;
}

export function convertV2toV1(m: Message): Message['v1'] {
  const res: Message['v1'] = { content: '', embeds: [], components: [] };
  const texts: string[] = [];
  const textOf = (list: (TopLevelComponent | ContainerChild)[]) =>
    list
      .map((c) => (c.type === 10 ? c.content : c.type === 9 ? c.components.map((t) => t.content).join('\n') : null))
      .filter((x): x is string => x != null)
      .join('\n\n');
  for (const c of m.v2.components) {
    if (c.type === 10 || c.type === 9) texts.push(textOf([c]));
    else if (c.type === 1 && res.components.length < 5) res.components.push(withNewIds(c));
    else if (c.type === 12 && c.items[0]) res.embeds.push({ ...make.embed(), color: '', image: c.items[0].media.url });
    else if (c.type === 17) {
      const e = { ...make.embed(), color: c.accent_color || '', description: textOf(c.components).slice(0, 4096) };
      const g = c.components.find((x) => x.type === 12);
      if (g?.type === 12 && g.items[0]) e.image = g.items[0].media.url;
      const s = c.components.find((x) => x.type === 9 && x.accessory.type === 11);
      if (s?.type === 9 && s.accessory.type === 11) e.thumbnail = s.accessory.media.url;
      res.embeds.push(e);
      for (const r of c.components) if (r.type === 1 && res.components.length < 5) res.components.push(withNewIds(r));
    }
  }
  res.content = texts.join('\n\n').slice(0, 2000);
  res.embeds = res.embeds.slice(0, 10);
  return ensureIds(clone(res));
}
