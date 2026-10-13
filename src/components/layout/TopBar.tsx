import { Database, Download, Pencil, Plus, Share2, Sparkles, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import { ModePill } from '@/components/ui/card';
import { LIMITS } from '@/lib/factory';
import { cn } from '@/lib/utils';
import { importFromFile, removeMessage } from '@/store/actions';
import { useWorkspace } from '@/store/workspace';

export type DialogName = 'backups' | 'export' | 'share' | 'templates';

function MessageTabs() {
  const { messages, active, setActive, addMessage } = useWorkspace();
  const full = messages.length >= LIMITS.common.messages;
  return (
    <nav className="order-last flex min-w-0 basis-full gap-1.5 overflow-x-auto p-0.5 md:order-none md:flex-1 md:basis-auto">
      {messages.map((m, i) => {
        const on = i === active;
        const isV1 = m.mode === 'v1';
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => setActive(i)}
            title={isV1 ? 'Mensaje clásico (V1)' : 'Mensaje Components V2'}
            className={cn(
              'group flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-panel-2 px-2.5 py-1 text-muted transition hover:text-fg',
              on && 'bg-panel-3 text-fg',
              on && 'border-line-2',
            )}
          >
            <ModePill mode={m.mode} className="text-[10px]" />
            <span>Mensaje {i + 1}</span>
            {m.editMessageId && <Pencil className="size-3 text-amber-400" />}
            {messages.length > 1 && (
              <X
                className="size-3.5 opacity-40 hover:text-red-400 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  removeMessage(i);
                }}
              />
            )}
          </button>
        );
      })}
      <button type="button" disabled={full} onClick={() => addMessage('v1')} className="flex shrink-0 items-center gap-0.5 rounded-lg border border-dashed border-line-2 px-2 text-xs font-semibold text-muted hover:text-fg disabled:opacity-40">
        <Plus className="size-3" /> V1
      </button>
      <button type="button" disabled={full} onClick={() => addMessage('v2')} className="flex shrink-0 items-center gap-0.5 rounded-lg border border-dashed border-line-2 px-2 text-xs font-semibold text-muted hover:text-fg disabled:opacity-40">
        <Plus className="size-3" /> V2
      </button>
    </nav>
  );
}

export function TopBar({ onOpen }: { onOpen: (d: DialogName) => void }) {
  return (
    <header className="flex min-h-[52px] shrink-0 flex-wrap items-center justify-between gap-x-3.5 gap-y-2 border-b border-line bg-panel px-3.5 py-2">
      <div className="flex items-center gap-2 text-base font-bold tracking-tight">
        <Logo />
        <span className="hidden sm:inline">Dualhook</span>
      </div>
      <MessageTabs />
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="sm" onClick={() => onOpen('templates')}>
          <Sparkles /> <span className="hidden lg:inline">Plantillas</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={importFromFile} title="Importar JSON (Dualhook, Discohook o payload)">
          <Upload /> <span className="hidden lg:inline">Importar</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onOpen('export')}>
          <Download /> <span className="hidden lg:inline">Exportar</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onOpen('share')}>
          <Share2 /> <span className="hidden lg:inline">Compartir</span>
        </Button>
        <Button size="sm" className="ml-1" onClick={() => onOpen('backups')} title="Backups (Ctrl+S guarda uno)">
          <Database /> Backups
        </Button>
      </div>
    </header>
  );
}
