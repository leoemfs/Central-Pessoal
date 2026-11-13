import { useEffect, useRef, useState, type ComponentType } from 'react';
import { ErrorBoundary } from './ErrorScreen';
import { useStore } from './store';
import type { Theme } from './types';
import { go, goReplace, navigate, useRoute, type Route } from './router';
import { Icon, Sheet, Toasts, useBackToClose, type IconName } from './ui';
import { formatLongDate, todayISO } from './utils';
import { NAV_GROUPS, SETTINGS_ITEM, type NavItem } from './nav';
import { SearchSheet } from './Search';
import { Dashboard } from './modules/Dashboard';
import { Financas } from './modules/financas/Financas';
import { Diario } from './modules/Diario';
import { Agenda } from './modules/Agenda';
import { Guardados, Mais } from './modules/Mais';
import { Habitos } from './modules/Habitos';
import { Notas } from './modules/Notas';
import { Ajustes } from './modules/Ajustes';
import { Revisao } from './modules/Revisao';
import { Jornada } from './modules/Jornada';
import { Voce } from './modules/Voce';
import { BarTutorial, SetupHost } from './modules/Montagem';
import { isHidden, moduleOf } from './setup';
import { Orcamento, Relatorios } from './modules/financas/Orcamento';
import { ComprasPage, Listas, PrecosPage } from './modules/Listas';
import { HistoricoPage, ProgressoPage } from './modules/Progresso';
import { ProximosPage } from './modules/Proximos';
import { HumorPage } from './modules/Humor';
import { Estudos } from './modules/estudos/Estudos';
import { CiclosPage } from './modules/estudos/Ciclos';
import { RoadmapsPage } from './modules/estudos/Roadmaps';
import { CarreiraPage, MetasPage, VagasPage } from './modules/Carreira';
import { useCardEditor } from './Cards';
import { activeIndex, barFor, barItems, crumb, favoriteItems, type BarItem } from './moduleBar';

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
  { path: 'financas', label: 'Finanças', icon: 'wallet', view: Financas, fab: 'financas/menu' },
  { path: 'diario', label: 'Diário', icon: 'journal', view: Diario, fab: 'diario/nova', title: 'Meu diário', search: 'diario/buscar' },
  { path: 'agenda', label: 'Agenda', icon: 'calendar', view: Agenda, fab: 'agenda/novo' },
  { path: 'mais', label: 'Mais', icon: 'grid', view: Mais },
  { path: 'guardados', label: 'Guardados', icon: 'archive', view: Guardados },
  { path: 'nucleo', label: 'Núcleo pessoal', icon: 'sprout', view: Habitos, fab: 'nucleo/novo' },
  { path: 'arquivo', label: 'Notas', icon: 'note', view: Notas, fab: 'arquivo/nova' },
  { path: 'ajustes', label: 'Configurações', icon: 'settings', view: Ajustes },
  { path: 'revisao', label: 'Revisão semanal', icon: 'calendarCheck', view: Revisao },
  { path: 'jornada', label: 'Jornada', icon: 'sword', view: Jornada },
  { path: 'voce', label: 'Você', icon: 'user', view: Voce },
  { path: 'orcamento', label: 'Orçamento', icon: 'gauge', view: Orcamento },
  { path: 'relatorios', label: 'Relatórios', icon: 'pie', view: Relatorios },
  { path: 'listas', label: 'Listas', icon: 'cart', view: Listas, fab: 'listas/menu' },
  { path: 'compras', label: 'Compras', icon: 'receipt', view: ComprasPage },
  { path: 'precos', label: 'Preços', icon: 'store', view: PrecosPage },
  { path: 'progresso', label: 'Progresso', icon: 'bars', view: ProgressoPage },
  { path: 'historico', label: 'Histórico', icon: 'clock', view: HistoricoPage },
  { path: 'proximos', label: 'Próximos', icon: 'list', view: ProximosPage },
  { path: 'humor', label: 'Humor', icon: 'smile', view: HumorPage },
  // O + de Estudos fica dentro do próprio módulo (muda conforme a tela: notebook, mapa…).
  { path: 'estudos', label: 'Estudos', icon: 'cap', view: Estudos },
  { path: 'ciclos', label: 'Ciclos', icon: 'repeat', view: CiclosPage },
  { path: 'roadmaps', label: 'Roadmaps', icon: 'route', view: RoadmapsPage },
  { path: 'carreira', label: 'Carreira', icon: 'briefcase', view: CarreiraPage, fab: 'carreira/menu' },
  { path: 'vagas', label: 'Vagas', icon: 'send', view: VagasPage, fab: 'vagas/nova' },
  { path: 'metas', label: 'Metas', icon: 'target', view: MetasPage, fab: 'carreira/menu' },
];

