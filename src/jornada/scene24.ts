/**
 * R1 (17/11): cenário da Jornada redesenhado com o dobro de pixels.
 * Cada desenho tem exatamente o dobro da largura e da altura do antigo e é mostrado do mesmo tamanho
 * (toSvg(g, 2)), então nenhuma tela muda de lugar: só ganha detalhe.
 */
import { Canvas, grid, OUTLINE, type Grid } from './art.ts';
import type { SkyPalette } from './catalog.ts';

export function mix(hex: string, to: string, k: number): string {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(to.slice(1), 16);
  const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - k) + ((b >> s) & 255) * k);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}
/** Ruído fixo (o mesmo desenho sempre). */
const noise = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

const WOOD = '#8b5a2b';
const WOOD_D = '#5c3a1c';
const WOOD_DD = '#451a03';
const GOLD = '#facc15';
const GOLD_D = '#ca8a04';
const RED = '#dc2626';
const RED_D = '#991b1b';

class C2 extends Canvas {
  /** Contorno de 1 pixel em volta de tudo o que foi pintado. */
  outline(): Grid {
    const add: [number, number][] = [];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (this.g[y][x]) continue;
        const near = [[0, 1], [1, 0], [0, -1], [-1, 0]].some(([dy, dx]) => {
          const c = this.g[y + dy]?.[x + dx];
          return c && c !== OUTLINE;
        });
        if (near) add.push([y, x]);
      }
    for (const [y, x] of add) this.g[y][x] = OUTLINE;
    return this.g;
  }
  /** Pedras de 6×4 com rejunte e um brilho no canto. */
  stones(x: number, y: number, w: number, h: number, a: string, b: string) {
    const hi = mix(a, '#ffffff', 0.25);
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const row = Math.floor(j / 4);
        const off = row % 2 ? 3 : 0;
        const mortar = j % 4 === 3 || (i + off) % 6 === 5;
        const corner = j % 4 === 0 && (i + off) % 6 === 0;
        this.set(x + i, y + j, mortar ? b : corner ? hi : noise(x + i, y + j) > 0.9 ? mix(a, b, 0.4) : a);
      }
  }
  /** Telhado em cone com fileiras de telhas (claro à esquerda, sombra à direita). */
  roof(cx: number, top: number, rows: number, fill: string, shade: string, startHalf = 0) {
    const light = mix(fill, '#ffffff', 0.18);
    for (let j = 0; j < rows; j++) {
      const half = startHalf + j;
      for (let i = -half - 1; i <= half; i++) {
        const x = cx + i;
        const edge = i === -half - 1 || i === half;
        let c = i >= 0 ? shade : fill;
        if (j % 3 === 2) c = mix(c, '#000000', 0.18);
        else if (j % 3 === 0 && i < -1 && i > -half) c = light;
        this.set(x, top + j, edge ? OUTLINE : c);
      }
    }
  }
  /** Janela com moldura, vidro com reflexo e, se couber, cruz no meio. */
  window(x: number, y: number, w: number, h: number, glass: string, arch = false) {
    const lit = mix(glass, '#ffffff', 0.45);
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        if (arch && j === 0 && (i === 0 || i === w - 1)) continue;
        const frame = i === 0 || j === 0 || i === w - 1 || j === h - 1;
        const cross = w >= 6 && (i === Math.floor(w / 2) || j === Math.floor(h / 2));
        this.set(x + i, y + j, frame ? OUTLINE : cross ? WOOD_D : i + j < Math.min(w, h) / 1.5 ? lit : glass);
      }
  }
  /** Porta de tábuas com topo arredondado e maçaneta. */
  door(x: number, y: number, w: number, h: number) {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        if (j === 0 && (i < 2 || i > w - 3)) continue;
        if (j === 1 && (i === 0 || i === w - 1)) continue;
        const frame = i === 0 || i === w - 1 || j === 0 || (j === 1 && (i === 1 || i === w - 2));
        this.set(x + i, y + j, frame ? WOOD_DD : i % 3 === 0 ? WOOD_D : WOOD);
      }
    this.set(x + w - 3, y + Math.floor(h / 2), GOLD);
    this.set(x + w - 3, y + Math.floor(h / 2) + 1, GOLD_D);
  }
  /** Portão de castelo: arco escuro com grade. */
  gate(x: number, y: number, w: number, h: number, wall: string) {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const r = w / 2;
        const dx = i + 0.5 - r;
        if (j < r && dx * dx + (r - j) * (r - j) > r * r + 1) continue;
        const edge = i === 0 || i === w - 1 || (j < r && dx * dx + (r - j) * (r - j) > (r - 1.2) * (r - 1.2));
        this.set(x + i, y + j, edge ? OUTLINE : j % 3 === 0 || i % 3 === 1 ? '#78716c' : '#1c1410');
      }
    void wall;
  }
  /** Ameias: blocos de 2 com vão de 2. */
  crenels(x: number, y: number, w: number, c: string) {
    const hi = mix(c, '#ffffff', 0.25);
    for (let i = 0; i < w; i++) {
      if (i % 4 < 2) {
        this.set(x + i, y, OUTLINE);
        this.set(x + i, y + 1, i % 4 === 0 ? hi : c);
        this.set(x + i, y + 2, c);
      }
      this.set(x + i, y + 3, OUTLINE);
    }
  }
  /** Bandeirinha no mastro. */
  flag(x: number, y: number, pole: number, color: string) {
    for (let j = 0; j < pole; j++) this.set(x, y + j, WOOD_D);
    const d = mix(color, '#000000', 0.25);
    for (let j = 0; j < 4; j++) for (let i = 1; i <= 5 - (j === 3 ? 2 : 0); i++) this.set(x + i, y + j, i > 3 ? d : color);
  }
  /** Caixa com contorno e preenchimento em pedras. */
  tower(x: number, y: number, w: number, h: number, a: string, b: string) {
    this.rect(x, y, w, h, OUTLINE);
    this.stones(x + 1, y + 1, w - 2, h - 1, a, b);
    // sombra no lado direito
    for (let j = 1; j < h; j++) this.set(x + w - 2, y + j, mix(this.g[y + j][x + w - 2] ?? a, '#000000', 0.15));
  }
}

