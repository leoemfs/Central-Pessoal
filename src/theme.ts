/**
 * Cor de destaque do app (botões, aba ativa, botão +, seleção, anéis).
 * As cores de situação NÃO mudam: pago = verde, pendente = laranja, atrasado = vermelho.
 * Cada cor tem uma versão para o tema escuro e outra para o claro, com bom contraste nos dois.
 * O CSS correspondente fica em styles.css ("Cores de destaque"); o teste confere que estão iguais.
 */

export interface AccentShade {
  /** Preenchimento (botão principal, botão +, dia de hoje). */
  fill: string;
  /** Texto e ícones em destaque. */
  text: string;
  /** Texto/ícone em cima do preenchimento. */
  on: string;
}

export interface Accent {
  id: string;
  name: string;
  dark: AccentShade;
  light: AccentShade;
}

export const ACCENTS: Accent[] = [
  { id: 'verde', name: 'Verde', dark: { fill: '#22c55e', text: '#4ade80', on: '#04130a' }, light: { fill: '#166534', text: '#166534', on: '#ffffff' } },
  { id: 'azul', name: 'Azul', dark: { fill: '#60a5fa', text: '#60a5fa', on: '#031427' }, light: { fill: '#1d4ed8', text: '#1d4ed8', on: '#ffffff' } },
  { id: 'ciano', name: 'Ciano', dark: { fill: '#22d3ee', text: '#67e8f9', on: '#042f35' }, light: { fill: '#0e7490', text: '#0e7490', on: '#ffffff' } },
  { id: 'turquesa', name: 'Turquesa', dark: { fill: '#2dd4bf', text: '#5eead4', on: '#032d29' }, light: { fill: '#0f766e', text: '#0f766e', on: '#ffffff' } },
  { id: 'indigo', name: 'Índigo', dark: { fill: '#818cf8', text: '#a5b4fc', on: '#0c0e33' }, light: { fill: '#4338ca', text: '#4338ca', on: '#ffffff' } },
  { id: 'roxo', name: 'Roxo', dark: { fill: '#a78bfa', text: '#c4b5fd', on: '#1a0b3b' }, light: { fill: '#6d28d9', text: '#6d28d9', on: '#ffffff' } },
  { id: 'rosa', name: 'Rosa', dark: { fill: '#f472b6', text: '#f9a8d4', on: '#3b0723' }, light: { fill: '#be185d', text: '#be185d', on: '#ffffff' } },
  { id: 'dourado', name: 'Dourado', dark: { fill: '#facc15', text: '#fde047', on: '#2e2503' }, light: { fill: '#854d0e', text: '#854d0e', on: '#ffffff' } },
];

/** Sem escolha: escuro = verde (como sempre foi); claro = azul. */
export const DEFAULT_ACCENT = { dark: 'verde', light: 'azul' } as const;

export const ACCENT_IDS = ACCENTS.map((a) => a.id);

export function accentById(id: string | null | undefined): Accent | null {
  return ACCENTS.find((a) => a.id === id) ?? null;
}

/** Valor salvo válido, ou null (= padrão do tema). */
export function normalizeAccent(raw: unknown): string | null {
  return typeof raw === 'string' && ACCENT_IDS.includes(raw) ? raw : null;
}

/** Cor de destaque que vale de fato para o tema em uso. */
export function effectiveAccent(accent: string | null, mode: 'dark' | 'light'): Accent {
  return accentById(accent) ?? accentById(DEFAULT_ACCENT[mode])!;
}

// ---------- Contraste (WCAG) ----------

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Variáveis CSS de uma cor num tema (a mesma fórmula usada em styles.css). */
export function accentVars(s: AccentShade): Record<string, string> {
  const n = parseInt(s.fill.slice(1), 16);
  return {
    '--accent': s.fill,
    '--accent-text': s.text,
    '--accent-soft': `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255} / 0.14)`,
    '--on-accent': s.on,
  };
}

/** Bloco de CSS de todas as cores (gerado a partir de ACCENTS e colado em styles.css). */
export function accentCss(): string {
  const block = (sel: string, s: AccentShade) =>
    `${sel} {\n${Object.entries(accentVars(s)).map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}`;
  const out: string[] = [];
  const d = accentById(DEFAULT_ACCENT.dark)!;
  const l = accentById(DEFAULT_ACCENT.light)!;
  out.push(block(':root', d.dark));
  out.push(block(":root[data-theme='light']", l.light));
  out.push(`@media (prefers-color-scheme: light) {\n${block(":root[data-theme='system']", l.light).replace(/^/gm, '  ')}\n}`);
  for (const a of ACCENTS) {
    out.push(block(`:root[data-accent='${a.id}']`, a.dark));
    out.push(block(`:root[data-theme='light'][data-accent='${a.id}']`, a.light));
    out.push(`@media (prefers-color-scheme: light) {\n${block(`:root[data-theme='system'][data-accent='${a.id}']`, a.light).replace(/^/gm, '  ')}\n}`);
  }
  return out.join('\n');
}
