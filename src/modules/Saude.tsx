import { useEffect, useState } from 'react';
import type { ViewProps } from '../App';
import { cleanAddress, useSubAction } from '../router';
import { useStore } from '../store';
import { usePageMenu } from '../PageMenu';
import type { SleepEntry, SleepFeel } from '../types';
import { addDays as addDaysISO, formatDate, relativeDay, todayISO, uid } from '../utils';
import { go } from '../router';
import { qtyText as recipeQty } from '../lists';
import { fmtQty } from '../habits';
import { newList } from '../lists';
import { Chips, Empty, Field, Icon, notify, PageHeader, Pill, Progress, Segmented, Sheet, Toggle, type IconName } from '../ui';
import type { AppData, Appointment, ApptKind, BodyEntry, CheckupRoutine, DietLog, DietMeal, DietPlan, DietSource, Medicine } from '../types';
import {
  addBodyField, APPT_KINDS, apptTitle, bodyLatest, bodySeries, examRequests, followUp, intervalText, kindInfo, newAppt, removeAppt, removeBodyEntry, removeRoutine, routineStatus,
  saveAppt, saveBodyEntry, saveRoutine, setBodyShow, splitAppts, suggestRoutine,
} from '../consultas';
import { daysText, dosesOn, endMed, linkMedsHabit, medHabitCandidate, medsHabit, newMed, removeMed, saveMed, timesText, toggleTaken } from '../remedios';
import {
  activePlan, allRecipes, dayLine, MARKS, marketLists, recipesOf, sendShopping, shoppingLines, toggleRecipe, weekRecipes, markMeal, mealsOf, newMeal, newPlan, pickOption, removePlan, savePlan, setDayVariant, setExtra, setSplit, toggleVariantDay, choosePlan,
} from '../dieta';
import {
  addWater, dismissLink, FEELS, fmtDuration, healthWeeks, lastDays, linkWaterHabit, removeSleep, saveSleep, setWater, setWaterGoal, shouldAskLink,
  sleepDefaults, sleepMinutes, unlinkWaterHabit, waterCandidate, waterHabit, waterOn, waterSetup,
} from '../saude';

/**
 * Saúde (N1.1): Água e Sono. Endereços:
 * #/saudehoje (Hoje: registrar o dia) · #/saude (casa: abas Água · Sono) · #/saudehist (Histórico por semana)
 * #/<tela>/menu (botão +: sono ou plano de dieta) · #/<tela>/sono.
 * Dieta (N1.2): plano em uso na aba Dieta; refeições do dia no Hoje (segui · em parte · fugi).
 * Água com hábito ligado: o número mora no hábito do Núcleo (o mesmo anel).
 */

const FEEL_LABEL: Record<SleepFeel, string> = { bem: 'Acordei bem', medio: 'Mais ou menos', cansado: 'Cansado' };

/** Ações do botão + (iguais nas três telas): registrar sono ou criar um plano de dieta. */
function useSaudeActions(route: ViewProps['route'], base: string) {
  const [day, setDay] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [med, setMed] = useState<Medicine | null>(null);
  const startMed = () => setMed(newMed(uid(), todayISO(), new Date().toISOString()));
  const [pickSource, setPickSource] = useState(false);
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [routine, setRoutine] = useState<CheckupRoutine | null>(null);
  const [body, setBody] = useState<BodyEntry | null>(null);
  const { data } = useStore();
  const startAppt = (kind: ApptKind = 'consulta', extra: Partial<Appointment> = {}) => setAppt(newAppt(uid(), kind, new Date().toISOString(), extra));
  const startRoutine = () => setRoutine({ id: uid(), label: '', kind: 'dentista', months: 6, last: null });
  const startBody = () => setBody({ id: uid(), date: todayISO(), values: {} });
  useSubAction(route, base, { sono: () => setDay(todayISO()), menu: () => setMenu(true), dieta: () => setPickSource(true), remedio: startMed, consulta: () => startAppt() });
  const sheet = (
    <>
      {day && <SleepSheet day={day} onClose={() => setDay(null)} />}
      {menu && (
        <Sheet title="Criar na Saúde" onClose={() => setMenu(false)}>
          <div className="list">
            <button type="button" className="row" onClick={() => { setMenu(false); setDay(todayISO()); }}>
              <span className="tile-icon small"><Icon name="moon" size={18} /></span>
              <span className="row-body"><span className="row-title">Registrar sono</span><span className="row-meta">Hora de dormir, de acordar e como acordou</span></span>
            </button>
            <button type="button" className="row" onClick={() => { setMenu(false); setPickSource(true); }}>
              <span className="tile-icon small"><Icon name="list" size={18} /></span>
              <span className="row-body"><span className="row-title">Plano de dieta</span><span className="row-meta">Da nutricionista ou montado por você</span></span>
            </button>
            <button type="button" className="row" onClick={() => { setMenu(false); startMed(); }}>
              <span className="tile-icon small"><Icon name="pill" size={18} /></span>
              <span className="row-body"><span className="row-title">Remédio</span><span className="row-meta">Nome, dose, horários e por quanto tempo</span></span>
            </button>
            <button type="button" className="row" onClick={() => { setMenu(false); startAppt(); }}>
              <span className="tile-icon small"><Icon name="stethoscope" size={18} /></span>
              <span className="row-body"><span className="row-title">Consulta ou exame</span><span className="row-meta">Médico, dentista, exame ou check-up; entra na Agenda</span></span>
            </button>
            {data.health.body.show && (
              <button type="button" className="row" onClick={() => { setMenu(false); startBody(); }}>
                <span className="tile-icon small"><Icon name="scale" size={18} /></span>
                <span className="row-body"><span className="row-title">Medição</span><span className="row-meta">Peso e medidas</span></span>
              </button>
            )}
          </div>
        </Sheet>
      )}
      {pickSource && <SourceSheet onClose={() => setPickSource(false)} onPick={(src) => { setPickSource(false); setPlan(newPlan(uid, src, new Date().toISOString())); }} />}
      {plan && <PlanEditor initial={plan} onClose={() => setPlan(null)} />}
      {med && <MedSheet initial={med} onClose={() => setMed(null)} />}
      {appt && <ApptSheet initial={appt} onClose={() => setAppt(null)} onRoutine={(r) => { setAppt(null); setRoutine(r); }} />}
      {routine && <RoutineSheet initial={routine} onClose={() => setRoutine(null)} onBook={(r) => { setRoutine(null); startAppt(r.kind, { title: r.kind === 'consulta' || r.kind === 'checkup' ? r.label : '', routineId: r.id }); }} />}
      {body && <BodySheet initial={body} onClose={() => setBody(null)} />}
    </>
  );
  return { open: (d: string) => setDay(d), editPlan: (p: DietPlan) => setPlan(p), newPlan: () => setPickSource(true), editMed: (m: Medicine) => setMed(m), newMed: startMed, editAppt: (a: Appointment) => setAppt(a), newAppt: startAppt, editRoutine: (r: CheckupRoutine) => setRoutine(r), newRoutine: startRoutine, editBody: (e: BodyEntry) => setBody(e), newBody: startBody, sheet };
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
  const { open, sheet, newPlan: createPlan, newMed: createMed, editAppt } = useSaudeActions(route, 'saudehoje');
  return (
    <>
      <PageHeader title="Hoje" subtitle={relativeDay(today) === 'Hoje' ? formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' }) : undefined} />
      <LinkAsk />
      <WaterCard day={today} />
      <SleepCard day={today} onOpen={open} />
      <MedsToday day={today} onCreate={createMed} />
      <DietToday day={today} onCreate={createPlan} />
      <NextAppts onOpen={editAppt} />
      {sheet}
    </>
  );
}

type Tab = 'dia' | 'dieta' | 'remedios' | 'consultas' | 'medidas';

/** Casa do módulo: abas Dia (água e sono) · Dieta · Remédios · Consultas · Medidas. */
export function SaudePage({ route }: ViewProps) {
  const [tab, setTab] = useState<Tab>('dia');
  const acts = useSaudeActions(route, 'saude');
  const { open, sheet, editPlan, newPlan: createPlan, editMed, newMed: createMed } = acts;
  const { data } = useStore();
  // Vindo da Agenda: #/saude/abrir-c-<id> (consulta) ou abrir-r-<id> (check-up que se repete).
  useEffect(() => {
    if (route.sub === 'consultas') {
      setTab('consultas');
      cleanAddress('saude');
      return;
    }
    const m = /^abrir-([cr])-(.+)$/.exec(route.sub);
    if (!m) return;
    setTab('consultas');
    if (m[1] === 'c') {
      const a = data.health.appts.find((x) => x.id === m[2]);
      if (a) acts.editAppt(a);
    } else {
      const r = data.health.routines.find((x) => x.id === m[2]);
      if (r) acts.editRoutine(r);
    }
    cleanAddress('saude');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.n, route.sub]);
  return (
    <>
      <PageHeader
        title="Saúde"
        tabs={<Segmented<Tab> label="Parte da Saúde" value={tab} onChange={setTab} swipe options={[{ value: 'dia', label: 'Dia' }, { value: 'dieta', label: 'Dieta' }, { value: 'remedios', label: 'Remédios' }, { value: 'consultas', label: 'Consultas' }, { value: 'medidas', label: 'Medidas' }]} />}
      />
      <LinkAsk />
      {tab === 'dia' ? (
        <>
          <WaterTab />
          <SleepTab onOpen={open} />
        </>
      ) : tab === 'dieta' ? (
        <DietTab onEdit={editPlan} onCreate={createPlan} />
      ) : tab === 'remedios' ? (
        <MedsTab onEdit={editMed} onCreate={createMed} />
      ) : tab === 'consultas' ? (
        <ApptsTab onEdit={acts.editAppt} onCreate={() => acts.newAppt()} onRoutine={acts.editRoutine} onNewRoutine={acts.newRoutine} />
      ) : (
        <BodyTab onEdit={acts.editBody} onCreate={acts.newBody} />
      )}
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
  const { sheet } = useSaudeActions(route, 'saudehist');
  const weeks = healthWeeks(data, today, 6);
  const { unit } = waterSetup(data);
  const any = weeks.some((w) => w.waterDays || w.nights || w.diet.segui + w.diet.parte + w.diet.fugi || w.meds.taken);
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
              {w.meds.planned > 0 && (
                <li className="row">
                  <span className="tile-icon small"><Icon name="pill" size={18} /></span>
                  <span className="row-body">
                    <span className="row-title">Remédios</span>
                    <span className="row-meta tabular">{w.meds.taken} de {w.meds.planned} doses · {w.meds.fullDays} {w.meds.fullDays === 1 ? 'dia completo' : 'dias completos'}</span>
                  </span>
                </li>
              )}
              {w.diet.planned > 0 && (
                <li className="row">
                  <span className="tile-icon small"><Icon name="list" size={18} /></span>
                  <span className="row-body">
                    <span className="row-title">Dieta</span>
                    <span className="row-meta tabular">
                      {w.diet.segui + w.diet.parte + w.diet.fugi
                        ? `segui ${w.diet.segui} · em parte ${w.diet.parte} · fugi ${w.diet.fugi} (de ${w.diet.planned} refeições)`
                        : 'Sem marcações'}
                    </span>
                  </span>
                </li>
              )}
            </ul>
          </section>
        ))
      ) : (
        <section className="card">
          <Empty>Aqui aparecem as suas semanas de água, sono, dieta e remédios. Registre em Hoje ou no botão +.</Empty>
        </section>
      )}
      {sheet}
    </>
  );
}

