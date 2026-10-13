import type {
  ActionRow,
  ButtonComponent,
  Container,
  Embed,
  EmbedField,
  FileComponent,
  GalleryItem,
  MediaGallery,
  Message,
  Mode,
  Section,
  Separator,
  Target,
  TextDisplay,
  Thumbnail,
} from './types';
import { ensureIds, uid } from './utils';

export const FLAGS = {
  SUPPRESS_EMBEDS: 1 << 2,
  SUPPRESS_NOTIFICATIONS: 1 << 12,
  IS_COMPONENTS_V2: 1 << 15,
} as const;

export const LIMITS = {
  v1: { content: 2000, embeds: 10, embedTotal: 6000, title: 256, description: 4096, fields: 25, fieldName: 256, fieldValue: 1024, footer: 2048, author: 256, rows: 5 },
  v2: { components: 40, textTotal: 4000, sectionTexts: 3, galleryItems: 10 },
  common: { username: 80, buttonsPerRow: 5, buttonLabel: 80, customId: 100, files: 10, messages: 10 },
} as const;

export const make = {
  message: (mode: Mode = 'v2'): Message => ({
    id: uid(),
    mode,
    username: '',
    avatar_url: '',
    thread_name: '',
    thread_id: '',
    editMessageId: '',
    suppressEmbeds: false,
    suppressNotifications: false,
    lastSent: null,
    v1: { content: '', embeds: [], components: [] },
    v2: { components: [] },
  }),
  embed: (): Embed => ({
    _id: uid(),
    color: '#5865f2',
    author: { name: '', url: '', icon_url: '' },
    title: '',
    url: '',
    description: '',
    fields: [],
    image: '',
    thumbnail: '',
    footer: { text: '', icon_url: '' },
    timestamp: '',
  }),
  field: (p: Partial<EmbedField> = {}): EmbedField => ({ _id: uid(), name: '', value: '', inline: false, ...p }),
  button: (p: Partial<ButtonComponent> = {}): ButtonComponent => ({
    _id: uid(), type: 2, style: 5, label: 'Abrir enlace', url: '', emoji: '', custom_id: '', disabled: false, ...p,
  }),
  actionRow: (buttons?: ButtonComponent[]): ActionRow => ({ _id: uid(), type: 1, components: buttons ?? [make.button()] }),
  text: (content = ''): TextDisplay => ({ _id: uid(), type: 10, content }),
  thumbnail: (url = ''): Thumbnail => ({ _id: uid(), type: 11, media: { url }, description: '', spoiler: false }),
  section: (p: Partial<Section> = {}): Section => ({ _id: uid(), type: 9, components: [make.text()], accessory: make.thumbnail(), ...p }),
  galleryItem: (url = ''): GalleryItem => ({ _id: uid(), media: { url }, description: '', spoiler: false }),
  gallery: (urls: string[] = ['']): MediaGallery => ({ _id: uid(), type: 12, items: urls.map(make.galleryItem) }),
  file: (url = ''): FileComponent => ({ _id: uid(), type: 13, file: { url }, spoiler: false }),
  separator: (p: Partial<Separator> = {}): Separator => ({ _id: uid(), type: 14, divider: true, spacing: 1, ...p }),
  container: (p: Partial<Container> = {}): Container => ({ _id: uid(), type: 17, accent_color: '#2dc770', spoiler: false, components: [make.text()], ...p }),
  target: (): Target => ({ id: uid(), name: '', url: '', info: null }),
};

/** Rellena campos que falten (imports antiguos o JSON editado a mano). */
export function normalizeMessage(raw: Partial<Message> | null | undefined): Message {
  const r = raw ?? {};
  const m: Message = { ...make.message(r.mode === 'v1' ? 'v1' : 'v2'), ...r } as Message;
  m.id = r.id || uid();
  m.v1 = { content: '', embeds: [], components: [], ...(r.v1 ?? {}) };
  m.v2 = { components: [], ...(r.v2 ?? {}) };
  m.v1.embeds = m.v1.embeds.map((e) => ({
    ...make.embed(),
    ...e,
    author: Object.assign({ name: '', url: '', icon_url: '' }, e.author),
    footer: Object.assign({ text: '', icon_url: '' }, e.footer),
    fields: (e.fields ?? []).map((f) => make.field(f)),
  }));
  ensureIds(m.v1);
  ensureIds(m.v2);
  return m;
}

export function welcomeMessage(): Message {
  const m = make.message('v2');
  m.username = 'Dualhook';
  m.v2.components = [
    make.container({
      components: [
        make.text('# ¡Bienvenido a Dualhook!\nEste mensaje usa **Components V2**: contenedores, secciones, galerías y separadores.'),
        make.separator(),
        make.section({
          components: [make.text('### Secciones\nTexto a la izquierda y un accesorio (miniatura o botón) a la derecha.')],
          accessory: make.button({ label: 'Discord Docs', url: 'https://discord.com/developers/docs/components/reference' }),
        }),
        make.separator(),
        make.text('-# Cambia a **V1 · Clásico** arriba para ver el borrador con embeds. Cada modo tiene su propio borrador.'),
      ],
    }),
  ];
  const e = make.embed();
  e.title = 'Mensaje clásico (V1)';
  e.description = 'Esto es un **embed** de toda la vida.\nPuedes tener hasta 10 embeds por mensaje.';
  e.fields = [make.field({ name: 'Campo 1', value: 'En línea', inline: true }), make.field({ name: 'Campo 2', value: 'En línea', inline: true })];
  e.footer.text = 'Dualhook';
  m.v1.content = 'Hola 👋 este es el contenido de texto (fuera del embed).';
  m.v1.embeds = [e];
  return m;
}
