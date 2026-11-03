import type { IconName } from './ui';

export interface NavItem {
  label: string;
  icon: IconName;
  /** Endereço (#/...). Sem endereço = em breve. */
  to?: string;
  /** Seção que deixa o item marcado como ativo. */
  section?: string;
}

/** Menu completo (menu ☰ no celular e barra lateral no computador). */
export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Geral',
    items: [
      { label: 'Página inicial', icon: 'home', to: 'inicio', section: 'inicio' },
      { label: 'Calendário', icon: 'calendar', to: 'agenda', section: 'agenda' },
      { label: 'Tarefas', icon: 'tasks', to: 'agenda/tarefas' },
    ],
  },
  {
    title: 'Organização pessoal',
    items: [
      { label: 'Diário', icon: 'journal', to: 'diario', section: 'diario' },
      { label: 'Arquivo geral', icon: 'archive', to: 'arquivo', section: 'arquivo' },
      { label: 'Lembretes', icon: 'bell' },
      { label: 'Metas e objetivos', icon: 'target' },
    ],
  },
  {
    title: 'Financeiro',
    items: [
      { label: 'Visão geral', icon: 'wallet', to: 'financas', section: 'financas' },
      { label: 'Cartões', icon: 'card', to: 'financas/cartoes' },
      { label: 'Categorias', icon: 'tag', to: 'ajustes' },
      { label: 'Relatórios', icon: 'pie' },
    ],
  },
  {
    title: 'Bem-estar',
    items: [
      { label: 'Hábitos', icon: 'flame', to: 'nucleo', section: 'nucleo' },
      { label: 'Saúde', icon: 'heartPulse' },
    ],
  },
  {
    title: 'Planejamento',
    items: [
      { label: 'Estudos e trabalho', icon: 'briefcase' },
      { label: 'Foco', icon: 'timer' },
      { label: 'Banco de ideias', icon: 'bulb' },
    ],
  },
];

export const SETTINGS_ITEM: NavItem = { label: 'Configurações', icon: 'settings', to: 'ajustes', section: 'ajustes' };
