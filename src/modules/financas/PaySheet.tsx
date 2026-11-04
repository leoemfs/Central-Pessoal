import { useState } from 'react';
import { formatMoney, todayISO } from '../../utils';
import { Field, Icon, MoneyInput, Sheet } from '../../ui';

/** Confirma um pagamento informando a data (e, se permitido, o valor realmente pago). */
export function PaySheet({ title, cents: initialCents, editableAmount, note, onConfirm, onClose, confirmLabel = 'Confirmar pagamento', dateLabel = 'Data do pagamento', amountLabel = 'Valor pago' }: { title: string; cents: number; editableAmount: boolean; note?: string; onConfirm: (date: string, cents: number) => void; onClose: () => void; confirmLabel?: string; dateLabel?: string; amountLabel?: string }) {
  const [date, setDate] = useState(todayISO());
  const [cents, setCents] = useState(initialCents);
  return (
    <Sheet
      title={title}
      onClose={onClose}
      footer={
        <button type="button" className="btn primary block" disabled={!date || cents <= 0} onClick={() => onConfirm(date, cents)}>
          <Icon name="check" /> {confirmLabel}
        </button>
      }
    >
      <Field label={dateLabel} hint="Pode ser diferente da data prevista.">
        <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      {editableAmount ? (
        <Field label={amountLabel} hint={note}>
          <MoneyInput cents={cents} onChange={setCents} label={amountLabel} large />
        </Field>
      ) : (
        <div className="preview-box">
          <span className="muted small">Valor</span>
          <strong>{formatMoney(cents / 100)}</strong>
        </div>
      )}
    </Sheet>
  );
}
