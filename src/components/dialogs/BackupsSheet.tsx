import { Copy, Database, Download, Pencil, Pin, Plus, Search, Trash2, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button, IconButton } from '@/components/ui/button';
import { ModePill } from '@/components/ui/card';
import { Sheet } from '@/components/ui/dialog';
import { Empty, Segmented, SelectField } from '@/components/ui/fields';
import type { Backup, BackupKind, Message } from '@/lib/types';
import { cn, download, fmtDate, fmtSize, slug } from '@/lib/utils';
import { importFromFile, restoreBackup } from '@/store/actions';
import { modesOf, useBackups } from '@/store/backups';
import { confirmDialog, promptDialog } from '@/store/dialogs';
import { useUi } from '@/store/ui';
import { useWorkspace } from '@/store/workspace';

const KIND: Record<BackupKind, { label: string; cls: string }> = {
  manual: { label: 'Manual', cls: 'bg-slate-600/60 text-slate-100' },
  auto: { label: 'Auto', cls: 'bg-panel-3 text-muted' },
  sent: { label: 'Enviado', cls: 'bg-emerald-500/20 text-emerald-300' },
  import: { label: 'Importado', cls: 'bg-amber-400/20 text-amber-200' },
};

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
  useBackups.getState().create('manual', name || undefined);
  toast.success('Backup guardado');
}

function BackupItem({ b }: { b: Backup }) {
  const { remove, update, create } = useBackups();
  const mc = modesOf(b.messages);
  const text = snippet(b.messages[0]);
  return (
    <div className={cn('flex flex-col gap-1.5 rounded-xl border border-line bg-panel-2 p-3 transition hover:border-line-2', b.kind === 'auto' && 'opacity-85')}>
      <div className="flex items-center gap-2">
        <span className={cn('shrink-0 rounded px-1.5 py-px text-[10.5px] font-extrabold uppercase tracking-wide', KIND[b.kind].cls)}>{KIND[b.kind].label}</span>
        <b className="min-w-0 truncate" title={b.name}>
          {b.name}
        </b>
        <span className="flex-1" />
        {mc.v1 > 0 && <ModePill mode="v1">V1 ×{mc.v1}</ModePill>}
        {mc.v2 > 0 && <ModePill mode="v2">V2 ×{mc.v2}</ModePill>}
      </div>
      <div className="text-xs text-muted">
        {fmtDate(b.updatedAt || b.createdAt)} · {b.messages.length} mensaje(s){b.sentTo ? ` · → ${b.sentTo}` : ''}
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
        {b.kind === 'manual' ? (
          <IconButton title="Duplicar" onClick={() => create('manual', `${b.name} (copia)`, b.messages)}>
            <Copy />
          </IconButton>
        ) : (
          <IconButton title="Conservar como manual (no se borra automáticamente)" onClick={() => update(b.id, { kind: 'manual', pinned: true })}>
            <Pin />
          </IconButton>
        )}
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
  const { autoBackupMinutes, setAutoBackup } = useUi();
  const [kind, setKind] = useState<'all' | BackupKind>('all');
  const [mode, setMode] = useState<ModeFilter>('all');
  const [q, setQ] = useState('');

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: list.length };
    list.forEach((b) => (c[b.kind] = (c[b.kind] ?? 0) + 1));
    return c;
  }, [list]);

  const shown = list.filter((b) => {
    if (kind !== 'all' && b.kind !== kind) return false;
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
          <Database className="size-5 text-mode" /> Backups
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

      <div className="flex items-center justify-between gap-3">
        <span className="label">Backup automático</span>
        <SelectField
          className="w-40"
          value={autoBackupMinutes}
          onChange={setAutoBackup}
          options={[[0, 'Desactivado'], [1, 'Cada minuto'], [5, 'Cada 5 min'], [15, 'Cada 15 min'], [30, 'Cada 30 min']] as const}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Segmented
          value={kind}
          onChange={setKind}
          options={[
            ['all', `Todos ${counts.all ?? 0}`],
            ['manual', `Manual ${counts.manual ?? 0}`],
            ['auto', `Auto ${counts.auto ?? 0}`],
            ['sent', `Enviados ${counts.sent ?? 0}`],
            ['import', `Import. ${counts.import ?? 0}`],
          ]}
        />
        <div className="inline-flex w-fit gap-0.5 rounded-lg border border-line-2 bg-panel p-0.5">
          {(
            [
              ['all', 'Cualquier modo', 'bg-panel-3 text-fg'],
              ['v1', 'Solo V1', 'bg-v1 text-white'],
              ['v2', 'Solo V2', 'bg-v2 text-[#052513]'],
              ['mixed', 'Mixto', 'bg-gradient-to-r from-v1 to-v2 text-white'],
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

      <div className="flex flex-col gap-2">{shown.length ? shown.map((b) => <BackupItem key={b.id} b={b} />) : <Empty>No hay backups con este filtro.</Empty>}</div>
    </Sheet>
  );
}
