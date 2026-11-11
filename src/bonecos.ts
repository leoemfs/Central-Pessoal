/**
 * Bonecos animados dos exercícios e alongamentos (desenhos próprios do app, sem imagens de terceiros).
 * Cada boneco tem duas posições (A e B); a tela vai e volta entre elas.
 * Ângulos em graus, no sistema da tela: 0 = direita, 90 = para baixo, -90 = para cima.
 * De lado, o boneco olha para a direita; "a" e "l" são o braço e a perna mais perto, "b" e "r" os de trás.
 */

export type Seg = [number, number];
export interface Pose {
  /** Tronco: do quadril ao ombro. */
  t: number;
  /** Cabeça (padrão: mesma direção do tronco). */
  h?: number;
  a: Seg;
  b: Seg;
  l: Seg;
  r: Seg;
  /** Direção dos pés (padrão: para a frente). */
  fl?: number;
  fr?: number;
  /** Fica no ar (pulo). */
  up?: number;
}
export type Prop = 'halter' | 'kettlebell' | 'elastico' | 'parede' | 'parede-frente';
export interface Figure {
  /** Visto de frente (braços e pernas para os lados). */
  front?: boolean;
  prop?: Prop;
  A: Pose;
  B: Pose;
}

export const VIEW = { w: 140, h: 100, ground: 94 };
const L = { torso: 30, neck: 3, head: 6.5, ua: 15, fa: 14, th: 20, sh: 20, foot: 6, sw: 8, hw: 4.5 };

const STAND: Pose = { t: -90, a: [95, 92], b: [85, 88], l: [92, 90], r: [88, 90] };
const FRONT: Pose = { t: -90, a: [100, 95], b: [80, 85], l: [97, 92], r: [83, 88] };
const BACK_KNEES: Pick<Pose, 't' | 'h' | 'l' | 'r' | 'fl' | 'fr'> = { t: 180, h: 182, l: [-50, 70], r: [-48, 72], fl: 0, fr: 0 };
const PLANK_UP: Pose = { t: -24, h: -24, a: [92, 92], b: [90, 90], l: [155, 155], r: [156, 156], fl: 95, fr: 95 };
const PLANK_DOWN: Pose = { t: -6, h: -8, a: [200, 60], b: [198, 62], l: [174, 174], r: [175, 175], fl: 95, fr: 95 };
const QUAD: Pose = { t: -15, h: -5, a: [90, 90], b: [88, 88], l: [90, 180], r: [92, 180], fl: 180, fr: 180 };
const SQUAT: Pose = { t: -55, a: [-5, -5], b: [0, 0], l: [15, 112], r: [18, 110] };
const LUNGE: Pose = { t: -90, a: [92, 90], b: [88, 88], l: [15, 95], r: [115, 175], fr: 80 };
const HINGE: Pose = { t: -25, a: [90, 90], b: [88, 88], l: [100, 85], r: [98, 84] };
const SIT: Pose = { t: -90, a: [20, 10], b: [25, 10], l: [0, 0], r: [2, 2] };

