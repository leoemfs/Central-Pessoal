/**
 * Regras da Jornada (ainda sem telas; só valem depois do desbloqueio).
 *
 * Princípios:
 * - Atributos, títulos, baús ganhos, XP e ouro ganho são **calculados a partir dos dados** do app.
 *   Desmarcar algo marcado por engano tira a recompensa junto; faltar nunca tira nada.
 * - Só fica guardado o que é escolha ou gasto: avatar, itens que tem, o que está vestido, ouro e
 *   cristais gastos, título em uso e baús já abertos (`JourneyState`).
 * - Nada aqui altera os dados reais (hábitos, finanças, diário).
 */
import type { AppData, Habit } from '../types.ts';
import { waterGoalDays } from '../saude.ts';
import { medFullDays } from '../remedios.ts';
import { attributeTotals, diffDays, isScheduled, startOf } from '../habits.ts';
import { journeyStats, unlockProgress } from '../journey.ts';
import { monthBills } from '../finance.ts';
import { monthBalance } from '../incomes.ts';
import { defaultReviewWeek, weekReview, weekStart } from '../review.ts';
import { addDays, addMonths, monthKey, pad, sum, toISO, todayISO } from '../utils.ts';
import { normalizeProfile, type Profile } from './interview.ts';
import { defaultCamp, normalizeCamp, type CampState } from './campaign.ts';
import { ATTR_CODES, HOMES, ITEMS, PETS, RING2_LEVEL, STARTER_ITEMS, itemById, type AttrCode, type Attrs, type Home, type Item, type Rarity, type Slot } from './catalog.ts';

// ---------- Estado guardado ----------

export interface ChestRecord {
  key: string;
  kind: ChestKind;
  openedAt: string;
  gold: number;
  crystals: number;
  item: string | null;
}

export interface GamesState {
  records: Record<string, number>;
  /** Ouro que os jogos deram antes das fichas (até a v0.100). Continua na carteira. */
  prizes: { day: string; game: string; gold: number }[];
  /** N2.18a: cada partida (dia, jogo, segundos jogados, fichas ganhas). */
  plays: { day: string; game: string; seconds: number; fichas: number }[];
  /** Fichas gastas no bichinho virtual. */
  fichasSpent: number;
}

/** Presente de um dia de visita, já recebido. */
export interface GiftRecord {
  day: string;
  /** Posição na sequência de visitas naquele dia. */
  n: number;
  gold: number;
  chest: ChestKind | null;
}

export interface JourneyState {
  /** null enquanto a pessoa não criou o avatar. */
  avatar: { gender: 'f' | 'm'; skin: string; hair: string; name: string } | null;
  owned: string[];
  equipped: { elmo: string | null; armadura: string; botas: string; arma: string | null; anel: string | null; anel2: string | null; colar: string | null; magico: string | null; pet: string | null; morada: string };
  goldSpent: number;
  crystalsSpent: number;
  title: string | null;
  chests: ChestRecord[];
  weather: 'aleatorio' | 'limpo';
  /** N2.9b: respostas da entrevista da Mestra Lume (null = ainda não feita). */
  profile: Profile | null;
  /** N2.3: retrato da última visita, para o resumo "Desde a sua última visita". */
  lastSeen: JourneySnapshot | null;
  /** N2.13: último nível já comemorado na tela "Subiu de nível" (0 = ainda não marcou). */
  levelSeen: number;
  /** N2.17d: semana (segunda) cujo Resumo da semana já foi mostrado. */
  weekSeen: string;
  /** N2.17e: caixinhas já comemoradas ("meta:<id>" e "real:<id>"). */
  boxSeen: string[];
  /** N2.17g2: Campanha (regiões concluídas, falas ouvidas, já vestiu um item). */
  camp: CampState;
  /** N2.6: nome dado a cada pet (id → nome) e pelagem escolhida (id → pelagem). */
  petNames: Record<string, string>;
  petStyle: Record<string, string>;
  /** N2.6: presentes do dia já recebidos por abrir o app. */
  gifts: GiftRecord[];
  /** N2.16: mini games — recorde de cada jogo e prêmios recebidos (até 3 por dia). */
  games: GamesState;
}

/** Retrato do que foi ganho até um momento (valores ganhos, não o que sobrou depois de gastar). */
export interface JourneySnapshot {
  date: string;
  level: number;
  xp: number;
  gold: number;
  crystals: number;
  attrs: Attrs;
  /** Baús merecidos até ali (abertos ou não). */
  chests: number;
}

export function defaultJourneyState(): JourneyState {
  return {
    avatar: null,
    owned: [...STARTER_ITEMS, 'cabana'],
    equipped: { elmo: null, armadura: 'aprendiz', botas: 'sapatos', arma: 'madeira', anel: null, anel2: null, colar: null, magico: null, pet: null, morada: 'cabana' },
    goldSpent: 0,
    crystalsSpent: 0,
    title: 'aprendiz',
    chests: [],
    weather: 'aleatorio',
    lastSeen: null,
    levelSeen: 0,
    weekSeen: '',
    boxSeen: [],
    camp: defaultCamp(),
    petNames: {},
    petStyle: {},
    gifts: [],
    games: { records: {}, prizes: [], plays: [], fichasSpent: 0 },
    profile: null,
  };
}

/** Completa um estado vindo de backup ou de versão antiga. */
function normalizeGames(x: unknown): GamesState {
  const g = (x && typeof x === 'object' ? x : {}) as Partial<GamesState>;
  const records = g.records && typeof g.records === 'object' ? Object.fromEntries(Object.entries(g.records).filter((e): e is [string, number] => typeof e[1] === 'number' && e[1] >= 0)) : {};
  const prizes = Array.isArray(g.prizes) ? g.prizes.filter((p) => p && typeof p.day === 'string' && typeof p.game === 'string' && typeof p.gold === 'number').map((p) => ({ day: p.day, game: p.game, gold: Math.max(0, Math.min(20, p.gold)) })).slice(-400) : [];
  const plays = Array.isArray(g.plays) ? g.plays.filter((p) => p && typeof p.day === 'string' && typeof p.game === 'string' && typeof p.seconds === 'number' && typeof p.fichas === 'number').map((p) => ({ day: p.day, game: p.game, seconds: Math.max(0, Math.min(600, p.seconds)), fichas: Math.max(0, Math.min(10, p.fichas)) })).slice(-600) : [];
  const fichasSpent = typeof g.fichasSpent === 'number' && Number.isFinite(g.fichasSpent) && g.fichasSpent > 0 ? g.fichasSpent : 0;
  return { records, prizes, plays, fichasSpent };
}

const strMap = (x: unknown, max: number): Record<string, string> =>
  x && typeof x === 'object' ? Object.fromEntries(Object.entries(x as Record<string, unknown>).filter((e): e is [string, string] => typeof e[1] === 'string').map(([k, v]) => [k, v.slice(0, max)])) : {};

/**
 * Espaços vestidos. Versões antigas tinham "artefato" e "artefato2"; cada artefato vai para o espaço
 * novo dele (anel, colar ou mágico), como na prévia. Item que não existe mais ou no espaço errado sai.
 */
