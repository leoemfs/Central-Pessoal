import { useState, type FormEvent } from 'react';
import { useStore } from '../store';
import { remove, toggleHabit, upsert } from '../actions';
import type { Habit } from '../types';
import { addDays, daysInMonth, fromISO, monthKey, streak, todayISO, uid, WEEKDAYS } from '../utils';
import { Card, Empty, Icon, IconButton, PageHeader } from '../ui';

export const HABIT_COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f97316', '#ef4444', '#ec4899', '#eab308', '#06b6d4'];

function lastDays(n: number): string[] {
  const t = todayISO();
  return Array.from({ length: n }, (_, i) => addDays(t, i - (n - 1)));
}

export function Habitos() {
  const { data, update } = useStore();
  const [name, setName] = useState('');
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const days = lastDays(7);
  const today = todayISO();
  const month = monthKey(today);
  const elapsed = fromISO(today).getDate();

  const doneToday = data.habits.filter((h) => h.checks.includes(today)).length;

  function submit(e: FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const prev = editingId ? data.habits.find((h) => h.id === editingId) : undefined;
    const habit: Habit = {
      id: prev?.id ?? uid(),
      name: n,
      color,
      checks: prev?.checks ?? [],
      createdAt: prev?.createdAt ?? new Date().toISOString(),
    };
    update(upsert('habits', habit));
    setName('');
    setEditingId(null);
    setColor(HABIT_COLORS[(data.habits.length + 1) % HABIT_COLORS.length]);
  }

  function edit(h: Habit) {
    setEditingId(h.id);
    setName(h.name);
    setColor(h.color);
  }

  function cancel() {
    setEditingId(null);
    setName('');
  }

  function del(h: Habit) {
    if (confirm(`Excluir o hábito "${h.name}" e todo o histórico?`)) {
      update(remove('habits', h.id));
      if (editingId === h.id) cancel();
    }
  }

  return (
    <>
      <PageHeader
        title="Núcleo pessoal"
        subtitle={data.habits.length ? `${doneToday} de ${data.habits.length} feitos hoje · ${daysInMonth(month)} dias neste mês` : 'Hábitos, rituais e autocuidado'}
      />

      <Card title={editingId ? 'Editar hábito' : 'Novo hábito'}>
        <form className="form" onSubmit={submit}>
          <input className="input" placeholder="Ex.: Beber 2 L de água, meditar, skincare…" value={name} onChange={(e) => setName(e.target.value)} aria-label="Nome do hábito" required />
          <div className="swatches" role="radiogroup" aria-label="Cor">
            {HABIT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={color === c}
                aria-label={`Cor ${c}`}
                className={`swatch${color === c ? ' on' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <div className="btn-row">
            {editingId && (
              <button type="button" className="btn" onClick={cancel}>
                Cancelar
              </button>
            )}
            <button type="submit" className="btn primary">
              <Icon name={editingId ? 'check' : 'plus'} size={18} />
              {editingId ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </Card>

      {data.habits.length === 0 ? (
        <Card>
          <Empty>Nenhum hábito ainda. Crie um acima e marque os dias em que cumprir.</Empty>
        </Card>
      ) : (
        <div className="habits">
          {data.habits.map((h) => {
            const s = streak(h.checks);
            const monthCount = h.checks.filter((c) => monthKey(c) === month).length;
            return (
              <Card key={h.id} className="habit">
                <div className="habit-head">
                  <span className="dot" style={{ background: h.color }} aria-hidden="true" />
                  <strong className="habit-name">{h.name}</strong>
                  <span className="pill" title="Sequência atual">
                    <Icon name="flame" size={13} /> {s} {s === 1 ? 'dia' : 'dias'}
                  </span>
                  <div className="row-actions">
                    <IconButton icon="edit" label="Editar" onClick={() => edit(h)} />
                    <IconButton icon="trash" label="Excluir" tone="danger" onClick={() => del(h)} />
                  </div>
                </div>
                <div className="habit-days">
                  {days.map((d) => {
                    const on = h.checks.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        className={`day${on ? ' on' : ''}${d === today ? ' today' : ''}`}
                        style={on ? { background: h.color, borderColor: h.color } : undefined}
                        onClick={() => update(toggleHabit(h.id, d))}
                        aria-pressed={on}
                        aria-label={`${h.name} em ${d}`}
                      >
                        <span className="day-week">{WEEKDAYS[fromISO(d).getDay()]}</span>
                        <span className="day-num">{fromISO(d).getDate()}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="muted small">
                  Este mês: {monthCount}/{elapsed} dias ({Math.round((monthCount / elapsed) * 100)}%) · Total: {h.checks.length}
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
