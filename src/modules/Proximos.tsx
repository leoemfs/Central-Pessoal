import { useStore } from '../store';
import { upcoming, type UpcomingItem } from '../upcoming';
import { formatMoney, relativeDay, todayISO } from '../utils';
import { Empty, Icon, PageHeader, Pill, type IconName } from '../ui';

const KIND: Record<UpcomingItem['kind'], { label: string; icon: IconName; href: string }> = {
  evento: { label: 'Compromisso', icon: 'calendar', href: '#/agenda' },
  tarefa: { label: 'Tarefa', icon: 'tasks', href: '#/agenda/tarefas' },
  conta: { label: 'Conta', icon: 'wallet', href: '#/financas' },
};

function Row({ i }: { i: UpcomingItem }) {
  const k = KIND[i.kind];
  return (
    <li>
      <a className="row" href={k.href}>
        <span className="tile-icon">
          <Icon name={k.icon} size={18} />
        </span>
        <div className="row-body">
          <span className="row-title">{i.title}</span>
          <span className="row-meta">
            {k.label}
            {i.time ? ` · ${i.time}` : ''}
          </span>
        </div>
        {i.amount !== null && <strong className="tabular">{formatMoney(i.amount)}</strong>}
      </a>
    </li>
  );
}

/** Agenda › Próximos (barra de baixo): os próximos 30 dias numa lista só. */
export function ProximosPage() {
  const { data } = useStore();
  const u = upcoming(data, todayISO());
  return (
    <>
      <PageHeader title="Próximos" subtitle="Compromissos, tarefas e contas dos próximos 30 dias" />
      {u.overdue.length > 0 && (
        <section className="card">
          <div className="card-head">
            <h2>Atrasados</h2>
            <Pill tone="red">{u.overdue.length}</Pill>
          </div>
          <ul className="list">
            {u.overdue.map((i) => (
              <Row key={i.key} i={i} />
            ))}
          </ul>
        </section>
      )}
      {u.days.length === 0 && u.overdue.length === 0 ? (
        <section className="card">
          <Empty>Nada nos próximos 30 dias. Compromissos, tarefas com prazo e contas a pagar aparecem aqui, em ordem.</Empty>
        </section>
      ) : (
        u.days.map((d) => (
          <section key={d.day} className="card">
            <div className="card-head">
              <h2>{relativeDay(d.day)}</h2>
              <span className="muted small">{d.items.length}</span>
            </div>
            <ul className="list">
              {d.items.map((i) => (
                <Row key={i.key} i={i} />
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
