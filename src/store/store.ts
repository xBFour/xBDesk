import { useMemo, useSyncExternalStore } from 'react';

type Listener = () => void;

export interface Store<T> {
  get(): T;
  set(patch: Partial<T> | ((state: T) => Partial<T> | null | undefined)): void;
  subscribe(listener: Listener): () => void;
}

/** Minimal external store — keeps the kit free of runtime dependencies. */
export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<Listener>();
  return {
    get: () => state,
    set(patch) {
      const next = typeof patch === 'function' ? patch(state) : patch;
      if (!next) return;
      state = { ...state, ...next };
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!Object.prototype.hasOwnProperty.call(b, k) || !Object.is((a as any)[k], (b as any)[k])) return false;
  }
  return true;
}

/**
 * Subscribes to a slice of the store. Re-renders only when the selected value
 * changes according to `isEqual` (reference equality by default).
 */
export function useStoreSelector<T extends object, S>(
  store: Store<T>,
  selector: (state: T) => S,
  isEqual: (a: S, b: S) => boolean = Object.is,
): S {
  const getSnapshot = useMemo(() => {
    let hasMemo = false;
    let memoState: T;
    let memoSelection: S;
    return () => {
      const state = store.get();
      if (hasMemo && state === memoState) return memoSelection;
      const next = selector(state);
      memoState = state;
      if (hasMemo && isEqual(memoSelection, next)) return memoSelection;
      hasMemo = true;
      memoSelection = next;
      return next;
    };
    // The selector is intentionally re-bound each render so closures stay fresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, selector, isEqual]);
  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}
