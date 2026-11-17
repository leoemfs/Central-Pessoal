import { barFor } from './moduleBar';
import { clean, historyMoves, nextStack, replaceTop, ROOT, type NavKind } from './navStack';
import { notify, popWasOverlay, releaseOverlays } from './ui';
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

// ---------- Voltar que sobe um nível (E20, refeito no E39) ----------
// Cada nível da trilha (Início › Estudos › Biblioteca) é uma entrada de verdade no histórico do navegador,
// criada no toque do usuário. O voltar do celular só desce as entradas: nada é recriado durante o voltar
// (recriar fazia o app fechar quando o voltar era apertado duas vezes bem rápido).
// Embaixo do Início fica uma entrada de guarda ("exit"): o primeiro voltar no Início mostra
// "Volte novamente para sair"; um segundo voltar enquanto o aviso aparece fecha o app.

type NavEntry = { nav: 'cp'; d: number } | { nav: 'exit' };

let trail: string[] = [ROOT];
let pending: (() => void) | null = null;
let armed = false; // a entrada de guarda está embaixo do Início?
let exitTimer = 0;
const KEY = 'cp-trilha';
const EXIT_MS = 3000;

const here = () => clean(window.location.hash);
const homeOf = (path: string) => barFor(path)?.items[1].section ?? null;
const navEntry = () => history.state as (NavEntry & { overlay?: string }) | null;
const onExitEntry = () => navEntry()?.nav === 'exit';
const fire = () => window.dispatchEvent(new HashChangeEvent('hashchange'));

function remember() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(trail));
  } catch {
    /* sem armazenamento: só não lembra a trilha ao recarregar */
  }
}

/** Está na guarda (depois do primeiro voltar no Início): recoloca o Início em cima dela. */
function rearm() {
  window.clearTimeout(exitTimer);
  exitTimer = 0;
  if (!onExitEntry()) return;
  history.pushState({ nav: 'cp', d: 0 }, '', `#/${ROOT}`);
  armed = true;
}

/** Leva o navegador até a trilha `next`: volta as entradas que sobram (e as janelas) e cria as que faltam. */
function apply(next: string[]) {
  rearm();
  const from = trail.length;
  trail = next;
  remember();
  const urlBefore = window.location.hash;
  let viaBack = false;
  const write = () => {
    // Depois de voltar, o navegador já avisa a troca de endereço; não avisa duas vezes.
    const browserWillNotify = viaBack && window.location.hash !== urlBefore;
    const top = trail.length - 1;
    const { push } = historyMoves(from, trail.length);
    if (push === 0) history.replaceState({ nav: 'cp', d: top }, '', `#/${trail[top]}`);
    else for (let d = top - push + 1; d <= top; d++) history.pushState({ nav: 'cp', d }, '', `#/${trail[d]}`);
    if (!browserWillNotify) fire();
  };
  const { back } = historyMoves(from, next.length, releaseOverlays());
  if (back > 0) {
    viaBack = true;
    pending = write;
    history.go(-back);
  } else write();
}

/** E25: há para onde voltar (a seta ‹ do topo aparece)? */
export const canGoBack = () => trail.length > 1;

/** E27: a trilha atual (Início › … › tela), para o caminho do computador. */
export const getTrail = (): string[] => trail;

/** Abre uma tela. `switch` = barra de baixo e menu; `open` = links e botões dentro das telas. */
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

/** Primeiro voltar no Início: avisa e espera um segundo voltar para sair. */
function askToLeave() {
  armed = false;
  notify('Volte novamente para sair');
  window.clearTimeout(exitTimer);
  // Passou o aviso sem voltar de novo: o Início volta a ter a guarda embaixo.
  exitTimer = window.setTimeout(rearm, EXIT_MS);
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
  const st = navEntry();
  if (st?.nav === 'cp' && Array.isArray(saved) && st.d === saved.length - 1 && saved[saved.length - 1] === cur) {
    // Recarregou a página: as entradas do histórico continuam lá.
    trail = saved;
    armed = true;
  } else {
    // Abriu agora (ou direto numa tela): guarda, Início e cada nível até a tela.
    trail = cur === ROOT ? [ROOT] : nextStack([ROOT], cur, 'switch', homeOf);
    history.replaceState({ nav: 'exit' }, '', `#/${ROOT}`);
    trail.forEach((to, d) => history.pushState({ nav: 'cp', d }, '', `#/${to}`));
    armed = true;
  }
  remember();

  window.addEventListener('popstate', (e: PopStateEvent) => {
    const overlay = popWasOverlay();
    if (pending) {
      const f = pending;
      pending = null;
      f();
      return;
    }
    if (overlay) return;
    const st = e.state as (NavEntry & { overlay?: string }) | null;
    if (st?.nav === 'exit') {
      trail = [ROOT];
      remember();
      askToLeave();
      return;
    }
    if (st?.nav === 'cp' && st.d < trail.length) {
      // Voltar (ou avançar) de verdade: a trilha fica com os níveis até esta entrada.
      if (st.d < trail.length - 1) trail = trail.slice(0, st.d + 1);
      remember();
      const want = `#/${trail[st.d]}`;
      if (window.location.hash !== want) {
        history.replaceState({ nav: 'cp', d: st.d }, '', want);
        fire();
      }
      return;
    }
    // Endereço trocado "por fora" (link colado, endereço digitado) ou entrada desconhecida:
    // abre por cima da trilha e marca a entrada com o nível dela.
    trail = nextStack(trail, here(), 'open', homeOf);
    remember();
    history.replaceState({ nav: 'cp', d: trail.length - 1 }, '', window.location.hash);
  });

  // Tocar na tela enquanto o aviso de sair aparece: fica no app (a guarda volta na hora).
  const stay = () => {
    if (!armed && onExitEntry()) rearm();
  };
  window.addEventListener('pointerdown', stay, true);
  window.addEventListener('keydown', stay, true);

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
