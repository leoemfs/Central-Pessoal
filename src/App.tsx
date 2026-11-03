import { useEffect, useState, type ComponentType } from 'react';
import { useStore } from './store';
import { go, useRoute, type Route } from './router';
import { Icon, Sheet, type IconName } from './ui';
import { NAV_GROUPS, SETTINGS_ITEM, type NavItem } from './nav';
import { SearchSheet } from './Search';
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

/** Menu agrupado: usado na barra lateral (computador) e no menu ☰ (celular). */
function NavMenu({ current, onNavigate }: { current: string; onNavigate?: () => void }) {
  const item = (it: NavItem) =>
    it.to ? (
      <a href={`#/${it.to}`} className={it.section === current ? 'active' : ''} aria-current={it.section === current ? 'page' : undefined} onClick={onNavigate}>
        <Icon name={it.icon} />
        <span>{it.label}</span>
      </a>
    ) : (
      <span className="soon" aria-disabled="true">
        <Icon name={it.icon} />
        <span>{it.label}</span>
        <em>em breve</em>
      </span>
    );
  return (
    <div className="nav-menu">
      {NAV_GROUPS.map((g) => (
        <div key={g.title} className="nav-section">
          <p className="nav-group">{g.title}</p>
          <ul>
            {g.items.map((it) => (
              <li key={it.label}>{item(it)}</li>
            ))}
          </ul>
        </div>
      ))}
      <div className="nav-section">
        <ul>
          <li>{item(SETTINGS_ITEM)}</li>
        </ul>
      </div>
    </div>
  );
}

export function App() {
  const { saveError } = useStore();
  const route = useRoute();
  const section = SECTIONS.find((s) => s.path === route.path) ?? SECTIONS[0];
  const View = section.view;
  const [quickOpen, setQuickOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState(false);
  const tabActive = TABS.includes(section.path) ? section.path : 'mais';
  const byPath = (p: string) => SECTIONS.find((s) => s.path === p)!;

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer]);

  useEffect(() => {
    document.title = section.path === 'inicio' ? 'Central Pessoal' : `${section.label} · Central Pessoal`;
  }, [section]);

  function fab() {
    if (section.fab === 'rapido') setQuickOpen(true);
    else if (section.fab) go(section.fab);
  }

  return (
    <div className="shell">
      <header className="topbar">
        <button type="button" className="icon-btn" onClick={() => setDrawer(true)} aria-label="Abrir menu">
          <Icon name="menu" />
        </button>
        <a className="topbar-title" href="#/inicio">
          Central Pessoal
        </a>
        <button type="button" className="icon-btn" onClick={() => setSearch(true)} aria-label="Buscar em tudo">
          <Icon name="search" />
        </button>
      </header>

      <nav className="sidebar" aria-label="Seções">
        <a className="brand" href="#/inicio">
          <img src="./icon.svg" alt="" width={30} height={30} />
          <span>Central Pessoal</span>
        </a>
        <button type="button" className="search sidebar-search" onClick={() => setSearch(true)}>
          <Icon name="search" size={18} /> <span>Buscar em tudo</span>
        </button>
        <NavMenu current={section.path} />
      </nav>

      {drawer && (
        <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setDrawer(false)}>
          <nav className="drawer" aria-label="Menu">
            <div className="drawer-head">
              <strong>Central Pessoal</strong>
              <button type="button" className="icon-btn" onClick={() => setDrawer(false)} aria-label="Fechar menu">
                <Icon name="x" />
              </button>
            </div>
            <NavMenu current={section.path} onNavigate={() => setDrawer(false)} />
          </nav>
        </div>
      )}
      {search && <SearchSheet onClose={() => setSearch(false)} />}

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
