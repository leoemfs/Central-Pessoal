import { useState } from 'react';
import type { ViewProps } from '../App';
import { useSubAction } from '../router';
import { useStore } from '../store';
import type { SleepEntry, SleepFeel } from '../types';
import { formatDate, relativeDay, todayISO } from '../utils';
import { fmtQty } from '../habits';
import { Chips, Empty, Field, Icon, notify, PageHeader, Pill, Progress, Segmented, Sheet } from '../ui';
import {
  addWater, dismissLink, FEELS, fmtDuration, healthWeeks, lastDays, linkWaterHabit, removeSleep, saveSleep, setWater, setWaterGoal, shouldAskLink,
  sleepDefaults, sleepMinutes, unlinkWaterHabit, waterCandidate, waterHabit, waterOn, waterSetup,
} from '../saude';

/**
 * Saúde (N1.1): Água e Sono. Endereços:
 * #/saudehoje (Hoje: registrar o dia) · #/saude (casa: abas Água · Sono) · #/saudehist (Histórico por semana)
 * #/<tela>/sono (botão +: registrar uma noite de sono).
 * Água com hábito ligado: o número mora no hábito do Núcleo (o mesmo anel).
 */

const FEEL_LABEL: Record<SleepFeel, string> = { bem: 'Acordei bem', medio: 'Mais ou menos', cansado: 'Cansado' };

/** Ações do botão + (iguais nas três telas). */
function useSleepSheet(route: ViewProps['route'], base: string) {
  const [day, setDay] = useState<string | null>(null);
  useSubAction(route, base, { sono: () => setDay(todayISO()) });
  return { day, open: (d: string) => setDay(d), sheet: day ? <SleepSheet day={day} onClose={() => setDay(null)} /> : null };
}

/** Pergunta, uma vez só, se quer ligar o hábito de água que já existe. */
function LinkAsk() {
  const { data, update } = useStore();
  const h = shouldAskLink(data);
  if (!h) return null;
  return (
    <section className="card" aria-label="Ligar hábito de água">
      <strong>Ligar o hábito "{h.name}" à Saúde?</strong>
      <p className="muted small">A água da Saúde e o anel do hábito passam a ser o mesmo número. O histórico do hábito vira o histórico de água; nada se perde.</p>
      <div className="btn-row">
        <button type="button" className="btn primary" onClick={() => { update(linkWaterHabit(h.id)); notify('Hábito ligado', `"${h.name}" agora conta na Saúde.`); }}>
          Ligar
        </button>
        <button type="button" className="btn soft" onClick={() => update(dismissLink())}>Agora não</button>
      </div>
    </section>
  );
}

function WaterCard({ day }: { day: string }) {
  const { data, update } = useStore();
  const { goal, step, unit } = waterSetup(data);
  const amt = waterOn(data, day);
  const h = waterHabit(data);
  return (
    <section className="card" aria-label="Água">
      <div className="card-head">
        <h2><Icon name="drop" size={18} /> Água</h2>
        {h && <Pill tone="green">hábito ligado</Pill>}
      </div>
      <div className="toggle-row">
        <span className="tabular">{fmtQty(amt)} de {fmtQty(goal)} {unit}</span>
        <span className="btn-row">
          <button type="button" className="btn soft" aria-label={`Menos ${fmtQty(step)} ${unit}`} disabled={amt <= 0} onClick={() => update(setWater(day, amt - step))}>−</button>
          <button type="button" className="btn primary" onClick={() => update(addWater(day, step))}>+{fmtQty(step)} {unit}</button>
        </span>
      </div>
      <Progress pct={(amt / goal) * 100} />
      {amt >= goal && <span className="muted small">Meta do dia cumprida.</span>}
    </section>
  );
}

function SleepCard({ day, onOpen }: { day: string; onOpen: (d: string) => void }) {
  const { data } = useStore();
  const s = data.health.sleep[day];
  return (
    <section className="card" aria-label="Sono">
      <div className="card-head">
        <h2><Icon name="moon" size={18} /> Sono</h2>
        <span className="muted small">noite passada</span>
      </div>
      {s ? (
        <button type="button" className="row" onClick={() => onOpen(day)}>
          <span className="row-body">
            <span className="row-title tabular">{s.bed} → {s.wake} · {fmtDuration(sleepMinutes(s))}</span>
            <span className="row-meta">{s.feel ? FEEL_LABEL[s.feel] : 'Toque para dizer como acordou'}</span>
          </span>
          <Icon name="edit" size={16} />
        </button>
      ) : (
        <button type="button" className="btn soft block" onClick={() => onOpen(day)}>
          <Icon name="moon" size={18} /> Registrar a noite
        </button>
      )}
    </section>
  );
}

