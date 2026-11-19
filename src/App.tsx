import { useEffect, useRef, useState, type ComponentType } from 'react';
import { ErrorBoundary } from './ErrorScreen';
import { useStore } from './store';
import type { Theme } from './types';
import { canGoBack, getTrail, go, goReplace, navigate, useRoute, type Route } from './router';
import { buildCrumbs } from './crumbs';
import { buildMenu, MENU_EDIT, MENU_SEARCH } from './menuItems';
import { PageMenuButton, useCurrentPageMenu } from './PageMenu';
import { useDesktop } from './wide';
import { useCurrentPageCrumbs, useCurrentPageParent, useCurrentPageTitle } from './pageTitle';
import { Icon, Sheet, Toasts, type IconName } from './ui';
import { formatLongDate, todayISO } from './utils';
import { NAV_GROUPS, SETTINGS_ITEM, type NavItem } from './nav';
import { SearchSheet } from './Search';
import { Dashboard } from './modules/Dashboard';
import { Financas } from './modules/financas/Financas';
import { Diario } from './modules/Diario';
import { Agenda } from './modules/Agenda';
import { Guardados, keptCount } from './modules/Mais';
import { AjudaPage } from './modules/Ajuda';
import { Habitos } from './modules/Habitos';
import { ArquivadosPage, IdeiasPage, NotasPage } from './modules/Notas';
import { Ajustes } from './modules/Ajustes';
import { Revisao } from './modules/Revisao';
import { Jornada } from './modules/Jornada';
import { Voce } from './modules/Voce';
import { BarTutorial, SetupHost } from './modules/Montagem';
import { isHidden, moduleOf } from './setup';
import { GOOGLE_CLIENT_ID, useCloud } from './cloud';
import { Orcamento, Relatorios } from './modules/financas/Orcamento';
import { ComprasPage, Listas, PrecosPage } from './modules/Listas';
import { HistoricoPage, ProgressoPage } from './modules/Progresso';
import { ProximosPage } from './modules/Proximos';
import { TarefasPage } from './modules/Tarefas';
import { HumorPage } from './modules/Humor';
import { Estudos } from './modules/estudos/Estudos';
import { CiclosPage } from './modules/estudos/Ciclos';
import { RoadmapsPage } from './modules/estudos/Roadmaps';
import { CarreiraPage, VagasPage } from './modules/Carreira';
import { SaudeHistorico, SaudeHoje, SaudePage } from './modules/Saude';
import { ConcluidosPage, GrandesPage, ObjetivosPage } from './modules/Objetivos';
import { useCardEditor } from './Cards';
import { barDrag, openMenu, PullToMais } from './BarPull';
import { settingsPage } from './settingsPages';
import { activeIndex, barFor, barItems, crumb, favoriteItems, type BarItem } from './moduleBar';
import { GameBarItems } from './modules/JornadaBar';
import { SideCards } from './SideCards';
import { gameBarOn, journeyTab } from './jornada/tabs';
import { welcomed } from './jornada/rules';

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
  { path: 'guardados', label: 'Guardados', icon: 'archive', view: Guardados },
  { path: 'ajuda', label: 'Como usar o app', icon: 'info', view: AjudaPage },
  { path: 'nucleo', label: 'Núcleo pessoal', icon: 'sprout', view: Habitos, fab: 'nucleo/novo' },
  { path: 'arquivo', label: 'Notas', icon: 'note', view: NotasPage, fab: 'arquivo/menu' },
  { path: 'ideias', label: 'Ideias', icon: 'bulb', view: IdeiasPage, fab: 'ideias/menu' },
  { path: 'notasarq', label: 'Arquivados', icon: 'archive', view: ArquivadosPage, fab: 'notasarq/menu' },
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
  { path: 'historico', label: 'Práticas', icon: 'clock', view: HistoricoPage },
  { path: 'tarefas', label: 'Tarefas', icon: 'tasks', view: TarefasPage, fab: 'tarefas/nova' },
  { path: 'proximos', label: 'Próximos', icon: 'list', view: ProximosPage },
  { path: 'humor', label: 'Humor', icon: 'smile', view: HumorPage },
  // O + de Estudos fica dentro do próprio módulo (muda conforme a tela: notebook, mapa…).
  { path: 'estudos', label: 'Estudos', icon: 'cap', view: Estudos },
  { path: 'ciclos', label: 'Ciclos', icon: 'repeat', view: CiclosPage },
  { path: 'roadmaps', label: 'Roadmaps', icon: 'route', view: RoadmapsPage },
  { path: 'carreira', label: 'Carreira', icon: 'briefcase', view: CarreiraPage, fab: 'carreira/menu' },
  { path: 'vagas', label: 'Vagas', icon: 'send', view: VagasPage, fab: 'vagas/nova' },
  { path: 'objetivos', label: 'Objetivos', icon: 'flag', view: ObjetivosPage, fab: 'objetivos/menu' },
  { path: 'grandes', label: 'Grandes', icon: 'target', view: GrandesPage, fab: 'objetivos/menu' },
  { path: 'concluidos', label: 'Concluídos', icon: 'check', view: ConcluidosPage, fab: 'objetivos/menu' },
  // Saúde: o + cria (sono ou plano de dieta); água e refeições marcam com um toque nos cartões.
  { path: 'saude', label: 'Saúde', icon: 'heartPulse', view: SaudePage, fab: 'saude/menu' },
  { path: 'saudehoje', label: 'Rotina', icon: 'sun', view: SaudeHoje, fab: 'saudehoje/menu' },
  { path: 'saudehist', label: 'Histórico', icon: 'clock', view: SaudeHistorico, fab: 'saudehist/menu' },
];

