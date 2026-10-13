import { ImageOff } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { CheckField, TextField } from '@/components/ui/fields';
import { editor } from '@/lib/edit';
import { useResolveMedia } from '@/components/preview/media';

interface MediaLike {
  media: { url: string };
  description: string;
  spoiler: boolean;
}

/** URL + texto alternativo + spoiler, con miniatura de vista previa. */
export function MediaFields<T extends MediaLike>({ value, onChange, messageId, actions }: { value: T; onChange: (v: T) => void; messageId: string; actions?: ReactNode }) {
  const set = editor(value, onChange);
  const src = useResolveMedia(messageId, value.media.url);
  const [broken, setBroken] = useState<string | null>(null);
  return (
    <div className="flex gap-2.5 rounded-lg border border-line bg-panel p-2">
      <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-md bg-panel-3 text-muted">
        {src && broken !== src ? <img src={src} alt="" className="size-full object-cover" onError={() => setBroken(src)} /> : <ImageOff className="size-5" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <TextField label="URL" required placeholder="https://… o attachment://archivo.png" list={`att-${messageId}`} value={value.media.url} onChange={(v) => set((d) => void (d.media.url = v))} />
        <div className="flex items-end gap-3">
          <TextField className="flex-1" label="Texto alternativo" max={1024} value={value.description} onChange={(v) => set((d) => void (d.description = v))} />
          <CheckField className="pb-2" label="Spoiler" checked={value.spoiler} onChange={(v) => set((d) => void (d.spoiler = v))} />
        </div>
        {actions && <div className="flex justify-end">{actions}</div>}
      </div>
    </div>
  );
}
