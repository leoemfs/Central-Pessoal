/**
 * Jornada (N2.13): o que a tela principal mostra além da cena e das missões, seguindo as
 * pranchas "v2 · Jornada de dia/noite" e "v1 · Subiu de nível" da prévia "Jornada RPG".
 * Tudo calculado a partir dos dados; nada fica guardado à parte.
 */
import type { AppData } from '../types.ts';
import { addDays } from '../utils.ts';
import { journeyStats } from '../journey.ts';
import { ATTRIBUTES } from '../habits.ts';
import { HOMES, ITEMS, PETS, type AttrCode } from './catalog.ts';
import { ARTIFACT2_LEVEL, CRISTAL_MILESTONES, attributes, availability, earnedChests, pendingChests, placeAvailability, shopContext, titleProgress, visitStats, type JourneyState } from './rules.ts';
import { weekStart } from '../review.ts';
import { diffDays } from '../habits.ts';
import { missionsToday } from './missions.ts';

/** Dias seguidos com algum registro no app, terminando hoje (ou ontem, se hoje ainda não teve). */
export function streakDays(activeDays: string[], today: string): number {
  const set = new Set(activeDays);
  let day = set.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (set.has(day)) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

/** "Seu dia em números": XP e ouro ganhos hoje e missões cumpridas. */
export function dayNumbers(d: AppData, today: string) {
  const now = journeyStats(d, today);
  const before = journeyStats(d, addDays(today, -1));
  const ms = missionsToday(d, today);
  return { xp: Math.max(0, now.xp - before.xp), gold: Math.max(0, now.gold - before.gold), done: ms.filter((m) => m.done).length, total: ms.length };
}

/** O que chegar a um nível libera (para a tela "Subiu de nível"). */
export function levelRewards(level: number): { title: string; sub: string; kind: 'bau' | 'pet' | 'casa' | 'espaco' }[] {
  const out: { title: string; sub: string; kind: 'bau' | 'pet' | 'casa' | 'espaco' }[] = [];
  if (level % 5 === 0) out.push({ title: 'Baú dourado', sub: `Por chegar ao nível ${level}. Ele espera em Baús.`, kind: 'bau' });
  for (const p of PETS) if (p.level === level) out.push({ title: `Pet liberado: ${p.name}`, sub: 'Chega com a parte de pets e casas', kind: 'pet' });
  for (const h of HOMES) if (h.level === level) out.push({ title: `Casa liberada: ${h.name}`, sub: h.price ? `${h.price} ouro` : 'De graça', kind: 'casa' });
  if (level === ARTIFACT2_LEVEL) out.push({ title: 'Segundo espaço de anel', sub: 'Agora dá para usar dois anéis', kind: 'espaco' });
  return out;
}

// ---------- N2.17b: "Quase lá", como na prévia da Jornada ----------

export interface Goal {
  id: string;
  /** Desenho: estrela, baú, item, medalha. */
  icon: { kind: 'estrela' } | { kind: 'bau'; chest: 'bronze' | 'cristal' } | { kind: 'item'; id: string } | { kind: 'medalha'; index: number };
  title: string;
  have: number;
  need: number;
  label: string;
  color: string;
}

const fmtN = (n: number) => n.toLocaleString('pt-BR');

/**
 * "Quase lá" da prévia: próximo nível, baú de bronze dos dias seguidos, baú de cristal do hábito a
 * abandonar, o próximo item liberado por atributo, a Coroa de cristal e o título mais perto.
 */
export function quaseLa(d: AppData, state: JourneyState, today: string): Goal[] {
  const out: Goal[] = [];
  const s = journeyStats(d, today);
  out.push({ id: 'nivel', icon: { kind: 'estrela' }, title: `Nível ${s.level + 1}`, have: s.xpInLevel, need: s.xpForNext, label: `${fmtN(s.xpInLevel)}/${fmtN(s.xpForNext)} XP`, color: 'var(--jn-xp)' });

  const streak = visitStats(d.settings.visitDays, today).streak;
  const left = 7 - (streak % 7);
  out.push({ id: 'bronze', icon: { kind: 'bau', chest: 'bronze' }, title: 'Baú de bronze', have: streak % 7, need: 7, label: left === 1 ? 'amanhã' : `faltam ${left} dias`, color: '#f59e0b' });

  // Hábito a abandonar mais perto do próximo baú de cristal.
  let best: Goal | null = null;
  for (const h of d.habits.filter((x) => x.kind === 'abandonar' && x.startDate <= today)) {
    const last = [h.startDate, ...h.slips.filter((x) => x <= today)].sort().pop()!;
    const clean = diffDays(last, today);
    const next = CRISTAL_MILESTONES.find((m) => m > clean);
    if (!next) continue;
    const prev = [0, ...CRISTAL_MILESTONES].filter((m) => m < next).pop()!;
    const g: Goal = { id: `cristal:${h.id}`, icon: { kind: 'bau', chest: 'cristal' }, title: `Baú de cristal · ${next} dias sem ${h.name.toLowerCase()}`, have: clean - prev, need: next - prev, label: `faltam ${next - clean} ${next - clean === 1 ? 'dia' : 'dias'}`, color: 'var(--jn-crystal)' };
    if (!best || g.have / g.need > best.have / best.need) best = g;
  }
  if (best) out.push(best);

  const attrs = attributes(d, today);
  const next = ITEMS.filter((it) => it.attrUnlock && !state.owned.includes(it.id))
    .map((it) => {
      const [code, need] = Object.entries(it.attrUnlock!)[0] as [AttrCode, number];
      return { it, code, need, gap: need - attrs[code] };
    })
    .filter((x) => x.gap > 0)
    .sort((a, b) => a.gap - b.gap)[0];
  if (next) out.push({ id: `item:${next.it.id}`, icon: { kind: 'item', id: next.it.id }, title: `${next.it.name} · ${next.code} ${next.need}`, have: attrs[next.code], need: next.need, label: `faltam ${next.gap} ${next.code}`, color: ATTRIBUTES.find((a) => a.code === next.code)!.color });

  if (!state.owned.includes('coroa')) {
    const dis = Math.min(100, attrs.DIS);
    out.push({ id: 'coroa', icon: { kind: 'item', id: 'coroa' }, title: 'Coroa de cristal (mística) · DIS 100', have: dis, need: 100, label: attrs.DIS >= 100 ? 'pronta na Forja' : `faltam ${100 - attrs.DIS} DIS`, color: '#fde047' });
  }

  const titles = titleProgress({ d, today, attrs });
  const t = titles
    .map((x, i) => ({ x, i }))
    .filter(({ x }) => !x.earned)
    .sort((a, b) => b.x.have / b.x.need - a.x.have / a.x.need)[0];
  if (t) out.push({ id: `titulo:${t.x.id}`, icon: { kind: 'medalha', index: t.i }, title: `Título: ${state.avatar?.gender === 'f' ? t.x.f : t.x.m}`, have: t.x.have, need: t.x.need, label: t.x.rule.toLowerCase(), color: '#facc15' });
  return out;
}


// ---------- N2.17d: novidades na hora e Resumo da semana ----------

/** O que existe agora para avisar: títulos conquistados, o que dá para pegar, místicos prontos e baús fechados. */
export function journeyNews(d: AppData, state: JourneyState, today: string) {
  const level = journeyStats(d, today).level;
  const attrs = attributes(d, today);
  const ctx = shopContext(d, state, today);
  return {
    titles: titleProgress({ d, today, attrs }).filter((t) => t.earned).map((t) => t.id),
    free: [
      ...ITEMS.filter((it) => !it.campaign && it.rarity !== 'mistico' && availability(it, state, ctx).status === 'liberar').map((it) => it.id),
      ...PETS.filter((p) => placeAvailability('pet', p.id, state, ctx).status === 'liberar').map((p) => p.id),
      ...HOMES.filter((h) => placeAvailability('morada', h.id, state, ctx).status === 'liberar').map((h) => h.id),
    ],
    forge: ITEMS.filter((it) => {
      if (it.rarity !== 'mistico' || it.campaign) return false;
      const a = availability(it, state, ctx);
      return a.status === 'forja' && a.ready;
    }).map((it) => it.id),
    chests: pendingChests(d, state, today, level),
  };
}

/** O que apareceu de novo entre duas leituras de `journeyNews`. */
export function newsDiff(before: ReturnType<typeof journeyNews>, now: ReturnType<typeof journeyNews>) {
  const keys = new Set(before.chests.map((c) => c.key));
  return {
    titles: now.titles.filter((id) => !before.titles.includes(id)),
    free: now.free.filter((id) => !before.free.includes(id)),
    forge: now.forge.filter((id) => !before.forge.includes(id)),
    chests: now.chests.filter((c) => !keys.has(c.key)),
  };
}

export interface WeekSummary {
  /** Segunda e domingo da semana resumida. */
  start: string;
  end: string;
  xp: number;
  gold: number;
  levelFrom: number;
  levelTo: number;
  attrs: { code: AttrCode; gain: number }[];
  /** Baús ganhos na semana (abertos ou não). */
  chests: number;
  missions: number;
}

/** Resumo da semana que acabou (segunda a domingo antes da semana de `today`). Nulo se nada aconteceu. */
export function weekSummary(d: AppData, today: string): WeekSummary | null {
  const start = addDays(weekStart(today), -7);
  const end = addDays(start, 6);
  const before = journeyStats(d, addDays(start, -1));
  const after = journeyStats(d, end);
  const xp = after.xp - before.xp;
  if (xp <= 0) return null;
  const gains = attributes(d, end, start);
  const attrs = (Object.keys(gains) as AttrCode[]).map((code) => ({ code, gain: gains[code] })).filter((a) => a.gain > 0).sort((a, b) => b.gain - a.gain);
  const chests = earnedChests(d, end, after.level).filter((c) => c.date >= start && c.date <= end && !c.key.startsWith('dourado:nivel:')).length + Math.max(0, Math.floor(after.level / 5) - Math.floor(before.level / 5));
  return { start, end, xp, gold: after.gold - before.gold, levelFrom: before.level, levelTo: after.level, attrs, chests, missions: after.missions - before.missions };
}

/** Mostrar o Resumo da semana? Uma vez por semana, a partir de segunda. */
export const showWeekSummary = (state: JourneyState, today: string) => state.weekSeen !== weekStart(today);
