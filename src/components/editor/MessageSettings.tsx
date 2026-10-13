import { Download, Images, Loader2, Paperclip, PencilLine, Settings2, Trash2, User, File as FileIcon, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button, IconButton } from '@/components/ui/button';
import { Card, ModePill, Tag } from '@/components/ui/card';
import { CheckField, TextField } from '@/components/ui/fields';
import { parseMessageId } from '@/lib/discord';
import { LIMITS, make } from '@/lib/factory';
import type { Message } from '@/lib/types';
import { fmtDate, fmtSize, pickFiles } from '@/lib/utils';
import { deleteFromDiscord, loadFromDiscord } from '@/store/actions';
import { useFiles, useMessageFiles } from '@/store/ui';
import { useWorkspace } from '@/store/workspace';

const useUpdate = () => useWorkspace((s) => s.updateActive);

export function ProfileCard({ message: m }: { message: Message }) {
  const update = useUpdate();
  return (
    <Card id={`profile-${m.id}`} icon={<User />} title="Perfil" summary={m.username}>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <TextField label="Nombre" max={LIMITS.common.username} placeholder="Por defecto: el del webhook" value={m.username} onChange={(v) => update((d) => void (d.username = v))} />
        <TextField label="URL del avatar" placeholder="https://…png" value={m.avatar_url} onChange={(v) => update((d) => void (d.avatar_url = v))} />
      </div>
    </Card>
  );
}

export function FilesCard({ message: m }: { message: Message }) {
  const files = useMessageFiles(m.id);
  const { add, remove } = useFiles();
  const update = useUpdate();
  const total = files.reduce((n, f) => n + f.size, 0);
  const copyRef = (name: string) => navigator.clipboard.writeText(`attachment://${name}`).then(() => toast.success('Referencia copiada'));
  return (
    <Card id={`files-${m.id}`} icon={<Paperclip />} title="Archivos adjuntos" tag={files.length ? <Tag>{files.length} · {fmtSize(total)}</Tag> : null}>
      {files.map((f, i) => (
        <div key={f.name} className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-panel-2 px-2.5 py-1.5">
          <span className="max-w-[220px] truncate font-semibold">{f.name}</span>
          <span className="text-xs text-muted">{fmtSize(f.size)}</span>
          <span className="flex-1" />
          <Button size="sm" title="Copiar referencia" onClick={() => copyRef(f.name)}>
            <Copy /> attachment://
          </Button>
          {m.mode === 'v2' && /\.(png|jpe?g|gif|webp)$/i.test(f.name) && (
            <Button size="sm" onClick={() => update((d) => void d.v2.components.push(make.gallery([`attachment://${f.name}`])))}>
              <Images /> Galería
            </Button>
          )}
          {m.mode === 'v2' && (
            <Button size="sm" onClick={() => update((d) => void d.v2.components.push(make.file(`attachment://${f.name}`)))}>
              <FileIcon /> Archivo
            </Button>
          )}
          <IconButton danger onClick={() => remove(m.id, i)}>
            <Trash2 />
          </IconButton>
        </div>
      ))}
      <div>
        <Button size="sm" onClick={async () => add(m.id, await pickFiles('', true))}>
          <Paperclip /> Adjuntar archivos
        </Button>
      </div>
      <p className="text-xs text-muted">Los archivos solo viven en esta sesión: no se guardan en backups ni enlaces (sí su referencia attachment://).</p>
    </Card>
  );
}

export function OptionsCard({ message: m }: { message: Message }) {
  const update = useUpdate();
  return (
    <Card id={`options-${m.id}`} icon={<Settings2 />} title="Opciones">
      <div className="grid gap-2.5 sm:grid-cols-2">
        <TextField label="Crear post de foro (título)" max={100} placeholder="Solo canales de foro/multimedia" value={m.thread_name} onChange={(v) => update((d) => void (d.thread_name = v))} />
        <TextField label="Enviar a hilo existente (ID)" mono placeholder="123456789012345678" value={m.thread_id} onChange={(v) => update((d) => void (d.thread_id = v))} />
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {m.mode === 'v1' && <CheckField label="Ocultar embeds de enlaces (SUPPRESS_EMBEDS)" checked={m.suppressEmbeds} onChange={(v) => update((d) => void (d.suppressEmbeds = v))} />}
        <CheckField label="Mensaje silencioso (@silent)" checked={m.suppressNotifications} onChange={(v) => update((d) => void (d.suppressNotifications = v))} />
      </div>
    </Card>
  );
}

export function EditCard({ message: m }: { message: Message }) {
  const update = useUpdate();
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const ls = m.lastSent;
  const editingId = parseMessageId(m.editMessageId)?.messageId;
  return (
    <Card
      id={`edit-${m.id}`}
      className={m.editMessageId ? 'border-amber-400/70 shadow-[0_0_0_1px] shadow-amber-400/20' : ''}
      icon={<PencilLine />}
      title="Editar mensaje existente"
      summary={m.editMessageId ? 'modo edición' : ''}
    >
      <TextField
        label="Enlace o ID del mensaje (enviado por este webhook)"
        mono
        placeholder="https://discord.com/channels/…/…/…"
        value={m.editMessageId}
        onChange={(v) => update((d) => void (d.editMessageId = v))}
      />
      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="sm" disabled={!m.editMessageId || busy} onClick={() => run(loadFromDiscord)}>
          {busy ? <Loader2 className="animate-spin" /> : <Download />} Cargar desde Discord
        </Button>
        <Button size="sm" disabled={!m.editMessageId} onClick={() => update((d) => void (d.editMessageId = ''))}>
          Dejar de editar
        </Button>
        <span className="flex-1" />
        <Button size="sm" variant="danger" disabled={!m.editMessageId || busy} onClick={() => run(deleteFromDiscord)}>
          <Trash2 /> Borrar en Discord
        </Button>
      </div>
      {ls && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-panel-2 px-2.5 py-1.5 text-[12.5px]">
          <span className="flex items-center gap-1.5">
            Último envío {fmtDate(ls.at)} · <ModePill mode={ls.mode} /> · ID <code className="font-mono">{ls.messageId}</code>
          </span>
          {ls.messageId !== editingId && (
            <Button size="sm" onClick={() => update((d) => void (d.editMessageId = ls.messageId))}>
              Editar ese mensaje
            </Button>
          )}
        </div>
      )}
      <p className="text-xs text-muted">Un mensaje V1 se puede convertir a V2 al editarlo, pero uno V2 no puede volver a V1.</p>
    </Card>
  );
}
