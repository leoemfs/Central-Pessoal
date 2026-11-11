/**
 * N9.5: o que a agenda "Central Pessoal" do Google deve ter (regras puras, com testes).
 * Só de ida: o app manda; o que mudar lá no Google não volta.
 */
import type { AppData } from './types.ts';
import { upcoming } from './upcoming.ts';
import { addDays, formatMoney, todayISO } from './utils.ts';

/** Até quantos dias à frente vão para o Google. */
export const CALENDAR_DAYS = 60;
/** Aviso antes de compromisso com hora (minutos). */
export const EVENT_REMINDER = 30;
/** Hora do aviso de contas, tarefas e compromissos sem hora (o evento fica nessa hora, curto). */
export const DAY_REMINDER_TIME = '09:00';

export interface WantedEvent {
  /** Id do evento no Google (base32hex: letras a-v e números), fixo para o mesmo item. */
  id: string;
  summary: string;
  description: string;
  /** Data e hora local (AAAA-MM-DDTHH:MM:00). */
  start: string;
  end: string;
  /** Minutos antes do início. */
  reminder: number;
  /** Resumo do conteúdo: muda quando algo do evento muda (evita mandar de novo à toa). */
  sig: string;
}

/** Id aceito pelo Google (a-v, 0-9): a letra do tipo + o id do app em hexadecimal. */
export function eventId(kind: 'e' | 't' | 'c', ref: string): string {
  const hex = [...new TextEncoder().encode(ref)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${kind}${hex}`.slice(0, 1024);
}

const plusMinutes = (day: string, time: string, minutes: number) => {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const d = addDays(day, Math.floor(total / 1440));
  const t = ((total % 1440) + 1440) % 1440;
  return `${d}T${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}:00`;
};

const FOOTER = 'Criado pela Central Pessoal: mude pelo app (o que mudar aqui não volta para o app).';

export function wantedEvents(d: AppData, today: string = todayISO()): WantedEvent[] {
  const g = d.settings.googleCalendar;
  if (!g.on) return [];
  const out: WantedEvent[] = [];
  const { days } = upcoming(d, today, CALENDAR_DAYS);
  for (const { items } of days) {
    for (const it of items) {
      if ((it.kind === 'evento' && !g.events) || (it.kind === 'tarefa' && !g.tasks) || (it.kind === 'conta' && !g.bills)) continue;
      const timed = it.kind === 'evento' && it.time !== '';
      const time = timed ? it.time : DAY_REMINDER_TIME;
      const summary =
        it.kind === 'conta' ? `💸 Pagar: ${it.title}${it.amount !== null ? ` · ${formatMoney(it.amount)}` : ''}` : it.kind === 'tarefa' ? `☑️ ${it.title}` : it.title;
      const ev = d.events.find((x) => x.id === it.ref);
      const description = [ev?.location && `Local: ${ev.location}`, ev?.description, FOOTER].filter(Boolean).join('\n\n');
      const start = plusMinutes(it.day, time, 0);
      const end = plusMinutes(it.day, time, timed ? 60 : 15);
      const reminder = timed ? EVENT_REMINDER : 0;
      const kind = it.kind === 'evento' ? 'e' : it.kind === 'tarefa' ? 't' : 'c';
      out.push({ id: eventId(kind, it.ref), summary, description, start, end, reminder, sig: JSON.stringify([summary, description, start, end, reminder]) });
    }
  }
  return out;
}

export interface ExistingEvent {
  id: string;
  /** Excluído no Google (o id não pode ser criado de novo; tem que ser restaurado). */
  cancelled: boolean;
  sig: string;
}

export interface EventPlan {
  /** Criar do zero. */
  insert: WantedEvent[];
  /** Mudar (ou restaurar um excluído). */
  update: WantedEvent[];
  /** Tirar da agenda. */
  remove: string[];
}

export function diffEvents(wanted: WantedEvent[], existing: ExistingEvent[]): EventPlan {
  const have = new Map(existing.map((e) => [e.id, e]));
  const want = new Set(wanted.map((w) => w.id));
  const plan: EventPlan = { insert: [], update: [], remove: [] };
  for (const w of wanted) {
    const e = have.get(w.id);
    if (!e) plan.insert.push(w);
    else if (e.cancelled || e.sig !== w.sig) plan.update.push(w);
  }
  for (const e of existing) if (!e.cancelled && !want.has(e.id)) plan.remove.push(e.id);
  return plan;
}
