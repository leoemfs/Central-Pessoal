/**
 * N9.5: chamadas à API do Google Agenda (v3), só na agenda "Central Pessoal" criada pelo app
 * (permissão `calendar.app.created`: o app não vê as outras agendas).
 */
import { DriveError } from './drive.ts';
import type { ExistingEvent, WantedEvent } from './calendarSync.ts';

export const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.app.created';
export const CALENDAR_NAME = 'CP Hub';
const API = 'https://www.googleapis.com/calendar/v3';

type Fetch = typeof fetch;

async function call(f: Fetch, token: string, url: string, init: RequestInit = {}): Promise<Response> {
  const res = await f(url, {
    ...init,
    headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(init.headers as Record<string, string>), Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new DriveError(res.status, `Agenda respondeu ${res.status}`);
  return res;
}

/** A agenda guardada ainda existe? (Se tiver o nome antigo, troca para o atual.) */
export async function calendarExists(token: string, id: string, f: Fetch = fetch): Promise<boolean> {
  try {
    const res = await call(f, token, `${API}/calendars/${encodeURIComponent(id)}?fields=id,summary`);
    const { summary } = (await res.json()) as { summary?: string };
    if (summary !== undefined && summary !== CALENDAR_NAME) {
      await call(f, token, `${API}/calendars/${encodeURIComponent(id)}?fields=id`, { method: 'PATCH', body: JSON.stringify({ summary: CALENDAR_NAME }) }).catch(() => undefined);
    }
    return true;
  } catch (e) {
    if (e instanceof DriveError && (e.status === 404 || e.status === 410)) return false;
    throw e;
  }
}

export async function createCalendar(token: string, timeZone: string, f: Fetch = fetch): Promise<string> {
  const res = await call(f, token, `${API}/calendars?fields=id`, {
    method: 'POST',
    body: JSON.stringify({ summary: CALENDAR_NAME, description: 'Lembretes do CP Hub (compromissos, contas e tarefas). Mude pelo app.', timeZone }),
  });
  return String(((await res.json()) as { id: string }).id);
}

export async function deleteCalendar(token: string, id: string, f: Fetch = fetch): Promise<void> {
  await call(f, token, `${API}/calendars/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch((e: unknown) => {
    if (!(e instanceof DriveError && (e.status === 404 || e.status === 410))) throw e;
  });
}

/** Eventos da agenda no período, inclusive os excluídos no Google (o id deles não pode ser criado de novo). */
export async function listEvents(token: string, calId: string, timeMin: string, timeMax: string, f: Fetch = fetch): Promise<ExistingEvent[]> {
  const out: ExistingEvent[] = [];
  let page = '';
  do {
    const q = new URLSearchParams({ timeMin, timeMax, showDeleted: 'true', maxResults: '2500', fields: 'nextPageToken,items(id,status,extendedProperties)' });
    if (page) q.set('pageToken', page);
    const res = await call(f, token, `${API}/calendars/${encodeURIComponent(calId)}/events?${q}`);
    const body = (await res.json()) as { items?: { id: string; status?: string; extendedProperties?: { private?: { sig?: string } } }[]; nextPageToken?: string };
    for (const x of body.items ?? []) out.push({ id: x.id, cancelled: x.status === 'cancelled', sig: x.extendedProperties?.private?.sig ?? '' });
    page = body.nextPageToken ?? '';
  } while (page);
  return out;
}

function eventBody(w: WantedEvent, timeZone: string) {
  return {
    id: w.id,
    status: 'confirmed',
    summary: w.summary,
    description: w.description,
    start: { dateTime: w.start, timeZone },
    end: { dateTime: w.end, timeZone },
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: w.reminder }] },
    extendedProperties: { private: { sig: w.sig, app: 'central-pessoal' } },
  };
}

/** Cria; se o id já existir (ex.: excluído antes), substitui. */
export async function insertEvent(token: string, calId: string, w: WantedEvent, timeZone: string, f: Fetch = fetch): Promise<void> {
  try {
    await call(f, token, `${API}/calendars/${encodeURIComponent(calId)}/events?fields=id`, { method: 'POST', body: JSON.stringify(eventBody(w, timeZone)) });
  } catch (e) {
    if (e instanceof DriveError && e.status === 409) return updateEvent(token, calId, w, timeZone, f);
    throw e;
  }
}

/** Muda (e restaura, se tiver sido excluído no Google). */
export async function updateEvent(token: string, calId: string, w: WantedEvent, timeZone: string, f: Fetch = fetch): Promise<void> {
  await call(f, token, `${API}/calendars/${encodeURIComponent(calId)}/events/${w.id}?fields=id`, { method: 'PUT', body: JSON.stringify(eventBody(w, timeZone)) });
}

export async function deleteEvent(token: string, calId: string, id: string, f: Fetch = fetch): Promise<void> {
  await call(f, token, `${API}/calendars/${encodeURIComponent(calId)}/events/${id}`, { method: 'DELETE' }).catch((e: unknown) => {
    if (!(e instanceof DriveError && (e.status === 404 || e.status === 410))) throw e;
  });
}
