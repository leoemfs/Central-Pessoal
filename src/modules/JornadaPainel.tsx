/**
 * Jornada (N2.13): o que completa a tela principal, seguindo as pranchas da prévia "Jornada RPG":
 * baús prontos, "Seu dia em números", "Perto de desbloquear", a festa ao subir de nível
 * ("v1 · Subiu de nível") e "Como ganhar XP e ouro" ("v2 · Como ganha XP e ouro").
 */
import { Fullscreen } from '../ui';
import { REWARDS } from '../journey';
import { avatarIcon, chestIcon, COIN_ICON, GEM_ICON, homeIcon, HOMES, PETS, petIcon, type AvatarLook } from '../jornada/catalog';
import { levelRewards } from '../jornada/home';

const fmt = (n: number) => n.toLocaleString('pt-BR');

export function LevelUpScreen({ look, outfit, level, xp, toNext, onClose }: { look: AvatarLook; outfit: Parameters<typeof avatarIcon>[1]; level: number; xp: number; toNext: number; onClose: () => void }) {
  const rewards = levelRewards(level);
  const iconOf = (kind: string, title: string) => {
    if (kind === 'bau') return chestIcon('dourado', false);
    if (kind === 'pet') return petIcon(PETS.find((p) => title.endsWith(p.name))?.id ?? 'gato');
    if (kind === 'casa') return homeIcon(HOMES.find((h) => title.endsWith(h.name))?.id ?? 'casinha', 'manha');
    return GEM_ICON;
  };
  return (
    <Fullscreen label="Subiu de nível" className="jn-lvup" onClose={onClose}>
      <div className="jn-lvup-body">
        <div className="jn-lvup-rays" aria-hidden="true" />
        <span className="jn-px jn-lvup-tag">LEVEL UP!</span>
        <img className="jn-lvup-hero" alt="" src={avatarIcon(look, outfit)} />
        <h1 className="jn-px jn-lvup-n">NÍVEL {level}</h1>
        <p className="muted">
          {fmt(xp)} XP no total · {fmt(toNext)} até o nível {level + 1}
        </p>
        <section className="jn-lvup-rewards">
          <span className="jn-px">RECOMPENSAS</span>
          {rewards.length === 0 ? (
            <div className="jn-loot-row">
              <img alt="" src={COIN_ICON} />
              <div>
                <strong>Mais perto do próximo baú</strong>
                <span className="muted small">Baú dourado a cada 5 níveis</span>
              </div>
            </div>
          ) : (
            rewards.map((r, i) => (
              <div key={r.title} className="jn-loot-row" style={{ animationDelay: `${0.3 + i * 0.18}s` }}>
                <img alt="" src={iconOf(r.kind, r.title)} />
                <div>
                  <strong>{r.title}</strong>
                  <span className="muted small">{r.sub}</span>
                </div>
              </div>
            ))
          )}
        </section>
        <button type="button" className="btn primary block" onClick={onClose}>
          Continuar
        </button>
      </div>
    </Fullscreen>
  );
}

export function HowToEarn() {
  const R = REWARDS;
  const groups: { title: string; rows: [string, string, string][] }[] = [
    {
      title: 'Núcleo pessoal',
      rows: [
        ['Ritual cumprido', `+${R.ritual.xp}`, `+${R.ritual.gold} ouro`],
        ['Hábito em construção feito', `+${R.construir.xp}`, `+${R.construir.gold} ouro`],
        ['Semana sem um hábito a abandonar', `+${R.abandonar.xp}`, `+${R.abandonar.gold} ouro`],
        ['7 / 14 / 30 / 60 dias sem', '—', 'Baú de cristal'],
        ['7 dias seguidos de rotina', '—', 'Baú de bronze'],
        ['30 dias de consistência', '—', 'Baú de prata'],
      ],
    },
    {
      title: 'Finanças',
      rows: [
        ['Conta paga até o vencimento', `+${R.conta.xp}`, `+${R.conta.gold} ouro`],
        ['Mês com todas as contas em dia', '—', 'Baú dourado'],
        ['Lançar ou gastar dinheiro', '—', '—'],
      ],
    },
    {
      title: 'Diário e agenda',
      rows: [
        ['Registro no diário', `+${R.diario.xp}`, `+${R.diario.gold} ouro`],
        ['Meta da semana do Diário', '+10 por vez', '—'],
        ['Tarefa concluída', `+${R.tarefa.xp}`, `+${R.tarefa.gold} ouro`],
      ],
    },
    {
      title: 'Planejamento',
      rows: [
        ['Revisão semanal feita', `+${R.revisao.xp}`, `+${R.revisao.gold} ouro`],
        ['Revisão com 80% da rotina', '—', 'Baú de prata'],
        ['A cada 5 níveis', '—', 'Baú dourado'],
      ],
    },
  ];
  return (
    <section className="card">
      <div className="card-head">
        <h2>Como ganhar XP e ouro</h2>
      </div>
      {groups.map((g) => (
        <div key={g.title} className="jn-earn">
          <h3>{g.title}</h3>
          {g.rows.map(([what, xp, gold]) => (
            <div key={what} className="jn-earn-row">
              <span>{what}</span>
              <span className="jn-px" style={{ color: xp === '—' ? 'var(--faint)' : 'var(--green-text)' }}>
                {xp}
              </span>
              <span style={{ color: gold.startsWith('Baú') ? 'var(--jn-crystal)' : gold === '—' ? 'var(--faint)' : 'var(--jn-gold)' }}>{gold}</span>
            </div>
          ))}
        </div>
      ))}
      <div className="jn-fair">
        <strong>Regras justas</strong>
        <span>Faltar nunca tira XP, ouro ou itens.</span>
        <span>Desmarcou algo marcado por engano? A recompensa sai junto.</span>
        <span>Gastar dinheiro não rende nada. Pagar no prazo, sim.</span>
      </div>
    </section>
  );
}
