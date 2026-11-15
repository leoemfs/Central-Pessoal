import { useState } from 'react';
import type { ViewProps } from '../App';
import { useSubAction } from '../router';
import { useStore } from '../store';
import type { SleepEntry, SleepFeel } from '../types';
import { formatDate, relativeDay, todayISO, uid } from '../utils';
import { fmtQty } from '../habits';
import { newList } from '../lists';
import { Chips, Empty, Field, Icon, notify, PageHeader, Pill, Progress, Segmented, Sheet, Toggle } from '../ui';
import type { DietLog, DietMeal, DietPlan, DietSource } from '../types';
import {
  activePlan, allRecipes, dayLine, MARKS, recipesOf, toggleRecipe, markMeal, mealsOf, newMeal, newPlan, pickOption, removePlan, savePlan, setDayVariant, setExtra, setSplit, toggleVariantDay, choosePlan,
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
  const [pickSource, setPickSource] = useState(false);
  useSubAction(route, base, { sono: () => setDay(todayISO()), menu: () => setMenu(true), dieta: () => setPickSource(true) });
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
          </div>
        </Sheet>
      )}
      {pickSource && <SourceSheet onClose={() => setPickSource(false)} onPick={(src) => { setPickSource(false); setPlan(newPlan(uid, src, new Date().toISOString())); }} />}
      {plan && <PlanEditor initial={plan} onClose={() => setPlan(null)} />}
    </>
  );
  return { open: (d: string) => setDay(d), editPlan: (p: DietPlan) => setPlan(p), newPlan: () => setPickSource(true), sheet };
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
  const { open, sheet, newPlan: createPlan } = useSaudeActions(route, 'saudehoje');
  return (
    <>
      <PageHeader title="Hoje" subtitle={relativeDay(today) === 'Hoje' ? formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' }) : undefined} />
      <LinkAsk />
      <WaterCard day={today} />
      <SleepCard day={today} onOpen={open} />
      <DietToday day={today} onCreate={createPlan} />
      <section className="card" aria-label="Em breve">
        <span className="muted small">Em breve na Saúde: remédios, consultas e check-ups, peso e medidas.</span>
      </section>
      {sheet}
    </>
  );
}

type Tab = 'agua' | 'sono' | 'dieta';

/** Casa do módulo: abas Água · Sono (ajustes e últimos dias). */
export function SaudePage({ route }: ViewProps) {
  const [tab, setTab] = useState<Tab>('agua');
  const { open, sheet, editPlan, newPlan: createPlan } = useSaudeActions(route, 'saude');
  return (
    <>
      <PageHeader
        title="Saúde"
        tabs={<Segmented<Tab> label="Parte da Saúde" value={tab} onChange={setTab} swipe options={[{ value: 'agua', label: 'Água' }, { value: 'sono', label: 'Sono' }, { value: 'dieta', label: 'Dieta' }]} />}
      />
      <LinkAsk />
      {tab === 'agua' ? <WaterTab /> : tab === 'sono' ? <SleepTab onOpen={open} /> : <DietTab onEdit={editPlan} onCreate={createPlan} />}
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
  const any = weeks.some((w) => w.waterDays || w.nights || w.diet.segui + w.diet.parte + w.diet.fugi);
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
          <Empty>Aqui aparecem as suas semanas de água, sono e dieta. Registre em Hoje ou no botão +.</Empty>
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
