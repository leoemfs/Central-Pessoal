/**
 * Campanha da Jornada (N2.10a / N2.17g2), seguindo a "Prévia da Jornada".
 * As regiões saem da entrevista (Vila no começo, uma por área, Montanha e Castelo no fim). Cada região
 * tem objetivos medidos pelos dados reais, contados a partir do dia em que ela abriu. Guardado só o que
 * foi concluído (`journey.camp`); o resto é calculado. Chefes chegam na N2.10b: até lá, região com chefe
 * fica em "chefe em breve" depois dos objetivos.
 */
import type { AppData } from '../types.ts';
import { addDays, todayISO, toISO } from '../utils.ts';
import { diffDays } from '../habits.ts';
import { ACTS, CALM, RITS, STUDY, goalName, quitName, type Profile } from './interview.ts';
import { missionsToday } from './missions.ts';
import type { JourneyState } from './rules.ts';

export type RegionId = 'vila' | 'floresta' | 'arena' | 'mercado' | 'pantano' | 'torre' | 'jardim' | 'montanha' | 'castelo';
export type Npc = 'lume' | 'nina' | 'tork';

export interface Chapter {
  id: RegionId;
  name: string;
  theme: string;
  npc: Npc;
  intro: string[];
  outro: string[];
  goals: { key: string; title: string; need: number }[];
  boss?: { id: string; name: string; taunt: string };
  reward: { title: string; chest: 'prata' | 'dourado' | 'cristal'; item?: string; home?: string };
}

export interface CampState {
  /** Regiões concluídas, na ordem, com a data. */
  cleared: { id: string; at: string }[];
  /** Regiões cuja fala de entrada já foi ouvida. */
  intro: string[];
  /** Já vestiu algum item do Arsenal (objetivo da Vila). */
  dressed: boolean;
  /** N2.10b: chefe da região atual, desde que apareceu. */
  boss: BossState | null;
}

export interface BossState {
  /** Região do chefe. */
  id: string;
  /** Dia em que a luta começou. */
  start: string;
  /** Vida cheia (fica a mesma em cada tentativa). */
  max: number;
  /** Missões que já estavam feitas no dia em que ele apareceu (não contam). */
  base: number;
  /** Quantas fugas já foram avisadas. */
  seen: number;
}

export const defaultCamp = (): CampState => ({ cleared: [], intro: [], dressed: false, boss: null });

function normalizeBoss(x: unknown): BossState | null {
  const b = (x && typeof x === 'object' ? x : null) as Partial<BossState> | null;
  if (!b || typeof b.id !== 'string' || typeof b.start !== 'string' || typeof b.max !== 'number') return null;
  return { id: b.id, start: b.start, max: Math.max(1, Math.round(b.max)), base: Math.max(0, Math.round(Number(b.base) || 0)), seen: Math.max(0, Math.round(Number(b.seen) || 0)) };
}

export function normalizeCamp(x: unknown): CampState {
  const r = (x && typeof x === 'object' ? x : {}) as Partial<CampState>;
  return {
    cleared: Array.isArray(r.cleared) ? r.cleared.filter((c): c is { id: string; at: string } => !!c && typeof c.id === 'string' && typeof c.at === 'string') : [],
    intro: Array.isArray(r.intro) ? r.intro.filter((i): i is string => typeof i === 'string') : [],
    dressed: r.dressed === true,
    boss: normalizeBoss(r.boss),
  };
}

const AREA_REGION: Record<string, RegionId> = { rotina: 'floresta', corpo: 'arena', mente: 'torre', dinheiro: 'mercado', largar: 'pantano', bemestar: 'jardim' };

/** Ordem das regiões: Vila, uma por área (na ordem da entrevista), Floresta se ficou curta, Montanha e Castelo. */
export function campaignIds(p: Profile | null): RegionId[] {
  const ids: RegionId[] = ['vila', ...(p?.areas ?? []).map((a) => AREA_REGION[a])];
  if (ids.length < 3 && !ids.includes('floresta')) ids.push('floresta');
  return [...ids, 'montanha', 'castelo'];
}

