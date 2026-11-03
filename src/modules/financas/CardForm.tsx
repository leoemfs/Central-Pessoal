import { useState } from 'react';
import { useStore } from '../../store';
import { CARD_COLORS } from '../../data';
import { invoiceDueDate } from '../../finance';
import type { CreditCard } from '../../types';
import { uid } from '../../utils';
import { Field, Icon, MoneyInput, Sheet } from '../../ui';
import { CreditCardVisual } from './shared';

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export function CardForm({ initial, onClose, onSaved }: { initial?: CreditCard; onClose: () => void; onSaved?: (c: CreditCard) => void }) {
  const { update } = useStore();
  const [name, setName] = useState(initial?.name ?? '');
  const [closingDay, setClosingDay] = useState(initial?.closingDay ?? 10);
  const [dueDay, setDueDay] = useState(initial?.dueDay ?? 17);
  const [limit, setLimit] = useState(Math.round((initial?.limit ?? 0) * 100));
  const [color, setColor] = useState(initial?.color ?? CARD_COLORS[0]);
  const [error, setError] = useState('');

  function save() {
    const n = name.trim();
    if (!n) return setError('Dê um nome para o cartão.');
    const card: CreditCard = {
      id: initial?.id ?? uid(),
      name: n,
      closingDay,
      dueDay,
      limit: limit > 0 ? limit / 100 : null,
      color,
      paidInvoices: initial?.paidInvoices ?? {},
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
    update((d) => {
      const exists = d.cards.some((c) => c.id === card.id);
      return {
        ...d,
        cards: exists ? d.cards.map((c) => (c.id === card.id ? card : c)) : [...d.cards, card],
        // Mudou o dia de vencimento: atualiza o vencimento das faturas já lançadas.
        expenses: exists ? d.expenses.map((e) => (e.cardId === card.id && e.invoiceMonth ? { ...e, dueDate: invoiceDueDate(card, e.invoiceMonth) } : e)) : d.expenses,
      };
    });
    onSaved?.(card);
    onClose();
  }

  return (
    <Sheet
      title={initial ? 'Editar cartão' : 'Cadastrar cartão de crédito'}
      onClose={onClose}
      footer={
        <button type="button" className="btn primary block pill-shape" onClick={save}>
          <Icon name="check" /> Salvar cartão
        </button>
      }
    >
      <div className="card-form-head">
        <CreditCardVisual name={name} color={color} mini />
        <Field label="Nome do cartão" hint="Ex.: PicPay, Santander, Renner…">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do cartão" autoFocus={!initial} />
        </Field>
      </div>
      <div className="form-row">
        <Field label="Dia de fechamento">
          <select className="input" value={closingDay} onChange={(e) => setClosingDay(Number(e.target.value))}>
            {DAYS.map((d) => (
              <option key={d} value={d}>
                Dia {d}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Dia de vencimento">
          <select className="input" value={dueDay} onChange={(e) => setDueDay(Number(e.target.value))}>
            {DAYS.map((d) => (
              <option key={d} value={d}>
                Dia {d}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Limite do cartão (opcional)">
        <MoneyInput cents={limit} onChange={setLimit} label="Limite do cartão" />
      </Field>
      <div className="field">
        <span className="field-label">Cor do cartão</span>
        <div className="color-preview">
          <div className="swatches" role="radiogroup" aria-label="Cor do cartão">
            {CARD_COLORS.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={`Cor ${c}`} className={`swatch${color === c ? ' on' : ''}`} style={{ background: c }} onClick={() => setColor(c)}>
                {color === c && <Icon name="check" size={18} />}
              </button>
            ))}
          </div>
          <CreditCardVisual name={name} color={color} />
        </div>
      </div>
      <div className="info-box">
        <Icon name="info" />
        <div>
          <strong>Como funciona?</strong>
          Ao lançar uma compra neste cartão, o app coloca ela na fatura certa pelas datas de fechamento e vencimento. Compras feitas no dia do fechamento ou depois entram na fatura seguinte.
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
    </Sheet>
  );
}