function normalizeEquipped(base: JourneyState['equipped'], raw: unknown): JourneyState['equipped'] {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const out = { ...base };
  const str = (v: unknown) => (typeof v === 'string' && v ? v : null);
  for (const k of ['elmo', 'armadura', 'botas', 'arma', 'anel', 'colar', 'magico', 'pet', 'morada'] as const) {
    const v = str(r[k]);
    if (v === null) {
      if (k in r && k !== 'armadura' && k !== 'botas' && k !== 'morada') (out as Record<string, string | null>)[k] = null;
      continue;
    }
    if (k === 'pet' || k === 'morada' || itemById(v)?.slot === k) (out as Record<string, string | null>)[k] = v;
  }
  const a2 = str(r.anel2);
  if (a2 && itemById(a2)?.slot === 'anel' && a2 !== out.anel) out.anel2 = a2;
  for (const old of [str(r.artefato), str(r.artefato2)]) {
    const it = old ? itemById(old) : undefined;
    if (!it || (it.slot !== 'anel' && it.slot !== 'colar' && it.slot !== 'magico')) continue;
    if (!out[it.slot]) out[it.slot] = it.id;
    else if (it.slot === 'anel' && !out.anel2 && out.anel !== it.id) out.anel2 = it.id;
  }
  return out;
}

export function normalizeJourney(raw: unknown): JourneyState {
  const base = defaultJourneyState();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<JourneyState>;
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
  return {
    avatar: r.avatar && (r.avatar.gender === 'f' || r.avatar.gender === 'm') ? { gender: r.avatar.gender, skin: String(r.avatar.skin ?? 'media'), hair: String(r.avatar.hair ?? 'castanho'), name: typeof r.avatar.name === 'string' ? r.avatar.name.slice(0, 14) : '' } : null,
    owned: Array.from(new Set([...base.owned, ...(Array.isArray(r.owned) ? r.owned.filter((x): x is string => typeof x === 'string') : [])])),
    equipped: normalizeEquipped(base.equipped, r.equipped),
    goldSpent: num(r.goldSpent),
    crystalsSpent: num(r.crystalsSpent),
    title: typeof r.title === 'string' ? r.title : base.title,
    chests: Array.isArray(r.chests) ? r.chests.filter((c) => c && typeof c.key === 'string') : [],
    weather: r.weather === 'limpo' ? 'limpo' : 'aleatorio',
    lastSeen: normalizeSnapshot(r.lastSeen),
    petNames: strMap(r.petNames, 20),
    petStyle: strMap(r.petStyle, 20),
    gifts: Array.isArray(r.gifts) ? r.gifts.filter((g): g is GiftRecord => !!g && typeof g.day === 'string' && typeof g.gold === 'number').map((g) => ({ day: g.day, n: Math.max(1, Math.floor(Number(g.n) || 1)), gold: Math.max(0, g.gold), chest: g.chest === 'bronze' || g.chest === 'prata' || g.chest === 'dourado' ? g.chest : null })) : [],
    games: normalizeGames(r.games),
    levelSeen: typeof r.levelSeen === 'number' && Number.isFinite(r.levelSeen) && r.levelSeen > 0 ? Math.floor(r.levelSeen) : 0,
    camp: normalizeCamp(r.camp),
    boxSeen: Array.isArray(r.boxSeen) ? r.boxSeen.filter((x): x is string => typeof x === 'string').slice(-200) : [],
    weekSeen: typeof r.weekSeen === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.weekSeen) ? r.weekSeen : '',
    profile: normalizeProfile(r.profile),
  };
}

// ---------- Atributos ----------

const zero = (): Attrs => ({ FOR: 0, AGI: 0, INT: 0, RES: 0, SAB: 0, DIS: 0 });
const dayOf = (iso: string) => toISO(new Date(iso));
const isReview = (tag: string) => tag === 'Revisão';

/** Contas pagas até o vencimento, com pagamento entre `from` e `to` (inclui faturas de cartão). */
export function billsOnTime(d: AppData, from: string, to: string): number {
  const plain = d.expenses.filter((e) => !e.cardId && e.paidAt && e.paidAt <= e.dueDate && e.paidAt >= from && e.paidAt <= to).length;
  const cards = sum(
    d.cards.map((c) => Object.entries(c.paidInvoices).filter(([month, paid]) => paid <= `${month}-${pad(c.dueDay)}` && paid >= from && paid <= to).length),
  );
  return plain + cards;
}

/**
 * Pontos de atributo entre `from` e `to`:
 * - cada dia cumprido de um hábito soma +3 se ele treina um atributo, ou +2 em cada um se treina mais;
 * - Disciplina também ganha +2 por conta paga no prazo e +3 por revisão semanal;
 * - Sabedoria também ganha +1 por dia com registro no diário.
 * Os pontos nunca diminuem por faltas.
 */
export function attributes(d: AppData, to: string = todayISO(), from = '0000-01-01'): Attrs {
  const a = zero();
  for (const t of attributeTotals(d.habits, from, to)) if (t.code in a) a[t.code as AttrCode] = t.points;
  const inRange = (day: string) => day >= from && day <= to;
  const reviews = d.journal.filter((j) => isReview(j.tag) && inRange(dayOf(j.createdAt))).length;
  const diaryDays = new Set(d.journal.filter((j) => !isReview(j.tag)).map((j) => dayOf(j.createdAt)).filter(inRange)).size;
  // N2.17e: guardar na caixinha no dia do plano vale +3 de Disciplina.
  const planSaves = (d.boxes ?? []).reduce((n, b) => n + b.moves.filter((m) => m.kind === 'plano' && inRange(m.date)).length, 0);
  a.DIS += 2 * billsOnTime(d, from, to) + 3 * reviews + 3 * planSaves;
  a.SAB += diaryDays;
  // Saúde (N1.1): bater a meta de água vale +3 de Resistência (com hábito ligado, já conta pelo hábito).
  a.RES += 3 * waterGoalDays(d, from, to);
  // N1.3: dia com todas as doses de remédio tomadas vale +3 de Resistência (com hábito ligado, conta pelo hábito).
  a.RES += 3 * medFullDays(d, from, to);
  return a;
}

// ---------- Classes ----------

export interface ClassInfo {
  id: string;
  f: string;
  m: string;
  codes: AttrCode[];
}

export const CLASSES: Record<AttrCode, [string, string]> = {
  FOR: ['Guerreira', 'Guerreiro'],
  AGI: ['Andarilha', 'Andarilho'],
  INT: ['Maga', 'Mago'],
  RES: ['Guardiã', 'Guardião'],
  SAB: ['Druida', 'Druida'],
  DIS: ['Paladina', 'Paladino'],
};

export const HYBRIDS: { codes: [AttrCode, AttrCode]; f: string; m: string }[] = [
  { codes: ['FOR', 'DIS'], f: 'Cavaleira', m: 'Cavaleiro' },
  { codes: ['INT', 'SAB'], f: 'Arquimaga', m: 'Arquimago' },
  { codes: ['AGI', 'FOR'], f: 'Bárbara', m: 'Bárbaro' },
  { codes: ['RES', 'DIS'], f: 'Sentinela', m: 'Sentinela' },
  { codes: ['AGI', 'SAB'], f: 'Xamã', m: 'Xamã' },
  { codes: ['INT', 'DIS'], f: 'Alquimista', m: 'Alquimista' },
];

