import { Group, Image, MousePointerClick, Ungroup } from 'lucide-react';
import { IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckField, ColorField, Empty, Fieldset, SelectField, Segmented, TextField } from '@/components/ui/fields';
import { editor, list } from '@/lib/edit';
import { LIMITS, make } from '@/lib/factory';
import type { ContainerChild, FileComponent, MediaGallery, Section, TopLevelComponent } from '@/lib/types';
import { useMessageFiles } from '@/store/ui';
import { ActionRowEditor, ButtonFields } from '../shared/ButtonEditor';
import { AddButtons, ItemActions } from '../shared/ListControls';
import { MediaFields } from './MediaFields';
import { CHILD_TYPES, ROOT_TYPES, V2_META } from './meta';

const L = LIMITS.v2;
const firstLine = (s = '') => s.split('\n').find((l) => l.trim()) ?? '';

type AnyComp = TopLevelComponent | ContainerChild;

/* ---------- cuerpos por tipo ---------- */
function SectionBody({ value, onChange, messageId }: { value: Section; onChange: (s: Section) => void; messageId: string }) {
  const set = editor(value, onChange);
  const acc = value.accessory;
  return (
    <>
      {value.components.map((t, j) => (
        <div key={t._id} className="flex items-start gap-1.5">
          <TextField className="flex-1" label={`Texto ${j + 1}`} multiline rows={2} placeholder="Markdown…" value={t.content} onChange={(v) => set((d) => void (d.components[j].content = v))} />
          <div className="flex flex-col pt-5">
            <ItemActions items={value.components} index={j} min={1} max={L.sectionTexts} onChange={(c) => set((d) => void (d.components = c))} />
          </div>
        </div>
      ))}
      <AddButtons options={[{ label: 'Texto', disabled: value.components.length >= L.sectionTexts, onClick: () => set((d) => void d.components.push(make.text())) }]} />
      <Fieldset title="Accesorio (a la derecha)">
        <Segmented
          value={acc.type}
          options={[
            [11, <><Image /> Miniatura</>],
            [2, <><MousePointerClick /> Botón</>],
          ]}
          onChange={(t) => set((d) => void (d.accessory = t === 11 ? make.thumbnail() : make.button()))}
        />
        {acc.type === 11 ? (
          <MediaFields value={acc} messageId={messageId} onChange={(a) => set((d) => void (d.accessory = a))} />
        ) : (
          <ButtonFields value={acc} onChange={(b) => set((d) => void (d.accessory = b))} />
        )}
      </Fieldset>
    </>
  );
}

function GalleryBody({ value, onChange, messageId }: { value: MediaGallery; onChange: (g: MediaGallery) => void; messageId: string }) {
  const setItems = (items: MediaGallery['items']) => onChange({ ...value, items });
  return (
    <>
      {value.items.map((it, j) => (
        <MediaFields
          key={it._id}
          value={it}
          messageId={messageId}
          onChange={(ni) => setItems(list.replace(value.items, j, ni))}
          actions={<ItemActions items={value.items} index={j} min={1} max={L.galleryItems} onChange={setItems} />}
        />
      ))}
      <AddButtons options={[{ label: 'Imagen', disabled: value.items.length >= L.galleryItems, onClick: () => setItems([...value.items, make.galleryItem()]) }]} />
    </>
  );
}

