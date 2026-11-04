/**
 * Céu da Jornada: segue o relógio do celular, acende uma estrela por dia de uso no último mês
 * e às vezes chove (sorteio estável pela data: o dia de chuva é o mesmo sempre que abrir o app).
 */
import { addDays, toISO } from '../utils.ts';
import type { SkyPhase } from './catalog.ts';
import { hash01 } from './rules.ts';

/** Manhã até 15:59, tarde de 16:00 a 18:29, noite a partir de 18:30 (e madrugada até 4:59). */
export function phaseAt(date: Date): Exclude<SkyPhase, 'chuva'> {
  const m = date.getHours() * 60 + date.getMinutes();
  if (m >= 5 * 60 && m < 16 * 60) return 'manha';
  if (m >= 16 * 60 && m < 18 * 60 + 30) return 'tarde';
  return 'noite';
}

/** Cerca de 1 dia a cada 5 tem chuva, por 2 horas entre 9h e 18h. */
export const RAIN_CHANCE = 0.2;

export function rainWindow(day: string): { start: number; end: number } | null {
  if (hash01(day, 7) >= RAIN_CHANCE) return null;
  const start = 9 + Math.floor(hash01(day, 11) * 8);
  return { start, end: start + 2 };
}

export interface SkyState {
  phase: Exclude<SkyPhase, 'chuva'>;
  rain: boolean;
  rainbow: boolean;
  stars: number;
}

/** Estrelas desta noite: uma por dia com registro nos últimos 30 dias (no máximo 30). */
export function starsTonight(activeDays: string[], today: string): number {
  const from = addDays(today, -29);
  return Math.min(30, new Set(activeDays.filter((d) => d >= from && d <= today)).size);
}

/** O céu de agora. Com `weather: 'limpo'` nunca chove. O arco-íris aparece na hora seguinte à chuva. */
export function skyAt(date: Date, activeDays: string[], weather: 'aleatorio' | 'limpo' = 'aleatorio'): SkyState {
  const day = toISO(date);
  const phase = phaseAt(date);
  const w = weather === 'limpo' ? null : rainWindow(day);
  const h = date.getHours();
  const rain = Boolean(w && h >= w.start && h < w.end);
  const rainbow = Boolean(w && h === w.end && phase !== 'noite');
  return { phase, rain, rainbow, stars: phase === 'noite' ? starsTonight(activeDays, day) : 0 };
}

/** Posições estáveis das estrelas (em % da largura e da altura do céu). */
export function starPositions(n: number, seed = 'estrelas'): { x: number; y: number; big: boolean; delay: number }[] {
  return Array.from({ length: n }, (_, i) => ({
    x: Math.round(hash01(`${seed}:${i}`, 1) * 96) + 2,
    y: Math.round(hash01(`${seed}:${i}`, 2) * 70) + 4,
    big: hash01(`${seed}:${i}`, 3) > 0.8,
    delay: Math.round(hash01(`${seed}:${i}`, 4) * 30) / 10,
  }));
}
