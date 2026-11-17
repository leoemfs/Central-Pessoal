/**
 * R3a (17/11): personagem com o dobro de pixels (64×60, mostrado em 32×30 como antes).
 * O corpo é o de sempre dobrado e com detalhe novo (olhos com brilho, nariz, boca, bochecha, mechas,
 * dobras da roupa, fivela, botas), para roupas, elmos e armas continuarem encaixando. O que ainda não foi
 * redesenhado (elmos, armas, ombreiras, asas, aljava) entra dobrado; no fim, o contorno fica com 1 pixel.
 */
import { OUTLINE, type Grid } from './art.ts';
import { PX } from './px.ts';
import { mix } from './scene24.ts';

type Pal = Record<string, string>;
const AV = PX.AV as {
  BODY: Record<string, string[]>;
  SKINS: Record<string, [string, string]>;
  HAIRS: Record<string, string>;
  HELMET_WEAR: Record<string, string[]>;
  HELMET_PAL: Record<string, Pal>;
  SHOULDERS: string[];
  BOOT_WINGS_WEAR: string[];
  SWORD: string[];
  staff: (pal: Pal) => Grid;
};

/** Letras do corpo dobradas (cada letra vira 2×2). */
function up2(rows: string[], w: number): string[][] {
  const out: string[][] = [];
  for (const r of rows) {
    const line: string[] = [];
    for (let x = 0; x < w; x++) {
      const ch = r.charAt(x) || '.';
      line.push(ch, ch);
    }
    out.push(line, [...line]);
  }
  return out;
}
const at = (g: string[][], x: number, y: number) => g[y]?.[x] ?? '.';

/** Corpo com detalhe novo, ainda em letras (a paleta da roupa continua valendo). */
export function body24(gender: 'homem' | 'mulher'): string[] {
  const g = up2(AV.BODY[gender], 16);
  const H = g.length;
  const W = 32;
  const src = g.map((r) => [...r]);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const c = src[y][x];
      // mechas de luz no cabelo
      if (c === 'H' && at(src, x, y - 1) === 'O' && at(src, x, y + 1) === 'H' && x >= 8 && x <= 18) g[y + 1][x] = 'a';
      // pele: sombra do lado direito
      if (c === 'S' && (at(src, x + 1, y) === 'O' || at(src, x + 1, y) === 'H') && at(src, x - 1, y) === 'S') g[y][x] = 's';
      // roupa: luz em cima à esquerda, sombra à direita
      if (c === 'M' && at(src, x, y - 1) === 'O' && x < 16) g[y][x] = 'q';
      if (c === 'M' && at(src, x + 1, y) === 'O' && x > 16) g[y][x] = 'm';
      // calça e botas
      if (c === 'P' && at(src, x + 1, y) === 'O') g[y][x] = 'x';
      if (c === 'K' && at(src, x, y - 1) !== 'K' && at(src, x - 1, y) !== 'K') g[y][x] = 'i';
      if (c === 'K' && at(src, x, y + 1) === 'O') g[y][x] = 'j';
    }
  // olhos: bloco 2×2 com brilho, bochecha embaixo
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (src[y][x] === 'E' && at(src, x - 1, y) !== 'E' && at(src, x, y - 1) !== 'E') {
        g[y][x + 1] = 'e';
        if (at(src, x - 1, y + 3) === 'S') g[y + 3][x - 1] = 'r';
        if (at(src, x + 2, y + 3) === 'S') g[y + 3][x + 2] = 'r';
      }
  // nariz e boca: o bloco "ss" do rosto vira nariz (2) e boca (4)
  for (let y = 0; y < H; y++) {
    const xs = [];
    for (let x = 0; x < W; x++) if (src[y][x] === 's' && at(src, x, y - 1) === 'S') xs.push(x);
    if (xs.length === 4) {
      g[y][xs[0]] = 'S';
      g[y][xs[3]] = 'S';
      g[y + 1][xs[0]] = 'n';
      g[y + 1][xs[1]] = 'n';
      g[y + 1][xs[2]] = 'n';
      g[y + 1][xs[3]] = 'n';
      break;
    }
  }
  // fivela do cinto
  for (let y = 0; y < H; y++) {
    const xs = [];
    for (let x = 0; x < W; x++) if (src[y][x] === 'B') xs.push(x);
    if (xs.length >= 8) {
      const mid = Math.round((xs[0] + xs[xs.length - 1]) / 2);
      for (const yy of [y, y + 1]) if (at(src, mid, yy) === 'B') (g[yy][mid - 1] = 'u'), (g[yy][mid] = 'u');
      break;
    }
  }
  return g.map((r) => r.join(''));
}

