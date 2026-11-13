/**
 * E22: Configurações por temas, como nos ajustes do celular.
 * A tela abre com a lista de temas; cada tema é uma página própria (#/ajustes/<id>).
 */

export type SettingsPageId = 'aparencia' | 'inicio' | 'barras' | 'conta' | 'backup' | 'armazenamento';

export interface SettingsPage {
  id: SettingsPageId;
  label: string;
  /** Nome do ícone (ui.tsx). */
  icon: string;
}

export const SETTINGS_PAGES: SettingsPage[] = [
  { id: 'conta', label: 'Contas e sincronização', icon: 'cloud' },
  { id: 'aparencia', label: 'Aparência', icon: 'palette' },
  { id: 'inicio', label: 'Início e módulos', icon: 'grid' },
  { id: 'barras', label: 'Barras e navegação', icon: 'sliders' },
  { id: 'backup', label: 'Backup', icon: 'download' },
  { id: 'armazenamento', label: 'Armazenamento', icon: 'shield' },
];

/** Grupos da lista (a conta Google fica sozinha no topo). */
export const SETTINGS_GROUPS: SettingsPageId[][] = [['aparencia', 'inicio', 'barras'], ['backup', 'armazenamento']];

/** Página aberta pelo endereço (#/ajustes/<sub>); qualquer outra coisa mostra a lista. */
export function settingsPage(sub: string): SettingsPage | null {
  const id = sub.split('/')[0];
  return SETTINGS_PAGES.find((p) => p.id === id) ?? null;
}

const THEME_NAMES = { dark: 'Escuro', light: 'Claro', system: 'Automático' } as const;

/** Resumo da Aparência na lista: "Escuro · cor padrão". */
export function appearanceSummary(theme: keyof typeof THEME_NAMES, accentName: string | null): string {
  return `${THEME_NAMES[theme] ?? 'Escuro'} · ${accentName ?? 'cor padrão'}`;
}
