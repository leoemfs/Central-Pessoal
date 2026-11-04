/**
 * Pixel art da Jornada desenhada como dados: cada sprite é uma lista de linhas de texto em que
 * cada letra é uma cor da paleta ("." é transparente e "O" é o contorno escuro). Daqui sai um SVG
 * pronto para <img src>, sem arquivos de imagem.
 */

export type Grid = (string | null)[][];
export type Palette = Record<string, string>;

export const OUTLINE = '#1a1a1f';

export function blank(w: number, h: number): Grid {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => null));
}

export function grid(rows: string[], pal: Palette, width?: number): Grid {
  const w = width ?? Math.max(...rows.map((r) => r.length));
  return rows.map((r) =>
    Array.from({ length: w }, (_, x) => {
      const ch = r.charAt(x);
      if (!ch || ch === '.') return null;
      return pal[ch] ?? (ch === 'O' ? OUTLINE : null);
    }),
  );
}

/** Pinta `src` por cima de `dst` (só as células com cor), a partir de (x, y). */
export function paint(dst: Grid, src: Grid, x: number, y: number): Grid {
  src.forEach((row, j) =>
    row.forEach((c, i) => {
      const ty = y + j;
      const tx = x + i;
      if (c && ty >= 0 && ty < dst.length && tx >= 0 && tx < dst[0].length) dst[ty][tx] = c;
    }),
  );
  return dst;
}

/** Célula vazia vizinha de uma pintada vira contorno. */
export function outline(g: Grid): Grid {
  const h = g.length;
  const w = g[0].length;
  const add: [number, number][] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (g[y][x]) continue;
      const near = [[0, 1], [1, 0], [0, -1], [-1, 0]].some(([dy, dx]) => {
        const c = g[y + dy]?.[x + dx];
        return Boolean(c) && c !== OUTLINE;
      });
      if (near) add.push([y, x]);
    }
  for (const [y, x] of add) g[y][x] = OUTLINE;
  return g;
}

/** Peça na diagonal 16×16 (de baixo à esquerda para cima à direita): p = ao longo, q = de lado. */
export function diagonal(fn: (p: number, q: number, r: number, c: number) => string | null | undefined): Grid {
  const g = blank(16, 16);
  for (let r = 0; r < 16; r++) for (let c = 0; c < 16; c++) g[r][c] = fn(c - r, r + c - 15, r, c) ?? null;
  return outline(g);
}

/** SVG (data URI) com um retângulo por trecho de mesma cor em cada linha. */
export function toSvg(g: Grid): string {
  const h = g.length;
  const w = g[0]?.length ?? 0;
  const out: string[] = [];
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      const c = g[y][x];
      if (!c) {
        x++;
        continue;
      }
      const s = x;
      while (x < w && g[y][x] === c) x++;
      out.push(`<rect x="${s}" y="${y}" width="${x - s}" height="1" fill="${c}"/>`);
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" shape-rendering="crispEdges">${out.join('')}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const sprite = (rows: string[], pal: Palette, width?: number) => toSvg(grid(rows, pal, width));

/** Desenho por código (construções). */
export class Canvas {
  g: Grid;
  w: number;
  h: number;
  constructor(w: number, h: number) {
    this.g = blank(w, h);
    this.w = w;
    this.h = h;
  }
  set(x: number, y: number, c: string | null) {
    if (c && y >= 0 && y < this.h && x >= 0 && x < this.w) this.g[y][x] = c;
  }
  rect(x: number, y: number, w: number, h: number, c: string) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
  box(x: number, y: number, w: number, h: number, fill: string) {
    this.rect(x, y, w, h, OUTLINE);
    this.rect(x + 1, y + 1, w - 2, h - 2, fill);
  }
  bricks(x: number, y: number, w: number, h: number, a: string, b: string) {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const row = Math.floor(j / 3);
        const mortar = j % 3 === 2 || (i + (row % 2 ? 2 : 0)) % 5 === 0;
        this.set(x + i, y + j, mortar ? b : a);
      }
  }
  cone(cx: number, top: number, half: number, fill: string, shade: string) {
    for (let j = 0; j <= half; j++) for (let i = -j; i <= j; i++) this.set(cx + i, top + j, i === -j || i === j ? OUTLINE : i > 0 ? shade : fill);
  }
  crenels(x: number, y: number, w: number, c: string) {
    for (let i = 0; i < w; i++)
      if (i % 2 === 0) {
        this.set(x + i, y, OUTLINE);
        this.set(x + i, y + 1, c);
      }
    this.rect(x, y + 1, w, 1, OUTLINE);
  }
}
