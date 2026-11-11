/**
 * Mapas mentais (Estudos 2.0, N11.3): regras puras.
 * O mapa é uma árvore: ideia central → ramos → sub-ramos. Nada aqui desenha na tela;
 * `layoutMap` só calcula onde cada ideia fica (a pessoa organiza a árvore, o app organiza o desenho).
 */
import type { MapNode } from './types.ts';
import { uid } from './utils.ts';

/** Cores dos ramos (cada ramo principal ganha uma; os sub-ramos herdam). */
export const MAP_COLORS = ['#22c55e', '#3b82f6', '#f97316', '#a855f7', '#ef4444', '#eab308', '#06b6d4', '#ec4899'];
/** Profundidade máxima (central = 0). Evita mapas impossíveis de ler no celular. */
export const MAX_DEPTH = 6;

export const mapNode = (text: string, children: MapNode[] = []): MapNode => ({ id: uid(), text, color: null, collapsed: false, children });

/** Formato antigo (até a v0.27): centro + ramos + detalhes. */
export function fromBranches(center: string, branches: { label: string; leaves: string[] }[]): MapNode {
  return mapNode(center, branches.map((b) => mapNode(b.label, b.leaves.map((l) => mapNode(l)))));
}

export function findNode(root: MapNode, id: string): MapNode | undefined {
  if (root.id === id) return root;
  for (const c of root.children) {
    const hit = findNode(c, id);
    if (hit) return hit;
  }
  return undefined;
}

export function parentOf(root: MapNode, id: string): MapNode | undefined {
  for (const c of root.children) {
    if (c.id === id) return root;
    const hit = parentOf(c, id);
    if (hit) return hit;
  }
  return undefined;
}

export function depthOf(root: MapNode, id: string, d = 0): number {
  if (root.id === id) return d;
  for (const c of root.children) {
    const hit = depthOf(c, id, d + 1);
    if (hit >= 0) return hit;
  }
  return -1;
}

export const countNodes = (n: MapNode): number => 1 + n.children.reduce((s, c) => s + countNodes(c), 0);
const height = (n: MapNode): number => (n.children.length ? 1 + Math.max(...n.children.map(height)) : 0);

/** Copia a árvore trocando só o nó pedido (os outros continuam os mesmos objetos). */
function change(root: MapNode, id: string, fn: (n: MapNode) => MapNode): MapNode {
  if (root.id === id) return fn(root);
  let touched = false;
  const children = root.children.map((c) => {
    const next = change(c, id, fn);
    if (next !== c) touched = true;
    return next;
  });
  return touched ? { ...root, children } : root;
}

export function updateNode(root: MapNode, id: string, patch: Partial<Pick<MapNode, 'text' | 'color' | 'collapsed'>>): MapNode {
  return change(root, id, (n) => ({ ...n, ...patch }));
}

/** Nova ramificação dentro de uma ideia (que se abre, se estava recolhida). */
export function addChild(root: MapNode, parentId: string, text = 'Nova ideia'): { root: MapNode; id: string | null } {
  const d = depthOf(root, parentId);
  if (d < 0 || d >= MAX_DEPTH) return { root, id: null };
  const child = mapNode(text);
  return { root: change(root, parentId, (n) => ({ ...n, collapsed: false, children: [...n.children, child] })), id: child.id };
}

/** Nova ideia ao lado (logo abaixo) de outra. Na ideia central, vira um ramo novo. */
export function addSibling(root: MapNode, id: string, text = 'Nova ideia'): { root: MapNode; id: string | null } {
  const parent = parentOf(root, id);
  if (!parent) return addChild(root, root.id, text);
  const sib = mapNode(text);
  return {
    root: change(root, parent.id, (n) => {
      const i = n.children.findIndex((c) => c.id === id);
      return { ...n, children: [...n.children.slice(0, i + 1), sib, ...n.children.slice(i + 1)] };
    }),
    id: sib.id,
  };
}

/** Exclui a ideia e tudo o que está dentro dela. A ideia central não pode ser excluída. */
export function removeNode(root: MapNode, id: string): MapNode {
  const parent = parentOf(root, id);
  if (!parent) return root;
  return change(root, parent.id, (n) => ({ ...n, children: n.children.filter((c) => c.id !== id) }));
}

/** Sobe ou desce entre as ideias irmãs. */
export function moveSibling(root: MapNode, id: string, dir: -1 | 1): MapNode {
  const parent = parentOf(root, id);
  if (!parent) return root;
  const i = parent.children.findIndex((c) => c.id === id);
  const j = i + dir;
  if (j < 0 || j >= parent.children.length) return root;
  return change(root, parent.id, (n) => {
    const children = [...n.children];
    [children[i], children[j]] = [children[j], children[i]];
    return { ...n, children };
  });
}

/** Para onde uma ideia pode ir: qualquer outra que não seja ela mesma, nem esteja dentro dela, nem estoure a profundidade. */
export function validParents(root: MapNode, id: string): { id: string; text: string; depth: number }[] {
  const node = findNode(root, id);
  if (!node || node === root) return [];
  const h = height(node);
  const current = parentOf(root, id)?.id;
  const out: { id: string; text: string; depth: number }[] = [];
  const walk = (n: MapNode, d: number) => {
    if (n.id === id) return;
    if (n.id !== current && d + 1 + h <= MAX_DEPTH) out.push({ id: n.id, text: n.text, depth: d });
    n.children.forEach((c) => walk(c, d + 1));
  };
  walk(root, 0);
  return out;
}

/** Leva a ideia (com tudo o que tem dentro) para dentro de outra. */
export function reparent(root: MapNode, id: string, newParentId: string): MapNode {
  const node = findNode(root, id);
  if (!node || !validParents(root, id).some((p) => p.id === newParentId)) return root;
  return change(removeNode(root, id), newParentId, (n) => ({ ...n, collapsed: false, children: [...n.children, node] }));
}

