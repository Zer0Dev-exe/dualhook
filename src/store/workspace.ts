import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { LIMITS, make, normalizeMessage, welcomeMessage } from '@/lib/factory';
import type { Message, Mode } from '@/lib/types';

interface WorkspaceState {
  messages: Message[];
  active: number;
  setActive: (i: number) => void;
  addMessage: (mode: Mode) => void;
  removeMessage: (i: number) => void;
  /** Muta el mensaje activo con una receta de Immer. */
  updateActive: (recipe: (m: Message) => void) => void;
  updateMessage: (i: number, recipe: (m: Message) => void) => void;
  replaceAll: (messages: Message[], active?: number) => void;
  append: (messages: Message[]) => void;
}

export const useWorkspace = create<WorkspaceState>()(
  persist(
    immer((set) => ({
      messages: [welcomeMessage()],
      active: 0,
      setActive: (i) => set((s) => void (s.active = i)),
      addMessage: (mode) =>
        set((s) => {
          if (s.messages.length >= LIMITS.common.messages) return;
          s.messages.push(make.message(mode));
          s.active = s.messages.length - 1;
        }),
      removeMessage: (i) =>
        set((s) => {
          s.messages.splice(i, 1);
          if (!s.messages.length) s.messages.push(make.message('v2'));
          s.active = Math.min(s.active, s.messages.length - 1);
        }),
      updateActive: (recipe) => set((s) => recipe(s.messages[s.active])),
      updateMessage: (i, recipe) => set((s) => recipe(s.messages[i])),
      replaceAll: (messages, active = 0) =>
        set((s) => {
          s.messages = messages.length ? messages.map(normalizeMessage) : [make.message('v2')];
          s.active = Math.min(Math.max(active, 0), s.messages.length - 1);
        }),
      append: (messages) =>
        set((s) => {
          const start = s.messages.length;
          s.messages.push(...messages.map(normalizeMessage));
          s.active = start;
        }),
    })),
    {
      name: 'dualhook.workspace',
      version: 2,
      // v1 -> v2: el mensaje de bienvenida traía el nombre de la app fijado y tapaba el del webhook
      migrate: (persisted, version) => {
        const p = persisted as { messages?: Message[] } | undefined;
        if (version < 2) p?.messages?.forEach((m) => {
          if ((m.username === 'Dualhook' || m.username === 'Hookforge') && !m.avatar_url) m.username = '';
        });
        return p as WorkspaceState;
      },
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ messages: s.messages, active: s.active }),
      merge: (persisted, current) => {
        const p = persisted as Partial<WorkspaceState> | undefined;
        if (!p?.messages?.length) return current;
        return { ...current, messages: p.messages.map(normalizeMessage), active: Math.min(p.active ?? 0, p.messages.length - 1) };
      },
    },
  ),
);

export const useActiveMessage = () => useWorkspace((s) => s.messages[s.active]);
export const getActiveMessage = () => {
  const s = useWorkspace.getState();
  return s.messages[s.active];
};
