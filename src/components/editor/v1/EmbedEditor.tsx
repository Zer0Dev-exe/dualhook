import { Clock, PanelTop, Trash2 } from 'lucide-react';
import { Button, IconButton } from '@/components/ui/button';
import { Card, Tag } from '@/components/ui/card';
import { CheckField, ColorField, Fieldset, TextField } from '@/components/ui/fields';
import { editor } from '@/lib/edit';
import { LIMITS, make } from '@/lib/factory';
import type { Embed, EmbedField } from '@/lib/types';
import { embedChars } from '@/lib/validation';
import { AddButtons, ItemActions } from '../shared/ListControls';

const L = LIMITS.v1;

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(+d)) return '';
  return new Date(+d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

function FieldItem({ fields, index, onChange }: { fields: EmbedField[]; index: number; onChange: (f: EmbedField[]) => void }) {
  const f = fields[index];
  const set = editor(f, (nf) => onChange(fields.map((x, j) => (j === index ? nf : x))));
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-panel p-2.5">
      <div className="flex items-center gap-3 text-[12.5px]">
        <b>Campo {index + 1}</b>
        <CheckField label="En línea" checked={f.inline} onChange={(v) => set((d) => void (d.inline = v))} />
        <span className="flex-1" />
        <ItemActions items={fields} index={index} max={L.fields} onChange={onChange} />
      </div>
      <TextField label="Nombre" required max={L.fieldName} value={f.name} onChange={(v) => set((d) => void (d.name = v))} />
      <TextField label="Valor" required multiline rows={2} max={L.fieldValue} value={f.value} onChange={(v) => set((d) => void (d.value = v))} />
    </div>
  );
}

interface Props {
  embeds: Embed[];
  index: number;
  onChange: (embeds: Embed[]) => void;
  attachList: string;
}

export function EmbedEditor({ embeds, index, onChange, attachList }: Props) {
  const e = embeds[index];
  const set = editor(e, (ne) => onChange(embeds.map((x, j) => (j === index ? ne : x))));
  const chars = embedChars(e);
  return (
    <Card
      id={e._id}
      className="border-l-4"
      style={{ borderLeftColor: e.color || '#1e1f22' }}
      icon={<PanelTop />}
      title={`Embed ${index + 1}`}
      tag={<Tag className={chars > L.embedTotal ? 'text-red-400' : ''}>{chars}/{L.embedTotal}</Tag>}
      summary={e.title || e.author.name || e.description.slice(0, 40)}
      actions={<ItemActions items={embeds} index={index} max={L.embeds} onChange={onChange} />}
    >
      <Fieldset title="Autor">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <TextField label="Nombre" max={L.author} value={e.author.name} onChange={(v) => set((d) => void (d.author.name = v))} />
          <TextField label="URL" placeholder="https://…" value={e.author.url} onChange={(v) => set((d) => void (d.author.url = v))} />
        </div>
        <TextField label="Icono" placeholder="https://… o attachment://" list={attachList} value={e.author.icon_url} onChange={(v) => set((d) => void (d.author.icon_url = v))} />
      </Fieldset>

      <Fieldset title="Cuerpo">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <TextField label="Título" max={L.title} value={e.title} onChange={(v) => set((d) => void (d.title = v))} />
          <TextField label="URL del título" placeholder="https://…" value={e.url} onChange={(v) => set((d) => void (d.url = v))} />
        </div>
        <TextField label="Descripción" multiline rows={4} max={L.description} value={e.description} onChange={(v) => set((d) => void (d.description = v))} />
        <ColorField label="Color de la barra" value={e.color} onChange={(v) => set((d) => void (d.color = v ?? ''))} />
      </Fieldset>

      <Fieldset title={`Campos (${e.fields.length}/${L.fields})`}>
        {e.fields.map((f, j) => (
          <FieldItem key={f._id} fields={e.fields} index={j} onChange={(fields) => set((d) => void (d.fields = fields))} />
        ))}
        <AddButtons options={[{ label: 'Campo', disabled: e.fields.length >= L.fields, onClick: () => set((d) => void d.fields.push(make.field())) }]} />
      </Fieldset>

      <Fieldset title="Imágenes">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <TextField label="Imagen grande" placeholder="https://… o attachment://" list={attachList} value={e.image} onChange={(v) => set((d) => void (d.image = v))} />
          <TextField label="Miniatura" placeholder="https://… o attachment://" list={attachList} value={e.thumbnail} onChange={(v) => set((d) => void (d.thumbnail = v))} />
        </div>
      </Fieldset>

      <Fieldset title="Pie">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <TextField label="Texto" max={L.footer} value={e.footer.text} onChange={(v) => set((d) => void (d.footer.text = v))} />
          <TextField label="Icono" placeholder="https://…" list={attachList} value={e.footer.icon_url} onChange={(v) => set((d) => void (d.footer.icon_url = v))} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="label">Marca de tiempo</span>
          <div className="flex items-center gap-1.5">
            <input
              type="datetime-local"
              className="input"
              value={e.timestamp ? toLocalInput(e.timestamp) : ''}
              onChange={(ev) => set((d) => void (d.timestamp = ev.target.value ? new Date(ev.target.value).toISOString() : ''))}
            />
            <Button size="sm" onClick={() => set((d) => void (d.timestamp = new Date().toISOString()))}>
              <Clock /> Ahora
            </Button>
            <IconButton title="Quitar" danger onClick={() => set((d) => void (d.timestamp = ''))}>
              <Trash2 />
            </IconButton>
          </div>
        </div>
      </Fieldset>
    </Card>
  );
}
