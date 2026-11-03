import { useEffect, useState, type ComponentType } from 'react';
import { useStore } from './store';
import { go, useRoute, type Route } from './router';
import { Icon, Sheet, type IconName } from './ui';
import { Dashboard } from './modules/Dashboard';
import { Financas } from './modules/financas/Financas';
import { Diario } from './modules/Diario';
import { Agenda } from './modules/Agenda';
import { Mais } from './modules/Mais';
import { Habitos } from './modules/Habitos';
import { Notas } from './modules/Notas';
import { Ajustes } from './modules/Ajustes';

export interface ViewProps {
  route: Route;
}

interface Section {
  path: string;
  label: string;
  icon: IconName;
  view: ComponentType<ViewProps>;
  /** Ação do botão "+" nesta tela. */
  fab?: string;
}

export const SECTIONS: Section[] = [
  { path: 'inicio', label: 'Início', icon: 'home', view: Dashboard, fab: 'rapido' },
  { path: 'financas', label: 'Finanças', icon: 'wallet', view: Financas, fab: 'financas/nova' },
  { path: 'diario', label: 'Diário', icon: 'journal', view: Diario, fab: 'diario/nova' },
  { path: 'agenda', label: 'Agenda', icon: 'calendar', view: Agenda, fab: 'rapido' },
  { path: 'mais', label: 'Mais', icon: 'grid', view: Mais },
  { path: 'nucleo', label: 'Núcleo pessoal', icon: 'target', view: Habitos },
  { path: 'arquivo', label: 'Arquivo geral', icon: 'archive', view: Notas, fab: 'arquivo/nova' },
  { path: 'ajustes', label: 'Ajustes', icon: 'sliders', view: Ajustes },
];

const TABS = ['inicio', 'financas', 'diario', 'agenda', 'mais'];
const SIDEBAR_MAIN = ['inicio', 'financas', 'diario', 'agenda'];
const SIDEBAR_MORE = ['nucleo', 'arquivo', 'ajustes'];
export const COMING_SOON: { label: string; icon: IconName; hint: string }[] = [
  { label: 'Estudos e trabalho', icon: 'briefcase', hint: 'Cursos, projetos e atividades' },
  { label: 'Objetivos', icon: 'flag', hint: 'Metas e acompanhamento' },
  { label: 'Foco', icon: 'timer', hint: 'Temporizador e sessões' },
  { label: 'Banco de ideias', icon: 'bulb', hint: 'Guarde ideias para depois' },
];

const QUICK: { to: string; label: string; icon: IconName; hint: string }[] = [
  { to: 'financas/nova', label: 'Despesa', icon: 'wallet', hint: 'Conta, compra ou parcela' },
  { to: 'diario/nova', label: 'Atualização no diário', icon: 'journal', hint: 'Acontecimento ou pensamento' },
  { to: 'agenda/nova-tarefa', label: 'Tarefa', icon: 'tasks', hint: 'Algo para fazer' },
  { to: 'agenda/novo-compromisso', label: 'Compromisso', icon: 'calendar', hint: 'Evento com data e hora' },
  { to: 'arquivo/nova', label: 'Anotação', icon: 'note', hint: 'Guardar uma informação' },
];

function NavLink({ s, active }: { s: Section; active: boolean }) {
  return (
    <a href={`#/${s.path}`} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>
      <Icon name={s.icon} />
      <span>{s.label}</span>
    </a>
  );
}

export function App() {
  const { saveError } = useStore();
  const route = useRoute();
  const section = SECTIONS.find((s) => s.path === route.path) ?? SECTIONS[0];
  const View = section.view;
  const [quickOpen, setQuickOpen] = useState(false);
  const tabActive = TABS.includes(section.path) ? section.path : 'mais';
  const byPath = (p: string) => SECTIONS.find((s) => s.path === p)!;

  useEffect(() => {
    document.title = section.path === 'inicio' ? 'Central Pessoal' : `${section.label} · Central Pessoal`;
  }, [section]);

  function fab() {
    if (section.fab === 'rapido') setQuickOpen(true);
    else if (section.fab) go(section.fab);
  }

  return (
    <div className="shell">
      <nav className="sidebar" aria-label="Seções">
        <a className="brand" href="#/inicio">
          <img src="./icon.svg" alt="" width={30} height={30} />
          <span>Central Pessoal</span>
        </a>
        <ul>
          {SIDEBAR_MAIN.map((p) => (
            <li key={p}>
              <NavLink s={byPath(p)} active={section.path === p} />
            </li>
          ))}
        </ul>
        <p className="nav-group">Mais</p>
        <ul>
          {SIDEBAR_MORE.map((p) => (
            <li key={p}>
              <NavLink s={byPath(p)} active={section.path === p} />
            </li>
          ))}
        </ul>
        <p className="nav-group">Em breve</p>
        <ul className="soon">
          {COMING_SOON.map((c) => (
            <li key={c.label}>
              <span>
                <Icon name={c.icon} />
                <span>{c.label}</span>
              </span>
            </li>
          ))}
        </ul>
      </nav>

      <main className="main">
        {saveError && (
          <div className="alert red" role="alert">
            Não foi possível salvar neste aparelho. Exporte um backup em Ajustes.
          </div>
        )}
        <View key={section.path} route={route} />
      </main>

      {section.fab && (
        <button type="button" className="fab" onClick={fab} aria-label="Adicionar">
          <Icon name="plus" size={26} />
        </button>
      )}

      <nav className="tabbar" aria-label="Atalhos">
        {TABS.map((p) => (
          <NavLink key={p} s={byPath(p)} active={tabActive === p} />
        ))}
      </nav>

      {quickOpen && (
        <Sheet title="Registrar" onClose={() => setQuickOpen(false)}>
          <div className="quick-list">
            {QUICK.map((q) => (
              <button
                key={q.to}
                type="button"
                className="tile"
                onClick={() => {
                  setQuickOpen(false);
                  go(q.to);
                }}
              >
                <span className="tile-icon">
                  <Icon name={q.icon} />
                </span>
                <span className="tile-text">
                  <strong>{q.label}</strong>
                  <span className="muted">{q.hint}</span>
                </span>
                <Icon name="right" size={18} />
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}