/** Monta os capítulos com o ritmo da entrevista (tranquilo 0,7 · equilibrado 1 · desafiador 1,3). */
export function chapters(p: Profile | null): Chapter[] {
  const pace = p ? { tranquilo: 0.7, equilibrado: 1, desafiador: 1.3 }[p.pace] : 1;
  const nn = (x: number) => Math.max(1, Math.round(x * pace));
  const habitsCount = p ? p.areas.length + 1 : 2;
  const castleMin = Math.max(2, Math.round(habitsCount * 0.6));
  const R: Record<RegionId, () => Chapter> = {
    vila: () => ({
      id: 'vila', name: 'Vila do Começo', theme: 'Conhecer o app', npc: 'lume',
      intro: ['Então você chegou! Esta é a Vila do Começo.', 'Montei esta jornada com o que você me contou. Aqui na vila você aprende a usar as ferramentas.', 'Cumpra as tarefas da vila e a estrada se abre. Seus objetivos ficam aqui na Campanha.'],
      goals: [
        { key: 'ritual', title: 'Marque um ritual ou hábito do dia', need: 1 },
        { key: 'diario', title: 'Escreva no diário', need: 1 },
        { key: 'conta', title: 'Pague uma conta no prazo', need: 1 },
        { key: 'diaCompleto', title: 'Complete todas as missões de um dia', need: 1 },
        { key: 'vestir', title: 'Vista um item do Arsenal', need: 1 },
      ],
      outro: ['Muito bem! Você já sabe usar as ferramentas da vila.', 'A partir daqui, cada região é sobre algo que você quer melhorar.'],
      reward: { title: 'viajante', chest: 'prata' },
    }),
    floresta: () => {
      const r = p ? RITS[p.rotina.rit] : RITS.cama;
      return {
        id: 'floresta', name: 'Floresta da Rotina', theme: 'Rituais e hábitos', npc: 'lume',
        intro: ['A Floresta da Rotina só deixa passar quem volta todos os dias.', `Seu ritual é "${r}". Faça seus rituais por ${nn(7)} dias seguidos e o Lobo da Preguiça vai aparecer para te testar.`],
        goals: [
          { key: 'streak', title: `${nn(7)} dias seguidos com algum ritual ou hábito`, need: nn(7) },
          { key: 'ritual', title: `Cumpra ${nn(20)} rituais ou hábitos`, need: nn(20) },
        ],
        boss: { id: 'lobo', name: 'Lobo da Preguiça', taunt: 'Bocejo… Por que não deixar para amanhã? Amanhã é um dia tão bonito…' },
        outro: ['O Lobo voltou a dormir, bem longe da sua rotina.'],
        reward: { title: 'lobos', item: 'mantoFloresta', chest: 'dourado' },
      };
    },
    arena: () => {
      const act = p ? ACTS[p.corpo.act][0] : 'Treino';
      const need = nn((p?.corpo.freq ?? 3) * 2);
      return {
        id: 'arena', name: 'Arena de Ferro', theme: 'Corpo e saúde', npc: 'tork',
        intro: ['Hmpf. Sou o Tork. Na arena, ninguém fica forte num dia só.', `Você disse ${p?.corpo.freq ?? 3} vezes por semana de ${act.toLowerCase()}. Faça ${need} treinos e o Ogro do Sofá vai sair da toca.`],
        goals: [{ key: 'treinos', title: `${act}: ${need} treinos`, need }],
        boss: { id: 'ogro', name: 'Ogro do Sofá', taunt: 'Treino? Hoje? Deita aqui no sofá comigo… amanhã você começa.' },
        outro: ['O Ogro levantou do sofá e foi embora resmungando. Respeito.'],
        reward: { title: 'arena', item: 'armaduraArena', chest: 'dourado' },
      };
    },
    mercado: () => {
      const d = p?.dinheiro;
      const box = !!d && d.goal !== 'nenhum';
      const goals = [
        ...(box ? [{ key: 'caixinha', title: 'Criar uma caixinha com meta', need: 1 }, { key: 'guardar', title: `Guardar nas datas combinadas ${nn(4)} vezes`, need: nn(4) }] : []),
        ...(d?.issue === 'gasto'
          ? [{ key: 'gastos', title: `Anotar os gastos em ${nn(10)} dias`, need: nn(10) }, { key: 'contas', title: `Pagar ${nn(2)} contas no prazo`, need: nn(2) }]
          : d?.issue === 'entrada'
            ? [{ key: 'receitas', title: 'Cadastrar o salário em Finanças › Receitas', need: 1 }, { key: 'contas', title: `Pagar ${nn(2)} contas no prazo`, need: nn(2) }]
            : [{ key: 'contas', title: `Pagar ${nn(3)} contas no prazo`, need: nn(3) }]),
      ];
      return {
        id: 'mercado', name: 'Mercado de Ouro', theme: box ? 'Finanças e caixinha' : 'Finanças', npc: 'nina',
        intro: box
          ? ['Bem-vinde ao meu mercado! Sou a Nina.', `Aqui fica rico quem guarda um pouco de cada vez. Vi que você está juntando para "${p ? goalName(p) : ''}".`, 'Guarde nas datas combinadas e pague as contas no prazo. Mas fique de olho no Goblin dos Juros.']
          : ['Bem-vinde ao meu mercado! Sou a Nina.', 'Aqui ninguém fica rico gastando: fica quem paga em dia e sabe quanto entra.', 'Pague suas contas no prazo. E fique de olho no Goblin dos Juros.'],
        goals,
        boss: { id: 'goblin', name: 'Goblin dos Juros', taunt: box ? 'Só dessa vez… tira da caixinha e devolve depois, hehe. Ninguém vai saber…' : 'Hehe… só uma continha atrasada. Que mal tem? Eu cobro só um pouquinho de juros…' },
        outro: ['O Goblin fugiu sem levar uma moeda!'],
        reward: { title: 'mercado', item: 'braceleteMercador', chest: 'dourado' },
      };
    },
    pantano: () => {
      const q = p ? quitName(p) : 'o hábito';
      const need = nn(14);
      return {
        id: 'pantano', name: 'Pântano das Tentações', theme: 'Largar um hábito', npc: 'lume',
        intro: ['O pântano parece calmo, mas cada passo puxa você de volta para os velhos hábitos.', `Você quer largar: ${q}. Fique ${need} dias sem. A Serpente do Vício vai tentar te convencer do contrário.`],
        goals: [{ key: 'limpo', title: `${need} dias sem ${q.toLowerCase()}`, need }],
        boss: { id: 'serpente', name: 'Serpente do Vício', taunt: `Sssó um pouquinho… ninguém vai saber… você merece, não merece?` },
        outro: ['A Serpente afundou no pântano. Você está mais forte do que imagina.'],
        reward: { title: 'serpentes', item: 'botasPantano', chest: 'cristal' },
      };
    },
    torre: () => {
      const w = p ? STUDY[p.mente.what] : 'Estudar';
      return {
        id: 'torre', name: 'Torre do Saber', theme: 'Mente e estudo', npc: 'lume',
        intro: ['Esta torre guarda tudo o que você aprende. Mas o Guardião do Esquecimento apaga o que não é revisitado.', `${w} em ${nn(10)} dias e escreva ${nn(7)} registros no diário.`],
        goals: [
          { key: 'leitura', title: `${w} em ${nn(10)} dias diferentes`, need: nn(10) },
          { key: 'diarios', title: `${nn(7)} registros no diário`, need: nn(7) },
        ],
        boss: { id: 'guardiao', name: 'Guardião do Esquecimento', taunt: 'O que você estudou ontem mesmo? Viu só? Eu apago tudo…' },
        outro: ['O Guardião se desfez em névoa. O que você aprendeu fica.'],
        reward: { title: 'saber', item: 'cajadoSaber', chest: 'dourado' },
      };
    },
    jardim: () => {
      const c = p ? CALM[p.bemestar.what] : CALM.meditar;
      const wk = p?.bemestar.what === 'terapia';
      const need = wk ? nn(3) : nn(10);
      return {
        id: 'jardim', name: 'Jardim da Calma', theme: 'Bem-estar', npc: 'lume',
        intro: ['Respira. Este é o Jardim da Calma.', `Aqui o treino é cuidar da cabeça: ${c.toLowerCase()} ${wk ? `em ${need} semanas` : `em ${need} dias`}, e alguns registros no diário. A Sombra da Ansiedade não gosta nada disso.`],
        goals: [
          { key: 'calma', title: `${c}: ${need} ${wk ? 'sessões' : 'dias'}`, need },
          { key: 'diarios', title: `${nn(5)} registros no diário`, need: nn(5) },
        ],
        boss: { id: 'sombra', name: 'Sombra da Ansiedade', taunt: 'E se der tudo errado? E se… e se… Melhor nem tentar respirar fundo.' },
        outro: ['A Sombra encolheu até sumir. Ela volta às vezes, mas agora você sabe o que fazer.'],
        reward: { title: 'calma', item: 'lanternaCalma', chest: 'dourado' },
      };
    },
    montanha: () => ({
      id: 'montanha', name: 'Montanha da Disciplina', theme: 'Revisão semanal', npc: 'tork',
      intro: ['Hmpf. Ninguém sobe esta montanha sem parar para olhar o caminho.', `Faça ${nn(2)} revisões semanais. Quem revisa a semana não se perde na subida.`],
      goals: [{ key: 'revisoes', title: `Faça ${nn(2)} revisões semanais`, need: nn(2) }],
      boss: { id: 'gigante', name: 'Gigante da Desordem', taunt: 'BAGUNÇA! Papel por todo lado! Quem precisa de plano?' },
      outro: ['O Gigante rolou montanha abaixo. Forjei uma armadura com as pedras dele.', 'Do alto daqui dá para ver o Castelo do Caos. É a última parada.'],
      reward: { title: 'montanha', item: 'armaduraMontanha', chest: 'dourado' },
    }),
    castelo: () => ({
      id: 'castelo', name: 'Castelo do Caos', theme: 'Tudo junto', npc: 'lume',
      intro: ['Aqui mora o Senhor do Caos, que transforma a vida da gente numa bagunça.', `Para entrar, mantenha o equilíbrio: ${nn(14)} dias com pelo menos ${castleMin} missões cumpridas. Depois, uma batalha de duas semanas.`],
      goals: [{ key: 'equilibrio', title: `${nn(14)} dias com ${castleMin} ou mais missões`, need: nn(14) }],
      boss: { id: 'caos', name: 'Senhor do Caos', taunt: 'Você achou mesmo que ia organizar tudo? EU SOU O CAOS DA SUA VIDA!' },
      outro: ['Você venceu o Senhor do Caos. A sua vida tem ordem agora, e é você quem mantém.'],
      reward: { title: 'ordem', item: 'laminaOrdem', chest: 'cristal', home: 'castelo' },
    }),
  };
  return campaignIds(p).map((id) => R[id]());
}

