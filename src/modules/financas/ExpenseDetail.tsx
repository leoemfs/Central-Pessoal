import { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { deleteExpense, KIND_LABEL, paidDate, payExpense, PAYMENT_LABEL, unpayExpense, type Scope } from '../../finance';
import { formatDMY, formatMoney, formatMonth, pad } from '../../utils';
import { Icon, Pill, Sheet } from '../../ui';
import { ExpenseForm } from './ExpenseForm';
import { PaySheet } from './PaySheet';
import { ScopeSheet } from './ScopeSheet';
import { BillStatusPill, cardById, useCategoryOf } from './shared';

export function ExpenseDetail({ id, onClose, onOpenInvoice }: { id: string; onClose: () => void; onOpenInvoice?: (cardId: string, month: string) => void }) {
  const { data, update } = useStore();
  const categoryOf = useCategoryOf();
  const [editing, setEditing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const e = data.expenses.find((x) => x.id === id);

  useEffect(() => {
    if (!e) onClose();
  }, [e, onClose]);
  if (!e) return null;

  const cat = categoryOf(e.categoryId);
  const card = cardById(data.cards, e.cardId);
  const paidAt = paidDate(e, data.cards);

  function remove(scope: Scope) {
    update((d) => deleteExpense(d, id, scope));
    setDeleting(false);
    onClose();
  }

  function askDelete() {
    if (e!.seriesId) return setDeleting(true);
    if (confirm(`Excluir "${e!.description}"?`)) remove('one');
  }

  return (
    <>
      <Sheet title="Detalhes da despesa" badge={<BillStatusPill bill={{ paidAt, dueDate: e.dueDate }} />} onClose={onClose}>
        <div>
          <h3 className="detail-title">{e.description}</h3>
          <p className="muted">{cat.name}</p>
        </div>
        <dl className="detail-rows">
          <div>
            <dt>Tipo</dt>
            <dd>{KIND_LABEL[e.kind]}</dd>
          </div>
          {e.kind === 'parcelada' && e.installment && e.installments && (
            <div>
              <dt>Parcela</dt>
              <dd>
                {pad(e.installment)} de {pad(e.installments)}
              </dd>
            </div>
          )}
          <div>
            <dt>Valor</dt>
            <dd>{formatMoney(e.amount)}</dd>
          </div>
          {card && e.purchaseDate && (
            <div>
              <dt>Data da compra</dt>
              <dd>{formatDMY(e.purchaseDate)}</dd>
            </div>
          )}
          <div>
            <dt>{card ? 'Vencimento da fatura' : 'Vencimento'}</dt>
            <dd>{formatDMY(e.dueDate)}</dd>
          </div>
          <div>
            <dt>Categoria</dt>
            <dd>{cat.name}</dd>
          </div>
          <div>
            <dt>Pago com</dt>
            <dd>{card ? card.name : PAYMENT_LABEL[e.method]}</dd>
          </div>
          <div>
            <dt>Situação</dt>
            <dd>{paidAt ? <Pill tone="green">Pago em {formatDMY(paidAt)}</Pill> : <Pill tone="orange">A pagar</Pill>}</dd>
          </div>
        </dl>

        {card && e.invoiceMonth ? (
          <button type="button" className="pay-cta" onClick={() => onOpenInvoice?.(card.id, e.invoiceMonth!)}>
            <Icon name="card" size={28} />
            <strong>Ver fatura de {formatMonth(e.invoiceMonth).toLowerCase()}</strong>
            <span className="muted small">Compras no cartão são pagas junto com a fatura.</span>
          </button>
        ) : paidAt ? (
          <button type="button" className="pay-cta" onClick={() => update((d) => unpayExpense(d, id))}>
            <Icon name="undo" size={28} />
            <strong>Desmarcar pagamento</strong>
            <span className="muted small">Volta para "a pagar" e atualiza os indicadores.</span>
          </button>
        ) : (
          <button type="button" className="pay-cta" onClick={() => setPaying(true)}>
            <Icon name="checkCircle" size={30} />
            <strong>Marcar como paga</strong>
            <span className="muted small">Atualiza automaticamente os indicadores financeiros.</span>
          </button>
        )}

        <div className="btn-row">
          <button type="button" className="btn" onClick={() => setEditing(true)}>
            <Icon name="edit" size={18} /> Editar
          </button>
          <button type="button" className="btn danger" onClick={askDelete}>
            <Icon name="trash" size={18} /> Excluir
          </button>
        </div>
      </Sheet>

      {editing && <ExpenseForm editing={e} onClose={() => setEditing(false)} />}
      {deleting && <ScopeSheet mode="delete" expense={e} onPick={remove} onClose={() => setDeleting(false)} />}
      {paying && (
        <PaySheet
          title="Marcar como paga"
          cents={Math.round(e.amount * 100)}
          editableAmount
          note={e.kind === 'fixa' ? 'Se o valor mudou (ex.: conta de luz), ele vira a previsão dos próximos meses.' : undefined}
          onClose={() => setPaying(false)}
          onConfirm={(date, cents) => {
            update((d) => payExpense(d, id, date, cents / 100));
            setPaying(false);
          }}
        />
      )}
    </>
  );
}
