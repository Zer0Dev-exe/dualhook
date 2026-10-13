import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useActiveTarget } from '@/store/targets';
import { useMessageFiles } from '@/store/ui';
import { useWorkspace } from '@/store/workspace';
import { EmbedPreview } from './EmbedPreview';
import { isImageName } from './media';
import { DiscordActionRow, FileBox, Markdown, Media } from './primitives';
import { V2Node } from './V2Preview';

const DEFAULT_AVATAR = 'https://cdn.discordapp.com/embed/avatars/0.png';

function V1Body({ m, files }: { m: Message; files: readonly File[] }) {
  const d = m.v1;
  const used = JSON.stringify(d.embeds);
  const loose = files.filter((f) => !used.includes(`attachment://${f.name}`));
  const empty = !d.content && !d.embeds.length && !loose.length && !d.components.length;
  return (
    <>
      {d.content && <Markdown text={d.content} />}
      {d.embeds.length > 0 && (
        <div className="mt-0.5 flex flex-col gap-1">
          {d.embeds.map((e) => (
            <EmbedPreview key={e._id} e={e} files={files} />
          ))}
        </div>
      )}
      {loose.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {loose.map((f) => (isImageName(f.name) ? <Media key={f.name} url={`attachment://${f.name}`} files={files} className="max-h-[300px] max-w-[360px] rounded-lg" /> : <FileBox key={f.name} name={f.name} file={f} />))}
        </div>
      )}
      {d.components.length > 0 && (
        <div className="mt-1 flex flex-col gap-1.5">
          {d.components.map((r) => (
            <DiscordActionRow key={r._id} row={r} />
          ))}
        </div>
      )}
      {empty && <div className="italic text-dc-muted">Mensaje V1 vacío</div>}
    </>
  );
}

function DiscordMessage({ m, index, active }: { m: Message; index: number; active: boolean }) {
  const files = useMessageFiles(m.id);
  const target = useActiveTarget();
  const setActive = useWorkspace((s) => s.setActive);
  const name = m.username || target.info?.name || 'Webhook';
  const avatar = m.avatar_url || target.info?.avatarUrl || DEFAULT_AVATAR;
  const isV1 = m.mode === 'v1';
  return (
    <div
      onClick={(e) => !(e.target as HTMLElement).closest('a, button') && !active && setActive(index)}
      className={cn(
        'relative mb-2.5 grid cursor-pointer grid-cols-[40px_1fr] gap-x-3.5 rounded-lg border border-transparent px-4 pb-2.5 pt-6 hover:bg-dc-hover',
        active && 'bg-dc-hover',
        active && 'border-white/10',
      )}
    >
      <span
        className={cn(
          'absolute right-2.5 top-1.5 text-[10px] font-semibold uppercase tracking-wider text-dc-muted',
          !active && 'opacity-60',
        )}
      >
        {isV1 ? 'V1 · Clásico' : 'V2 · Components'}
        {m.editMessageId && ' · editando'}
      </span>
      <img className="mt-0.5 size-10 rounded-full object-cover" src={avatar} alt="" onError={(e) => ((e.target as HTMLImageElement).src = DEFAULT_AVATAR)} />
      <div className="min-w-0">
        <div className="mb-0.5 flex items-center gap-1.5">
          <span className="font-semibold text-[#f2f3f5]">{name}</span>
          <span className="rounded-[3px] bg-dc-blurple px-[4.5px] text-[10px] font-bold leading-[15px] text-white">APP</span>
          <span className="ml-0.5 text-xs text-dc-muted">Hoy a las {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex flex-col gap-1">
          {isV1 ? (
            <V1Body m={m} files={files} />
          ) : m.v2.components.length ? (
            <div className="flex max-w-[560px] flex-col gap-2">
              {m.v2.components.map((c) => (
                <V2Node key={c._id} c={c} files={files} />
              ))}
            </div>
          ) : (
            <div className="italic text-dc-muted">Mensaje V2 vacío</div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Vista previa de todos los mensajes del espacio de trabajo, con aspecto de Discord. */
export function Preview() {
  const messages = useWorkspace((s) => s.messages);
  const active = useWorkspace((s) => s.active);
  return (
    <div
      className="flex-1 overflow-y-auto px-2 pb-10 pt-4 text-[15px] leading-[1.375] text-dc-text"
      onClick={(e) => (e.target as HTMLElement).closest('.md-spoiler')?.classList.add('shown')}
    >
      {messages.map((m, i) => (
        <DiscordMessage key={m.id} m={m} index={i} active={i === active} />
      ))}
    </div>
  );
}