export const FIGURES: Record<string, Figure> = {
  // ----- Pernas e glúteos -----
  agachamento: { A: { ...STAND }, B: SQUAT },
  'agachamento-sumo': { front: true, A: { ...FRONT, a: [115, 60], b: [65, 120] }, B: { ...FRONT, a: [125, 50], b: [55, 130], l: [155, 98], r: [25, 82] } },
  afundo: { A: STAND, B: LUNGE },
  parede: { prop: 'parede', A: { t: -90, a: [90, 90], b: [88, 88], l: [2, 90], r: [0, 90] }, B: { t: -90, a: [80, 80], b: [78, 78], l: [2, 90], r: [0, 90] } },
  panturrilha: { A: STAND, B: { ...STAND, fl: 55, fr: 55, a: [92, 88], b: [86, 85] } },
  ponte: { A: { ...BACK_KNEES, a: [5, 0], b: [3, 0] }, B: { t: 160, h: 185, a: [12, 5], b: [10, 5], l: [-5, 80], r: [-3, 82], fl: 0, fr: 0 } },
  'ponte-unilateral': { A: { ...BACK_KNEES, a: [5, 0], b: [3, 0], l: [-25, -25] }, B: { t: 160, h: 185, a: [12, 5], b: [10, 5], l: [-30, -30], r: [-3, 82], fl: 0, fr: 0 } },
  coice: { A: QUAD, B: { ...QUAD, l: [190, 270], fl: 270 } },
  'abertura-lateral': { A: { t: 180, h: 175, a: [170, 175], b: [15, 0], l: [0, 0], r: [2, 0] }, B: { t: 180, h: 175, a: [170, 175], b: [15, 0], l: [-35, -35], r: [2, 0] } },
  // ----- Peito, ombros, braços -----
  flexao: { A: PLANK_UP, B: PLANK_DOWN },
  'flexao-joelhos': { A: { ...PLANK_UP, t: -35, h: -35, l: [145, 200], r: [146, 200], fl: 200, fr: 200 }, B: { ...PLANK_DOWN, t: -8, h: -10, l: [172, 205], r: [173, 205], fl: 205, fr: 205 } },
  pike: { A: { t: 55, h: 60, a: [62, 62], b: [60, 60], l: [125, 125], r: [126, 126], fl: 100, fr: 100 }, B: { t: 70, h: 85, a: [118, 70], b: [116, 70], l: [118, 118], r: [119, 119], fl: 100, fr: 100 } },
  circulos: { front: true, A: { ...FRONT, a: [180, 180], b: [0, 0] }, B: { ...FRONT, a: [165, 160], b: [15, 20] } },
  mergulho: { A: { t: -112, a: [145, 60], b: [143, 60], l: [-35, 65], r: [-33, 66] }, B: { t: -100, a: [100, 98], b: [98, 96], l: [-10, 80], r: [-8, 82] } },
  maos: { A: { ...STAND, a: [0, 0], b: [3, 3] }, B: { ...STAND, a: [0, -6], b: [3, -3] } },
  // ----- Costas -----
  superman: { A: { t: 0, h: 0, a: [-2, 0], b: [0, 0], l: [180, 180], r: [180, 180], fl: 90, fr: 90 }, B: { t: -15, h: -22, a: [-22, -22], b: [-20, -20], l: [165, 165], r: [167, 167], fl: 90, fr: 90 } },
  'bom-dia': { A: { ...STAND, a: [-60, 180], b: [-58, 182] }, B: { t: -5, a: [30, 270], b: [32, 272], l: [96, 86], r: [94, 85] } },
  // ----- Abdome -----
  abdominal: { A: { ...BACK_KNEES, a: [0, 180], b: [2, 182] }, B: { ...BACK_KNEES, t: 205, h: 212, a: [25, 205], b: [27, 207] } },
  prancha: { A: { t: -12, h: -12, a: [90, 0], b: [88, 0], l: [168, 168], r: [169, 169], fl: 95, fr: 95 }, B: { t: -13, h: -14, a: [90, 0], b: [88, 0], l: [167, 167], r: [168, 168], fl: 95, fr: 95 } },
  bicicleta: { A: { t: 200, h: 208, a: [-130, 160], b: [-128, 162], l: [-110, 0], r: [-10, -10], fl: -90, fr: -10 }, B: { t: 200, h: 208, a: [-130, 160], b: [-128, 162], l: [-10, -10], r: [-110, 0], fl: -10, fr: -90 } },
  'elevacao-pernas': { A: { t: 180, h: 182, a: [0, 0], b: [2, 0], l: [-12, -12], r: [-10, -10], fl: -90, fr: -90 }, B: { t: 180, h: 182, a: [0, 0], b: [2, 0], l: [-85, -85], r: [-83, -83], fl: 0, fr: 0 } },
  escalador: { A: PLANK_UP, B: { ...PLANK_UP, l: [35, 125], fl: 90 } },
  'prancha-lateral': { A: { t: 193, h: 193, a: [90, 180], b: [-90, -90], l: [13, 13], r: [14, 14], fl: 0, fr: 0 }, B: { t: 196, h: 196, a: [90, 180], b: [-95, -95], l: [16, 16], r: [17, 17], fl: 0, fr: 0 } },
  // ----- Com equipamento -----
  'agachamento-halter': { prop: 'halter', A: { ...STAND, a: [90, 90], b: [88, 88] }, B: { ...SQUAT, a: [95, 95], b: [93, 93] } },
  'afundo-halter': { prop: 'halter', A: { ...STAND, a: [90, 90], b: [88, 88] }, B: { ...LUNGE, a: [90, 90], b: [88, 88] } },
  stiff: { prop: 'halter', A: { ...STAND, a: [92, 90], b: [90, 88] }, B: { t: -15, h: -25, a: [90, 90], b: [88, 88], l: [96, 86], r: [94, 85] } },
  'ponte-halter': { prop: 'halter', A: { ...BACK_KNEES, a: [-15, 15], b: [-13, 17] }, B: { t: 160, h: 185, a: [-5, 25], b: [-3, 27], l: [-5, 80], r: [-3, 82], fl: 0, fr: 0 } },
  swing: { prop: 'kettlebell', A: { t: -35, a: [105, 110], b: [103, 108], l: [100, 85], r: [98, 84] }, B: { ...STAND, a: [0, 0], b: [2, 2] } },
  'supino-chao': { prop: 'halter', A: { ...BACK_KNEES, a: [-90, -90], b: [-88, -88] }, B: { ...BACK_KNEES, a: [20, -90], b: [22, -88] } },
  pullover: { prop: 'halter', A: { ...BACK_KNEES, a: [-90, -90], b: [-88, -88] }, B: { ...BACK_KNEES, a: [-168, -170], b: [-166, -168] } },
  remada: { prop: 'halter', A: HINGE, B: { ...HINGE, a: [168, 85], b: [166, 85] } },
  'remada-elastico': { prop: 'elastico', A: { ...SIT, a: [0, 0], b: [2, 2] }, B: { ...SIT, a: [160, 0], b: [158, 2] } },
  desenvolvimento: { front: true, prop: 'halter', A: { ...FRONT, a: [180, 270], b: [0, -90] }, B: { ...FRONT, a: [260, 265], b: [-80, -85] } },
  'elevacao-lateral': { front: true, prop: 'halter', A: { ...FRONT, a: [100, 95], b: [80, 85] }, B: { ...FRONT, a: [180, 180], b: [0, 0] } },
  rosca: { prop: 'halter', A: { ...STAND, a: [90, 90], b: [88, 88] }, B: { ...STAND, a: [90, -75], b: [88, -73] } },
  'triceps-frances': { prop: 'halter', A: { ...STAND, a: [-95, -95], b: [-93, -93] }, B: { ...STAND, a: [-100, -205], b: [-98, -203] } },
  'rosca-punho': { prop: 'halter', A: { ...STAND, a: [90, 0], b: [88, 0] }, B: { ...STAND, a: [90, -20], b: [88, -20] } },
  fazendeiro: { prop: 'halter', A: { ...STAND, a: [90, 90], b: [88, 88], l: [72, 100], r: [108, 92] }, B: { ...STAND, a: [90, 90], b: [88, 88], l: [108, 92], r: [72, 100] } },
  'abdominal-halter': { prop: 'halter', A: { ...BACK_KNEES, a: [-20, 200], b: [-18, 202] }, B: { ...BACK_KNEES, t: 205, h: 212, a: [5, 225], b: [7, 227] } },
  'torcao-russa': { prop: 'halter', A: { t: -125, h: -110, a: [-15, 30], b: [-12, 32], l: [-35, 60], r: [-33, 62] }, B: { t: -120, h: -100, a: [35, 80], b: [37, 82], l: [-35, 60], r: [-33, 62] } },
  // ----- Alongamentos -----
  espreguicar: { front: true, A: FRONT, B: { ...FRONT, a: [255, 265], b: [-75, -85] } },
  'gato-vaca': { A: { ...QUAD, h: 25 }, B: { ...QUAD, t: -18, h: -50 } },
  'inclinacao-lateral': { front: true, A: FRONT, B: { ...FRONT, t: -72, h: -65, a: [-100, -40], b: [70, 80] } },
  sentado: { front: true, A: { t: -90, a: [120, 60], b: [60, 120], l: [150, 20], r: [30, 160] }, B: { t: -82, h: -78, a: [130, 50], b: [50, 130], l: [150, 20], r: [30, 160] } },
  respirar: { front: true, A: FRONT, B: { ...FRONT, a: [130, 115], b: [50, 65] } },
  'cabeca-lado': { front: true, A: FRONT, B: { ...FRONT, h: -62 } },
  'queixo-peito': { A: STAND, B: { ...STAND, h: -25 } },
  'braco-cruzado': { front: true, A: FRONT, B: { ...FRONT, a: [5, 0], b: [70, -170] } },
  'maos-atras': { A: STAND, B: { ...STAND, t: -95, h: -100, a: [128, 130], b: [126, 128] } },
  'joelhos-peito': { A: { t: 180, h: 182, a: [-50, 10], b: [-48, 12], l: [-95, 0], r: [-93, 2], fl: -90, fr: -88 }, B: { t: 180, h: 182, a: [-70, 0], b: [-68, 2], l: [-125, -10], r: [-123, -8], fl: -100, fr: -98 } },
  'torcao-deitado': { A: { t: 180, h: 182, a: [180, 180], b: [-90, -90], l: [-60, 30], r: [-58, 32], fl: 0, fr: 0 }, B: { t: 180, h: 182, a: [180, 180], b: [-90, -90], l: [-25, 45], r: [-23, 47], fl: 0, fr: 0 } },
  crianca: { A: { t: -90, a: [-85, -85], b: [-83, -83], l: [90, 180], r: [92, 180], fl: 180, fr: 180 }, B: { t: 22, h: 40, a: [-5, 0], b: [-3, 2], l: [30, 180], r: [32, 180], fl: 180, fr: 180 } },
  quadriceps: { A: STAND, B: { ...STAND, a: [100, 98], l: [95, -100], fl: -160 } },
  posterior: { A: { ...SIT, a: [-80, -80], b: [-78, -78] }, B: { ...SIT, t: -25, h: -15, a: [10, 10], b: [12, 12] } },
  'panturrilha-parede': { prop: 'parede-frente', A: { t: -75, a: [-10, -10], b: [-8, -8], l: [80, 100], r: [112, 112] }, B: { t: -60, a: [-20, -20], b: [-18, -18], l: [70, 105], r: [122, 122] } },
  peitoral: { A: { ...STAND, a: [180, 180] }, B: { ...STAND, t: -95, h: -95, a: [172, 176] } },
};

