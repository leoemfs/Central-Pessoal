/**
 * Catálogo da Jornada: equipamentos, pets e moradas, com raridade, como obter e a arte de cada um.
 * Tudo aqui é dado fixo; as regras (quem pode ter o quê) ficam em rules.ts.
 */
import { Canvas, OUTLINE, blank, diagonal, grid, paint, sprite, toSvg, type Grid, type Palette } from './art.ts';
import {
  ARMOR_PLATE,
  ARMOR_TUNIC,
  BODY,
  BOOTS,
  BOOT_WINGS_ICON,
  BOOT_WINGS_WEAR,
  HAIRS,
  HELMET_ICONS,
  HELMET_PAL,
  HELMET_WEAR,
  ITEM_ART,
  PET_ART,
  SHOULDERS,
  SKINS,
  SKY_PALETTES,
  SWORD,
} from './artData.ts';

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

export type Slot = 'elmo' | 'armadura' | 'botas' | 'arma' | 'artefato';

export interface Item {
  id: string;
  slot: Slot;
  name: string;
  rarity: Rarity;
  /** Arma: espada ou cajado. */
  weapon?: 'espada' | 'cajado';
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
  /** Artefato raro: atributo cujo XP ganha +10%. */
  boosts?: AttrCode;
  effect?: string;
}

