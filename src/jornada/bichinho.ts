/**
 * Bichinho virtual (N2.18b), seguindo a prévia 2 (https://claude.ai/artifact/Q2pKUhPZ7jXtJpxxH8UYms).
 * O humor do bichinho desce devagar com o tempo e sobe com cuidado, mas nunca fica abaixo de 20:
 * ele nunca fica doente nem triste. O petisco custa fichas dos mini games.
 * Também ficam aqui o gatinho com mais pixels e as paredes e pisos de cada moradia.
 */
import { fichas } from './games.ts';
import type { JourneyState } from './rules.ts';

export interface VPet {
  joy: number;
  full: number;
  rest: number;
  clean: number;
  /** Quando os valores foram gravados (ISO com hora). Vazio = nunca. */
  at: string;
}

export const defaultVPet = (): VPet => ({ joy: 70, full: 60, rest: 80, clean: 60, at: '' });

export function normalizeVPet(x: unknown): VPet {
  const r = (x && typeof x === 'object' ? x : {}) as Partial<VPet>;
  const n = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : d);
  const base = defaultVPet();
  return { joy: n(r.joy, base.joy), full: n(r.full, base.full), rest: n(r.rest, base.rest), clean: n(r.clean, base.clean), at: typeof r.at === 'string' ? r.at : '' };
}

/** Quanto cada barra desce por hora (sem nunca passar de 20 para baixo). */
const DECAY = { joy: 3, full: 4, rest: 2, clean: 2 } as const;
export const FLOOR = 20;
export const SNACK_PRICE = 2;

/** O humor de agora, já com a descida desde a última gravação. */
export function moodNow(v: VPet, now: Date): VPet {
  if (!v.at) return v;
  const hours = Math.max(0, (now.getTime() - new Date(v.at).getTime()) / 3_600_000);
  const down = (k: keyof typeof DECAY) => Math.max(Math.min(v[k], FLOOR), Math.round(v[k] - DECAY[k] * hours));
  return { joy: down('joy'), full: down('full'), rest: down('rest'), clean: down('clean'), at: v.at };
}

export type PetAction = 'carinho' | 'petisco' | 'brincar' | 'dormir' | 'escovar' | 'banho' | 'dentes' | 'secar' | 'passear' | 'bolinha' | 'sol';

/** Aplica uma ação: devolve o estado novo ou uma mensagem (ex.: faltam fichas). */
export function petAction(state: JourneyState, action: PetAction, now: Date): JourneyState | string {
  const m = moodNow(state.vpet, now);
  const up = (v: number, d: number) => Math.max(0, Math.min(100, v + d));
  let next = { ...m };
  let games = state.games;
  switch (action) {
    case 'carinho':
      next = { ...next, joy: up(m.joy, 6) };
      break;
    case 'petisco':
      if (fichas(state) < SNACK_PRICE) return `Faltam fichas: o petisco custa ${SNACK_PRICE}. Jogue um mini game para ganhar.`;
      games = { ...games, fichasSpent: games.fichasSpent + SNACK_PRICE };
      next = { ...next, full: up(m.full, 30), joy: up(m.joy, 4) };
      break;
    case 'brincar':
      next = { ...next, joy: up(m.joy, 12), rest: up(m.rest, -6) };
      break;
    case 'dormir':
      next = { ...next, rest: 100 };
      break;
    case 'escovar':
      next = { ...next, clean: up(m.clean, 15), joy: up(m.joy, 4) };
      break;
    // N2.18c: banheiro
    case 'banho':
      next = { ...next, clean: 100 };
      break;
    case 'dentes':
      next = { ...next, clean: up(m.clean, 10) };
      break;
    case 'secar':
      next = { ...next, joy: up(m.joy, 4) };
      break;
    // N2.18c: lá fora
    case 'passear':
      next = { ...next, joy: up(m.joy, 10), rest: up(m.rest, -8) };
      break;
    case 'bolinha':
      next = { ...next, joy: up(m.joy, 14), rest: up(m.rest, -8) };
      break;
    case 'sol':
      next = { ...next, rest: up(m.rest, 15) };
      break;
  }
  return { ...state, games, vpet: { ...next, at: now.toISOString() } };
}

/** Frase do cartão no Fliperama. */
export function petWish(v: VPet, name: string): string {
  if (v.full < 50) return `${name} está com fome`;
  if (v.rest < 40) return `${name} está com sono`;
  if (v.joy < 50) return `${name} quer brincar`;
  if (v.clean < 40) return `${name} quer uma escovada`;
  return `${name} está feliz`;
}

// ---------- Gatinho com mais pixels (24 × 20) ----------