export function SleepSheet({ day, onClose }: { day: string; onClose: () => void }) {
  const { data, update } = useStore();
  const existing = data.health.sleep[day];
  const base = existing ?? { ...sleepDefaults(data, data.profile.wake, data.profile.sleep), feel: null };
  const [e, setE] = useState<SleepEntry>(base);
  const save = () => {
    update(saveSleep(day, e));
    notify('Sono registrado', `${e.bed} → ${e.wake} · ${fmtDuration(sleepMinutes(e))}`);
    onClose();
  };
  return (
    <Sheet
      title={`Sono · ${relativeDay(day) === 'Hoje' ? 'esta noite' : relativeDay(day)}`}
      onClose={onClose}
      footer={<button type="button" className="btn primary block" onClick={save}>Salvar</button>}
    >
      <div className="grid-2">
        <Field label="Fui dormir">
          <input className="input" type="time" value={e.bed} onChange={(ev) => ev.target.value && setE({ ...e, bed: ev.target.value })} />
        </Field>
        <Field label="Acordei">
          <input className="input" type="time" value={e.wake} onChange={(ev) => ev.target.value && setE({ ...e, wake: ev.target.value })} />
        </Field>
      </div>
      <p className="muted small tabular">Dormiu {fmtDuration(sleepMinutes(e))}.</p>
      <div className="field">
        <span className="field-label">Como acordou</span>
        <Chips<SleepFeel> label="Como acordou" value={e.feel} onChange={(feel) => setE({ ...e, feel: e.feel === feel ? null : feel })} options={FEELS.map((f) => ({ value: f.id, label: f.label }))} />
      </div>
      {existing && (
        <button type="button" className="btn soft block danger" onClick={() => { update(removeSleep(day)); onClose(); }}>
          Apagar este registro
        </button>
      )}
    </Sheet>
  );
}

