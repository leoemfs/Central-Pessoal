/**
 * Entrevista da Mestra Lume (N2.9b, Anexo D de `modulo-rpg.md`).
 * As respostas ficam em `journey.profile` (para a campanha, N2.10) e criam no app o que falta:
 * hábitos no Núcleo (com nome, dias e horário respondidos) e, se a pessoa quiser juntar para
 * algo, uma caixinha em Finanças. O que já existe com o mesmo nome não é duplicado.
 */
import type { Habit, Profile as VoceProfile } from '../types.ts';

export type Area = 'corpo' | 'rotina' | 'mente' | 'dinheiro' | 'largar' | 'bemestar';

export interface Profile {
  areas: Area[];
  corpo: { act: 'academia' | 'corrida' | 'caminhada' | 'natacao'; freq: 2 | 3 | 4 | 5 };
  rotina: { rit: 'cama' | 'acordar' | 'casa' | 'planejar' };
  mente: { what: 'ler' | 'idioma' | 'curso'; amount: '10 min' | '20 min' | '30 min' };
  dinheiro: { issue: 'atraso' | 'gasto' | 'entrada'; goal: 'viagem' | 'reserva' | 'carro' | 'outro' | 'nenhum'; meta: number; plan: PlanKey; custom: string };
  largar: { habit: 'redes' | 'doce' | 'cigarro' | 'refrigerante' | 'outro'; custom: string };
  bemestar: { what: 'meditar' | 'respirar' | 'gratidao' | 'terapia' };
  period: 'manha' | 'tarde' | 'noite';
  pace: 'tranquilo' | 'equilibrado' | 'desafiador';
  /** Quando a entrevista foi feita (AAAA-MM-DD). */
  at: string;
}

export const AREAS: { id: Area; name: string; hint: string }[] = [
  { id: 'corpo', name: 'Corpo e saúde', hint: 'academia, corrida, caminhada' },
  { id: 'rotina', name: 'Rotina e organização', hint: 'rituais, casa em ordem' },
  { id: 'mente', name: 'Mente e estudo', hint: 'leitura, idioma, curso' },
  { id: 'dinheiro', name: 'Dinheiro', hint: 'contas em dia, guardar' },
  { id: 'largar', name: 'Largar um hábito', hint: 'cigarro, redes sociais, doce' },
  { id: 'bemestar', name: 'Bem-estar', hint: 'meditação, gratidão, terapia' },
];

export const ACTS = { academia: ['Academia', ['FOR']], corrida: ['Correr 3 km', ['FOR', 'AGI', 'RES']], caminhada: ['Caminhar 30 min', ['AGI']], natacao: ['Natação', ['AGI', 'RES']] } as const;
export const RITS = { cama: 'Arrumar a cama', acordar: 'Acordar no mesmo horário', casa: 'Organizar a casa por 10 min', planejar: 'Planejar o dia' } as const;
export const STUDY = { ler: 'Ler', idioma: 'Estudar idioma', curso: 'Aula do curso' } as const;
export const QUIT = { redes: ['Redes sociais à noite', 'DIS'], doce: ['Doce', 'RES'], cigarro: ['Cigarro', 'RES'], refrigerante: ['Refrigerante', 'RES'], outro: ['', 'DIS'] } as const;
export const CALM = { meditar: 'Meditar 10 min', respirar: 'Respirar 5 min', gratidao: 'Escrever 3 gratidões', terapia: 'Sessão de terapia' } as const;
export const GOALS = { viagem: ['Viagem', 3000], reserva: ['Reserva de emergência', 5000], carro: ['Carro', 15000], outro: ['', 2000] } as const;
export const PLANS = { semana50: [50, 'semana'], semana100: [100, 'semana'], mes200: [200, 'mes'], mes500: [500, 'mes'] } as const;
export type PlanKey = keyof typeof PLANS;
/** Dias da semana (0 = domingo) para cada frequência de treino. */
export const FREQ_DAYS: Record<number, number[]> = { 2: [2, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5] };
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export const LUME_LINES: Record<string, string> = {
  rota: 'Você já me contou o que quer melhorar. É por essas regiões que a sua jornada vai passar.',
  areas: 'Antes de partir, quero te conhecer. O que você mais quer melhorar agora? Escolha até 3, na ordem de importância.',
  corpo: 'Corpo forte, cabeça leve! Me conta como você quer se mexer.',
  rotina: 'Rotina boa começa pequena. Qual ritual você quer firmar?',
  mente: 'A Torre do Saber adora gente curiosa. O que você quer aprender, e quanto por dia?',
  dinheiro: 'Dinheiro em ordem é paz. Qual é o seu maior desafio? E tem alguma coisa pela qual você quer juntar?',
  largar: 'Largar um hábito é o caminho mais difícil, e o que mais vale. Qual você quer deixar?',
  bemestar: 'Cuidar da cabeça também é treino. O que te ajuda a ficar bem?',
  ritmo: 'E o ritmo? Não tem resposta certa, e dá para mudar depois.',
  resumo: 'Pronto! Montei a sua jornada com o que você me contou. Confira antes de começar.',
};