// ---------- Moradas (o dobro do tamanho antigo) ----------

/** Barraca de viajante: 44×28 (antes 22×14). */
export function cabana24(): Grid {
  const c = new C2(44, 28);
  for (let j = 0; j < 22; j++) {
    const xl = 21 - j;
    const xr = 22 + j;
    for (let x = xl; x <= xr; x++) {
      const edge = x === xl || x === xr;
      const stripe = Math.floor((x - 22 + 60) / 3) % 2 === 0;
      let col = stripe ? '#d97706' : '#b45309';
      if (x > 22) col = mix(col, '#000000', 0.15);
      c.set(x, j + 2, edge ? OUTLINE : col);
    }
  }
  // abertura
  for (let d = 0; d < 12; d++) {
    const half = Math.floor(d / 2);
    for (let x = 21 - half; x <= 22 + half; x++) c.set(x, 12 + d, x === 21 - half || x === 22 + half ? '#f59e0b' : '#3f2a14');
  }
  // mastro e bandeirinha
  c.set(21, 0, WOOD_D);
  c.set(21, 1, WOOD_D);
  c.set(22, 0, RED);
  c.set(23, 0, RED);
  c.set(22, 1, RED_D);
  // fogueira
  for (let i = 0; i < 9; i++) c.set(35 + i, 25, i % 2 ? '#57534e' : '#78716c');
  c.rect(36, 24, 7, 1, WOOD_D);
  const fire = ['...Y...', '..YYO..', '.YORYO.', '.YRWRO.', 'YORWRYO'];
  fire.forEach((r, j) =>
    [...r].forEach((ch, i) => {
      const col = { Y: '#fde047', O: '#f97316', R: RED, W: '#fef9c3' }[ch as 'Y'];
      if (col) c.set(36 + i, 19 + j, col);
    }),
  );
  c.rect(0, 26, 44, 2, OUTLINE);
  return c.g;
}

