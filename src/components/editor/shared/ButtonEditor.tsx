import { MousePointerClick, RectangleHorizontal } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { Card, Tag } from '@/components/ui/card';
import { CheckField, Note, SelectField, TextField } from '@/components/ui/fields';
import { editor } from '@/lib/edit';
import { LIMITS, make } from '@/lib/factory';
import type { ActionRow, ButtonComponent, ButtonStyle } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AddButtons, ItemActions } from './ListControls';

const STYLES = [
  [5, 'Enlace'],
  [1, 'Primario (blurple)'],
  [2, 'Secundario (gris)'],
  [3, 'Éxito (verde)'],
  [4, 'Peligro (rojo)'],
] as const satisfies readonly (readonly [ButtonStyle, string])[];

const STYLE_TAG: Record<ButtonStyle, [string, string]> = {
  1: ['Primario', 'bg-dc-blurple text-white'],
  2: ['Secundario', 'bg-dc-grey text-white'],
  3: ['Éxito', 'bg-dc-green text-white'],
  4: ['Peligro', 'bg-dc-red text-white'],
  5: ['Enlace', ''],
};

/** Campos de un botón (sin tarjeta), reutilizado también como accesorio de sección. */
export function ButtonFields({ value, onChange }: { value: ButtonComponent; onChange: (b: ButtonComponent) => void }) {
  const set = editor(value, onChange);
  const isLink = value.style === 5;
  return (
    <>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <SelectField label="Estilo" value={value.style} options={STYLES} onChange={(v) => set((d) => void (d.style = v))} />
        <TextField label="Texto" max={LIMITS.common.buttonLabel} value={value.label} onChange={(v) => set((d) => void (d.label = v))} />
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {isLink ? (
          <TextField label="URL" required placeholder="https://…" value={value.url} onChange={(v) => set((d) => void (d.url = v))} />
        ) : (
          <TextField label="custom_id" mono max={LIMITS.common.customId} placeholder="auto si vacío" value={value.custom_id} onChange={(v) => set((d) => void (d.custom_id = v))} />
        )}
        <TextField label="Emoji" placeholder="🔥 o <:nombre:id>" value={value.emoji} onChange={(v) => set((d) => void (d.emoji = v))} />
      </div>
      <CheckField label="Desactivado" checked={value.disabled} onChange={(v) => set((d) => void (d.disabled = v))} />
      {!isLink && <Note>Solo los webhooks creados por una aplicación (bot) aceptan botones que no son de enlace, y su interacción la gestiona el bot.</Note>}
    </>
  );
}

interface ListProps<T> {
  items: readonly T[];
  index: number;
  onItemsChange: (items: T[]) => void;
}

export function ButtonEditor({ items, index, onItemsChange }: ListProps<ButtonComponent>) {
  const b = items[index];
  const [tagLabel, tagClass] = STYLE_TAG[b.style];
  return (
    <Card
      id={b._id}
      compact
      icon={<MousePointerClick />}
      title={b.label || b.emoji || 'Botón'}
      tag={<Tag className={tagClass}>{tagLabel}</Tag>}
      actions={<ItemActions items={items} index={index} min={1} max={LIMITS.common.buttonsPerRow} onChange={onItemsChange} />}
    >
      <ButtonFields value={b} onChange={(nb) => onItemsChange(items.map((x, j) => (j === index ? nb : x)))} />
    </Card>
  );
}

export function ActionRowEditor({ row, onChange, actions, className, style }: { row: ActionRow; onChange: (r: ActionRow) => void; actions: ReactNode; className?: string; style?: CSSProperties }) {
  const setButtons = (components: ButtonComponent[]) => onChange({ ...row, components });
  return (
    <Card
      id={row._id}
      className={cn(className)}
      style={style}
      icon={<RectangleHorizontal />}
      title="Fila de botones"
      tag={<Tag>{row.components.length}/5</Tag>}
      actions={actions}
    >
      {row.components.map((b, j) => (
        <ButtonEditor key={b._id} items={row.components} index={j} onItemsChange={setButtons} />
      ))}
      <AddButtons
        options={[{ label: 'Botón', disabled: row.components.length >= LIMITS.common.buttonsPerRow, onClick: () => setButtons([...row.components, make.button()]) }]}
      />
    </Card>
  );
}