// ---------- Contadores dos objetivos (dados reais, de `from` até `to`) ----------

const dayOf = (iso: string) => toISO(new Date(iso));
const isReview = (tag: string) => tag === 'Revisão';

function habitDays(d: AppData, from: string, to: string, pick: (attrs: string[], kind: string) => boolean): string[] {
  const days: string[] = [];
  for (const h of d.habits) if ((h.kind === 'ritual' || h.kind === 'construir') && pick(h.attrs, h.kind)) for (const c of h.checks) if (c >= from && c <= to) days.push(c);
  return days;
}

function bestRun(days: string[]): number {
  const s = [...new Set(days)].sort();
  let best = 0;
  let run = 0;
  s.forEach((day, i) => {
    run = i > 0 && diffDays(s[i - 1], day) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}

function missionDays(d: AppData, from: string, to: string, ok: (done: number, total: number) => boolean): number {
  let n = 0;
  let day = from < addDays(to, -120) ? addDays(to, -120) : from;
  for (; day <= to; day = addDays(day, 1)) {
    const ms = missionsToday(d, day);
    if (ok(ms.filter((m) => m.done).length, ms.length)) n++;
  }
  return n;
}

export function goalCount(key: string, d: AppData, camp: CampState, from: string, to: string, p: Profile | null): number {
  const bills = () => d.expenses.filter((e) => !e.cardId && e.paidAt && e.paidAt >= from && e.paidAt <= to && e.paidAt <= e.dueDate).length;
  const diary = () => d.journal.filter((j) => !isReview(j.tag) && dayOf(j.createdAt) >= from && dayOf(j.createdAt) <= to).length;
  switch (key) {
    case 'ritual':
      return habitDays(d, from, to, () => true).length;
    case 'diario':
    case 'diarios':
      return diary();
    case 'conta':
    case 'contas':
      return bills();
    case 'diaCompleto':
      return Math.min(1, missionDays(d, from, to, (done, total) => total > 0 && done === total));
    case 'vestir':
      return camp.dressed ? 1 : 0;
    case 'streak':
      return bestRun(habitDays(d, from, to, () => true));
    case 'treinos': {
      const attrs = p ? (ACTS[p.corpo.act][1] as readonly string[]) : ['FOR', 'AGI'];
      return habitDays(d, from, to, (a) => a.some((x) => attrs.includes(x))).length;
    }
    case 'caixinha':
      return (d.boxes ?? []).some((b) => b.target) ? 1 : 0;
    case 'guardar':
      return (d.boxes ?? []).reduce((n, b) => n + b.moves.filter((m) => m.kind === 'plano' && m.date >= from && m.date <= to).length, 0);
    case 'gastos':
      return new Set(d.expenses.map((e) => dayOf(e.createdAt)).filter((x) => x >= from && x <= to)).size;
    case 'receitas':
      return (d.incomes ?? []).length > 0 || d.incomeSources.length > 0 ? 1 : 0;
    case 'limpo': {
      const name = p ? quitName(p).toLowerCase() : '';
      const habits = d.habits.filter((h) => h.kind === 'abandonar' && h.startDate <= to);
      const pickH = habits.find((h) => name && h.name.toLowerCase().includes(name.split(' ')[0])) ?? habits[0];
      if (!pickH) return 0;
      const last = [pickH.startDate, from, ...pickH.slips.filter((s) => s <= to)].sort().pop()!;
      return Math.max(0, diffDays(last, to));
    }
    case 'leitura':
      return new Set(habitDays(d, from, to, (a) => a.includes('INT'))).size;
    case 'calma':
      return new Set(habitDays(d, from, to, (a) => a.includes('SAB'))).size;
    case 'revisoes':
      return d.journal.filter((j) => isReview(j.tag) && dayOf(j.createdAt) >= from && dayOf(j.createdAt) <= to).length;
    case 'equilibrio': {
      const min = Math.max(2, Math.round(((p?.areas.length ?? 1) + 1) * 0.6));
      return missionDays(d, from, to, (done) => done >= min);
    }
    default:
      return 0;
  }
}

export interface CampaignView {
  chapters: Chapter[];
  /** Índice da região atual (ou o último, se tudo concluído). */
  current: number;
  done: boolean;
  /** Progresso dos objetivos da região atual. */
  goals: { key: string; title: string; need: number; have: number }[];
  /**
   * objetivos → (com chefe) aparece → chefe → pronto (vencido) · sem chefe: objetivos → pronto · fim.
   * "aparece": objetivos cumpridos, o chefe ainda não se apresentou.
   */
  stage: 'objetivos' | 'aparece' | 'chefe' | 'pronto' | 'fim';
  start: string;
  /** Luta com o chefe (quando há uma). */
  boss: BossView | null;
}

export interface BossView {
  hp: number;
  max: number;
  /** Dias da tentativa atual que ainda faltam (contando hoje). */
  daysLeft: number;
  /** Quantas vezes ele já fugiu. */
  fled: number;
  beaten: boolean;
}

/** Dias de cada tentativa: 7, ou 14 no Castelo do Caos. */
export const bossDays = (id: string) => (id === 'castelo' ? 14 : 7);
const SHARE = { tranquilo: 0.6, equilibrado: 0.8, desafiador: 0.95 } as const;

/** Missões cumpridas num dia (as mesmas da Jornada: hábitos, tarefas, contas, diário, caixinha). */
const doneOn = (d: AppData, day: string) => missionsToday(d, day).filter((m) => m.done).length;

/** Vida do chefe: missões de um período (pela média dos últimos 7 dias) × ritmo da entrevista. Mínimo 6. */
export function bossMax(d: AppData, today: string, days: number, pace: Profile['pace'] | undefined): number {
  let total = 0;
  for (let i = 1; i <= 7; i++) total += missionsToday(d, addDays(today, -i)).length;
  const perDay = Math.max(total / 7, missionsToday(d, today).length, 1);
  return Math.max(6, Math.round(perDay * days * SHARE[pace ?? 'equilibrado']));
}

/** Como está a luta: cada missão cumprida é um golpe; se o prazo acaba, ele foge e volta com a vida cheia. */
export function bossView(d: AppData, b: BossState, today: string): BossView {
  const days = bossDays(b.id);
  let hits = 0;
  let cycle = 0;
  for (let day = b.start; day <= today; day = addDays(day, 1)) {
    const c = Math.floor(diffDays(b.start, day) / days);
    if (c !== cycle) {
      cycle = c;
      hits = 0;
    }
    hits += Math.max(0, doneOn(d, day) - (day === b.start ? b.base : 0));
    if (hits >= b.max) return { hp: 0, max: b.max, daysLeft: 0, fled: cycle, beaten: true };
  }
  const daysLeft = days - (diffDays(b.start, today) % days);
  return { hp: b.max - hits, max: b.max, daysLeft, fled: cycle, beaten: false };
}

/** O chefe se apresenta (tela "Um chefe apareceu!" → Enfrentar): a luta começa hoje. */
export function startBoss(d: AppData, state: JourneyState, today: string): JourneyState {
  const v = campaign(d, state, today);
  if (v.stage !== 'aparece') return state;
  const ch = v.chapters[v.current];
  const boss: BossState = { id: ch.id, start: today, max: bossMax(d, today, bossDays(ch.id), state.profile?.pace), base: doneOn(d, today), seen: 0 };
  return { ...state, camp: { ...state.camp, boss } };
}

/** Onde a pessoa está na campanha. Começa no dia da chegada (baú de boas-vindas). */
export function campaign(d: AppData, state: JourneyState, today: string = todayISO()): CampaignView {
  const p = state.profile;
  const chs = chapters(p);
  const camp = state.camp;
  const arrival = state.chests.find((c) => c.key === 'boas-vindas')?.openedAt ?? today;
  let current = 0;
  while (current < chs.length && camp.cleared.some((c) => c.id === chs[current].id)) current++;
  const done = current >= chs.length;
  const idx = Math.min(current, chs.length - 1);
  const ch = chs[idx];
  const start = current === 0 ? arrival : (camp.cleared.find((c) => c.id === chs[current - 1]?.id)?.at ?? arrival);
  const goals = done ? ch.goals.map((g) => ({ ...g, have: g.need })) : ch.goals.map((g) => ({ ...g, have: Math.min(g.need, goalCount(g.key, d, camp, start, today, p)) }));
  const all = goals.every((g) => g.have >= g.need);
  const fight = !done && all && ch.boss && camp.boss?.id === ch.id ? bossView(d, camp.boss, today) : null;
  const stage = done ? 'fim' : !all ? 'objetivos' : !ch.boss ? 'pronto' : !fight ? 'aparece' : fight.beaten ? 'pronto' : 'chefe';
  return { chapters: chs, current: idx, done, goals, stage, start, boss: fight };
}

/** Conclui a região atual (só quando está "pronto"): guarda a data e, se houver, dá o item da região. */
export function clearChapter(state: JourneyState, view: CampaignView, today: string): JourneyState {
  if (view.stage !== 'pronto') return state;
  const ch = view.chapters[view.current];
  const owned = [...state.owned, ...[ch.reward.item, ch.reward.home].filter((x): x is string => !!x && !state.owned.includes(x))];
  return { ...state, owned, camp: { ...state.camp, boss: null, cleared: [...state.camp.cleared, { id: ch.id, at: today }] } };
}

