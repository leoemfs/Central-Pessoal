/**
 * R2 (17/11): pets redesenhados com o dobro de pixels (o dobro da largura e da altura do desenho antigo),
 * mostrados do mesmo tamanho. Cada pet novo entra aqui; os que ainda não têm, usam o desenho de sempre.
 * A paleta nova sai da pelagem escolhida (as mesmas cores), com luz, sombra e brilho no olho.
 */
import { mix } from './scene24.ts';

type Pal = Record<string, string>;
export interface Pet24 {
  rows: string[];
  pal: (p: Pal) => Pal;
}

/** Metade esquerda espelhada: o desenho fica simétrico. */
const mirror = (half: string[]) => half.map((r) => r + [...r].reverse().join(''));
const light = (c: string, k = 0.4) => mix(c, '#ffffff', k);
const dark = (c: string, k = 0.32) => mix(c, '#000000', k);

const CAT = [
  '..OO................OO..', '.OCCO..............OCCO.', '.OCPCO............OCPCO.', '.OCPPCOOOOOOOOOOOOCPPCO.',
  '.OCCCCCLLLLLLLLLLCCCCCO.', 'OCCCCLLLLLLLLLLLLLLCCCCO', 'OCCCLLLLLLLLLLLLLLLLCCCO', 'OCCLLOOOLLLLLLLLOOOLLCCO',
  'OCCLOEWEOLLLLLLOEWEOLCCO', 'OCCLOEEEOLLLLLLOEEEOLCCO', 'OCCLLOOOLLLNNLLLOOOLLCCO', 'OCCCLLLLLLMNNMLLLLLLLCCO',
  'ODCCCLLLLLLMMLLLLLLCCCDO', '.ODCCCCLLLLLLLLLLCCCCDO.', '..ODDCCCCCCCCCCCCCCDDO..', '..OCCCCCCCCCCCCCCCCCCO..',
  '.OCCCLLCCCCCCCCCCLLCCCO.', '.OCCLLLCCOOOOOOCCLLLCCO.', '.ODCCCCDOO....OODCCCCDO.', '..OOOOOO........OOOOOO..',
];

export const PETS24: Record<string, Pet24> = {
  gato: {
    rows: CAT,
    pal: (p) => ({ C: p.C, D: dark(p.C), L: light(p.C, 0.38), E: p.E, W: '#ffffff', N: p.N, P: light(p.N, 0.35), M: dark(p.C, 0.6) }),
  },
  cao: {
    rows: mirror([
      '......OOOOOO', '....OOCCCCCC', '..OOBOCCCCCC', '.OBBBOCCCCCC', 'OBBBBOCCCLLL', 'OBBBOCCLLLLL', 'OBBBOCCLLEWL',
      'OBBbOCCLLEEL', '.OBbOCCLLLLL', '..OOOCCLLLLL', '....OCLLLLNN', '....OCLLLLLN', '....OCLLLLMM', '.....OCLLLMP',
      '......OCCLLP', '.....OCCCCCC', '....OCCLLCCC', '....OCLLLCCO', '....ODCCCDO.', '.....OOOOO..',
    ]),
    pal: (p) => ({ C: p.C, B: p.B, b: dark(p.B, 0.25), L: light(p.C, 0.45), D: dark(p.C, 0.3), E: p.E, W: '#ffffff', N: p.N === p.E ? '#1f1311' : p.N, M: dark(p.C, 0.55), P: '#f472b6' }),
  },
  coelho: {
    rows: mirror([
      '...OOO......', '..OCCCO.....', '..OCppCO....', '..OCppCO....', '..OCppCO....', '..OCppCO....', '..OCCpCO....',
      '...OCCCOOOOO', '..OCCCCCCCCC', '.OCCLLCCCCCC', '.OCLLCCCCCCC', 'OCCCCCCCCCCC', 'OCCCCEWCCCCC', 'OCCCCEECCCCC',
      'OCCpCCCCCCCN', '.OCCCCCCCCCM', '..OCCCCCCCCW', '...OOCCCCCCC', '...OCCLLLCCC', '..OCCLLLLCCC', '..OCCLLLLCCC',
      '..OCCCLLCCCO', '..ODCCCCCDO.', '...OOOOOOO..',
    ]),
    pal: (p) => ({ C: p.C, L: light(p.C, 0.5), D: dark(p.C, 0.25), p: p.p, E: p.E, W: '#ffffff', N: p.N, M: dark(p.C, 0.45) }),
  },
  coruja: {
    rows: mirror([
      '.OO.........', '.OBO........', '.OBBO.......', '.OBBBOOOOOOO', 'OBBLBBBBBBBB', 'OBLLBBBBBBBB', 'OBBOOOOBBBBB',
      'OBOWWWWOBBBB', 'OOWWEEWWOBBB', 'OOWWEHWWOBBB', 'OBOWWWWOBBBY', 'OBBOOOOBBBBy', 'OBBBBBBBBBBB', 'OBBBbBbBbBbB',
      'OBBbBbBbBbBb', 'OBBBbBbBbBbB', 'OBDBBbBbBbBb', '.OBDBBbBbBbB', '.OBDDBBBBBBB', '..OBDDBBBBBB', '...OOBBBBBBB',
      '.....OOOOOOO', '.......OYYO.', '.......OOOO.',
    ]),
    pal: (p) => ({ B: p.B, b: p.b, L: light(p.B, 0.3), D: dark(p.B, 0.3), W: p.W, E: p.E, H: '#ffffff', Y: p.Y, y: dark(p.Y, 0.25) }),
  },
};
