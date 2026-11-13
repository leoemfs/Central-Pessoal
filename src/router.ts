import { barFor } from './moduleBar';
import { backStack, clean, nextStack, replaceTop, ROOT, type NavKind } from './navStack';
import { popWasOverlay, releaseOverlays } from './ui';
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

// ---------- Voltar que sobe um nível (E20) ----------
// O histórico do navegador fica com no máximo 2 entradas do app: a "raiz" (Início) e a de "cima" (a tela atual),
// mais as janelas abertas. A trilha de verdade (Início › Mais › Finanças…) fica guardada aqui, em `trail`.

let trail: string[] = [ROOT];
let pending: (() => void) | null = null;
const KEY = 'cp-trilha';

const here = () => clean(window.location.hash);
const homeOf = (path: string) => barFor(path)?.items[1].section ?? null;
const navState = () => (history.state as { nav?: string } | null)?.nav;

function remember() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(trail));
  } catch {
    /* sem armazenamento: só não lembra a trilha ao recarregar */
  }
}

/** Põe o navegador na tela de cima da trilha. Se há janelas abertas, volta antes até a tela (elas fecham). */
function apply(next: string[]) {
  const before = trail.length;
  trail = next;
  remember();
  const urlBefore = window.location.hash;
  let viaBack = false;
  const write = () => {
    // Depois de voltar pelas janelas, o navegador já avisa a troca de endereço; não avisa duas vezes.
    const browserWillNotify = viaBack && window.location.hash !== urlBefore;
    const to = trail[trail.length - 1];
    if (trail.length === 1) history.replaceState({ nav: 'root' }, '', `#/${ROOT}`);
    else if (navState() === 'top') history.replaceState({ nav: 'top' }, '', `#/${to}`);
    else history.pushState({ nav: 'top' }, '', `#/${to}`);
    if (!browserWillNotify) window.dispatchEvent(new HashChangeEvent('hashchange'));
  };
  const steps = releaseOverlays() + (trail.length === 1 && before > 1 && navState() !== 'root' ? 1 : 0);
  if (steps > 0) {
    viaBack = true;
    pending = write;
    history.go(-steps);
  } else write();
}

/** Abre uma tela. `switch` = barra de baixo e menu ☰; `open` = links e botões dentro das telas. */
export function navigate(to: string, kind: NavKind = 'open') {
  trail = replaceTop(trail, here()); // o endereço pode ter sido limpo no lugar (ex.: financas/nova → financas)
  apply(nextStack(trail, to, kind, homeOf));
}

export function go(to: string) {
  navigate(to, 'open');
}

/** Troca a tela atual no lugar (ações na própria página, como o botão +). */
export function goReplace(to: string) {
  apply(replaceTop(trail, to));
}

/** Limpa o endereço no lugar, sem trocar de tela (ex.: #/financas/nova → #/financas). */
export function cleanAddress(to: string) {
  trail = replaceTop(trail, to);
  remember();
  history.replaceState(history.state, '', `#/${clean(to)}`);
}

/** Liga o voltar que sobe um nível. Chamado uma vez, ao abrir o app. */
export function startNavigation() {
  let saved: string[] | null = null;
  try {
    saved = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
  } catch {
    saved = null;
  }
  const cur = here();
  if (navState() === 'top' && Array.isArray(saved) && saved[saved.length - 1] === cur) trail = saved;
  else if (cur === ROOT) {
    trail = [ROOT];
    history.replaceState({ nav: 'root' }, '', `#/${ROOT}`);
  } else {
    // Abriu direto numa tela (link, atualização): o Início fica embaixo, para o voltar subir até ele.
    trail = nextStack([ROOT], cur, 'switch', homeOf);
    history.replaceState({ nav: 'root' }, '', `#/${ROOT}`);
    history.pushState({ nav: 'top' }, '', `#/${cur}`);
  }
  remember();

  window.addEventListener('popstate', (e: PopStateEvent) => {
    const overlay = popWasOverlay();
    if (e.state === null && !pending) {
      // Endereço trocado "por fora" (link colado, endereço digitado): o navegador avisa como se fosse voltar,
      // mas é uma tela nova. Abre por cima da trilha, sem subir um nível.
      trail = nextStack(trail, here(), 'open', homeOf);
      remember();
      history.replaceState({ nav: trail.length > 1 ? 'top' : 'root' }, '', window.location.hash);
      return;
    }
    if (pending) {
      const f = pending;
      pending = null;
      f();
      return;
    }
    if (overlay || trail.length <= 1) return;
    // Voltar de verdade: sai da tela de cima e mostra a de baixo na trilha.
    trail = backStack(trail);
    remember();
    if (trail.length === 1) history.replaceState({ nav: 'root' }, '', `#/${ROOT}`);
    else history.pushState({ nav: 'top' }, '', `#/${trail[trail.length - 1]}`);
  });

  // Links do app (<a href="#/...">) passam pelo mesmo caminho. data-nav="switch" na barra e no menu.
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.('a[href^="#/"]') as HTMLAnchorElement | null;
    if (!a || a.target) return;
    e.preventDefault();
    navigate(a.getAttribute('href')!.slice(2), a.dataset.nav === 'switch' ? 'switch' : 'open');
  });
}

/** Executa uma ação pedida pelo endereço (ex.: #/financas/nova) e limpa o endereço. */
export function useSubAction(route: Route, base: string, actions: Record<string, () => void>) {
  useEffect(() => {
    const fn = actions[route.sub];
    if (!fn) return;
    fn();
    cleanAddress(base);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.n, route.sub]);
}
