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
  ARMOR_TUNIC: string[];
  ARMOR_PLATE: string[];
  BOOTS: string[];
  BOOT_WINGS_ICON: string[];
  feather: (pal: Pal) => Grid;
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

// ---------- R3c: elmos e armas ----------

type Cell = string | null;
const blankG = (w: number, h: number): Grid => Array.from({ length: h }, () => Array<Cell>(w).fill(null));
function outlineG(g: Grid): Grid {
  const h = g.length;
  const w = g[0].length;
  const add: [number, number][] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (g[y][x]) continue;
      if ([[0, 1], [1, 0], [0, -1], [-1, 0]].some(([dy, dx]) => { const c = g[y + dy]?.[x + dx]; return c && c !== OUTLINE; })) add.push([y, x]);
    }
  for (const [y, x] of add) g[y][x] = OUTLINE;
  return g;
}
/** Luz no alto à esquerda e sombra embaixo à direita (desenho dobrado ganha volume). */
export function shade(g: Grid): Grid {
  const out = g.map((r) => [...r]);
  for (let y = 0; y < g.length; y++)
    for (let x = 0; x < g[0].length; x++) {
      const c = g[y][x];
      if (!c || c === OUTLINE) continue;
      const up = g[y - 1]?.[x];
      const down = g[y + 1]?.[x];
      const right = g[y]?.[x + 1];
      const left = g[y]?.[x - 1];
      if (!up || up === OUTLINE || !left || left === OUTLINE) out[y][x] = mix(c, '#ffffff', 0.3);
      else if (!down || down === OUTLINE || !right || right === OUTLINE) out[y][x] = mix(c, '#000000', 0.18);
    }
  return out;
}

/** Espada 32×32: lâmina de 3 tons, guarda, cabo e pomo. */
function sword24(pal: Pal): Grid {
  const g = blankG(32, 32);
  const set = (x: number, y: number, c: string) => { if (x >= 0 && x < 32 && y >= 0 && y < 32) g[y][x] = c; };
  const edge = mix(pal.w, '#000000', 0.2);
  for (let i = 0; i < 17; i++) {
    const x = 13 + i;
    const y = 18 - i;
    set(x, y, pal.W);
    set(x + 1, y, pal.w);
    set(x + 1, y + 1, edge);
  }
  set(30, 1, pal.W);
  const gd = mix(pal.G, '#000000', 0.25);
  for (let j = -4; j <= 4; j++) { set(11 + j, 19 + j, pal.G); set(12 + j, 19 + j, gd); }
  const hd = mix(pal.H, '#000000', 0.25);
  for (let k = 0; k < 5; k++) { set(9 - k, 21 + k, pal.H); set(10 - k, 21 + k, hd); }
  set(3, 26, pal.P); set(4, 26, pal.P); set(3, 27, mix(pal.P, '#000000', 0.25)); set(4, 27, mix(pal.P, '#ffffff', 0.4));
  return outlineG(g);
}

/** Cajado 32×32: haste na diagonal e orbe com brilho. */
function staff24(pal: Pal): Grid {
  const g = blankG(32, 32);
  const set = (x: number, y: number, c: string) => { if (x >= 0 && x < 32 && y >= 0 && y < 32) g[y][x] = c; };
  for (let i = 0; i < 22; i++) { set(1 + i, 30 - i, pal.B); set(2 + i, 30 - i, pal.b || pal.B); }
  const G = pal.G || '#facc15';
  for (const [x, y] of [[18, 10], [19, 9], [21, 14], [22, 13], [17, 13], [22, 9]]) set(x, y, G);
  for (let y = 0; y < 14; y++)
    for (let x = 18; x < 32; x++) {
      const d = Math.hypot(x - 24.5, y - 6.5);
      if (d <= 5.2) set(x, y, d < 2.4 && x < 24 && y < 6 ? pal.W : x - 24.5 + (y - 6.5) > 2.5 ? pal.c : pal.C);
    }
  set(22, 4, '#ffffff');
  return outlineG(g);
}

