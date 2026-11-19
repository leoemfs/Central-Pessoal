/**
 * Jornada (N2.9b): entrevista da Mestra Lume, seguindo a "Prévia da Jornada".
 * E4: as áreas vêm da montagem do app e do Você (rota das regiões, com "Trocar as áreas");
 * depois, uma pergunta por região → ritmo → resumo (com o horário dos rituais).
 * No fim, cria no app os hábitos e a caixinha que faltam e guarda as respostas.
 */
import { useState } from 'react';
import { useStore } from '../store';
import { todayISO } from '../utils';
import { Icon, notify, type IconName } from '../ui';
import { npcIcon } from '../jornada/catalog';
import { AREAS, campaignRegions, GOALS, LUME_LINES, PLANS, planLabel, goalName, prefill, steps, type Area, type PlanKey, type Profile } from '../jornada/interview';
import { applyInterview, interviewPlan } from '../jornada/interviewApply';

const AREA_ICONS: Record<Area, IconName> = { corpo: 'dumbbell', rotina: 'sun', mente: 'book', dinheiro: 'coins', largar: 'shield', bemestar: 'heart' };
const money = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

function Chips<T extends string | number>({ label, options, value, onChange }: { label: string; options: [T, string][]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="jn-field">
      <span>{label}</span>
      <div className="jn-chipset" role="group" aria-label={label}>
        {options.map(([v, l]) => (
          <button key={String(v)} type="button" aria-pressed={v === value} onClick={() => onChange(v)}>
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Entrevista({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const { data, update } = useStore();
  const today = todayISO();
  const [p, setP] = useState<Profile>(() => prefill(data.journey.profile, data.profile, today));
  const [askAreas, setAskAreas] = useState(() => p.areas.length === 0);
  const [i, setI] = useState(0);
  const [warn, setWarn] = useState(false);
  const list = steps(p, askAreas);
  const st = list[Math.min(i, list.length - 1)];
  const set = <K extends keyof Profile>(k: K, v: Partial<Profile[K]>) => setP((x) => ({ ...x, [k]: typeof v === 'object' && !Array.isArray(v) ? { ...(x[k] as object), ...v } : v }));
  const move = (n: number) => {
    setI((x) => Math.max(0, Math.min(list.length - 1, x + n)));
    window.scrollTo({ top: 0 });
  };
  const toggleArea = (a: Area) => {
    setWarn(false);
    if (p.areas.includes(a)) setP({ ...p, areas: p.areas.filter((x) => x !== a) });
    else if (p.areas.length < 3) setP({ ...p, areas: [...p.areas, a] });
    else setWarn(true);
  };
  const finish = () => {
    const plan = interviewPlan(data, p, today);
    update((d) => applyInterview(d, p, today));
    const made = plan.create.length + (plan.box ? 1 : 0);
    notify('Jornada montada!', made ? `${plan.create.length} ${plan.create.length === 1 ? 'hábito novo' : 'hábitos novos'} no Núcleo${plan.box ? ' e 1 caixinha em Finanças' : ''}.` : 'Tudo o que você contou já estava no app.');
    onDone();
  };
  const plan = st === 'resumo' ? interviewPlan(data, p, today) : null;

  return (
    <div className="jn-flow">
      <div className="jn-steps">
        <span>
          Entrevista · {i + 1} de {list.length}
        </span>
        <div className="jn-dots">
          {list.map((x, k) => (
            <i key={x} className={k <= i ? 'on' : ''} style={{ width: Math.max(8, Math.floor(150 / list.length)) }} />
          ))}
        </div>
      </div>
      <div className="jn-npc">
        <img alt="" src={npcIcon('lume')} />
        <div>
          <b>Mestra Lume</b>
          <span>{LUME_LINES[st]}</span>
        </div>
      </div>

      {st === 'rota' && (
        <>
          <ol className="jn-route">
            {campaignRegions(p).map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
          <p className="muted small">Prioridade: {p.areas.map((a) => AREAS.find((x) => x.id === a)!.name).join(' → ')}</p>
          <button type="button" className="btn ghost small" onClick={() => setAskAreas(true)}>
            Trocar as áreas
          </button>
        </>
      )}
      {st === 'areas' && (
        <>
          <div className="jn-areas">
            {AREAS.map((a) => {
              const rank = p.areas.indexOf(a.id);
              return (
                <button key={a.id} type="button" className="jn-area" aria-pressed={rank !== -1} onClick={() => toggleArea(a.id)}>
                  <span className="jn-area-ico">
                    <Icon name={AREA_ICONS[a.id]} size={22} />
                  </span>
                  <strong>{a.name}</strong>
                  <span>{a.hint}</span>
                  {rank !== -1 && <b className="jn-rank">{rank + 1}</b>}
                </button>
              );
            })}
          </div>
          <p className="muted small">
            {warn
              ? 'Escolha até 3. Toque numa área escolhida para tirar e poder trocar.'
              : p.areas.length
                ? `Prioridade: ${p.areas.map((a) => AREAS.find((x) => x.id === a)!.name).join(' → ')}`
                : 'Toque para escolher. A ordem do toque é a prioridade.'}
          </p>
        </>
      )}
      {st === 'corpo' && (
        <>
          <Chips label="Qual atividade?" options={[['academia', 'Academia'], ['corrida', 'Corrida'], ['caminhada', 'Caminhada'], ['natacao', 'Natação']]} value={p.corpo.act} onChange={(act) => set('corpo', { act })} />
          <Chips label="Quantas vezes por semana?" options={[[2, '2×'], [3, '3×'], [4, '4×'], [5, '5×']]} value={p.corpo.freq} onChange={(freq) => set('corpo', { freq })} />
        </>
      )}
      {st === 'rotina' && <Chips label="Qual ritual?" options={[['cama', 'Arrumar a cama'], ['acordar', 'Acordar no mesmo horário'], ['casa', 'Organizar a casa 10 min'], ['planejar', 'Planejar o dia']]} value={p.rotina.rit} onChange={(rit) => set('rotina', { rit })} />}
      {st === 'mente' && (
        <>
          <Chips label="O quê?" options={[['ler', 'Ler'], ['idioma', 'Idioma'], ['curso', 'Um curso']]} value={p.mente.what} onChange={(what) => set('mente', { what })} />
          <Chips label="Quanto por dia?" options={[['10 min', '10 min'], ['20 min', '20 min'], ['30 min', '30 min']]} value={p.mente.amount} onChange={(amount) => set('mente', { amount })} />
        </>
      )}
      {st === 'dinheiro' && (
        <>
          <Chips label="Maior desafio?" options={[['atraso', 'Contas atrasando'], ['gasto', 'Gastar demais'], ['entrada', 'Não sei quanto entra']]} value={p.dinheiro.issue} onChange={(issue) => set('dinheiro', { issue })} />
          <Chips
            label="Quer juntar para alguma coisa?"
            options={[['viagem', 'Viagem'], ['reserva', 'Reserva de emergência'], ['carro', 'Carro'], ['outro', 'Outro'], ['nenhum', 'Agora não']]}
            value={p.dinheiro.goal}
            onChange={(goal) => set('dinheiro', goal === 'nenhum' ? { goal } : { goal, meta: GOALS[goal][1] })}
          />
          {p.dinheiro.goal !== 'nenhum' && (
            <>
              {p.dinheiro.goal === 'outro' && (
                <div className="jn-field">
                  <label htmlFor="jn-goal">Nome do objetivo</label>
                  <input id="jn-goal" className="input" maxLength={24} placeholder="Ex.: Notebook novo" value={p.dinheiro.custom} onChange={(e) => set('dinheiro', { custom: e.target.value })} />
                </div>
              )}
              <div className="jn-field">
                <label htmlFor="jn-meta">Meta em R$</label>
                <input
                  id="jn-meta"
                  className="input"
                  inputMode="numeric"
                  value={p.dinheiro.meta ? String(p.dinheiro.meta) : ''}
                  onChange={(e) => set('dinheiro', { meta: Number(e.target.value.replace(/\D/g, '')) || 0 })}
                />
              </div>
              <Chips label="Quanto dá para guardar?" options={(Object.keys(PLANS) as PlanKey[]).map((k) => [k, planLabel(k)])} value={p.dinheiro.plan} onChange={(plan) => set('dinheiro', { plan })} />
            </>
          )}
        </>
      )}
      {st === 'largar' && (
        <>
          <Chips label="Qual hábito?" options={[['redes', 'Redes sociais à noite'], ['doce', 'Doce'], ['cigarro', 'Cigarro'], ['refrigerante', 'Refrigerante'], ['outro', 'Outro']]} value={p.largar.habit} onChange={(habit) => set('largar', { habit })} />
          {p.largar.habit === 'outro' && (
            <div className="jn-field">
              <label htmlFor="jn-quit">Qual?</label>
              <input id="jn-quit" className="input" maxLength={24} placeholder="Ex.: roer unha" value={p.largar.custom} onChange={(e) => set('largar', { custom: e.target.value })} />
            </div>
          )}
        </>
      )}
      {st === 'bemestar' && <Chips label="O que te ajuda?" options={[['meditar', 'Meditar 10 min'], ['respirar', 'Respirar 5 min'], ['gratidao', 'Escrever 3 gratidões'], ['terapia', 'Terapia semanal']]} value={p.bemestar.what} onChange={(what) => set('bemestar', { what })} />}
      {st === 'ritmo' && (
        <div className="jn-paces" role="group" aria-label="Ritmo">
          {(
            [
              ['tranquilo', 'Tranquilo', 'Objetivos menores. Chefes com 60% da vida.'],
              ['equilibrado', 'Equilibrado', 'O padrão. Chefes com 80% da vida.'],
              ['desafiador', 'Desafiador', 'Objetivos maiores. Chefes com 95% da vida.'],
            ] as const
          ).map(([v, l, t]) => (
            <button key={v} type="button" aria-pressed={p.pace === v} onClick={() => setP({ ...p, pace: v })}>
              <strong>{l}</strong>
              <span>{t}</span>
            </button>
          ))}
        </div>
      )}
      {st === 'resumo' && plan && (
        <>
          <section className="card">
            <div className="card-head">
              <h2>No Núcleo</h2>
              <span className="muted small">viram as suas missões</span>
            </div>
            {plan.create.length + plan.kept.length === 0 ? (
              <p className="muted small">Nenhum hábito novo: as missões vêm do que você já tem no app.</p>
            ) : (
              <ul className="jn-sources">
                {plan.create.map((h) => (
                  <li key={h.name}>
                    <span>{h.name}</span>
                    <span className="muted">{h.why}</span>
                  </li>
                ))}
                {plan.kept.map((h) => (
                  <li key={h.name}>
                    <span>{h.name}</span>
                    <span className="muted">já existe</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {p.areas.includes('dinheiro') && p.dinheiro.goal !== 'nenhum' && (
            <section className="card">
              <div className="card-head">
                <h2>Em Finanças</h2>
              </div>
              <p className="small">
                <strong>Caixinha {goalName(p)}</strong>
                <br />
                <span className="muted">
                  {plan.boxExists ? 'Já existe uma caixinha com esse nome.' : `Meta de ${money(p.dinheiro.meta)} · ${planLabel(p.dinheiro.plan)}`}
                </span>
              </p>
            </section>
          )}
          <section className="card">
            <div className="card-head">
              <h2>Sua campanha</h2>
              <span className="muted small">{plan.regions.length} regiões · em breve</span>
            </div>
            <ol className="jn-route">
              {plan.regions.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ol>
          </section>
          <Chips
            label="Melhor horário para os rituais"
            options={[
              ['manha', 'Manhã'],
              ['tarde', 'Tarde'],
              ['noite', 'Noite'],
            ]}
            value={p.period}
            onChange={(period) => setP({ ...p, period })}
          />
          <p className="muted small">
            Ritmo {p.pace} · rituais {{ manha: 'de manhã', tarde: 'à tarde', noite: 'à noite' }[p.period]}. Dá para refazer a entrevista quando a vida mudar: os hábitos criados ficam, e nada é duplicado.
          </p>
        </>
      )}

      <div className="jn-foot jn-foot-row">
        <button type="button" className="btn ghost" onClick={() => (i === 0 ? onCancel() : move(-1))}>
          {i === 0 ? 'Agora não' : 'Voltar'}
        </button>
        <button type="button" className="btn primary" disabled={st === 'areas' && p.areas.length === 0} onClick={() => (st === 'resumo' ? finish() : move(1))}>
          {st === 'resumo' ? 'Montar minha jornada' : 'Continuar'}
        </button>
      </div>
    </div>
  );
}
