/**
 * Barra de baixo (navegação 2.0, item A1 da Central).
 * - Início e Mais ficam sempre nas pontas.
 * - No Início (e em telas sem barra própria), os 3 do meio são os módulos favoritos.
 * - Dentro de um módulo, os 3 do meio são do próprio módulo, com a "casa" dele no centro.
 */

export interface BarItem {
  id: string;
  label: string;
  /** Nome do ícone (IconName em ui.tsx). */
  icon: string;
  /** Endereço sem o "#/". */
  to: string;
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
      { id: 'orcamento', label: 'Orçamento', icon: 'gauge', to: 'orcamento' },
      { id: 'financas', label: 'Finanças', icon: 'wallet', to: 'financas' },
      { id: 'relatorios', label: 'Relatórios', icon: 'pie', to: 'relatorios' },
    ],
  },
  {
    id: 'diario',
    name: 'Diário',
    sections: ['diario', 'humor', 'revisao'],
    items: [
      { id: 'humor', label: 'Humor', icon: 'smile', to: 'humor' },
      { id: 'diario', label: 'Diário', icon: 'journal', to: 'diario' },
      { id: 'revisao', label: 'Revisão', icon: 'calendarCheck', to: 'revisao' },
    ],
  },
  {
    id: 'agenda',
    name: 'Agenda',
    sections: ['agenda'],
    items: [
      { id: 'tarefas', label: 'Tarefas', icon: 'tasks', to: 'agenda/tarefas' },
      { id: 'calendario', label: 'Agenda', icon: 'calendar', to: 'agenda/calendario' },
      { id: 'hoje', label: 'Hoje', icon: 'sun', to: 'agenda/hoje' },
    ],
  },
  {
    id: 'nucleo',
    name: 'Núcleo',
    sections: ['nucleo'],
    items: [
      { id: 'mente', label: 'Mente', icon: 'heart', to: 'nucleo/mente' },
      { id: 'rituais', label: 'Núcleo', icon: 'sprout', to: 'nucleo/rituais' },
      { id: 'corpo', label: 'Corpo', icon: 'dumbbell', to: 'nucleo/corpo' },
    ],
  },
  {
    id: 'listas',
    name: 'Listas',
    sections: ['listas'],
    items: [
      { id: 'receitas', label: 'Receitas', icon: 'pot', to: 'listas/receitas' },
      { id: 'listas', label: 'Listas', icon: 'cart', to: 'listas' },
      { id: 'precos', label: 'Preços', icon: 'tag', to: 'listas/precos' },
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

/**
 * Qual dos 3 itens do módulo está ativo (0, 1 ou 2), a partir da tela e da aba que o módulo informou.
 * null = nenhum (ex.: "Hoje" na Agenda é um atalho, não uma aba).
 */
export function activeIndex(bar: ModuleBar, section: string, tab: string | null): number | null {
  switch (bar.id) {
    case 'financas':
    case 'diario':
      return bar.items.findIndex((i) => i.id === section);
    case 'agenda':
      return tab === 'tarefas' ? 0 : 1;
    case 'nucleo':
      return tab === 'mente' ? 0 : tab === 'corpo' ? 2 : 1;
    case 'listas':
      return tab === 'receitas' ? 0 : tab === 'precos' ? 2 : 1;
    default:
      return null;
  }
}

/** Texto do topo: "Finanças" na casa do módulo; "Finanças / Orçamento" nas outras abas. */
export function crumb(bar: ModuleBar, index: number | null): { module: string; page: string | null } {
  return { module: bar.name, page: index === null || index === 1 ? null : bar.items[index].label };
}
