/* Validación con los límites de Discord, separada por modo. */
import { parseMessageId } from './discord';
import { LIMITS as L } from './factory';
import { isEmbedEmpty } from './payload';
import type { ActionRow, ButtonComponent, ContainerChild, Embed, Message, Target, TopLevelComponent } from './types';

const isUrl = (u: string) => /^https?:\/\/\S+$/i.test(u || '');
export const isMediaUrl = (u: string) => isUrl(u) || /^attachment:\/\/\S+$/i.test(u || '');

export const embedChars = (e: Embed) =>
  e.title.length + e.description.length + e.author.name.length + e.footer.text.length + e.fields.reduce((n, f) => n + f.name.length + f.value.length, 0);

export function v2Stats(list: TopLevelComponent[]) {
  let count = 0;
  let chars = 0;
  const walk = (items: (TopLevelComponent | ContainerChild)[]) => {
    for (const c of items) {
      count++;
      if (c.type === 10) chars += c.content.length;
      if (c.type === 9) {
        count++; // accesorio
        walk(c.components);
      } else if (c.type === 17 || c.type === 1) {
        count += c.type === 1 ? c.components.length : 0;
        if (c.type === 17) walk(c.components);
      }
    }
  };
  walk(list);
  return { count, chars };
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export function validate(m: Message, files: File[], target?: Target): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const appOwned = !!target?.info?.application_id;
  const known = !!target?.info;
  const fileNames = new Set(files.map((f) => f.name));

  if (m.username.length > L.common.username) errors.push(`Nombre: máximo ${L.common.username} caracteres`);
  if (/discord|clyde/i.test(m.username)) errors.push('El nombre no puede contener «discord» ni «clyde»');
  if (m.avatar_url && !isUrl(m.avatar_url)) errors.push('La URL del avatar no es válida');
  if (files.length > L.common.files) errors.push(`Máximo ${L.common.files} archivos adjuntos`);
  if (m.thread_id && !/^\d{15,21}$/.test(m.thread_id.trim())) errors.push('El ID de hilo debe ser numérico');
  if (m.thread_name && m.thread_id) warnings.push('Has puesto nombre de post y ID de hilo: usa solo uno');
  if (m.editMessageId && !parseMessageId(m.editMessageId)) errors.push('El ID/enlace del mensaje a editar no es válido');

  const checkButton = (b: ButtonComponent, path: string) => {
    if (!b.label && !b.emoji) errors.push(`${path}: necesita texto o emoji`);
    if (b.label.length > L.common.buttonLabel) errors.push(`${path}: texto de más de ${L.common.buttonLabel} caracteres`);
    if (b.style === 5) {
      if (!isUrl(b.url)) errors.push(`${path}: URL obligatoria (https://…)`);
    } else {
      const msg = `${path}: solo los webhooks de aplicación admiten botones que no son de enlace`;
      if (known && !appOwned) errors.push(msg);
      else if (!appOwned) warnings.push(msg);
      if (b.custom_id.length > L.common.customId) errors.push(`${path}: custom_id demasiado largo`);
    }
  };
  const checkRow = (r: ActionRow, path: string) => {
    if (!r.components.length) errors.push(`${path}: la fila está vacía`);
    if (r.components.length > L.common.buttonsPerRow) errors.push(`${path}: máximo ${L.common.buttonsPerRow} botones`);
    r.components.forEach((b, i) => checkButton(b, `${path} › botón ${i + 1}`));
  };

  if (m.mode === 'v1') {
    const d = m.v1;
    if (d.content.length > L.v1.content) errors.push(`Contenido: ${d.content.length}/${L.v1.content} caracteres`);
    if (d.embeds.length > L.v1.embeds) errors.push(`Máximo ${L.v1.embeds} embeds`);
    let total = 0;
    d.embeds.forEach((e, i) => {
      const p = `Embed ${i + 1}`;
      total += embedChars(e);
      if (isEmbedEmpty(e)) errors.push(`${p}: está vacío (añade título, descripción, imagen…)`);
      if (e.title.length > L.v1.title) errors.push(`${p}: título > ${L.v1.title}`);
      if (e.description.length > L.v1.description) errors.push(`${p}: descripción > ${L.v1.description}`);
      if (e.author.name.length > L.v1.author) errors.push(`${p}: autor > ${L.v1.author}`);
      if (e.footer.text.length > L.v1.footer) errors.push(`${p}: pie > ${L.v1.footer}`);
      if (e.fields.length > L.v1.fields) errors.push(`${p}: máximo ${L.v1.fields} campos`);
      e.fields.forEach((f, j) => {
        const fp = `${p} › campo ${j + 1}`;
        if (!f.name.trim()) errors.push(`${fp}: nombre obligatorio`);
        if (!f.value.trim()) errors.push(`${fp}: valor obligatorio`);
        if (f.name.length > L.v1.fieldName) errors.push(`${fp}: nombre > ${L.v1.fieldName}`);
        if (f.value.length > L.v1.fieldValue) errors.push(`${fp}: valor > ${L.v1.fieldValue}`);
      });
      if (e.url && !isUrl(e.url)) errors.push(`${p}: URL del título no válida`);
      if (e.author.url && !isUrl(e.author.url)) errors.push(`${p}: URL del autor no válida`);
      if (e.image && !isMediaUrl(e.image)) errors.push(`${p}: URL de imagen no válida`);
      if (e.thumbnail && !isMediaUrl(e.thumbnail)) errors.push(`${p}: URL de miniatura no válida`);
      if (e.author.icon_url && !isMediaUrl(e.author.icon_url)) errors.push(`${p}: icono del autor no válido`);
      if (e.footer.icon_url && !isMediaUrl(e.footer.icon_url)) errors.push(`${p}: icono del pie no válido`);
      if (e.footer.icon_url && !e.footer.text) warnings.push(`${p}: el icono del pie no se ve sin texto de pie`);
      if (e.author.icon_url && !e.author.name) warnings.push(`${p}: el icono del autor no se ve sin nombre de autor`);
    });
    if (total > L.v1.embedTotal) errors.push(`Embeds: ${total}/${L.v1.embedTotal} caracteres en total`);
    if (d.components.length > L.v1.rows) errors.push(`Máximo ${L.v1.rows} filas de botones`);
    d.components.forEach((r, i) => checkRow(r, `Fila ${i + 1}`));
    if (!d.content.trim() && !d.embeds.length && !files.length) errors.push('El mensaje V1 está vacío: añade contenido, un embed o un archivo');
    if (m.v2.components.length) warnings.push('El borrador V2 de este mensaje NO se enviará (modo V1 activo)');
  } else {
    const list = m.v2.components;
    const st = v2Stats(list);
    if (!list.length) errors.push('El mensaje V2 está vacío: añade al menos un componente');
    if (st.count > L.v2.components) errors.push(`Componentes: ${st.count}/${L.v2.components}`);
    if (st.chars > L.v2.textTotal) errors.push(`Texto total: ${st.chars}/${L.v2.textTotal} caracteres`);

    const walk = (items: (TopLevelComponent | ContainerChild)[], prefix: string) => {
      items.forEach((c, i) => {
        const p = `${prefix}${i + 1}`;
        switch (c.type) {
          case 10:
            if (!c.content.trim()) errors.push(`${p} (texto): está vacío`);
            break;
          case 9:
            if (!c.components.length || c.components.length > L.v2.sectionTexts) errors.push(`${p} (sección): entre 1 y ${L.v2.sectionTexts} textos`);
            c.components.forEach((t, j) => !t.content.trim() && errors.push(`${p} (sección) › texto ${j + 1}: vacío`));
            if (c.accessory.type === 11) {
              if (!isMediaUrl(c.accessory.media.url)) errors.push(`${p} (sección) › miniatura: URL obligatoria`);
            } else checkButton(c.accessory, `${p} (sección) › botón`);
            break;
          case 12:
            if (!c.items.length || c.items.length > L.v2.galleryItems) errors.push(`${p} (galería): entre 1 y ${L.v2.galleryItems} elementos`);
            c.items.forEach((it, j) => !isMediaUrl(it.media.url) && errors.push(`${p} (galería) › imagen ${j + 1}: URL obligatoria`));
            break;
          case 13: {
            const u = c.file.url;
            if (!/^attachment:\/\/.+/.test(u)) errors.push(`${p} (archivo): debe ser attachment://nombre`);
            else if (!fileNames.has(u.slice(13))) errors.push(`${p} (archivo): «${u.slice(13)}» no está adjuntado`);
            break;
          }
          case 17:
            if (!c.components.length) errors.push(`${p} (contenedor): está vacío`);
            walk(c.components, `${p}.`);
            break;
          case 1:
            checkRow(c, `${p} (fila)`);
            break;
        }
      });
    };
    walk(list, '#');

    const refs = JSON.stringify(list).match(/attachment:\/\/[^"]+/g) ?? [];
    for (const u of new Set(refs)) {
      const name = u.slice(13);
      if (!fileNames.has(name) && !errors.some((e) => e.includes(name))) warnings.push(`«${name}» no está adjuntado`);
    }
    const used = new Set(refs.map((u) => u.slice(13)));
    files.forEach((f) => !used.has(f.name) && warnings.push(`En V2 el archivo «${f.name}» no se muestra si ningún componente lo usa`));
    if (m.v1.content || m.v1.embeds.length) warnings.push('El borrador V1 de este mensaje NO se enviará (modo V2 activo)');
  }

  if (m.editMessageId && m.mode === 'v1' && m.lastSent?.mode === 'v2' && parseMessageId(m.editMessageId)?.messageId === m.lastSent.messageId)
    warnings.push('Un mensaje enviado como V2 no puede volver a V1 al editarlo');

  return { errors, warnings };
}
