import { produce, type Draft } from 'immer';

/**
 * Patrón de edición de los formularios: cada editor recibe `value` + `onChange`
 * y obtiene un `set(recipe)` que produce el siguiente valor inmutable con Immer.
 */
export const editor =
  <T>(value: T, onChange: (v: T) => void) =>
  (recipe: (draft: Draft<T>) => void) =>
    onChange(produce(value, recipe));

/** Utilidades de listas inmutables. */
export const list = {
  move: <T>(arr: readonly T[], from: number, to: number) => {
    const next = [...arr];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  },
  replace: <T>(arr: readonly T[], i: number, item: T) => arr.map((x, j) => (j === i ? item : x)),
  remove: <T>(arr: readonly T[], i: number) => arr.filter((_, j) => j !== i),
  insert: <T>(arr: readonly T[], i: number, ...items: T[]) => [...arr.slice(0, i), ...items, ...arr.slice(i)],
};
