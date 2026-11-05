import { COMING_SOON, SECTIONS } from '../App';
import { Icon, PageHeader } from '../ui';

const LINKS: { path: string; hint: string }[] = [
  { path: 'voce', hint: 'Perfil, metas e sugestões para você' },
  { path: 'nucleo', hint: 'Hábitos, meditação, respiração e treinos' },
  { path: 'listas', hint: 'Mercado com preços, compras, receitas e checklists' },
  { path: 'arquivo', hint: 'Anotações rápidas e informações importantes' },
  { path: 'orcamento', hint: 'Limite por categoria e o ritmo do mês' },
  { path: 'relatorios', hint: 'Para onde vai o dinheiro, mês a mês' },
  { path: 'revisao', hint: 'Resumo da semana e reflexão' },
  { path: 'jornada', hint: 'Desbloqueia com 14 dias de uso' },
  { path: 'ajustes', hint: 'Categorias, backup e dados' },
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
