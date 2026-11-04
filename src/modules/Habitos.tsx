import { useState } from 'react';
import type { ViewProps } from '../App';
import { useStore } from '../store';
import { useSubAction } from '../router';
import { remove, upsert } from '../actions';
import {
  bestClean, cleanDays, consistency, DEFAULT_TARGET, graduate, habitsOfDay, habitStreak, isScheduled, KIND_INFO, PERIODS,
  progressToRitual, startOf, toggleCheck, toggleSlip,
} from '../habits';
import type { DayPeriod, Habit, HabitKind } from '../types';
import { addDays, formatDMY, fromISO, todayISO, uid, WEEKDAYS } from '../utils';
import { Chips, Empty, Field, Icon, PageHeader, Pill, Progress, Segmented, Sheet, type IconName } from '../ui';

export const HABIT_COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f97316', '#ef4444', '#ec4899', '#eab308', '#06b6d4'];
const KIND_ICON: Record<HabitKind, IconName> = { ritual: 'repeat', construir: 'flag', abandonar: 'x' };
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const pct = (n: number | null) => (n === null ? '—' : `${Math.round(n * 100)}%`);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function daysLabel(days: number[]): string {
  const s = [...days].sort().join(',');
  if (s === '0,1,2,3,4,5,6') return 'Todos os dias';
  if (s === '1,2,3,4,5') return 'Dias úteis';
  if (s === '0,6') return 'Fins de semana';
  return [...days].sort().map((d) => WEEKDAYS[d]).join(', ');
}

/** Botão de marcar, na cor do ritual/hábito. */
export function HabitCheck({ h, day, label }: { h: Habit; day: string; label?: string }) {
  const { update } = useStore();
  const on = h.checks.includes(day);
  return (
    <button
      type="button"
      className={`check round${on ? ' on' : ''}`}
      style={on ? { background: h.color, borderColor: h.color } : { borderColor: h.color }}
      onClick={() => update(toggleCheck(h.id, day))}
      aria-pressed={on}
      aria-label={label ?? `Marcar "${h.name}"`}
    >
      {on && <Icon name="check" size={14} />}
    </button>
  );
}

type Tab = 'rituais' | 'habitos';