/** Hoje: o que registrar no dia. */
export function SaudeHoje({ route }: ViewProps) {
  const today = todayISO();
  const { open, sheet } = useSleepSheet(route, 'saudehoje');
  return (
    <>
      <PageHeader title="Hoje" subtitle={relativeDay(today) === 'Hoje' ? formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' }) : undefined} />
      <LinkAsk />
      <WaterCard day={today} />
      <SleepCard day={today} onOpen={open} />
      <section className="card" aria-label="Em breve">
        <span className="muted small">Em breve na Saúde: dieta, remédios, consultas e check-ups, peso e medidas.</span>
      </section>
      {sheet}
    </>
  );
}

type Tab = 'agua' | 'sono';

/** Casa do módulo: abas Água · Sono (ajustes e últimos dias). */
export function SaudePage({ route }: ViewProps) {
  const [tab, setTab] = useState<Tab>('agua');
  const { open, sheet } = useSleepSheet(route, 'saude');
  return (
    <>
      <PageHeader
        title="Saúde"
        tabs={<Segmented<Tab> label="Parte da Saúde" value={tab} onChange={setTab} swipe options={[{ value: 'agua', label: 'Água' }, { value: 'sono', label: 'Sono' }]} />}
      />
      <LinkAsk />
      {tab === 'agua' ? <WaterTab /> : <SleepTab onOpen={open} />}
      {sheet}
    </>
  );
}

function WaterTab() {
  const { data, update } = useStore();
  const today = todayISO();
  const h = waterHabit(data);
  const cand = h ? null : waterCandidate(data.habits);
  const { goal, step, unit } = waterSetup(data);
  const [g, setG] = useState(String(goal));
  const [s, setS] = useState(String(step));
  const num = (v: string) => Number(v.replace(/\./g, '').replace(',', '.'));
  return (
    <>
      <WaterCard day={today} />
      <section className="card" aria-label="Meta de água">
        <div className="card-head"><h2>Meta</h2></div>
        {h ? (
          <>
            <p className="small">
              Ligada ao hábito <strong>{h.name}</strong> ({fmtQty(h.goal!)} {h.unit} por dia). A meta muda no hábito, no Núcleo.
            </p>
            <div className="btn-row">
              <a className="btn soft" href="#/nucleo">Abrir o hábito</a>
              <button type="button" className="btn soft" onClick={() => { update(unlinkWaterHabit()); notify('Hábito desligado', 'A Saúde ficou com uma cópia do histórico.'); }}>Desligar</button>
            </div>
          </>
        ) : (
          <>
            <div className="grid-2">
              <Field label="Meta por dia (ml)">
                <input className="input" inputMode="numeric" value={g} onChange={(e) => setG(e.target.value)} onBlur={() => { const n = num(g); if (n > 0) update(setWaterGoal(n, step)); else setG(String(goal)); }} />
              </Field>
              <Field label="Cada toque soma (ml)">
                <input className="input" inputMode="numeric" value={s} onChange={(e) => setS(e.target.value)} onBlur={() => { const n = num(s); if (n > 0) update(setWaterGoal(goal, n)); else setS(String(step)); }} />
              </Field>
            </div>
            {cand && (
              <button type="button" className="btn soft block" onClick={() => { update(linkWaterHabit(cand.id)); notify('Hábito ligado', `"${cand.name}" agora conta na Saúde.`); }}>
                <Icon name="sprout" size={18} /> Ligar ao hábito "{cand.name}"
              </button>
            )}
          </>
        )}
      </section>
      <section className="card" aria-label="Últimos 7 dias de água">
        <div className="card-head"><h2>Últimos 7 dias</h2></div>
        <ul className="list">
          {lastDays(today).map((day) => {
            const v = waterOn(data, day);
            return (
              <li key={day} className="row">
                <span className="row-body">
                  <span className="row-title">{relativeDay(day)}</span>
                  <Progress pct={(v / goal) * 100} />
                </span>
                <span className="small tabular">{v ? `${fmtQty(v)} ${unit}` : '—'}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

function SleepTab({ onOpen }: { onOpen: (d: string) => void }) {
  const { data } = useStore();
  const today = todayISO();
  return (
    <>
      <SleepCard day={today} onOpen={onOpen} />
      <section className="card" aria-label="Últimas 7 noites">
        <div className="card-head"><h2>Últimas 7 noites</h2><span className="muted small">pelo dia em que acordou</span></div>
        <ul className="list">
          {lastDays(today).map((day) => {
            const s = data.health.sleep[day];
            return (
              <li key={day}>
                <button type="button" className="row" onClick={() => onOpen(day)}>
                  <span className="row-body">
                    <span className="row-title">{relativeDay(day)}</span>
                    <span className="row-meta tabular">{s ? `${s.bed} → ${s.wake}${s.feel ? ` · ${FEEL_LABEL[s.feel]}` : ''}` : 'Sem registro'}</span>
                  </span>
                  <span className="small tabular">{s ? fmtDuration(sleepMinutes(s)) : <Icon name="plus" size={16} />}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
      <p className="muted small">O app só registra. Para dúvidas sobre o seu sono, fale com um profissional de saúde.</p>
    </>
  );
}

/** Histórico: as últimas semanas de água e sono. */
export function SaudeHistorico({ route }: ViewProps) {
  const { data } = useStore();
  const today = todayISO();
  const { sheet } = useSleepSheet(route, 'saudehist');
  const weeks = healthWeeks(data, today, 6);
  const { unit } = waterSetup(data);
  const any = weeks.some((w) => w.waterDays || w.nights);
  return (
    <>
      <PageHeader title="Histórico" />
      {any ? (
        weeks.map((w, i) => (
          <section key={w.start} className="card" aria-label={`Semana de ${formatDate(w.start)}`}>
            <div className="card-head">
              <h2>{i === 0 ? 'Esta semana' : i === 1 ? 'Semana passada' : `${formatDate(w.start)} a ${formatDate(w.end)}`}</h2>
            </div>
            <ul className="list">
              <li className="row">
                <span className="tile-icon small"><Icon name="drop" size={18} /></span>
                <span className="row-body">
                  <span className="row-title">Água</span>
                  <span className="row-meta tabular">{w.waterAvg === null ? 'Sem registro' : `média de ${fmtQty(w.waterAvg)} ${unit} · meta em ${w.waterMet} de ${w.waterDays} dias`}</span>
                </span>
              </li>
              <li className="row">
                <span className="tile-icon small"><Icon name="moon" size={18} /></span>
                <span className="row-body">
                  <span className="row-title">Sono</span>
                  <span className="row-meta tabular">
                    {w.sleepAvg === null
                      ? 'Sem registro'
                      : `média de ${fmtDuration(w.sleepAvg)} · ${w.nights} ${w.nights === 1 ? 'noite' : 'noites'}`}
                  </span>
                  {w.nights > 0 && (
                    <span className="muted small">
                      {FEELS.filter((f) => w.feels[f.id]).map((f) => `${f.label.toLowerCase()}: ${w.feels[f.id]}`).join(' · ') || 'sem dizer como acordou'}
                    </span>
                  )}
                </span>
              </li>
            </ul>
          </section>
        ))
      ) : (
        <section className="card">
          <Empty>Aqui aparecem as suas semanas de água e sono. Registre em Hoje ou no botão +.</Empty>
        </section>
      )}
      {sheet}
    </>
  );
}