export const COMING_SOON: { label: string; icon: IconName; hint: string }[] = [
  { label: 'Saúde', icon: 'heartPulse', hint: 'Água, sono, remédios, consultas e peso' },
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

/** Um ícone da barra de baixo. Só o ícone; segurar o dedo mostra o nome. */
function TabLink({ to, label, icon, active, center, onTap }: { to: string; label: string; icon: string; active: boolean; center?: boolean; onTap?: () => void }) {
  const [tip, setTip] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const held = useRef(false);
  const start = () => {
    held.current = false;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      held.current = true;
      setTip(true);
    }, 420);
  };
  const end = () => {
    window.clearTimeout(timer.current);
    if (held.current) window.setTimeout(() => setTip(false), 900);
  };
  return (
    <a
      href={`#/${to}`}
      data-nav="switch"
      className={`tb${active ? ' active' : ''}${center ? ' center' : ''}`}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      onPointerDown={start}
      onPointerUp={end}
      onPointerLeave={end}
      onPointerCancel={end}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => {
        // Segurou para ver o nome: não navega.
        if (held.current) {
          e.preventDefault();
          held.current = false;
          return;
        }
        if (onTap) {
          e.preventDefault();
          onTap();
        }
      }}
    >
      <span className="tb-pill">
        <Icon name={icon as IconName} size={26} />
      </span>
      {tip && <span className="tb-tip">{label}</span>}
    </a>
  );
}