const QUICK: { to: string; label: string; icon: IconName; hint: string }[] = [
  { to: 'financas/nova', label: 'Despesa', icon: 'wallet', hint: 'Conta, compra ou parcela' },
  { to: 'financas/nova-receita', label: 'Receita', icon: 'coins', hint: 'Salário, freelance, bônus…' },
  { to: 'diario/nova', label: 'Atualização no diário', icon: 'journal', hint: 'Acontecimento ou pensamento' },
  { to: 'tarefas/nova', label: 'Tarefa', icon: 'tasks', hint: 'Algo para fazer' },
  { to: 'agenda/novo-compromisso', label: 'Compromisso', icon: 'calendar', hint: 'Evento com data e hora' },
  { to: 'arquivo/nova', label: 'Nota', icon: 'note', hint: 'Guardar uma informação' },
];

/** Um ícone da barra de baixo. Só o ícone; segurar o dedo mostra o nome. */
function TabLink({ to, label, icon, active, center, onTap, mod }: { to: string; label: string; icon: string; active: boolean; center?: boolean; onTap?: () => void; mod?: string }) {
  const [tip, setTip] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const held = useRef(false);
  const start = () => {
    held.current = false;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (barDrag.active) return; // está puxando a barra para cima, não segurando o ícone
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
      <span className="tb-pill" data-flat={mod}>
        <Icon name={icon as IconName} size={26} />
      </span>
      <span className="tb-label" aria-hidden="true">{label}</span>
      {tip && <span className="tb-tip">{label}</span>}
    </a>
  );
}

/** Menu agrupado: barra lateral do computador. No celular, o mesmo conteúdo fica na gaveta (puxar a barra). */
function NavMenu({ current, onNavigate }: { current: string; onNavigate?: () => void }) {
  const { data } = useStore();
  // Módulos guardados (desligados na montagem) não aparecem no menu; ficam em Guardados.
  const kept = keptCount(data);
  const groups = NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((it) => !it.to || (it.to === 'guardados' ? kept > 0 : !isHidden(data, it.to))) })).filter((g) => g.items.some((it) => it.to));
  const item = (it: NavItem) =>
    it.to ? (
      <a
        href={`#/${it.to}`}
        data-nav="switch"
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
        <span className="nav-ic" data-mod={navMod(it.to)}>
          <Icon name={it.icon} size={18} />
        </span>
        <span>{it.label}</span>
      </a>
    ) : (
      <span className="soon" aria-disabled="true">
        <span className="nav-ic">
          <Icon name={it.icon} size={18} />
        </span>
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
    </div>
  );
}

