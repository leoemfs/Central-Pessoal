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

export const GUIDES: GuideInfo[] = [
  { id: 'financas', label: 'Finanças', steps: 6 },
  { id: 'estudos', label: 'Estudos', steps: 6 },
];

/** Guias que aparecem: só dos módulos à vista, na ordem da lista. */
export function visibleGuides(hidden: (module: string) => boolean): GuideInfo[] {
  return GUIDES.filter((g) => !hidden(g.id));
}

/** Marca o guia como visto (sem repetir). */
export function markSeen(seen: string[], id: string): string[] {
  return seen.includes(id) ? seen : [...seen, id];
}

/** Arquiva o cartão "Como usar" da 1ª vez de um módulo (sem repetir). */
export function archiveGuide(off: string[], id: string): string[] {
  return off.includes(id) ? off : [...off, id];
}

/** O cartão da 1ª vez aparece enquanto o guia não foi aberto nem arquivado. */
export function showGuideCard(seen: string[], off: string[], id: string): boolean {
  return !seen.includes(id) && !off.includes(id);
}
