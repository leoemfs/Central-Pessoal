/**
 * Barra de baixo (navegação 2.0, item A1 da Central).
 * - Início e Mais ficam sempre nas pontas.
 * - No Início (e em telas sem barra própria), os 3 do meio são os módulos favoritos.
 * - Dentro de um módulo, os 3 do meio são do próprio módulo, com a "casa" dele no centro.
 *
 * Regra de navegação (vale para o app todo):
 * - Abas no topo: partes do mesmo conteúdo (Despesas · Receitas · Cartões · Caixinhas).
 * - Barra de baixo: ferramentas que olham o módulo de outro jeito (planejar, analisar, atalho do dia).
 * - Botão +: tudo o que cria algo; por último, separado, "Categorias".
 * - Cada coisa aparece em um lugar só.
 */

export interface BarItem {
  id: string;
  label: string;
  /** Nome do ícone (IconName em ui.tsx). */
  icon: string;
  /** Endereço sem o "#/". */
  to: string;
  /** Tela que deixa este item marcado como ativo (sem tela = atalho, como "Hoje"). */
  section?: string;
}

export interface ModuleBar {
  id: string;
  /** Nome curto do módulo, usado no topo ("Finanças / Orçamento"). */
  name: string;
  /** Telas que pertencem a este módulo. */
  sections: string[];
  /** Esquerda, centro (casa do módulo) e direita. */
  items: [BarItem, BarItem, BarItem];
}

export const MODULE_BARS: ModuleBar[] = [
  {
    id: 'financas',
    name: 'Finanças',
    sections: ['financas', 'orcamento', 'relatorios'],
    items: [
      { id: 'orcamento', label: 'Orçamento', icon: 'gauge', to: 'orcamento', section: 'orcamento' },
      { id: 'financas', label: 'Finanças', icon: 'wallet', to: 'financas', section: 'financas' },
      { id: 'relatorios', label: 'Relatórios', icon: 'pie', to: 'relatorios', section: 'relatorios' },
    ],
  },
  {
    id: 'diario',
    name: 'Diário',
    sections: ['diario', 'humor', 'revisao'],
    items: [
      { id: 'humor', label: 'Humor', icon: 'smile', to: 'humor', section: 'humor' },
      { id: 'diario', label: 'Diário', icon: 'journal', to: 'diario', section: 'diario' },
      { id: 'revisao', label: 'Revisão', icon: 'calendarCheck', to: 'revisao', section: 'revisao' },
    ],
  },
  {
    id: 'agenda',
    name: 'Agenda',
    sections: ['agenda', 'proximos'],
    items: [
      { id: 'hoje', label: 'Hoje', icon: 'sun', to: 'agenda/hoje' },
      { id: 'agenda', label: 'Agenda', icon: 'calendar', to: 'agenda', section: 'agenda' },
      { id: 'proximos', label: 'Próximos', icon: 'list', to: 'proximos', section: 'proximos' },
    ],
  },
  {
    id: 'nucleo',
    name: 'Núcleo',
    sections: ['nucleo', 'progresso', 'historico'],
    items: [
      { id: 'progresso', label: 'Progresso', icon: 'bars', to: 'progresso', section: 'progresso' },
      { id: 'nucleo', label: 'Núcleo', icon: 'sprout', to: 'nucleo', section: 'nucleo' },
      { id: 'historico', label: 'Histórico', icon: 'clock', to: 'historico', section: 'historico' },
    ],
  },
  {
    id: 'listas',
    name: 'Listas',
    sections: ['listas', 'compras', 'precos'],
    items: [
      { id: 'compras', label: 'Compras', icon: 'receipt', to: 'compras', section: 'compras' },
      { id: 'listas', label: 'Listas', icon: 'cart', to: 'listas', section: 'listas' },
      { id: 'precos', label: 'Preços', icon: 'store', to: 'precos', section: 'precos' },
    ],
  },
  {
    id: 'estudos',
    name: 'Estudos',
    sections: ['estudos', 'ciclos', 'roadmaps'],
    items: [
      { id: 'ciclos', label: 'Ciclos', icon: 'repeat', to: 'ciclos', section: 'ciclos' },
      { id: 'estudos', label: 'Estudos', icon: 'cap', to: 'estudos', section: 'estudos' },
      { id: 'roadmaps', label: 'Roadmaps', icon: 'route', to: 'roadmaps', section: 'roadmaps' },
    ],
  },
];