/** E27: caminho do computador na primeira linha da tela ("Início › Finanças › Orçamento"), cada nível clicável. */
function Crumbs() {
  const title = useCurrentPageTitle();
  const items = useCurrentPageCrumbs();
  const crumbs = buildCrumbs(getTrail(), (p) => SECTIONS.find((s) => s.path === p)?.label ?? null, { items, title });
  if (crumbs.length < 2) return null;
  return (
    <nav className="crumbs desk-only" aria-label="Caminho">
      {crumbs.map((c, i) => (
        <span key={i} className="crumb-item">
          {i > 0 && <span className="crumb-sep" aria-hidden="true">›</span>}
          {c.to ? <a href={`#/${c.to}`}>{c.label}</a> : <b aria-current="page">{c.label}</b>}
        </span>
      ))}
    </nav>
  );
}

/** Módulo de um item do menu (para a cor do ícone no Colorido e no Flat). */
const navMod = (to?: string) => (to ? (moduleOf(to) ?? to.split('/')[0]) : undefined);

/** E35.1: pé do menu do computador, sempre à vista: atalho da conta e Configurações. */
function SideFoot({ current }: { current: string }) {
  const { data } = useStore();
  const cloud = useCloud();
  const email = cloud?.email ?? null;
  const name = data.profile?.name?.trim();
  return (
    <div className="side-foot">
      {GOOGLE_CLIENT_ID ? (
        <a className="side-account" href="#/ajustes/conta" title={email ?? 'Entrar com Google'}>
          <span className="side-avatar">{email ? (name || email)[0].toUpperCase() : <Icon name="cloud" size={16} />}</span>
          <span className="side-who">
            <strong>{name || (email ? 'Conta Google' : 'Entrar com Google')}</strong>
            <small>{email ?? 'Sincronizar entre aparelhos'}</small>
          </span>
        </a>
      ) : (
        <span className="side-account" />
      )}
      <a className={`side-gear${current === SETTINGS_ITEM.section ? ' active' : ''}`} href={`#/${SETTINGS_ITEM.to}`} aria-label="Configurações" title="Configurações" aria-current={current === SETTINGS_ITEM.section ? 'page' : undefined}>
        <Icon name="settings" size={20} />
      </a>
    </div>
  );
}


/**
 * E24: enquanto a tela rola (qualquer direção), o botão + fica transparente e um pouco menor,
 * para dar para ler o que está por trás; parou de rolar, em meio segundo volta inteiro.
 */
