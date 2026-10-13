import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  view: 'preview' | 'json';
  autoBackupMinutes: number;
  lastAutoBackup: number;
  collapsed: Record<string, true>;
  setView: (v: UiState['view']) => void;
  setAutoBackup: (min: number) => void;
  markAutoBackup: () => void;
  toggleCollapsed: (id: string) => void;
}

/** Preferencias de interfaz (persistidas). */
export const useUi = create<UiState>()(
  persist(
    (set) => ({
      view: 'preview',
      autoBackupMinutes: 5,
      lastAutoBackup: 0,
      collapsed: {},
      setView: (view) => set({ view }),
      setAutoBackup: (autoBackupMinutes) => set({ autoBackupMinutes }),
      markAutoBackup: () => set({ lastAutoBackup: Date.now() }),
      toggleCollapsed: (id) =>
        set((s) => {
          const collapsed = { ...s.collapsed };
          if (collapsed[id]) delete collapsed[id];
          else collapsed[id] = true;
          return { collapsed };
        }),
    }),
    { name: 'dualhook.ui', version: 1 },
  ),
);

/* ---------- archivos adjuntos: solo en memoria ---------- */
interface FilesState {
  byMessage: Record<string, File[]>;
  add: (msgId: string, files: File[]) => void;
  remove: (msgId: string, index: number) => void;
  clear: () => void;
}

export const useFiles = create<FilesState>()((set) => ({
  byMessage: {},
  add: (msgId, files) =>
    set((s) => {
      const list = [...(s.byMessage[msgId] ?? [])];
      for (const f of files) {
        const i = list.findIndex((x) => x.name === f.name);
        if (i >= 0) list[i] = f;
        else list.push(f);
      }
      return { byMessage: { ...s.byMessage, [msgId]: list } };
    }),
  remove: (msgId, index) =>
    set((s) => ({ byMessage: { ...s.byMessage, [msgId]: (s.byMessage[msgId] ?? []).filter((_, i) => i !== index) } })),
  clear: () => set({ byMessage: {} }),
}));

const NO_FILES: File[] = [];
export const useMessageFiles = (msgId: string) => useFiles((s) => s.byMessage[msgId] ?? NO_FILES);
export const getMessageFiles = (msgId: string) => useFiles.getState().byMessage[msgId] ?? NO_FILES;
