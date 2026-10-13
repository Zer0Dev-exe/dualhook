import { toast } from 'sonner';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Backup, BackupKind, Message } from '@/lib/types';
import { clone, fmtDate, uid } from '@/lib/utils';
import { useWorkspace } from './workspace';

const MAX_PER_KIND: Partial<Record<BackupKind, number>> = { auto: 25, sent: 60 };

/** Huella de contenido (sin ids) para no duplicar backups idénticos. */
export const fingerprint = (messages: Message[]) =>
  JSON.stringify(messages, (k, v) => (k === '_id' || k === 'id' || k === 'lastSent' ? undefined : v));

export const modesOf = (messages: Message[]) => {
  const v1 = messages.filter((m) => m.mode === 'v1').length;
  return { v1, v2: messages.length - v1 };
};

interface BackupsState {
  list: Backup[];
  create: (kind: BackupKind, name?: string, messages?: Message[], extra?: Partial<Backup>) => Backup;
  /** Crea un backup automático solo si el contenido actual no está ya guardado. */
  autoIfChanged: (reason?: string) => Backup | null;
  remove: (id: string) => void;
  update: (id: string, patch: Partial<Backup>) => void;
  addImported: (items: { name: string; messages: Message[]; kind?: string; createdAt?: number }[]) => void;
}

function prune(list: Backup[]) {
  const counts: Partial<Record<BackupKind, number>> = {};
  return list.filter((b) => {
    const max = MAX_PER_KIND[b.kind];
    if (!max || b.pinned) return true;
    counts[b.kind] = (counts[b.kind] ?? 0) + 1;
    return counts[b.kind]! <= max;
  });
}

export const useBackups = create<BackupsState>()(
  persist(
    (set, get) => ({
      list: [],
      create: (kind, name, messages = useWorkspace.getState().messages, extra = {}) => {
        const msgs = clone(messages);
        const b: Backup = {
          id: uid(),
          name: name || `Backup ${fmtDate(Date.now())}`,
          kind,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          fp: fingerprint(msgs),
          messages: msgs,
          ...extra,
        };
        set((s) => ({ list: prune([b, ...s.list]) }));
        return b;
      },
      autoIfChanged: (reason) => {
        const msgs = useWorkspace.getState().messages;
        const fp = fingerprint(msgs);
        if (get().list.some((b) => b.fp === fp)) return null;
        return get().create('auto', reason || `Auto · ${fmtDate(Date.now())}`);
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
              kind: (b.kind as BackupKind) || 'import',
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
      version: 1,
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
