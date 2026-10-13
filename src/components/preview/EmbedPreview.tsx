import { isEmbedEmpty } from '@/lib/payload';
import type { Embed, EmbedField } from '@/lib/types';
import { Markdown, Media } from './primitives';

/** Agrupa campos en filas como Discord: hasta 3 «en línea» por fila (2 si hay miniatura). */
function fieldRows(fields: EmbedField[], hasThumb: boolean) {
  const rows: { inline: boolean; items: EmbedField[] }[] = [];
  const max = hasThumb ? 2 : 3;
  for (const f of fields) {
    const cur = rows[rows.length - 1];
    if (f.inline && cur?.inline && cur.items.length < max) cur.items.push(f);
    else rows.push({ inline: f.inline, items: [f] });
  }
  return rows;
}

export function EmbedPreview({ e, files }: { e: Embed; files: readonly File[] }) {
  if (isEmbedEmpty(e)) return null;
  const footer = [e.footer.text, e.timestamp && new Date(e.timestamp).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })].filter(Boolean).join(' • ');
  const title = e.title && <Markdown text={e.title} className="text-base font-semibold text-[#f2f3f5]" />;
  return (
    <div className="grid max-w-[520px] gap-2 rounded border-l-4 bg-dc-embed py-2 pl-3 pr-4 pb-4 text-sm" style={{ borderLeftColor: e.color || '#1e1f22' }}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4">
        <div className="flex min-w-0 flex-col gap-2 pt-1">
          {e.author.name && (
            <div className="flex items-center gap-2 font-semibold text-[#f2f3f5]">
              {e.author.icon_url && <Media url={e.author.icon_url} files={files} className="size-6 rounded-full object-cover" />}
              {e.author.url ? (
                <a href={e.author.url} target="_blank" rel="noreferrer" className="hover:underline">
                  {e.author.name}
                </a>
              ) : (
                <span>{e.author.name}</span>
              )}
            </div>
          )}
          {title &&
            (e.url ? (
              <a href={e.url} target="_blank" rel="noreferrer" className="[&_.md]:text-dc-link hover:underline">
                {title}
              </a>
            ) : (
              title
            ))}
          {e.description && <Markdown text={e.description} />}
          {e.fields.length > 0 && (
            <div className="flex flex-col gap-2">
              {fieldRows(e.fields, !!e.thumbnail).map((r, i) => (
                <div key={i} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${r.items.length}, minmax(0,1fr))` }}>
                  {r.items.map((f) => (
                    <div key={f._id}>
                      <Markdown text={f.name} className="mb-0.5 font-semibold text-[#f2f3f5]" />
                      <Markdown text={f.value} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        {e.thumbnail && <Media url={e.thumbnail} files={files} className="mt-1 size-20 rounded object-contain" />}
      </div>
      {e.image && <Media url={e.image} files={files} className="max-h-[300px] max-w-full justify-self-start rounded object-contain" />}
      {footer && (
        <div className="flex items-center gap-2 text-xs text-dc-muted">
          {e.footer.icon_url && e.footer.text && <Media url={e.footer.icon_url} files={files} className="size-5 rounded-full" />}
          <span>{footer}</span>
        </div>
      )}
    </div>
  );
}