function grid(rows: string[], pal: Pal, w: number): Grid {
  return rows.map((r) => {
    const line: (string | null)[] = [];
    for (let x = 0; x < w; x++) {
      const ch = r.charAt(x);
      line.push(ch && ch !== '.' ? (ch === 'O' && !pal.O ? OUTLINE : pal[ch] ?? null) : null);
    }
    return line;
  });
}
/** Desenho antigo dobrado (enquanto não é redesenhado). */
function dbl(g: Grid): Grid {
  const out: Grid = [];
  for (const r of g) {
    const line: (string | null)[] = [];
    for (const c of r) line.push(c, c);
    out.push(line, [...line]);
  }
  return out;
}
function paint(dst: Grid, src: Grid, ox: number, oy: number) {
  for (let y = 0; y < src.length; y++)
    for (let x = 0; x < src[y].length; x++) {
      const c = src[y][x];
      const ty = y + oy;
      const tx = x + ox;
      if (c && ty >= 0 && ty < dst.length && tx >= 0 && tx < dst[0].length) dst[ty][tx] = c;
    }
}
/** Contorno de 2 pixels (do dobro) volta a ter 1, sem apagar as linhas de dentro. */
export function thin(g: Grid): Grid {
  const h = g.length;
  const w = g[0].length;
  const get = (x: number, y: number) => (y < 0 || y >= h || x < 0 || x >= w ? null : g[y][x]);
  const isO = (c: string | null) => c === OUTLINE;
  const fill = (c: string | null) => !!c && c !== OUTLINE;
  const out = g.map((r) => [...r]);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!isO(g[y][x])) continue;
      const n: [number, number][] = [[-1, 0], [0, -1], [1, 0], [0, 1]];
      if (n.some(([dx, dy]) => get(x + dx, y + dy) === null)) continue;
      for (const [dx, dy] of n) {
        const c = get(x + dx, y + dy);
        if (!fill(c) || !isO(get(x - dx, y - dy))) continue;
        const backward = dx < 0 || dy < 0;
        if (backward || get(x - 2 * dx, y - 2 * dy) === null) {
          out[y][x] = c;
          break;
        }
      }
    }
  return out;
}


// ---------- R3b: roupas e botas ----------

const SHOULDERS24 = [
  '..OOOOOOO..............OOOOOOO..', '.OMWWMMMMO............OMMMMWWMO.', 'OMWMMMMMMMO..........OMMMMMMMWMO',
  'OMMMMMMMMMO..........OMMMMMMMMMO', 'OmMMMMMMMO............OMMMMMMMmO', 'OmmmmmmmO..............OmmmmmmmO',
];
const WINGS24 = [
  '.OO..........................OO.', 'OWWO........................OWWO', 'OWwWO......................OWwWO',
  '.OWwWO....................OWwWO.', '..OWWO....................OWWO..', '...OO......................OO...',
];
const TORSO = new Set(['M', 'm', 'q', 't']);
const h01 = (x: number, y: number) => {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
};

/** Textura de cada roupa no tronco (as letras continuam as da paleta da roupa). */
function dressArmor(rows: string[], id: string, shape: string): string[] {
  const g = rows.map((r) => [...r]);
  let top = -1;
  let bottom = -1;
  for (let y = 0; y < g.length; y++)
    if (g[y].some((c) => TORSO.has(c))) {
      if (top < 0) top = y;
      bottom = y;
    }
  const set = (x: number, y: number, c: string) => {
    if (TORSO.has(g[y]?.[x])) g[y][x] = c;
  };
  for (let y = top; y <= bottom; y++)
    for (let x = 0; x < 32; x++) {
      if (!TORSO.has(g[y][x])) continue;
      const dy = y - top;
      switch (id) {
        case 'aprendiz':
          if (dy < 5 && (x === 15 - dy || x === 16 + dy)) set(x, y, 't');
          break;
        case 'gibao':
          if ((x === 15 || x === 16) && y % 2 === 0) set(x, y, 't');
          if (dy < 2) set(x, y, 'm');
          break;
        case 'malha':
          if (y % 2 === 0 ? x % 2 === 0 : x % 2 === 1) set(x, y, y % 2 === 0 ? 'W' : 'm');
          break;
        case 'manto':
        case 'mantoFloresta':
          if (x === 15 || x === 16) set(x, y, 'G');
          if (y === bottom) set(x, y, 'G');
          if (id === 'manto' && h01(x, y) > 0.94) set(x, y, 'W');
          if (id === 'mantoFloresta' && h01(x, y) > 0.86) set(x, y, h01(y, x) > 0.5 ? 'W' : 't');
          break;
        default:
          if (shape === 'plate') {
            if (dy % 4 === 3) set(x, y, 't');
            if (x === 10 || x === 11) set(x, y, 'W');
            if (id === 'cristal' && (x + y) % 7 === 0) set(x, y, 'W');
            if (id === 'armaduraMontanha' && (x * 3 + y * 5) % 13 === 0) set(x, y, 't');
            if (id === 'armaduraArena' && x % 6 === 3 && dy % 4 === 1) set(x, y, 'G');
          }
      }
    }
  return g.map((r) => r.join(''));
}

