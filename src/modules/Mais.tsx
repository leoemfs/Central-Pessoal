import { COMING_SOON, SECTIONS } from '../App';
import { useStore } from '../store';
import type { AppData } from '../types';
import { addFavorite, FAVORITABLE } from '../moduleBar';
import { Icon, notify, PageHeader, Sheet, type IconName } from '../ui';
import { hiddenFrom, isHidden, toggleModule, visibleFrom } from '../setup';
import { openSetup, openTutorial } from './Montagem';
import { EditBar, useEditScreen } from '../Cards';
import { arrange, moveCard, type CardLayout } from '../cardLayout';

/** Todos os módulos. Orçamento e Relatórios ficam dentro de Finanças (na barra de baixo). */
const LINKS: { path: string; hint: string }[] = [
  { path: 'financas', hint: 'Despesas, receitas, cartões, caixinhas, orçamento e relatórios' },
  { path: 'diario', hint: 'Registros, humor e revisão da semana' },
  { path: 'agenda', hint: 'Calendário, compromissos e tarefas' },
  { path: 'nucleo', hint: 'Hábitos, meditação, respiração e treinos' },
  { path: 'listas', hint: 'Mercado com preços, compras, receitas e checklists' },
  { path: 'estudos', hint: 'Biblioteca, ciclos de estudo, notebooks, fontes e mapas mentais' },
  { path: 'carreira', hint: 'Vagas e candidaturas; em breve trabalho atual, currículo e metas' },
  { path: 'arquivo', hint: 'Anotações rápidas e informações importantes' },
  { path: 'voce', hint: 'Perfil, metas e sugestões para você' },
  { path: 'revisao', hint: 'Resumo da semana e reflexão' },
  { path: 'jornada', hint: 'Desbloqueia com 14 dias de uso' },
  { path: 'ajustes', hint: 'Personalização (temas, favoritos, barra), backup e dados' },
];

interface Item {
  id: string;
  label: string;
  short: string;
  icon: IconName;
  hint: string;
  href?: string;
  onClick?: () => void;
  badge?: number;
}

/** Nomes curtos para caber embaixo do ícone. */
const SHORT: Record<string, string> = { nucleo: 'Núcleo', revisao: 'Revisão', ajustes: 'Ajustes' };
/** Onde a ordem fica guardada (mesmo lugar do lápis das outras telas; entra no backup). */
const KEY_MODULES = 'mais';
const KEY_SHORTCUTS = 'mais-atalhos';

/** Uma entrada do Mais: cartão (lista) ou ícone (grade). No lápis vira bloco parado com setas. */
function Entry({ it, grid, editing, first, last, onMove }: { it: Item; grid: boolean; editing: boolean; first: boolean; last: boolean; onMove: (dir: -1 | 1) => void }) {
  const icon = (
    <span className={grid ? 'mg-icon' : 'tile-icon'}>
      <Icon name={it.icon} size={grid ? 24 : undefined} />
      {grid && it.badge ? <span className="mg-badge">{it.badge}</span> : null}
    </span>
  );
  const body = grid ? (
    <>
      {icon}
      <span className="mg-name">{it.short}</span>
    </>
  ) : (
    <>
      {icon}
      <span className="tile-text">
        <strong>{it.label}</strong>
        <span className="muted">{it.hint}</span>
      </span>
    </>
  );
  const cls = grid ? 'mg-cell' : 'tile';
  if (editing) {
    const [back, fwd] = grid ? (['left', 'right'] as const) : (['up', 'down'] as const);
    return (
      <div className={`${cls} editing`}>
        {body}
        <span className="mais-move">
          <button type="button" aria-label={`Mover ${it.label} para ${grid ? 'a esquerda' : 'cima'}`} disabled={first} onClick={() => onMove(-1)}>
            <Icon name={back} size={18} />
          </button>
          <button type="button" aria-label={`Mover ${it.label} para ${grid ? 'a direita' : 'baixo'}`} disabled={last} onClick={() => onMove(1)}>
            <Icon name={fwd} size={18} />
          </button>
        </span>
      </div>
    );
  }
  const chevron = grid ? null : <Icon name="right" size={18} />;
  return it.href ? (
    <a className={cls} href={it.href} aria-label={grid && it.badge ? `${it.label}: ${it.hint}` : undefined}>
      {body}
      {chevron}
    </a>
  ) : (
    <button type="button" className={cls} onClick={it.onClick}>
      {body}
      {chevron}
    </button>
  );
}