/** Arco 14×34 (curva, empunhadura e corda). */
function bow24(pal: Pal): Grid {
  const g = blankG(14, 34);
  for (let y = 0; y < 34; y++) {
    const wx = Math.round(2 + 7 * Math.sin((Math.PI * y) / 33));
    const grip = y >= 14 && y <= 19;
    g[y][wx] = grip ? pal.G : pal.W;
    if (y > 3 && y < 30) g[y][wx + 1] = grip ? mix(pal.G, '#000000', 0.2) : pal.w;
    if (y > 3 && y < 30 && !grip) g[y][wx + 2] = pal.w;
    if (y >= 2 && y <= 31 && wx > 2) g[y][2] = pal.S;
  }
  g[0][2] = pal.W;
  g[33][2] = pal.W;
  return outlineG(g);
}

/** Aljava 10×22 com flechas. */
function quiver24(pal: Pal): Grid {
  const g = blankG(10, 22);
  const Q = '#92400e';
  const q = '#78350f';
  for (let y = 5; y < 21; y++) for (let x = 2; x < 8; x++) g[y][x] = x === 2 ? mix(Q, '#ffffff', 0.2) : y % 4 === 0 ? q : Q;
  for (let x = 1; x < 9; x++) g[5][x] = q;
  for (const x of [3, 6]) {
    g[0][x] = pal.F; g[1][x] = pal.F; g[1][x - 1] = pal.F; g[1][x + 1] = pal.F;
    for (let y = 2; y < 5; y++) g[y][x] = '#e5e7eb';
  }
  return outlineG(g);
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
  if (w && w.kind === 'arco') paint(c, quiver24(w.pal), ox - 6, oy + 14);
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
  if (o.elmo && AV.HELMET_WEAR[o.elmo]) paint(c, shade(thin(outlineG(dbl(grid(AV.HELMET_WEAR[o.elmo], AV.HELMET_PAL[o.elmo], 16))))), ox, oy - 12);
  if (w) {
    if (w.kind === 'arco') paint(c, bow24(w.pal), ox + 26, oy + 12);
    else if (w.kind === 'cajado') paint(c, staff24(w.pal), ox + 22, oy + 4);
    else paint(c, sword24(w.pal), ox + 22, oy + 4);
  }
  return thin(c);
}

// ---------- R4a: ícones do Arsenal ----------

/** Arco com flecha (ícone), 32×38. */
function bowIcon24(pal: Pal): Grid {
  const g = blankG(32, 38);
  paint(g, bow24(pal), 12, 2);
  for (const y of [19, 20]) for (let x = 4; x < 27; x++) if (!g[y][x] || g[y][x] === OUTLINE || g[y][x] === pal.S) g[y][x] = y === 19 ? pal.A : mix(pal.A, '#000000', 0.25);
  for (const [x, y] of [[27, 19], [28, 19], [29, 19], [27, 20], [28, 20], [29, 20], [27, 18], [27, 21], [28, 18], [28, 21], [30, 19], [30, 20]]) g[y][x] = pal.P;
  for (const [x, y] of [[2, 17], [3, 17], [4, 17], [2, 18], [3, 18], [2, 21], [3, 21], [4, 22], [2, 22], [3, 22]]) g[y][x] = pal.F;
  return outlineG(g);
}

/** Ícone de qualquer item com o dobro de pixels (mostrado do mesmo tamanho). */
export function itemIcon24(it: { slot: string; kind?: string; pal?: Pal; icon?: [string[], Pal]; shape?: string; wings?: boolean; feather?: Pal }): Grid | null {
  if (it.slot === 'arma' && it.pal) return it.kind === 'arco' ? bowIcon24(it.pal) : it.kind === 'cajado' ? staff24(it.pal) : sword24(it.pal);
  let g: Grid | null = null;
  if (it.icon) g = grid(it.icon[0], it.icon[1], 16);
  else if (it.slot === 'armadura' && it.pal) g = grid(it.shape === 'plate' ? AV.ARMOR_PLATE : AV.ARMOR_TUNIC, it.pal, 16);
  else if (it.slot === 'botas' && it.pal) {
    g = grid(AV.BOOTS, it.pal, 16);
    if (it.wings) paint(g, grid(AV.BOOT_WINGS_ICON, { W: '#ffffff' }, 16), 0, 0);
  } else if (it.feather) g = AV.feather(it.feather);
  if (!g) return null;
  return shade(thin(outlineG(dbl(g))));
}
