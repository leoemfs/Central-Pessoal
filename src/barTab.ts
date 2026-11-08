import { useEffect, useSyncExternalStore } from 'react';

/**
 * Aba aberta dentro do módulo (ex.: "tarefas" na Agenda), para a barra de baixo marcar o ícone certo.
 * Cada módulo com abas informa a sua com `useReportTab`; a barra lê com `useCurrentTab`.
 */
let current: { section: string; tab: string } = { section: '', tab: '' };
const listeners = new Set<() => void>();

export function useReportTab(section: string, tab: string) {
  useEffect(() => {
    current = { section, tab };
    listeners.forEach((l) => l());
  }, [section, tab]);
}

export function useCurrentTab(section: string): string | null {
  const snap = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
  return snap.section === section ? snap.tab : null;
}