/**
 * Classe pelo atributo mais alto. Empate: vale o que mais subiu nos últimos 30 dias (`recent`).
 * Se o segundo estiver a menos de 10% do primeiro e houver par definido, a classe é híbrida.
 */
export function classOf(attrs: Attrs, recent: Attrs = zero()): ClassInfo {
  const order = [...ATTR_CODES].sort((a, b) => attrs[b] - attrs[a] || recent[b] - recent[a] || ATTR_CODES.indexOf(a) - ATTR_CODES.indexOf(b));
  const [top, second] = order;
  if (attrs[top] <= 0) return { id: 'aventureiro', f: 'Aventureira', m: 'Aventureiro', codes: [] };
  if (attrs[second] > 0 && attrs[second] >= attrs[top] * 0.9) {
    const h = HYBRIDS.find((x) => x.codes.includes(top) && x.codes.includes(second));
    if (h) return { id: `${h.codes[0]}+${h.codes[1]}`, f: h.f, m: h.m, codes: [top, second] };
  }
  return { id: top, f: CLASSES[top][0], m: CLASSES[top][1], codes: [top] };
}

// ---------- Apoio: meses, sequências e recaídas ----------

function firstMonth(d: AppData): string | null {
  const days = [...d.expenses.map((e) => e.dueDate), ...d.incomes.map((i) => i.date)].sort();
  return days.length ? monthKey(days[0]) : null;
}

/** Meses fechados (anteriores ao atual), do mais antigo ao mais recente, no máximo 5 anos. */
function closedMonths(d: AppData, today: string): string[] {
  const first = firstMonth(d);
  const last = addMonths(monthKey(today), -1);
  if (!first || first > last) return [];
  const out: string[] = [];
  for (let m = first; m <= last && out.length < 60; m = addMonths(m, 1)) out.push(m);
  return out;
}

/** Meses fechados em que todas as contas (e faturas) foram pagas até o vencimento. */
export function monthsAllOnTime(d: AppData, today: string = todayISO()): string[] {
  return closedMonths(d, today).filter((m) => {
    const bills = monthBills(d, m, today);
    return bills.length > 0 && bills.every((b) => b.paidAt && b.paidAt <= b.dueDate);
  });
}