export function Habitos({ route }: ViewProps) {
  const { data, update } = useStore();
  const today = todayISO();
  const [tab, setTab] = useState<Tab>('rituais');
  const [form, setForm] = useState<{ kind: HabitKind; habit?: Habit } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  useSubAction(route, 'nucleo', {
    novo: () => setForm({ kind: tab === 'rituais' ? 'ritual' : 'construir' }),
  });

  const day = habitsOfDay(data.habits, today);
  const rituals = data.habits.filter((h) => h.kind === 'ritual');
  const building = data.habits.filter((h) => h.kind === 'construir');
  const quitting = data.habits.filter((h) => h.kind === 'abandonar');
  const notToday = rituals.filter((h) => !isScheduled(h, today));
  const doneToday = day.rituals.filter((h) => h.checks.includes(today)).length;

  return (
    <>
      <PageHeader title="Núcleo pessoal" />
      <Segmented label="Seção" value={tab} onChange={setTab} options={[{ value: 'rituais', label: 'Rituais' }, { value: 'habitos', label: 'Hábitos' }]} />

      {tab === 'rituais' ? (
        rituals.length === 0 ? (
          <section className="card">
            <Empty>Rituais são as rotinas que já fazem parte do seu dia — usar fio dental, dormir às 23h. Toque em + para criar o primeiro.</Empty>
          </section>
        ) : (
          <>
            <section className="card raised">
              <div className="toggle-row">
                <div>
                  <strong>Hoje</strong>
                  <span className="muted small">{day.rituals.length ? `${doneToday} de ${day.rituals.length} rituais feitos` : 'Nenhum ritual programado para hoje'}</span>
                </div>
                {day.rituals.length > 0 && <Pill tone={doneToday === day.rituals.length ? 'green' : 'gray'}>{Math.round((doneToday / day.rituals.length) * 100)}%</Pill>}
              </div>
              {day.rituals.length > 0 && <Progress pct={(doneToday / day.rituals.length) * 100} />}
            </section>

            {PERIODS.map((p) => {
              const list = day.rituals.filter((h) => h.period === p.id);
              if (!list.length) return null;
              return (
                <section key={p.id} className="card">
                  <div className="card-head">
                    <h2>{p.label}</h2>
                  </div>
                  <ul className="list">
                    {list.map((h) => (
                      <li key={h.id} className="row">
                        <HabitCheck h={h} day={today} />
                        <button type="button" className="row-body link-row" onClick={() => setDetailId(h.id)}>
                          <span className="row-title">{h.name}</span>
                          <span className="row-meta">
                            {h.time && <Pill>{h.time}</Pill>}
                            {h.cue && <span>Depois de {h.cue}</span>}
                          </span>
                        </button>
                        <span className="pill" title="Sequência">
                          <Icon name="flame" size={13} /> {habitStreak(h, today)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}

            {notToday.length > 0 && (
              <section className="card">
                <div className="card-head">
                  <h2>Em outros dias</h2>
                </div>
                <ul className="list">
                  {notToday.map((h) => (
                    <li key={h.id}>
                      <button type="button" className="row" onClick={() => setDetailId(h.id)}>
                        <span className="dot" style={{ background: h.color }} />
                        <div className="row-body">
                          <span className="row-title">{h.name}</span>
                          <span className="row-meta">
                            {daysLabel(h.days)}
                            {h.time ? ` · ${h.time}` : ''}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )
      ) : (
        <>
          <div className="section-head">
            <h2 className="section-title">Construindo</h2>
            <button type="button" className="link" onClick={() => setForm({ kind: 'construir' })}>
              + Novo hábito
            </button>
          </div>
          {building.length === 0 ? (
            <section className="card">
              <Empty>Hábitos que você quer começar. Depois de cumpridos por um tempo, viram rituais.</Empty>
            </section>
          ) : (
            <div className="habits">
              {building.map((h) => (
                <BuildCard key={h.id} h={h} today={today} onOpen={() => setDetailId(h.id)} onGraduate={() => update(graduate(h.id))} />
              ))}
            </div>
          )}

          <div className="section-head">
            <h2 className="section-title">Abandonando</h2>
            <button type="button" className="link" onClick={() => setForm({ kind: 'abandonar' })}>
              + Deixar um hábito
            </button>
          </div>
          {quitting.length === 0 ? (
            <section className="card">
              <Empty>Algo que você quer parar de fazer. O app conta os dias sem e guarda o seu recorde.</Empty>
            </section>
          ) : (
            <div className="habits">
              {quitting.map((h) => (
                <QuitCard key={h.id} h={h} today={today} onOpen={() => setDetailId(h.id)} />
              ))}
            </div>
          )}
        </>
      )}

      {form && <HabitForm kind={form.kind} habit={form.habit} onClose={() => setForm(null)} />}
      {detailId && <HabitDetail id={detailId} onClose={() => setDetailId(null)} onEdit={(h) => setForm({ kind: h.kind, habit: h })} />}
    </>
  );
}

function lastDays(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));
}

function BuildCard({ h, today, onOpen, onGraduate }: { h: Habit; today: string; onOpen: () => void; onGraduate: () => void }) {
  const { update } = useStore();
  const prog = progressToRitual(h);
  return (
    <section className="card habit">
      <div className="habit-head">
        <span className="dot" style={{ background: h.color }} />
        <button type="button" className="habit-name link-row" onClick={onOpen}>
          <strong>{h.name}</strong>
          {h.cue && <span className="muted small">Depois de {h.cue}</span>}
        </button>
        <span className="pill" title="Sequência">
          <Icon name="flame" size={13} /> {habitStreak(h, today)}
        </span>
      </div>
      <div className="habit-days">
        {lastDays(today, 7).map((d) => {
          const on = h.checks.includes(d);
          const planned = isScheduled(h, d);
          return (
            <button
              key={d}
              type="button"
              className={`day${on ? ' on' : ''}${d === today ? ' today' : ''}${planned ? '' : ' off'}`}
              style={on ? { background: h.color, borderColor: h.color } : undefined}
              onClick={() => update(toggleCheck(h.id, d))}
              aria-pressed={on}
              aria-label={`${h.name} em ${formatDMY(d)}${planned ? '' : ' (fora da rotina)'}`}
            >
              <span className="day-week">{WEEKDAYS[fromISO(d).getDay()]}</span>
              <span className="day-num">{fromISO(d).getDate()}</span>
            </button>
          );
        })}
      </div>
      <div className="habit-progress">
        <div className="toggle-row">
          <span className="muted small">Rumo a virar ritual</span>
          <span className="small tabular">
            {Math.min(prog.done, prog.target)} de {prog.target} dias
          </span>
        </div>
        <Progress pct={(prog.done / prog.target) * 100} />
      </div>
      {prog.ready && (
        <button type="button" className="btn soft block" onClick={onGraduate}>
          <Icon name="repeat" size={18} /> <span className="green">Pronto! Transformar em ritual</span>
        </button>
      )}
    </section>
  );
}

function QuitCard({ h, today, onOpen }: { h: Habit; today: string; onOpen: () => void }) {
  const { update } = useStore();
  const clean = cleanDays(h, today);
  const slipToday = h.slips.includes(today);
  return (
    <section className="card habit">
      <div className="habit-head">
        <span className="dot" style={{ background: h.color }} />
        <button type="button" className="habit-name link-row" onClick={onOpen}>
          <strong>{h.name}</strong>
          <span className="muted small">Desde {formatDMY(h.startDate)}</span>
        </button>
      </div>
      <div className="quit-counter">
        <span className="quit-number">{clean}</span>
        <span className="muted">{clean === 1 ? 'dia sem' : 'dias sem'}</span>
        <span className="muted small">Recorde: {plural(bestClean(h, today), 'dia', 'dias')}</span>
      </div>
      <div className="quit-strip" aria-label="Últimos 30 dias">
        {lastDays(today, 30).map((d) => (
          <span key={d} className={d < h.startDate ? 'before' : h.slips.includes(d) ? 'slip' : 'clean'} title={`${formatDMY(d)}${h.slips.includes(d) ? ' · recaída' : ''}`} />
        ))}
      </div>
      <button type="button" className="btn block" onClick={() => update(toggleSlip(h.id, today))}>
        {slipToday ? (
          <>
            <Icon name="undo" size={18} /> Desfazer recaída de hoje
          </>
        ) : (
          'Registrar recaída hoje'
        )}
      </button>
    </section>
  );
}

/** Mapa das últimas 12 semanas: cada quadrado é um dia (toque para corrigir). */
function Heatmap({ h, today }: { h: Habit; today: string }) {
  const { update } = useStore();
  const start = addDays(today, -(7 * 11 + fromISO(today).getDay()));
  const cells = Array.from({ length: 7 * 12 }, (_, i) => addDays(start, i));
  const begin = h.kind === 'abandonar' ? h.startDate : startOf(h);
  return (
    <div>
      <div className="heatmap" role="grid" aria-label="Últimas 12 semanas">
        {cells.map((d) => {
          let cls = 'none';
          let status = 'fora da rotina';
          if (d > today || d < begin) {
            status = d > today ? 'futuro' : 'antes do início';
          } else if (h.kind === 'abandonar') {
            cls = h.slips.includes(d) ? 'slip' : 'clean';
            status = h.slips.includes(d) ? 'recaída' : 'sem';
          } else if (h.checks.includes(d)) {
            cls = 'done';
            status = 'feito';
          } else if (isScheduled(h, d)) {
            cls = d === today ? 'pending' : 'miss';
            status = d === today ? 'pendente' : 'não feito';
          }
          const clickable = d <= today && d >= begin;
          return (
            <button
              key={d}
              type="button"
              role="gridcell"
              className={`hm ${cls}`}
              style={cls === 'done' ? { background: h.color } : undefined}
              disabled={!clickable}
              title={`${formatDMY(d)} · ${status}`}
              aria-label={`${formatDMY(d)}: ${status}`}
              onClick={() => update(h.kind === 'abandonar' ? toggleSlip(h.id, d) : toggleCheck(h.id, d))}
            />
          );
        })}
      </div>
      <div className="legend">
        {h.kind === 'abandonar' ? (
          <>
            <span><i className="hm-key clean" /> Sem</span>
            <span><i className="hm-key slip" /> Recaída</span>
          </>
        ) : (
          <>
            <span><i className="hm-key" style={{ background: h.color }} /> Feito</span>
            <span><i className="hm-key miss" /> Não feito</span>
            <span><i className="hm-key none" /> Fora da rotina</span>
          </>
        )}
      </div>
      <p className="muted small">Toque num dia para corrigir.</p>
    </div>
  );
}

function HabitDetail({ id, onClose, onEdit }: { id: string; onClose: () => void; onEdit: (h: Habit) => void }) {
  const { data, update } = useStore();
  const today = todayISO();
  const h = data.habits.find((x) => x.id === id);
  if (!h) return null;
  const quit = h.kind === 'abandonar';

  function del() {
    if (confirm(`Excluir "${h!.name}" e todo o histórico?`)) {
      update(remove('habits', h!.id));
      onClose();
    }
  }

  return (
    <Sheet title={h.name} badge={<Pill>{KIND_INFO[h.kind].label}</Pill>} onClose={onClose}>
      <dl className="detail-rows">
        {quit ? (
          <>
            <div>
              <dt>Dias sem</dt>
              <dd>{cleanDays(h, today)}</dd>
            </div>
            <div>
              <dt>Recorde</dt>
              <dd>{plural(bestClean(h, today), 'dia', 'dias')}</dd>
            </div>
            <div>
              <dt>Recaídas</dt>
              <dd>{h.slips.length}</dd>
            </div>
          </>
        ) : (
          <>
            <div>
              <dt>Quando</dt>
              <dd>
                {daysLabel(h.days)}
                {h.time ? ` · ${h.time}` : ''}
              </dd>
            </div>
            {h.cue && (
              <div>
                <dt>Gatilho</dt>
                <dd>Depois de {h.cue}</dd>
              </div>
            )}
            <div>
              <dt>Sequência atual</dt>
              <dd>{plural(habitStreak(h, today), 'dia', 'dias')}</dd>
            </div>
            <div>
              <dt>Consistência (30 dias)</dt>
              <dd>{pct(consistency(h, today))}</dd>
            </div>
            <div>
              <dt>Total de dias feitos</dt>
              <dd>{new Set(h.checks).size}</dd>
            </div>
          </>
        )}
      </dl>
      <Heatmap h={h} today={today} />
      {h.kind === 'construir' && (
        <button type="button" className="btn soft block" onClick={() => update(graduate(h.id))}>
          <Icon name="repeat" size={18} /> Transformar em ritual
        </button>
      )}
      <div className="btn-row">
        <button
          type="button"
          className="btn"
          onClick={() => onEdit(h)}
        >
          <Icon name="edit" size={18} /> Editar
        </button>
        <button type="button" className="btn danger" onClick={del}>
          <Icon name="trash" size={18} /> Excluir
        </button>
      </div>
    </Sheet>
  );
}

const TARGETS = [21, 30, DEFAULT_TARGET, 90];

function HabitForm({ kind: initialKind, habit, onClose }: { kind: HabitKind; habit?: Habit; onClose: () => void }) {
  const { data, update } = useStore();
  const [kind, setKind] = useState<HabitKind>(habit?.kind ?? initialKind);
  const [name, setName] = useState(habit?.name ?? '');
  const [days, setDays] = useState<number[]>(habit?.days ?? ALL_DAYS);
  const [period, setPeriod] = useState<DayPeriod>(habit?.period ?? 'livre');
  const [time, setTime] = useState(habit?.time ?? '');
  const [cue, setCue] = useState(habit?.cue ?? '');
  const [target, setTarget] = useState(habit?.target ?? DEFAULT_TARGET);
  const [startDate, setStartDate] = useState(habit?.startDate ?? todayISO());
  const [color, setColor] = useState(habit?.color ?? HABIT_COLORS[data.habits.length % HABIT_COLORS.length]);
  const [error, setError] = useState('');
  const quit = kind === 'abandonar';

  function toggleDay(d: number) {
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()));
  }

  function save() {
    if (!name.trim()) return setError('Dê um nome.');
    if (!quit && days.length === 0) return setError('Escolha ao menos um dia da semana.');
    const h: Habit = {
      id: habit?.id ?? uid(),
      name: name.trim(),
      color,
      kind,
      checks: habit?.checks ?? [],
      days: quit ? ALL_DAYS : days,
      period: quit ? 'livre' : period,
      time: quit ? '' : time,
      cue: quit ? '' : cue.trim().replace(/^depois de\s+/i, ''),
      target,
      slips: habit?.slips ?? [],
      startDate: quit ? startDate || todayISO() : (habit?.startDate ?? todayISO()),
      createdAt: habit?.createdAt ?? new Date().toISOString(),
    };
    update(upsert('habits', h));
    onClose();
  }

  const placeholder = kind === 'ritual' ? 'Ex.: Usar fio dental, dormir às 23h' : kind === 'construir' ? 'Ex.: Ler 10 páginas, academia' : 'Ex.: Refrigerante, celular antes de dormir';

  return (
    <Sheet
      title={habit ? 'Editar' : 'Novo no Núcleo'}
      onClose={onClose}
      footer={
        <>
          {error && <p className="form-error">{error}</p>}
          <button type="button" className="btn primary block" onClick={save}>
            Salvar
          </button>
        </>
      }
    >
      {!habit && (
        <div className="option-cards" role="radiogroup" aria-label="Tipo">
          {(Object.keys(KIND_INFO) as HabitKind[]).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={kind === k} className={`option-card${kind === k ? ' on' : ''}`} onClick={() => setKind(k)}>
              <span className="opt-icon">
                <Icon name={KIND_ICON[k]} />
              </span>
              <strong>{KIND_INFO[k].label}</strong>
              <span className="muted">{KIND_INFO[k].hint}</span>
            </button>
          ))}
        </div>
      )}
      <Field label="Nome">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} autoFocus={!habit} />
      </Field>

      {quit ? (
        <Field label="Sem desde" hint="O contador de dias começa aqui.">
          <input type="date" className="input" value={startDate} max={todayISO()} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
      ) : (
        <>
          <div className="field">
            <span className="field-label">Dias da semana</span>
            <div className="weekday-picker" role="group" aria-label="Dias da semana">
              {WEEKDAYS.map((w, i) => (
                <button key={w} type="button" className={days.includes(i) ? 'on' : ''} aria-pressed={days.includes(i)} aria-label={w} onClick={() => toggleDay(i)}>
                  {w.charAt(0)}
                </button>
              ))}
            </div>
            <Chips
              label="Atalhos de dias"
              value={null}
              onChange={(v) => setDays(v === 'todos' ? ALL_DAYS : v === 'uteis' ? [1, 2, 3, 4, 5] : [0, 6])}
              options={[
                { value: 'todos', label: 'Todos os dias' },
                { value: 'uteis', label: 'Dias úteis' },
                { value: 'fds', label: 'Fins de semana' },
              ]}
            />
          </div>
          <div className="field">
            <span className="field-label">Período</span>
            <Chips label="Período" value={period} onChange={setPeriod} options={PERIODS.map((p) => ({ value: p.id, label: p.label }))} />
          </div>
          <Field label="Horário (opcional)" hint="Para rotinas com hora certa, como dormir às 23h.">
            <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
          <Field label="Gatilho (opcional)" hint="Prenda a rotina a algo que você já faz.">
            <div className="prefix-input">
              <span>Depois de</span>
              <input className="input" value={cue} onChange={(e) => setCue(e.target.value)} placeholder="escovar os dentes" />
            </div>
          </Field>
          {kind === 'construir' && (
            <div className="field">
              <span className="field-label">Meta para virar ritual</span>
              <Chips label="Meta" value={String(target)} onChange={(v) => setTarget(Number(v))} options={TARGETS.map((t) => ({ value: String(t), label: `${t} dias` }))} />
              <span className="field-hint">Em média, um hábito novo leva cerca de 66 dias para ficar automático.</span>
            </div>
          )}
          {habit && (
            <div className="field">
              <span className="field-label">Tipo</span>
              <Chips
                label="Tipo"
                value={kind}
                onChange={setKind}
                options={[
                  { value: 'ritual', label: 'Ritual' },
                  { value: 'construir', label: 'Hábito em construção' },
                ]}
              />
            </div>
          )}
          <p className="muted small">Dias fora da rotina não quebram a sequência.</p>
        </>
      )}

      <div className="field">
        <span className="field-label">Cor</span>
        <div className="swatches" role="radiogroup" aria-label="Cor">
          {HABIT_COLORS.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={`Cor ${c}`} className={`swatch${color === c ? ' on' : ''}`} style={{ background: c }} onClick={() => setColor(c)}>
              {color === c && <Icon name="check" size={18} />}
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
