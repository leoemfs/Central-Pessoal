import { useEffect, useSyncExternalStore } from 'react';

/**
 * E25: nome da tela de dentro do módulo, para o topo mostrar "Módulo / Tela" (no máximo dois níveis).
 * A tela chama usePageTitle("Nome"); ao sair, o nome some sozinho.
 */
let current: string | null = null;
let parent: string | null = null; // nível de cima, quando a tela sabe (ex.: o caminho de Estudos)
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function usePageTitle(title: string | null | undefined) {
  useEffect(() => {
    current = title || null;
    emit();
    return () => {
      if (current === (title || null)) {
        current = null;
        emit();
      }
    };
  }, [title]);
}

export function useCurrentPageTitle(): string | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
}

/** A tela informa o nível de cima e o próprio nome (ex.: "Idiomas" / "Inglês"); o topo mostra os dois. */
export function usePagePath(parentLabel: string | null | undefined, title: string | null | undefined) {
  useEffect(() => {
    parent = parentLabel || null;
    current = title || null;
    emit();
    return () => {
      if (parent === (parentLabel || null)) parent = null;
      if (current === (title || null)) current = null;
      emit();
    };
  }, [parentLabel, title]);
}

export function useCurrentPageParent(): string | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => parent,
  );
}
