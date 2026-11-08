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
      { label: 'Você', icon: 'user', to: 'voce', section: 'voce' },
      { label: 'Calendário', icon: 'calendar', to: 'agenda', section: 'agenda' },
      { label: 'Tarefas', icon: 'tasks', to: 'agenda/tarefas' },
      { label: 'Próximos', icon: 'list', to: 'proximos', section: 'proximos' },
    ],
  },
  {
    title: 'Organização pessoal',
    items: [
      { label: 'Diário', icon: 'journal', to: 'diario', section: 'diario' },
      { label: 'Humor', icon: 'smile', to: 'humor', section: 'humor' },
      { label: 'Notas', icon: 'note', to: 'arquivo', section: 'arquivo' },
      { label: 'Listas', icon: 'cart', to: 'listas', section: 'listas' },
      { label: 'Compras', icon: 'receipt', to: 'compras', section: 'compras' },
      { label: 'Preços', icon: 'store', to: 'precos', section: 'precos' },
      { label: 'Lembretes', icon: 'bell' },
      { label: 'Metas e objetivos', icon: 'target' },
    ],
  },
  {
    title: 'Financeiro',
    items: [
      { label: 'Visão geral', icon: 'wallet', to: 'financas', section: 'financas' },
      { label: 'Cartões', icon: 'card', to: 'financas/cartoes' },
      { label: 'Orçamento', icon: 'gauge', to: 'orcamento', section: 'orcamento' },
      { label: 'Relatórios', icon: 'pie', to: 'relatorios', section: 'relatorios' },
      { label: 'Categorias', icon: 'tag', to: 'financas/categorias' },
    ],
  },
  {
    title: 'Bem-estar',
    items: [
      { label: 'Núcleo pessoal', icon: 'sprout', to: 'nucleo', section: 'nucleo' },
      { label: 'Meditar e respirar', icon: 'heart', to: 'nucleo/mente' },
      { label: 'Treinos e alongamentos', icon: 'dumbbell', to: 'nucleo/corpo' },
      { label: 'Progresso', icon: 'bars', to: 'progresso', section: 'progresso' },
      { label: 'Histórico de práticas', icon: 'clock', to: 'historico', section: 'historico' },
      { label: 'Saúde', icon: 'heartPulse' },
    ],
  },
  {
    title: 'Estudos e Carreira',
    items: [
      { label: 'Estudos', icon: 'cap', to: 'estudos', section: 'estudos' },
      { label: 'Ciclos', icon: 'repeat', to: 'ciclos', section: 'ciclos' },
      { label: 'Roadmaps', icon: 'route', to: 'roadmaps', section: 'roadmaps' },
      { label: 'Meus notebooks', icon: 'notebook', to: 'estudos/notebooks' },
      { label: 'Fontes', icon: 'link', to: 'estudos/fontes' },
      { label: 'Mapas mentais', icon: 'mindmap', to: 'estudos/mapas' },
    ],
  },
  {
    title: 'Planejamento',
    items: [
      { label: 'Revisão semanal', icon: 'calendarCheck', to: 'revisao', section: 'revisao' },
      { label: 'Jornada', icon: 'sword', to: 'jornada', section: 'jornada' },
      { label: 'Foco', icon: 'timer' },
      { label: 'Banco de ideias', icon: 'bulb' },
    ],
  },
];

export const SETTINGS_ITEM: NavItem = { label: 'Configurações', icon: 'settings', to: 'ajustes', section: 'ajustes' };
