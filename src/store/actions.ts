/* Operaciones que combinan varios stores. Los componentes llaman a estas funciones. */
import { toast } from 'sonner';
import { discord, parseMessageId } from '@/lib/discord';
import { normalizeMessage } from '@/lib/factory';
import { convertV1toV2, convertV2toV1, importAny, parseApiMessage } from '@/lib/payload';
import type { Template } from '@/lib/templates';
import type { Backup, Message, Mode } from '@/lib/types';
import { b64decode, b64encode, clone, pickFiles, withNewIds } from '@/lib/utils';
import { validate } from '@/lib/validation';
import { useBackups } from './backups';
import { confirmDialog } from './dialogs';
import { getActiveTarget, useTargets } from './targets';
import { getMessageFiles, useFiles } from './ui';
import { getActiveMessage, useWorkspace } from './workspace';

const ws = () => useWorkspace.getState();
const backups = () => useBackups.getState();

export function hasContent(m: Message, mode: Mode) {
  return mode === 'v1' ? !!(m.v1.content.trim() || m.v1.embeds.length || m.v1.components.length) : m.v2.components.length > 0;
}

/* ---------- modos ---------- */
export async function convertActive() {
  const m = getActiveMessage();
  const other: Mode = m.mode === 'v1' ? 'v2' : 'v1';
  if (hasContent(m, other) && !(await confirmDialog(`El borrador ${other.toUpperCase()} de este mensaje ya tiene contenido y se sustituirá.`, { ok: 'Convertir' }))) return;
  backups().autoIfChanged('Antes de convertir');
  if (m.mode === 'v1') {
    const comps = convertV1toV2(m);
    ws().updateActive((d) => {
      d.v2.components = comps;
      d.mode = 'v2';
    });
  } else {
    const v1 = convertV2toV1(m);
    ws().updateActive((d) => {
      d.v1 = v1;
      d.mode = 'v1';
    });
    toast.info('Conversión V2 → V1 aproximada: revisa el resultado');
  }
}

export async function applyTemplate(t: Template) {
  const m = getActiveMessage();
  if (hasContent(m, t.mode) && !(await confirmDialog(`Se sustituirá el borrador ${t.mode.toUpperCase()} del mensaje actual.`, { ok: 'Usar plantilla' }))) return false;
  backups().autoIfChanged('Antes de aplicar plantilla');
  ws().updateActive((d) => {
    if (t.mode === 'v2') d.v2.components = t.build();
    else d.v1 = t.build();
    d.mode = t.mode;
  });
  return true;
}

export function applyJson(text: string) {
  const parsed = parseApiMessage(JSON.parse(text));
  backups().autoIfChanged('Antes de aplicar JSON');
  ws().updateActive((d) => {
    d.mode = parsed.mode;
    if (parsed.mode === 'v1') d.v1 = parsed.v1;
    else d.v2 = parsed.v2;
    d.username = parsed.username;
    d.avatar_url = parsed.avatar_url;
    d.thread_name = parsed.thread_name;
    d.suppressEmbeds = parsed.suppressEmbeds;
    d.suppressNotifications = parsed.suppressNotifications;
  });
  return parsed.mode;
}

export async function removeMessage(i: number) {
  if (!(await confirmDialog(`¿Eliminar el mensaje ${i + 1} del espacio de trabajo?`, { ok: 'Eliminar', danger: true }))) return;
  backups().autoIfChanged(`Antes de eliminar mensaje ${i + 1}`);
  ws().removeMessage(i);
}

