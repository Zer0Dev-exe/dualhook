import { Boxes } from 'lucide-react';
import { Card, Tag } from '@/components/ui/card';
import { Empty } from '@/components/ui/fields';
import { LIMITS } from '@/lib/factory';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { v2Stats } from '@/lib/validation';
import { useWorkspace } from '@/store/workspace';
import { AddButtons } from '../shared/ListControls';
import { ComponentEditor, rootAddOptions } from './ComponentEditor';

function Meter({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const tone = value > max ? 'bg-red-500' : value > max * 0.9 ? 'bg-amber-400' : 'bg-mode';
  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-panel px-3 pb-2.5 pt-1.5 text-[12.5px] text-muted">
      <div className="flex justify-between">
        <span>{label}</span>
        <b className={cn('tabular-nums text-fg', value > max && 'text-red-400')}>
          {value}/{max}
        </b>
      </div>
      <i className={cn('absolute bottom-0 left-0 h-[3px] transition-all', tone)} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Editor del modo V2 (Components V2): árbol de componentes. */
export function V2Editor({ message }: { message: Message }) {
  const update = useWorkspace((s) => s.updateActive);
  const comps = message.v2.components;
  const st = v2Stats(comps);
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        <Meter label="Componentes" value={st.count} max={LIMITS.v2.components} />
        <Meter label="Caracteres de texto" value={st.chars} max={LIMITS.v2.textTotal} />
      </div>
      <Card className="border-mode/40" icon={<Boxes />} title="Componentes" tag={<Tag>{comps.length} en raíz</Tag>}>
        {comps.length ? (
          <div className="flex flex-col gap-2">
            {comps.map((c, i) => (
              <ComponentEditor key={c._id} items={comps} index={i} depth="root" messageId={message.id} onItemsChange={(next) => update((m) => void (m.v2.components = next))} />
            ))}
          </div>
        ) : (
          <Empty>Mensaje vacío. Empieza añadiendo un Contenedor o un Texto.</Empty>
        )}
        <AddButtons options={rootAddOptions((c) => update((m) => void m.v2.components.push(c)))} />
      </Card>
    </>
  );
}
