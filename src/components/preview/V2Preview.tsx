import type { ContainerChild, MediaGallery, TopLevelComponent } from '@/lib/types';
import { cn } from '@/lib/utils';
import { DiscordActionRow, DiscordButton, FileBox, Markdown, Media, Spoiler } from './primitives';

/** Distribución de la galería según el nº de elementos (aprox. a la de Discord). */
const GALLERY_LAYOUT: Record<number, { grid: string; item?: (i: number) => string }> = {
  1: { grid: 'grid-cols-1' },
  2: { grid: 'grid-cols-2 auto-rows-[200px]' },
  3: { grid: 'grid-cols-[2fr_1fr] grid-rows-[130px_130px]', item: (i) => (i === 0 ? 'row-span-2' : '') },
  4: { grid: 'grid-cols-2 auto-rows-[150px]' },
  5: { grid: 'grid-cols-6 auto-rows-[120px]', item: (i) => (i < 2 ? 'col-span-3' : 'col-span-2') },
};

function Gallery({ g, files }: { g: MediaGallery; files: readonly File[] }) {
  const n = g.items.length;
  const layout = GALLERY_LAYOUT[n] ?? { grid: 'grid-cols-3 auto-rows-[120px]', item: (i: number) => (n % 3 === 1 && i === 0 ? 'col-span-3' : '') };
  return (
    <div className={cn('grid max-w-[520px] gap-1 overflow-hidden rounded-lg', layout.grid)}>
      {g.items.map((it, i) => (
        <Spoiler key={it._id} active={it.spoiler} className={cn('bg-dc-dark', layout.item?.(i))}>
          <Media url={it.media.url} files={files} alt={it.description} className={cn('block w-full object-cover', n === 1 ? 'max-h-[350px] object-contain' : 'h-full')} />
        </Spoiler>
      ))}
    </div>
  );
}

export function V2Node({ c, files, inContainer }: { c: TopLevelComponent | ContainerChild; files: readonly File[]; inContainer?: boolean }) {
  switch (c.type) {
    case 10:
      return <Markdown text={c.content} className="text-[15px]" />;
    case 9: {
      const acc = c.accessory;
      return (
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {c.components.map((t) => (
              <Markdown key={t._id} text={t.content} className="text-[15px]" />
            ))}
          </div>
          <div className="shrink-0">
            {acc.type === 11 ? (
              <Spoiler active={acc.spoiler} className="size-[85px] rounded-lg">
                <Media url={acc.media.url} files={files} alt={acc.description} className="size-[85px] object-cover" />
              </Spoiler>
            ) : (
              <DiscordButton b={acc} />
            )}
          </div>
        </div>
      );
    }
    case 12:
      return <Gallery g={c} files={files} />;
    case 13: {
      const name = c.file.url.replace('attachment://', '');
      return (
        <Spoiler active={c.spoiler} className="max-w-[432px] rounded-lg">
          <FileBox name={name} file={files.find((f) => f.name === name)} inContainer={inContainer} />
        </Spoiler>
      );
    }
    case 14:
      return <div className={cn('flex items-center', c.spacing === 2 ? 'min-h-6' : 'min-h-2')}>{c.divider && <hr className="w-full border-0 border-t border-dc-grey" />}</div>;
    case 17:
      return (
        <Spoiler active={c.spoiler} className="rounded-lg">
          <div
            className={cn('flex flex-col gap-2 rounded-lg border border-dc-border bg-dc-embed p-4', c.accent_color && 'border-l-4')}
            style={c.accent_color ? { borderLeftColor: c.accent_color } : undefined}
          >
            {c.components.map((x) => (
              <V2Node key={x._id} c={x} files={files} inContainer />
            ))}
          </div>
        </Spoiler>
      );
    case 1:
      return <DiscordActionRow row={c} />;
  }
}
