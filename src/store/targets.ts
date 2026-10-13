import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { make } from '@/lib/factory';
import type { Target } from '@/lib/types';

interface TargetsState {
  list: Target[];
  activeId: string;
  select: (id: string) => void;
  add: (t?: Partial<Target>) => void;
  remove: (id: string) => void;
  update: (id: string, recipe: (t: Target) => void) => void;
}

const first = make.target();

/** Webhooks guardados. Se persisten aparte del espacio de trabajo: restaurar un backup no los toca. */
export const useTargets = create<TargetsState>()(
  persist(
    immer((set) => ({
      list: [first],
      activeId: first.id,
      select: (id) => set((s) => void (s.activeId = id)),
      add: (t = {}) =>
        set((s) => {
          const nt = { ...make.target(), ...t };
          s.list.push(nt);
          s.activeId = nt.id;
        }),
      remove: (id) =>
        set((s) => {
          s.list = s.list.filter((x) => x.id !== id);
          if (!s.list.length) s.list.push(make.target());
          if (!s.list.some((x) => x.id === s.activeId)) s.activeId = s.list[0].id;
        }),
      update: (id, recipe) =>
        set((s) => {
          const t = s.list.find((x) => x.id === id);
          if (t) recipe(t);
        }),
    })),
    { name: 'dualhook.targets', version: 1 },
  ),
);

export const useActiveTarget = () => useTargets((s) => s.list.find((t) => t.id === s.activeId) ?? s.list[0]);
export const getActiveTarget = () => {
  const s = useTargets.getState();
  return s.list.find((t) => t.id === s.activeId) ?? s.list[0];
};
