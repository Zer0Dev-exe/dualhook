import { ChevronUp, CircleCheck, CircleX, Loader2, Pencil, Send, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { validate } from '@/lib/validation';
import { sendMessage } from '@/store/actions';
import { useActiveTarget } from '@/store/targets';
import { useMessageFiles } from '@/store/ui';
import { useActiveMessage, useWorkspace } from '@/store/workspace';

/** Estado de validación + botones de envío. Ctrl+Enter dispara #send-button. */
export function SendBar() {
  const m = useActiveMessage();
  const index = useWorkspace((s) => s.active);
  const count = useWorkspace((s) => s.messages.length);
  const files = useMessageFiles(m.id);
  const target = useActiveTarget();
  const { errors, warnings } = useMemo(() => validate(m, files, target), [m, files, target]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<{ index: number; error: string } | null>(null);
  const editing = !!m.editMessageId;
  const noUrl = !target.url;

  const sendOne = async () => {
    setBusy(true);
    const r = await sendMessage(index);
    setBusy(false);
    if (r.ok) toast.success(editing ? 'Mensaje editado' : 'Mensaje enviado');
    else setFailure({ index, error: r.error });
  };

  const sendAll = async () => {
    setBusy(true);
    let ok = 0;
    for (let i = 0; i < count; i++) {
      const r = await sendMessage(i);
      if (!r.ok) {
        setFailure({ index: i, error: r.error });
        break;
      }
      ok++;
    }
    setBusy(false);
    if (ok === count) toast.success(`${ok}/${count} mensajes enviados`);
  };

  const status = errors.length ? 'bad' : warnings.length ? 'warn' : 'ok';
  return (
    <div className="sticky bottom-0 z-10 shrink-0 border-t border-line bg-panel px-4 py-2.5 lg:static">
      {open && (errors.length > 0 || warnings.length > 0) && (
        <div className="mb-2 flex max-h-44 flex-col gap-1 overflow-auto text-[12.5px]">
          {errors.map((e) => (
            <div key={e} className="flex gap-1.5 text-red-300">
              <CircleX className="mt-0.5 size-3.5 shrink-0" /> {e}
            </div>
          ))}
          {warnings.map((w) => (
            <div key={w} className="flex gap-1.5 text-amber-200">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" /> {w}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[13px] font-semibold hover:bg-panel-3',
            status === 'ok' && 'text-emerald-400',
            status === 'warn' && 'text-amber-400',
            status === 'bad' && 'text-red-400',
          )}
        >
          {errors.length ? <CircleX className="size-4" /> : <CircleCheck className="size-4" />}
          {errors.length ? `${errors.length} error(es)` : 'Listo'}
          {warnings.length > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              · <TriangleAlert className="size-3.5" /> {warnings.length}
            </span>
          )}
          {(errors.length > 0 || warnings.length > 0) && <ChevronUp className={cn('size-3.5 transition', open && 'rotate-180')} />}
        </button>
        <span className="flex-1" />
        {count > 1 && (
          <Button disabled={noUrl || busy} onClick={sendAll} title="Envía todos los mensajes en orden">
            Enviar todos ({count})
          </Button>
        )}
        <Button
          id="send-button"
          variant={m.mode}
          size="lg"
          disabled={noUrl || busy || errors.length > 0}
          title={noUrl ? 'Configura la URL del webhook' : errors.length ? 'Corrige los errores primero' : 'Ctrl+Enter'}
          onClick={sendOne}
        >
          {busy ? <Loader2 className="animate-spin" /> : editing ? <Pencil /> : <Send />}
          {editing ? `Guardar edición ${m.mode.toUpperCase()}` : `Enviar ${m.mode.toUpperCase()}`}
        </Button>
      </div>

      <Modal
        open={!!failure}
        onOpenChange={(v) => !v && setFailure(null)}
        title={`Discord rechazó el mensaje ${(failure?.index ?? 0) + 1}`}
        footer={<Button onClick={() => setFailure(null)}>Cerrar</Button>}
      >
        <pre className="whitespace-pre-wrap rounded-lg border border-red-500/40 bg-dc-dark p-3 font-mono text-xs text-red-200">{failure?.error}</pre>
        <p className="mt-2 text-xs text-muted">La ruta (p. ej. components.0.components.1) indica qué componente falla; revísalo en el editor o en la pestaña JSON.</p>
      </Modal>
    </div>
  );
}
