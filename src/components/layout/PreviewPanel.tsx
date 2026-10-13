import { Braces, Check, Copy, Eye, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Preview } from '@/components/preview/Preview';
import { Button } from '@/components/ui/button';
import { ModePill } from '@/components/ui/card';
import { Segmented } from '@/components/ui/fields';
import { buildPayload } from '@/lib/payload';
import { applyJson } from '@/store/actions';
import { useMessageFiles, useUi } from '@/store/ui';
import { useActiveMessage } from '@/store/workspace';

function JsonView() {
  const m = useActiveMessage();
  const files = useMessageFiles(m.id);
  const generated = useMemo(() => JSON.stringify(buildPayload(m, files, { forEdit: !!m.editMessageId }), null, 2), [m, files]);
  const [text, setText] = useState(generated);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) setText(generated);
  }, [generated, dirty]);

  const apply = () => {
    try {
      const mode = applyJson(text);
      setDirty(false);
      toast.success(`JSON aplicado como ${mode.toUpperCase()}`);
    } catch (e) {
      toast.error(`JSON no válido: ${(e as Error).message}`);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-3.5">
      <div className="flex items-center gap-1.5">
        <ModePill mode={m.mode}>{m.mode === 'v1' ? 'Payload V1 · content/embeds' : 'Payload V2 · flags 32768'}</ModePill>
        {dirty && <span className="text-xs text-amber-400">cambios sin aplicar</span>}
        <span className="flex-1" />
        <Button size="sm" disabled={!dirty} onClick={() => setDirty(false)}>
          <RotateCcw /> Descartar
        </Button>
        <Button size="sm" onClick={() => navigator.clipboard.writeText(text).then(() => toast.success('JSON copiado'))}>
          <Copy /> Copiar
        </Button>
        <Button size="sm" variant="primary" disabled={!dirty} onClick={apply}>
          <Check /> Aplicar
        </Button>
      </div>
      <textarea
        className="min-h-0 flex-1 resize-none rounded-lg border border-dc-dark bg-dc-dark p-3 font-mono text-xs leading-relaxed text-dc-text outline-none focus:border-mode"
        spellCheck={false}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setDirty(true);
        }}
      />
      <p className="text-xs text-dc-muted">
        Pega aquí cualquier payload de webhook. Con <code className="font-mono">flags: 32768</code> se carga como V2; si no, como V1.
      </p>
    </div>
  );
}

export function PreviewPanel() {
  const view = useUi((s) => s.view);
  const setView = useUi((s) => s.setView);
  return (
    <section className="flex min-h-[70vh] flex-col bg-dc-bg lg:min-h-0">
      <div className="flex items-center gap-3 border-b border-[#26282c] bg-dc-embed px-3.5 py-2">
        <Segmented
          className="border-dc-dark bg-dc-dark"
          value={view}
          onChange={setView}
          options={[
            ['preview', <><Eye /> Vista previa</>],
            ['json', <><Braces /> JSON</>],
          ]}
        />
        <span className="text-xs text-dc-muted">{view === 'preview' ? 'Haz clic en un mensaje para editarlo' : 'Payload exacto que se envía'}</span>
      </div>
      {view === 'preview' ? <Preview /> : <JsonView />}
    </section>
  );
}
