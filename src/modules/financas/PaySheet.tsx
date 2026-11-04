import { useState } from 'react';
import { formatMoney, todayISO } from '../../utils';
import { Field, Icon, MoneyInput, Sheet } from '../../ui';

/** Confirma um pagamento informando a data (e, se permitido, o valor realmente pago). */
export function PaySheet({ title, cents: initialCents, editableAmount, note, onConfirm, onClose }: { title: string; cents: number; editableAmount: boolean; note?: string; onConfirm: (date: string, cents: number) => void; onClose: () => void }) {
  const [date, setDate] = useState(todayISO());
  const [cents, setCents] = useState(initialCents);
  return (
    <Sheet
      title={title}
      onClose={onClose}
      footer={
        <button type="button" className="btn primary block" disabled={!date || cents <= 0} onClick={() => onConfirm(date, cents)}>
          <Icon name="check" /> Confirmar pagamento
        </button>
      }
    >
      <Field label="Data do pagamento" hint="Pode ser diferente do vencimento.">
        <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      {editableAmount ? (
        <Field label="Valor pago" hint={note}>
          <MoneyInput cents={cents} onChange={setCents} label="Valor pago" large />
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
