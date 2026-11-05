import { useState, type CSSProperties } from 'react';
import { useStore } from '../../store';
import { budgetRows, budgetSummary, categoryAverage, lastMonths, monthReport, monthTotal, setBudget, suggestBudgets, type BudgetRow } from '../../budget';
import { addMonths, formatMoney, formatMonth, monthKey, todayISO } from '../../utils';
import { CategoryBadge, Empty, Field, Icon, MonthNav, notify, PageHeader, Pill, Progress, Sheet } from '../../ui';
import { useCategoryOf } from './shared';

const money0 = (v: number) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`;
const pct = (v: number) => `${Math.round(v * 100)}%`;
const shortMonth = (m: string) => formatMonth(m).split(' ')[0].slice(0, 3).toLowerCase();

function rowText(r: BudgetRow): string {
  if (r.pct > 1.001) return `Passou ${formatMoney(-r.left)} do orçamento`;
  if (r.onlyFixed) return r.left > 0.5 ? `Contas fixas · sobram ${formatMoney(r.left)}` : 'Contas fixas · tudo dentro do previsto';
  if (r.perDay !== null) return `Restam ${formatMoney(r.left)} · uns ${money0(r.perDay)} por dia`;
  return `Restam ${formatMoney(r.left)}`;
}

/** Início: só as categorias que passaram de 80% (ou do limite, nas contas fixas). */
export function BudgetAlerts() {
  const { data } = useStore();
  const categoryOf = useCategoryOf();
  const today = todayISO();
  const rows = budgetRows(data, monthKey(today), today).filter((r) => r.alert);
  if (!rows.length) return null;
  return (
    <section className="card">
      <div className="card-head">
        <h2>Orçamento de {formatMonth(monthKey(today)).split(' ')[0].toLowerCase()}</h2>
        <a className="link" href="#/orcamento">
          Ver
        </a>
      </div>
      <ul className="list">
        {rows.map((r) => {
          const c = categoryOf(r.categoryId);
          return (
            <li key={r.categoryId} className="row">
              <CategoryBadge icon={c.icon} color={c.color} size={36} />
              <div className="row-body">
                <span className="row-title">{c.name}</span>
                <span className={`row-meta ${r.tone}`}>{r.pct > 1.001 ? rowText(r) : `${pct(r.pct)} usado · restam ${formatMoney(r.left)} para ${r.daysLeft} ${r.daysLeft === 1 ? 'dia' : 'dias'}`}</span>
                <Progress pct={r.pct * 100} tone={r.tone} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function Orcamento() {
  const { data, update } = useStore();
  const categoryOf = useCategoryOf();
  const today = todayISO();
  const [month, setMonth] = useState(monthKey(today));
  const [edit, setEdit] = useState<string | null>(null);
  const rows = budgetRows(data, month, today);
  const s = budgetSummary(data, month, today);
  const without = data.categories.filter((c) => !data.budgets[c.id]);
  const isCurrent = month === monthKey(today);
  const isPast = month < monthKey(today);
  const tone = s.spent > s.budget + 0.001 ? 'red' : s.budget && s.spent / s.budget >= 0.8 ? 'orange' : 'green';

  return (
    <>
      <PageHeader title="Orçamento" actions={<MonthNav label={formatMonth(month)} onPrev={() => setMonth(addMonths(month, -1))} onNext={() => setMonth(addMonths(month, 1))} onLabel={() => setMonth(monthKey(today))} />} />
      {rows.length > 0 ? (
        <section className="card raised">
          <div className="card-head">
            <h2>{formatMonth(month).split(' ')[0]}</h2>
            {isCurrent && <span className="muted small">faltam {rows[0].daysLeft} dias</span>}
          </div>
          <div className="big-line">
            <span className="big-value">{money0(s.spent)}</span>
            <span className="muted">de {money0(s.budget)}</span>
          </div>
          <Progress pct={s.budget ? (s.spent / s.budget) * 100 : 0} tone={tone} />
          {isCurrent && (
            <div className="pace-mark" style={{ '--d': `${(s.monthPct * 100).toFixed(1)}%` } as CSSProperties}>
              <i />
              <span>hoje</span>
            </div>
          )}
          <p className="muted small" style={{ margin: 0 }}>
            {isPast
              ? s.spent > s.budget
                ? `O mês fechou ${money0(s.spent - s.budget)} acima do planejado.`
                : `O mês fechou ${money0(s.budget - s.spent)} abaixo do planejado.`
              : isCurrent && s.early
                ? 'Ainda é cedo para prever o fechamento do mês: a previsão aparece a partir do dia 10.'
                : isCurrent
                ? s.projected > s.budget + 0.5
                  ? <>No ritmo atual, o mês fecha em <b className="orange">{money0(s.projected)}</b>, {money0(s.projected - s.budget)} acima do planejado.</>
                  : <>No ritmo atual, o mês fecha em <b className="green">{money0(s.projected)}</b>, dentro do planejado.</>
                : 'Mês futuro: já conta as contas fixas e as parcelas que vão cair nele.'}
          </p>
        </section>
      ) : (
        <section className="card">
          <Empty>Defina quanto quer gastar por mês em cada categoria. O app mostra quanto já foi, quanto sobra por dia e avisa no Início ao passar de 80%.</Empty>
        </section>
      )}

      {rows.length > 0 && (
        <section className="card">
          <div className="card-head">
            <h2>Por categoria</h2>
            <span className="muted small">toque para ajustar</span>
          </div>
          <ul className="list">
            {rows.map((r) => {
              const c = categoryOf(r.categoryId);
              return (
                <li key={r.categoryId}>
                  <button type="button" className="row budget-row" onClick={() => setEdit(r.categoryId)}>
                    <CategoryBadge icon={c.icon} color={c.color} size={36} />
                    <div className="row-body">
                      <span className="spread">
                        <span className="row-title">{c.name}</span>
                        <span className="small tabular">
                          {money0(r.spent)} <span className="muted">/ {money0(r.budget)}</span>
                        </span>
                      </span>
                      <Progress pct={r.pct * 100} tone={r.tone} />
                      <span className={`row-meta ${r.tone === 'green' ? '' : r.tone}`}>{rowText(r)}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {without.length > 0 && (
        <section className="card">
          <div className="card-head">
            <h2>Sem orçamento</h2>
          </div>
          <ul className="list">
            {without.map((c) => {
              const a = categoryAverage(data, c.id, month, 3, today);
              return (
                <li key={c.id}>
                  <button type="button" className="row budget-row" onClick={() => setEdit(c.id)}>
                    <CategoryBadge icon={c.icon} color={c.color} size={36} />
                    <div className="row-body">
                      <span className="row-title">{c.name}</span>
                      <span className="row-meta">{a > 0 ? `Média dos últimos 3 meses: ${money0(a)}` : 'Sem gastos nos últimos meses'}</span>
                    </div>
                    <span className="btn small">Definir</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            className="btn soft block"
            style={{ marginTop: 12 }}
            onClick={() => {
              update(suggestBudgets(month, today));
              notify('Orçamentos sugeridos', 'Pela média dos últimos 3 meses. Ajuste quando quiser.');
            }}
          >
            <Icon name="bolt" size={18} /> <span className="green">Usar a média dos últimos 3 meses</span>
          </button>
        </section>
      )}
      <p className="muted small center">O orçamento vale para todos os meses. Contas fixas e parcelas contam inteiras; gastos avulsos entram no ritmo do mês.</p>
      {edit && <BudgetSheet categoryId={edit} month={month} onClose={() => setEdit(null)} />}
    </>
  );
}

function BudgetSheet({ categoryId, month, onClose }: { categoryId: string; month: string; onClose: () => void }) {
  const { data, update } = useStore();
  const c = useCategoryOf()(categoryId);
  const today = todayISO();
  const cur = data.budgets[categoryId] ?? 0;
  const [text, setText] = useState(cur ? cur.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '');
  const a = categoryAverage(data, categoryId, month, 3, today);
  const months = lastMonths(addMonths(month, -1), 4);
  const parse = (t: string) => Number(t.replace(/[^\d,]/g, '').replace(',', '.'));
  const save = (v: number | null) => {
    update(setBudget(categoryId, v));
    if (v) notify('Orçamento salvo', `${c.name}: ${money0(v)} por mês`);
    onClose();
  };
  return (
    <Sheet
      title={`Orçamento · ${c.name}`}
      onClose={onClose}
      footer={
        <div className="btn-row">
          {cur > 0 && (
            <button type="button" className="btn" onClick={() => save(null)}>
              Remover
            </button>
          )}
          <button type="button" className="btn primary" disabled={!(parse(text) > 0)} onClick={() => save(parse(text))}>
            Salvar
          </button>
        </div>
      }
    >
      <Field label="Limite por mês">
        <input className="input" inputMode="decimal" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex.: 800,00" autoFocus />
      </Field>
      {a > 0 && (
        <div className="chips">
          {[
            ['Média de 3 meses', a],
            ['Média − 10%', a * 0.9],
          ].map(([l, v]) => (
            <button key={l as string} type="button" className="chip-btn" onClick={() => setText(Math.round(v as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 }))}>
              {l}: {money0(v as number)}
            </button>
          ))}
        </div>
      )}
      <p className="muted small">Últimos meses: {months.map((m) => `${shortMonth(m)} ${money0(monthTotalOf(data, categoryId, m))}`).join(' · ')}.</p>
    </Sheet>
  );
}

function monthTotalOf(d: ReturnType<typeof useStore>['data'], categoryId: string, month: string) {
  return d.expenses.filter((e) => e.categoryId === categoryId && (e.cardId ? e.invoiceMonth : e.dueDate.slice(0, 7)) === month).reduce((a, e) => a + e.amount, 0);
}

export function Relatorios() {
  const { data } = useStore();
  const categoryOf = useCategoryOf();
  const today = todayISO();
  const [month, setMonth] = useState(monthKey(today));
  const r = monthReport(data, month, today);
  const months = lastMonths(month, 6);
  const totals = months.map((m) => monthTotal(data, m, today));
  const max = Math.max(1, ...totals);
  const prev = addMonths(month, -1);

  return (
    <>
      <PageHeader title="Relatórios" actions={<MonthNav label={formatMonth(month)} onPrev={() => setMonth(addMonths(month, -1))} onNext={() => setMonth(addMonths(month, 1))} onLabel={() => setMonth(monthKey(today))} />} />
      {r.total === 0 ? (
        <section className="card">
          <Empty>Nenhum gasto em {formatMonth(month).toLowerCase()}.</Empty>
        </section>
      ) : (
        <>
          <section className="card raised">
            <span className="muted small">
              Gastos de {formatMonth(month).split(' ')[0].toLowerCase()}
              {r.partial ? ' até agora' : ''}
            </span>
            <div className="big-line">
              <span className="big-value">{money0(r.total)}</span>
              {r.delta !== null && (
                <Pill tone={r.delta > 0.03 ? 'orange' : 'green'}>
                  <Icon name={r.delta > 0 ? 'trendUp' : 'trendDown'} size={12} /> {Math.abs(Math.round(r.delta * 100))}% {r.partial ? 'no ritmo, vs. ' : 'vs. '}
                  {shortMonth(prev)}
                </Pill>
              )}
            </div>
            <div className="stack-bar" role="img" aria-label="Divisão dos gastos por categoria">
              {r.rows.filter((x) => x.amount > 0).map((x) => (
                <i key={x.categoryId} style={{ flex: x.amount, background: categoryOf(x.categoryId).color }} title={categoryOf(x.categoryId).name} />
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Para onde foi</h2>
            </div>
            <ul className="list">
              {r.rows.map((x) => {
                const c = categoryOf(x.categoryId);
                const d = x.prev > 0 ? x.amount / x.prev - 1 : null;
                return (
                  <li key={x.categoryId} className="row">
                    <span className="dot" style={{ background: c.color }} />
                    <div className="row-body">
                      <span className="row-title">{c.name}</span>
                      <span className="row-meta">
                        {pct(x.share)} do mês
                        {d !== null && !r.partial ? ` · ${d >= 0 ? '+' : ''}${Math.round(d * 100)}% vs. ${shortMonth(prev)}` : ''}
                      </span>
                    </div>
                    <strong className="tabular">{money0(x.amount)}</strong>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}

      <section className="card">
        <div className="card-head">
          <h2>Últimos 6 meses</h2>
        </div>
        <div className="cols" role="img" aria-label="Total gasto por mês">
          {months.map((m, i) => (
            <button key={m} type="button" className={`col${m === month ? ' on' : ''}`} onClick={() => setMonth(m)} aria-label={`${formatMonth(m)}: ${money0(totals[i])}`}>
              <span>{totals[i] >= 1000 ? `${(totals[i] / 1000).toFixed(1).replace('.', ',')}k` : Math.round(totals[i])}</span>
              <i style={{ height: `${(totals[i] / max) * 100}%` }} />
              <small>{shortMonth(m)}</small>
            </button>
          ))}
        </div>
        {months[5] === monthKey(today) && <span className="muted small">O mês atual ainda está em andamento.</span>}
      </section>

      {(r.above || r.fixedPerYear > 0 || r.top) && r.total > 0 && (
        <section className="card">
          <div className="card-head">
            <h2>O que chama atenção</h2>
          </div>
          <ul className="list">
            {r.above && (
              <li className="row">
                <Icon name="trendUp" size={18} />
                <div className="row-body">
                  <span className="row-title">
                    {categoryOf(r.above.categoryId).name} {Math.round(r.above.delta * 100)}% acima da sua média
                  </span>
                  <span className="row-meta">{r.partial ? 'No ritmo deste mês, contra a média dos 3 meses anteriores.' : 'Contra a média dos 3 meses anteriores.'}</span>
                </div>
              </li>
            )}
            {r.fixedPerYear > 0 && (
              <li className="row">
                <Icon name="repeat" size={18} />
                <div className="row-body">
                  <span className="row-title">Contas fixas: {money0(r.fixedPerYear)} por ano</span>
                  <span className="row-meta">Somando as contas fixas ativas. Vale revisar assinaturas que você não usa.</span>
                </div>
              </li>
            )}
            {r.top && (
              <li className="row">
                <Icon name="pie" size={18} />
                <div className="row-body">
                  <span className="row-title">
                    {categoryOf(r.top.categoryId).name} é {pct(r.top.share)} dos gastos
                  </span>
                  <span className="row-meta">A maior parte do mês.</span>
                </div>
              </li>
            )}
          </ul>
        </section>
      )}
    </>
  );
}
