import { useStore } from '../store';
import { toggleRemind, upcoming, type UpcomingItem } from '../upcoming';
import { formatMoney, relativeDay, todayISO } from '../utils';
import { Empty, Icon, notify, PageHeader, Pill, type IconName } from '../ui';

const KIND: Record<UpcomingItem['kind'], { label: string; icon: IconName; href: string }> = {
  evento: { label: 'Compromisso', icon: 'calendar', href: '#/agenda' },
  tarefa: { label: 'Tarefa', icon: 'tasks', href: '#/tarefas' },
  conta: { label: 'Conta', icon: 'wallet', href: '#/financas' },
};

function Row({ i }: { i: UpcomingItem }) {
  const { update } = useStore();
  const k = KIND[i.kind];
  function bell() {
    if (i.kind === 'conta') {
      notify('Aviso das contas', 'As contas avisam todas juntas, pela opção do Google Agenda em Configurações.');
      return;
    }
    let ok = true;
    update((d) => {
      const next = toggleRemind(d, i);
      if (!next) ok = false;
      return next ?? d;
    });
    if (ok) notify(i.remind ? 'Lembrete desligado' : '🔔 Lembrete ligado', i.remind ? i.title : `${i.title}: o aviso vai para o Google Agenda.`);
  }
  return (
    <li>
      <div className="row">
        <a className="row-link" href={k.href}>
          {/* Cor do módulo de onde veio (conta = Finanças, reunião = Carreira…). */}
          <span className="tile-icon" data-mod={i.module}>
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
        <button type="button" className={`bell-btn${i.remind ? ' on' : ''}`} aria-pressed={i.remind} aria-label={i.remind ? `Desligar lembrete de "${i.title}"` : `Me lembrar de "${i.title}"`} onClick={bell}>
          <Icon name="bell" size={20} />
        </button>
      </div>
    </li>
  );
}

/** Agenda › Próximos (barra de baixo): os próximos 30 dias numa lista só. */
export function ProximosPage() {
  const { data } = useStore();
  const u = upcoming(data, todayISO());
  return (
    <>
      <PageHeader title="Próximos" subtitle="Próximos 30 dias. Toque no 🔔 para ligar ou desligar o aviso." />
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