// ---------- Dados antigos e backups ----------

type Rec = Record<string, unknown>;
const isRec = (x: unknown): x is Rec => typeof x === 'object' && x !== null && !Array.isArray(x);

export function normalizeMapNode(raw: unknown, depth = 0): MapNode {
  const r = isRec(raw) ? raw : {};
  const kids = Array.isArray(r.children) && depth < MAX_DEPTH ? r.children.filter(isRec) : [];
  return {
    id: typeof r.id === 'string' && r.id ? r.id : uid(),
    text: typeof r.text === 'string' ? r.text : depth ? 'Ideia' : 'Ideia central',
    color: typeof r.color === 'string' && /^#[0-9a-f]{6}$/i.test(r.color) ? r.color : null,
    collapsed: r.collapsed === true && kids.length > 0,
    children: kids.map((c) => normalizeMapNode(c, depth + 1)),
  };
}

/** Mapa novo (`root`) passa direto; mapa antigo (`center` + `branches`) vira árvore, sem perder nada. */
export function normalizeMapRoot(m: Rec): MapNode {
  if (isRec(m.root)) return normalizeMapNode(m.root);
  const branches = Array.isArray(m.branches) ? m.branches.filter(isRec) : [];
  const center = typeof m.center === 'string' && m.center ? m.center : typeof m.name === 'string' && m.name ? m.name : 'Ideia central';
  return fromBranches(
    center,
    branches.map((b) => ({ label: typeof b.label === 'string' ? b.label : 'Ramo', leaves: Array.isArray(b.leaves) ? b.leaves.filter((l): l is string => typeof l === 'string') : [] })),
  );
}

// ---------- Desenho: onde cada ideia fica ----------

export interface LaidNode {
  id: string;
  parentId: string | null;
  text: string;
  /** Texto que cabe no desenho (o texto inteiro aparece no painel de edição). */
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  depth: number;
  /** -1 = lado esquerdo, 1 = lado direito, 0 = ideia central. */
  side: -1 | 0 | 1;
  color: string;
  children: number;
  collapsed: boolean;
  /** Quantas ideias estão escondidas dentro dela (quando recolhida). */
  hidden: number;
}
export interface MapLayout {
  nodes: LaidNode[];
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const GAP_X = 46;
const GAP_Y = 14;
const MAX_LABEL = 26;
const cut = (s: string) => (s.length > MAX_LABEL ? `${s.slice(0, MAX_LABEL - 1).trimEnd()}…` : s);
const widthOf = (label: string, depth: number) => Math.round(Math.min(230, Math.max(depth ? 64 : 96, label.length * (depth ? 7.4 : 8.6) + (depth ? 30 : 40))));
const heightOf = (depth: number) => (depth === 0 ? 48 : depth === 1 ? 40 : 36);

/**
 * Árvore para os dois lados: metade dos ramos principais à direita, o resto à esquerda (como no GitMind).
 * Cada ramo ocupa a altura de tudo o que tem dentro, então nada se sobrepõe. Ramos recolhidos ocupam uma linha.
 */
export function layoutMap(root: MapNode): MapLayout {
  const nodes: LaidNode[] = [];
  const span = new Map<string, number>();
  const measure = (n: MapNode, depth: number): number => {
    const h = heightOf(depth);
    const open = n.children.length > 0 && !n.collapsed;
    const total = open ? n.children.reduce((s, c) => s + measure(c, depth + 1), 0) + GAP_Y * (n.children.length - 1) : 0;
    const v = Math.max(h, total);
    span.set(n.id, v);
    return v;
  };
  const place = (n: MapNode, parentId: string | null, depth: number, side: -1 | 0 | 1, edge: number, cy: number, color: string) => {
    const label = cut(n.text.trim() || (depth ? 'Ideia' : 'Ideia central'));
    const w = widthOf(label, depth);
    const h = heightOf(depth);
    const x = side === 0 ? 0 : edge + (side * w) / 2;
    const own = n.color ?? color;
    nodes.push({ id: n.id, parentId, text: n.text, label, x, y: cy, w, h, depth, side, color: own, children: n.children.length, collapsed: n.collapsed, hidden: n.collapsed ? countNodes(n) - 1 : 0 });
    if (!n.children.length || n.collapsed) return;
    const stack = (kids: MapNode[], s: -1 | 1, firstIndex: number) => {
      const total = kids.reduce((sum, c) => sum + span.get(c.id)!, 0) + GAP_Y * (kids.length - 1);
      let cursor = cy - total / 2;
      kids.forEach((c, i) => {
        const v = span.get(c.id)!;
        const start = side === 0 ? (s * w) / 2 : edge + s * w;
        place(c, n.id, depth + 1, s, start + s * GAP_X, cursor + v / 2, depth === 0 ? MAP_COLORS[(firstIndex + i) % MAP_COLORS.length] : own);
        cursor += v + GAP_Y;
      });
    };
    if (side === 0) {
      const half = Math.ceil(n.children.length / 2);
      // Cada lado é medido sozinho, para os dois ficarem centrados na ideia central.
      stack(n.children.slice(0, half), 1, 0);
      if (n.children.length > half) stack(n.children.slice(half), -1, half);
    } else stack(n.children, side, 0);
  };
  measure(root, 0);
  place(root, null, 0, 0, 0, 0, '');
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x - n.w / 2);
    maxX = Math.max(maxX, n.x + n.w / 2);
    minY = Math.min(minY, n.y - n.h / 2);
    maxY = Math.max(maxY, n.y + n.h / 2);
  }
  return { nodes, minX, minY, maxX, maxY };
}
