import { make } from './factory';
import type { Message, Mode, TopLevelComponent } from './types';

export type Template =
  | { mode: 'v2'; name: string; description: string; build: () => TopLevelComponent[] }
  | { mode: 'v1'; name: string; description: string; build: () => Message['v1'] };

export const TEMPLATES: Template[] = [
  {
    mode: 'v2',
    name: 'Anuncio',
    description: 'Contenedor con título, sección y botón',
    build: () => [
      make.container({
        accent_color: '#5865f2',
        components: [
          make.text('# 📢 Anuncio importante\nEscribe aquí el contenido principal del anuncio.'),
          make.separator(),
          make.section({
            components: [make.text('**¿Qué cambia?**\n- Punto uno\n- Punto dos')],
            accessory: make.thumbnail('https://cdn.discordapp.com/embed/avatars/1.png'),
          }),
          make.separator(),
          make.actionRow([make.button({ label: 'Más información', url: 'https://discord.com' })]),
        ],
      }),
    ],
  },
  {
    mode: 'v2',
    name: 'Normas',
    description: 'Lista de normas con separadores',
    build: () => [
      make.container({
        accent_color: '#ed4245',
        components: [
          make.text('# 📜 Normas del servidor'),
          make.separator(),
          make.text('**1. Respeto**\nTrata a todos con respeto.'),
          make.text('**2. Nada de spam**\nNi publicidad sin permiso.'),
          make.text('**3. Contenido adecuado**\nMantén cada tema en su canal.'),
          make.separator({ spacing: 2 }),
          make.text('-# Al participar aceptas estas normas.'),
        ],
      }),
    ],
  },
  {
    mode: 'v2',
    name: 'Galería',
    description: 'Título + galería de 3 imágenes',
    build: () => [
      make.text('## 🖼 Galería de la semana'),
      make.gallery([1, 2, 3].map((n) => `https://cdn.discordapp.com/embed/avatars/${n}.png`)),
      make.text('-# Envía tus capturas en #capturas'),
    ],
  },
  {
    mode: 'v1',
    name: 'Embed de anuncio',
    description: '@everyone + embed con pie y hora',
    build: () => {
      const e = make.embed();
      e.title = '📢 Anuncio';
      e.description = 'Contenido del anuncio con **markdown**.';
      e.footer.text = 'Equipo de moderación';
      e.timestamp = new Date().toISOString();
      return { content: '@everyone', embeds: [e], components: [] };
    },
  },
  {
    mode: 'v1',
    name: 'Changelog',
    description: 'Embed con campos de cambios',
    build: () => {
      const e = make.embed();
      e.color = '#57f287';
      e.author.name = 'Changelog v1.2.0';
      e.title = 'Novedades';
      e.fields = [make.field({ name: '✨ Añadido', value: '- Nueva función\n- Otra mejora' }), make.field({ name: '🐛 Corregido', value: '- Error de ejemplo' })];
      return { content: '', embeds: [e], components: [] };
    },
  },
];

export const templatesFor = (mode: Mode) => TEMPLATES.filter((t) => t.mode === mode);
