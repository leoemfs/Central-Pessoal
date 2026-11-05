import { useState } from 'react';
import { useStore } from '../../store';
import {
  addExpense, editExpense, invoiceDueDate, invoiceMonthFor, KIND_LABEL, PAYMENT_LABEL, splitAmount,
  type ExpensePatch, type Scope,
} from '../../finance';
import type { Expense, ExpenseKind, PaymentMethod } from '../../types';
import { addMonths, dayOf, formatDMY, formatMoney, formatMonth, todayISO } from '../../utils';
import { CategoryBadge, Chips, Field, Icon, MoneyInput, Sheet, Toggle, type IconName } from '../../ui';
import { CategorySheet } from './CategorySheet';
import { CardForm } from './CardForm';
import { ScopeSheet } from './ScopeSheet';
import { useCategoryOf } from './shared';
import { voucherBalance } from '../../vouchers';

const KINDS: { value: ExpenseKind; icon: IconName; hint: string }[] = [
  { value: 'avulsa', icon: 'receipt', hint: 'Uma vez só' },
  { value: 'fixa', icon: 'repeat', hint: 'Todo mês, sem prazo' },
  { value: 'parcelada', icon: 'installments', hint: 'Com prazo definido' },
];

const METHODS: PaymentMethod[] = ['pix', 'debito', 'dinheiro', 'boleto', 'cartao', 'vale'];
/** Formas de pagamento em que normalmente a despesa já nasce paga. */
const PAID_ON_THE_SPOT: PaymentMethod[] = ['pix', 'debito', 'dinheiro'];

