import { useEffect, useState, type ComponentType } from 'react';
import { useStore } from './store';
import type { Theme } from './types';
import { go, goReplace, useRoute, type Route } from './router';
import { Icon, Sheet, Toasts, useBackToClose, type IconName } from './ui';
import { formatLongDate, todayISO } from './utils';
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
import { Revisao } from './modules/Revisao';
import { Jornada } from './modules/Jornada';
import { FirstRun, Voce } from './modules/Voce';

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
  /** Título na barra superior (padrão: label). */
  title?: string;
  /** Ação da lupa na barra superior (padrão: busca em tudo). */
  search?: string;
}

export const SECTIONS: Section[] = [
  { path: 'inicio', label: 'Início', icon: 'home', view: Dashboard, fab: 'rapido' },
  { path: 'financas', label: 'Finanças', icon: 'wallet', view: Financas, fab: 'financas/nova' },
  { path: 'diario', label: 'Diário', icon: 'journal', view: Diario, fab: 'diario/nova', title: 'Meu diário', search: 'diario/buscar' },
  { path: 'agenda', label: 'Agenda', icon: 'calendar', view: Agenda, fab: 'agenda/novo' },
  { path: 'mais', label: 'Mais', icon: 'grid', view: Mais },
  { path: 'nucleo', label: 'Núcleo pessoal', icon: 'target', view: Habitos, fab: 'nucleo/novo' },
  { path: 'arquivo', label: 'Notas', icon: 'note', view: Notas, fab: 'arquivo/nova' },
  { path: 'ajustes', label: 'Configurações', icon: 'settings', view: Ajustes },
  { path: 'revisao', label: 'Revisão semanal', icon: 'calendarCheck', view: Revisao },
  { path: 'jornada', label: 'Jornada', icon: 'sword', view: Jornada },
  { path: 'voce', label: 'Você', icon: 'smile', view: Voce },
];

const TABS = ['inicio', 'financas', 'diario', 'agenda', 'mais'];
export const COMING_SOON: { label: string; icon: IconName; hint: string }[] = [
  { label: 'Saúde', icon: 'heartPulse', hint: 'Água, sono, remédios, consultas e peso' },
  { label: 'Estudos e trabalho', icon: 'briefcase', hint: 'Cursos, projetos e atividades' },
  { label: 'Objetivos', icon: 'flag', hint: 'Metas e acompanhamento' },
  { label: 'Foco', icon: 'timer', hint: 'Temporizador e sessões' },
  { label: 'Banco de ideias', icon: 'bulb', hint: 'Guarde ideias para depois' },
];

const QUICK: { to: string; label: string; icon: IconName; hint: string }[] = [
  { to: 'financas/nova', label: 'Despesa', icon: 'wallet', hint: 'Conta, compra ou parcela' },
  { to: 'financas/nova-receita', label: 'Receita', icon: 'coins', hint: 'Salário, freelance, bônus…' },
  { to: 'diario/nova', label: 'Atualização no diário', icon: 'journal', hint: 'Acontecimento ou pensamento' },
  { to: 'agenda/nova-tarefa', label: 'Tarefa', icon: 'tasks', hint: 'Algo para fazer' },
  { to: 'agenda/novo-compromisso', label: 'Compromisso', icon: 'calendar', hint: 'Evento com data e hora' },
  { to: 'arquivo/nova', label: 'Nota', icon: 'note', hint: 'Guardar uma informação' },
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
      <a
        href={`#/${it.to}`}
        className={it.section === current ? 'active' : ''}
        aria-current={it.section === current ? 'page' : undefined}
        onClick={(e) => {
          if (!onNavigate) return;
          // Navega antes de fechar o menu, para o "voltar" não desfazer a navegação.
          e.preventDefault();
          go(it.to!);
          onNavigate();
        }}
      >
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

function Drawer({ current, onClose }: { current: string; onClose: () => void }) {
  useBackToClose(onClose);
  return (
    <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <nav className="drawer" aria-label="Menu">
        <div className="drawer-head">
          <strong>Central Pessoal</strong>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar menu">
            <Icon name="x" />
          </button>
        </div>
        <NavMenu current={current} onNavigate={onClose} />
      </nav>
    </div>
  );
}

/** Barra superior que some ao rolar para baixo e volta ao rolar para cima. */
function useHideOnScroll(resetKey: string): boolean {
  const [hidden, setHidden] = useState(false);
  useEffect(() => setHidden(false), [resetKey]);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - last;
      if (y < 64) setHidden(false);
      else if (delta > 8) setHidden(true);
      else if (delta < -8) setHidden(false);
      if (Math.abs(delta) > 8) last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return hidden;
}

const THEME_COLOR = { dark: '#000000', light: '#f4f5f7' };

/** Aplica o tema escolhido em Ajustes (e guarda uma cópia para abrir já no tema certo). */
function useTheme(theme: Theme) {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    try {
      localStorage.setItem('central-pessoal:theme', theme);
    } catch {
      /* ignora */
    }
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const paint = () => {
      const effective = theme === 'system' ? (media.matches ? 'light' : 'dark') : theme;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[effective]);
    };
    paint();
    media.addEventListener('change', paint);
    return () => media.removeEventListener('change', paint);
  }, [theme]);
}

export function App() {
  const { data, saveError } = useStore();
  useTheme(data.settings.theme);
  const route = useRoute();
  const section = SECTIONS.find((s) => s.path === route.path) ?? SECTIONS[0];
  const View = section.view;
  const [quickOpen, setQuickOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState(false);
  const barHidden = useHideOnScroll(`${section.path}:${route.n}`);
  const tabActive = TABS.includes(section.path) ? section.path : 'mais';
  const byPath = (p: string) => SECTIONS.find((s) => s.path === p)!;

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer]);

  useEffect(() => {
    document.title = section.path === 'inicio' ? 'Central Pessoal' : `${section.title ?? section.label} · Central Pessoal`;
  }, [section]);

  function fab() {
    if (section.fab === 'rapido') setQuickOpen(true);
    else if (section.fab) goReplace(section.fab);
  }

  return (
    <div className="shell">
      <header className={`topbar${barHidden ? ' hidden' : ''}`}>
        <button type="button" className="icon-btn" onClick={() => setDrawer(true)} aria-label="Abrir menu">
          <Icon name="menu" />
        </button>
        <h1 className="topbar-title">{section.path === 'inicio' ? formatLongDate(todayISO()) : (section.title ?? section.label)}</h1>
        <button type="button" className="icon-btn" onClick={() => (section.search ? goReplace(section.search) : setSearch(true))} aria-label={section.search ? 'Buscar no diário' : 'Buscar em tudo'}>
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

      {drawer && <Drawer current={section.path} onClose={() => setDrawer(false)} />}
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

      <nav className={`tabbar${barHidden ? ' hidden' : ''}`} aria-label="Atalhos">
        {TABS.map((p) => (
          <NavLink key={p} s={byPath(p)} active={tabActive === p} />
        ))}
      </nav>

      <FirstRun />
      <Toasts />

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
