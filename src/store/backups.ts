import { toast } from 'sonner';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Backup, BackupKind, Message } from '@/lib/types';
import { clone, fmtDate, uid } from '@/lib/utils';
import { useWorkspace } from './workspace';

/** Huella de contenido (sin ids) para comparar espacios de trabajo. */
export const fingerprint = (messages: Message[]) =>
  JSON.stringify(messages, (k, v) => (k === '_id' || k === 'id' || k === 'lastSent' ? undefined : v));

export const modesOf = (messages: Message[]) => {
  const v1 = messages.filter((m) => m.mode === 'v1').length;
  return { v1, v2: messages.length - v1 };
};

/** Los backups solo se crean a mano (o al importarlos de un archivo). */
interface BackupsState {
  list: Backup[];
  create: (name?: string, messages?: Message[], kind?: BackupKind) => Backup;
  remove: (id: string) => void;
  update: (id: string, patch: Partial<Backup>) => void;
  addImported: (items: { name: string; messages: Message[]; createdAt?: number }[]) => void;
}

export const useBackups = create<BackupsState>()(
  persist(
    (set) => ({
      list: [],
      create: (name, messages = useWorkspace.getState().messages, kind = 'manual') => {
        const msgs = clone(messages);
        const b: Backup = { id: uid(), name: name || `Backup ${fmtDate(Date.now())}`, kind, createdAt: Date.now(), updatedAt: Date.now(), fp: fingerprint(msgs), messages: msgs };
        set((s) => ({ list: [b, ...s.list] }));
        return b;
      },
      remove: (id) => set((s) => ({ list: s.list.filter((b) => b.id !== id) })),
      update: (id, patch) =>
        set((s) => ({
          list: s.list.map((b) => (b.id === id ? { ...b, ...patch, updatedAt: Date.now(), fp: patch.messages ? fingerprint(patch.messages) : b.fp } : b)),
        })),
      addImported: (items) =>
        set((s) => ({
          list: [
            ...s.list,
            ...items.map((b) => ({
              id: uid(),
              name: b.name || 'Importado',
              kind: 'import' as const,
              createdAt: b.createdAt || Date.now(),
              updatedAt: Date.now(),
              fp: fingerprint(b.messages),
              messages: b.messages,
            })),
          ].sort((a, b) => b.createdAt - a.createdAt),
        })),
    }),
    {
      name: 'dualhook.backups',
      version: 2,
      // v1 -> v2: se eliminan los backups automáticos y «de envío» (ahora solo hay backups manuales)
      migrate: (persisted, version) => {
        const p = persisted as { list?: (Backup & { kind: string })[] } | undefined;
        if (version < 2 && p?.list) p.list = p.list.filter((b) => b.kind === 'manual' || b.kind === 'import');
        return p as BackupsState;
      },
      storage: {
        getItem: (k) => {
          const v = localStorage.getItem(k);
          return v ? JSON.parse(v) : null;
        },
        setItem: (k, v) => {
          try {
            localStorage.setItem(k, JSON.stringify(v));
          } catch {
            toast.error('Almacenamiento lleno: borra backups antiguos o expórtalos.');
          }
        },
        removeItem: (k) => localStorage.removeItem(k),
      },
    },
  ),
);