/** Detalhe de cada bota (cadarço, rebites, lama; sapato fica baixo). */
function dressBoots(rows: string[], id: string): string[] {
  const g = rows.map((r) => [...r]);
  const BOOT = new Set(['K', 'i', 'j']);
  let top = -1;
  for (let y = 0; y < g.length; y++) if (top < 0 && g[y].some((c) => BOOT.has(c))) top = y;
  if (top < 0) return rows;
  for (let y = top; y < g.length; y++)
    for (let x = 0; x < 32; x++) {
      if (!BOOT.has(g[y][x])) continue;
      const dy = y - top;
      if (id === 'sapatos' && dy < 2) g[y][x] = 'P';
      else if (id === 'couro' && dy > 0 && dy < 5 && dy % 2 === 1 && (x === 9 || x === 22)) g[y][x] = 'l';
      else if (id === 'couro' && dy === 0) g[y][x] = 'j';
      else if (id === 'ferro' && dy === 1 && x % 3 === 0) g[y][x] = 'i';
      else if (id === 'botasPantano' && h01(x, y) > 0.7) g[y][x] = 'j';
    }
  return g.map((r) => r.join(''));
}

export interface AvatarOpts {
  genero: 'homem' | 'mulher';
  pele: string;
  cabelo: string;
  elmo: string | null;
  armadura: string;
  botas: string;
  arma: string | null;
  colar: string | null;
}

/** Personagem vestido, 64×60. */
export function avatar24(o: AvatarOpts): Grid {
  const armor = PX.find(o.armadura) ?? PX.find('aprendiz');
  const boots = PX.find(o.botas) ?? PX.find('sapatos');
  const [S, s] = AV.SKINS[o.pele] ?? AV.SKINS.media;
  const Hc = AV.HAIRS[o.cabelo] ?? AV.HAIRS.castanho;
  const base: Pal = { H: Hc, S, s, E: '#141414', P: '#3b3f5c', ...armor.pal, K: boots.pal.K };
  const pal: Pal = {
    ...base,
    a: mix(Hc, '#ffffff', 0.28),
    e: '#ffffff',
    r: mix(S, '#f43f5e', 0.25),
    n: mix(s, '#000000', 0.25),
    q: mix(base.M, '#ffffff', 0.25),
    x: mix(base.P, '#000000', 0.25),
    i: mix(base.K, '#ffffff', 0.25),
    j: mix(base.K, '#000000', 0.25),
    u: '#facc15',
    l: '#e7c48a',
  };
  if (!pal.m) pal.m = mix(base.M, '#000000', 0.2);
  const c: Grid = Array.from({ length: 60 }, () => Array(64).fill(null));
  const ox = 8;
  const oy = 12;
  const w = o.arma ? PX.find(o.arma) : null;
  if (w && w.kind === 'arco') paint(c, dbl(PX.quiverGrid(w.pal)), ox - 6, oy + 14);
  paint(c, grid(dressBoots(dressArmor(body24(o.genero), armor.id, armor.shape), boots.id), pal, 32), ox, oy);
  const nk = o.colar ? PX.find(o.colar) : null;
  if (nk && nk.neck) {
    const dot = (x: number, y: number, col: string) => paint(c, [[col, col], [col, col]], ox + x * 2, oy + y * 2);
    dot(6, 11, nk.neck[0]);
    dot(9, 11, nk.neck[0]);
    dot(7, 12, nk.neck[1]);
    dot(8, 12, nk.neck[1]);
  }
  if (armor.shape === 'plate') paint(c, grid(SHOULDERS24, armor.pal, 32), ox, oy + 20);
  if (boots.wings) paint(c, grid(WINGS24, { W: '#ffffff', w: '#cbd5e1' }, 32), ox, oy + 40);
  if (o.elmo && AV.HELMET_WEAR[o.elmo]) paint(c, dbl(grid(AV.HELMET_WEAR[o.elmo], AV.HELMET_PAL[o.elmo], 16)), ox, oy - 12);
  if (w) {
    if (w.kind === 'arco') paint(c, dbl(PX.bowGrid(w.pal)), ox + 26, oy + 12);
    else if (w.kind === 'cajado') paint(c, dbl(AV.staff(w.pal)), ox + 22, oy + 4);
    else paint(c, dbl(grid(AV.SWORD, w.pal, 16)), ox + 22, oy + 4);
  }
  return thin(c);
}