/** Maior sequência de meses fechados com sobra positiva (o que entrou − o que foi pago). */
export function bestPositiveRun(d: AppData, today: string = todayISO()): number {
  let best = 0;
  let run = 0;
  for (const m of closedMonths(d, today)) {
    const b = monthBalance(d, m, today);
    run = b.incomeReceived > 0 && b.current > 0 ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

/** Maior sequência já feita num hábito (dias fora da rotina não quebram; hoje pendente também não). */
export function bestStreak(h: Habit, today: string = todayISO()): number {
  if (h.kind === 'abandonar') return 0;
  const done = new Set(h.checks);
  let best = 0;
  let run = 0;
  for (let day = startOf(h), guard = 0; day <= today && guard < 3700; day = addDays(day, 1), guard++) {
    if (!isScheduled(h, day)) continue;
    if (done.has(day)) best = Math.max(best, ++run);
    else if (day < today) run = 0;
  }
  return best;
}

/** Maior período limpo depois de uma recaída (hábitos a abandonar). */
export function cleanAfterSlip(d: AppData, today: string = todayISO()): number {
  let best = 0;
  for (const h of d.habits.filter((x) => x.kind === 'abandonar')) {
    const slips = h.slips.filter((s) => s <= today).sort();
    slips.forEach((s, i) => {
      const end = slips[i + 1];
      best = Math.max(best, end ? diffDays(s, end) - 1 : diffDays(s, today));
    });
  }
  return best;
}

const checkDays = (d: AppData, filter: (h: Habit) => boolean, today: string) =>
  new Set(d.habits.filter((h) => h.kind !== 'abandonar' && filter(h)).flatMap((h) => h.checks.filter((c) => c <= today)));

// ---------- Títulos ----------

export interface TitleContext {
  d: AppData;
  today: string;
  attrs: Attrs;
}

export interface TitleDef {
  id: string;
  f: string;
  m: string;
  rule: string;
  need: number;
  have: (c: TitleContext) => number;
}

const attrTitle = (id: string, f: string, m: string, code: AttrCode, name: string): TitleDef => ({ id, f, m, rule: `${name} 100`, need: 100, have: (c) => c.attrs[code] });

/** Títulos das regiões da Campanha (id, feminino, masculino, região, nome da região). */
const REGION_TITLES: [string, string, string, string, string][] = [
  ['viajante', 'Viajante', 'Viajante', 'vila', 'a Vila do Começo'],
  ['lobos', 'Caçadora de Lobos', 'Caçador de Lobos', 'floresta', 'a Floresta da Rotina'],
  ['arena', 'Campeã da Arena', 'Campeão da Arena', 'arena', 'a Arena de Ferro'],
  ['mercado', 'Mestra do Mercado', 'Mestre do Mercado', 'mercado', 'o Mercado de Ouro'],
  ['serpentes', 'Domadora de Serpentes', 'Domador de Serpentes', 'pantano', 'o Pântano das Tentações'],
  ['saber', 'Guardiã do Saber', 'Guardião do Saber', 'torre', 'a Torre do Saber'],
  ['calma', 'Jardineira da Calma', 'Jardineiro da Calma', 'jardim', 'o Jardim da Calma'],
  ['montanha', 'Alpinista', 'Alpinista', 'montanha', 'a Montanha da Disciplina'],
  ['ordem', 'Senhora da Ordem', 'Senhor da Ordem', 'castelo', 'o Castelo do Caos'],
];

export const TITLES: TitleDef[] = [
  { id: 'aprendiz', f: 'Aprendiz', m: 'Aprendiz', rule: 'Começar a Jornada', need: 1, have: (c) => (c.d.settings.journeyUnlockedAt ? 1 : 0) },
  { id: 'contas', f: 'Guardiã das Contas', m: 'Guardião das Contas', rule: '3 meses com todas as contas pagas no prazo', need: 3, have: (c) => monthsAllOnTime(c.d, c.today).length },
  { id: 'tesouro', f: 'Tesoureira', m: 'Tesoureiro', rule: '3 meses seguidos com sobra positiva', need: 3, have: (c) => bestPositiveRun(c.d, c.today) },
  { id: 'poupadora', f: 'Poupadora', m: 'Poupador', rule: 'Encher uma caixinha até a meta', need: 1, have: (c) => ((c.d.boxes ?? []).some((b) => b.marks.includes(100)) ? 1 : 0) },
  { id: 'realizadora', f: 'Realizadora', m: 'Realizador', rule: 'Usar uma caixinha para realizar o objetivo', need: 1, have: (c) => ((c.d.boxes ?? []).some((b) => b.realizedAt && b.realizedAt <= c.today) ? 1 : 0) },
  { id: 'madrugada', f: 'Madrugadora', m: 'Madrugador', rule: '30 dias de rituais da manhã cumpridos', need: 30, have: (c) => checkDays(c.d, (h) => h.period === 'manha', c.today).size },
  { id: 'inquebravel', f: 'Inquebrável', m: 'Inquebrável', rule: 'Sequência de 30 dias num hábito', need: 30, have: (c) => Math.max(0, ...c.d.habits.map((h) => bestStreak(h, c.today))) },
  { id: 'tempo', f: 'Mestra do Tempo', m: 'Mestre do Tempo', rule: '12 revisões semanais feitas', need: 12, have: (c) => c.d.journal.filter((j) => isReview(j.tag)).length },
  { id: 'cronista', f: 'Cronista', m: 'Cronista', rule: '100 registros no diário', need: 100, have: (c) => c.d.journal.filter((j) => !isReview(j.tag)).length },
  { id: 'fenix', f: 'Fênix', m: 'Fênix', rule: '30 dias limpo depois de uma recaída', need: 30, have: (c) => cleanAfterSlip(c.d, c.today) },
  attrTitle('tita', 'Titã', 'Titã', 'FOR', 'Força'),
  attrTitle('ventania', 'Ventania', 'Ventania', 'AGI', 'Agilidade'),
  attrTitle('erudita', 'Erudita', 'Erudito', 'INT', 'Inteligência'),
  attrTitle('muralha', 'Muralha', 'Muralha', 'RES', 'Resistência'),
  attrTitle('sabia', 'Sábia', 'Sábio', 'SAB', 'Sabedoria'),
  attrTitle('inabalavel', 'Inabalável', 'Inabalável', 'DIS', 'Disciplina'),
  { id: 'lenda', f: 'Lendária', m: 'Lendário', rule: 'Todos os atributos em 100', need: 6, have: (c) => ATTR_CODES.filter((k) => c.attrs[k] >= 100).length },
  ...REGION_TITLES.map(([id, f, m, region, name]) => ({ id, f, m, rule: `Campanha · concluir ${name}`, need: 1, have: (c: TitleContext) => ((c.d.journey?.camp?.cleared ?? []).some((x) => x.id === region) ? 1 : 0) })),
  { id: 'codex', f: 'Lenda do Codex', m: 'Lenda do Codex', rule: 'Descobrir tudo o que existe no Codex', need: 100, have: (c) => codexPct(c.d.journey?.owned ?? []) },
];

export interface TitleProgress {
  id: string;
  f: string;
  m: string;
  rule: string;
  have: number;
  need: number;
  earned: boolean;
}

export function titleProgress(c: TitleContext): TitleProgress[] {
  return TITLES.map((t) => {
    const have = t.have(c);
    return { id: t.id, f: t.f, m: t.m, rule: t.rule, have: Math.min(have, t.need), need: t.need, earned: have >= t.need };
  });
}

// ---------- Baús ----------

export type ChestKind = 'bronze' | 'prata' | 'dourado' | 'cristal';

export interface Chest {
  key: string;
  kind: ChestKind;
  date: string;
  reason: string;
}

export const CRISTAL_MILESTONES = [7, 14, 30, 60];
const CRYSTALS_FOR: Record<number, number> = { 7: 1, 14: 1, 30: 2, 60: 3 };

/** Todos os baús já merecidos, calculados a partir dos dados (abertos ou não). */
export function earnedChests(d: AppData, today: string = todayISO(), level = 1): Chest[] {
  const out: Chest[] = [];

  // Bronze a cada 7 dias seguidos com algum ritual/hábito feito; prata a cada 30.
  const days = [...checkDays(d, () => true, today)].sort();
  let run = 0;
  days.forEach((day, i) => {
    run = i > 0 && diffDays(days[i - 1], day) === 1 ? run + 1 : 1;
    if (run % 7 === 0) out.push({ key: `bronze:${day}`, kind: 'bronze', date: day, reason: `${run} dias seguidos de rotina` });
    if (run % 30 === 0) out.push({ key: `prata:${day}`, kind: 'prata', date: day, reason: `${run} dias de consistência` });
  });

  // Prata: revisão semanal com 80% da rotina feita.
  const reviewed = new Set<string>();
  for (const j of d.journal.filter((x) => isReview(x.tag))) {
    const day = dayOf(j.createdAt);
    const start = defaultReviewWeek(day);
    if (reviewed.has(start)) continue;
    reviewed.add(start);
    const r = weekReview(d, start, today);
    if (r.routineScheduled > 0 && r.routineDone / r.routineScheduled >= 0.8) out.push({ key: `prata:revisao:${start}`, kind: 'prata', date: day, reason: 'Revisão com 80% da rotina' });
  }

  // Dourado: a cada 5 níveis e a cada mês com todas as contas em dia.
  for (let n = 5; n <= level; n += 5) out.push({ key: `dourado:nivel:${n}`, kind: 'dourado', date: today, reason: `Chegou ao nível ${n}` });
  for (const m of monthsAllOnTime(d, today)) out.push({ key: `dourado:mes:${m}`, kind: 'dourado', date: `${m}-01`, reason: 'Mês com todas as contas em dia' });

  // Cristal: 7, 14, 30 e 60 dias sem um hábito a abandonar (a contagem recomeça na recaída).
  for (const h of d.habits.filter((x) => x.kind === 'abandonar' && x.startDate <= today)) {
    const starts = [h.startDate, ...h.slips.filter((s) => s > h.startDate && s <= today).sort()];
    starts.forEach((start, i) => {
      const end = starts[i + 1] ?? today;
      const len = diffDays(start, end) - (starts[i + 1] ? 1 : 0);
      for (const m of CRISTAL_MILESTONES)
        if (len >= m) out.push({ key: `cristal:${h.id}:${start}:${m}`, kind: 'cristal', date: addDays(start, m), reason: `${m} dias sem: ${h.name}` });
    });
  }
  // N2.17e: marcos da caixinha (25% e 75% bronze, 50% prata, 100% dourado), uma vez por caixinha.
  for (const b of d.boxes ?? []) {
    if (!b.target) continue;
    let bal = 0;
    const when: Record<number, string> = {};
    for (const m of [...b.moves].sort((x, y) => x.date.localeCompare(y.date))) {
      bal += m.kind === 'retirada' ? -m.amount : m.amount;
      for (const mk of [25, 50, 75, 100]) if (!when[mk] && bal >= (b.target * mk) / 100) when[mk] = m.date;
    }
    for (const mk of b.marks) {
      const date = when[mk] ?? b.createdAt.slice(0, 10);
      if (date > today) continue;
      out.push({ key: `${mk === 100 ? 'dourado' : mk === 50 ? 'prata' : 'bronze'}:caixinha:${b.id}:${mk}`, kind: mk === 100 ? 'dourado' : mk === 50 ? 'prata' : 'bronze', date, reason: `${b.name}: ${mk}% da meta` });
    }
  }
  // N2.17g2: região da Campanha concluída (Vila prata; as outras dourado ou cristal).
  for (const c of d.journey?.camp?.cleared ?? []) {
    const kind = c.id === 'vila' ? 'prata' : c.id === 'pantano' || c.id === 'castelo' ? 'cristal' : 'dourado';
    if (c.at <= today) out.push({ key: `${kind}:campanha:${c.id}`, kind, date: c.at, reason: `Campanha: região concluída` });
  }
  // N2.7: marcos de descoberta do Codex (25% prata, 50% dourado, 75% cristal).
  const pct = codexPct(d.journey?.owned ?? []);
  for (const [m, kind] of [[25, 'prata'], [50, 'dourado'], [75, 'cristal']] as const) if (pct >= m) out.push({ key: `${kind}:codex:${m}`, kind, date: today, reason: `Codex com ${m}% descoberto` });
  // N2.6: presentes de visita que vêm como baú (7º dia da tira e marcos de 14 e 30 dias).
  for (const g of d.journey?.gifts ?? []) if (g.chest) out.push({ key: `${g.chest}:visita:${g.day}`, kind: g.chest, date: g.day, reason: `${g.n} dias seguidos abrindo o app` });
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.key.localeCompare(b.key));
}

export function pendingChests(d: AppData, state: JourneyState, today: string = todayISO(), level = 1): Chest[] {
  const opened = new Set(state.chests.map((c) => c.key));
  return earnedChests(d, today, level).filter((c) => !opened.has(c.key));
}

/** Número pseudoaleatório estável (0–1) a partir de um texto: o mesmo baú sempre dá o mesmo resultado. */
export function hash01(s: string, salt = 0): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

const chestPool = (rarity: Rarity, owned: string[]) => ITEMS.filter((i) => i.rarity === rarity && !i.starter && !owned.includes(i.id));

/** N2.17c: abre vários baús de uma vez (o mesmo baú sempre dá o mesmo conteúdo, então a ordem não importa). */
export function openChests(state: JourneyState, chests: Chest[], today: string = todayISO()): { state: JourneyState; records: ChestRecord[] } {
  let st = state;
  const records: ChestRecord[] = [];
  for (const c of chests) {
    if (st.chests.some((x) => x.key === c.key)) continue;
    const r = openChest(st, c, today);
    st = r.state;
    records.push(r.record);
  }
  return { state: st, records };
}

/** Abre um baú: sorteia (de forma estável) ouro, cristais e um item que você ainda não tem. */
export function openChest(state: JourneyState, chest: Chest, today: string = todayISO()): { state: JourneyState; record: ChestRecord } {
  if (state.chests.some((c) => c.key === chest.key)) throw new Error('Baú já aberto');
  const r = (salt: number) => hash01(chest.key, salt);
  const pick = (list: Item[]) => (list.length ? list[Math.floor(r(2) * list.length)] : null);
  let gold = 0;
  let crystals = 0;
  let item: Item | null = null;
  switch (chest.kind) {
    case 'bronze':
      gold = 40 + Math.round(r(1) * 20);
      item = r(3) < 0.5 ? pick(chestPool('comum', state.owned)) : null;
      break;
    case 'prata':
      gold = 80 + Math.round(r(1) * 40);
      item = pick(chestPool('raro', state.owned));
      break;
    case 'dourado':
      gold = 150 + Math.round(r(1) * 50);
      item = (r(3) < 0.4 ? pick(chestPool('epico', state.owned)) : null) ?? pick(chestPool('raro', state.owned)) ?? pick(chestPool('epico', state.owned));
      break;
    case 'cristal': {
      gold = 100;
      crystals = CRYSTALS_FOR[Number(chest.key.split(':').pop())] ?? 1;
      item = pick(chestPool('epico', state.owned)) ?? pick(chestPool('raro', state.owned));
      break;
    }
  }
  if (!item && chest.kind !== 'bronze') gold += 150; // já tem tudo daquele tipo: vira ouro
  const record: ChestRecord = { key: chest.key, kind: chest.kind, openedAt: today, gold, crystals, item: item?.id ?? null };
  return { state: { ...state, chests: [...state.chests, record], owned: item ? [...state.owned, item.id] : state.owned }, record };
}

// ---------- Carteira: ouro e cristais ----------

export function wallet(d: AppData, state: JourneyState, today: string = todayISO()) {
  const stats = journeyStats(d, today);
  const attrs = attributes(d, today);
  const titles = titleProgress({ d, today, attrs }).filter((t) => t.earned).length;
  const goldEarned = stats.gold + sum(state.chests.map((c) => c.gold)) + sum(state.gifts.map((g) => g.gold)) + sum(state.games.prizes.map((g) => g.gold));
  const crystalsEarned = titles + sum(state.chests.map((c) => c.crystals));
  return {
    level: stats.level,
    xp: stats.xp,
    attrs,
    gold: Math.max(0, goldEarned - state.goldSpent),
    crystals: Math.max(0, crystalsEarned - state.crystalsSpent),
    goldEarned,
    crystalsEarned,
  };
}

// ---------- Loja, liberações e forja ----------

const meets = (attrs: Attrs, req: Partial<Attrs> | undefined) => !req || (Object.keys(req) as AttrCode[]).every((k) => attrs[k] >= (req[k] ?? 0));

export interface Requirement {
  code: AttrCode | 'cristais' | 'limpo';
  have: number;
  need: number;
  ok: boolean;
}

export type Availability =
  | { status: 'tem' }
  | { status: 'comprar'; price: number; canAfford: boolean }
  | { status: 'liberar' }
  | { status: 'bau'; unlock: Requirement[] }
  | { status: 'forja'; ready: boolean; reqs: Requirement[] };

export interface ShopContext {
  attrs: Attrs;
  gold: number;
  crystals: number;
  level: number;
  /** Maior período limpo depois de uma recaída (para a Pena da fênix). */
  cleanAfterSlip: number;
  /** N2.6: progresso das conquistas que liberam pets (id → tem/precisa). */
  petGoals?: Record<string, { have: number; need: number }>;
}

const reqList = (attrs: Attrs, req: Partial<Attrs> = {}): Requirement[] =>
  (Object.keys(req) as AttrCode[]).map((k) => ({ code: k, have: Math.min(attrs[k], req[k]!), need: req[k]!, ok: attrs[k] >= req[k]! }));

/** O que dá para fazer com um item: já tem, comprar, liberar de graça, esperar baú ou forjar. */
export function availability(item: Item, state: JourneyState, c: ShopContext): Availability {
  if (state.owned.includes(item.id)) return { status: 'tem' };
  // Itens de região: vêm da campanha (ou de baús); não se compram nem se forjam.
  if (item.campaign) return { status: 'bau', unlock: [] };
  if (item.rarity === 'mistico') {
    const reqs = reqList(c.attrs, item.req);
    if (item.extra) reqs.push({ code: 'limpo', have: Math.min(c.cleanAfterSlip, item.extra.cleanAfterSlip), need: item.extra.cleanAfterSlip, ok: c.cleanAfterSlip >= item.extra.cleanAfterSlip });
    reqs.push({ code: 'cristais', have: Math.min(c.crystals, item.crystals ?? 0), need: item.crystals ?? 0, ok: c.crystals >= (item.crystals ?? 0) });
    return { status: 'forja', ready: reqs.every((r) => r.ok), reqs };
  }
  if (item.attrUnlock && meets(c.attrs, item.attrUnlock)) return { status: 'liberar' };
  if (item.price) return { status: 'comprar', price: item.price, canAfford: c.gold >= item.price };
  return { status: 'bau', unlock: reqList(c.attrs, item.attrUnlock) };
}

/** Compra, libera ou forja. Devolve o novo estado, ou um motivo quando não dá. */
export function acquire(state: JourneyState, itemId: string, c: ShopContext): JourneyState | string {
  const item = itemById(itemId);
  if (!item) return 'Item desconhecido';
  const a = availability(item, state, c);
  const add = (patch: Partial<JourneyState> = {}) => ({ ...state, ...patch, owned: [...state.owned, item.id] });
  switch (a.status) {
    case 'tem':
      return 'Você já tem este item';
    case 'liberar':
      return add();
    case 'comprar':
      return a.canAfford ? add({ goldSpent: state.goldSpent + a.price }) : `Faltam ${a.price - c.gold} de ouro`;
    case 'forja':
      return a.ready ? add({ crystalsSpent: state.crystalsSpent + (item.crystals ?? 0) }) : 'Ainda faltam requisitos';
    default:
      return 'Este item vem em baús ou treinando o atributo';
  }
}

export const ARTIFACT2_LEVEL = RING2_LEVEL;
export type EquipSlot = Slot | 'anel2' | 'pet' | 'morada';

/** Veste um item que a pessoa já tem (ou tira, com `null`, onde for permitido). */
export function equip(state: JourneyState, slot: EquipSlot, id: string | null, level: number): JourneyState | string {
  if (id === null) {
    if (slot === 'armadura' || slot === 'botas' || slot === 'morada') return 'Este espaço não pode ficar vazio';
    return { ...state, equipped: { ...state.equipped, [slot]: null } };
  }
  if (!state.owned.includes(id)) return 'Você ainda não tem este item';
  if (slot === 'anel2' && level < RING2_LEVEL) return `O segundo anel abre no nível ${RING2_LEVEL}`;
  if (slot === 'pet' ? !PETS.some((p) => p.id === id) : slot === 'morada' ? !HOMES.some((h) => h.id === id) : itemById(id)?.slot !== (slot === 'anel2' ? 'anel' : slot))
    return 'Este item não vai neste espaço';
  const other = slot === 'anel' ? 'anel2' : slot === 'anel2' ? 'anel' : null;
  const equipped = { ...state.equipped, [slot]: id };
  if (other && equipped[other] === id) equipped[other] = null;
  // Campanha (Vila do Começo): "vista um item do Arsenal".
  const dressed = slot !== 'pet' && slot !== 'morada' && !state.camp.dressed;
  return { ...state, equipped, ...(dressed ? { camp: { ...state.camp, dressed: true } } : {}) };
}

/** Pets e moradas: liberados por nível (e atributo); algumas moradas também custam ouro. */
export function placeAvailability(kind: 'pet' | 'morada', id: string, state: JourneyState, c: ShopContext): Availability {
  if (state.owned.includes(id)) return { status: 'tem' };
  const def = kind === 'pet' ? PETS.find((p) => p.id === id) : HOMES.find((h) => h.id === id);
  if (!def) return { status: 'bau', unlock: [] };
  const goal = kind === 'pet' ? c.petGoals?.[id] : undefined;
  const ready = c.level >= def.level && meets(c.attrs, def.attrUnlock) && (!goal || goal.have >= goal.need);
  const price = kind === 'morada' ? (def as Home).price : undefined;
  if (!ready) return { status: 'bau', unlock: reqList(c.attrs, def.attrUnlock) };
  if (price) return { status: 'comprar', price, canAfford: c.gold >= price };
  return { status: 'liberar' };
}

export function acquirePlace(kind: 'pet' | 'morada', id: string, state: JourneyState, c: ShopContext): JourneyState | string {
  const a = placeAvailability(kind, id, state, c);
  if (a.status === 'tem') return 'Você já tem';
  if (a.status === 'liberar') return { ...state, owned: [...state.owned, id] };
  if (a.status === 'comprar') return a.canAfford ? { ...state, goldSpent: state.goldSpent + a.price, owned: [...state.owned, id] } : `Faltam ${a.price - c.gold} de ouro`;
  return 'Ainda não liberado';
}

/** Bônus do que está vestido: +10% de XP no atributo do item; Estrela polar dá +10% em tudo. */
export function equipmentBonus(state: JourneyState) {
  const xpByAttr = zero();
  let all = 0;
  const e = state.equipped;
  for (const id of [e.anel, e.anel2, e.colar, e.magico]) {
    const it = id ? itemById(id) : undefined;
    if (it?.boosts) xpByAttr[it.boosts] += 0.1;
    if (it?.id === 'polar') all += 0.1;
  }
  return { xpByAttr, xpAll: all, goldAll: all };
}

/** Atributos ganhos nos últimos 30 dias (desempate de classe). */
export const recentAttributes = (d: AppData, today: string = todayISO()) => attributes(d, today, addDays(today, -29));

// ---------- Visitas: abrir o app já conta ----------

/** Ouro dos dias 1 a 6 da tira de presentes; o 7º dia é um baú de bronze, e a tira recomeça. */
export const VISIT_GIFTS = [10, 15, 20, 25, 30, 40];
/** Marcos de dias seguidos de visita. */
export const VISIT_MILESTONES: Record<number, { chest?: ChestKind; title?: string }> = {
  7: { chest: 'bronze' },
  14: { chest: 'prata' },
  30: { chest: 'dourado', title: 'assidua' },
  100: { title: 'centenaria' },
  365: { title: 'anual' },
};

/**
 * Sequência de visitas com uma folga por semana (segunda a domingo): um dia sem abrir o app não
 * quebra a sequência se for o único daquela semana. Hoje ainda sem visita também não quebra.
 * O recorde e o total nunca diminuem.
 */
export function visitStats(visitDays: string[], today: string = todayISO()) {
  const set = new Set(visitDays.filter((d) => d <= today));
  const sorted = [...set].sort();
  if (!sorted.length) return { streak: 0, best: 0, total: 0, visitedToday: false };
  let streak = 0;
  let best = 0;
  let folgaWeek: string | null = null;
  for (let d = sorted[0], guard = 0; d <= today && guard < 4000; d = addDays(d, 1), guard++) {
    if (set.has(d)) {
      streak++;
      best = Math.max(best, streak);
    } else if (d !== today) {
      const wk = weekStart(d);
      if (streak > 0 && folgaWeek !== wk) folgaWeek = wk;
      else streak = 0;
    }
  }
  return { streak, best, total: set.size, visitedToday: set.has(today) };
}

/** Presente do n-ésimo dia seguido de visita (n ≥ 1). */
export function visitGift(n: number): { gold: number; chest: ChestKind | null; milestone: (typeof VISIT_MILESTONES)[number] | null } {
  const pos = ((n - 1) % 7) + 1;
  return { gold: pos === 7 ? 0 : VISIT_GIFTS[pos - 1], chest: pos === 7 ? 'bronze' : null, milestone: VISIT_MILESTONES[n] ?? null };
}

// ---------- Boas-vindas (N2.1) ----------

export const WELCOME_KEY = 'boas-vindas';
export const welcomed = (state: JourneyState) => state.avatar !== null && state.chests.some((c) => c.key === WELCOME_KEY);

/** Fim da chegada: avatar com nome, baú de boas-vindas (botas de couro, 50 de ouro, 1 cristal) e o pet escolhido. */
export function welcomeState(state: JourneyState, avatar: { gender: 'f' | 'm'; skin: string; hair: string; name: string }, pet: 'gato' | 'cao', today: string): JourneyState {
  const look = { ...avatar, name: avatar.name.trim().slice(0, 14) };
  if (state.chests.some((c) => c.key === WELCOME_KEY)) return { ...state, avatar: look };
  return {
    ...state,
    avatar: look,
    owned: Array.from(new Set([...state.owned, 'couro', pet])),
    equipped: { ...state.equipped, botas: 'couro', pet },
    chests: [...state.chests, { key: WELCOME_KEY, kind: 'dourado', openedAt: today, gold: 50, crystals: 1, item: 'couro' }],
    // N2.17g1: no dia da chegada quem fala é a Mestra Lume; o Resumo da semana começa na semana seguinte.
    weekSeen: weekStart(today),
  };
}

// ---------- N2.2: cartão no Início ----------

export interface HomeCard {
  name: string;
  level: number;
  /** Barra fina de XP (0–100). */
  pct: number;
  /** Uma linha só, com a coisa mais importante agora. */
  status: string;
  /** Pede atenção (baú esperando ou personagem por criar): ponto verde. */
  dot: boolean;
}

/**
 * O cartão da Jornada no Início (Anexo E.1). Só aparece com a Jornada desbloqueada, o Modo Jornada ligado
 * ("Quero a Jornada") e "Mostrar a Jornada no Início" ligado. Por enquanto o status mostra, nesta ordem:
 * personagem por criar, novidades desde a última visita (N2.3), baús esperando, quanto falta para o próximo nível. O chefe entra com a campanha.
 */
export function homeCard(d: AppData, today: string = todayISO()): HomeCard | null {
  if (!unlockProgress(d, today).unlocked) return null;
  if (d.settings.journeyChoice !== 'quero' || !d.settings.journeyCard) return null;
  const s = journeyStats(d, today);
  const state = d.journey;
  const base = { name: state.avatar?.name.trim() ?? '', level: s.level, pct: Math.round((s.xpInLevel / s.xpForNext) * 100) };
  if (!welcomed(state)) return { ...base, status: 'Crie seu personagem para começar', dot: true };
  const news = sinceLastVisit(state.lastSeen, snapshot(d, state, today));
  if (news) return { ...base, status: newsLine(news), dot: true };
  const chests = pendingChests(d, state, today, s.level).length;
  if (chests) return { ...base, status: chests === 1 ? '1 baú esperando' : `${chests} baús esperando`, dot: true };
  const left = s.xpForNext - s.xpInLevel;
  return { ...base, status: `Faltam ${left.toLocaleString('pt-BR')} XP para o nível ${s.level + 1}`, dot: false };
}

// ---------- N2.3: "Desde a sua última visita" ----------

function normalizeSnapshot(raw: unknown): JourneySnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<JourneySnapshot>;
  if (typeof r.date !== 'string') return null;
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
  const attrs = Object.fromEntries(ATTR_CODES.map((c) => [c, n((r.attrs as Partial<Attrs> | undefined)?.[c])])) as Attrs;
  return { date: r.date, level: Math.max(1, n(r.level)), xp: n(r.xp), gold: n(r.gold), crystals: n(r.crystals), attrs, chests: n(r.chests) };
}

