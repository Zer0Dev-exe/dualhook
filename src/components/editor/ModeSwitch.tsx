import { ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Message, Mode } from '@/lib/types';
import { cn } from '@/lib/utils';
import { convertActive, hasContent } from '@/store/actions';
import { useWorkspace } from '@/store/workspace';

const INFO: Record<Mode, { title: string; flag: string; points: string[] }> = {
  v1: {
    title: 'V1 · Clásico',
    flag: 'content + embeds',
    points: ['Texto de hasta 2000 caracteres', 'Hasta 10 embeds (6000 caracteres)', 'Hasta 5 filas de botones de enlace'],
  },
  v2: {
    title: 'V2 · Components',
    flag: 'IS_COMPONENTS_V2',
    points: ['Contenedores, secciones, galerías, separadores y archivos', 'Hasta 40 componentes y 4000 caracteres', 'Sin content ni embeds'],
  },
};

const TONE: Record<Mode, { on: string; text: string; dot: string; pill: string }> = {
  v1: { on: 'border-[#4b5260] bg-panel-2', text: 'text-fg', dot: 'bg-v1', pill: 'border-line-2 text-muted' },
  v2: { on: 'border-[#4b5260] bg-panel-2', text: 'text-fg', dot: 'bg-v2', pill: 'border-line-2 text-muted' },
};

function ModeCard({ m, mode }: { m: Message; mode: Mode }) {
  const update = useWorkspace((s) => s.updateActive);
  const on = m.mode === mode;
  const info = INFO[mode];
  const tone = TONE[mode];
  return (
    <button
      type="button"
      onClick={() => !on && update((d) => void (d.mode = mode))}
      className={cn('rounded-xl border bg-panel p-3 text-left transition', on ? tone.on : 'border-line opacity-60 hover:border-line-2 hover:opacity-100')}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('size-2 rounded-full', tone.dot)} />
        <b className={cn('text-[15px]', tone.text)}>{info.title}</b>
        <code className="rounded bg-panel-3 px-1.5 font-mono text-[10.5px] text-muted">{info.flag}</code>
        {!on && hasContent(m, mode) && <span className={cn('ml-auto rounded-full border px-2 text-[10.5px]', tone.pill)}>borrador</span>}
      </div>
      <ul className={cn('mt-1.5 list-disc pl-5 text-[12.5px]', on ? 'text-fg' : 'text-muted')}>
        {info.points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </button>
  );
}

/** Selector V1/V2: dos borradores independientes por mensaje. */
export function ModeSwitch({ message }: { message: Message }) {
  const other = message.mode === 'v1' ? 'v2' : 'v1';
  return (
    <div className="flex flex-col gap-2">
      <div className="grid gap-2.5 sm:grid-cols-2">
        <ModeCard m={message} mode="v1" />
        <ModeCard m={message} mode="v2" />
      </div>
      <div className="flex items-center gap-3 px-0.5 text-[12.5px] text-muted">
        <span className="flex-1">
          Cada mensaje guarda un borrador <b className="text-fg">V1</b> y otro <b className="text-fg">V2</b> por separado. Solo se envía el del modo activo.
        </span>
        <Button size="sm" disabled={!hasContent(message, message.mode)} onClick={convertActive}>
          <ArrowRightLeft /> Convertir a {other.toUpperCase()}
        </Button>
      </div>
    </div>
  );
}