/** Movimentos dos alongamentos guiados → boneco (pelo começo do nome). */
const STRETCH_FIGS: [string, string][] = [
  ['Espreguiçar', 'espreguicar'], ['Gato e vaca', 'gato-vaca'], ['Rotação de ombros', 'circulos'], ['Inclinação lateral', 'inclinacao-lateral'],
  ['Torção sentado', 'sentado'], ['Respirar', 'respirar'], ['Cabeça à', 'cabeca-lado'], ['Queixo ao peito', 'queixo-peito'],
  ['Braço cruzado', 'braco-cruzado'], ['Mãos atrás', 'maos-atras'], ['Joelhos ao peito', 'joelhos-peito'], ['Torção deitado', 'torcao-deitado'],
  ['Postura da criança', 'crianca'], ['Ponte', 'ponte'], ['Quadríceps', 'quadriceps'], ['Posterior da coxa', 'posterior'],
  ['Panturrilha', 'panturrilha-parede'], ['Peitoral', 'peitoral'],
];
export const stretchFigure = (move: string) => STRETCH_FIGS.find(([p]) => move.startsWith(p))?.[1] ?? 'respirar';

// ---------- Desenho ----------

type P = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const step = (p: P, len: number, deg: number): P => [p[0] + len * Math.cos(rad(deg)), p[1] + len * Math.sin(rad(deg))];
const lerp = (x: number, y: number, s: number) => x + (y - x) * s;

