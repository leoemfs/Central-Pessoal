import type { Expense } from '../../types';
import { installmentLabel, type Scope } from '../../finance';
import { formatMonth, monthKey, pad } from '../../utils';
import { Sheet } from '../../ui';

/** Pergunta o alcance de uma edição/exclusão em despesa de série. */
export function ScopeSheet({ mode, expense, onPick, onClose }: { mode: 'edit' | 'delete'; expense: Expense; onPick: (s: Scope) => void; onClose: () => void }) {
  const verb = mode === 'edit' ? 'Altera' : 'Exclui';
  const parcel = installmentLabel(expense);
  const month = formatMonth(monthKey(expense.invoiceMonth ? `${expense.invoiceMonth}-01` : expense.dueDate)).toLowerCase();
  const last = expense.installments ? `${pad(expense.installments)}/${pad(expense.installments)}` : '';

  const options: { scope: Scope; title: string; desc: string }[] =
    expense.kind === 'parcelada'
      ? [
          { scope: 'one', title: 'Somente esta parcela', desc: `${verb} exclusivamente a parcela ${parcel}.` },
          { scope: 'next', title: 'Esta e as próximas', desc: `${verb} da parcela ${parcel} até a ${last}.` },
          {
            scope: 'all',
            title: 'Todas as parcelas',
            desc: mode === 'edit' ? 'Altera a série completa. Valores de parcelas já pagas são preservados.' : 'Exclui a compra inteira, inclusive parcelas anteriores.',
          },
        ]
      : [
          { scope: 'one', title: 'Somente este mês', desc: `${verb} apenas a conta de ${month}.` },
          {
            scope: 'next',
            title: 'Este e os próximos meses',
            desc: mode === 'edit' ? `Altera a partir de ${month}.` : `Encerra a conta fixa a partir de ${month}.`,
          },
          {
            scope: 'all',
            title: 'Todos os meses',
            desc: mode === 'edit' ? 'Altera todos os meses. Valores já pagos são preservados.' : 'Exclui a conta fixa e todo o histórico dela.',
          },
        ];

  return (
    <Sheet title={mode === 'edit' ? 'O que deseja alterar?' : 'O que deseja excluir?'} onClose={onClose}>
      <p className="muted">{parcel ? `Parcela ${parcel} · ${expense.description}` : `${expense.description} · ${month}`}</p>
      <div className="scope-options">
        {options.map((o) => (
          <button key={o.scope} type="button" onClick={() => onPick(o.scope)}>
            <strong className={mode === 'delete' && o.scope === 'all' ? 'red' : undefined}>{o.title}</strong>
            <span className="muted small">{o.desc}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
