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
import { ARTIFACT2_LEVEL, attributes, titleProgress, type JourneyState } from './rules.ts';
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

export interface NearUnlock {
  id: string;
  name: string;
  kind: string;
  have: number;
  need: number;
  /** Texto do progresso ("41/60", "LV 9/10"). */
  progress: string;
}

const attrName = (c: string) => ATTRIBUTES.find((a) => a.code === c)?.name ?? c;

/** "Perto de desbloquear": as 3 coisas mais perto de chegar (títulos, itens por atributo, pets, casas e o baú dourado). */
export function nearUnlocks(d: AppData, state: JourneyState, today: string, level: number, max = 3): NearUnlock[] {
  const out: NearUnlock[] = [];
  const attrs = attributes(d, today);
  for (const t of titleProgress({ d, today, attrs })) {
    if (t.earned || t.have <= 0) continue;
    out.push({ id: `titulo:${t.id}`, name: t.m, kind: `título · ${t.rule}`, have: t.have, need: t.need, progress: `${Math.min(t.have, t.need)}/${t.need}` });
  }
  for (const it of ITEMS) {
    if (!it.attrUnlock || state.owned.includes(it.id)) continue;
    const [code, need] = Object.entries(it.attrUnlock)[0] as [AttrCode, number];
    const have = attrs[code];
    if (have <= 0 || have >= need) continue;
    out.push({ id: `item:${it.id}`, name: it.name, kind: `item · ${attrName(code)} ${need}`, have, need, progress: `${have}/${need}` });
  }
  for (const p of [...PETS, ...HOMES]) {
    if (state.owned.includes(p.id) || level >= p.level || p.level - level > 10) continue;
    const isPet = PETS.some((x) => x.id === p.id);
    out.push({ id: `${isPet ? 'pet' : 'casa'}:${p.id}`, name: p.name, kind: `${isPet ? 'pet' : 'casa'} · nível ${p.level}`, have: level, need: p.level, progress: `LV ${level}/${p.level}` });
  }
  const nextGold = Math.ceil((level + 1) / 5) * 5;
  out.push({ id: 'bau:dourado', name: 'Baú dourado', kind: 'a cada 5 níveis', have: level - (nextGold - 5), need: 5, progress: `LV ${level}/${nextGold}` });
  return out.sort((a, b) => b.have / b.need - a.have / a.need || a.need - b.need).slice(0, max);
}

/** O que chegar a um nível libera (para a tela "Subiu de nível"). */
export function levelRewards(level: number): { title: string; sub: string; kind: 'bau' | 'pet' | 'casa' | 'espaco' }[] {
  const out: { title: string; sub: string; kind: 'bau' | 'pet' | 'casa' | 'espaco' }[] = [];
  if (level % 5 === 0) out.push({ title: 'Baú dourado', sub: `Por chegar ao nível ${level}. Ele espera em Baús.`, kind: 'bau' });
  for (const p of PETS) if (p.level === level) out.push({ title: `Pet liberado: ${p.name}`, sub: 'Chega com a parte de pets e casas', kind: 'pet' });
  for (const h of HOMES) if (h.level === level) out.push({ title: `Casa liberada: ${h.name}`, sub: h.price ? `${h.price} ouro` : 'De graça', kind: 'casa' });
  if (level === ARTIFACT2_LEVEL) out.push({ title: 'Segundo espaço de artefato', sub: 'Agora dá para usar dois artefatos', kind: 'espaco' });
  return out;
}
