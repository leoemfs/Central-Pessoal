/**
 * E40/E41: menu ⋮ da barra de cima.
 * Padrão da barra de cima em todas as telas (18/11): ‹ voltar · caminho (até dois níveis) · ⋮ com as ações extras,
 * "Personalizar cartões" primeiro e a busca sempre por último (no Início, "Buscar em tudo"). Sem lupa nem lápis soltos.
 * Tela sem ação nenhuma não tem ⋮ (exceto quando a busca é própria da tela, como a do Diário).
 */
export interface MenuEntry {
  id: string;
  label: string;
  icon?: string;
  /** A opção de busca (fica por último, separada e na cor de destaque). */
  search?: boolean;
}

export const MENU_EDIT = 'personalizar';
export const MENU_SEARCH = 'buscar';

export function buildMenu(page: MenuEntry[], o: { editable: boolean; editing: boolean; search: string | null; ownSearch?: boolean }): MenuEntry[] {
  const out: MenuEntry[] = [];
  if (o.editable) out.push({ id: MENU_EDIT, label: o.editing ? 'Terminar de personalizar' : 'Personalizar cartões', icon: 'edit' });
  out.push(...page.filter((i) => i.id !== MENU_EDIT && i.id !== MENU_SEARCH));
  if (o.search && (out.length > 0 || o.ownSearch)) out.push({ id: MENU_SEARCH, label: o.search, icon: 'search', search: true });
  return out;
}
