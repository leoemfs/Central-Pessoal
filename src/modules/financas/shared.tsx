import type { ReactNode } from 'react';
import type { Category, CreditCard } from '../../types';
import { useStore } from '../../store';
import { billStatus, type Bill, type Invoice } from '../../finance';
import { todayISO } from '../../utils';
import { Icon, Pill } from '../../ui';

const NO_CATEGORY: Category = { id: '', name: 'Sem categoria', icon: 'tag', color: '#94a3b8' };

export function useCategoryOf() {
  const { data } = useStore();
  return (id: string): Category => data.categories.find((c) => c.id === id) ?? NO_CATEGORY;
}

export function CreditCardVisual({ name, color, mini, children }: { name: string; color: string; mini?: boolean; children?: ReactNode }) {
  return (
    <div className={`credit-card${mini ? ' mini' : ''}`} style={{ background: color }} aria-hidden={mini}>
      <div className="cc-top">
        <span className="chip" />
        {!mini && <Icon name="contactless" size={22} />}
      </div>
      {!mini && <div className="cc-name">{name || 'Meu cartão'}</div>}
      {!mini && (
        <div className="cc-bottom">
          <span>{children}</span>
          <span className="brand-dots">
            <span />
            <span />
          </span>
        </div>
      )}
    </div>
  );
}

export function BillStatusPill({ bill, today = todayISO() }: { bill: Pick<Bill, 'paidAt' | 'dueDate'>; today?: string }) {
  const s = billStatus(bill, today);
  if (s === 'pago') return <Pill tone="green">Pago</Pill>;
  if (s === 'vencida') return <Pill tone="red">Vencida</Pill>;
  if (s === 'hoje') return <Pill tone="orange">Vence hoje</Pill>;
  return <Pill tone="orange">Pendente</Pill>;
}

export function InvoiceStatusPill({ invoice, today = todayISO() }: { invoice: Invoice; today?: string }) {
  if (invoice.status === 'paga') return <Pill tone="green">Paga</Pill>;
  if (invoice.dueDate < today) return <Pill tone="red">Vencida</Pill>;
  if (invoice.status === 'fechada') return <Pill tone="orange">Fechada</Pill>;
  return <Pill tone="blue">Aberta</Pill>;
}

export function cardById(cards: CreditCard[], id: string | null): CreditCard | undefined {
  return id ? cards.find((c) => c.id === id) : undefined;
}