export const ITEMS: Item[] = [
  { id: 'capuz', slot: 'elmo', name: 'Capuz de couro', rarity: 'comum', price: 150 },
  { id: 'elmo', slot: 'elmo', name: 'Elmo de ferro', rarity: 'raro', price: 600 },
  { id: 'chapeu', slot: 'elmo', name: 'Chapéu de mago', rarity: 'epico', chest: true, attrUnlock: { INT: 50 } },
  { id: 'coroa', slot: 'elmo', name: 'Coroa de cristal', rarity: 'mistico', req: { DIS: 100 }, crystals: 3, effect: '+1 cristal por mês com todas as contas pagas no prazo.' },

  { id: 'aprendiz', slot: 'armadura', name: 'Túnica de aprendiz', rarity: 'comum', starter: true },
  { id: 'gibao', slot: 'armadura', name: 'Gibão de couro', rarity: 'comum', price: 200 },
  { id: 'malha', slot: 'armadura', name: 'Cota de malha', rarity: 'raro', price: 700 },
  { id: 'manto', slot: 'armadura', name: 'Manto arcano', rarity: 'raro', chest: true, attrUnlock: { SAB: 50 } },
  { id: 'placas', slot: 'armadura', name: 'Armadura de placas', rarity: 'epico', chest: true, attrUnlock: { FOR: 80 } },
  { id: 'cristal', slot: 'armadura', name: 'Armadura de cristal', rarity: 'mistico', req: { RES: 150 }, crystals: 5, effect: 'Uma vez por semana, um dia perdido não quebra a sequência da Jornada.' },

  { id: 'sapatos', slot: 'botas', name: 'Sapatos simples', rarity: 'comum', starter: true },
  { id: 'couro', slot: 'botas', name: 'Botas de couro', rarity: 'comum', price: 120 },
  { id: 'ferro', slot: 'botas', name: 'Botas de ferro', rarity: 'raro', price: 500 },
  { id: 'aladas', slot: 'botas', name: 'Botas aladas', rarity: 'mistico', req: { AGI: 100 }, crystals: 3, effect: '+10% de XP em caminhadas; o pet acompanha mais rápido.' },

  { id: 'madeira', slot: 'arma', weapon: 'espada', name: 'Espada de madeira', rarity: 'comum', starter: true },
  { id: 'espada', slot: 'arma', weapon: 'espada', name: 'Espada de ferro', rarity: 'raro', price: 650 },
  { id: 'rubi', slot: 'arma', weapon: 'espada', name: 'Lâmina rubi', rarity: 'epico', chest: true, attrUnlock: { FOR: 100 } },
  { id: 'aurora', slot: 'arma', weapon: 'espada', name: 'Espada da aurora', rarity: 'mistico', req: { FOR: 150, DIS: 60 }, crystals: 5, effect: 'Subir de nível dá um baú raro extra.' },
  { id: 'galho', slot: 'arma', weapon: 'cajado', name: 'Cajado de galho', rarity: 'comum', price: 150 },
  { id: 'cajado', slot: 'arma', weapon: 'cajado', name: 'Cajado de cristal', rarity: 'raro', price: 650 },
  { id: 'estelar', slot: 'arma', weapon: 'cajado', name: 'Cajado estelar', rarity: 'mistico', req: { INT: 150, SAB: 60 }, crystals: 5, effect: 'Estudo e leitura registrados dão +1 ouro extra.' },

  { id: 'pena', slot: 'artefato', name: 'Pena do vento', rarity: 'raro', chest: true, attrUnlock: { AGI: 40 }, boosts: 'AGI', effect: '+10% de XP em hábitos de Agilidade.' },
  { id: 'bracelete', slot: 'artefato', name: 'Bracelete do titã', rarity: 'raro', chest: true, attrUnlock: { FOR: 40 }, boosts: 'FOR', effect: '+10% de XP em hábitos de Força.' },
  { id: 'grimorio', slot: 'artefato', name: 'Grimório', rarity: 'raro', chest: true, attrUnlock: { INT: 40 }, boosts: 'INT', effect: '+10% de XP em hábitos de Inteligência.' },
  { id: 'gota', slot: 'artefato', name: 'Amuleto da gota', rarity: 'raro', chest: true, attrUnlock: { RES: 40 }, boosts: 'RES', effect: '+10% de XP em hábitos de Resistência.' },
  { id: 'lanterna', slot: 'artefato', name: 'Lanterna da sabedoria', rarity: 'raro', chest: true, attrUnlock: { SAB: 40 }, boosts: 'SAB', effect: '+10% de XP em hábitos de Sabedoria.' },
  { id: 'ampulheta', slot: 'artefato', name: 'Ampulheta', rarity: 'raro', chest: true, attrUnlock: { DIS: 40 }, boosts: 'DIS', effect: '+10% de XP em hábitos de Disciplina.' },
  { id: 'coracao', slot: 'artefato', name: 'Coração de cristal', rarity: 'mistico', req: { RES: 100, DIS: 100 }, crystals: 4, effect: 'Recaída não zera o progresso do baú de cristal.' },
  { id: 'olho', slot: 'artefato', name: 'Olho do oráculo', rarity: 'mistico', req: { SAB: 100, INT: 100 }, crystals: 4, effect: 'Cada revisão semanal dá +1 cristal.' },
  { id: 'fenix', slot: 'artefato', name: 'Pena da fênix', rarity: 'mistico', req: { AGI: 80 }, extra: { cleanAfterSlip: 30 }, crystals: 4, effect: 'Depois de uma recaída, os 7 dias seguintes valem XP em dobro.' },
  { id: 'polar', slot: 'artefato', name: 'Estrela polar', rarity: 'mistico', req: { FOR: 60, AGI: 60, INT: 60, RES: 60, SAB: 60, DIS: 60 }, crystals: 6, effect: '+10% de XP e ouro em tudo. O céu noturno ganha uma constelação.' },
];