// ---------- Dieta (N1.2) ----------

const DOW = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const DOW_NAME = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** Escolher de onde vem o plano (muda só o rótulo e a dica). */
function SourceSheet({ onClose, onPick }: { onClose: () => void; onPick: (s: DietSource) => void }) {
  return (
    <Sheet title="Novo plano de dieta" onClose={onClose}>
      <p className="muted small">O app não monta dieta nem dá conselho: você escreve o plano.</p>
      <div className="list">
        <button type="button" className="row" onClick={() => onPick('nutri')}>
          <span className="tile-icon small"><Icon name="user" size={18} /></span>
          <span className="row-body"><span className="row-title">Da nutricionista</span><span className="row-meta">Copiar o plano pronto que você recebeu</span></span>
        </button>
        <button type="button" className="row" onClick={() => onPick('eu')}>
          <span className="tile-icon small"><Icon name="edit" size={18} /></span>
          <span className="row-body"><span className="row-title">Montei eu</span><span className="row-meta">Escrever as suas refeições</span></span>
        </button>
      </div>
    </Sheet>
  );
}

/** Uma refeição no Hoje: o que comer, opções e segui · em parte · fugi. */
function MealRow({ day, m }: { day: string; m: DietMeal }) {
  const { data, update } = useStore();
  const log = data.health.diet.log[day]?.[m.id];
  const options = [m.food, ...m.alts].filter((x) => x.trim());
  return (
    <li className="diet-meal">
      <div className="toggle-row">
        <strong>{m.name}</strong>
        {m.time && <span className="muted small tabular">{m.time}</span>}
      </div>
      {options.length > 1 ? (
        <Chips<string> label={`O que comeu no ${m.name}`} value={log ? String(log.option) : null} onChange={(v) => update(pickOption(day, m.id, Number(v)))} options={options.map((o, i) => ({ value: String(i), label: i ? `ou ${o}` : o }))} />
      ) : options.length === 1 ? (
        <span className="muted small">{options[0]}</span>
      ) : null}
      <RecipeLinks m={m} />
      <Chips<string> label={`Como foi o ${m.name}`} value={log?.mark ?? null} onChange={(v) => update(markMeal(day, m.id, v as DietLog['mark'], log?.option ?? 0))} options={MARKS.map((x) => ({ value: x.id, label: x.label }))} />
    </li>
  );
}

function DietToday({ day, onCreate }: { day: string; onCreate: () => void }) {
  const { data, update } = useStore();
  const t = mealsOf(data, day);
  const [extra, setExtraText] = useState(data.health.diet.extras[day] ?? '');
  if (!t) {
    return (
      <section className="card" aria-label="Refeições">
        <div className="card-head"><h2><Icon name="list" size={18} /> Refeições</h2></div>
        <p className="muted small">Cadastre o seu plano (o da nutricionista ou o seu) para marcar as refeições do dia.</p>
        <button type="button" className="btn soft block" onClick={onCreate}><Icon name="plusCircle" size={18} /> Criar plano de dieta</button>
      </section>
    );
  }
  return (
    <section className="card" aria-label="Refeições">
      <div className="card-head">
        <h2><Icon name="list" size={18} /> Refeições</h2>
        <span className="muted small tabular">{dayLine(data, day) ?? ''}</span>
      </div>
      {t.plan.split && (
        <Chips<string> label="Variação do dia" value={t.variant.id} onChange={(v) => update(setDayVariant(day, v))} options={t.plan.variants.map((v) => ({ value: v.id, label: v.name }))} />
      )}
      {t.meals.length ? (
        <ul className="list diet-list">{t.meals.map((m) => <MealRow key={m.id} day={day} m={m} />)}</ul>
      ) : (
        <Empty>Este plano ainda não tem refeições. Edite na aba Dieta.</Empty>
      )}
      <Field label="Fora do plano (opcional)">
        <input className="input" value={extra} placeholder="Ex.: um doce à tarde" onChange={(e) => setExtraText(e.target.value)} onBlur={() => update(setExtra(day, extra))} />
      </Field>
    </section>
  );
}

