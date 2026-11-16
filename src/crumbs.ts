import { pathOf } from './navStack.ts';

/** E27: um nível do caminho do computador. Sem `to` = onde você está (não é link). */
export interface Crumb {
  label: string;
  to?: string;
}

/**
 * Caminho do computador ("Início › Finanças › Orçamento"), a partir da trilha do voltar.
 * - Cada tela da trilha vira um nível clicável, com o nome da sua seção; nomes repetidos em sequência viram um só.
 * - A tela atual: se ela informa o próprio caminho (Estudos: "Biblioteca › Idiomas › Inglês"), ele entra inteiro
 *   depois do nome da seção; se informa só um nome, ele entra como último nível.
 */
export function buildCrumbs(trail: string[], labelOf: (path: string) => string | null, page: { items: Crumb[] | null; title: string | null }): Crumb[] {
  if (trail.length === 0) return [];
  const last = trail[trail.length - 1];
  const lastPath = pathOf(last);
  const out: Crumb[] = [];
  const push = (c: Crumb) => {
    const prev = out[out.length - 1];
    if (prev && prev.label === c.label) {
      out[out.length - 1] = c; // mesmo nome seguido (ex.: duas telas de Estudos): fica o mais recente
      return;
    }
    out.push(c);
  };
  for (const entry of trail.slice(0, -1)) {
    const p = pathOf(entry);
    // Telas de dentro da mesma seção da atual ficam por conta do caminho da própria tela.
    if (page.items && p === lastPath) continue;
    const label = labelOf(p);
    if (label) push({ label, to: entry });
  }
  const section = labelOf(lastPath);
  if (page.items && page.items.length > 0) {
    if (section) push({ label: section, to: lastPath });
    page.items.forEach((c, i) => push(i === page.items!.length - 1 ? { label: c.label } : c));
  } else if (page.title && page.title !== section) {
    if (section) push({ label: section, to: lastPath });
    push({ label: page.title });
  } else if (section) {
    push({ label: section });
  }
  return out;
}
