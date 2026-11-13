/**
 * Montagem do app (E14) e módulos à vista (resto do E1): regras puras.
 * - Módulos desligados ficam guardados no Mais (nada é apagado).
 * - Ritmo do Diário: o app só convida a escrever no ritmo escolhido, sem nunca cobrar falta.
 */
import type { AppData, JournalRhythm } from './types.ts';
import { DEFAULT_FAVORITES, FAV_COUNT } from './moduleBar.ts';

export interface ModuleInfo {
  id: string;
  label: string;
  icon: string;
  hint: string;
}

/** Módulos que podem ser ligados e desligados (na ordem do Mais). */
export const MODULES: ModuleInfo[] = [
  { id: 'financas', label: 'Finanças', icon: 'wallet', hint: 'Contas, cartões, receitas e caixinhas' },
  { id: 'diario', label: 'Diário', icon: 'journal', hint: 'Registros, humor e revisão da semana' },
  { id: 'agenda', label: 'Agenda', icon: 'calendar', hint: 'Compromissos e tarefas' },
  { id: 'nucleo', label: 'Núcleo', icon: 'sprout', hint: 'Hábitos, mente e corpo' },
  { id: 'listas', label: 'Listas', icon: 'cart', hint: 'Mercado, preços e checklists' },
  { id: 'estudos', label: 'Estudos', icon: 'cap', hint: 'Trilhas, notebooks e mapas' },
  { id: 'carreira', label: 'Carreira', icon: 'briefcase', hint: 'Vagas, trabalho e reuniões' },
  { id: 'arquivo', label: 'Notas', icon: 'note', hint: 'Anotações rápidas' },
  { id: 'voce', label: 'Você', icon: 'user', hint: 'Perfil e sugestões' },
  { id: 'jornada', label: 'Jornada', icon: 'sword', hint: 'Modo jogo (opcional)' },
];
const MODULE_IDS = new Set(MODULES.map((m) => m.id));
export const MIN_VISIBLE = 3;

/** O que a pessoa quer organizar → módulos que já vêm marcados. */
export const SETUP_AREAS: { id: string; label: string; icon: string; modules: string[] }[] = [
  { id: 'dinheiro', label: 'Dinheiro', icon: 'wallet', modules: ['financas'] },
  { id: 'rotina', label: 'Rotina e hábitos', icon: 'repeat', modules: ['nucleo', 'agenda'] },
  { id: 'mente', label: 'Mente e corpo', icon: 'sprout', modules: ['nucleo'] },
  { id: 'compromissos', label: 'Compromissos', icon: 'calendar', modules: ['agenda'] },
  { id: 'dia', label: 'Registrar o dia', icon: 'journal', modules: ['diario'] },
  { id: 'casa', label: 'Casa e compras', icon: 'cart', modules: ['listas'] },
  { id: 'estudos', label: 'Estudos', icon: 'cap', modules: ['estudos'] },
  { id: 'carreira', label: 'Trabalho e carreira', icon: 'briefcase', modules: ['carreira'] },
];

/** Áreas da entrevista do Você que correspondem às escolhas daqui (para não perguntar duas vezes). */
export const PROFILE_AREA: Record<string, string> = { dinheiro: 'dinheiro', rotina: 'rotina', mente: 'corpo', estudos: 'mente' };

/** Módulos marcados pelas áreas, sempre com Notas e Você (leves). Completa até 3 com os padrões. */
export function modulesFromAreas(areas: string[]): string[] {
  const on = new Set<string>();
  for (const a of SETUP_AREAS) if (areas.includes(a.id)) a.modules.forEach((m) => on.add(m));
  on.add('arquivo');
  on.add('voce');
  for (const id of DEFAULT_FAVORITES) if ([...on].filter((m) => m !== 'arquivo' && m !== 'voce').length < 3) on.add(id);
  return MODULES.map((m) => m.id).filter((id) => on.has(id));
}

/** Liga ou desliga um módulo, sem deixar menos de 3 à vista. */
export function toggleModule(visible: string[], id: string): string[] {
  if (!MODULE_IDS.has(id)) return visible;
  if (visible.includes(id)) return visible.length <= MIN_VISIBLE ? visible : visible.filter((m) => m !== id);
  return MODULES.map((m) => m.id).filter((m) => m === id || visible.includes(m));
}

/** Favoritos possíveis: só módulos à vista (Jornada também pode). Mantém a ordem dos toques. */
export function fitFavorites(favs: string[], visible: string[]): string[] {
  const out = favs.filter((f) => visible.includes(f) || (f === 'revisao' && visible.includes('diario')));
  for (const id of [...DEFAULT_FAVORITES, ...visible]) if (out.length < FAV_COUNT && !out.includes(id) && visible.includes(id)) out.push(id);
  if (out.length < FAV_COUNT && visible.includes('diario') && !out.includes('revisao')) out.push('revisao');
  for (const m of MODULES) if (out.length < FAV_COUNT && !out.includes(m.id)) out.push(m.id);
  return out.slice(0, FAV_COUNT);
}

/** Tocar num favorito: entra no fim (o mais antigo sai); tocar num que já está tira ele. */
export function tapFavorite(picked: string[], id: string): string[] {
  if (picked.includes(id)) return picked.filter((x) => x !== id);
  return [...picked, id].slice(-FAV_COUNT);
}

