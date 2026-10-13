import * as D from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { IconButton } from './button';

interface ModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

export function Modal({ open, onOpenChange, title, description, children, footer, wide }: ModalProps) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 animate-fade-in bg-black/60 backdrop-blur-[2px]" />
        <D.Content
          // Enfoca el primer campo de texto (p. ej. en prompts) en vez del botón de cerrar
          onOpenAutoFocus={(e) => {
            const field = (e.currentTarget as HTMLElement).querySelector<HTMLInputElement>('input:not([type=checkbox]), textarea:not([readonly])');
            if (!field) return;
            e.preventDefault();
            field.focus();
            field.select();
          }}
          className={cn(
            'fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100%-32px)] -translate-x-1/2 -translate-y-1/2 animate-zoom-in flex-col rounded-2xl border border-line-2 bg-panel shadow-2xl outline-none',
            wide ? 'max-w-3xl' : 'max-w-md',
          )}
        >
          <div className="flex items-start justify-between gap-4 px-5 pb-1 pt-4">
            <div>
              <D.Title className="text-base font-semibold">{title}</D.Title>
              {description ? <D.Description className="mt-0.5 text-[13px] text-muted">{description}</D.Description> : <D.Description className="sr-only">{title}</D.Description>}
            </div>
            <D.Close asChild>
              <IconButton aria-label="Cerrar">
                <X />
              </IconButton>
            </D.Close>
          </div>
          <div className="overflow-auto px-5 py-3">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

/** Panel lateral (drawer) a la derecha. */
export function Sheet({ open, onOpenChange, title, children, headerExtra }: { open: boolean; onOpenChange: (v: boolean) => void; title: ReactNode; children: ReactNode; headerExtra?: ReactNode }) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 animate-fade-in bg-black/50" />
        <D.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[540px] animate-slide-in flex-col gap-3 overflow-y-auto border-l border-line bg-panel p-4 shadow-2xl outline-none">
          <div className="flex items-center gap-3">
            <D.Title className="flex items-center gap-2 text-lg font-semibold">{title}</D.Title>
            <D.Description className="sr-only">Panel lateral</D.Description>
            {headerExtra}
            <span className="flex-1" />
            <D.Close asChild>
              <IconButton aria-label="Cerrar">
                <X />
              </IconButton>
            </D.Close>
          </div>
          {children}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