/** O retrato de agora (usa o que foi ganho, então gastar na loja não aparece como perda). */
export function snapshot(d: AppData, state: JourneyState, today: string = todayISO()): JourneySnapshot {
  const w = wallet(d, state, today);
  return { date: today, level: w.level, xp: w.xp, gold: w.goldEarned, crystals: w.crystalsEarned, attrs: { ...w.attrs }, chests: earnedChests(d, today, w.level).length };
}

export interface SinceVisit {
  days: number;
  xp: number;
  gold: number;
  crystals: number;
  levels: number;
  attrs: { code: AttrCode; gain: number }[];
  chests: number;
}

/** A diferença desde a última visita, ou null quando não há retrato ou nada mudou. */
export function sinceLastVisit(prev: JourneySnapshot | null, now: JourneySnapshot): SinceVisit | null {
  if (!prev) return null;
  const pos = (n: number) => Math.max(0, n);
  const out: SinceVisit = {
    days: pos(diffDays(prev.date, now.date)),
    xp: pos(now.xp - prev.xp),
    gold: pos(now.gold - prev.gold),
    crystals: pos(now.crystals - prev.crystals),
    levels: pos(now.level - prev.level),
    attrs: ATTR_CODES.map((code) => ({ code, gain: pos(now.attrs[code] - prev.attrs[code]) })).filter((a) => a.gain > 0),
    chests: pos(now.chests - prev.chests),
  };
  return out.xp || out.gold || out.crystals || out.levels || out.attrs.length || out.chests ? out : null;
}

