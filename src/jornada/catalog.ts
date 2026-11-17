/**
 * Catálogo da Jornada: equipamentos, pets e moradas, com raridade, como obter e a arte de cada um.
 * Tudo aqui é dado fixo; as regras (quem pode ter o quê) ficam em rules.ts.
 */
import { grid, sprite, toSvg, type Grid, type Palette } from './art.ts';
import { HAIRS, SKINS, SKY_PALETTES } from './artData.ts';
import { PET_SPRITES } from './petsData.ts';
import { PETS24 } from './pets24.ts';
import { avatar24 } from './avatar24.ts';
import { PX } from './px.ts';
import { cabana24, casinha24, castelinho24, castelo24, moon24, sun24, torre24, tree24 } from './scene24.ts';

export type AttrCode = 'FOR' | 'AGI' | 'INT' | 'RES' | 'SAB' | 'DIS';
export const ATTR_CODES: AttrCode[] = ['FOR', 'AGI', 'INT', 'RES', 'SAB', 'DIS'];
export type Attrs = Record<AttrCode, number>;

export type Rarity = 'comum' | 'raro' | 'epico' | 'mistico';
export const RARITY: Record<Rarity, { label: string; color: string }> = {
  comum: { label: 'Comum', color: '#a1a1aa' },
  raro: { label: 'Raro', color: '#60a5fa' },
  epico: { label: 'Épico', color: '#c084fc' },
  mistico: { label: 'Místico', color: '#fde047' },
};

export type Slot = 'elmo' | 'armadura' | 'botas' | 'arma' | 'anel' | 'colar' | 'magico';
export const SLOT_LIST: Slot[] = ['elmo', 'armadura', 'botas', 'arma', 'anel', 'colar', 'magico'];
export const SLOT_NAMES: Record<Slot, string> = { elmo: 'Elmo', armadura: 'Roupa', botas: 'Botas', arma: 'Arma', anel: 'Anel', colar: 'Colar', magico: 'Mágico' };

/** Regiões da campanha (itens que só existem lá). */
export const REGION_NAMES: Record<string, string> = {
  floresta: 'Floresta da Rotina',
  mercado: 'Mercado de Ouro',
  pantano: 'Pântano das Tentações',
  torre: 'Torre do Saber',
  montanha: 'Montanha da Disciplina',
  castelo: 'Castelo do Caos',
  arena: 'Arena de Ferro',
  jardim: 'Jardim da Calma',
};

export interface Item {
  id: string;
  slot: Slot;
  name: string;
  rarity: Rarity;
  /** Arma: espada, cajado ou arco. */
  weapon?: 'espada' | 'cajado' | 'arco';
  /** Já vem com o personagem. */
  starter?: boolean;
  /** Preço na loja, em ouro. */
  price?: number;
  /** Pode sair em baús. */
  chest?: boolean;
  /** Liberado de graça quando o atributo chega ao valor (alternativa ao baú). */
  attrUnlock?: Partial<Attrs>;
  /** Místico: requisitos da forja. */
  req?: Partial<Attrs>;
  /** Místico: requisito extra (Pena da fênix). */
  extra?: { cleanAfterSlip: number };
  /** Místico: custo em cristais. */
  crystals?: number;
  /** Atributo cujo XP ganha +10%. */
  boosts?: AttrCode;
  /** Só existe na campanha (região). */
  campaign?: string;
  effect?: string;
}