/** Módulos que podem ser favoritos (os 3 do meio da barra no Início). */
export const FAVORITABLE: BarItem[] = [
  { id: 'financas', label: 'Finanças', icon: 'wallet', to: 'financas' },
  { id: 'diario', label: 'Diário', icon: 'journal', to: 'diario' },
  { id: 'agenda', label: 'Agenda', icon: 'calendar', to: 'agenda' },
  { id: 'nucleo', label: 'Núcleo', icon: 'sprout', to: 'nucleo' },
  { id: 'listas', label: 'Listas', icon: 'cart', to: 'listas' },
  { id: 'estudos', label: 'Estudos', icon: 'cap', to: 'estudos' },
  { id: 'arquivo', label: 'Notas', icon: 'note', to: 'arquivo' },
  { id: 'voce', label: 'Você', icon: 'user', to: 'voce' },
  { id: 'revisao', label: 'Revisão', icon: 'calendarCheck', to: 'revisao' },
  { id: 'jornada', label: 'Jornada', icon: 'sword', to: 'jornada' },
];

export const DEFAULT_FAVORITES: [string, string, string] = ['financas', 'diario', 'agenda'];

const isFav = (id: unknown): id is string => typeof id === 'string' && FAVORITABLE.some((f) => f.id === id);

/** Sempre 3 favoritos válidos e diferentes; completa com os padrões se faltar. */
export function normalizeFavorites(raw: unknown): [string, string, string] {
  const out: string[] = [];
  for (const id of Array.isArray(raw) ? raw : []) if (isFav(id) && !out.includes(id)) out.push(id);
  for (const id of DEFAULT_FAVORITES) if (out.length < 3 && !out.includes(id)) out.push(id);
  for (const f of FAVORITABLE) if (out.length < 3 && !out.includes(f.id)) out.push(f.id);
  return out.slice(0, 3) as [string, string, string];
}

/**
 * Marca um módulo como favorito: entra no fim e o mais antigo sai.
 * Tocar num que já é favorito não muda nada (a barra precisa de 3).
 */
export function addFavorite(favs: [string, string, string], id: string): { favorites: [string, string, string]; removed: string | null } {
  if (!isFav(id) || favs.includes(id)) return { favorites: favs, removed: null };
  return { favorites: [favs[1], favs[2], id], removed: favs[0] };
}

export function favoriteItems(favs: string[]): BarItem[] {
  return favs.map((id) => FAVORITABLE.find((f) => f.id === id)!).filter(Boolean);
}

export function barFor(section: string): ModuleBar | null {
  return MODULE_BARS.find((b) => b.sections.includes(section)) ?? null;
}

/** Qual dos 3 itens do módulo está ativo (0, 1 ou 2); null = nenhum. Cada item corresponde a uma tela. */
export function activeIndex(bar: ModuleBar, section: string): number | null {
  const i = bar.items.findIndex((it) => it.section === section);
  return i < 0 ? null : i;
}

/**
 * Os 3 do meio dentro de um módulo. O módulo fica na mesma posição que tem nos favoritos
 * (Finanças 1º, Diário 2º, Agenda 3º), e as ferramentas dele ocupam os outros dois espaços, na ordem.
 * Módulo que não é favorito fica no centro. `home` = posição da casa do módulo.
 */
export function barItems(bar: ModuleBar, favorites: string[]): { items: BarItem[]; home: number } {
  const [left, home, right] = bar.items;
  const slot = favorites.indexOf(bar.id);
  if (slot < 0 || slot > 2) return { items: bar.items, home: 1 };
  const tools = [left, right];
  const items = [0, 1, 2].map((i) => (i === slot ? home : tools.shift()!));
  return { items, home: slot };
}

/** Texto do topo: "Finanças" na casa do módulo; "Finanças / Orçamento" nas outras abas. */
export function crumb(bar: ModuleBar, index: number | null): { module: string; page: string | null } {
  return { module: bar.name, page: index === null || index === 1 ? null : bar.items[index].label };
}
