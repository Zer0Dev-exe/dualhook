import { create } from 'zustand';

type Request =
  | { kind: 'confirm'; title: string; message: string; ok: string; danger: boolean; resolve: (v: boolean) => void }
  | { kind: 'prompt'; title: string; label: string; value: string; resolve: (v: string | null) => void };

interface DialogState {
  current: Request | null;
  open: (r: Request) => void;
  close: () => void;
}

/** Diálogos imperativos (confirm/prompt) que devuelven promesas; los pinta <DialogHost/>. */
export const useDialogStore = create<DialogState>()((set) => ({
  current: null,
  open: (current) => set({ current }),
  close: () => set({ current: null }),
}));

export const confirmDialog = (message: string, opts: { title?: string; ok?: string; danger?: boolean } = {}) =>
  new Promise<boolean>((resolve) =>
    useDialogStore.getState().open({ kind: 'confirm', title: opts.title ?? 'Confirmar', message, ok: opts.ok ?? 'Aceptar', danger: !!opts.danger, resolve }),
  );

export const promptDialog = (title: string, value = '', label = '') =>
  new Promise<string | null>((resolve) => useDialogStore.getState().open({ kind: 'prompt', title, label, value, resolve }));
