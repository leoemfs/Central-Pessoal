import { useState } from 'react';
import { useStore } from '../../store';
import { remove } from '../../actions';
import { adjustVoucherBalance, newVoucher, VOUCHER_COLORS, voucherStatus } from '../../vouchers';
import type { VoucherCard } from '../../types';
import { formatDMY, formatMoney, monthKey, todayISO } from '../../utils';
import { Empty, Field, Icon, MoneyInput, notify, Pill, Segmented, Sheet, Toggle } from '../../ui';
import { CreditCardVisual, useCategoryOf } from './shared';

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

/** Escolha do tipo no cadastro: crédito ou vale. */
export function CardTypeSwitch({ value, onChange }: { value: 'credito' | 'vale'; onChange: (v: 'credito' | 'vale') => void }) {
  return (
    <Segmented
      label="Tipo de cartão"
      value={value}
      onChange={onChange}
      options={[
        { value: 'credito', label: 'Crédito' },
        { value: 'vale', label: 'Vale (VR/VA)' },
      ]}
    />
  );
}

export function VoucherForm({ initial, onClose, onSaved, onType }: { initial?: VoucherCard; onClose: () => void; onSaved?: (v: VoucherCard) => void; onType?: (t: 'credito') => void }) {
  const { data, update } = useStore();
  const st = initial ? voucherStatus(data, initial) : null;
  const [name, setName] = useState(initial?.name ?? '');
  const [color, setColor] = useState(initial?.color ?? VOUCHER_COLORS[data.vouchers.length % VOUCHER_COLORS.length]);
  const [hasRecharge, setHasRecharge] = useState(initial ? initial.recharge !== null : true);
  const [amount, setAmount] = useState(Math.round((initial?.recharge?.amount ?? 0) * 100));
  const [day, setDay] = useState(initial?.recharge?.day ?? 1);
  const [balance, setBalance] = useState(Math.round((st?.balance ?? 0) * 100));
  const [error, setError] = useState('');

  function save() {
    const n = name.trim();
    if (!n) return setError('Dê um nome (ex.: VR Alelo, VA Pluxee).');
    if (hasRecharge && amount <= 0) return setError('Informe o valor da recarga, ou desligue a recarga mensal.');
    const recharge = hasRecharge ? { amount: amount / 100, day } : null;
    if (initial) {
      update((d) => {
        let next = { ...d, vouchers: d.vouchers.map((v) => (v.id === initial.id ? { ...v, name: n, color, recharge } : v)) };
        // Mudou o saldo: ajusta a partir de hoje.
        if (st && Math.round(st.balance * 100) !== balance) next = adjustVoucherBalance(initial.id, balance / 100)(next);
        return next;
      });
      onSaved?.({ ...initial, name: n, color, recharge });
    } else {
      const v = newVoucher({ name: n, color, recharge, balance: balance / 100 });
      update((d) => ({ ...d, vouchers: [...d.vouchers, v] }));
      notify('Vale cadastrado', `${n} · saldo ${formatMoney(balance / 100)}`);
      onSaved?.(v);
    }
    onClose();
  }

  return (
    <Sheet
      title={initial ? 'Editar vale' : 'Cadastrar cartão'}
      onClose={onClose}
      footer={
        <>
          {error && <p className="form-error">{error}</p>}
          <button type="button" className="btn primary block pill-shape" onClick={save}>
            <Icon name="check" /> Salvar vale
          </button>
        </>
      }
    >
      {!initial && onType && <CardTypeSwitch value="vale" onChange={(t) => t === 'credito' && onType('credito')} />}
      <div className="card-form-head">
        <CreditCardVisual name={name || 'Vale'} color={color} mini />
        <Field label="Nome do vale" hint="Ex.: VR Alelo, VA Pluxee, Caju, Ticket…">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do vale" autoFocus={!initial} />
        </Field>
      </div>
      <Field label={initial ? 'Saldo de hoje' : 'Saldo atual'} hint={initial ? 'Mude se o saldo no app do vale estiver diferente: o app ajusta a partir de hoje.' : 'O que tem no cartão agora (veja no app do vale).'}>
        <MoneyInput cents={balance} onChange={setBalance} label="Saldo do vale" large />
      </Field>
      <div className="toggle-row">
        <div>
          <strong>Recarga mensal</strong>
          <span className="muted small">No dia da recarga, o saldo sobe sozinho e entra como receita.</span>
        </div>
        <Toggle checked={hasRecharge} onChange={setHasRecharge} label="Recarga mensal" />
      </div>
      {hasRecharge && (
        <div className="form-row">
          <Field label="Valor da recarga">
            <MoneyInput cents={amount} onChange={setAmount} label="Valor da recarga" />
          </Field>
          <Field label="Dia em que cai">
            <select className="input" value={day} onChange={(e) => setDay(Number(e.target.value))}>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  Dia {d}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}
      <div className="field">
        <span className="field-label">Cor</span>
        <div className="swatches" role="radiogroup" aria-label="Cor do vale">
          {VOUCHER_COLORS.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={`Cor ${c}`} className={`swatch${color === c ? ' on' : ''}`} style={{ background: c }} onClick={() => setColor(c)}>
              {color === c && <Icon name="check" size={18} />}
            </button>
          ))}
        </div>
      </div>
      <div className="info-box">
        <Icon name="info" />
        <div>
          <strong>Como funciona?</strong>
          Ao lançar uma despesa, escolha "Vale (VR/VA)" como forma de pagamento: a compra já entra como paga e desconta do saldo. Não existe fatura.
        </div>
      </div>
    </Sheet>
  );
}