// Catálogo da "Prévia da Jornada" (px.ts, 49 itens), com os preços e liberações por atributo da prévia (app.js).
const PRICE: Record<string, number> = { perola: 500, anelFerro: 120, arcoCurto: 150, arcoLongo: 650, capuz: 150, elmo: 600, gibao: 200, malha: 700, couro: 120, ferro: 500, espada: 650, galho: 150, cajado: 650 };
const UNLOCK: Record<string, Partial<Attrs>> = { denteLobo: { FOR: 60 }, anelFoco: { INT: 60 }, arcoElfico: { AGI: 80 }, chapeu: { INT: 50 }, manto: { SAB: 50 }, placas: { FOR: 80 }, rubi: { FOR: 100 }, pena: { AGI: 40 }, bracelete: { FOR: 40 }, grimorio: { INT: 40 }, gota: { RES: 40 }, lanterna: { SAB: 40 }, ampulheta: { DIS: 40 } };
const STARTERS = ['aprendiz', 'sapatos', 'madeira'];
/** +10% de XP nos hábitos de um atributo (o efeito diz "+10% XP em hábitos de ..."). */
const BOOSTS: Record<string, AttrCode> = { pena: 'AGI', bracelete: 'FOR', grimorio: 'INT', gota: 'RES', lanterna: 'SAB', ampulheta: 'DIS', anelFoco: 'INT', denteLobo: 'FOR' };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ITEMS: Item[] = (PX.ITEMS as any[]).map((r) => {
  const it: Item = { id: r.id, slot: r.slot, name: r.name, rarity: r.rarity };
  if (r.kind) it.weapon = r.kind;
  if (STARTERS.includes(r.id)) it.starter = true;
  if (PRICE[r.id]) it.price = PRICE[r.id];
  if (UNLOCK[r.id]) {
    it.attrUnlock = UNLOCK[r.id];
    it.chest = true;
  }
  if (r.req) it.req = r.req;
  if (r.id === 'fenix') it.extra = { cleanAfterSlip: 30 };
  if (r.crystals) it.crystals = r.crystals;
  if (BOOSTS[r.id]) it.boosts = BOOSTS[r.id];
  if (r.campaign) it.campaign = r.campaign;
  if (r.effect) it.effect = r.effect;
  return it;
});

/** Espaços que abrem mais tarde: o segundo anel no nível 20. */
export const RING2_LEVEL = 20;

export interface Pet {
  id: string;
  name: string;
  rarity: Rarity;
  level: number;
  attrUnlock?: Partial<Attrs>;
}
export const PETS: Pet[] = [
  // Gato e cão: um vem na chegada; o outro chega no nível 7 (F.3).
  { id: 'gato', name: 'Gatinho', rarity: 'comum', level: 7 },
  { id: 'cao', name: 'Cãozinho', rarity: 'comum', level: 7 },
  // Os outros chegam por conquistas (regras em rules.ts, PET_GOALS).
  { id: 'coelho', name: 'Coelho', rarity: 'raro', level: 1 },
  { id: 'coruja', name: 'Coruja', rarity: 'raro', level: 1 },
  { id: 'beijaflor', name: 'Beija-flor', rarity: 'raro', level: 1 },
  { id: 'esquilo', name: 'Esquilo', rarity: 'raro', level: 1 },
  { id: 'tartaruga', name: 'Tartaruga', rarity: 'raro', level: 1 },
  { id: 'raposa', name: 'Raposa', rarity: 'raro', level: 1 },
  { id: 'cavalo', name: 'Cavalinho', rarity: 'raro', level: 12, attrUnlock: { AGI: 50 } },
  { id: 'lobo', name: 'Lobo filhote', rarity: 'epico', level: 15 },
  { id: 'sapinho', name: 'Sapinho do pântano', rarity: 'epico', level: 1 },
  { id: 'golem', name: 'Golem de pedra', rarity: 'epico', level: 1 },
  { id: 'fenix', name: 'Fênix filhote', rarity: 'epico', level: 1 },
  { id: 'dragao', name: 'Dragãozinho', rarity: 'mistico', level: 50 },
  { id: 'grifo', name: 'Grifo', rarity: 'mistico', level: 1 },
  { id: 'unicornio', name: 'Unicórnio', rarity: 'mistico', level: 1, attrUnlock: { FOR: 100, AGI: 100, INT: 100, RES: 100, SAB: 100, DIS: 100 } },
];