export function defaultProfile(today: string): Profile {
  return {
    areas: [],
    corpo: { act: 'academia', freq: 3 },
    rotina: { rit: 'cama' },
    mente: { what: 'ler', amount: '10 min' },
    dinheiro: { issue: 'atraso', goal: 'viagem', meta: 3000, plan: 'semana50', custom: '' },
    largar: { habit: 'redes', custom: '' },
    bemestar: { what: 'meditar' },
    period: 'manha',
    pace: 'equilibrado',
    at: today,
  };
}

/**
 * Passos da entrevista (E4): a Mestra Lume só pergunta o que é da Jornada.
 * Com as áreas já respondidas (montagem do app ou Você), começa pela rota das regiões; sem elas, pergunta as áreas.
 * Depois, uma pergunta por região (área), o ritmo e o resumo (o horário dos rituais fica no resumo).
 */
export const steps = (p: Profile, askAreas = true): string[] => [askAreas ? 'areas' : 'rota', ...p.areas, 'ritmo', 'resumo'];

const QUIT_FROM: Record<string, Profile['largar']['habit']> = { redes: 'redes', doce: 'doce', cigarro: 'cigarro', refri: 'refrigerante' };
const QUIT_TEXT: Record<string, string> = { procrastinar: 'Procrastinar', unha: 'Roer unha' };
const ISSUE_FROM: Record<string, Profile['dinheiro']['issue']> = { atraso: 'atraso', gasto: 'gasto', naosei: 'entrada' };
const GOAL_FROM: Record<string, Profile['dinheiro']['goal']> = { viagem: 'viagem', reserva: 'reserva', carro: 'carro', nada: 'nenhum' };
const GOAL_TEXT: Record<string, string> = { casa: 'Casa', estudo: 'Estudo' };

/**
 * Reaproveita o que a pessoa já contou (E4): as áreas (montagem do app e Você, até 3, na ordem)
 * e, na primeira vez, o hábito a largar e o dinheiro respondidos no Você. Nada é perguntado duas vezes.
 */
export function prefill(j: Profile | null, v: Pick<VoceProfile, 'areas' | 'quits' | 'money'>, today: string): Profile {
  const base = j ?? defaultProfile(today);
  const known = v.areas.filter((a): a is Area => (AREA_IDS as string[]).includes(a));
  const areas = base.areas.length ? base.areas : Array.from(new Set(known)).slice(0, 3);
  if (j) return { ...base, areas };
  const out: Profile = { ...base, areas };
  const q = v.quits[0];
  if (q) out.largar = QUIT_FROM[q] ? { habit: QUIT_FROM[q], custom: '' } : { habit: 'outro', custom: (QUIT_TEXT[q] ?? q).slice(0, 24) };
  const m = v.money;
  if (ISSUE_FROM[m.challenge]) out.dinheiro = { ...out.dinheiro, issue: ISSUE_FROM[m.challenge] };
  if (m.saveFor) {
    const goal = GOAL_FROM[m.saveFor] ?? 'outro';
    const meta = m.amount ?? (goal === 'nenhum' ? out.dinheiro.meta : GOALS[goal][1]);
    out.dinheiro = { ...out.dinheiro, goal, meta, custom: goal === 'outro' ? (GOAL_TEXT[m.saveFor] ?? m.saveFor).slice(0, 24) : '' };
  }
  return out;
}

export const quitName = (p: Profile) => (p.largar.habit === 'outro' ? p.largar.custom.trim() || 'o hábito' : QUIT[p.largar.habit][0]);
export const goalName = (p: Profile) => (p.dinheiro.goal === 'outro' ? p.dinheiro.custom.trim() || 'Meu objetivo' : p.dinheiro.goal === 'nenhum' ? '' : GOALS[p.dinheiro.goal][0]);
export const planLabel = (k: PlanKey) => `${PLANS[k][0].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} por ${PLANS[k][1] === 'semana' ? 'semana' : 'mês'}`;