/** Módulos e atalhos do Mais, na ordem escolhida no lápis (a tela Mais e a gaveta usam os mesmos). */
function maisItems(data: AppData, grid: boolean) {
  const kept = LINKS.filter((l) => isHidden(data, l.path));
  const modules: Item[] = LINKS.filter((l) => l.path !== 'ajustes' && !isHidden(data, l.path)).map((l) => {
    const s = SECTIONS.find((x) => x.path === l.path)!;
    return { id: l.path, label: s.label, short: SHORT[l.path] ?? s.label, icon: s.icon, hint: l.hint, href: `#/${l.path}` };
  });
  const shortcuts: Item[] = [
    { id: 'ajustes', label: 'Configurações', short: 'Ajustes', icon: 'settings', hint: 'Personalização (temas, favoritos, barra), backup e dados', href: '#/ajustes' },
    { id: 'barra', label: 'Como usar a barra', short: 'Usar a barra', icon: 'info', hint: 'Tutorial de 1 minuto: favoritos, ferramentas do módulo, voltar e trocar de módulo', onClick: openTutorial },
    { id: 'montar', label: 'Montar o app do seu jeito', short: 'Montar o app', icon: 'grid', hint: 'Escolher de novo os módulos à vista e os favoritos', onClick: () => openSetup('convite') },
    ...(kept.length > 0
      ? [{ id: 'guardados', label: grid ? 'Guardados' : `Guardados · ${kept.length}`, short: 'Guardados', icon: 'archive' as IconName, hint: `${keptNames(kept.map((l) => l.path))}: desligados, com tudo o que você já registrou`, href: '#/guardados', badge: kept.length }]
      : []),
  ];
  const layouts = data.settings.cards;
  return { modules, shortcuts, mods: arrange(modules, layouts[KEY_MODULES]).shown, tools: arrange(shortcuts, layouts[KEY_SHORTCUTS]).shown };
}

/** E21.2: o Mais dentro da gaveta que sobe ao puxar a barra (sempre em grade, sem lápis). */
export function MaisPanel() {
  const { data } = useStore();
  const { mods, tools } = maisItems(data, true);
  const row = (items: Item[]) => items.map((it) => <Entry key={it.id} it={it} grid editing={false} first last onMove={() => {}} />);
  return (
    <>
      <div className="mg-grid">{row(mods)}</div>
      <h2 className="section-title">Atalhos</h2>
      <div className="mg-grid small">{row(tools)}</div>
    </>
  );
}

