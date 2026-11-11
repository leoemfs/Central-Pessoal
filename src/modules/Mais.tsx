import { COMING_SOON, SECTIONS } from '../App';
import { useStore } from '../store';
import { addFavorite, FAVORITABLE } from '../moduleBar';
import { Icon, notify, PageHeader, Sheet, type IconName } from '../ui';
import { isHidden } from '../setup';
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
      </div>
      {kept.length > 0 && (
        <>
          <h2 className="section-title">Guardados</h2>
          <p className="muted small">Módulos desligados: continuam aqui, com tudo o que você já registrou. Para trazer de volta, use Personalização.</p>
          <div className="tile-grid">
            {kept.map((l) => (
              <LinkTile key={l.path} {...l} />
            ))}
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
          </div>
        </>
      )}
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
