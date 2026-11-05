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
      { label: 'Você', icon: 'smile', to: 'voce', section: 'voce' },
      { label: 'Calendário', icon: 'calendar', to: 'agenda', section: 'agenda' },
      { label: 'Tarefas', icon: 'tasks', to: 'agenda/tarefas' },
    ],
  },
  {
    title: 'Organização pessoal',
    items: [
      { label: 'Diário', icon: 'journal', to: 'diario', section: 'diario' },
      { label: 'Notas', icon: 'note', to: 'arquivo', section: 'arquivo' },
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
      { label: 'Núcleo pessoal', icon: 'flame', to: 'nucleo', section: 'nucleo' },
      { label: 'Meditar e respirar', icon: 'heart', to: 'nucleo/mente' },
      { label: 'Treinos e alongamentos', icon: 'dumbbell', to: 'nucleo/corpo' },
      { label: 'Saúde', icon: 'heartPulse' },
    ],
  },
  {
    title: 'Planejamento',
    items: [
      { label: 'Revisão semanal', icon: 'calendarCheck', to: 'revisao', section: 'revisao' },
      { label: 'Jornada', icon: 'sword', to: 'jornada', section: 'jornada' },
      { label: 'Estudos e trabalho', icon: 'briefcase' },
      { label: 'Foco', icon: 'timer' },
      { label: 'Banco de ideias', icon: 'bulb' },
    ],
  },
];

export const SETTINGS_ITEM: NavItem = { label: 'Configurações', icon: 'settings', to: 'ajustes', section: 'ajustes' };