function DietTab({ onEdit, onCreate }: { onEdit: (p: DietPlan) => void; onCreate: () => void }) {
  const { data, update } = useStore();
  const p = activePlan(data);
  const others = data.health.diet.plans.filter((x) => x.id !== p?.id);
  const [shop, setShop] = useState(false);
  if (!p) {
    return (
      <section className="card">
        <Empty>Aqui fica o seu plano alimentar: refeições, horários e opções. Pode ser o da nutricionista ou um que você montou.</Empty>
        <button type="button" className="btn primary block" onClick={onCreate}><Icon name="plusCircle" size={18} /> Criar plano de dieta</button>
      </section>
    );
  }
  return (
    <>
      <section className="card" aria-label="Plano em uso">
        <div className="card-head">
          <h2>{p.name}</h2>
          <button type="button" className="btn soft small" onClick={() => onEdit(p)}><Icon name="edit" size={16} /> Editar</button>
        </div>
        <span className="muted small">
          {p.source === 'nutri' ? `Da nutricionista${p.nutri ? ` ${p.nutri}` : ''}${p.consultDate ? ` · consulta em ${formatDate(p.consultDate)}` : ''}` : 'Montado por você'}
          {' · '}{p.split ? 'dias diferentes' : 'igual todos os dias'}
        </span>
        {p.notes && <p className="small" style={{ whiteSpace: 'pre-wrap' }}>{p.notes}</p>}
      </section>
      {p.variants.map((v) => (
        <section key={v.id} className="card" aria-label={v.name}>
          {p.split && (
            <div className="card-head">
              <h2>{v.name}</h2>
              <span className="muted small">{v.days.map((d) => DOW_NAME[d].slice(0, 3)).join(', ') || 'sem dias'}</span>
            </div>
          )}
          {v.meals.length ? (
            <ul className="list">
              {v.meals.map((m) => (
                <li key={m.id} className="row">
                  <span className="row-body">
                    <span className="row-title">{m.name}{m.time ? <span className="muted small tabular"> · {m.time}</span> : null}</span>
                    {m.food && <span className="row-meta">{m.food}</span>}
                    {m.alts.map((a, i) => <span key={i} className="muted small">ou {a}</span>)}
                    <RecipeLinks m={m} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Sem refeições. Toque em Editar para escrever o plano.</Empty>
          )}
        </section>
      ))}
      <section className="card" aria-label="Lista de compras da semana">
        <div className="card-head"><h2><Icon name="cart" size={18} /> Compras da semana</h2></div>
        <p className="muted small">Junta os ingredientes das receitas ligadas às refeições dos próximos 7 dias e manda para uma lista de mercado.</p>
        <button type="button" className="btn soft block" onClick={() => setShop(true)}>Montar lista de compras</button>
      </section>
      {shop && <ShoppingSheet onClose={() => setShop(false)} />}
      {others.length > 0 && (
        <section className="card" aria-label="Outros planos">
          <div className="card-head"><h2>Outros planos</h2></div>
          <ul className="list">
            {others.map((o) => (
              <li key={o.id} className="row">
                <span className="row-body"><span className="row-title">{o.name}</span><span className="row-meta">{o.source === 'nutri' ? 'Da nutricionista' : 'Montado por você'}</span></span>
                <span className="btn-row">
                  <button type="button" className="btn soft small" onClick={() => onEdit(o)}>Editar</button>
                  <button type="button" className="btn primary small" onClick={() => { update(choosePlan(o.id)); notify('Plano em uso', o.name); }}>Usar</button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="muted small">O app só registra. Para mudar a dieta, converse com a sua nutricionista.</p>
    </>
  );
}

/** Editor do plano: nome, origem, orientações, dias diferentes (opcional) e refeições com opções. */
function PlanEditor({ initial, onClose }: { initial: DietPlan; onClose: () => void }) {
  const { data, update } = useStore();
  const [p, setP] = useState<DietPlan>(initial);
  const [vi, setVi] = useState(0);
  const isNew = !data.health.diet.plans.some((x) => x.id === p.id);
  const v = p.variants[Math.min(vi, p.variants.length - 1)];
  const setMeals = (fn: (ms: DietMeal[]) => DietMeal[]) => setP({ ...p, variants: p.variants.map((x) => (x.id === v.id ? { ...x, meals: fn(x.meals) } : x)) });
  const setMeal = (id: string, patch: Partial<DietMeal>) => setMeals((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const [picker, setPicker] = useState<string | null>(null);
  const pickMeal = picker ? v.meals.find((m) => m.id === picker) ?? null : null;
  const save = () => {
    update(savePlan({ ...p, name: p.name.trim() || initial.name, variants: p.variants.map((x) => ({ ...x, meals: x.meals.map((m) => ({ ...m, alts: m.alts.filter((a) => a.trim()) })) })) }));
    notify(isNew ? 'Plano criado' : 'Plano salvo', p.name);
    onClose();
  };
  return (
    <Sheet title={isNew ? 'Novo plano de dieta' : 'Editar plano'} size="wide" onClose={onClose} footer={<button type="button" className="btn primary block" onClick={save}>Salvar</button>}>
      <Field label="Nome do plano">
        <input className="input" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
      </Field>
      <div className="field">
        <span className="field-label">De onde vem</span>
        <Chips<DietSource> label="De onde vem" value={p.source} onChange={(source) => setP({ ...p, source })} options={[{ value: 'nutri', label: 'Da nutricionista' }, { value: 'eu', label: 'Montei eu' }]} />
      </div>
      {p.source === 'nutri' && (
        <div className="grid-2">
          <Field label="Nutricionista (opcional)">
            <input className="input" value={p.nutri} onChange={(e) => setP({ ...p, nutri: e.target.value })} placeholder="Nome" />
          </Field>
          <Field label="Consulta (opcional)">
            <input className="input" type="date" value={p.consultDate ?? ''} onChange={(e) => setP({ ...p, consultDate: e.target.value || null })} />
          </Field>
        </div>
      )}
      <Field label="Orientações (opcional)">
        <textarea className="input" rows={3} value={p.notes} onChange={(e) => setP({ ...p, notes: e.target.value })} placeholder="Substituições, o que evitar, quantidade de água…" />
      </Field>
      <div className="toggle-row">
        <span>
          <strong>Dias diferentes</strong>
          <span className="muted small"> (ex.: dia de treino e de descanso)</span>
        </span>
        <Toggle label="Dias diferentes" checked={p.split} onChange={(on) => { setP(setSplit(p, on, uid)); setVi(0); }} />
      </div>
      {p.split && (
        <>
          <Chips<string> label="Variação" value={v.id} onChange={(id) => setVi(p.variants.findIndex((x) => x.id === id))} options={p.variants.map((x) => ({ value: x.id, label: x.name }))} />
          <Field label="Nome da variação">
            <input className="input" value={v.name} onChange={(e) => setP({ ...p, variants: p.variants.map((x) => (x.id === v.id ? { ...x, name: e.target.value } : x)) })} />
          </Field>
          <div className="field">
            <span className="field-label">Vale em</span>
            <div className="chips" role="group" aria-label="Dias da variação">
              {DOW.map((l, d) => (
                <button key={d} type="button" aria-label={DOW_NAME[d]} aria-pressed={v.days.includes(d)} className={`chip-btn${v.days.includes(d) ? ' on' : ''}`} onClick={() => setP(toggleVariantDay(p, v.id, d))}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      <h3 className="section-title">Refeições{p.split ? ` · ${v.name}` : ''}</h3>
      {v.meals.map((m, i) => (
        <div key={m.id} className="preview-box diet-edit">
          <div className="grid-2">
            <Field label="Refeição">
              <input className="input" value={m.name} onChange={(e) => setMeal(m.id, { name: e.target.value })} />
            </Field>
            <Field label="Horário">
              <input className="input" type="time" value={m.time} onChange={(e) => setMeal(m.id, { time: e.target.value })} />
            </Field>
          </div>
          <Field label="O que comer">
            <textarea className="input" rows={2} value={m.food} onChange={(e) => setMeal(m.id, { food: e.target.value })} placeholder="Ex.: 2 ovos + 1 pão integral" />
          </Field>
          {m.alts.map((a, k) => (
            <Field key={k} label={`Ou (opção ${k + 2})`}>
              <input className="input" value={a} onChange={(e) => setMeal(m.id, { alts: m.alts.map((x, j) => (j === k ? e.target.value : x)) })} placeholder="Ex.: iogurte natural + aveia" />
            </Field>
          ))}
          {recipesOf(data, m).length > 0 && (
            <div className="chips" aria-label={`Receitas do ${m.name}`}>
              {recipesOf(data, m).map((r) => (
                <button key={r.id} type="button" className="chip-btn on" aria-label={`Desligar a receita ${r.name}`} onClick={() => setMeal(m.id, toggleRecipe(m, r.id))}>
                  <Icon name="pot" size={14} /> {r.name} ×
                </button>
              ))}
            </div>
          )}
          <div className="btn-row">
            <button type="button" className="btn soft small" onClick={() => setPicker(m.id)}><Icon name="pot" size={14} /> Receita</button>
            <button type="button" className="btn soft small" onClick={() => setMeal(m.id, { alts: [...m.alts, ''] })}>+ Opção</button>
            <button type="button" className="btn soft small" disabled={i === 0} aria-label={`Subir ${m.name}`} onClick={() => setMeals((ms) => { const c = [...ms]; [c[i - 1], c[i]] = [c[i], c[i - 1]]; return c; })}>↑</button>
            <button type="button" className="btn soft small danger" onClick={() => setMeals((ms) => ms.filter((x) => x.id !== m.id))}>Tirar</button>
          </div>
        </div>
      ))}
      <button type="button" className="btn soft block" onClick={() => setMeals((ms) => [...ms, newMeal(uid())])}>
        <Icon name="plusCircle" size={18} /> Adicionar refeição
      </button>
      {pickMeal && <RecipePicker meal={pickMeal} onToggle={(id) => setMeal(pickMeal.id, toggleRecipe(pickMeal, id))} onClose={() => setPicker(null)} />}
      {!isNew && (
        <button type="button" className="btn soft block danger" onClick={() => { update(removePlan(p.id)); notify('Plano apagado', 'As marcações antigas continuam no Histórico.'); onClose(); }}>
          Apagar este plano
        </button>
      )}
    </Sheet>
  );
}

// ---------- Receitas ligadas (N1.2a) ----------

/** Receitas da refeição: tocar abre a receita em Listas (porções, ingredientes e preparo). */
function RecipeLinks({ m }: { m: DietMeal }) {
  const { data } = useStore();
  const list = recipesOf(data, m);
  if (!list.length) return null;
  return (
    <div className="chips" aria-label={`Receitas do ${m.name}`}>
      {list.map((r) => (
        <a key={r.id} className="chip-btn" href={`#/listas/${r.id}`}>
          <Icon name="pot" size={14} /> {r.name}
        </a>
      ))}
    </div>
  );
}

/** Escolher receitas de Listas para a refeição, ou criar uma nova com o nome da refeição. */
function RecipePicker({ meal, onToggle, onClose }: { meal: DietMeal; onToggle: (id: string) => void; onClose: () => void }) {
  const { data, update } = useStore();
  const recipes = allRecipes(data);
  const cat = data.listCategories.find((c) => c.kind === 'receita')?.id ?? null;
  const create = () => {
    if (!cat) return;
    const r = newList(meal.name.trim() || 'Nova receita', cat);
    update((d) => ({ ...d, lists: [...d.lists, r] }));
    onToggle(r.id);
    notify('Receita criada em Listas', 'Depois é só abrir e escrever ingredientes e preparo.');
  };
  return (
    <Sheet title={`Receitas · ${meal.name}`} onClose={onClose} footer={<button type="button" className="btn primary block" onClick={onClose}>Pronto</button>}>
      <p className="muted small">As receitas ficam em Listas. Aqui você só escolhe quais servem para esta refeição.</p>
      {recipes.length ? (
        <ul className="list">
          {recipes.map((r) => {
            const on = meal.recipes.includes(r.id);
            return (
              <li key={r.id}>
                <button type="button" className="row" aria-pressed={on} onClick={() => onToggle(r.id)}>
                  <span className={`check round${on ? ' on' : ''}`} aria-hidden="true">{on && <Icon name="check" size={14} />}</span>
                  <span className="row-body">
                    <span className="row-title">{r.name}</span>
                    <span className="row-meta">{r.items.length} {r.items.length === 1 ? 'ingrediente' : 'ingredientes'}{r.minutes ? ` · ${r.minutes} min` : ''}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <Empty>Você ainda não tem receitas em Listas.</Empty>
      )}
      {cat && (
        <button type="button" className="btn soft block" onClick={create}>
          <Icon name="plusCircle" size={18} /> Nova receita "{meal.name.trim() || 'Nova receita'}"
        </button>
      )}
    </Sheet>
  );
}

// ---------- Lista de compras da semana (N1.2b) ----------

/** Receitas dos próximos 7 dias (vezes ajustáveis) → ingredientes somados → lista de mercado. */
function ShoppingSheet({ onClose }: { onClose: () => void }) {
  const { data, update } = useStore();
  const today = todayISO();
  const [week] = useState(() => weekRecipes(data, today));
  const [times, setTimes] = useState<Record<string, number>>(() => Object.fromEntries(week.map((w) => [w.recipe.id, w.times])));
  const lines = shoppingLines(week.map((w) => ({ recipe: w.recipe, times: times[w.recipe.id] ?? 0 })));
  const [off, setOff] = useState<string[]>([]);
  const targets = marketLists(data);
  const [target, setTarget] = useState<string>(targets[0]?.id ?? 'nova');
  const chosen = lines.filter((l) => !off.includes(l.key));
  const send = () => {
    const cat = data.listCategories.find((c) => c.kind === 'mercado')?.id;
    if (target === 'nova') {
      if (!cat) return;
      const l = newList('Mercado da semana', cat);
      update((d) => sendShopping(chosen, l.id)({ ...d, lists: [...d.lists, l] }));
      onClose();
      go(`listas/${l.id}`);
    } else {
      update(sendShopping(chosen, target));
      onClose();
      go(`listas/${target}`);
    }
    notify('Lista de compras pronta', `${chosen.length} ${chosen.length === 1 ? 'item' : 'itens'} na lista de mercado.`);
  };
  return (
    <Sheet
      title="Compras da semana"
      size="wide"
      onClose={onClose}
      footer={week.length ? <button type="button" className="btn primary block" disabled={!chosen.length} onClick={send}>Mandar {chosen.length} {chosen.length === 1 ? 'item' : 'itens'}</button> : undefined}
    >
      {!week.length ? (
        <Empty>Nenhuma refeição dos próximos 7 dias tem receita ligada. No editor do plano, use o botão "Receita" em cada refeição.</Empty>
      ) : (
        <>
          <h3 className="section-title">Receitas da semana</h3>
          <p className="muted small">Quantas vezes cada uma vai ser feita. Ajuste se uma refeição tem receitas que são opções (uma ou outra).</p>
          <ul className="list">
            {week.map((w) => {
              const n = times[w.recipe.id] ?? 0;
              return (
                <li key={w.recipe.id} className="row">
                  <span className="row-body">
                    <span className="row-title">{w.recipe.name}</span>
                    <span className="row-meta">{w.recipe.serves} {w.recipe.serves === 1 ? 'porção' : 'porções'} por vez</span>
                  </span>
                  <span className="qty-adjust">
                    <button type="button" aria-label={`Menos uma vez ${w.recipe.name}`} disabled={n <= 0} onClick={() => setTimes({ ...times, [w.recipe.id]: n - 1 })}>−</button>
                    <span className="tabular" aria-label={`${n} vezes`}>{n}×</span>
                    <button type="button" aria-label={`Mais uma vez ${w.recipe.name}`} onClick={() => setTimes({ ...times, [w.recipe.id]: n + 1 })}>+</button>
                  </span>
                </li>
              );
            })}
          </ul>
          <h3 className="section-title">Ingredientes</h3>
          {lines.length ? (
            <ul className="list">
              {lines.map((l) => {
                const on = !off.includes(l.key);
                return (
                  <li key={l.key}>
                    <button type="button" className="row" aria-pressed={on} onClick={() => setOff(on ? [...off, l.key] : off.filter((k) => k !== l.key))}>
                      <span className={`check round${on ? ' on' : ''}`} aria-hidden="true">{on && <Icon name="check" size={14} />}</span>
                      <span className="row-body">
                        <span className="row-title">{l.text}</span>
                        <span className="row-meta">{l.from.join(', ')}</span>
                      </span>
                      <span className="small tabular">{l.qty !== null ? `${recipeQty(l.qty)} ${l.unit}`.trim() : ''}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty>As receitas escolhidas ainda não têm ingredientes. Escreva-os em Listas.</Empty>
          )}
          <div className="field">
            <span className="field-label">Mandar para</span>
            <Chips<string> label="Mandar para" value={target} onChange={setTarget} options={[...targets.map((l) => ({ value: l.id, label: l.name })), { value: 'nova', label: '+ Nova lista' }]} />
          </div>
          <p className="muted small">Se o item já está na lista e ainda não foi comprado, a quantidade é somada.</p>
        </>
      )}
    </Sheet>
  );
}

// ---------- Remédios (N1.3) ----------

const nowHHMM = () => new Date().toTimeString().slice(0, 5);

/** Hoje: as doses do dia em ordem de horário, com "Tomei". */
function MedsToday({ day, onCreate }: { day: string; onCreate: () => void }) {
  const { data, update } = useStore();
  const doses = dosesOn(data, day);
  if (!data.health.meds.length) {
    return (
      <section className="card" aria-label="Remédios">
        <div className="card-head"><h2><Icon name="pill" size={18} /> Remédios</h2></div>
        <p className="muted small">Cadastre os remédios ou suplementos que você toma para marcar cada dose.</p>
        <button type="button" className="btn soft block" onClick={onCreate}><Icon name="plusCircle" size={18} /> Cadastrar remédio</button>
      </section>
    );
  }
  if (!doses.length) return null;
  const done = doses.filter((x) => x.taken).length;
  const next = doses.find((x) => !x.taken);
  return (
    <section className="card" aria-label="Remédios">
      <div className="card-head">
        <h2><Icon name="pill" size={18} /> Remédios</h2>
        <span className="muted small tabular">{done} de {doses.length}</span>
      </div>
      <ul className="list">
        {doses.map((x) => (
          <li key={x.key} className="row">
            <span className="row-body">
              <span className="row-title">{x.med.name}{x.med.dose ? <span className="muted small"> · {x.med.dose}</span> : null}</span>
              <span className="row-meta tabular">
                {x.time}
                {x.taken ? ` · tomei às ${x.taken}` : x === next ? ' · próxima' : ''}
              </span>
            </span>
            <button
              type="button"
              className={`btn small ${x.taken ? 'soft' : 'primary'}`}
              aria-pressed={!!x.taken}
              aria-label={x.taken ? `Desfazer: ${x.med.name} das ${x.time}` : `Tomei ${x.med.name} das ${x.time}`}
              onClick={() => update(toggleTaken(day, x.med.id, x.time, nowHHMM()))}
            >
              {x.taken ? <><Icon name="check" size={14} /> Tomei</> : 'Tomei'}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MedsTab({ onEdit, onCreate }: { onEdit: (m: Medicine) => void; onCreate: () => void }) {
  const { data, update } = useStore();
  const today = todayISO();
  const meds = [...data.health.meds].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const current = meds.filter((m) => m.end === null || m.end >= today);
  const ended = meds.filter((m) => m.end !== null && m.end < today);
  const linked = medsHabit(data);
  const cand = linked ? null : medHabitCandidate(data.habits);
  const row = (m: Medicine) => (
    <li key={m.id}>
      <button type="button" className="row" onClick={() => onEdit(m)}>
        <span className="tile-icon small"><Icon name="pill" size={18} /></span>
        <span className="row-body">
          <span className="row-title">{m.name}{m.dose ? <span className="muted small"> · {m.dose}</span> : null}</span>
          <span className="row-meta tabular">{timesText(m.times)} · {daysText(m.days)}</span>
          <span className="muted small">{m.end ? `até ${formatDate(m.end)}` : 'uso contínuo'}{m.remind ? ' · aviso no Google Agenda' : ''}</span>
        </span>
        <Icon name="edit" size={16} />
      </button>
    </li>
  );
  return (
    <>
      <section className="card" aria-label="Remédios em uso">
        <div className="card-head"><h2>Em uso</h2></div>
        {current.length ? <ul className="list">{current.map(row)}</ul> : <Empty>Nenhum remédio em uso.</Empty>}
        <button type="button" className="btn soft block" onClick={onCreate}><Icon name="plusCircle" size={18} /> Novo remédio</button>
      </section>
      {(linked || cand) && (
        <section className="card" aria-label="Hábito ligado">
          <div className="card-head"><h2>Hábito</h2></div>
          {linked ? (
            <>
              <p className="small">O hábito <strong>{linked.name}</strong> é marcado sozinho quando todas as doses do dia foram tomadas.</p>
              <button type="button" className="btn soft" onClick={() => update(linkMedsHabit(null))}>Desligar</button>
            </>
          ) : cand ? (
            <>
              <p className="small">Quer que o hábito <strong>{cand.name}</strong> seja marcado sozinho quando todas as doses do dia forem tomadas?</p>
              <button type="button" className="btn primary" onClick={() => { update(linkMedsHabit(cand.id)); notify('Hábito ligado', `"${cand.name}" agora segue os remédios.`); }}>Ligar</button>
            </>
          ) : null}
        </section>
      )}
      {ended.length > 0 && (
        <section className="card" aria-label="Tratamentos encerrados">
          <div className="card-head"><h2>Encerrados</h2></div>
          <ul className="list">{ended.map(row)}</ul>
        </section>
      )}
      <p className="muted small">O app só registra. Dose e horário são os que o seu médico indicou.</p>
    </>
  );
}

function MedSheet({ initial, onClose }: { initial: Medicine; onClose: () => void }) {
  const { data, update } = useStore();
  const [m, setM] = useState<Medicine>(initial);
  const isNew = !data.health.meds.some((x) => x.id === m.id);
  const google = data.settings.googleCalendar.on;
  const today = todayISO();
  const save = () => {
    if (!m.name.trim()) return notify('Falta o nome', 'Escreva o nome do remédio.');
    update(saveMed({ ...m, name: m.name.trim(), dose: m.dose.trim() }));
    notify(isNew ? 'Remédio cadastrado' : 'Remédio salvo', `${m.name.trim()} · ${timesText([...m.times].sort())}`);
    onClose();
  };
  const everyDay = m.days.length === 7;
  return (
    <Sheet title={isNew ? 'Novo remédio' : 'Editar remédio'} onClose={onClose} footer={<button type="button" className="btn primary block" onClick={save}>Salvar</button>}>
      <Field label="Nome">
        <input className="input" value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} placeholder="Ex.: Vitamina D" />
      </Field>
      <Field label="Dose (opcional)">
        <input className="input" value={m.dose} onChange={(e) => setM({ ...m, dose: e.target.value })} placeholder="Ex.: 1 comprimido, 10 gotas" />
      </Field>
      <div className="field">
        <span className="field-label">Horários</span>
        <div className="med-times">
          {m.times.map((t, i) => (
            <span key={i} className="med-time">
              <input className="input" type="time" aria-label={`Horário ${i + 1}`} value={t} onChange={(e) => e.target.value && setM({ ...m, times: m.times.map((x, j) => (j === i ? e.target.value : x)) })} />
              {m.times.length > 1 && (
                <button type="button" className="icon-btn" aria-label={`Tirar o horário ${t}`} onClick={() => setM({ ...m, times: m.times.filter((_, j) => j !== i) })}>×</button>
              )}
            </span>
          ))}
          <button type="button" className="btn soft small" onClick={() => setM({ ...m, times: [...m.times, '20:00'] })}>+ Horário</button>
        </div>
      </div>
      <div className="field">
        <span className="field-label">Dias</span>
        <Chips<string> label="Dias" value={everyDay ? 'todos' : 'alguns'} onChange={(v) => setM({ ...m, days: v === 'todos' ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5] })} options={[{ value: 'todos', label: 'Todo dia' }, { value: 'alguns', label: 'Alguns dias' }]} />
        {!everyDay && (
          <div className="chips" role="group" aria-label="Dias da semana">
            {DOW.map((l, d) => (
              <button key={d} type="button" aria-label={DOW_NAME[d]} aria-pressed={m.days.includes(d)} className={`chip-btn${m.days.includes(d) ? ' on' : ''}`} onClick={() => setM({ ...m, days: m.days.includes(d) ? m.days.filter((x) => x !== d) : [...m.days, d].sort() })}>
                {l}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid-2">
        <Field label="Começa em">
          <input className="input" type="date" value={m.start} onChange={(e) => e.target.value && setM({ ...m, start: e.target.value })} />
        </Field>
        <Field label="Até (vazio = contínuo)">
          <input className="input" type="date" value={m.end ?? ''} onChange={(e) => setM({ ...m, end: e.target.value || null })} />
        </Field>
      </div>
      <Field label="Observações (opcional)">
        <textarea className="input" rows={2} value={m.notes} onChange={(e) => setM({ ...m, notes: e.target.value })} placeholder="Ex.: tomar depois do almoço" />
      </Field>
      <div className="toggle-row">
        <span>
          <strong>Aviso no Google Agenda</strong>
          <span className="muted small"> {google ? '(na hora de cada dose)' : '(ligue a conta Google em Configurações)'}</span>
        </span>
        <Toggle label="Aviso no Google Agenda" checked={m.remind} onChange={(remind) => setM({ ...m, remind })} />
      </div>
      {!isNew && (
        <div className="btn-row">
          {(m.end === null || m.end >= today) && (
            <button type="button" className="btn soft" onClick={() => { update(endMed(m.id, today)); notify('Tratamento encerrado', `${m.name} sai do Hoje a partir de amanhã.`); onClose(); }}>Encerrar hoje</button>
          )}
          <button type="button" className="btn soft danger" onClick={() => { update(removeMed(m.id)); notify('Remédio apagado', 'Ele sai do Hoje e do Histórico. Para guardar o histórico, use "Encerrar hoje".'); onClose(); }}>Apagar</button>
        </div>
      )}
    </Sheet>
  );
}

// ---------- Consultas, exames e check-ups (N1.4) ----------

const STATE_PILL: Record<string, { tone: 'green' | 'orange' | 'blue' | 'gray'; text: string }> = {
  marcado: { tone: 'green', text: 'marcado' },
  atrasado: { tone: 'orange', text: 'passou do prazo' },
  perto: { tone: 'blue', text: 'perto' },
  ok: { tone: 'gray', text: 'em dia' },
  'sem-data': { tone: 'gray', text: 'sem última data' },
};

const monthYear = (day: string) => formatDate(day, { month: 'short', year: 'numeric' });

function ApptRow({ a, onOpen }: { a: Appointment; onOpen: (a: Appointment) => void }) {
  const k = kindInfo(a.kind);
  return (
    <li>
      <button type="button" className="row" onClick={() => onOpen(a)}>
        <span className="tile-icon small"><Icon name={k.icon as IconName} size={18} /></span>
        <span className="row-body">
          <span className="row-title">{apptTitle(a)}</span>
          <span className="row-meta tabular">
            {a.date ? `${relativeDay(a.date)}${a.time ? ` · ${a.time}` : ''}` : 'a marcar'}
            {a.who ? ` · ${a.who}` : ''}
          </span>
          {a.bring && !a.done && <span className="muted small">Levar: {a.bring}</span>}
          {a.done && a.result && <span className="muted small">{a.result.split('\n')[0]}</span>}
        </span>
      </button>
    </li>
  );
}

/** Hoje: consultas dos próximos 7 dias (e check-ups que passaram do prazo). */
function NextAppts({ onOpen }: { onOpen: (a: Appointment) => void }) {
  const { data } = useStore();
  const today = todayISO();
  const soon = splitAppts(data).scheduled.filter((a) => a.date! >= today && a.date! <= addDaysISO(today, 7));
  const late = data.health.routines.filter((r) => routineStatus(data, r, today).state === 'atrasado');
  if (!soon.length && !late.length) return null;
  return (
    <section className="card" aria-label="Consultas">
      <div className="card-head"><h2><Icon name="stethoscope" size={18} /> Consultas</h2><span className="muted small">próximos 7 dias</span></div>
      {soon.length > 0 && <ul className="list">{soon.map((a) => <ApptRow key={a.id} a={a} onOpen={onOpen} />)}</ul>}
      {late.length > 0 && <a className="muted small" href="#/saude/consultas">{late.map((r) => r.label).join(', ')}: passou do prazo de marcar.</a>}
    </section>
  );
}

function ApptsTab({ onEdit, onCreate, onRoutine, onNewRoutine }: { onEdit: (a: Appointment) => void; onCreate: () => void; onRoutine: (r: CheckupRoutine) => void; onNewRoutine: () => void }) {
  const { data } = useStore();
  const today = todayISO();
  const { scheduled, toSchedule, done } = splitAppts(data);
  const [allDone, setAllDone] = useState(false);
  const order: Record<string, number> = { atrasado: 0, perto: 1, marcado: 2, 'sem-data': 3, ok: 4 };
  const routines = data.health.routines.map((r) => ({ r, st: routineStatus(data, r, today) })).sort((a, b) => order[a.st.state] - order[b.st.state] || a.r.label.localeCompare(b.r.label, 'pt-BR'));
  return (
    <>
      <section className="card" aria-label="Consultas marcadas">
        <div className="card-head"><h2>Marcadas</h2><span className="muted small">aparecem na Agenda sozinhas</span></div>
        {scheduled.length ? <ul className="list">{scheduled.map((a) => <ApptRow key={a.id} a={a} onOpen={onEdit} />)}</ul> : <Empty>Nenhuma consulta marcada.</Empty>}
        <button type="button" className="btn soft block" onClick={onCreate}><Icon name="plusCircle" size={18} /> Nova consulta ou exame</button>
      </section>
      {toSchedule.length > 0 && (
        <section className="card" aria-label="A marcar">
          <div className="card-head"><h2>A marcar</h2><span className="muted small">sem data ainda</span></div>
          <ul className="list">{toSchedule.map((a) => <ApptRow key={a.id} a={a} onOpen={onEdit} />)}</ul>
        </section>
      )}
      <section className="card" aria-label="Próximos check-ups">
        <div className="card-head"><h2>Próximos check-ups</h2></div>
        {routines.length ? (
          <ul className="list">
            {routines.map(({ r, st }) => (
              <li key={r.id}>
                <button type="button" className="row" onClick={() => onRoutine(r)}>
                  <span className="tile-icon small"><Icon name={kindInfo(r.kind).icon as IconName} size={18} /></span>
                  <span className="row-body">
                    <span className="row-title">{r.label}</span>
                    <span className="row-meta">
                      a cada {intervalText(r.months)}
                      {r.last ? ` · última em ${monthYear(r.last)}` : ''}
                    </span>
                    <span className="muted small">
                      {st.state === 'marcado' && st.booked ? `marcado: ${relativeDay(st.booked.date!)}` : st.due ? `próximo por volta de ${monthYear(st.due)}` : 'diga quando foi a última vez'}
                    </span>
                  </span>
                  <Pill tone={STATE_PILL[st.state].tone}>{STATE_PILL[st.state].text}</Pill>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Dentista a cada 6 meses, check-up todo ano… Cadastre o que se repete e o app lembra quando marcar.</Empty>
        )}
        <button type="button" className="btn soft block" onClick={onNewRoutine}><Icon name="repeat" size={18} /> Novo check-up que se repete</button>
      </section>
      {done.length > 0 && (
        <section className="card" aria-label="Consultas feitas">
          <div className="card-head"><h2>Feitas</h2><span className="muted small">{done.length}</span></div>
          <ul className="list">{(allDone ? done : done.slice(0, 5)).map((a) => <ApptRow key={a.id} a={a} onOpen={onEdit} />)}</ul>
          {done.length > 5 && !allDone && <button type="button" className="btn soft block" onClick={() => setAllDone(true)}>Ver todas</button>}
        </section>
      )}
      <p className="muted small">O app só registra. Resultados e decisões são com o seu médico.</p>
    </>
  );
}

function ApptSheet({ initial, onClose, onRoutine }: { initial: Appointment; onClose: () => void; onRoutine: (r: CheckupRoutine) => void }) {
  const { data, update } = useStore();
  const today = todayISO();
  const [a, setA] = useState<Appointment>(initial);
  const [retorno, setRetorno] = useState(false);
  const [retornoDate, setRetornoDate] = useState('');
  const [exams, setExams] = useState('');
  const suggestion = a.done ? suggestRoutine(a, initial.id + '-r') : null;
  const [repeat, setRepeat] = useState(false);
  const [picked, setMonths] = useState<number | null>(null);
  const months = picked ?? suggestion?.months ?? 12;
  const isNew = !data.health.appts.some((x) => x.id === a.id);
  const k = kindInfo(a.kind);
  const routines = data.health.routines;
  const save = () => {
    let routineId = a.routineId;
    const actions: ((d: AppData) => AppData)[] = [];
    const sug = a.done ? suggestRoutine(a, uid()) : null;
    if (a.done && repeat && sug) {
      routineId = sug.id;
      actions.push(saveRoutine({ ...sug, months }, today));
    }
    actions.push(saveAppt({ ...a, title: a.title.trim(), routineId }, today));
    if (a.done && retorno) actions.push(saveAppt(followUp({ ...a, routineId }, uid(), retornoDate || null, new Date().toISOString()), today));
    if (a.done && exams.trim()) for (const ex of examRequests(exams, uid, new Date().toISOString())) actions.push(saveAppt(ex, today));
    update((d) => actions.reduce((acc, f) => f(acc), d));
    notify(isNew ? 'Consulta salva' : 'Consulta atualizada', a.date && !a.done ? 'Já está na Agenda.' : apptTitle(a));
    onClose();
  };
  return (
    <Sheet title={isNew ? 'Nova consulta ou exame' : apptTitle(initial)} onClose={onClose} footer={<button type="button" className="btn primary block" onClick={save}>Salvar</button>}>
      <div className="field">
        <span className="field-label">Tipo</span>
        <Chips<ApptKind> label="Tipo" value={a.kind} onChange={(kind) => setA({ ...a, kind })} options={APPT_KINDS.map((x) => ({ value: x.id, label: x.label }))} />
      </div>
      <Field label={a.kind === 'consulta' ? 'Especialidade' : a.kind === 'exame' ? 'Exame' : 'Motivo (opcional)'}>
        <input className="input" value={a.title} onChange={(e) => setA({ ...a, title: e.target.value })} placeholder={k.hint} />
      </Field>
      <div className="grid-2">
        <Field label="Profissional ou clínica">
          <input className="input" value={a.who} onChange={(e) => setA({ ...a, who: e.target.value })} placeholder="Opcional" />
        </Field>
        <Field label="Local">
          <input className="input" value={a.place} onChange={(e) => setA({ ...a, place: e.target.value })} placeholder="Opcional" />
        </Field>
      </div>
      <div className="grid-2">
        <Field label="Dia (vazio = a marcar)">
          <input className="input" type="date" value={a.date ?? ''} onChange={(e) => setA({ ...a, date: e.target.value || null })} />
        </Field>
        <Field label="Hora">
          <input className="input" type="time" value={a.time} onChange={(e) => setA({ ...a, time: e.target.value })} />
        </Field>
      </div>
      <Field label="O que levar (opcional)">
        <input className="input" value={a.bring} onChange={(e) => setA({ ...a, bring: e.target.value })} placeholder="Ex.: jejum de 8 h, exames antigos" />
      </Field>
      <Field label="Anotações (opcional)">
        <textarea className="input" rows={2} value={a.notes} onChange={(e) => setA({ ...a, notes: e.target.value })} placeholder="Motivo, dúvidas para perguntar…" />
      </Field>
      {routines.length > 0 && (
        <div className="field">
          <span className="field-label">Faz parte de um check-up que se repete?</span>
          <Chips<string> label="Check-up" value={a.routineId ?? 'nenhum'} onChange={(v) => setA({ ...a, routineId: v === 'nenhum' ? null : v })} options={[{ value: 'nenhum', label: 'Não' }, ...routines.map((r) => ({ value: r.id, label: r.label }))]} />
        </div>
      )}
      <div className="toggle-row">
        <strong>Já fui</strong>
        <Toggle label="Já fui" checked={a.done} onChange={(done) => setA({ ...a, done, date: done && !a.date ? today : a.date })} />
      </div>
      {a.done && (
        <div className="preview-box diet-edit">
          <Field label="Como foi / resultado">
            <textarea className="input" rows={3} value={a.result} onChange={(e) => setA({ ...a, result: e.target.value })} placeholder="O que foi falado, resultado, próximos passos…" />
          </Field>
          <div className="toggle-row">
            <strong>Marcar retorno</strong>
            <Toggle label="Marcar retorno" checked={retorno} onChange={setRetorno} />
          </div>
          {retorno && (
            <Field label="Dia do retorno (vazio = a marcar)">
              <input className="input" type="date" value={retornoDate} onChange={(e) => setRetornoDate(e.target.value)} />
            </Field>
          )}
          <Field label="Pedidos de exame (um por linha, opcional)">
            <textarea className="input" rows={2} value={exams} onChange={(e) => setExams(e.target.value)} placeholder={'Hemograma\nGlicemia'} />
          </Field>
          {suggestion && (
            <>
              <div className="toggle-row">
                <span>
                  <strong>Repetir</strong>
                  <span className="muted small"> (o app lembra quando marcar de novo)</span>
                </span>
                <Toggle label="Repetir" checked={repeat} onChange={setRepeat} />
              </div>
              {repeat && (
                <Chips<string> label="De quanto em quanto tempo" value={String(months)} onChange={(v) => setMonths(Number(v))} options={[3, 6, 12, 24].map((m) => ({ value: String(m), label: `a cada ${intervalText(m)}` }))} />
              )}
            </>
          )}
        </div>
      )}
      {!isNew && (
        <div className="btn-row">
          {a.routineId && routines.find((r) => r.id === a.routineId) && (
            <button type="button" className="btn soft" onClick={() => onRoutine(routines.find((r) => r.id === a.routineId)!)}>Ver check-up</button>
          )}
          <button type="button" className="btn soft danger" onClick={() => { update(removeAppt(a.id, today)); notify('Consulta apagada', 'Saiu também da Agenda.'); onClose(); }}>Apagar</button>
        </div>
      )}
    </Sheet>
  );
}

function RoutineSheet({ initial, onClose, onBook }: { initial: CheckupRoutine; onClose: () => void; onBook: (r: CheckupRoutine) => void }) {
  const { data, update } = useStore();
  const today = todayISO();
  const [r, setR] = useState<CheckupRoutine>(initial);
  const isNew = !data.health.routines.some((x) => x.id === r.id);
  const st = routineStatus(data, r, today);
  const final = () => ({ ...r, label: r.label.trim() || kindInfo(r.kind).label });
  const save = () => {
    update(saveRoutine(final(), today));
    notify(isNew ? 'Check-up cadastrado' : 'Check-up salvo', `${final().label} a cada ${intervalText(r.months)}`);
    onClose();
  };
  return (
    <Sheet title={isNew ? 'Check-up que se repete' : r.label} onClose={onClose} footer={<button type="button" className="btn primary block" onClick={save}>Salvar</button>}>
      <div className="field">
        <span className="field-label">Tipo</span>
        <Chips<ApptKind> label="Tipo" value={r.kind} onChange={(kind) => setR({ ...r, kind, months: isNew ? kindInfo(kind).months : r.months })} options={APPT_KINDS.map((x) => ({ value: x.id, label: x.label }))} />
      </div>
      <Field label="Nome">
        <input className="input" value={r.label} onChange={(e) => setR({ ...r, label: e.target.value })} placeholder={`Ex.: ${kindInfo(r.kind).label === 'Consulta' ? 'Oftalmologista' : kindInfo(r.kind).label}`} />
      </Field>
      <div className="field">
        <span className="field-label">De quanto em quanto tempo</span>
        <Chips<string> label="Intervalo" value={String(r.months)} onChange={(v) => setR({ ...r, months: Number(v) })} options={[3, 6, 12, 24].map((m) => ({ value: String(m), label: intervalText(m) }))} />
      </div>
      <Field label="Última vez (opcional)">
        <input className="input" type="date" value={r.last ?? ''} onChange={(e) => setR({ ...r, last: e.target.value || null })} />
      </Field>
      <p className="muted small">
        {st.state === 'marcado' && st.booked ? `Já marcado: ${relativeDay(st.booked.date!)}.` : st.due ? `Próximo por volta de ${monthYear(st.due)}. ${st.state === 'atrasado' ? 'Passou do prazo: aparece "Marcar" hoje na Agenda.' : 'Quando chegar, aparece "Marcar" na Agenda.'}` : 'Diga quando foi a última vez para o app calcular a próxima.'}
      </p>
      {!isNew && (
        <div className="btn-row">
          {st.state !== 'marcado' && <button type="button" className="btn primary" onClick={() => { update(saveRoutine(final(), today)); onBook(final()); }}>Marcar consulta</button>}
          <button type="button" className="btn soft danger" onClick={() => { update(removeRoutine(r.id, today)); notify('Check-up apagado', 'As consultas continuam no histórico.'); onClose(); }}>Apagar</button>
        </div>
      )}
    </Sheet>
  );
}

// ---------- Peso e medidas (N1.5) ----------

const fmtNum = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

/** Gráfico de linha simples (sem cor de bom ou ruim). */
function BodyChart({ points, unit }: { points: { date: string; value: number }[]; unit: string }) {
  if (points.length < 2) return <p className="muted small">O gráfico aparece a partir de duas medições.</p>;
  const W = 320, H = 140, P = 28;
  const vals = points.map((p) => p.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const x = (i: number) => P + (i * (W - 2 * P)) / (points.length - 1);
  const y = (v: number) => H - P / 1.2 - ((v - min) / span) * (H - P * 1.8);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="body-chart" role="img" aria-label={`Gráfico de ${points.length} medições`}>
      <line x1={P} x2={W - P} y1={y(min)} y2={y(min)} className="body-grid" />
      <line x1={P} x2={W - P} y1={y(max)} y2={y(max)} className="body-grid" />
      <text x={2} y={y(max) + 4} className="body-label">{fmtNum(max)}</text>
      <text x={2} y={y(min) + 4} className="body-label">{fmtNum(min)}</text>
      <path d={path} className="body-line" />
      {points.map((p, i) => <circle key={p.date + i} cx={x(i)} cy={y(p.value)} r={i === points.length - 1 ? 4 : 2.5} className="body-dot" />)}
      <text x={P} y={H - 4} className="body-label">{formatDate(points[0].date)}</text>
      <text x={W - P} y={H - 4} textAnchor="end" className="body-label">{formatDate(points[points.length - 1].date)} · {unit}</text>
    </svg>
  );
}

function BodyTab({ onEdit, onCreate }: { onEdit: (e: BodyEntry) => void; onCreate: () => void }) {
  const { data, update } = useStore();
  const b = data.health.body;
  const [field, setField] = useState(b.fields[0]?.name ?? 'Peso');
  const [newField, setNewField] = useState('');
  const [newUnit, setNewUnit] = useState('cm');
  // E41: esconder ou mostrar fica no menu ⋮ da barra de cima.
  // Escondido, o próprio cartão da aba tem o botão "Mostrar" (não repete no menu).
  usePageMenu([b.show && { id: 'medidas', label: 'Esconder peso e medidas', icon: 'eyeOff', run: () => update(setBodyShow(false)) }]);
  if (!b.show) {
    return (
      <section className="card" aria-label="Peso e medidas">
        <div className="card-head"><h2><Icon name="scale" size={18} /> Peso e medidas</h2></div>
        <p className="small">Estão escondidos, para não aparecer número que você não quer ver. Nunca vão para o Início nem dão pontos na Jornada.</p>
        <button type="button" className="btn soft block" onClick={() => update(setBodyShow(true))}>Mostrar peso e medidas</button>
      </section>
    );
  }
  const f = b.fields.find((x) => x.name === field) ?? b.fields[0];
  const entries = [...b.entries].sort((a, c) => c.date.localeCompare(a.date));
  return (
    <>
      <section className="card" aria-label="Últimas medidas">
        <div className="card-head">
          <h2><Icon name="scale" size={18} /> Medidas</h2>
        </div>
        <div className="summary three">
          {b.fields.map((x) => {
            const l = bodyLatest(b, x.name);
            return (
              <button key={x.name} type="button" className={`summary-box${x.name === f?.name ? ' on' : ''}`} onClick={() => setField(x.name)}>
                <span className="label">{x.name}</span>
                <span className="value tabular">{l ? `${fmtNum(l.value)} ${x.unit}` : '—'}</span>
                {l && l.diff !== null && <span className="muted small tabular">{l.diff > 0 ? '+' : ''}{fmtNum(l.diff)} desde a anterior</span>}
              </button>
            );
          })}
        </div>
        {f && <BodyChart points={bodySeries(b, f.name)} unit={f.unit} />}
        <button type="button" className="btn primary block" onClick={onCreate}><Icon name="plusCircle" size={18} /> Nova medição</button>
      </section>
      <section className="card" aria-label="Medições">
        <div className="card-head"><h2>Medições</h2><span className="muted small">{entries.length}</span></div>
        {entries.length ? (
          <ul className="list">
            {entries.map((e) => (
              <li key={e.id}>
                <button type="button" className="row" onClick={() => onEdit(e)}>
                  <span className="row-body">
                    <span className="row-title">{formatDate(e.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="row-meta tabular">{b.fields.filter((x) => e.values[x.name]).map((x) => `${x.name} ${fmtNum(e.values[x.name])} ${x.unit}`).join(' · ')}</span>
                  </span>
                  <Icon name="edit" size={16} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Nenhuma medição ainda.</Empty>
        )}
      </section>
      <section className="card" aria-label="Outra medida">
        <div className="card-head"><h2>Outra medida</h2></div>
        <div className="grid-2">
          <Field label="Nome">
            <input className="input" value={newField} onChange={(e) => setNewField(e.target.value)} placeholder="Ex.: Quadril" />
          </Field>
          <Field label="Unidade">
            <input className="input" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="cm, kg, %" />
          </Field>
        </div>
        <button type="button" className="btn soft block" disabled={!newField.trim()} onClick={() => { update(addBodyField(newField, newUnit)); setNewField(''); }}>Adicionar medida</button>
      </section>
      <p className="muted small">Só registro, sem metas nem recompensas.</p>
    </>
  );
}

function BodySheet({ initial, onClose }: { initial: BodyEntry; onClose: () => void }) {
  const { data, update } = useStore();
  const [date, setDate] = useState(initial.date);
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(Object.entries(initial.values).map(([k, v]) => [k, String(v).replace('.', ',')])));
  const isNew = !data.health.body.entries.some((e) => e.id === initial.id);
  const num = (v: string) => Number(v.replace(/\s/g, '').replace(',', '.'));
  const save = () => {
    const values = Object.fromEntries(Object.entries(vals).map(([k, v]) => [k, num(v)]).filter(([, v]) => Number.isFinite(v as number) && (v as number) > 0));
    if (!Object.keys(values).length) return notify('Falta um valor', 'Preencha pelo menos uma medida.');
    update(saveBodyEntry({ id: initial.id, date, values }));
    notify(isNew ? 'Medição salva' : 'Medição atualizada');
    onClose();
  };
  return (
    <Sheet title={isNew ? 'Nova medição' : 'Editar medição'} onClose={onClose} footer={<button type="button" className="btn primary block" onClick={save}>Salvar</button>}>
      <Field label="Dia">
        <input className="input" type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
      </Field>
      <div className="grid-2">
        {data.health.body.fields.map((f) => (
          <Field key={f.name} label={`${f.name}${f.unit ? ` (${f.unit})` : ''}`}>
            <input className="input" inputMode="decimal" value={vals[f.name] ?? ''} onChange={(e) => setVals({ ...vals, [f.name]: e.target.value })} placeholder="Opcional" />
          </Field>
        ))}
      </div>
      {!isNew && (
        <button type="button" className="btn soft block danger" onClick={() => { update(removeBodyEntry(initial.id)); onClose(); }}>Apagar esta medição</button>
      )}
    </Sheet>
  );
}
