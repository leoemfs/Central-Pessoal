/**
 * Voltar que sobe um nível (E20).
 * O app guarda só a "trilha" que interessa (ex.: Início › Mais › Finanças › Orçamento), não todo o histórico.
 * - Voltar tira a última tela da trilha; no Início, sai do app.
 * - Abrir uma tela que já está na trilha volta até ela (nunca cria ciclo).
 * - Barra de baixo e menu ☰ ("switch"): a tela fica logo acima do Início (Mais → Início; módulo → Início).
 * - Links dentro das telas ("open"): a tela entra em cima da atual (módulo aberto pelo Mais → Mais → Início).
 * - Ferramenta de um módulo (Orçamento, Humor…): fica sempre logo acima da casa do módulo.
 */
export type NavKind = 'open' | 'switch';

export const ROOT = 'inicio';
const MAX = 8;

export const clean = (to: string): string => to.replace(/^#?\/?/, '') || ROOT;
export const pathOf = (route: string): string => route.split('/')[0] || ROOT;

/** Trilha longa demais: guarda o Início e as últimas telas. */
function cap(s: string[]): string[] {
  return s.length <= MAX ? s : [s[0], ...s.slice(s.length - (MAX - 1))];
}

/** Nova trilha ao ir para `to`. `homeOf(seção)` diz a casa do módulo daquela seção (ou null). */
export function nextStack(stack: string[], to: string, kind: NavKind, homeOf: (path: string) => string | null): string[] {
  const t = clean(to);
  if (t === ROOT) return [ROOT];
  const i = stack.indexOf(t);
  if (i >= 0) return stack.slice(0, i + 1);
  if (t === 'mais') return [ROOT, 'mais'];
  const p = pathOf(t);
  const home = homeOf(p);
  const toolOf = home && home !== p ? home : null;
  if (toolOf) {
    const j = stack.lastIndexOf(toolOf);
    if (j >= 0) return cap([...stack.slice(0, j + 1), t]);
    return kind === 'switch' ? [ROOT, toolOf, t] : cap([...stack, toolOf, t]);
  }
  if (kind === 'switch') return [ROOT, t];
  return cap([...stack, t]);
}

/** Troca a tela de cima no lugar (ex.: o endereço "financas/nova" vira "financas" depois de abrir o formulário). */
export function replaceTop(stack: string[], to: string): string[] {
  const t = clean(to);
  if (t === ROOT) return [ROOT];
  const s = stack.length <= 1 ? [ROOT, t] : [...stack.slice(0, -1), t];
  // Não deixa a mesma tela duas vezes seguidas (o voltar pareceria não fazer nada).
  return s.length > 2 && s[s.length - 2] === t ? s.slice(0, -1) : s;
}

/** Trilha depois do voltar. */
export function backStack(stack: string[]): string[] {
  return stack.length <= 1 ? [ROOT] : stack.slice(0, -1);
}