/** Texto curto das novidades, para o cartão do Início ("Novidades: +80 XP · 1 baú"). */
export function newsLine(n: SinceVisit): string {
  const parts: string[] = [];
  if (n.levels) parts.push(n.levels === 1 ? 'subiu de nível' : `+${n.levels} níveis`);
  if (n.xp) parts.push(`+${n.xp.toLocaleString('pt-BR')} XP`);
  if (n.chests) parts.push(n.chests === 1 ? '1 baú' : `${n.chests} baús`);
  if (!parts.length && n.gold) parts.push(`+${n.gold.toLocaleString('pt-BR')} ouro`);
  if (!parts.length && n.attrs.length) parts.push('atributos subiram');
  if (!parts.length && n.crystals) parts.push(n.crystals === 1 ? '+1 cristal' : `+${n.crystals} cristais`);
  return `Novidades: ${parts.join(' · ')}`;
}

// ---------- N2.4: Arsenal e loja ----------

/** Tudo o que a loja precisa saber de uma vez: atributos, ouro, cristais, nível e período limpo. */
export function shopContext(d: AppData, state: JourneyState, today: string = todayISO()): ShopContext {
  const w = wallet(d, state, today);
  const goals = Object.fromEntries(Object.entries(petGoals(d, today)).map(([k, g]) => [k, { have: g.have, need: g.need }]));
  return { attrs: w.attrs, gold: w.gold, crystals: w.crystals, level: w.level, cleanAfterSlip: cleanAfterSlip(d, today), petGoals: goals };
}

