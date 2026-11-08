import { COMING_SOON, SECTIONS } from '../App';
import { useStore } from '../store';
import { addFavorite, FAVORITABLE } from '../moduleBar';
import { Icon, notify, PageHeader, Sheet, type IconName } from '../ui';

/** Todos os módulos. Orçamento e Relatórios ficam dentro de Finanças (na barra de baixo). */
const LINKS: { path: string; hint: string }[] = [
  { path: 'financas', hint: 'Despesas, receitas, cartões, caixinhas, orçamento e relatórios' },
  { path: 'diario', hint: 'Registros, humor e revisão da semana' },
  { path: 'agenda', hint: 'Calendário, compromissos e tarefas' },
  { path: 'nucleo', hint: 'Hábitos, meditação, respiração e treinos' },
  { path: 'listas', hint: 'Mercado com preços, compras, receitas e checklists' },
  { path: 'arquivo', hint: 'Anotações rápidas e informações importantes' },
  { path: 'voce', hint: 'Perfil, metas e sugestões para você' },
  { path: 'revisao', hint: 'Resumo da semana e reflexão' },
  { path: 'jornada', hint: 'Desbloqueia com 14 dias de uso' },
  { path: 'ajustes', hint: 'Personalização (temas, favoritos, barra), backup e dados' },
];

export function Mais() {
  return (
    <>
      <PageHeader title="Mais" />
      <div className="tile-grid">
        {LINKS.map((l) => {
          const s = SECTIONS.find((x) => x.path === l.path)!;
          return (
            <a key={l.path} className="tile" href={`#/${l.path}`}>
              <span className="tile-icon">
                <Icon name={s.icon} />
              </span>
              <span className="tile-text">
                <strong>{s.label}</strong>
                <span className="muted">{l.hint}</span>
              </span>
              <Icon name="right" size={18} />
            </a>
          );
        })}
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
        {FAVORITABLE.map((f) => {
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