/* ---------- envío ---------- */
export async function sendMessage(index: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const m = ws().messages[index];
  const t = getActiveTarget();
  const files = getMessageFiles(m.id);
  const { errors } = validate(m, files, t);
  if (errors.length) return { ok: false, error: errors.join('\n') };
  try {
    const res = await discord.send(m, t.url, files);
    const editing = !!m.editMessageId;
    const messageId = res?.id || parseMessageId(m.editMessageId)?.messageId || '';
    ws().updateMessage(index, (d) => {
      d.lastSent = { messageId, channelId: res?.channel_id, at: Date.now(), mode: m.mode, edited: editing };
    });
    const where = t.name || t.info?.name || 'webhook';
    backups().create('sent', `${editing ? 'Editado' : 'Enviado'} · ${m.mode.toUpperCase()} · ${where}`, [ws().messages[index]], { sentTo: where, messageId });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function loadFromDiscord() {
  const m = getActiveMessage();
  const t = getActiveTarget();
  if ((hasContent(m, 'v1') || hasContent(m, 'v2')) && !(await confirmDialog('Cargar el mensaje sustituirá el borrador del modo que tenga ese mensaje.', { ok: 'Cargar' }))) return;
  const api = await discord.fetchMessage(t.url, m.editMessageId, m.thread_id);
  backups().autoIfChanged('Antes de cargar mensaje');
  const parsed = parseApiMessage(api);
  ws().updateActive((d) => {
    d.mode = parsed.mode;
    if (parsed.mode === 'v1') d.v1 = parsed.v1;
    else d.v2 = parsed.v2;
    d.suppressEmbeds = parsed.suppressEmbeds;
  });
  if (api.attachments?.length) toast.info(`El mensaje tiene ${api.attachments.length} adjunto(s): se conservan si no subes archivos nuevos`);
  toast.success(`Mensaje cargado como ${parsed.mode.toUpperCase()}`);
}

export async function deleteFromDiscord() {
  const m = getActiveMessage();
  const t = getActiveTarget();
  if (!(await confirmDialog('¿Borrar el mensaje en Discord? No se puede deshacer.', { ok: 'Borrar en Discord', danger: true }))) return;
  await discord.deleteMessage(t.url, m.editMessageId, m.thread_id);
  ws().updateActive((d) => void (d.editMessageId = ''));
  toast.success('Mensaje borrado en Discord');
}

/* ---------- backups ---------- */
export async function restoreBackup(b: Backup, mode: 'replace' | 'append') {
  if (mode === 'replace') {
    if (!(await confirmDialog(`Se sustituirá el espacio de trabajo por «${b.name}».\nAntes se guardará un backup automático de lo actual.`, { ok: 'Restaurar' }))) return;
    backups().autoIfChanged(`Antes de restaurar «${b.name}»`);
    useFiles.getState().clear();
    ws().replaceAll(clone(b.messages));
    toast.success('Backup restaurado');
  } else {
    ws().append(b.messages.map((m) => normalizeMessage({ ...withNewIds(m), id: undefined })));
    toast.success(`Añadidos ${b.messages.length} mensaje(s)`);
  }
}

export function exportBundle(opts: { workspace: boolean; backups: boolean; targets: boolean }) {
  return {
    app: 'dualhook',
    version: 1,
    exportedAt: new Date().toISOString(),
    ...(opts.workspace ? { messages: ws().messages } : {}),
    ...(opts.backups ? { backups: backups().list } : {}),
    ...(opts.targets ? { targets: useTargets.getState().list.map(({ name, url }) => ({ name, url })) } : {}),
  };
}

export async function importFromFile() {
  const [file] = await pickFiles('.json,application/json');
  if (!file) return;
  let data;
  try {
    data = importAny(JSON.parse(await file.text()));
  } catch (e) {
    toast.error(`No se pudo importar: ${(e as Error).message}`);
    return;
  }
  const parts: string[] = [];
  if (data.backups.length) {
    backups().addImported(data.backups);
    parts.push(`${data.backups.length} backup(s)`);
  }
  if (data.targets.length) {
    const known = new Set(useTargets.getState().list.map((t) => t.url));
    const fresh = data.targets.filter((t) => t.url && !known.has(t.url));
    fresh.forEach((t) => useTargets.getState().add({ name: t.name || '', url: t.url }));
    if (fresh.length) parts.push(`${fresh.length} webhook(s)`);
  }
  if (data.messages?.length) {
    if (await confirmDialog(`El archivo contiene ${data.messages.length} mensaje(s). ¿Sustituir el espacio de trabajo? (se guarda backup antes)`, { ok: 'Sustituir' })) {
      backups().autoIfChanged('Antes de importar');
      useFiles.getState().clear();
      ws().replaceAll(data.messages);
      parts.push(`${data.messages.length} mensaje(s)`);
    } else {
      backups().create('import', `Importado · ${file.name}`, data.messages);
      parts.push('mensajes guardados como backup');
    }
  }
  if (parts.length) toast.success(`Importado: ${parts.join(', ')}`);
  else toast('Nada que importar');
}

/* ---------- compartir ---------- */
export function shareUrl() {
  const data = { app: 'dualhook', version: 1, messages: ws().messages };
  return { url: `${location.href.split('#')[0]}#share=${b64encode(JSON.stringify(data))}`, json: JSON.stringify(data, null, 2) };
}

export async function openShareHash() {
  const m = location.hash.match(/^#share=([\w-]+)/);
  if (!m) return;
  history.replaceState(null, '', location.pathname + location.search);
  try {
    const data = importAny(JSON.parse(b64decode(m[1])));
    if (!data.messages?.length) return;
    if (await confirmDialog(`Este enlace contiene ${data.messages.length} mensaje(s). ¿Cargarlos? (lo actual se guarda como backup)`, { ok: 'Cargar' })) {
      backups().autoIfChanged('Antes de abrir enlace compartido');
      useFiles.getState().clear();
      ws().replaceAll(data.messages);
    }
  } catch {
    toast.error('Enlace compartido no válido');
  }
}
