import { ExternalLink, FileText, TriangleAlert } from 'lucide-react';
import { memo, useMemo, useState, type ReactNode } from 'react';
import { renderMarkdown } from '@/lib/markdown';
import { parseEmoji } from '@/lib/payload';
import type { ActionRow, ButtonComponent } from '@/lib/types';
import { cn, fmtSize } from '@/lib/utils';
import { isVideoName, resolveMedia } from './media';

export const Markdown = memo(function Markdown({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => renderMarkdown(text), [text]);
  return <div className={cn('md', className)} dangerouslySetInnerHTML={{ __html: html }} />;
});

export function Media({ url, files, className, alt }: { url: string; files: readonly File[]; className?: string; alt?: string }) {
  const src = resolveMedia(files, url);
  const [broken, setBroken] = useState<string | null>(null);
  if (!src || broken === src)
    return (
      <div className={cn('flex items-center gap-1.5 rounded-md border border-dashed border-dc-grey bg-dc-embed p-2.5 text-xs text-amber-300', className)}>
        <TriangleAlert className="size-3.5 shrink-0" />
        <span className="truncate">{url || 'sin URL'}</span>
      </div>
    );
  if (isVideoName(url.split('?')[0])) return <video className={className} src={src} muted controls />;
  return <img className={className} src={src} alt={alt ?? ''} loading="lazy" onError={() => setBroken(src)} />;
}

/** Contenido tapado hasta hacer clic (spoiler). */
export function Spoiler({ active, children, className }: { active: boolean; children: ReactNode; className?: string }) {
  const [shown, setShown] = useState(false);
  const hidden = active && !shown;
  return (
    <div className={cn('relative overflow-hidden', className)} onClick={(e) => hidden && (e.stopPropagation(), setShown(true))}>
      <div className={cn(hidden && 'pointer-events-none blur-2xl')}>{children}</div>
      {hidden && (
        <span className="absolute inset-0 m-auto h-fit w-fit cursor-pointer rounded-full bg-black/60 px-3 py-1 text-xs font-bold tracking-wide text-white">SPOILER</span>
      )}
    </div>
  );
}

const BTN_STYLE: Record<number, string> = {
  1: 'bg-dc-blurple hover:bg-[#4752c4]',
  2: 'bg-dc-grey hover:bg-[#6d6f78]',
  3: 'bg-dc-green hover:bg-[#1a6334]',
  4: 'bg-dc-red hover:bg-[#a12828]',
  5: 'bg-dc-grey hover:bg-[#6d6f78]',
};

export function DiscordButton({ b }: { b: ButtonComponent }) {
  const em = parseEmoji(b.emoji);
  return (
    <button
      type="button"
      title={b.style === 5 ? b.url : b.custom_id}
      className={cn('inline-flex h-8 min-w-[60px] items-center justify-center gap-1.5 rounded-lg px-3.5 text-sm font-medium text-white transition-colors', BTN_STYLE[b.style], b.disabled && 'cursor-not-allowed opacity-50')}
      onClick={(e) => {
        e.stopPropagation();
        if (b.style === 5 && b.url && !b.disabled) window.open(b.url, '_blank', 'noopener');
      }}
    >
      {em && (em.id ? <img className="size-[18px]" src={`https://cdn.discordapp.com/emojis/${em.id}.${em.animated ? 'gif' : 'webp'}?size=44`} alt="" /> : <span className="text-base">{em.name}</span>)}
      {b.label && <span>{b.label}</span>}
      {b.style === 5 && <ExternalLink className="size-4" />}
    </button>
  );
}

export const DiscordActionRow = ({ row }: { row: ActionRow }) => (
  <div className="flex flex-wrap gap-2">
    {row.components.map((b) => (
      <DiscordButton key={b._id} b={b} />
    ))}
  </div>
);

export function FileBox({ name, file, inContainer }: { name: string; file?: File; inContainer?: boolean }) {
  return (
    <div className={cn('flex max-w-[432px] items-center gap-2.5 rounded-lg border border-dc-dark px-3.5 py-3', inContainer ? 'bg-[#232428]' : 'bg-dc-embed')}>
      <FileText className="size-7 shrink-0 text-dc-muted" />
      <div className="min-w-0">
        <div className="truncate font-medium text-dc-link">{name || 'archivo'}</div>
        <div className="text-xs text-dc-muted">{file ? fmtSize(file.size) : 'no adjuntado'}</div>
      </div>
    </div>
  );
}
