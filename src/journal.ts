/**
 * M44 Diário v2: regras puras do Diário (dias escritos, sequência, "Neste dia",
 * pergunta do dia e semanas do calendário da Revisão).
 */
import type { JournalEntry } from './types.ts';
import { addDays, addMonths, daysInMonth, fromISO, pad, toISO } from './utils.ts';

/** Dia (AAAA-MM-DD, hora local) de um registro. */
export const entryDay = (e: Pick<JournalEntry, 'createdAt'>): string => toISO(new Date(e.createdAt));

/** Dias com pelo menos um registro. */
export function writtenDays(entries: Pick<JournalEntry, 'createdAt'>[]): Set<string> {
  return new Set(entries.map(entryDay));
}

/** Dias seguidos com registro até hoje. Se hoje ainda não tem, conta até ontem (o dia não acabou). */
export function currentStreak(days: Set<string>, today: string): number {
  let d = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/** Maior sequência de dias seguidos com registro. */
export function bestStreak(days: Set<string>): number {
  let best = 0;
  let cur = 0;
  let prev = '';
  for (const d of [...days].sort()) {
    cur = prev && addDays(prev, 1) === d ? cur + 1 : 1;
    if (cur > best) best = cur;
    prev = d;
  }
  return best;
}

/** Segunda-feira da semana de um dia. */
export function mondayOf(day: string): string {
  return addDays(day, -((fromISO(day).getDay() + 6) % 7));
}

/** Os 7 dias (segunda a domingo) da semana que começa em `monday`. */
export function weekDays(monday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Segundas-feiras das semanas que aparecem no calendário do mês (AAAA-MM). */
export function monthWeeks(month: string): string[] {
  const last = `${month}-${pad(daysInMonth(month))}`;
  const out: string[] = [];
  for (let w = mondayOf(`${month}-01`); w <= last; w = addDays(w, 7)) out.push(w);
  return out;
}

/** Mesmo dia, `n` meses antes; null se o mês não tem esse dia (ex.: 31). */
export function sameDayMonthsAgo(today: string, n: number): string | null {
  const m = addMonths(today.slice(0, 7), -n);
  const day = Number(today.slice(8));
  return day <= daysInMonth(m) ? `${m}-${pad(day)}` : null;
}

export const MEMORY_STEPS = [
  { months: 1, label: 'Há 1 mês' },
  { months: 6, label: 'Há 6 meses' },
  { months: 12, label: 'Há 1 ano' },
] as const;

/** "Neste dia": registros de 1 mês, 6 meses e 1 ano atrás, na mesma data (mais antigos por último). */
export function memories<T extends Pick<JournalEntry, 'createdAt'>>(entries: T[], today: string): { label: string; day: string; entry: T }[] {
  const out: { label: string; day: string; entry: T }[] = [];
  for (const s of MEMORY_STEPS) {
    const day = sameDayMonthsAgo(today, s.months);
    if (!day) continue;
    entries
      .filter((e) => entryDay(e) === day)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .forEach((entry) => out.push({ label: s.label, day, entry }));
  }
  return out;
}

/** Perguntas do dia: leves, para quando não se sabe o que escrever. */
export const PROMPTS = [
  'O que fez hoje valer a pena?',
  'Qual foi o momento mais leve do dia?',
  'O que você aprendeu hoje?',
  'Com quem você gostou de conversar hoje?',
  'O que está pesando, e o que pode ajudar?',
  'Pelo que você é grato hoje?',
  'O que quer fazer diferente amanhã?',
  'Que pequena vitória você teve hoje?',
  'O que te fez sorrir hoje?',
  'Qual foi a parte mais difícil do dia?',
  'O que você fez por você hoje?',
  'Como está o seu corpo hoje?',
  'O que você adiou e por quê?',
  'Qual decisão de hoje você quer lembrar?',
  'O que te deixou com energia hoje?',
  'O que te cansou hoje?',
  'Se o dia fosse um título, qual seria?',
  'O que você faria de novo amanhã?',
  'Quem te ajudou hoje, mesmo sem saber?',
  'O que você ouviu, leu ou viu de interessante hoje?',
  'Do que você se orgulha hoje?',
  'O que você quer deixar para trás hoje?',
  'Qual foi o melhor momento da semana até agora?',
  'O que está te preocupando? Dá para fazer algo amanhã?',
  'O que você comeu de bom hoje?',
  'Que hábito te ajudou hoje?',
  'O que te surpreendeu hoje?',
  'Que conversa você quer ter em breve?',
  'Como você descansou hoje?',
  'O que você quer lembrar daqui a um ano?',
  'Qual foi o seu humor de hoje, em uma palavra? Por quê?',
  'O que você fez hoje que te aproxima de um objetivo?',
  'O que te deixou impaciente hoje?',
  'Qual pequena gentileza você fez ou recebeu?',
  'O que você aprendeu sobre você hoje?',
  'O que está indo bem ultimamente?',
  'Onde você gastou mais tempo hoje? Valeu a pena?',
  'O que você diria para você de ontem?',
  'Qual música, lugar ou cheiro marcou o dia?',
  'Que plano você quer começar amanhã?',
] as const;

/** Número do dia (dias desde 01/01/2000), para a pergunta mudar todo dia. */
function dayNumber(day: string): number {
  return Math.round((fromISO(day).getTime() - new Date(2000, 0, 1).getTime()) / 86_400_000);
}

/** Pergunta do dia; `skip` avança para as próximas ("Outra pergunta"). */
export function dailyPrompt(day: string, skip = 0): string {
  const n = PROMPTS.length;
  return PROMPTS[(((dayNumber(day) + skip) % n) + n) % n];
}