/** Itens de um espaço para o Arsenal, sem os místicos (esses ficam na Forja): os seus primeiro, depois por raridade e preço. */
export function arsenalItems(slot: Slot, state: JourneyState): Item[] {
  const rank: Record<Rarity, number> = { comum: 0, raro: 1, epico: 2, mistico: 3 };
  return ITEMS.filter((i) => i.slot === slot && i.rarity !== 'mistico').sort(
    (a, b) => Number(state.owned.includes(b.id)) - Number(state.owned.includes(a.id)) || rank[a.rarity] - rank[b.rarity] || (a.price ?? 0) - (b.price ?? 0),
  );
}

// ---------- N2.6: pets, pelagens e presente do dia ----------

/** Como cada pet é liberado (F.3). Nível e atributos ficam em PETS; aqui, as conquistas ligadas ao app. */
export function petGoals(d: AppData, today: string = todayISO()): Record<string, { hint: string; have: number; need: number }> {
  const stats = journeyStats(d, today);
  const visits = visitStats(d.settings.visitDays, today);
  const days = [...checkDays(d, () => true, today)].sort();
  let run = 0;
  let bestRun = 0;
  days.forEach((day, i) => {
    run = i > 0 && diffDays(days[i - 1], day) === 1 ? run + 1 : 1;
    bestRun = Math.max(bestRun, run);
  });
  const diary = d.journal.filter((j) => j.tag !== 'Revisão').length;
  const tasks = d.tasks.filter((t) => t.done).length;
  const half = d.boxes.some((b) => b.marks.includes(50)) ? 1 : 0;
  return {
    gato: { hint: 'Companheiro inicial; quem escolheu o cão ganha o gato no nível 7', have: 0, need: 0 },
    cao: { hint: 'Companheiro inicial; quem escolheu o gato ganha o cão no nível 7', have: 0, need: 0 },
    coelho: { hint: 'Cumprir 150 missões (hábitos, contas, tarefas…)', have: stats.missions, need: 150 },
    coruja: { hint: '80 registros no diário', have: diary, need: 80 },
    beijaflor: { hint: '20 tarefas concluídas na Agenda', have: tasks, need: 20 },
    esquilo: { hint: 'Uma caixinha chegar a 50% da meta', have: half, need: 1 },
    tartaruga: { hint: '30 dias seguidos de rotina', have: bestRun, need: 30 },
    raposa: { hint: '30 dias seguidos abrindo o app', have: visits.best, need: 30 },
    cavalo: { hint: 'Nível 12 e Agilidade 50', have: 0, need: 0 },
    lobo: { hint: 'Chegar ao nível 15 (ou vencer o Lobo da Preguiça na Campanha)', have: 0, need: 0 },
    sapinho: { hint: '60 dias abrindo o app (ou vencer a Serpente do Vício)', have: visits.total, need: 60 },
    golem: { hint: 'Vencer o Gigante da Desordem na Campanha (em breve)', have: 0, need: 1 },
    fenix: { hint: '30 dias limpo depois de uma recaída', have: cleanAfterSlip(d, today), need: 30 },
    dragao: { hint: 'Chegar ao nível 50 (ou vencer o Senhor do Caos)', have: 0, need: 0 },
    grifo: { hint: '365 dias abrindo o app', have: visits.total, need: 365 },
    unicornio: { hint: 'Todos os atributos em 100', have: 0, need: 0 },
  };
}