function useScrollingClass() {
  useEffect(() => {
    let idle: number | undefined;
    const onScroll = () => {
      document.body.classList.add('scrolling');
      window.clearTimeout(idle);
      idle = window.setTimeout(() => document.body.classList.remove('scrolling'), 500);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(idle);
      document.body.classList.remove('scrolling');
    };
  }, []);
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
  const { data, saveError, update } = useStore();
  useTheme(data.settings.theme, data.settings.accent);
  const route = useRoute();
  const section = SECTIONS.find((s) => s.path === route.path) ?? SECTIONS[0];
  // E2: a tela Mais saiu. O endereço antigo #/mais abre o Início com a gaveta do menu aberta.
  useEffect(() => {
    if (route.path === 'metas') return goReplace('objetivos/area-carreira'); // E5: Carreira › Metas mora em Objetivos
    if (route.path !== 'mais') return;
    goReplace('inicio');
    window.setTimeout(openMenu, 60);
  }, [route.path, route.n]);
  const View = section.view;
  const [quickOpen, setQuickOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const scrollHidden = useHideOnScroll(`${section.path}:${route.n}`);
  const gameBar = section.path === 'jornada' && gameBarOn(data.settings, welcomed(data.journey));
  // Na Jornada (imersão à parte), a faixa e a barra do jogo sempre encolhem ao rolar, sem depender
  // da opção "esconder ao rolar" do sistema (que vale só fora dela).
  const barHidden = (gameBar || data.settings.hideOnScroll) && scrollHidden;
  const bar = barFor(section.path);
  const barIndex = bar ? activeIndex(bar, section.path) : null;
  useScrollingClass();
  // E26: nome embaixo dos ícones da barra (opcional).
  // E35.1: no computador, "/" abre a busca (fora de campos de texto).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      setSearch(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    document.body.classList.toggle('bar-labels', !data.settings.hideBarLabels);
  }, [data.settings.hideBarLabels]);
  // E29: ícones dos módulos coloridos (cada um com a sua cor).
  useEffect(() => {
    document.body.classList.toggle('icons-color', data.settings.iconColors === 'cores');
    document.body.classList.toggle('icons-mono', data.settings.iconColors === 'mono');
    // E37: vidro fosco opcional.
    document.body.classList.toggle('no-glass', !data.settings.frostedGlass);
    document.body.classList.toggle('icons-flat', data.settings.iconStyle === 'flat');
    // E30: o Flat vale também para a barra de baixo.
    document.body.classList.toggle('bar-flat', data.settings.iconStyle === 'flat');
    // E31: tamanho dos ícones (menu e barra juntos).
    document.body.classList.toggle('icons-p', data.settings.iconSize === 'p');
    document.body.classList.toggle('icons-g', data.settings.iconSize === 'g');
  }, [data.settings.iconColors, data.settings.iconStyle, data.settings.iconSize, data.settings.frostedGlass]);
  const editor = useCardEditor();
  const where = bar ? crumb(bar, barIndex) : null;
  const settingsSub = section.path === 'ajustes' ? settingsPage(route.sub) : null;
  // E25: telas de dentro (ex.: Estudos › um notebook) mostram "Nível de cima / Tela" no topo, nunca mais de dois níveis.
  const pageTitle = useCurrentPageTitle();
  const pageParent = useCurrentPageParent();
  const nearLevel = where?.page ?? where?.module ?? section.title ?? section.label;
  const innerTitle = route.sub && pageTitle && pageTitle !== nearLevel && pageTitle !== section.label ? pageTitle : null;
  const innerParent = settingsSub ? section.label : (pageParent ?? nearLevel);
  // E40/E41: em todas as telas (Início e Jornada também), ações extras no menu ⋮, com a busca por último.
  const pageActions = useCurrentPageMenu();
  const wide = useDesktop();
  const searchLabel = section.search ? 'Buscar no diário' : moduleOf(section.path) ? `Buscar em ${where?.module ?? section.label}` : 'Buscar em tudo';
  const menu = buildMenu(pageActions, { editable: !!editor.screen, editing: editor.editing, search: searchLabel, ownSearch: !!section.search });
  const pickMenu = (id: string) => {
    if (id === MENU_EDIT) editor.toggle();
    else if (id === MENU_SEARCH) {
      if (section.search) goReplace(section.search);
      else setSearch(true);
    } else pageActions.find((a) => a.id === id)?.run();
  };
  const menuTip = !data.settings.menuTipSeen;
  const tipSeen = () => update((d) => ({ ...d, settings: { ...d.settings, menuTipSeen: true } }));
  // E22: dentro de um tema das Configurações, o título mostra "Configurações / Aparência".
  // Tocar de novo no módulo em que você já está mostra os favoritos, para trocar de módulo sem passar pelo Início.
  const [showFavs, setShowFavs] = useState(false);
  useEffect(() => setShowFavs(false), [route.path, route.n]);
  const placed = bar && !showFavs ? barItems(bar, data.settings.favorites, data.settings.barLayout) : null;
  const middle: BarItem[] = placed ? placed.items : favoriteItems(data.settings.favorites).slice(0, 4);
  const tabbarRef = useRef<HTMLElement>(null);
  // N2.11: dentro da Jornada (em uso), a barra de baixo vira a barra do jogo.
  // N2.15: a barra do jogo tem duas fileiras; o conteúdo da tela abre espaço para ela.
  useEffect(() => {
    document.body.classList.toggle('jn-tall', gameBar);
    return () => document.body.classList.remove('jn-tall');
  }, [gameBar]);

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
    document.title = section.path === 'inicio' ? 'CP Hub' : `${section.title ?? section.label} · CP Hub`;
  }, [section]);

  function fab() {
    if (section.fab === 'rapido') setQuickOpen(true);
    else if (section.fab) goReplace(section.fab);
  }

  return (
    <div className={`shell${barHidden ? ' bars-hidden' : ''}`}>
      <header className={`topbar${barHidden ? ' hidden' : ''}`}>
        {/* E25: sem menu ☰ (o menu inteiro fica na gaveta, puxando a barra). Fora do Início, a seta ‹ sobe um nível. */}
        {canGoBack() && section.path !== 'inicio' ? (
          <button type="button" className="icon-btn topbar-back" onClick={() => history.back()} aria-label="Voltar">
            <Icon name="left" />
          </button>
        ) : (
          <span className="topbar-spacer" aria-hidden="true" />
        )}
        <h1 className="topbar-title">
          {section.path === 'inicio' ? (
            formatLongDate(todayISO())
          ) : innerTitle ? (
            <>
              <span className="crumb">{innerParent} /</span> {innerTitle}
            </>
          ) : where?.page ? (
            <>
              <span className="crumb">{where.module} /</span> {where.page}
            </>
          ) : settingsSub ? (
            <>
              <span className="crumb">{section.label} /</span> {settingsSub.label}
            </>
          ) : (
            (section.title ?? section.label)
          )}
        </h1>
        {/* Padrão de todas as telas (18/11): ‹ voltar · caminho (até dois níveis) · ⋮ quando há ações. */}
        {menu.length > 0 && <PageMenuButton items={menu} onPick={pickMenu} tip={menuTip && !wide} onTipSeen={tipSeen} />}
      </header>

      <nav className="sidebar" aria-label="Seções">
        <div className="side-top">
          <a className="brand" href="#/inicio">
            <img src="./icon.svg" alt="" width={30} height={30} />
            <span>CP Hub</span>
          </a>
          <button type="button" className="search sidebar-search" onClick={() => setSearch(true)}>
            <Icon name="search" size={18} /> <span>Buscar em tudo</span>
            <kbd aria-hidden="true">/</kbd>
          </button>
        </div>
        <div className="side-scroll">
          <NavMenu current={section.path} />
        </div>
        <SideFoot current={section.path} />
      </nav>

      {search && <SearchSheet onClose={() => setSearch(false)} scope={moduleOf(section.path)} />}

      <main className="main">
        {saveError && (
          <div className="alert red" role="alert">
            {saveError === 'reserva'
              ? 'Não deu para salvar no lugar de sempre. Suas mudanças estão numa cópia de reserva neste aparelho. Por garantia, exporte um backup em Configurações.'
              : 'Não foi possível salvar neste aparelho. Exporte um backup em Configurações agora.'}
          </div>
        )}
        <div className="desk-head desk-only">
          <Crumbs />
          {/* No computador a barra de cima não aparece: o ⋮ fica na linha do caminho. */}
          {menu.length > 0 && <PageMenuButton items={menu} onPick={pickMenu} tip={menuTip && wide} onTipSeen={tipSeen} />}
        </div>
        <ErrorBoundary scope="tela" resetKey={`${section.path}:${route.n}`}>
          <View key={section.path} route={route} />
        </ErrorBoundary>
      </main>

      <SideCards />

      {section.fab && (
        <button type="button" className="fab" onClick={fab} aria-label="Adicionar">
          <Icon name="plus" size={26} />
        </button>
      )}

      <nav ref={tabbarRef} className={`tabbar${barHidden && !gameBar ? ' hidden' : ''}${gameBar ? ` jn-gamebar${barHidden ? ' jn-compact' : ''}` : ''}`} aria-label={gameBar ? 'Barra da Jornada (puxe para cima para abrir o menu)' : 'Atalhos (puxe para cima para abrir o menu)'}>
        {gameBar ? (
          <GameBarItems current={journeyTab(route.sub)} />
        ) : (
        <>
        <TabLink to="inicio" label="Início" icon="home" active={section.path === 'inicio'} />
        {middle.map((it, i) => (
          <TabLink
            key={`${placed ? bar!.id : 'fav'}-${it.id}`}
            to={it.to}
            label={it.label}
            icon={it.icon}
            mod={placed ? bar!.id : it.id}
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
            <span className="tb-label" aria-hidden="true">Favoritos</span>
          </button>
        )}
        {showFavs && <span className="tb-hint">Escolha o módulo</span>}
        </>
        )}
      </nav>

      <PullToMais bar={tabbarRef} resetKey={`${route.path}:${route.n}`} />
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