export function ExpenseForm({ editing, initialDate, onClose }: { editing?: Expense; initialDate?: string; onClose: () => void }) {
  const { data, update } = useStore();
  const categoryOf = useCategoryOf();
  const inSeries = Boolean(editing?.seriesId);

  const [cents, setCents] = useState(editing ? Math.round(editing.amount * 100) : 0);
  const [kind, setKind] = useState<ExpenseKind>(editing?.kind ?? 'avulsa');
  const [count, setCount] = useState(editing?.installments ?? 2);
  const [amountMode, setAmountMode] = useState<'parcela' | 'total'>('parcela');
  const [method, setMethod] = useState<PaymentMethod>(editing?.method ?? 'pix');
  const [cardId, setCardId] = useState<string | null>(editing?.cardId ?? data.cards[0]?.id ?? null);
  const [voucherId, setVoucherId] = useState<string | null>(editing?.voucherId ?? data.vouchers[0]?.id ?? null);
  const [voucherSheet, setVoucherSheet] = useState(false);
  const [date, setDate] = useState(editing ? (editing.purchaseDate ?? editing.dueDate) : (initialDate ?? todayISO()));
  const [description, setDescription] = useState(editing?.description ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(editing?.categoryId ?? null);
  const [paidNow, setPaidNow] = useState(true);
  const [catListOpen, setCatListOpen] = useState(false);
  const [catSheet, setCatSheet] = useState(false);
  const [cardSheet, setCardSheet] = useState(false);
  const [pendingPatch, setPendingPatch] = useState<ExpensePatch | null>(null);
  const [error, setError] = useState('');

  const isCard = method === 'cartao';
  const card = isCard ? data.cards.find((c) => c.id === cardId) : undefined;
  const isVoucher = method === 'vale';
  const voucher = isVoucher ? data.vouchers.find((v) => v.id === voucherId) : undefined;
  const lockMethod = inSeries; // em séries, forma de pagamento e cartão não mudam
  const lockDate = inSeries && Boolean(editing?.cardId);
  const value = cents / 100;
  const amounts = kind === 'parcelada' ? (amountMode === 'total' ? splitAmount(value, count) : Array<number>(count).fill(value)) : [value];

  const dateLabel = isCard || isVoucher ? 'Data da compra' : kind === 'parcelada' ? 'Vencimento da 1ª parcela' : kind === 'fixa' ? 'Primeiro vencimento' : 'Data de vencimento';

  let dateHint: string | undefined;
  if (card && date) {
    const inv = invoiceMonthFor(card, date);
    if (kind === 'parcelada' && !editing) {
      dateHint = `1ª parcela na fatura de ${formatMonth(inv).toLowerCase()} (vence ${formatDMY(invoiceDueDate(card, inv))}); última em ${formatMonth(addMonths(inv, count - 1)).toLowerCase()}.`;
    } else if (!inSeries) {
      dateHint = `Entra na fatura de ${formatMonth(inv).toLowerCase()} · vence ${formatDMY(invoiceDueDate(card, inv))}.`;
    }
  } else if (voucher) {
    const bal = voucherBalance(data, voucher) + (editing?.voucherId === voucher.id ? editing.amount : 0);
    dateHint = `Já entra como paga. Saldo do ${voucher.name}: ${formatMoney(bal)}${cents > 0 ? ` → ${formatMoney(bal - cents / 100)}` : ''}.`;
  } else if (kind === 'fixa' && date && !editing) {
    dateHint = `Repete todo dia ${dayOf(date)}, até você encerrar.`;
  } else if (kind === 'parcelada' && date && !editing) {
    dateHint = `As próximas vencem todo dia ${dayOf(date)}.`;
  }

  function pickMethod(m: PaymentMethod) {
    setMethod(m);
    setPaidNow(PAID_ON_THE_SPOT.includes(m));
    if (m === 'vale') {
      // No vale não há conta fixa nem parcela: é sempre uma compra avulsa, já paga.
      setKind('avulsa');
      if (!data.vouchers.length) setVoucherSheet(true);
    }
  }

  function validate(): boolean {
    if (cents <= 0) return fail('Informe o valor.');
    if (!date) return fail('Informe a data.');
    if (!description.trim()) return fail('Descreva a despesa.');
    if (!categoryId) return fail('Escolha uma categoria.');
    if (isCard && !card) return fail('Escolha o cartão.');
    if (isVoucher && !voucher) return fail('Escolha o vale (ou cadastre um).');
    if (kind === 'parcelada' && (count < 2 || count > 120)) return fail('A quantidade de parcelas deve ser entre 2 e 120.');
    setError('');
    return true;
  }
  function fail(msg: string) {
    setError(msg);
    return false;
  }

  function submit() {
    if (!validate()) return;
    if (!editing) {
      const today = todayISO();
      update((d) =>
        addExpense(d, {
          kind,
          description: description.trim(),
          categoryId: categoryId!,
          method,
          cardId: isCard ? cardId : null,
          date,
          amounts,
          paidAt: kind === 'avulsa' && !isCard && (paidNow || isVoucher) ? (date > today ? today : date) : null,
          voucherId: isVoucher ? voucherId : null,
        }),
      );
      return onClose();
    }
    const patch: ExpensePatch = { description: description.trim(), categoryId: categoryId!, amount: value, date, method, cardId: isCard ? cardId : null, voucherId: isVoucher ? voucherId : null };
    if (inSeries) return setPendingPatch(patch);
    update((d) => editExpense(d, editing.id, patch, 'one'));
    onClose();
  }

  function applyScope(scope: Scope) {
    if (!editing || !pendingPatch) return;
    update((d) => editExpense(d, editing.id, pendingPatch, scope));
    setPendingPatch(null);
    onClose();
  }

  const selectedCat = categoryId ? categoryOf(categoryId) : null;
  const amountLabel = kind === 'parcelada' ? (amountMode === 'total' ? 'Valor total da compra' : 'Valor de cada parcela') : 'Valor da despesa';

  return (
    <>
      <Sheet
        title={editing ? 'Editar despesa' : 'Nova despesa'}
        onClose={onClose}
        footer={
          <>
            {error && <p className="form-error">{error}</p>}
            <button type="button" className="btn primary block" onClick={submit}>
              {editing ? 'Salvar alterações' : 'Salvar despesa'}
            </button>
          </>
        }
      >
        {!editing ? (
          <div className="option-cards" role="radiogroup" aria-label="Tipo de despesa">
            {KINDS.map((k) => (
              <button
                key={k.value}
                type="button"
                role="radio"
                aria-checked={kind === k.value}
                className={`option-card${kind === k.value ? ' on' : ''}`}
                onClick={() => {
                  setKind(k.value);
                  if (k.value !== 'avulsa' && isVoucher) setMethod('pix');
                }}
              >
                <span className="opt-icon">
                  <Icon name={k.icon} />
                </span>
                <strong>{KIND_LABEL[k.value]}</strong>
                <span className="muted">{k.hint}</span>
              </button>
            ))}
          </div>
        ) : (
          kind !== 'avulsa' && (
            <p className="muted small">
              {KIND_LABEL[kind]}
              {editing.installment && editing.installments ? ` · parcela ${editing.installment} de ${editing.installments}` : ''}. Ao salvar, você escolhe se a alteração vale só para esta ou também para as outras.
            </p>
          )
        )}

        <Field label={amountLabel}>
          <MoneyInput cents={cents} onChange={setCents} label={amountLabel} large autoFocus={!editing} />
        </Field>

        {kind === 'parcelada' && !editing && (
          <div className="field">
            <span className="field-label">Quantidade de parcelas</span>
            <div className="toggle-row">
              <div className="stepper">
                <button type="button" aria-label="Menos uma parcela" onClick={() => setCount((c) => Math.max(2, c - 1))}>
                  −
                </button>
                <output aria-live="polite">{count} vezes</output>
                <button type="button" aria-label="Mais uma parcela" onClick={() => setCount((c) => Math.min(120, c + 1))}>
                  +
                </button>
              </div>
            </div>
            <Chips
              label="Valor informado"
              value={amountMode}
              onChange={setAmountMode}
              options={[
                { value: 'parcela', label: 'Informei a parcela' },
                { value: 'total', label: 'Informei o total' },
              ]}
            />
            {cents > 0 && (
              <div className="preview-box">
                <span className="muted small">Serão gerados {count} lançamentos</span>
                <strong>
                  {count}x de {formatMoney(amounts[0])}
                </strong>
                <span className="muted small">
                  Total {formatMoney(amounts.reduce((a, b) => a + b, 0))}
                  {amounts[count - 1] !== amounts[0] ? ` · última parcela ${formatMoney(amounts[count - 1])}` : ''}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="field">
          <span className="field-label">Pago com</span>
          {lockMethod ? (
            <p className="muted">
              {PAYMENT_LABEL[method]}
              {card ? ` · ${card.name}` : ''}
              {voucher ? ` · ${voucher.name}` : ''}
            </p>
          ) : (
            <Chips label="Forma de pagamento" value={method} onChange={pickMethod} options={METHODS.map((m) => ({ value: m, label: PAYMENT_LABEL[m] }))} />
          )}
        </div>

        {isCard && !lockMethod && (
          <div className="field">
            <span className="field-label">Cartão</span>
            <div className="chips">
              {data.cards.map((c) => (
                <button key={c.id} type="button" className={`chip-btn${cardId === c.id ? ' on' : ''}`} aria-pressed={cardId === c.id} onClick={() => setCardId(c.id)}>
                  <span className="dot" style={{ background: c.color }} /> {c.name}
                </button>
              ))}
              <button type="button" className="chip-btn" onClick={() => setCardSheet(true)}>
                <Icon name="plus" size={16} /> {data.cards.length ? 'Novo cartão' : 'Cadastrar cartão'}
              </button>
            </div>
          </div>
        )}

        {isVoucher && !lockMethod && (
          <div className="field">
            <span className="field-label">Vale</span>
            <div className="chips">
              {data.vouchers.map((v) => (
                <button key={v.id} type="button" className={`chip-btn${voucherId === v.id ? ' on' : ''}`} aria-pressed={voucherId === v.id} onClick={() => setVoucherId(v.id)}>
                  <span className="dot" style={{ background: v.color }} /> {v.name}
                </button>
              ))}
              <button type="button" className="chip-btn" onClick={() => setVoucherSheet(true)}>
                <Icon name="plus" size={16} /> {data.vouchers.length ? 'Novo vale' : 'Cadastrar vale'}
              </button>
            </div>
          </div>
        )}

        <Field label={dateLabel} hint={lockDate ? 'Compras no cartão mantêm a fatura original.' : dateHint}>
          <input type="date" className="input" value={date} disabled={lockDate} onChange={(e) => setDate(e.target.value)} />
        </Field>

        <Field label="Descrição">
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Parcela da moto, internet…" />
        </Field>

        <div className="field">
          <span className="field-label">Categoria</span>
          <div className="select-list">
            <button type="button" className="select-trigger" aria-expanded={catListOpen} onClick={() => setCatListOpen((o) => !o)}>
              {selectedCat ? <CategoryBadge icon={selectedCat.icon} color={selectedCat.color} size={30} /> : null}
              <span className={`grow${selectedCat ? '' : ' muted'}`}>{selectedCat ? selectedCat.name : 'Selecione uma categoria'}</span>
              <Icon name={catListOpen ? 'up' : 'down'} size={18} />
            </button>
            {catListOpen && (
              <>
                {data.categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={c.id === categoryId ? 'on' : ''}
                    onClick={() => {
                      setCategoryId(c.id);
                      setCatListOpen(false);
                    }}
                  >
                    <CategoryBadge icon={c.icon} color={c.color} size={30} />
                    <span>{c.name}</span>
                  </button>
                ))}
                <button type="button" className="add" onClick={() => setCatSheet(true)}>
                  <Icon name="plusCircle" /> Cadastrar nova categoria
                </button>
              </>
            )}
          </div>
        </div>

        {kind === 'avulsa' && !isCard && !isVoucher && !editing && (
          <div className="toggle-row">
            <div>
              <strong>Já está paga</strong>
              <span className="muted small">{paidNow ? 'Entra como paga.' : 'Fica pendente até você marcar como paga.'}</span>
            </div>
            <Toggle checked={paidNow} onChange={setPaidNow} label="Já está paga" />
          </div>
        )}
      </Sheet>

      {catSheet && (
        <CategorySheet
          onClose={() => setCatSheet(false)}
          onSaved={(c) => {
            setCategoryId(c.id);
            setCatListOpen(false);
          }}
        />
      )}
      {cardSheet && <CardForm onClose={() => setCardSheet(false)} onSaved={(c) => setCardId(c.id)} />}
      {voucherSheet && <CardForm startAs="vale" onClose={() => setVoucherSheet(false)} onSavedVoucher={(v) => setVoucherId(v.id)} />}
      {pendingPatch && editing && <ScopeSheet mode="edit" expense={editing} onPick={applyScope} onClose={() => setPendingPatch(null)} />}
    </>
  );
}
