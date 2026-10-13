import { Copy, Database, Download, Link2, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button, IconButton } from '@/components/ui/button';
import { ModePill } from '@/components/ui/card';
import { Sheet } from '@/components/ui/dialog';
import { Empty } from '@/components/ui/fields';
import type { Backup, Message } from '@/lib/types';
import { cn, download, fmtDate, fmtSize, slug } from '@/lib/utils';
import { importFromFile, restoreBackup } from '@/store/actions';
import { modesOf, useBackups } from '@/store/backups';
import { confirmDialog, promptDialog } from '@/store/dialogs';
import { useWorkspace } from '@/store/workspace';


type ModeFilter = 'all' | 'v1' | 'v2' | 'mixed';

function snippet(m?: Message) {
  if (!m) return '';
  if (m.mode === 'v1') return m.v1.content || m.v1.embeds[0]?.title || m.v1.embeds[0]?.description || '';
  const match = JSON.stringify(m.v2.components).match(/"content":"((?:[^"\\]|\\.)*)"/);
  return match ? JSON.parse(`"${match[1]}"`) : '';
}

export async function saveManualBackup() {
  const first = useWorkspace.getState().messages[0];
  const name = await promptDialog('Guardar backup', `${first?.username || 'Backup'} · ${fmtDate(Date.now())}`, 'Nombre');
  if (name === null) return;
  useBackups.getState().create(name || undefined);
  toast.success('Backup guardado');
}

function BackupItem({ b }: { b: Backup }) {
  const { remove, update, create } = useBackups();
  const mc = modesOf(b.messages);
  const text = snippet(b.messages[0]);
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-line bg-panel-2 p-3 hover:border-line-2">
      <div className="flex items-center gap-2">
        {b.kind === 'import' && <span className="shrink-0 rounded bg-panel-3 px-1.5 py-px text-[10.5px] font-bold uppercase tracking-wide text-muted">Importado</span>}
        <b className="min-w-0 truncate" title={b.name}>
          {b.name}
        </b>
        <span className="flex-1" />
        {mc.v1 > 0 && <ModePill mode="v1">V1 ×{mc.v1}</ModePill>}
        {mc.v2 > 0 && <ModePill mode="v2">V2 ×{mc.v2}</ModePill>}
      </div>
      <div className="text-xs text-muted">
        {fmtDate(b.updatedAt || b.createdAt)} · {b.messages.length} mensaje(s)
      </div>
      {text && <div className="truncate rounded-md bg-panel px-2 py-1 text-[12.5px] text-[#b5bac1]">{text.slice(0, 160)}</div>}
      <div className="flex flex-wrap items-center gap-1">
        <Button size="sm" variant="primary" onClick={() => restoreBackup(b, 'replace')}>
          Restaurar
        </Button>
        <Button size="sm" title="Añade sus mensajes al final del espacio actual" onClick={() => restoreBackup(b, 'append')}>
          Añadir
        </Button>
        <Button
          size="sm"
          onClick={async () => {
            if (!(await confirmDialog(`¿Sobrescribir «${b.name}» con el espacio de trabajo actual?`, { ok: 'Sobrescribir' }))) return;
            update(b.id, { messages: structuredClone(useWorkspace.getState().messages) });
            toast.success('Backup actualizado');
          }}
        >
          Sobrescribir
        </Button>
        <span className="flex-1" />
        <IconButton
          title="Renombrar"
          onClick={async () => {
            const n = await promptDialog('Renombrar backup', b.name);
            if (n) update(b.id, { name: n });
          }}
        >
          <Pencil />
        </IconButton>
        <IconButton title="Duplicar" onClick={() => create(`${b.name} (copia)`, b.messages)}>
          <Copy />
        </IconButton>
        <IconButton title="Descargar JSON" onClick={() => download(`dualhook-${slug(b.name)}.json`, JSON.stringify({ app: 'dualhook', version: 1, backups: [b] }, null, 2))}>
          <Download />
        </IconButton>
        <IconButton
          danger
          title="Eliminar"
          onClick={async () => (await confirmDialog(`¿Eliminar el backup «${b.name}»? No se puede deshacer.`, { ok: 'Eliminar', danger: true })) && remove(b.id)}
        >
          <Trash2 />
        </IconButton>
      </div>
    </div>
  );
}

export function BackupsSheet({ open, onOpenChange, onExport }: { open: boolean; onOpenChange: (v: boolean) => void; onExport: () => void }) {
  const list = useBackups((s) => s.list);
  const [mode, setMode] = useState<ModeFilter>('all');
  const [q, setQ] = useState('');

  const shown = list.filter((b) => {
    const mc = modesOf(b.messages);
    if (mode === 'v1' && (!mc.v1 || mc.v2)) return false;
    if (mode === 'v2' && (!mc.v2 || mc.v1)) return false;
    if (mode === 'mixed' && !(mc.v1 && mc.v2)) return false;
    return !q || b.name.toLowerCase().includes(q.toLowerCase());
  });
  const size = new Blob([localStorage.getItem('dualhook.backups') ?? '']).size;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={
        <>
          <Database className="size-5 text-muted" /> Backups
        </>
      }
      headerExtra={<span className="text-xs text-muted">{list.length} guardados · {fmtSize(size)}</span>}
    >
      <div className="flex flex-wrap gap-1.5">
        <Button variant="primary" onClick={saveManualBackup}>
          <Plus /> Guardar backup ahora
        </Button>
        <Button onClick={importFromFile}>
          <Upload /> Importar
        </Button>
        <Button onClick={onExport}>
          <Download /> Exportar…
        </Button>
      </div>

      <div className="flex gap-2 rounded-lg border border-line bg-panel-2 p-2.5 text-[12.5px] text-muted">
        <Link2 className="mt-0.5 size-4 shrink-0" />
        <span>
          Los backups solo se guardan cuando tú quieras. Mientras tanto, <b className="text-fg">el enlace de la página se actualiza solo</b> con
          tus mensajes: si cierras la pestaña sin guardar, abre ese enlace (está en el historial del navegador) y lo recuperas.
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="inline-flex w-fit gap-0.5 rounded-lg border border-line-2 bg-panel p-0.5">
          {(
            [
              ['all', 'Cualquier modo', 'bg-panel-3 text-fg'],
              ['v1', 'Solo V1', 'bg-panel-3 text-fg'],
              ['v2', 'Solo V2', 'bg-panel-3 text-fg'],
              ['mixed', 'Mixto', 'bg-panel-3 text-fg'],
            ] as const
          ).map(([v, l, on]) => (
            <button key={v} type="button" onClick={() => setMode(v)} className={cn('rounded-md px-2.5 py-1 text-xs text-muted hover:text-fg', mode === v && on)}>
              {l}
            </button>
          ))}
        </div>
        <label className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
          <input className="input pl-8" placeholder="Buscar por nombre…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      <div className="flex flex-col gap-2">{shown.length ? shown.map((b) => <BackupItem key={b.id} b={b} />) : <Empty>{list.length ? "No hay backups con este filtro." : "Aún no hay backups. Pulsa «Guardar backup ahora» cuando quieras guardar una copia."}</Empty>}</div>
    </Sheet>
  );
}