/** Casinha e casa de pedra: 48×38 (antes 24×19). */
export function casinha24(t: SkyPalette, stone: boolean): Grid {
  const roof = stone ? t.blue : t.roof;
  const roofS = stone ? t.blueShade : t.roofShade;
  const wall = stone ? t.stone : t.wall;
  const wallS = stone ? t.stoneShade : t.wallShade;
  const c = new C2(48, 38);
  // chaminé
  c.rect(36, 1, 8, 2, OUTLINE);
  c.tower(37, 3, 6, 12, '#78716c', '#57534e');
  // telhado
  for (let j = 0; j < 16; j++) {
    const half = 3 + Math.round(j * 1.38);
    const row = Math.floor(j / 3);
    for (let x = Math.max(0, 24 - half); x <= Math.min(47, 23 + half); x++) {
      const edge = x === 24 - half || x === 23 + half || j === 0;
      let col = x >= 24 ? roofS : roof;
      if (j % 3 === 2 || (x + (row % 2) * 2) % 4 === 0) col = mix(col, '#000000', 0.2);
      else if (j % 3 === 0 && x < 22) col = mix(col, '#ffffff', 0.15);
      c.set(x, j, edge ? OUTLINE : col);
    }
  }
  c.rect(1, 16, 46, 1, mix(roofS, '#000000', 0.2));
  c.rect(1, 17, 46, 1, OUTLINE);
  // parede
  c.rect(3, 18, 42, 16, OUTLINE);
  if (stone) c.stones(4, 18, 40, 16, wall, wallS);
  else
    for (let y = 18; y < 34; y++)
      for (let x = 4; x < 44; x++) c.set(x, y, y % 4 === 1 ? wallS : noise(x, y) > 0.94 ? mix(wall, '#ffffff', 0.2) : wall);
  for (let y = 18; y < 34; y++) c.set(43, y, mix(c.g[y][43] ?? wall, '#000000', 0.12));
  // janelas e porta
  c.window(7, 20, 10, 9, t.win);
  c.window(31, 20, 10, 9, t.win);
  c.rect(6, 29, 12, 1, WOOD_D);
  c.rect(30, 29, 12, 1, WOOD_D);
  c.door(19, 21, 10, 13);
  // base de pedra
  c.rect(2, 34, 44, 4, OUTLINE);
  c.stones(3, 34, 42, 3, '#78716c', '#57534e');
  return c.g;
}

/** Torre do mago: 28×64 (antes 14×32). */
export function torre24(t: SkyPalette): Grid {
  const c = new C2(28, 64);
  c.rect(13, 0, 2, 2, GOLD);
  c.set(13, 0, '#fef9c3');
  c.roof(14, 2, 14, t.blue, t.blueShade);
  c.rect(0, 16, 28, 1, OUTLINE);
  c.tower(3, 16, 22, 48, t.stone, t.stoneShade);
  // faixa e janelas
  c.rect(4, 34, 20, 1, mix(t.stoneShade, '#000000', 0.2));
  c.window(10, 21, 8, 10, t.win, true);
  c.window(6, 38, 5, 6, t.win, true);
  c.window(17, 38, 5, 6, t.win, true);
  c.door(9, 50, 10, 14);
  return c.g;
}

/** Castelinho: 60×48 (antes 30×24). */
export function castelinho24(t: SkyPalette): Grid {
  const c = new C2(60, 48);
  c.crenels(12, 16, 36, t.stone);
  c.tower(12, 19, 36, 29, t.stone, t.stoneShade);
  for (const x of [0, 44]) {
    c.flag(x + 6, 0, 7, RED);
    c.crenels(x, 6, 16, t.stone);
    c.tower(x, 9, 16, 39, t.stone, t.stoneShade);
    c.window(x + 5, 18, 6, 8, t.win, true);
  }
  c.gate(24, 29, 12, 19, t.stone);
  return c.g;
}

/** Castelo: 88×72 (antes 44×36). */
export function castelo24(t: SkyPalette): Grid {
  const c = new C2(88, 72);
  // torre central com telhado
  c.flag(44, 0, 6, GOLD);
  c.roof(44, 5, 20, t.blue, t.blueShade);
  c.rect(26, 25, 36, 1, OUTLINE);
  c.tower(30, 25, 28, 47, t.stone, t.stoneShade);
  c.window(39, 32, 10, 12, t.win, true);
  // muralhas
  c.crenels(16, 40, 14, t.stone);
  c.crenels(58, 40, 14, t.stone);
  c.tower(16, 43, 14, 29, t.stone, t.stoneShade);
  c.tower(58, 43, 14, 29, t.stone, t.stoneShade);
  // torres dos lados
  for (const x of [0, 68]) {
    c.flag(x + 10, 3, 9, RED);
    c.roof(x + 10, 12, 10, t.blue, t.blueShade);
    c.rect(x, 22, 20, 1, OUTLINE);
    c.tower(x, 22, 20, 50, t.stone, t.stoneShade);
    c.window(x + 7, 32, 6, 8, t.win, true);
    c.window(x + 7, 50, 6, 8, t.win, true);
  }
  // portão e estandartes
  c.gate(36, 50, 16, 22, t.stone);
  for (const x of [20, 62]) {
    c.rect(x, 50, 6, 1, GOLD);
    c.rect(x, 51, 6, 9, RED);
    c.rect(x + 4, 51, 2, 9, RED_D);
    c.set(x, 60, RED);
    c.set(x + 1, 60, RED);
    c.set(x + 4, 60, RED_D);
    c.set(x + 5, 60, RED_D);
    c.set(x + 2, 54, GOLD);
    c.set(x + 3, 54, GOLD);
    c.set(x + 2, 55, GOLD_D);
    c.set(x + 3, 55, GOLD_D);
  }
  return c.g;
}