export interface Pet {
  id: string;
  name: string;
  rarity: Rarity;
  level: number;
  attrUnlock?: Partial<Attrs>;
}
export const PETS: Pet[] = [
  { id: 'gato', name: 'Gatinho', rarity: 'comum', level: 3 },
  { id: 'cao', name: 'Cãozinho', rarity: 'comum', level: 3 },
  { id: 'cavalo', name: 'Cavalinho', rarity: 'raro', level: 12, attrUnlock: { AGI: 50 } },
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

function feather(pal: Palette): Grid {
  return diagonal((p, q) => {
    if (p < -13 || p > 12) return null;
    if (q === 0 || q === 1) return pal.Q;
    const w = p < -6 ? 0 : p < -3 ? 2 : p < 8 ? 4 : p < 11 ? 3 : 2;
    if (q < -w + 1 || q > w) return null;
    if ((p === 0 || p === 5) && q === w) return null;
    return q < 0 ? pal.W : pal.F;
  });
}

function staff(pal: Palette): Grid {
  return diagonal((p, q, r, c) => {
    const dr = r - 3.5;
    const dc = c - 11.5;
    const d = dr * dr + dc * dc;
    if (d <= 7.5) return d < 2.5 && dr < 0 && dc < 0 ? pal.W : dr + dc > 1.5 ? pal.c : pal.C;
    if (p >= -13 && p <= 3 && (q === 0 || q === 1)) return q === 0 ? pal.B : pal.b || pal.B;
    if (p >= 2 && p <= 5 && (q === -2 || q === 3)) return pal.G || '#facc15';
    return null;
  });
}

/** Ícone 16×16 do item. */
export function itemGrid(item: Item): Grid {
  const art = ITEM_ART[item.id];
  if (art.icon) return grid(art.icon.rows, art.icon.pal, 16);
  if (art.feather) return feather(art.feather);
  if (item.slot === 'elmo') return grid(HELMET_ICONS[item.id], HELMET_PAL[item.id], 16);
  if (item.slot === 'armadura') return grid(item.id === 'placas' || item.id === 'cristal' ? ARMOR_PLATE : ARMOR_TUNIC, art.pal!, 16);
  if (item.slot === 'botas') {
    const g = grid(BOOTS, art.pal!, 16);
    return item.id === 'aladas' ? paint(g, grid(BOOT_WINGS_ICON, { W: '#ffffff' }, 16), 0, 0) : g;
  }
  return item.weapon === 'cajado' ? staff(art.pal!) : grid(SWORD, art.pal!, 16);
}
export const itemIcon = (item: Item) => toSvg(itemGrid(item));

export function petIcon(id: string): string {
  const p = PET_ART[id];
  return sprite(p.rows, p.pal, p.w);
}

// ---------- Moradas ----------

function cabana(): Grid {
  const c = new Canvas(22, 14);
  const cx = 10;
  for (let j = 0; j < 12; j++)
    for (let i = cx - j; i <= cx + 1 + j; i++) {
      const edge = i === cx - j || i === cx + 1 + j;
      c.set(i, j + 1, edge ? OUTLINE : (i - cx + 40) % 3 === 0 ? '#a16207' : '#d97706');
    }
  for (let d = 0; d < 6; d++) for (let k = cx - d / 2; k <= cx + 1 + d / 2; k++) c.set(Math.round(k), 7 + d, '#3f2a14');
  c.set(cx, 0, '#7c4a2d');
  c.set(cx + 1, 0, '#7c4a2d');
  c.rect(0, 13, 22, 1, OUTLINE);
  c.set(19, 10, '#fde047');
  c.set(19, 11, '#f97316');
  c.set(18, 11, '#f97316');
  c.set(20, 11, '#dc2626');
  c.rect(17, 12, 5, 1, '#7c4a2d');
  return c.g;
}

const HOUSE = [
  '..........RRRR..........',
  '........RRRRRRRR....CC..',
  '......RRRRRRRRRRRR..CC..',
  '.....RRRRRRRRRRRRRR.CC..',
  '....RRRRRRRRRRRRRRRRCC..',
  '...RRRRRRRRRRRRRRRRRRR..',
  '..RrrrrrrrrrrrrrrrrrrrR.',
  '.RRRRRRRRRRRRRRRRRRRRRRR',
  '..WWWWWWWWWWWWWWWWWWWW..',
  '..WWWWWWWWWWWWWWWWWWWW..',
  '..WWFFFFWWWDDDDWWFFFFW..',
  '..WWFYYFWWWDDDDWWFYYFW..',
  '..WWFYYFWWWDDDDWWFYYFW..',
  '..WWFFFFWWWDDDDWWFFFFW..',
  '..WWWWWWWWWDDDKWWWWWWW..',
  '..WwwwwwwwwDDDDwwwwwwW..',
  '..WWWWWWWWWDDDDWWWWWWW..',
  '..SSSSSSSSSSSSSSSSSSSS..',
  '..SsSsSsSsSsSsSsSsSsSs..',
];

function casinha(t: SkyPalette, stone: boolean): Grid {
  return grid(
    HOUSE,
    {
      R: stone ? t.blue : t.roof,
      r: stone ? t.blueShade : t.roofShade,
      C: '#57534e',
      W: stone ? t.stone : t.wall,
      w: stone ? t.stoneShade : t.wallShade,
      F: '#7c4a2d',
      Y: t.win,
      D: '#7c4a2d',
      K: '#facc15',
      S: '#78716c',
      s: '#57534e',
    },
    24,
  );
}

function torre(t: SkyPalette): Grid {
  const c = new Canvas(14, 32);
  c.cone(7, 0, 7, t.blue, t.blueShade);
  c.set(7, 0, '#facc15');
  c.box(2, 8, 11, 24, t.stone);
  c.bricks(3, 9, 9, 22, t.stone, t.stoneShade);
  c.rect(6, 12, 3, 4, OUTLINE);
  c.rect(7, 13, 1, 3, t.win);
  c.rect(4, 19, 2, 3, OUTLINE);
  c.set(4, 20, t.win);
  c.rect(9, 19, 2, 3, OUTLINE);
  c.set(9, 20, t.win);
  c.rect(5, 25, 5, 6, OUTLINE);
  c.rect(6, 26, 3, 5, '#7c4a2d');
  return c.g;
}

function castelinho(t: SkyPalette): Grid {
  const c = new Canvas(30, 24);
  c.box(6, 10, 18, 14, t.stone);
  c.bricks(7, 11, 16, 12, t.stone, t.stoneShade);
  c.crenels(6, 8, 18, t.stone);
  for (const x of [0, 22]) {
    c.box(x, 5, 8, 19, t.stone);
    c.bricks(x + 1, 6, 6, 17, t.stone, t.stoneShade);
    c.crenels(x, 3, 8, t.stone);
    c.rect(x + 3, 10, 2, 3, OUTLINE);
    c.set(x + 3, 11, t.win);
    c.set(x + 4, 11, t.win);
    c.rect(x + 3, 0, 1, 3, '#7c4a2d');
    c.set(x + 4, 0, '#dc2626');
    c.set(x + 5, 0, '#dc2626');
    c.set(x + 4, 1, '#dc2626');
  }
  c.rect(12, 15, 6, 9, OUTLINE);
  c.rect(13, 16, 4, 8, '#3f2a14');
  for (let y = 17; y < 24; y += 2) c.rect(13, y, 4, 1, '#78716c');
  c.set(12, 15, t.stone);
  c.set(17, 15, t.stone);
  return c.g;
}

function castelo(t: SkyPalette): Grid {
  const c = new Canvas(44, 36);
  c.box(15, 12, 14, 24, t.stone);
  c.bricks(16, 13, 12, 22, t.stone, t.stoneShade);
  c.cone(22, 2, 10, t.blue, t.blueShade);
  c.rect(22, 0, 1, 3, '#7c4a2d');
  c.rect(23, 0, 3, 1, '#facc15');
  c.set(23, 1, '#facc15');
  c.rect(20, 17, 4, 5, OUTLINE);
  c.rect(21, 18, 2, 4, t.win);
  c.box(8, 22, 28, 14, t.stone);
  c.bricks(9, 23, 26, 12, t.stone, t.stoneShade);
  c.crenels(8, 20, 7, t.stone);
  c.crenels(29, 20, 7, t.stone);
  for (const x of [0, 34]) {
    c.box(x, 14, 10, 22, t.stone);
    c.bricks(x + 1, 15, 8, 20, t.stone, t.stoneShade);
    c.cone(x + 4, 6, 7, t.blue, t.blueShade);
    c.rect(x + 5, 13, 1, 1, t.blueShade);
    c.set(x + 4, 4, '#7c4a2d');
    c.set(x + 4, 5, '#7c4a2d');
    c.set(x + 5, 4, '#dc2626');
    c.set(x + 6, 4, '#dc2626');
    c.rect(x + 4, 19, 2, 3, OUTLINE);
    c.set(x + 4, 20, t.win);
    c.set(x + 5, 20, t.win);
    c.rect(x + 4, 26, 2, 3, OUTLINE);
    c.set(x + 4, 27, t.win);
    c.set(x + 5, 27, t.win);
  }
  c.rect(18, 26, 8, 10, OUTLINE);
  c.rect(19, 27, 6, 9, '#3f2a14');
  for (let y = 28; y < 36; y += 2) c.rect(19, y, 6, 1, '#78716c');
  c.set(18, 26, t.stone);
  c.set(25, 26, t.stone);
  c.rect(11, 25, 2, 5, '#dc2626');
  c.set(11, 30, '#dc2626');
  c.rect(11, 25, 2, 1, '#facc15');
  c.rect(31, 25, 2, 5, '#dc2626');
  c.set(32, 30, '#dc2626');
  c.rect(31, 25, 2, 1, '#facc15');
  return c.g;
}

export function homeGrid(id: string, phase: SkyPhase): Grid {
  const t = skyPalette(phase);
  switch (id) {
    case 'cabana':
      return cabana();
    case 'casinha':
      return casinha(t, false);
    case 'pedra':
      return casinha(t, true);
    case 'torre':
      return torre(t);
    case 'castelinho':
      return castelinho(t);
    default:
      return castelo(t);
  }
}
export const homeIcon = (id: string, phase: SkyPhase = 'manha') => toSvg(homeGrid(id, phase));

export function treeIcon(phase: SkyPhase): string {
  const t = skyPalette(phase);
  return sprite(
    ['...LLLL...', '..LLLLLL..', '.LLLlLLLL.', 'LLLLLLLLLL', 'LLlLLLLlLL', 'LLLLLLLLLL', '.LLLLLlLL.', 'LLLlLLLLLL', '.LLLLLLLL.', '..LLLLLL..', '....TT....', '....TT....', '....TT....', '....TT....', '...TTTT...'],
    { L: t.leaf, l: t.leafShade, T: '#6b4423' },
    10,
  );
}

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
}

