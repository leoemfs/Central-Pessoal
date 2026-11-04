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
import { attributeTotals, diffDays, isScheduled, startOf } from '../habits.ts';
import { journeyStats } from '../journey.ts';
import { monthBills } from '../finance.ts';
import { monthBalance } from '../incomes.ts';
import { defaultReviewWeek, weekReview, weekStart } from '../review.ts';
import { addDays, addMonths, monthKey, pad, sum, toISO, todayISO } from '../utils.ts';
import { ATTR_CODES, HOMES, ITEMS, PETS, STARTER_ITEMS, itemById, type AttrCode, type Attrs, type Home, type Item, type Rarity, type Slot } from './catalog.ts';

// ---------- Estado guardado ----------

export interface ChestRecord {
  key: string;
  kind: ChestKind;
  openedAt: string;
  gold: number;
  crystals: number;
  item: string | null;
}

export interface JourneyState {
  /** null enquanto a pessoa não criou o avatar. */
  avatar: { gender: 'f' | 'm'; skin: string; hair: string } | null;
  owned: string[];
  equipped: { elmo: string | null; armadura: string; botas: string; arma: string | null; artefato: string | null; artefato2: string | null; pet: string | null; morada: string };
  goldSpent: number;
  crystalsSpent: number;
  title: string | null;
  chests: ChestRecord[];
  weather: 'aleatorio' | 'limpo';
}

export function defaultJourneyState(): JourneyState {
  return {
    avatar: null,
    owned: [...STARTER_ITEMS, 'cabana'],
    equipped: { elmo: null, armadura: 'aprendiz', botas: 'sapatos', arma: 'madeira', artefato: null, artefato2: null, pet: null, morada: 'cabana' },
    goldSpent: 0,
    crystalsSpent: 0,
    title: 'aprendiz',
    chests: [],
    weather: 'aleatorio',
  };
}

/** Completa um estado vindo de backup ou de versão antiga. */
export function normalizeJourney(raw: unknown): JourneyState {
  const base = defaultJourneyState();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<JourneyState>;
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
  return {
    avatar: r.avatar && (r.avatar.gender === 'f' || r.avatar.gender === 'm') ? { gender: r.avatar.gender, skin: String(r.avatar.skin ?? 'media'), hair: String(r.avatar.hair ?? 'castanho') } : null,
    owned: Array.from(new Set([...base.owned, ...(Array.isArray(r.owned) ? r.owned.filter((x): x is string => typeof x === 'string') : [])])),
    equipped: { ...base.equipped, ...(r.equipped ?? {}) },
    goldSpent: num(r.goldSpent),
    crystalsSpent: num(r.crystalsSpent),
    title: typeof r.title === 'string' ? r.title : base.title,
    chests: Array.isArray(r.chests) ? r.chests.filter((c) => c && typeof c.key === 'string') : [],
    weather: r.weather === 'limpo' ? 'limpo' : 'aleatorio',
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
  a.DIS += 2 * billsOnTime(d, from, to) + 3 * reviews;
  a.SAB += diaryDays;
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

export const TITLES: TitleDef[] = [
  { id: 'aprendiz', f: 'Aprendiz', m: 'Aprendiz', rule: 'Começar a Jornada', need: 1, have: (c) => (c.d.settings.journeyUnlockedAt ? 1 : 0) },
  { id: 'contas', f: 'Guardiã das Contas', m: 'Guardião das Contas', rule: '3 meses com todas as contas pagas no prazo', need: 3, have: (c) => monthsAllOnTime(c.d, c.today).length },
  { id: 'tesouro', f: 'Tesoureira', m: 'Tesoureiro', rule: '3 meses seguidos com sobra positiva', need: 3, have: (c) => bestPositiveRun(c.d, c.today) },
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
  const goldEarned = stats.gold + sum(state.chests.map((c) => c.gold));
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
}

const reqList = (attrs: Attrs, req: Partial<Attrs> = {}): Requirement[] =>
  (Object.keys(req) as AttrCode[]).map((k) => ({ code: k, have: Math.min(attrs[k], req[k]!), need: req[k]!, ok: attrs[k] >= req[k]! }));

/** O que dá para fazer com um item: já tem, comprar, liberar de graça, esperar baú ou forjar. */
export function availability(item: Item, state: JourneyState, c: ShopContext): Availability {
  if (state.owned.includes(item.id)) return { status: 'tem' };
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

export const ARTIFACT2_LEVEL = 20;
export type EquipSlot = Slot | 'artefato2' | 'pet' | 'morada';

/** Veste um item que a pessoa já tem (ou tira, com `null`, onde for permitido). */
export function equip(state: JourneyState, slot: EquipSlot, id: string | null, level: number): JourneyState | string {
  if (id === null) {
    if (slot === 'armadura' || slot === 'botas' || slot === 'morada') return 'Este espaço não pode ficar vazio';
    return { ...state, equipped: { ...state.equipped, [slot]: null } };
  }
  if (!state.owned.includes(id)) return 'Você ainda não tem este item';
  if (slot === 'artefato2' && level < ARTIFACT2_LEVEL) return `O segundo artefato abre no nível ${ARTIFACT2_LEVEL}`;
  if (slot === 'pet' ? !PETS.some((p) => p.id === id) : slot === 'morada' ? !HOMES.some((h) => h.id === id) : itemById(id)?.slot !== (slot === 'artefato2' ? 'artefato' : slot))
    return 'Este item não vai neste espaço';
  const other = slot === 'artefato' ? 'artefato2' : slot === 'artefato2' ? 'artefato' : null;
  const equipped = { ...state.equipped, [slot]: id };
  if (other && equipped[other] === id) equipped[other] = null;
  return { ...state, equipped };
}

/** Pets e moradas: liberados por nível (e atributo); algumas moradas também custam ouro. */
export function placeAvailability(kind: 'pet' | 'morada', id: string, state: JourneyState, c: ShopContext): Availability {
  if (state.owned.includes(id)) return { status: 'tem' };
  const def = kind === 'pet' ? PETS.find((p) => p.id === id) : HOMES.find((h) => h.id === id);
  if (!def) return { status: 'bau', unlock: [] };
  const ready = c.level >= def.level && meets(c.attrs, def.attrUnlock);
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

/** Bônus dos artefatos vestidos: +10% de XP no atributo do artefato; Estrela polar dá +10% em tudo. */
export function equipmentBonus(state: JourneyState) {
  const xpByAttr = zero();
  let all = 0;
  for (const id of [state.equipped.artefato, state.equipped.artefato2]) {
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