function full(p: Pose, front: boolean): Required<Pose> {
  return {
    ...p,
    h: p.h ?? p.t,
    fl: p.fl ?? (front ? p.l[1] + 90 : p.l[1] - 90),
    fr: p.fr ?? (front ? p.r[1] - 90 : p.r[1] - 90),
    up: p.up ?? 0,
  };
}

export function mix(f: Figure, s: number): Required<Pose> {
  const a = full(f.A, !!f.front);
  const b = full(f.B, !!f.front);
  const seg = (x: Seg, y: Seg): Seg => [lerp(x[0], y[0], s), lerp(x[1], y[1], s)];
  return { t: lerp(a.t, b.t, s), h: lerp(a.h, b.h, s), a: seg(a.a, b.a), b: seg(a.b, b.b), l: seg(a.l, b.l), r: seg(a.r, b.r), fl: lerp(a.fl, b.fl, s), fr: lerp(a.fr, b.fr, s), up: lerp(a.up, b.up, s) };
}

export interface Drawn {
  /** Membros de trás (mais apagados quando de lado). */
  back: P[][];
  front: P[][];
  head: P;
  hands: [P, P];
  forearms: [number, number];
  feet: [P, P];
}

/** Pontos do boneco numa posição, com o ponto mais baixo encostado no chão. */
export function skeleton(pose: Required<Pose>, front = false): Drawn {
  const hip: P = [0, 0];
  const sh = step(hip, L.torso, pose.t);
  const side = front ? 1 : 0;
  const n = rad(pose.t + 90);
  const off = (p: P, k: number): P => [p[0] + Math.cos(n) * k * side, p[1] + Math.sin(n) * k * side];
  const sa = off(sh, -L.sw);
  const sb = off(sh, L.sw);
  const ha = off(hip, -L.hw);
  const hb = off(hip, L.hw);
  const arm = (s: P, g: Seg) => {
    const e = step(s, L.ua, g[0]);
    return [s, e, step(e, L.fa, g[1])];
  };
  const leg = (h: P, g: Seg, f: number) => {
    const k = step(h, L.th, g[0]);
    const an = step(k, L.sh, g[1]);
    return [h, k, an, step(an, L.foot, f)];
  };
  const A = arm(sa, pose.a);
  const B = arm(sb, pose.b);
  const LL = leg(ha, pose.l, pose.fl);
  const RR = leg(hb, pose.r, pose.fr);
  const head = step(sh, L.neck + L.head, pose.h);
  const torso: P[] = [hip, sh];
  const extra: P[][] = front ? [[sa, sb], [ha, hb]] : [];
  const all = [...A, ...B, ...LL, ...RR, hip, sh];
  const low = Math.max(head[1] + L.head, ...all.map((p) => p[1]));
  const dy = VIEW.ground - pose.up - low;
  const mv = (p: P): P => [p[0], p[1] + dy];
  const mvl = (l: P[]) => l.map(mv);
  return {
    back: front ? [] : [mvl(B), mvl(RR)],
    front: front ? [mvl(RR), mvl(LL), mvl(torso), ...extra.map(mvl), mvl(A), mvl(B)] : [mvl(LL), mvl(torso), mvl(A)],
    head: mv(head),
    hands: [mv(A[2]), mv(B[2])],
    forearms: [pose.a[1], pose.b[1]],
    feet: [mv(LL[3]), mv(RR[3])],
  };
}