/** Avatar vestido (32×30): corpo + roupa e botas (cores), ombreiras, asas, elmo e arma na mão. */
export function avatarGrid(look: AvatarLook, outfit: Outfit): Grid {
  const armorId = outfit.armadura ?? 'aprendiz';
  const bootsId = outfit.botas ?? 'sapatos';
  const armorPal = ITEM_ART[armorId]?.pal ?? ITEM_ART.aprendiz.pal!;
  const bootsPal = ITEM_ART[bootsId]?.pal ?? ITEM_ART.sapatos.pal!;
  const skin = SKINS[look.skin] ?? SKINS.media;
  const pal: Palette = { H: HAIRS[look.hair] ?? HAIRS.castanho, S: skin[0], s: skin[1], E: '#141414', P: '#3b3f5c', ...armorPal, K: bootsPal.K };
  const c = blank(32, 30);
  const ox = 4;
  const oy = 6;
  paint(c, grid(BODY[look.gender === 'm' ? 'homem' : 'mulher'], pal, 16), ox, oy);
  if (armorId === 'placas' || armorId === 'cristal') paint(c, grid(SHOULDERS, armorPal, 16), ox, oy + 10);
  if (bootsId === 'aladas') paint(c, grid(BOOT_WINGS_WEAR, { W: '#ffffff' }, 16), ox, oy + 20);
  if (outfit.elmo && HELMET_WEAR[outfit.elmo]) paint(c, grid(HELMET_WEAR[outfit.elmo], HELMET_PAL[outfit.elmo], 16), ox, oy - 6);
  const weapon = outfit.arma ? itemById(outfit.arma) : undefined;
  if (weapon) paint(c, weapon.weapon === 'cajado' ? staff(ITEM_ART[weapon.id].pal!) : grid(SWORD, ITEM_ART[weapon.id].pal!, 16), ox + 11, oy + 2);
  return c;
}
export const avatarIcon = (look: AvatarLook, outfit: Outfit) => toSvg(avatarGrid(look, outfit));