/** Regiões da campanha (D.2): Vila no começo, uma por área na ordem, Montanha e Castelo no fim. */
export function campaignRegions(p: Profile): string[] {
  const by: Record<Area, string> = { rotina: 'Floresta da Rotina', corpo: 'Arena de Ferro', mente: 'Torre do Saber', dinheiro: 'Mercado de Ouro', largar: 'Pântano das Tentações', bemestar: 'Jardim da Calma' };
  const mid = p.areas.map((a) => by[a]);
  if (p.areas.length === 1 && p.areas[0] !== 'rotina') mid.push(by.rotina);
  return ['Vila do Começo', ...mid, 'Montanha da Disciplina', 'Castelo do Caos'];
}

export interface HabitPlan {
  name: string;
  kind: Habit['kind'];
  days: number[];
  attrs: string[];
  why: string;
}

/** Os hábitos que as respostas pedem (antes de conferir o que já existe). */
export function plannedHabits(p: Profile): HabitPlan[] {
  const out: HabitPlan[] = [];
  const has = (a: Area) => p.areas.includes(a);
  if (has('rotina')) out.push({ name: RITS[p.rotina.rit], kind: 'ritual', days: ALL_DAYS, attrs: ['DIS'], why: 'Ritual, todo dia' });
  if (has('corpo')) {
    const [name, attrs] = ACTS[p.corpo.act];
    out.push({ name, kind: 'construir', days: FREQ_DAYS[p.corpo.freq], attrs: [...attrs], why: `${p.corpo.freq}× por semana` });
  }
  if (has('mente')) out.push({ name: `${STUDY[p.mente.what]} ${p.mente.amount}`, kind: 'construir', days: ALL_DAYS, attrs: ['INT'], why: 'Hábito em construção, todo dia' });
  if (has('bemestar')) {
    const weekly = p.bemestar.what === 'terapia';
    out.push({ name: CALM[p.bemestar.what], kind: 'ritual', days: weekly ? [3] : ALL_DAYS, attrs: ['SAB'], why: weekly ? '1× por semana' : 'Ritual, todo dia' });
  }
  if (has('largar')) out.push({ name: quitName(p), kind: 'abandonar', days: [], attrs: [QUIT[p.largar.habit][1]], why: 'Hábito a abandonar' });
  return out;
}

const AREA_IDS = AREAS.map((a) => a.id);

/** Completa as respostas vindas de backup ou versão antiga (null = entrevista não feita). */
export function normalizeProfile(raw: unknown): Profile | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<Profile>;
  const base = defaultProfile(typeof r.at === 'string' ? r.at : '');
  const pick = <T>(v: unknown, ok: readonly T[], fb: T): T => (ok.includes(v as T) ? (v as T) : fb);
  const o = <K extends keyof Profile>(k: K) => ((r[k] && typeof r[k] === 'object' ? r[k] : {}) as Record<string, unknown>);
  return {
    areas: Array.isArray(r.areas) ? Array.from(new Set(r.areas.filter((a): a is Area => AREA_IDS.includes(a as Area)))).slice(0, 3) : [],
    corpo: { act: pick(o('corpo').act, Object.keys(ACTS) as Profile['corpo']['act'][], base.corpo.act), freq: pick(o('corpo').freq, [2, 3, 4, 5] as const, base.corpo.freq) },
    rotina: { rit: pick(o('rotina').rit, Object.keys(RITS) as Profile['rotina']['rit'][], base.rotina.rit) },
    mente: { what: pick(o('mente').what, Object.keys(STUDY) as Profile['mente']['what'][], base.mente.what), amount: pick(o('mente').amount, ['10 min', '20 min', '30 min'] as const, base.mente.amount) },
    dinheiro: {
      issue: pick(o('dinheiro').issue, ['atraso', 'gasto', 'entrada'] as const, base.dinheiro.issue),
      goal: pick(o('dinheiro').goal, ['viagem', 'reserva', 'carro', 'outro', 'nenhum'] as const, base.dinheiro.goal),
      meta: typeof o('dinheiro').meta === 'number' && (o('dinheiro').meta as number) >= 0 ? (o('dinheiro').meta as number) : base.dinheiro.meta,
      plan: pick(o('dinheiro').plan, Object.keys(PLANS) as PlanKey[], base.dinheiro.plan),
      custom: typeof o('dinheiro').custom === 'string' ? (o('dinheiro').custom as string).slice(0, 24) : '',
    },
    largar: { habit: pick(o('largar').habit, Object.keys(QUIT) as Profile['largar']['habit'][], base.largar.habit), custom: typeof o('largar').custom === 'string' ? (o('largar').custom as string).slice(0, 24) : '' },
    bemestar: { what: pick(o('bemestar').what, Object.keys(CALM) as Profile['bemestar']['what'][], base.bemestar.what) },
    period: pick(r.period, ['manha', 'tarde', 'noite'] as const, base.period),
    pace: pick(r.pace, ['tranquilo', 'equilibrado', 'desafiador'] as const, base.pace),
    at: base.at,
  };
}
