/**
 * E43: central de ajuda "Como usar o app". Cada módulo pode ter um guia (passo a passo).
 * A lista cresce um módulo por vez; o guia de Estudos foi o primeiro (N11.5).
 */
export interface GuideInfo {
  /** Módulo (igual ao endereço da casa do módulo). */
  id: string;
  label: string;
  steps: number;
}

export const GUIDES: GuideInfo[] = [{ id: 'estudos', label: 'Estudos', steps: 6 }];

/** Guias que aparecem: só dos módulos à vista, na ordem da lista. */
export function visibleGuides(hidden: (module: string) => boolean): GuideInfo[] {
  return GUIDES.filter((g) => !hidden(g.id));
}

/** Marca o guia como visto (sem repetir). */
export function markSeen(seen: string[], id: string): string[] {
  return seen.includes(id) ? seen : [...seen, id];
}
