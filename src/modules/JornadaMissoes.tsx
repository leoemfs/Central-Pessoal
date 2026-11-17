/**
 * Jornada (N2.9): missões de hoje e da semana. São os hábitos, tarefas, contas e o diário da
 * pessoa: marcar aqui é o mesmo que marcar no Núcleo, na Agenda ou em Finanças.
 */
import { useStore } from '../store';
import { toggleCheck } from '../habits';
import { toggleTask } from '../actions';
import { payExpense, unpayExpense } from '../finance';
import { go } from '../router';
import { ATTRIBUTES } from '../habits';
import { formatDMY, todayISO } from '../utils';
import { useState } from 'react';
import { Field, Icon, MoneyInput, notify, Sheet, type IconName } from '../ui';
import { balance, deposit, progress, removeMove } from '../boxes';
import { floatTexts, flyCoins } from './jornadaFx';
import { campaign } from '../jornada/campaign';
import { COIN_ICON, jarIcon } from '../jornada/catalog';
import { missionsToday, missionsWeek, type Mission } from '../jornada/missions';

const ICONS: Record<Mission['kind'], IconName> = { ritual: 'sun', construir: 'sprout', abandonar: 'shield', tarefa: 'tasks', conta: 'bolt', diario: 'notePen', caixinha: 'piggy' };
const color = (code: string) => ATTRIBUTES.find((a) => a.code === code)?.color ?? 'var(--green-text)';

