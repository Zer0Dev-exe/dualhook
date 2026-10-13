import { CircleCheck, CircleX, Eye, EyeOff, Loader2, Plus, RefreshCw, Trash2, Webhook } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button, IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/fields';
import { discord, parseWebhookUrl } from '@/lib/discord';
import { cn } from '@/lib/utils';
import { confirmDialog } from '@/store/dialogs';
import { useActiveTarget, useTargets } from '@/store/targets';

const firstLine = (e: unknown) => (e as Error).message.split(/\r?\n/)[0];

/** Webhook de destino: guardados, URL, comprobación. */
export function TargetCard() {
  const { list, select, add, remove, update } = useTargets();
  const t = useActiveTarget();
  const [show, setShow] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const valid = !!parseWebhookUrl(t.url);

  const fetchInfo = async (url: string) => {
    const info = await discord.getWebhook(url);
    update(t.id, (d) => {
      d.info = info;
      if (!d.name) d.name = info.name;
    });
    setError('');
    return info;
  };

  // Al pegar una URL válida se consulta el webhook automáticamente (nombre, avatar, canal)
  useEffect(() => {
    setError('');
    if (!valid || t.info) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const info = await discord.getWebhook(t.url);
        if (cancelled) return;
        update(t.id, (d) => {
          d.info = info;
          if (!d.name) d.name = info.name;
        });
      } catch (e) {
        if (!cancelled) setError(firstLine(e));
      } finally {
        if (!cancelled) setChecking(false);
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      setChecking(false);
    };
  }, [t.id, t.url, t.info, valid, update]);

  // Volver a consultar (por si el webhook se renombró o cambió de avatar en Discord)
  const refresh = async () => {
    setChecking(true);
    try {
      const info = await fetchInfo(t.url);
      toast.success(`Webhook actualizado: ${info.name}`);
    } catch (e) {
      setError(firstLine(e));
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
            <Button size="sm" disabled={!valid || checking} onClick={refresh} title="Volver a leer nombre y avatar del webhook">
              {checking ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              Actualizar
            </Button>
          </>
        }
      />
      {error && (
        <p className="-mt-1 flex items-center gap-1.5 text-xs text-red-300">
          <CircleX className="size-3.5 shrink-0" /> {error}
        </p>
      )}
      {checking && !t.info && (
        <p className="-mt-1 flex items-center gap-1.5 text-xs text-muted">
          <Loader2 className="size-3.5 animate-spin" /> Leyendo el webhook…
        </p>
      )}
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