/** Árvore: 20×30 (antes 10×15). */
export function tree24(t: { leaf: string; leafShade: string }): Grid {
  const c = new C2(20, 30);
  const light = mix(t.leaf, '#ffffff', 0.22);
  const blobs: [number, number, number][] = [
    [10, 7, 6.2],
    [5, 11, 4.8],
    [14.5, 11, 4.8],
    [10, 13.5, 5.2],
    [6.5, 5, 3.4],
    [13.5, 5, 3.4],
  ];
  for (let y = 0; y < 20; y++)
    for (let x = 1; x < 19; x++) {
      const inBlob = (b: [number, number, number]) => (x - b[0]) ** 2 + (y - b[1]) ** 2 <= b[2] * b[2];
      if (!blobs.some(inBlob)) continue;
      const lit = blobs.some((b) => inBlob(b) && x - b[0] + (y - b[1]) < -b[2] * 0.55);
      let col = y > 15 ? t.leafShade : lit ? light : t.leaf;
      if (!lit && noise(x, y) > 0.85) col = t.leafShade;
      c.set(x, y, col);
    }
  for (let y = 18; y < 29; y++)
    for (let x = 8; x < 12; x++) c.set(x, y, x === 9 && y % 3 !== 0 ? '#4a2f18' : x === 11 ? '#56371d' : '#6b4423');
  for (let x = 6; x < 14; x++) c.set(x, 28, x === 6 || x === 13 ? '#4a2f18' : '#6b4423');
  c.outline();
  return c.g;
}

// ---------- Céu ----------

/** Sol de 24 pixels, na cor da hora do dia. */
export function sun24(color: string): Grid {
  const c = new C2(24, 24);
  const hi = mix(color, '#ffffff', 0.5);
  const sh = mix(color, '#000000', 0.15);
  for (let y = 0; y < 24; y++)
    for (let x = 0; x < 24; x++) {
      const d = Math.hypot(x - 11.5, y - 11.5);
      if (d <= 7) c.set(x, y, x + y < 18 && d > 3 ? hi : x + y > 28 ? sh : color);
    }
  // raios
  for (const [x, y] of [
    [11, 0], [12, 0], [11, 1], [12, 1], [11, 22], [12, 22], [11, 23], [12, 23],
    [0, 11], [0, 12], [1, 11], [1, 12], [22, 11], [22, 12], [23, 11], [23, 12],
    [3, 3], [4, 4], [20, 3], [19, 4], [3, 20], [4, 19], [20, 20], [19, 19],
  ])
    c.set(x, y, color);
  return c.g;
}

/** Lua crescente de 24 pixels. */
export function moon24(): Grid {
  const c = new C2(24, 24);
  for (let y = 0; y < 24; y++)
    for (let x = 0; x < 24; x++) {
      const inA = (x - 11.5) ** 2 + (y - 11.5) ** 2 <= 100;
      const inB = (x - 16.5) ** 2 + (y - 8.5) ** 2 <= 72;
      if (inA && !inB) c.set(x, y, (x - 16.5) ** 2 + (y - 8.5) ** 2 <= 100 ? '#fde68a' : '#fef3c7');
    }
  c.set(5, 14, '#e7c873');
  c.set(6, 15, '#e7c873');
  c.set(9, 19, '#e7c873');
  c.outline();
  for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) if (c.g[y][x] === OUTLINE) c.g[y][x] = '#334155';
  return c.g;
}

/** Estrela grande em cruz (5×5) para o céu de noite. */
export const STAR24 = grid(['..W..', '..Y..', 'WYWYW', '..Y..', '..W..'], { W: '#fef9c3', Y: '#fde047' }, 5);
