import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { list } from '@/lib/edit';
import { withNewIds } from '@/lib/utils';
import { Button, IconButton } from '@/components/ui/button';

interface ItemActionsProps<T> {
  items: readonly T[];
  index: number;
  onChange: (items: T[]) => void;
  min?: number;
  max?: number;
  noDuplicate?: boolean;
  extra?: ReactNode;
}

/** Subir / bajar / duplicar / eliminar un elemento de una lista. */
export function ItemActions<T>({ items, index, onChange, min, max, noDuplicate, extra }: ItemActionsProps<T>) {
  return (
    <>
      {extra}
      <IconButton title="Subir" disabled={index === 0} onClick={() => onChange(list.move(items, index, index - 1))}>
        <ArrowUp />
      </IconButton>
      <IconButton title="Bajar" disabled={index === items.length - 1} onClick={() => onChange(list.move(items, index, index + 1))}>
        <ArrowDown />
      </IconButton>
      {!noDuplicate && (
        <IconButton title="Duplicar" disabled={!!max && items.length >= max} onClick={() => onChange(list.insert(items, index + 1, withNewIds(items[index])))}>
          <Copy />
        </IconButton>
      )}
      <IconButton title="Eliminar" danger disabled={!!min && items.length <= min} onClick={() => onChange(list.remove(items, index))}>
        <Trash2 />
      </IconButton>
    </>
  );
}

export interface AddOption {
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  title?: string;
  onClick: () => void;
}

/** Fila de botones «+ Algo» para añadir elementos. */
export function AddButtons({ options }: { options: AddOption[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <Button key={o.label} variant="dashed" size="sm" className="rounded-full" disabled={o.disabled} title={o.title} onClick={o.onClick}>
          <Plus />
          {o.icon}
          {o.label}
        </Button>
      ))}
    </div>
  );
}