/** Cartão do vale na aba Cartões. */
export function VoucherTile({ v, onOpen }: { v: VoucherCard; onOpen: () => void }) {
  const { data } = useStore();
  const s = voucherStatus(data, v);
  return (
    <button type="button" className="card-tile" onClick={onOpen}>
      <CreditCardVisual name={v.name} color={v.color}>
        Vale{v.recharge ? ` · recarga dia ${v.recharge.day}` : ''}
      </CreditCardVisual>
      <div className="card-stats">
        <div>
          <span className="muted">Saldo</span>
          <strong className={s.balance < 0 ? 'red' : s.low ? 'orange' : 'green'}>{formatMoney(s.balance)}</strong>
        </div>
        <div>
          <span className="muted">Usado no mês</span>
          <strong>{formatMoney(s.usedThisMonth)}</strong>
        </div>
      </div>
      <div className="toggle-row">
        {s.low ? <Pill tone="orange">Saldo baixo</Pill> : <Pill tone="green">Vale</Pill>}
        <span className="muted small">
          {s.next ? `Recarga ${formatDMY(s.next)}${s.perDay !== null ? ` · uns ${formatMoney(s.perDay)}/dia até lá` : ''}` : 'Sem recarga automática'}
        </span>
      </div>
    </button>
  );
}

export function VoucherDetail({ id, onClose, onEdit }: { id: string; onClose: () => void; onEdit: (v: VoucherCard) => void }) {
  const { data, update } = useStore();
  const categoryOf = useCategoryOf();
  const v = data.vouchers.find((x) => x.id === id);
  if (!v) return null;
  const s = voucherStatus(data, v);
  const month = monthKey(todayISO());
  const moves = [
    ...data.expenses.filter((e) => e.voucherId === v.id).map((e) => ({ id: e.id, date: e.dueDate, text: e.description, sub: categoryOf(e.categoryId).name, amount: -e.amount })),
    ...data.incomes.filter((i) => i.voucherId === v.id).map((i) => ({ id: i.id, date: i.date, text: i.description, sub: 'Recarga', amount: i.amount })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30);
  function del() {
    if (!confirm(`Excluir o vale "${v!.name}"? As compras e recargas já lançadas continuam em Finanças.`)) return;
    update(remove('vouchers', v!.id));
    onClose();
  }
  return (
    <Sheet title={v.name} badge={<Pill tone={s.low ? 'orange' : 'green'}>{s.low ? 'Saldo baixo' : 'Vale'}</Pill>} onClose={onClose}>
      <div className="preview-box">
        <span className="muted small">Saldo</span>
        <strong className="big-value">{formatMoney(s.balance)}</strong>
        <span className="muted small" style={{ display: 'block' }}>
          {formatMoney(s.usedThisMonth)} usados em {new Date(`${month}-15T12:00:00`).toLocaleDateString('pt-BR', { month: 'long' })}
          {s.next ? ` · próxima recarga ${formatDMY(s.next)}${v.recharge ? ` (${formatMoney(v.recharge.amount)})` : ''}` : ''}
        </span>
        {s.perDay !== null && <span className="muted small" style={{ display: 'block' }}>Dá uns {formatMoney(s.perDay)} por dia até a recarga.</span>}
      </div>
      <div className="field">
        <span className="field-label">Movimentos</span>
        {moves.length === 0 ? (
          <Empty>Nada lançado ainda. Escolha "Vale (VR/VA)" ao lançar uma despesa.</Empty>
        ) : (
          <ul className="list">
            {moves.map((m) => (
              <li key={m.id} className="row">
                <div className="row-body">
                  <span className="row-title">{m.text}</span>
                  <span className="row-meta">
                    {formatDMY(m.date)} · {m.sub}
                  </span>
                </div>
                <strong className={`tabular ${m.amount > 0 ? 'green' : ''}`}>
                  {m.amount > 0 ? '+' : '−'}
                  {formatMoney(Math.abs(m.amount))}
                </strong>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="btn-row">
        <button type="button" className="btn" onClick={() => onEdit(v)}>
          <Icon name="edit" size={18} /> Editar e ajustar saldo
        </button>
        <button type="button" className="btn danger" onClick={del}>
          <Icon name="trash" size={18} /> Excluir
        </button>
      </div>
    </Sheet>
  );
}

/** Início: aviso de vale com saldo baixo. */
export function VoucherAlerts() {
  const { data } = useStore();
  const low = data.vouchers.map((v) => ({ v, s: voucherStatus(data, v) })).filter((x) => x.s.low);
  if (!low.length) return null;
  return (
    <section className="card">
      <div className="card-head">
        <h2>Vale com saldo baixo</h2>
        <a className="link" href="#/financas/cartoes">
          Cartões
        </a>
      </div>
      <ul className="list">
        {low.map(({ v, s }) => (
          <li key={v.id} className="row">
            <span className="dot" style={{ background: v.color }} />
            <div className="row-body">
              <span className="row-title">{v.name}</span>
              <span className="row-meta">{s.next ? `Recarga em ${formatDMY(s.next)}` : 'Sem recarga automática'}</span>
            </div>
            <strong className="tabular orange">{formatMoney(s.balance)}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
