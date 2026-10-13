import { CircleCheck, CircleX, Eye, EyeOff, Loader2, Plus, Trash2, Webhook } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button, IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/fields';
import { discord, parseWebhookUrl } from '@/lib/discord';
import { cn } from '@/lib/utils';
import { confirmDialog } from '@/store/dialogs';
import { useActiveTarget, useTargets } from '@/store/targets';

/** Webhook de destino: guardados, URL, comprobación. */
export function TargetCard() {
  const { list, select, add, remove, update } = useTargets();
  const t = useActiveTarget();
  const [show, setShow] = useState(false);
  const [checking, setChecking] = useState(false);
  const valid = !!parseWebhookUrl(t.url);

  const check = async () => {
    setChecking(true);
    try {
      const info = await discord.getWebhook(t.url);
      update(t.id, (d) => {
        d.info = info;
        if (!d.name) d.name = info.name;
      });
      toast.success(`Webhook OK: ${info.name}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card id="target" icon={<Webhook />} title="Webhook destino" summary={t.info?.name ?? (t.url ? '' : 'sin configurar')}>
      <div className="flex items-center gap-1.5">
        <select className="input cursor-pointer" value={t.id} onChange={(e) => select(e.target.value)}>
          {list.map((x, i) => (
            <option key={x.id} value={x.id}>
              {x.name || x.info?.name || `Webhook ${i + 1}`}
            </option>
          ))}
        </select>
        <Button size="sm" onClick={() => add()}>
          <Plus /> Nuevo
        </Button>
        <IconButton
          danger
          title="Olvidar este webhook"
          onClick={async () => (await confirmDialog('¿Olvidar este webhook guardado? (no se borra en Discord)', { ok: 'Olvidar', danger: true })) && remove(t.id)}
        >
          <Trash2 />
        </IconButton>
      </div>

      <TextField
        label={
          <>
            URL del webhook{' '}
            {t.url && (
              <span className={cn('ml-1 inline-flex items-center gap-1 normal-case', valid ? 'text-emerald-400' : 'text-red-400')}>
                {valid ? <CircleCheck className="size-3" /> : <CircleX className="size-3" />}
                {valid ? 'formato válido' : 'URL no válida'}
              </span>
            )}
          </>
        }
        type={show ? 'text' : 'password'}
        mono
        placeholder="https://discord.com/api/webhooks/…"
        value={t.url}
        onChange={(v) =>
          update(t.id, (d) => {
            d.url = v.trim();
            d.info = null;
          })
        }
        suffix={
          <>
            <IconButton title={show ? 'Ocultar' : 'Mostrar'} onClick={() => setShow(!show)}>
              {show ? <EyeOff /> : <Eye />}
            </IconButton>
            <Button size="sm" disabled={!valid || checking} onClick={check}>
              {checking && <Loader2 className="animate-spin" />}
              Comprobar
            </Button>
          </>
        }
      />
      <TextField label="Nombre (solo para ti)" placeholder="p. ej. #anuncios de Mi Server" value={t.name} onChange={(v) => update(t.id, (d) => void (d.name = v))} />

      {t.info && (
        <div className="flex items-center gap-2.5 rounded-lg border border-line bg-panel-2 p-2">
          <img className="size-9 rounded-full" src={t.info.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt="" />
          <div className="min-w-0">
            <b>{t.info.name}</b>
            <div className="text-xs text-muted">
              Canal {t.info.channel_id} · {t.info.application_id ? 'webhook de aplicación (admite botones interactivos)' : 'webhook normal (solo botones de enlace)'}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
