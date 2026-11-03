import { useEffect, useState } from 'react';

export interface Route {
  /** Primeiro segmento: "financas" em #/financas/nova */
  path: string;
  /** Resto: "nova" em #/financas/nova */
  sub: string;
  /** Muda a cada navegação, para reagir mesmo quando o endereço se repete. */
  n: number;
}

function parse(n: number): Route {
  const [path = '', ...rest] = window.location.hash.replace(/^#\/?/, '').split('/');
  return { path: path || 'inicio', sub: rest.join('/'), n };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(0));
  useEffect(() => {
    const onHash = () => {
      setRoute((r) => parse(r.n + 1));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return route;
}

export function go(to: string) {
  window.location.hash = `/${to}`;
}

/** Como `go`, mas sem criar entrada no histórico (ações na própria página, como o botão +). */
export function goReplace(to: string) {
  window.location.replace(`#/${to}`);
}

/** Executa uma ação pedida pelo endereço (ex.: #/financas/nova) e limpa o endereço. */
export function useSubAction(route: Route, base: string, actions: Record<string, () => void>) {
  useEffect(() => {
    const fn = actions[route.sub];
    if (!fn) return;
    fn();
    history.replaceState(null, '', `#/${base}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.n, route.sub]);
}