/** Menu agrupado: usado na barra lateral (computador) e no menu ☰ (celular). */
function NavMenu({ current, onNavigate }: { current: string; onNavigate?: () => void }) {
  const { data } = useStore();
  // Módulos guardados (desligados na montagem) não aparecem no menu; continuam no Mais.
  const groups = NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((it) => !it.to || !isHidden(data, it.to)) })).filter((g) => g.items.some((it) => it.to));
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
          navigate(it.to!, 'switch');
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
      {groups.map((g) => (
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
          <strong>CP Hub</strong>
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

/** Aplica o tema e a cor de destaque escolhidos em Configurações (e guarda uma cópia para abrir já com eles). */
function useTheme(theme: Theme, accent: string | null) {
  useEffect(() => {
    const root = document.documentElement;
    if (accent) root.dataset.accent = accent;
    else delete root.dataset.accent;
    try {
      if (accent) localStorage.setItem('central-pessoal:accent', accent);
      else localStorage.removeItem('central-pessoal:accent');
    } catch {
      /* ignora */
    }
  }, [accent]);
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
  useTheme(data.settings.theme, data.settings.accent);
  const route = useRoute();
  const section = SECTIONS.find((s) => s.path === route.path) ?? SECTIONS[0];
  const View = section.view;
  const [quickOpen, setQuickOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState(false);
  const scrollHidden = useHideOnScroll(`${section.path}:${route.n}`);
  const barHidden = data.settings.hideOnScroll && scrollHidden;
  const bar = barFor(section.path);
  const barIndex = bar ? activeIndex(bar, section.path) : null;
  const editor = useCardEditor();
  const where = bar ? crumb(bar, barIndex) : null;
  // Tocar de novo no módulo em que você já está mostra os favoritos, para trocar de módulo sem passar pelo Início.
  const [showFavs, setShowFavs] = useState(false);
  useEffect(() => setShowFavs(false), [route.path, route.n]);
  const placed = bar && !showFavs ? barItems(bar, data.settings.favorites, data.settings.barLayout) : null;
  const middle: BarItem[] = placed ? placed.items : favoriteItems(data.settings.favorites);

  /**
   * O que cada ícone faz ao ser tocado. O "voltar" sobe um nível (E20, navStack.ts): ferramenta → casa do módulo → Início.
   * Tocar de novo na casa mostra os favoritos (para trocar de módulo sem passar pelo Início).
   */
  function tapFor(it: BarItem, i: number): (() => void) | undefined {
    if (placed && bar) {
      const atHome = section.path === bar.items[1].section;
      if (i === placed.home) {
        if (atHome) return data.settings.tapToFavorites ? () => setShowFavs(true) : undefined;
        return () => navigate(it.to, 'switch'); // volta para a casa do módulo (sai da ferramenta)
      }
      if (!it.section) return () => goReplace(it.to); // atalho (ex.: Hoje)
      return () => navigate(it.to, 'switch'); // ferramenta: fica logo acima da casa do módulo
    }
    if (showFavs && bar) {
      if (it.to === section.path) return () => setShowFavs(false);
      return () => navigate(it.to, 'switch');
    }
    return undefined;
  }

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer]);

  useEffect(() => {
    document.title = section.path === 'inicio' ? 'CP Hub' : `${section.title ?? section.label} · CP Hub`;
  }, [section]);

  function fab() {
    if (section.fab === 'rapido') setQuickOpen(true);
    else if (section.fab) goReplace(section.fab);
  }

  return (
    <div className={`shell${barHidden ? ' bars-hidden' : ''}`}>
      <header className={`topbar${barHidden ? ' hidden' : ''}`}>
        <button type="button" className="icon-btn" onClick={() => setDrawer(true)} aria-label="Abrir menu">
          <Icon name="menu" />
        </button>
        <h1 className="topbar-title">
          {section.path === 'inicio' ? (
            formatLongDate(todayISO())
          ) : where?.page ? (
            <>
              <span className="crumb">{where.module} /</span> {where.page}
            </>
          ) : (
            (section.title ?? section.label)
          )}
        </h1>
        <button type="button" className="icon-btn" onClick={() => (section.search ? goReplace(section.search) : setSearch(true))} aria-label={section.search ? 'Buscar no diário' : moduleOf(section.path) ? `Buscar em ${where?.module ?? section.label}` : 'Buscar em tudo'}>
          <Icon name="search" />
        </button>
        {editor.screen && (
          <button type="button" className={`icon-btn${editor.editing ? ' on' : ''}`} onClick={editor.toggle} aria-label={editor.editing ? 'Terminar de personalizar' : 'Personalizar cartões'} aria-pressed={editor.editing}>
            <Icon name="edit" />
          </button>
        )}
      </header>

      <nav className="sidebar" aria-label="Seções">
        <a className="brand" href="#/inicio">
          <img src="./icon.svg" alt="" width={30} height={30} />
          <span>CP Hub</span>
        </a>
        <button type="button" className="search sidebar-search" onClick={() => setSearch(true)}>
          <Icon name="search" size={18} /> <span>Buscar em tudo</span>
        </button>
        <NavMenu current={section.path} />
      </nav>

      {drawer && <Drawer current={section.path} onClose={() => setDrawer(false)} />}
      {search && <SearchSheet onClose={() => setSearch(false)} scope={moduleOf(section.path)} />}

      <main className="main">
        {saveError && (
          <div className="alert red" role="alert">
            {saveError === 'reserva'
              ? 'Não deu para salvar no lugar de sempre. Suas mudanças estão numa cópia de reserva neste aparelho. Por garantia, exporte um backup em Configurações.'
              : 'Não foi possível salvar neste aparelho. Exporte um backup em Configurações agora.'}
          </div>
        )}
        <ErrorBoundary scope="tela" resetKey={`${section.path}:${route.n}`}>
          <View key={section.path} route={route} />
        </ErrorBoundary>
      </main>

      {section.fab && (
        <button type="button" className="fab" onClick={fab} aria-label="Adicionar">
          <Icon name="plus" size={26} />
        </button>
      )}

      <nav className={`tabbar${barHidden ? ' hidden' : ''}`} aria-label="Atalhos">
        <TabLink to="inicio" label="Início" icon="home" active={section.path === 'inicio'} />
        {middle.map((it, i) => (
          <TabLink
            key={`${placed ? bar!.id : 'fav'}-${it.id}`}
            to={it.to}
            label={it.label}
            icon={it.icon}
            center={!!placed && i === placed.home}
            active={placed ? it.section === section.path : section.path === it.id || (!!bar && bar.id === it.id)}
            onTap={tapFor(it, i)}
          />
        ))}
        {placed && (
          // E21: dentro de um módulo, a ponta é o atalho para trocar de módulo (mostra os favoritos).
          <button type="button" className="tb tb-favs" aria-label="Favoritos: trocar de módulo" onClick={() => setShowFavs(true)}>
            <span className="tb-pill">
              <Icon name="star" size={26} />
            </span>
          </button>
        )}
        {showFavs && <span className="tb-hint">Escolha o módulo</span>}
      </nav>

      <SetupHost />
      <BarTutorial path={section.path} nav={`${section.path}:${route.n}:${location.hash}`} showFavs={showFavs} />
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