/** Pelagens raras: prêmio de dias seguidos abrindo o app. */
export const RARE_VARIANTS: Record<string, number> = { visitas30: 30, visitas100: 100, visitas365: 365 };

/** Presentes do dia ainda não recebidos: dias com o app aberto nos últimos 7 dias (desde o desbloqueio). */
export function pendingGifts(d: AppData, state: JourneyState, today: string = todayISO()): GiftRecord[] {
  const from = d.settings.journeyUnlockedAt ? d.settings.journeyUnlockedAt.slice(0, 10) : today;
  const claimed = new Set(state.gifts.map((g) => g.day));
  const days = [...new Set(d.settings.visitDays)].filter((x) => x >= from && x >= addDays(today, -6) && x <= today && !claimed.has(x)).sort();
  return days.map((day) => {
    const n = Math.max(1, visitStats(d.settings.visitDays, day).streak);
    const g = visitGift(n);
    const chest = g.milestone?.chest ?? g.chest;
    return { day, n, gold: g.gold, chest };
  });
}

// ---------- N2.12 (ajuste): trocar o visual tocando nos espaços da tela cheia ----------

/**
 * O próximo item de um espaço, na ordem do catálogo, entre os que a pessoa tem. Nos espaços que podem
 * ficar vazios (elmo, arma, anel, colar, mágico, pet), depois do último vem "sem nada" e então recomeça.
 */
export function nextInSlot(state: JourneyState, slot: Slot | 'pet' | 'morada'): string | null {
  const ids =
    slot === 'pet' ? PETS.filter((p) => state.owned.includes(p.id)).map((p) => p.id) : slot === 'morada' ? HOMES.filter((h) => state.owned.includes(h.id)).map((h) => h.id) : ITEMS.filter((i) => i.slot === slot && state.owned.includes(i.id)).map((i) => i.id);
  const canEmpty = slot !== 'armadura' && slot !== 'botas' && slot !== 'morada';
  const cycle: (string | null)[] = canEmpty ? [...ids, null] : ids;
  if (!cycle.length) return null;
  const cur = state.equipped[slot] ?? null;
  const i = cycle.indexOf(cur);
  return cycle[(i + 1) % cycle.length];
}

// ---------- N2.15: cada lugar com uma função ----------

/** Arsenal: só o que a pessoa tem naquele espaço, mais o que acabou de ser liberado pelo atributo ("Novo! Pegar"). */
export function wardrobeItems(slot: Slot, state: JourneyState, c: ShopContext): { item: Item; isNew: boolean }[] {
  return ITEMS.filter((i) => i.slot === slot)
    .map((item) => ({ item, a: availability(item, state, c) }))
    .filter((x) => x.a.status === 'tem' || x.a.status === 'liberar')
    .map((x) => ({ item: x.item, isNew: x.a.status === 'liberar' }));
}

/** Loja: tudo o que se compra com ouro e ainda não é seu (o que ainda não dá aparece apagado, com o que falta). */
export function shopList(state: JourneyState, c: ShopContext) {
  const items = ITEMS.filter((i) => i.price && !state.owned.includes(i.id))
    .map((item) => {
      const a = availability(item, state, c);
      return { item, price: item.price!, missing: a.status === 'comprar' ? Math.max(0, item.price! - c.gold) : 0, free: a.status === 'liberar' };
    })
    .sort((a, b) => a.price - b.price);
  const homes = HOMES.filter((h) => h.price && !state.owned.includes(h.id)).map((h) => ({ home: h, price: h.price!, missing: Math.max(0, h.price! - c.gold), level: c.level >= h.level ? 0 : h.level }));
  return { items, homes };
}

// ---------- N2.7: Codex ----------

/** Tudo o que se coleciona no Codex (itens, pets e casas). */
export const CODEX_IDS: string[] = [...ITEMS.map((i) => i.id), ...PETS.map((p) => p.id), ...HOMES.map((h) => h.id)];

/** Quanto do Codex já foi descoberto (0–100, arredondado para baixo). */
export function codexPct(owned: string[]): number {
  const set = new Set(owned);
  return Math.floor((CODEX_IDS.filter((id) => set.has(id)).length / CODEX_IDS.length) * 100);
}
