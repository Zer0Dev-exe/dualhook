import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ModePill } from '@/components/ui/card';
import { Modal } from '@/components/ui/dialog';
import { CheckField } from '@/components/ui/fields';
import { templatesFor } from '@/lib/templates';
import type { Mode } from '@/lib/types';
import { cn, download } from '@/lib/utils';
import { applyTemplate, exportBundle, shareUrl } from '@/store/actions';
import { useBackups } from '@/store/backups';
import { useDialogStore } from '@/store/dialogs';
import { useWorkspace } from '@/store/workspace';

interface DialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ExportDialog({ open, onOpenChange, includeBackups }: DialogProps & { includeBackups?: boolean }) {
  const count = useWorkspace((s) => s.messages.length);
  const backups = useBackups((s) => s.list.length);
  const [opts, setOpts] = useState({ workspace: true, backups: false, targets: false });
  useEffect(() => {
    if (open) setOpts({ workspace: true, backups: !!includeBackups, targets: false });
  }, [open, includeBackups]);
  const save = () => {
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    download(`dualhook-${stamp}.json`, JSON.stringify(exportBundle(opts), null, 2));
    onOpenChange(false);
  };
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Exportar a JSON"
      description="Se descarga un archivo que puedes volver a importar aquí."
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="primary" disabled={!opts.workspace && !opts.backups && !opts.targets} onClick={save}>
            Descargar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <CheckField label={`Espacio de trabajo actual (${count} mensajes)`} checked={opts.workspace} onChange={(v) => setOpts({ ...opts, workspace: v })} />
        <CheckField label={`Todos los backups (${backups})`} checked={opts.backups} onChange={(v) => setOpts({ ...opts, backups: v })} />
        <CheckField
          label={
            <>
              URLs de webhooks guardados <span className="text-amber-300">— contienen el token: quien tenga el archivo podrá publicar</span>
            </>
          }
          checked={opts.targets}
          onChange={(v) => setOpts({ ...opts, targets: v })}
        />
      </div>
    </Modal>
  );
}

export function ShareDialog({ open, onOpenChange }: DialogProps) {
  const [data, setData] = useState({ url: '', json: '' });
  useEffect(() => {
    if (open) setData(shareUrl());
  }, [open]);
  const copy = (text: string, msg: string) => navigator.clipboard.writeText(text).then(() => toast.success(msg));
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Compartir"
      description="El enlace contiene los mensajes (no la URL del webhook ni los archivos)."
      footer={
        <>
          <Button onClick={() => copy(data.json, 'JSON copiado')}>Copiar JSON</Button>
          <Button variant="primary" onClick={() => copy(data.url, 'Enlace copiado')}>
            Copiar enlace
          </Button>
        </>
      }
    >
      <textarea className="input h-28 resize-none font-mono text-xs" readOnly value={data.url} />
      <p className="mt-1 text-xs text-muted">{data.url.length} caracteres</p>
    </Modal>
  );
}

export function TemplatesDialog({ open, onOpenChange }: DialogProps) {
  const Group = ({ mode }: { mode: Mode }) => (
    <div>
      <h4 className="mb-2 flex items-center gap-2 font-semibold">
        <ModePill mode={mode} /> {mode === 'v1' ? 'Clásico' : 'Components V2'}
      </h4>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2">
        {templatesFor(mode).map((t) => (
          <button
            key={t.name}
            type="button"
            onClick={async () => (await applyTemplate(t)) && onOpenChange(false)}
            className={cn('rounded-xl border bg-panel-2 p-3 text-left transition', mode === 'v1' ? 'border-v1/40 hover:bg-v1/10' : 'border-v2/40 hover:bg-v2/10')}
          >
            <div className="font-semibold">{t.name}</div>
            <div className="text-xs text-muted">{t.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Plantillas" description="Sustituyen el borrador del modo correspondiente del mensaje actual." wide>
      <div className="flex flex-col gap-4">
        <Group mode="v2" />
        <Group mode="v1" />
      </div>
    </Modal>
  );
}

/** Pinta los confirm()/prompt() imperativos de store/dialogs. */
export function DialogHost() {
  const { current, close } = useDialogStore();
  const [value, setValue] = useState('');
  // estado derivado: al abrir un prompt nuevo, el valor inicial está listo en el primer render
  const [seen, setSeen] = useState(current);
  if (current !== seen) {
    setSeen(current);
    if (current?.kind === 'prompt') setValue(current.value);
  }
  if (!current) return null;

  const finish = (result: boolean) => {
    if (current.kind === 'confirm') current.resolve(result);
    else current.resolve(result ? value.trim() : null);
    close();
  };

  return (
    <Modal
      open
      onOpenChange={(v) => !v && finish(false)}
      title={current.title}
      footer={
        <>
          <Button onClick={() => finish(false)}>Cancelar</Button>
          <Button variant={current.kind === 'confirm' && current.danger ? 'danger' : 'primary'} onClick={() => finish(true)}>
            {current.kind === 'confirm' ? current.ok : 'Aceptar'}
          </Button>
        </>
      }
    >
      {current.kind === 'confirm' ? (
        <p className="whitespace-pre-line text-[13.5px]">{current.message}</p>
      ) : (
        <label className="flex flex-col gap-1">
          {current.label && <span className="label">{current.label}</span>}
          <input className="input" autoFocus value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && finish(true)} />
        </label>
      )}
    </Modal>
  );
}
