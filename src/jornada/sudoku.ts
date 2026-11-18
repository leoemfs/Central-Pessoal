/**
 * Sudoku 6×6 dos mini games (18/11). Caixas de 2 linhas × 3 colunas, números de 1 a 6.
 * O desafio sai da data e do nível (o mesmo para o dia todo). Vale qualquer solução que siga as regras.
 */
export type SudokuLevel = 'facil' | 'medio' | 'dificil';
export const SUDOKU_LEVELS: { id: SudokuLevel; label: string; holes: number; points: number }[] = [
  { id: 'facil', label: 'Fácil', holes: 14, points: 10 },
  { id: 'medio', label: 'Médio', holes: 18, points: 20 },
  { id: 'dificil', label: 'Difícil', holes: 22, points: 30 },
];
export const N = 6;

/** Gerador pseudoaleatório estável a partir de um texto. */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}
function shuffle<T>(list: T[], r: () => number): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Desafio do dia: tabuleiro com buracos (0) e uma solução. */
export function makeSudoku(day: string, level: SudokuLevel): { puzzle: number[]; solution: number[] } {
  const r = rng(`sudoku:${day}:${level}`);
  // Linhas: 3 faixas de 2; colunas: 2 pilhas de 3. Embaralha dentro e entre elas, e os números.
  const rows = shuffle([0, 1, 2], r).flatMap((band) => shuffle([0, 1], r).map((x) => band * 2 + x));
  const cols = shuffle([0, 1], r).flatMap((stack) => shuffle([0, 1, 2], r).map((x) => stack * 3 + x));
  const nums = shuffle([1, 2, 3, 4, 5, 6], r);
  const base = (row: number, col: number) => (3 * (row % 2) + Math.floor(row / 2) + col) % 6;
  const solution = Array.from({ length: N * N }, (_, i) => nums[base(rows[Math.floor(i / N)], cols[i % N])]);
  const holes = SUDOKU_LEVELS.find((l) => l.id === level)!.holes;
  const out = new Set(shuffle([...Array(N * N).keys()], r).slice(0, holes));
  return { puzzle: solution.map((v, i) => (out.has(i) ? 0 : v)), solution };
}

const peers = (i: number) => {
  const r = Math.floor(i / N);
  const c = i % N;
  const br = Math.floor(r / 2) * 2;
  const bc = Math.floor(c / 3) * 3;
  const out = new Set<number>();
  for (let k = 0; k < N; k++) {
    out.add(r * N + k);
    out.add(k * N + c);
  }
  for (let y = br; y < br + 2; y++) for (let x = bc; x < bc + 3; x++) out.add(y * N + x);
  out.delete(i);
  return out;
};
const PEERS = Array.from({ length: N * N }, (_, i) => peers(i));

/** Casas com número repetido na linha, na coluna ou na caixa. */
export function conflicts(grid: number[]): Set<number> {
  const bad = new Set<number>();
  grid.forEach((v, i) => {
    if (!v) return;
    for (const p of PEERS[i]) if (grid[p] === v) bad.add(i);
  });
  return bad;
}

/** Completo e sem repetição. */
export const isSolved = (grid: number[]) => grid.every((v) => v >= 1 && v <= N) && conflicts(grid).size === 0;

/** Dias seguidos (até hoje ou ontem) com Sudoku resolvido. */
export function sudokuStreak(days: string[], today: string): number {
  const set = new Set(days);
  const prev = (d: string) => {
    const t = new Date(`${d}T12:00:00`);
    t.setDate(t.getDate() - 1);
    return t.toISOString().slice(0, 10);
  };
  let day = set.has(today) ? today : prev(today);
  let n = 0;
  while (set.has(day)) {
    n++;
    day = prev(day);
  }
  return n;
}