export const CAT_HD = [
  '..OO................OO..', '.OCCO..............OCCO.', '.OCPCO............OCPCO.', '.OCPPCOOOOOOOOOOOOCPPCO.',
  '.OCCCCCLLLLLLLLLLCCCCCO.', 'OCCCCLLLLLLLLLLLLLLCCCCO', 'OCCCLLLLLLLLLLLLLLLLCCCO', 'OCCLLOOOLLLLLLLLOOOLLCCO',
  'OCCLOEWEOLLLLLLOEWEOLCCO', 'OCCLOEEEOLLLLLLOEEEOLCCO', 'OCCLLOOOLLLNNLLLOOOLLCCO', 'OCCCLLLLLLMNNMLLLLLLLCCO',
  'ODCCCLLLLLLMMLLLLLLCCCDO', '.ODCCCCLLLLLLLLLLCCCCDO.', '..ODDCCCCCCCCCCCCCCDDO..', '..OCCCCCCCCCCCCCCCCCCO..',
  '.OCCCLLCCCCCCCCCCLLCCCO.', '.OCCLLLCCOOOOOOCCLLLCCO.', '.ODCCCCDOO....OODCCCCDO.', '..OOOOOO........OOOOOO..',
];

/** De costas (banho, dormir) e de lado (passear): a cena escolhe, sem botão de girar. */
export const CAT_HD_BACK = CAT_HD.map((r, i) => {
  if (i >= 7 && i <= 11) return 'OCC' + 'L'.repeat(18) + 'CCO';
  if (i === 12) return 'ODCCC' + 'L'.repeat(14) + 'CCCDO';
  if (i === 17) return '.OCCLLLCCCCCCCCCCLLLCCOO';
  if (i === 18) return '.ODCCCCDOO....OODCCCCDOC';
  if (i === 19) return '..OOOOOO........OOOOOOO.';
  return r;
});
export const CAT_HD_SIDE = [
  '.....................OO..OO.', '....................OCCOOCCO', '....................OCPCCPCO', '..OO................OCCCCCCO',
  '.OCCO..............OCCLLLLLO', '.OCO...............OCLOOLLLO', 'OCO................OCLOEWLLN', 'OCO................OCLLOOLLM',
  'OCO...OOOOOOOOOOOOOCCLLLLLO.', '.OCOOOCCCCCCCCCCCCCCCLLLLO..', '..OCCCCCCCCCCCCCCCCCCCCCO...', '..OCLLLLLLLLLLLLLLLLLLLCO...',
  '..OCCLLLLLLLLLLLLLLLLLCCO...', '..ODCCCCCCCCCCCCCCCCCCCDO...', '..OCCO.OCCO.....OCCO.OCCO...', '..OCCO.OCCO.....OCCO.OCCO...',
  '..ODDO.ODDO.....ODDO.ODDO...', '..OOOO.OOOO.....OOOO.OOOO...',
];

function mix(hex: string, to: string, k: number): string {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(to.slice(1), 16);
  const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - k) + ((b >> s) & 255) * k);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}

/** Paleta do gatinho com mais pixels a partir da cor escolhida (base, olhos e nariz). */
export function catHdPalette(p: { C: string; E: string; N: string }): Record<string, string> {
  return { C: p.C, D: mix(p.C, '#000000', 0.32), L: mix(p.C, '#ffffff', 0.38), E: p.E, W: '#ffffff', N: p.N, P: mix(p.N, '#ffffff', 0.35), M: mix(p.C, '#000000', 0.6) };
}

// ---------- Quarto de cada moradia ----------

const bricks = (m: string, b: string) =>
  `linear-gradient(${m} 2px, transparent 2px) 0 0/100% 24px, linear-gradient(90deg, ${m} 2px, transparent 2px) 0 0/48px 48px, linear-gradient(90deg, ${m} 2px, transparent 2px) 24px 24px/48px 48px, ${b}`;

export const ROOMS: Record<string, { wall: string; floor: string; extra: ('banner' | 'torch' | 'stars')[] }> = {
  cabana: { wall: 'repeating-linear-gradient(90deg, #d97706 0 18px, #b45309 18px 36px)', floor: 'repeating-linear-gradient(0deg, #65a30d 0 6px, #4d7c0f 6px 12px)', extra: [] },
  casinha: { wall: 'radial-gradient(#fca5a5 2px, transparent 3px) 0 0/24px 24px, #fef3c7', floor: 'repeating-linear-gradient(90deg, #a16207 0 34px, #854d0e 34px 36px)', extra: [] },
  pedra: { wall: bricks('#57534e', '#a8a29e'), floor: bricks('#44403c', '#78716c'), extra: [] },
  torre: { wall: `${bricks('#334155', '#64748b')}`, floor: 'repeating-linear-gradient(90deg, #4c1d95 0 30px, #3b0764 30px 32px)', extra: ['stars'] },
  castelinho: { wall: bricks('#57534e', '#78716c'), floor: 'repeating-linear-gradient(90deg, #7f1d1d 0 40px, #991b1b 40px 42px)', extra: ['banner'] },
  castelo: { wall: bricks('#a8a29e', '#d6d3d1'), floor: 'linear-gradient(90deg, transparent 30%, #b91c1c 30% 70%, transparent 70%), repeating-linear-gradient(90deg, #78716c 0 40px, #57534e 40px 42px)', extra: ['banner', 'torch'] },
};
export const roomOf = (morada: string) => ROOMS[morada] ?? ROOMS.casinha;