export interface Home {
  id: string;
  name: string;
  rarity: Rarity;
  level: number;
  price?: number;
  attrUnlock?: Partial<Attrs>;
}
export const HOMES: Home[] = [
  { id: 'cabana', name: 'Barraca de viajante', rarity: 'comum', level: 1 },
  { id: 'casinha', name: 'Casinha', rarity: 'comum', level: 5 },
  { id: 'pedra', name: 'Casa de pedra', rarity: 'raro', level: 15, price: 600 },
  { id: 'torre', name: 'Torre do mago', rarity: 'epico', level: 25, attrUnlock: { INT: 100 } },
  { id: 'castelinho', name: 'Castelinho', rarity: 'epico', level: 30, price: 2000 },
  { id: 'castelo', name: 'Castelo', rarity: 'mistico', level: 50, attrUnlock: { FOR: 100, AGI: 100, INT: 100, RES: 100, SAB: 100, DIS: 100 } },
];

export const STARTER_ITEMS = ITEMS.filter((i) => i.starter).map((i) => i.id);
export const itemById = (id: string) => ITEMS.find((i) => i.id === id);

// ---------- Arte ----------

export type SkyPhase = 'manha' | 'tarde' | 'noite' | 'chuva';
export type SkyPalette = (typeof SKY_PALETTES)['manha'];
export const skyPalette = (phase: SkyPhase): SkyPalette => SKY_PALETTES[phase];

/** Ícone do item (arte da prévia). */
export const itemIcon = (item: Item): string => PX.itemIcon(PX.find(item.id));

/** Pet com a pelagem escolhida (a primeira, se nenhuma). */
export function petIcon(id: string, variant?: string | null): string {
  const p = PET_SPRITES[id] ?? PET_SPRITES.gato;
  const v = p.variants.find((x) => x.id === variant) ?? p.variants[0];
  // R2: pets já redesenhados com o dobro de pixels saem do mesmo tamanho.
  const hd = PETS24[id];
  if (hd) return toSvg(grid(hd.rows, hd.pal(v.pal), p.w * 2), 2);
  return sprite(p.rows, v.pal, p.w);
}

// ---------- Moradas ----------

export function homeGrid(id: string, phase: SkyPhase): Grid {
  const t = skyPalette(phase);
  switch (id) {
    case 'cabana':
      return cabana24();
    case 'casinha':
      return casinha24(t, false);
    case 'pedra':
      return casinha24(t, true);
    case 'torre':
      return torre24(t);
    case 'castelinho':
      return castelinho24(t);
    default:
      return castelo24(t);
  }
}
/** Desenhadas com o dobro de pixels (R1) e mostradas do mesmo tamanho de antes. */
export const homeIcon = (id: string, phase: SkyPhase = 'manha') => toSvg(homeGrid(id, phase), 2);

export function treeIcon(phase: SkyPhase): string {
  return toSvg(tree24(skyPalette(phase)), 2);
}
/** Sol e lua de 24 pixels (R1). */
export const sunIcon = (color: string) => toSvg(sun24(color), 2);
export const MOON_ICON = toSvg(moon24(), 2);

// ---------- Avatar ----------

export interface AvatarLook {
  gender: 'f' | 'm';
  skin: keyof typeof SKINS | string;
  hair: keyof typeof HAIRS | string;
}
export interface Outfit {
  elmo?: string | null;
  armadura?: string | null;
  botas?: string | null;
  arma?: string | null;
  colar?: string | null;
}

/** Avatar vestido (32×30), igual ao da prévia: arco com aljava, colar no pescoço, ombreiras, asas, elmo e arma. */
export const avatarIcon = (look: AvatarLook, outfit: Outfit): string =>
  toSvg(avatar24({
    genero: look.gender === 'm' ? 'homem' : 'mulher',
    pele: SKINS[look.skin] ? look.skin : 'media',
    cabelo: HAIRS[look.hair] ? look.hair : 'castanho',
    elmo: outfit.elmo || null,
    armadura: outfit.armadura || 'aprendiz',
    botas: outfit.botas || 'sapatos',
    arma: outfit.arma || null,
    colar: outfit.colar || null,
  }), 2);

