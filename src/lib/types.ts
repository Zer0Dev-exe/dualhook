export type Mode = 'v1' | 'v2';

/* ---------- Componentes compartidos ---------- */
export type ButtonStyle = 1 | 2 | 3 | 4 | 5;

export interface ButtonComponent {
  _id: string;
  type: 2;
  style: ButtonStyle;
  label: string;
  url: string;
  emoji: string;
  custom_id: string;
  disabled: boolean;
}

export interface ActionRow {
  _id: string;
  type: 1;
  components: ButtonComponent[];
}

/* ---------- Components V2 ---------- */
export interface Media {
  url: string;
}

export interface TextDisplay {
  _id: string;
  type: 10;
  content: string;
}

export interface Thumbnail {
  _id: string;
  type: 11;
  media: Media;
  description: string;
  spoiler: boolean;
}

export interface Section {
  _id: string;
  type: 9;
  components: TextDisplay[];
  accessory: Thumbnail | ButtonComponent;
}

export interface GalleryItem {
  _id: string;
  media: Media;
  description: string;
  spoiler: boolean;
}

export interface MediaGallery {
  _id: string;
  type: 12;
  items: GalleryItem[];
}

export interface FileComponent {
  _id: string;
  type: 13;
  file: Media;
  spoiler: boolean;
}

export interface Separator {
  _id: string;
  type: 14;
  divider: boolean;
  spacing: 1 | 2;
}

export type ContainerChild = ActionRow | TextDisplay | Section | MediaGallery | FileComponent | Separator;

export interface Container {
  _id: string;
  type: 17;
  accent_color: string | null;
  spoiler: boolean;
  components: ContainerChild[];
}

export type TopLevelComponent = ContainerChild | Container;

/* ---------- V1 ---------- */
export interface EmbedField {
  _id: string;
  name: string;
  value: string;
  inline: boolean;
}

export interface Embed {
  _id: string;
  color: string;
  author: { name: string; url: string; icon_url: string };
  title: string;
  url: string;
  description: string;
  fields: EmbedField[];
  image: string;
  thumbnail: string;
  footer: { text: string; icon_url: string };
  timestamp: string;
}

/* ---------- Mensaje ---------- */
export interface LastSent {
  messageId: string;
  channelId?: string;
  at: number;
  mode: Mode;
  edited: boolean;
}

/** Cada mensaje guarda DOS borradores independientes. Solo se envía el del modo activo. */
export interface Message {
  id: string;
  mode: Mode;
  username: string;
  avatar_url: string;
  thread_name: string;
  thread_id: string;
  editMessageId: string;
  suppressEmbeds: boolean;
  suppressNotifications: boolean;
  lastSent: LastSent | null;
  v1: { content: string; embeds: Embed[]; components: ActionRow[] };
  v2: { components: TopLevelComponent[] };
}

/* ---------- Webhooks y backups ---------- */
export interface WebhookInfo {
  name: string;
  avatarUrl: string | null;
  channel_id: string;
  guild_id?: string;
  application_id: string | null;
  checkedAt: number;
}

export interface Target {
  id: string;
  name: string;
  url: string;
  info: WebhookInfo | null;
}

export type BackupKind = 'manual' | 'import';

export interface Backup {
  id: string;
  name: string;
  kind: BackupKind;
  createdAt: number;
  updatedAt: number;
  fp: string;
  messages: Message[];
}