/** Deslocamento horizontal para o boneco ficar no meio (igual nas duas posições, sem "escorregar"). */
export function centerX(f: Figure): number {
  let lo = Infinity;
  let hi = -Infinity;
  for (const s of [0, 0.5, 1]) {
    const d = skeleton(mix(f, s), f.front);
    for (const p of [...d.back.flat(), ...d.front.flat(), d.head]) {
      lo = Math.min(lo, p[0]);
      hi = Math.max(hi, p[0]);
    }
    lo = Math.min(lo, d.head[0] - L.head);
    hi = Math.max(hi, d.head[0] + L.head);
  }
  return VIEW.w / 2 - (lo + hi) / 2;
}

export const HEAD_R = L.head;

const pts = (l: P[]) => l.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

/** Desenho do boneco (conteúdo de um <svg viewBox="0 0 140 100">) na posição s (0 = A, 1 = B). */
export function figureSvg(id: string, s: number, dx?: number): string {
  const f = FIGURES[id] ?? FIGURES.respirar;
  const x = dx ?? centerX(f);
  const d = skeleton(mix(f, s), f.front);
  const sh = (l: P[]): P[] => l.map((p) => [p[0] + x, p[1]]);
  const line = (l: P[], w: number, cls: string) => `<polyline class="${cls}" points="${pts(sh(l))}" stroke-width="${w}"/>`;
  const out: string[] = [`<line class="bn-floor" x1="6" y1="${VIEW.ground + 2.5}" x2="${VIEW.w - 6}" y2="${VIEW.ground + 2.5}"/>`];
  if (f.prop === 'parede' || f.prop === 'parede-frente') {
    const all = [...d.back.flat(), ...d.front.flat()].map((p) => p[0] + x);
    const wx = f.prop === 'parede' ? Math.min(...all) - 4 : Math.max(...all) + 4;
    out.push(`<line class="bn-prop" x1="${wx.toFixed(1)}" y1="${VIEW.ground + 2.5}" x2="${wx.toFixed(1)}" y2="${VIEW.ground - 82}" stroke-width="3"/>`);
  }
  for (const l of d.back) out.push(line(l, 5, 'bn-back'));
  for (const l of d.front) out.push(line(l, 5.5, 'bn-line'));
  out.push(`<circle class="bn-head" cx="${(d.head[0] + x).toFixed(1)}" cy="${d.head[1].toFixed(1)}" r="${L.head}"/>`);
  const hands = f.front ? d.hands : [d.hands[0]];
  if (f.prop === 'halter') {
    hands.forEach((h, i) => {
      const k = rad(d.forearms[i] + 90);
      const a: P = [h[0] + x + Math.cos(k) * 5, h[1] + Math.sin(k) * 5];
      const b: P = [h[0] + x - Math.cos(k) * 5, h[1] - Math.sin(k) * 5];
      out.push(`<line class="bn-prop" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke-width="2.5"/>`);
      for (const e of [a, b]) out.push(`<circle class="bn-weight" cx="${e[0].toFixed(1)}" cy="${e[1].toFixed(1)}" r="2.8"/>`);
    });
  }
  if (f.prop === 'kettlebell') {
    const h = d.hands[0];
    const k = step([h[0] + x, h[1]], 5, d.forearms[0]);
    out.push(`<circle class="bn-weight" cx="${k[0].toFixed(1)}" cy="${k[1].toFixed(1)}" r="4.5"/>`);
  }
  if (f.prop === 'elastico') {
    const h = d.hands[0];
    const ft = d.feet[0];
    out.push(`<line class="bn-band" x1="${(h[0] + x).toFixed(1)}" y1="${h[1].toFixed(1)}" x2="${(ft[0] + x).toFixed(1)}" y2="${ft[1].toFixed(1)}"/>`);
  }
  return out.join('');
}
