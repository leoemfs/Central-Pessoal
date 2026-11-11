export function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/**
 * Id estável para itens gerados pelo app (parcelas, recargas, categorias padrão):
 * o mesmo item ganha o mesmo id em qualquer aparelho, e a sincronização (N9) não duplica.
 */
export function stableId(...parts: (string | number)[]): string {
  return parts
    .map((p) => String(p).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    .join('~');
}

export const pad = (n: number) => String(n).padStart(2, '0');

/** Data local (não UTC) no formato AAAA-MM-DD. */
export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(): string {
  return toISO(new Date());
}

export function fromISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: string, n: number): string {
  const d = fromISO(s);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

/** "AAAA-MM" de uma data AAAA-MM-DD. */
export function monthKey(s: string): string {
  return s.slice(0, 7);
}

export function addMonths(key: string, n: number): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function daysInMonth(key: string): number {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function formatMonth(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return capitalize(new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }));
}

export function formatDate(
  s: string,
  opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' },
): string {
  return fromISO(s).toLocaleDateString('pt-BR', opts).replace('.', '');
}

export function formatLongDate(s: string): string {
  return capitalize(formatDate(s, { weekday: 'long', day: 'numeric', month: 'long' }));
}

export function relativeDay(s: string): string {
  const t = todayISO();
  if (s === t) return 'Hoje';
  if (s === addDays(t, 1)) return 'Amanhã';
  if (s === addDays(t, -1)) return 'Ontem';
  return formatDate(s);
}

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const formatMoney = (n: number) => money.format(n);

/** Aceita "1.234,56", "1.200", "1234.56", "R$ 10" etc. Retorna NaN se inválido. */
export function parseMoney(s: string): number {
  let t = s.replace(/[^\d,.-]/g, '');
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ''); // "1.200" = mil e duzentos
  if (t === '') return NaN;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

export const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Boa noite';
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** Sequência de dias seguidos cumpridos, terminando hoje (ou ontem, se hoje ainda não foi marcado). */
export function streak(checks: string[]): number {
  const set = new Set(checks);
  let day = todayISO();
  if (!set.has(day)) day = addDays(day, -1);
  let n = 0;
  while (set.has(day)) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

/** Dia do mês limitado ao tamanho do mês (ex.: dia 31 em fevereiro → 28/29). */
export function clampDay(month: string, day: number): string {
  return `${month}-${pad(Math.min(Math.max(day, 1), daysInMonth(month)))}`;
}

export function dayOf(s: string): number {
  return Number(s.slice(8, 10));
}

/** "03/11/2026" */
export function formatDMY(s: string): string {
  return `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`;
}

/** "03/11/2026 · 17:30" a partir de um ISO completo. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${formatDMY(toISO(d))} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function nowTime(): string {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const sum = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) * 100) / 100;