export const hiddenFrom = (visible: string[]): string[] => MODULES.map((m) => m.id).filter((id) => !visible.includes(id));
export const visibleFrom = (hidden: string[]): string[] => MODULES.map((m) => m.id).filter((id) => !hidden.includes(id));

/** A que módulo pertence uma tela ou endereço (para esconder do menu o que está guardado). */
const SECTION_MODULE: Record<string, string> = {
  financas: 'financas', orcamento: 'financas', relatorios: 'financas',
  diario: 'diario', humor: 'diario', revisao: 'diario',
  agenda: 'agenda', proximos: 'agenda',
  nucleo: 'nucleo', progresso: 'nucleo', historico: 'nucleo',
  listas: 'listas', compras: 'listas', precos: 'listas',
  estudos: 'estudos', ciclos: 'estudos', roadmaps: 'estudos',
  carreira: 'carreira', vagas: 'carreira', metas: 'carreira',
  arquivo: 'arquivo', voce: 'voce', jornada: 'jornada',
};
export function moduleOf(path: string): string | null {
  return SECTION_MODULE[path.split('/')[0]] ?? null;
}
export function isHidden(d: Pick<AppData, 'settings'>, path: string): boolean {
  const m = moduleOf(path);
  return m !== null && d.settings.hiddenModules.includes(m);
}

/** O que já está montado hoje (para quem já usa: a entrevista vem preenchida). */
export function currentSetup(d: AppData) {
  return {
    name: d.profile.name,
    areas: d.settings.setupAreas,
    visible: visibleFrom(d.settings.hiddenModules),
    favorites: [...d.settings.favorites],
    rhythm: d.settings.journalRhythm,
    barLayout: d.settings.barLayout,
    accent: d.settings.accent,
    journey: d.settings.journeyChoice,
  };
}

/** Jeitos da barra de baixo dentro de um módulo (Personalização e montagem). */
export const BAR_LAYOUTS: { id: 'fixo' | 'lado' | 'centro'; label: string; hint: string; demo: string[] }[] = [
  { id: 'fixo', label: 'Favorito no mesmo lugar', hint: 'O módulo fica onde está nos favoritos (ex.: Agenda em 3º); as ferramentas ocupam os outros espaços.', demo: ['H', 'f', 'f', 'M', '+'] },
  { id: 'lado', label: 'Módulo ao lado do Início', hint: 'O módulo vai para o 1º espaço do meio; as ferramentas ficam à direita.', demo: ['H', 'M', 'f', 'f', '+'] },
  { id: 'centro', label: 'Módulo no centro', hint: 'O módulo vai para o meio; as ferramentas ficam dos lados.', demo: ['H', 'f', 'M', 'f', '+'] },
];

// ---------- Ritmo do Diário ----------

export const DEFAULT_RHYTHM: JournalRhythm = { mode: 'livre', perWeek: 3, days: [] };

export function normalizeRhythm(x: unknown): JournalRhythm {
  const r = typeof x === 'object' && x !== null ? (x as Record<string, unknown>) : {};
  const mode = r.mode === 'todo-dia' || r.mode === 'semana' || r.mode === 'dias' ? r.mode : 'livre';
  const perWeek = typeof r.perWeek === 'number' && r.perWeek >= 2 && r.perWeek <= 5 ? Math.round(r.perWeek) : 3;
  const days = Array.isArray(r.days) ? [...new Set(r.days.filter((n): n is number => Number.isInteger(n) && n >= 0 && n <= 6))].sort() : [];
  return { mode: mode === 'dias' && days.length === 0 ? 'livre' : mode, perWeek, days };
}

const WEEKDAY = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
export function rhythmLabel(r: JournalRhythm): string {
  if (r.mode === 'todo-dia') return 'Todo dia';
  if (r.mode === 'semana') return `${r.perWeek}x por semana`;
  if (r.mode === 'dias') return `Em dias certos (${r.days.map((d) => WEEKDAY[d]).join(', ')})`;
  return 'Quando der';
}

/** Segunda-feira da semana de uma data (AAAA-MM-DD). */
function mondayOf(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

/**
 * Convite do Diário no Início, no ritmo escolhido. `days` = dias (AAAA-MM-DD) com registro
 * (diário ou humor com nota). Nunca fala de falta: só convida ou comemora.
 */
export function journalInvite(r: JournalRhythm, days: string[], today: string): { text: string; invite: boolean; done: number; goal: number } | null {
  if (r.mode === 'livre') return null;
  const wrote = days.includes(today);
  if (r.mode === 'todo-dia') return { text: wrote ? 'Você já escreveu hoje.' : 'Que tal escrever um pouco hoje?', invite: !wrote, done: wrote ? 1 : 0, goal: 1 };
  if (r.mode === 'dias') {
    const dow = new Date(`${today}T12:00:00`).getDay();
    if (!r.days.includes(dow)) return null;
    return { text: wrote ? 'Você já escreveu hoje.' : 'Hoje é dia de escrever no Diário.', invite: !wrote, done: wrote ? 1 : 0, goal: 1 };
  }
  const monday = mondayOf(today);
  const done = new Set(days.filter((d) => d >= monday && d <= today)).size;
  const hit = done >= r.perWeek;
  return {
    text: hit ? `Meta da semana feita: ${done} de ${r.perWeek}.` : `Diário: ${done} de ${r.perWeek} nesta semana.`,
    invite: !hit && !wrote,
    done: Math.min(done, r.perWeek),
    goal: r.perWeek,
  };
}
