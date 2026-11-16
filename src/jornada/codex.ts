/**
 * Codex (N2.7, F.5 e `jornada-raridades.md`): tudo o que existe na Jornada, por categoria.
 * O que a pessoa tem aparece colorido, com a frase do Codex; o que falta, em silhueta, com a dica
 * de como conquistar e o progresso. Tudo calculado a partir dos dados.
 */
import type { AppData } from '../types.ts';
import { ATTRIBUTES } from '../habits.ts';
import { HOMES, ITEMS, PETS, RARITY, type AttrCode, type Rarity, type Slot } from './catalog.ts';
import { LORE } from './lore.ts';
import { availability, petGoals, placeAvailability, shopContext, titleProgress, attributes, CODEX_IDS, codexPct } from './rules.ts';

export type CodexCat = Slot | 'pet' | 'casa' | 'titulo';
export const CODEX_CATS: { id: CodexCat; label: string }[] = [
  { id: 'pet', label: 'Pets' },
  { id: 'elmo', label: 'Elmos' },
  { id: 'armadura', label: 'Roupas' },
  { id: 'botas', label: 'Botas' },
  { id: 'arma', label: 'Armas' },
  { id: 'artefato', label: 'Artefatos' },
  { id: 'casa', label: 'Casas' },
  { id: 'titulo', label: 'Títulos' },
];

export interface CodexEntry {
  id: string;
  cat: CodexCat;
  name: string;
  rarity: Rarity;
  owned: boolean;
  /** Como conquistar (ou "Seu", com a frase do Codex, quando já é seu). */
  hint: string;
  /** Frase curta do Codex. */
  lore: string;
  have?: number;
  need?: number;
}

const attrName = (c: string) => ATTRIBUTES.find((a) => a.code === c)?.name ?? c;
const fmt = (n: number) => n.toLocaleString('pt-BR');
const RARITY_LORE: Record<Rarity, string> = {
  comum: 'Peça simples para o dia a dia de quem está começando.',
  raro: 'Pouca gente tem. Quem tem, cuidou da rotina para merecer.',
  epico: 'Peça de quem já percorreu um bom caminho.',
  mistico: 'Dizem que só aparece para quem treinou muito.',
};
const lore = (id: string, r: Rarity) => LORE[id] ?? (id === 'fenix' ? LORE.fenix : LORE[`${id}_pena`]) ?? RARITY_LORE[r];

export function codexEntries(d: AppData, today: string): CodexEntry[] {
  const state = d.journey;
  const ctx = shopContext(d, state, today);
  const goals = petGoals(d, today);
  const out: CodexEntry[] = [];
  for (const it of ITEMS) {
    const a = availability(it, state, ctx);
    let hint = 'Sai em baús';
    let have: number | undefined;
    let need: number | undefined;
    if (a.status === 'tem') hint = 'Seu';
    else if (a.status === 'liberar') hint = 'Liberado: é só pegar no Arsenal';
    else if (a.status === 'comprar') hint = `Loja · ${fmt(a.price)} ouro${a.canAfford ? '' : ` (faltam ${fmt(a.price - ctx.gold)})`}`;
    else if (a.status === 'forja') {
      const reqs = a.reqs.map((r) => (r.code === 'cristais' ? `${fmt(r.need)} cristais` : r.code === 'limpo' ? `${r.need} dias limpo` : `${r.code} ${r.need}`));
      hint = `Forja: ${reqs.join(' + ')}${a.ready ? ' · pronto para forjar na Ficha' : ''}`;
      have = a.reqs.filter((r) => r.ok).length;
      need = a.reqs.length;
    } else if (a.status === 'bau' && a.unlock.length) {
      const r = a.unlock[0];
      hint = `Baús, ou ${attrName(r.code)} ${r.need}`;
      have = r.have;
      need = r.need;
    }
    out.push({ id: it.id, cat: it.slot, name: it.name, rarity: it.rarity, owned: a.status === 'tem', hint, lore: lore(it.id, it.rarity), have, need });
  }
  for (const p of PETS) {
    const a = placeAvailability('pet', p.id, state, ctx);
    const g = goals[p.id];
    const levelTxt = p.level > 1 ? `Nível ${p.level}` : '';
    const hint = a.status === 'tem' ? 'Seu' : a.status === 'liberar' ? 'Liberado: é só pegar em Pet' : g.hint || levelTxt;
    out.push({ id: p.id, cat: 'pet', name: state.owned.includes(p.id) ? state.petNames[p.id] || p.name : p.name, rarity: p.rarity, owned: a.status === 'tem', hint, lore: lore(p.id, p.rarity), have: g.need ? Math.min(g.have, g.need) : p.level > 1 ? Math.min(ctx.level, p.level) : undefined, need: g.need || (p.level > 1 ? p.level : undefined) });
  }
  for (const h of HOMES) {
    const a = placeAvailability('morada', h.id, state, ctx);
    const req = h.attrUnlock ? Object.entries(h.attrUnlock).map(([k, v]) => `${attrName(k as AttrCode)} ${v}`).join(' + ') : '';
    const hint = a.status === 'tem' ? 'Sua' : a.status === 'liberar' ? 'Liberada: é só escolher em Casa' : a.status === 'comprar' ? `Loja · ${fmt(a.price)} ouro` : `Nível ${h.level}${h.price ? ` · ${fmt(h.price)} ouro` : ''}${req ? ` · ${req}` : ''}`;
    out.push({ id: h.id, cat: 'casa', name: h.name, rarity: h.rarity, owned: a.status === 'tem', hint, lore: lore(h.id, h.rarity), have: Math.min(ctx.level, h.level), need: h.level });
  }
  const g = d.journey.avatar?.gender ?? 'f';
  for (const t of titleProgress({ d, today, attrs: attributes(d, today) })) {
    out.push({ id: `titulo:${t.id}`, cat: 'titulo', name: t[g], rarity: t.need >= 100 ? 'epico' : t.need >= 30 ? 'raro' : 'comum', owned: t.earned, hint: t.earned ? 'Conquistado' : t.rule, lore: t.rule, have: Math.min(t.have, t.need), need: t.need });
  }
  return out;
}

/** Contador geral (itens, pets e casas) e os marcos de descoberta. */
export function codexSummary(owned: string[]) {
  const set = new Set(owned);
  const have = CODEX_IDS.filter((id) => set.has(id)).length;
  const pct = codexPct(owned);
  const marks = [
    { at: 25, prize: 'Baú de prata' },
    { at: 50, prize: 'Baú dourado' },
    { at: 75, prize: 'Baú de cristal' },
    { at: 100, prize: 'Título Lenda do Codex' },
  ].map((m) => ({ ...m, hit: pct >= m.at }));
  return { have, total: CODEX_IDS.length, pct, marks };
}

export const rarityColor = (r: Rarity) => RARITY[r].color;