// ---------- Baús, moeda e cristal (da prévia da Jornada) ----------

const CHEST_CLOSED = ['..OOOOOOOOOOOO..', '.OLLLLLLLLLLLLO.', 'OLWLLLLLLLLLLLLO', 'OLLLLLLLLLLLLLLO', 'OMMMMMMMMMMMMMMO', 'OOOOOOOGGOOOOOOO', 'OBBBBBOGGOBBBBBO', 'OBbBBBOKKOBBBbBO', 'OBBBBBBOOBBBBBBO', 'OMMMMMMMMMMMMMMO', 'OBBBBBBBBBBBBBBO', 'ObbbbbbbbbbbbbbO', 'OOOOOOOOOOOOOOOO'];
const CHEST_OPEN = ['..OOOOOOOOOOOO..', '.OLLLLLLLLLLLLO.', '.OLWLLLLLLLLLLO.', '.OMMMMMMMMMMMMO.', 'OOOOOOOOOOOOOOOO', 'OYYYWYYYYYYWYYYO', 'OBYYYYYYYYYYYYBO', 'OBBBBBOGGOBBBBBO', 'OBbBBBOKKOBBBbBO', 'OBBBBBBOOBBBBBBO', 'OMMMMMMMMMMMMMMO', 'OBBBBBBBBBBBBBBO', 'ObbbbbbbbbbbbbbO', 'OOOOOOOOOOOOOOOO'];
const CHEST_PAL: Record<string, Palette> = {
  bronze: { L: '#c2410c', B: '#9a3412', b: '#7c2d12', M: '#f59e0b', G: '#fde68a', K: '#1a1a1f', W: '#fdba74', Y: '#fde68a' },
  prata: { L: '#cbd5e1', B: '#94a3b8', b: '#64748b', M: '#f1f5f9', G: '#facc15', K: '#1a1a1f', W: '#ffffff', Y: '#e0f2fe' },
  dourado: { L: '#facc15', B: '#ca8a04', b: '#a16207', M: '#fef08a', G: '#fff7ed', K: '#1a1a1f', W: '#fffbeb', Y: '#fef9c3' },
  cristal: { L: '#67e8f9', B: '#0891b2', b: '#0e7490', M: '#cffafe', G: '#f0abfc', K: '#1a1a1f', W: '#ecfeff', Y: '#f5d0fe' },
};
export const chestIcon = (kind: string, open: boolean) => sprite(open ? CHEST_OPEN : CHEST_CLOSED, CHEST_PAL[kind] ?? CHEST_PAL.bronze, 16);
export const COIN_ICON = sprite(['..OOOO..', '.OYYYYO.', 'OYWYYyYO', 'OYYYYyYO', 'OYYYYyYO', 'OYyyyyYO', '.OYYYYO.', '..OOOO..'], { Y: '#facc15', y: '#ca8a04', W: '#fff7ed' }, 8);
/** Ficha dos mini games (N2.18a): moeda só do bichinho virtual. */
export const FICHA_ICON = sprite(['..OOOO..', '.OPPPPO.', 'OPWPPpPO', 'OPPHHpPO', 'OPPHHpPO', 'OPppppPO', '.OPPPPO.', '..OOOO..'], { P: '#f472b6', p: '#be185d', W: '#fff1f2', H: '#fff1f2' }, 8);
export const GEM_ICON = sprite(['...OO...', '..OCWO..', '.OCCWcO.', 'OCCCWccO', '.OCCWcO.', '..OCcO..', '...OO...'], { C: '#67e8f9', c: '#0e7490', W: '#ecfeff' }, 8);

// ---------- Personagens da campanha (da prévia da Jornada) ----------