export function Mais() {
  const { data, update } = useStore();
  const editing = useEditScreen('mais');
  const grid = data.settings.moreLayout === 'grade';
  const { modules, shortcuts, mods, tools } = maisItems(data, grid);
  const layouts = data.settings.cards;
  const save = (changes: Record<string, CardLayout | null>) =>
    update((d) => {
      const cards = { ...d.settings.cards };
      for (const [k, v] of Object.entries(changes)) {
        if (v) cards[k] = v;
        else delete cards[k];
      }
      return { ...d, settings: { ...d.settings, cards } };
    });
  const list = (items: Item[], all: Item[], key: string) =>
    items.map((it, i) => <Entry key={it.id} it={it} grid={grid} editing={editing} first={i === 0} last={i === items.length - 1} onMove={(dir) => save({ [key]: moveCard(all, layouts[key], it.id, dir) })} />);

  return (
    <>
      <PageHeader title="Mais" />
      {editing && <EditBar onReset={() => save({ [KEY_MODULES]: null, [KEY_SHORTCUTS]: null })} />}
      {grid ? (
        <>
          <div className="mg-grid">{list(mods, modules, KEY_MODULES)}</div>
          <h2 className="section-title">Atalhos</h2>
          <div className="mg-grid small">{list(tools, shortcuts, KEY_SHORTCUTS)}</div>
        </>
      ) : (
        <div className="tile-grid">
          {list(mods, modules, KEY_MODULES)}
          {editing && <h2 className="section-title mais-sub">Atalhos</h2>}
          {list(tools, shortcuts, KEY_SHORTCUTS)}
        </div>
      )}
      {!editing && (
        <>
          <h2 className="section-title">Em breve</h2>
          {grid ? (
            <div className="mg-grid small">
              {COMING_SOON.map((c) => (
                <div key={c.label} className="mg-cell off" aria-disabled="true" title={c.hint}>
                  <span className="mg-icon">
                    <Icon name={c.icon} size={22} />
                  </span>
                  <span className="mg-name">{c.label === 'Banco de ideias' ? 'Ideias' : c.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="tile-grid">
              {COMING_SOON.map((c) => (
                <div key={c.label} className="tile disabled" aria-disabled="true">
                  <span className="tile-icon">
                    <Icon name={c.icon} />
                  </span>
                  <span className="tile-text">
                    <strong>{c.label}</strong>
                    <span className="muted">{c.hint}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

const label = (path: string) => SECTIONS.find((x) => x.path === path)?.label ?? path;
/** "Notas", "Notas e Jornada", "Notas, Você e Jornada" */
function keptNames(paths: string[]) {
  const names = paths.map(label);
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

/** Guardados (E17): os módulos desligados num lugar só, cada um com "Trazer de volta". */
export function Guardados() {
  const { data, update } = useStore();
  const kept = LINKS.filter((l) => isHidden(data, l.path));
  function bringBack(path: string) {
    const next = toggleModule(visibleFrom(data.settings.hiddenModules), path);
    update((d) => ({ ...d, settings: { ...d.settings, hiddenModules: hiddenFrom(next), ...(path === 'jornada' ? { journeyWanted: true } : {}) } }));
    notify(label(path), 'De volta à vista.');
  }
  return (
    <>
      <PageHeader title="Guardados" />
      <p className="muted small" style={{ marginTop: 0 }}>
        Módulos desligados. Continuam abrindo normalmente, com tudo o que você já registrou. "Trazer de volta" põe o módulo à vista de novo.
      </p>
      {kept.length === 0 ? (
        <section className="card">
          <p className="muted" style={{ margin: 0 }}>Nenhum módulo guardado. Todos estão à vista no Mais.</p>
        </section>
      ) : (
        <section className="card">
          <ul className="list">
            {kept.map((l) => {
              const s = SECTIONS.find((x) => x.path === l.path)!;
              return (
                <li key={l.path} className="row kept-row">
                  <a className="kept-open" href={`#/${l.path}`}>
                    <span className="tile-icon">
                      <Icon name={s.icon} />
                    </span>
                    <span className="row-body">
                      <span className="row-title">{s.label}</span>
                      <span className="row-meta">{l.hint}</span>
                    </span>
                  </a>
                  <button type="button" className="btn soft small" onClick={() => bringBack(l.path)}>
                    Trazer de volta
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}

/** Escolher os 4 favoritos: tocar num módulo coloca na barra; o mais antigo sai. */
export function FavoritesSheet({ onClose }: { onClose: () => void }) {
  const { data, update } = useStore();
  const favs = data.settings.favorites;
  function toggle(id: string) {
    if (favs.includes(id)) return notify('A barra tem 4 favoritos', 'Toque em outro módulo para ele entrar no lugar do mais antigo.');
    const r = addFavorite(favs, id);
    update((d) => ({ ...d, settings: { ...d.settings, favorites: r.favorites } }));
    const name = (x: string | null) => FAVORITABLE.find((f) => f.id === x)?.label ?? '';
    notify(`${name(id)} entrou nos favoritos`, r.removed ? `${name(r.removed)} saiu da barra.` : undefined);
  }
  return (
    <Sheet title="Favoritos do Início" onClose={onClose}>
      <p className="muted small" style={{ marginTop: 0 }}>
        Escolha 4. Ao marcar um novo, o mais antigo sai. Os outros módulos continuam no Mais e no menu ☰.
      </p>
      <ul className="list">
        {FAVORITABLE.filter((f) => !isHidden(data, f.id)).map((f) => {
          const on = favs.includes(f.id);
          return (
            <li key={f.id}>
              <button type="button" className={`row fav-pick${on ? ' on' : ''}`} aria-pressed={on} onClick={() => toggle(f.id)}>
                <span className="tile-icon">
                  <Icon name={f.icon as IconName} />
                </span>
                <div className="row-body">
                  <span className="row-title">{f.label}</span>
                  {on && <span className="row-meta">Na barra · posição {favs.indexOf(f.id) + 1}</span>}
                </div>
                <span className={`fav-star${on ? ' on' : ''}`} aria-hidden="true">
                  <Icon name="star" size={20} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