function FileBody({ value, onChange, messageId }: { value: FileComponent; onChange: (f: FileComponent) => void; messageId: string }) {
  const files = useMessageFiles(messageId);
  const set = editor(value, onChange);
  const current = value.file.url.replace(/^attachment:\/\//, '');
  return (
    <>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <SelectField
          label="Archivo adjunto"
          value={files.some((f) => f.name === current) ? current : ''}
          options={[['', files.length ? '— elige un archivo —' : '— no hay archivos adjuntos —'], ...files.map((f) => [f.name, f.name] as const)]}
          onChange={(v) => set((d) => void (d.file.url = v ? `attachment://${v}` : ''))}
        />
        <TextField label="Referencia" mono placeholder="attachment://archivo.pdf" value={value.file.url} onChange={(v) => set((d) => void (d.file.url = v))} />
      </div>
      <CheckField label="Spoiler" checked={value.spoiler} onChange={(v) => set((d) => void (d.spoiler = v))} />
      <p className="text-xs text-muted">Solo acepta archivos subidos con el mensaje: añádelos en «Archivos adjuntos».</p>
    </>
  );
}

/* ---------- editor recursivo ---------- */
interface Props<T extends AnyComp> {
  items: T[];
  index: number;
  onItemsChange: (items: T[]) => void;
  messageId: string;
  depth: 'root' | 'container';
}

export function ComponentEditor<T extends AnyComp>({ items, index, onItemsChange, messageId, depth }: Props<T>) {
  const c = items[index];
  const meta = V2_META[c.type];
  const replace = (next: AnyComp) => onItemsChange(list.replace(items, index, next as T));

  const extra: JSX.Element[] = [];
  if (depth === 'root' && c.type !== 17) {
    extra.push(
      <IconButton key="wrap" title="Meter en un contenedor" onClick={() => replace(make.container({ components: [c as ContainerChild] }))}>
        <Group />
      </IconButton>,
    );
  }
  if (c.type === 17) {
    extra.push(
      <IconButton key="unwrap" title="Desagrupar (sacar los componentes del contenedor)" onClick={() => onItemsChange([...items.slice(0, index), ...(c.components as T[]), ...items.slice(index + 1)])}>
        <Ungroup />
      </IconButton>,
    );
  }

  if (c.type === 1) {
    return (
      <ActionRowEditor
        row={c}
        onChange={replace}
        actions={<ItemActions items={items} index={index} onChange={onItemsChange} extra={extra} />}
      />
    );
  }

  let body: JSX.Element;
  let summary = '';
  switch (c.type) {
    case 10:
      summary = firstLine(c.content);
      body = <TextField multiline rows={3} placeholder="Markdown: # Título, ## Subtítulo, **negrita**, -# subtexto, > cita, - lista…" value={c.content} onChange={(v) => replace({ ...c, content: v })} />;
      break;
    case 9:
      summary = firstLine(c.components[0]?.content);
      body = <SectionBody value={c} onChange={replace} messageId={messageId} />;
      break;
    case 12:
      summary = `${c.items.length}/${L.galleryItems}`;
      body = <GalleryBody value={c} onChange={replace} messageId={messageId} />;
      break;
    case 13:
      summary = c.file.url.replace('attachment://', '');
      body = <FileBody value={c} onChange={replace} messageId={messageId} />;
      break;
    case 14:
      summary = `${c.divider ? 'con línea' : 'sin línea'} · ${c.spacing === 2 ? 'grande' : 'pequeño'}`;
      body = (
        <div className="grid items-end gap-2.5 sm:grid-cols-2">
          <CheckField className="pb-2" label="Mostrar línea divisoria" checked={c.divider} onChange={(v) => replace({ ...c, divider: v })} />
          <SelectField label="Espaciado" value={c.spacing} options={[[1, 'Pequeño'], [2, 'Grande']] as const} onChange={(v) => replace({ ...c, spacing: v })} />
        </div>
      );
      break;
    case 17:
      summary = `${c.components.length} dentro`;
      body = (
        <>
          <div className="grid items-end gap-2.5 sm:grid-cols-2">
            <ColorField label="Color de acento" nullable value={c.accent_color} onChange={(v) => replace({ ...c, accent_color: v })} />
            <CheckField className="pb-2" label="Spoiler (todo el contenedor)" checked={c.spoiler} onChange={(v) => replace({ ...c, spoiler: v })} />
          </div>
          <div className="ml-1 flex flex-col gap-2 border-l-2 border-dashed border-line-2 pl-2.5">
            {c.components.length ? (
              c.components.map((cc, j) => (
                <ComponentEditor key={cc._id} items={c.components} index={j} depth="container" messageId={messageId} onItemsChange={(children) => replace({ ...c, components: children })} />
              ))
            ) : (
              <Empty>Contenedor vacío.</Empty>
            )}
          </div>
          <AddButtons options={CHILD_TYPES.map((t) => ({ label: t.label, icon: V2_META[t.type].icon, onClick: () => replace({ ...c, components: [...c.components, t.create()] }) }))} />
        </>
      );
      break;
  }

  return (
    <Card
      id={c._id}
      icon={meta.icon}
      title={meta.name}
      summary={summary}
      actions={<ItemActions items={items} index={index} onChange={onItemsChange} extra={extra} />}
    >
      {body}
    </Card>
  );
}

export const rootAddOptions = (onAdd: (c: TopLevelComponent) => void) =>
  ROOT_TYPES.map((t) => ({ label: t.label, icon: V2_META[t.type].icon, onClick: () => onAdd(t.create()) }));


