import { COMING_SOON, SECTIONS } from '../App';
import { useStore } from '../store';
import { addFavorite, FAVORITABLE } from '../moduleBar';
import { Icon, notify, PageHeader, Sheet, type IconName } from '../ui';
import { hiddenFrom, isHidden, toggleModule, visibleFrom } from '../setup';
import { openSetup, openTutorial } from './Montagem';

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

function LinkTile({ path, hint }: { path: string; hint: string }) {
  const s = SECTIONS.find((x) => x.path === path)!;
  return (
    <a className="tile" href={`#/${path}`}>
      <span className="tile-icon">
        <Icon name={s.icon} />
      </span>
      <span className="tile-text">
        <strong>{s.label}</strong>
        <span className="muted">{hint}</span>
      </span>
      <Icon name="right" size={18} />
    </a>
  );
}

export function Mais() {
  const { data } = useStore();
  const shown = LINKS.filter((l) => !isHidden(data, l.path));
  const kept = LINKS.filter((l) => isHidden(data, l.path));
  if (data.settings.moreLayout === 'grade') return <MaisGrade shown={shown.map((l) => l.path)} kept={kept.map((l) => l.path)} />;
  return (
    <>
      <PageHeader title="Mais" />
      <div className="tile-grid">
        {shown.map((l) => (
          <LinkTile key={l.path} {...l} />
        ))}
        <button type="button" className="tile" onClick={openTutorial}>
          <span className="tile-icon">
            <Icon name="info" />
          </span>
          <span className="tile-text">
            <strong>Como usar a barra</strong>
            <span className="muted">Tutorial de 1 minuto: favoritos, ferramentas do módulo, voltar e trocar de módulo</span>
          </span>
          <Icon name="right" size={18} />
        </button>
        <button type="button" className="tile" onClick={() => openSetup('convite')}>
          <span className="tile-icon">
            <Icon name="grid" />
          </span>
          <span className="tile-text">
            <strong>Montar o app do seu jeito</strong>
            <span className="muted">Escolher de novo os módulos à vista e os favoritos</span>
          </span>
          <Icon name="right" size={18} />
        </button>
        {kept.length > 0 && (
          <a className="tile" href="#/guardados">
            <span className="tile-icon">
              <Icon name="archive" />
            </span>
            <span className="tile-text">
              <strong>Guardados · {kept.length}</strong>
              <span className="muted">{keptNames(kept.map((l) => l.path))}: desligados, com tudo o que você já registrou</span>
            </span>
            <Icon name="right" size={18} />
          </a>
        )}
      </div>
      <h2 className="section-title">Em breve</h2>
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
    </>
  );
}

/** Nomes curtos para caber embaixo do ícone. */
const SHORT: Record<string, string> = { nucleo: 'Núcleo', revisao: 'Revisão', ajustes: 'Ajustes' };

/** Mais em grade (E18): módulos 3 por linha; atalhos e "Em breve" numa linha menor, 4 por linha. */
function MaisGrade({ shown, kept }: { shown: string[]; kept: string[] }) {
  const cell = (path: string) => {
    const s = SECTIONS.find((x) => x.path === path)!;
    return (
      <a key={path} className="mg-cell" href={`#/${path}`}>
        <span className="mg-icon">
          <Icon name={s.icon} size={26} />
        </span>
        <span className="mg-name">{SHORT[path] ?? s.label}</span>
      </a>
    );
  };
  return (
    <>
      <PageHeader title="Mais" />
      <div className="mg-grid">{shown.filter((p) => p !== 'ajustes').map(cell)}</div>
      <h2 className="section-title">Atalhos</h2>
      <div className="mg-grid small">
        <a className="mg-cell" href="#/ajustes">
          <span className="mg-icon">
            <Icon name="settings" size={22} />
          </span>
          <span className="mg-name">Ajustes</span>
        </a>
        <button type="button" className="mg-cell" onClick={openTutorial}>
          <span className="mg-icon">
            <Icon name="info" size={22} />
          </span>
          <span className="mg-name">Usar a barra</span>
        </button>
        <button type="button" className="mg-cell" onClick={() => openSetup('convite')}>
          <span className="mg-icon">
            <Icon name="grid" size={22} />
          </span>
          <span className="mg-name">Montar o app</span>
        </button>
        {kept.length > 0 && (
          <a className="mg-cell" href="#/guardados" aria-label={`Guardados: ${keptNames(kept)}`}>
            <span className="mg-icon">
              <Icon name="archive" size={22} />
              <span className="mg-badge">{kept.length}</span>
            </span>
            <span className="mg-name">Guardados</span>
          </a>
        )}
      </div>
      <h2 className="section-title">Em breve</h2>
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

/** Escolher os 3 favoritos: tocar num módulo coloca na barra; o mais antigo sai. */
export function FavoritesSheet({ onClose }: { onClose: () => void }) {
  const { data, update } = useStore();
  const favs = data.settings.favorites;
  function toggle(id: string) {
    if (favs.includes(id)) return notify('A barra tem 3 favoritos', 'Toque em outro módulo para ele entrar no lugar do mais antigo.');
    const r = addFavorite(favs, id);
    update((d) => ({ ...d, settings: { ...d.settings, favorites: r.favorites } }));
    const name = (x: string | null) => FAVORITABLE.find((f) => f.id === x)?.label ?? '';
    notify(`${name(id)} entrou nos favoritos`, r.removed ? `${name(r.removed)} saiu da barra.` : undefined);
  }
  return (
    <Sheet title="Favoritos do Início" onClose={onClose}>
      <p className="muted small" style={{ marginTop: 0 }}>
        Escolha 3. Ao marcar um novo, o mais antigo sai. Os outros módulos continuam no Mais e no menu ☰.
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
