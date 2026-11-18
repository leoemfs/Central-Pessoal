import { useSyncExternalStore } from 'react';

/** E35.2: largura a partir da qual aparece a coluna "Sempre à vista" no computador (igual ao CSS). */
export const WIDE_QUERY = '(min-width: 1280px)';

const mq = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(WIDE_QUERY) : null);

function subscribe(cb: () => void) {
  const m = mq();
  if (!m) return () => {};
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
}

/** Verdadeiro quando a janela é larga o bastante para a coluna da direita. */
export function useWideScreen(): boolean {
  return useSyncExternalStore(subscribe, () => mq()?.matches ?? false, () => false);
}

/** E41: computador (barra lateral, sem a barra de cima do celular). Igual ao CSS (900 px). */
const deskMq = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(min-width: 900px)') : null);
export function useDesktop(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = deskMq();
      if (!m) return () => {};
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => deskMq()?.matches ?? false,
    () => false,
  );
}