export function MissionsCard() {
  const { data, update } = useStore();
  const today = todayISO();
  const ms = missionsToday(data, today);
  const done = ms.filter((m) => m.done).length;
  const [saving, setSaving] = useState<{ m: Mission; btn: HTMLElement | null } | null>(null);
  const fx = (m: Mission, btn: HTMLElement | null | undefined) => {
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    floatTexts(r, [{ text: `+${m.xp} XP`, color: 'var(--jn-xp)' }, ...Object.entries(m.attrs).map(([k, v]) => ({ text: `+${v} ${k}`, color: color(k) }))]);
    if (m.gold) flyCoins(r, COIN_ICON, Math.min(6, Math.ceil(m.gold / 3)));
    // Chefe da Campanha: cada missão é um golpe.
    const card = document.getElementById('jn-bosscard');
    if (card && campaign(data, data.journey, today).stage === 'chefe') {
      const img = card.querySelector('img');
      img?.classList.remove('hit');
      void (img as HTMLElement | null)?.offsetWidth;
      img?.classList.add('hit');
      floatTexts(card.getBoundingClientRect(), [{ text: '−1 HP', color: '#f87171' }]);
    }
  };
  const act = (m: Mission, btn?: HTMLElement) => {
    const a = m.action;
    // Caixinha: marcar pergunta quanto guardou; desmarcar tira o "guardado (plano)" de hoje.
    if (a.type === 'box') {
      if (!m.done) return setSaving({ m, btn: btn ?? null });
      notify('Missão desmarcada', 'O valor guardado hoje pelo plano saiu da caixinha, e a recompensa junto.');
      return update((d) => {
        const b = d.boxes.find((x) => x.id === a.id);
        const mv = b?.moves.find((x) => x.kind === 'plano' && x.date === today);
        return b && mv ? removeMove(a.id, mv.id)(d) : d;
      });
    }
    if (a.type !== 'go' && a.type !== 'none') {
      if (m.done) notify('Missão desmarcada', 'A recompensa saiu junto. Desmarcar algo marcado por engano tira os pontos.');
      else fx(m, btn);
    }
    if (a.type === 'habit') update(toggleCheck(a.id, today));
    else if (a.type === 'task') update(toggleTask(a.id));
    else if (a.type === 'bill')
      update((d) => {
        const e = d.expenses.find((x) => x.id === a.id);
        if (!e) return d;
        return e.paidAt ? unpayExpense(d, a.id) : payExpense(d, a.id, today, e.amount);
      });
    else if (a.type === 'go') go(a.to);
  };
  return (
    <section className="card">
      <div className="card-head">
        <h2>Missões de hoje</h2>
        {ms.length > 0 && (
          <span className="jn-px muted" aria-label={`${done} de ${ms.length} cumpridas`}>
            {done}/{ms.length}
          </span>
        )}
      </div>
      <span className="muted small">{formatDMY(today)}</span>
      {ms.length === 0 ? (
        <p className="empty">Nenhuma missão hoje. Rituais e hábitos do Núcleo, tarefas da Agenda e contas que vencem hoje aparecem aqui.</p>
      ) : (
        <ul className="jn-missions">
          {ms.map((m) => {
            const tone = Object.keys(m.attrs)[0];
            return (
              <li key={m.id} className={`jn-mission${m.done ? ' done' : ''}${m.kind === 'abandonar' && !m.done ? ' slipped' : ''}`}>
                <span className="jn-mico" style={{ color: tone ? color(tone) : 'var(--green-text)' }}>
                  <Icon name={ICONS[m.kind]} size={20} />
                </span>
                <div className="jn-mbody">
                  <span className="jn-mtitle">{m.title}</span>
                  <span className="muted small">{m.meta}</span>
                  {!(m.kind === 'abandonar' && !m.done) && (
                    <div className="jn-chips">
                      <span className="jn-chip xp">+{m.xp} XP{m.kind === 'abandonar' ? ' por semana' : ''}</span>
                      <span className="jn-chip gold">
                        <img alt="" src={COIN_ICON} />
                        {m.gold}
                      </span>
                      {Object.entries(m.attrs).map(([k, v]) => (
                        <span key={k} className="jn-chip" style={{ color: color(k) }}>
                          +{v} {k}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {m.action.type === 'none' ? (
                  m.done && (
                    <span className="jn-check on static" aria-label="Limpo hoje">
                      <Icon name="check" size={20} />
                    </span>
                  )
                ) : m.action.type === 'go' && !m.done ? (
                  <button type="button" className="jn-check go" aria-label={`Abrir: ${m.title}`} onClick={() => act(m)}>
                    <Icon name="right" size={20} />
                  </button>
                ) : (
                  <button type="button" className={`jn-check${m.done ? ' on' : ''}`} aria-pressed={m.done} aria-label={`${m.done ? 'Desmarcar' : 'Marcar'}: ${m.title}`} onClick={(e) => act(m, e.currentTarget)} disabled={m.action.type === 'go'}>
                    <Icon name="check" size={20} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {ms.length > 0 && done === ms.length && <div className="jn-daydone">Dia completo! Hoje à noite aparece uma estrela nova no céu.</div>}
      <p className="muted small" style={{ marginTop: 10 }}>
        Estas missões são os seus próprios hábitos, tarefas, contas e diário. Marcar aqui é o mesmo que marcar no Núcleo, na Agenda ou em Finanças. O que ficar para trás só some à meia-noite, sem perder nada.
      </p>
      {saving && saving.m.action.type === 'box' && (
        <SaveSheet
          boxId={saving.m.action.id}
          amount={saving.m.action.amount}
          onClose={() => setSaving(null)}
          onSaved={() => {
            fx(saving.m, saving.btn);
            setSaving(null);
          }}
        />
      )}
    </section>
  );
}

/** Quanto guardou na caixinha (o app só registra: o dinheiro fica no banco). */
function SaveSheet({ boxId, amount, onClose, onSaved }: { boxId: string; amount: number; onClose: () => void; onSaved: () => void }) {
  const { data, update } = useStore();
  const b = data.boxes.find((x) => x.id === boxId);
  const [cents, setCents] = useState(Math.round(amount * 100));
  if (!b) return null;
  const pct = progress(b);
  return (
    <Sheet
      title="Guardar na caixinha"
      onClose={onClose}
      footer={
        <button
          type="button"
          className="btn primary block"
          disabled={cents <= 0}
          onClick={() => {
            update(deposit(boxId, cents / 100, todayISO(), true));
            onSaved();
          }}
        >
          Guardei
        </button>
      }
    >
      <div className="jn-save">
        <img alt="" src={jarIcon(pct)} />
        <strong>{b.name}</strong>
        <span className="muted small">
          {money(balance(b))}
          {b.target ? ` de ${money(b.target)}` : ''}
        </span>
      </div>
      <Field label="Valor em R$">
        <MoneyInput cents={cents} onChange={setCents} label="Valor guardado" large autoFocus />
      </Field>
      <p className="muted small">O app só registra. O dinheiro fica no seu banco. No dia do plano vale +20 XP, +10 de ouro e +3 de Disciplina, seja qual for o valor.</p>
    </Sheet>
  );
}

const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function WeekCard() {
  const { data } = useStore();
  const ws = missionsWeek(data, todayISO());
  return (
    <section className="card">
      <div className="card-head">
        <h2>Missões da semana</h2>
      </div>
      <ul className="jn-week">
        {ws.map((w) => {
          const ok = w.done >= w.goal;
          return (
            <li key={w.id}>
              <div className="toggle-row">
                <div>
                  <strong>{w.title}</strong>
                  <span className="muted small">{w.meta}</span>
                </div>
                <span className={`jn-px${ok ? '' : ' muted'}`} style={ok ? { color: 'var(--green-text)' } : undefined}>
                  {w.done}/{w.goal}
                </span>
              </div>
              <div className="xp-bar">
                <div style={{ width: `${(w.done / w.goal) * 100}%` }} />
              </div>
              {w.bonus > 0 && <span className={`jn-chip xp${ok ? ' won' : ''}`}>{ok ? `Bônus ganho: +${w.bonus} XP` : `Bônus ao cumprir: +${w.bonus} XP`}</span>}
            </li>
          );
        })}
      </ul>
      <p className="muted small" style={{ marginTop: 10 }}>
        A meta do Diário segue o ritmo que você escolheu (Configurações › Início e módulos). Não cumpriu? A missão só recomeça na segunda, sem perder nada.
      </p>
    </section>
  );
}