const NPC_FACE = ['......OOOO......', '.....OHHHHO.....', '...OOOHHHHOOO...', '..OHHHHHHHHHHO..', '.OHHHSSSSSSHHHO.', '.OHHSSSSSSSSHHO.', '.OHSGEGSSGEGSHO.', '.OHSSSSssSSSSHO.', '.OHHSSSSSSSSHHO.', '..OHSSOOOOSSHO..', '..OHHSSSSSSHHO..', '...OOSSSSSSOO...', '..OCCOSSSSOCCO..', '.OCCCCOOOOCCCCO.', 'OCCCCCCAACCCCCCO', 'OCCCCCCCCCCCCCCO'];
const NPC_PAL: Record<string, Palette> = {
  lume: { H: '#e5e7eb', S: '#d9a066', s: '#b77d48', G: '#facc15', E: '#1f2937', C: '#7c3aed', A: '#67e8f9' },
  nina: { H: '#7c2d12', S: '#f6d2b0', s: '#e0b08a', G: '#f6d2b0', E: '#1f2937', C: '#16a34a', A: '#facc15' },
  tork: { H: '#1f1f1f', S: '#8d5524', s: '#6b3e1a', G: '#8d5524', E: '#111827', C: '#78350f', A: '#94a3b8' },
};
export const npcIcon = (id: 'lume' | 'nina' | 'tork') => sprite(NPC_FACE, NPC_PAL[id], 16);

// ---------- Medalhas dos títulos (da prévia "Jornada RPG", v3) ----------

const MEDAL = ['OOO....OOO', 'ORRO..ORRO', '.ORRO.ORO.', '..ORROROO.', '...OROO...', '..OOMMOO..', '.OMMWMMMO.', 'OMMWMMMMdO', 'OMMMMMMMdO', 'OMMMMMMddO', '.OMMMMddO.', '..OOOOOO..'];
const MEDAL_TONES: [string, string, string][] = [
  ['#22c55e', '#facc15', '#a16207'],
  ['#3b82f6', '#e5e7eb', '#9ca3af'],
  ['#ef4444', '#facc15', '#a16207'],
  ['#a855f7', '#67e8f9', '#0e7490'],
  ['#f97316', '#d6a35c', '#78350f'],
  ['#ec4899', '#fde68a', '#ca8a04'],
];
/** Medalha do título (cinza enquanto não foi conquistado). */
export function medalIcon(index: number, earned: boolean): string {
  const [r, m, d] = earned ? MEDAL_TONES[index % MEDAL_TONES.length] : ['#52525b', '#71717a', '#3f3f46'];
  return sprite(MEDAL, { R: r, M: m, W: '#ffffff', d }, 10);
}

// ---------- Troféu das conquistas dos jogos (N2.16b; arte nova com o dobro de pixels) ----------

const TROPHY = [
  '....OOOOOOOOOOOOOOOO....', 'OOOOYWWYYYYYYYYYYYDYOOOO', 'OYYOYWYYYYYYYYYYYYDYOYYO', 'OYOOYWYYYYYYYYYYYYDYOOYO',
  'OYO.OYYYYYYYYYYYYYDO.OYO', 'OYO.OYYYYYYSYYYYYYDO.OYO', '.OYO.OYYYYSSSYYYYDO.OYO.', '..OYOOYYYYYSYYYYYDOOYO..',
  '...OOOOYYYYYYYYYDOOOO...', '......OOYYYYYYYDOO......', '........OOYYYDOO........', '..........OYDO..........',
  '..........OYDO..........', '.........OYYDDO.........', '......OOOOOOOOOOOO......', '.....OBBBBBBBBBBBBO.....',
  '.....OBbbbbbbbbbbBO.....', '.....OOOOOOOOOOOOOO.....',
];
/** Troféu dourado (conquistado) ou cinza (ainda não). */
export const trophyIcon = (earned: boolean) =>
  sprite(TROPHY, earned ? { Y: '#facc15', W: '#fef9c3', D: '#a16207', S: '#ffffff', B: '#7c4a2d', b: '#5b3410' } : { Y: '#52525b', W: '#71717a', D: '#3f3f46', S: '#71717a', B: '#3f3f46', b: '#27272a' }, 24);
