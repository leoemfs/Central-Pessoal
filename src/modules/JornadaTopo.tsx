/**
 * Jornada (N2.17b): faixa fixa do topo e peças da tela principal, como na "Prévia da Jornada"
 * (hud, avisos, três números e "Quase lá"). Tudo calculado a partir dos dados.
 */
import { useStore } from '../store';
import { go } from '../router';
import { todayISO } from '../utils';
import { notify } from '../ui';
import { journeyStats } from '../journey';
import { avatarIcon, chestIcon, COIN_ICON, GEM_ICON, HOMES, itemById, itemIcon, ITEMS, medalIcon, PETS, petIcon, homeIcon } from '../jornada/catalog';
import { PX } from '../jornada/px';
import { quaseLa, streakDays, dayNumbers } from '../jornada/home';
import { acquire, acquirePlace, availability, classOf, pendingChests, placeAvailability, recentAttributes, shopContext, visitStats, wallet, welcomed } from '../jornada/rules';
import { starsTonight } from '../jornada/sky';

const fmt = (n: number) => n.toLocaleString('pt-BR');

/** Faixa presa no topo em todas as telas da Jornada: rosto, nome, LV · classe, 🔥, ouro, cristais e XP. */
export function JornadaHud() {
  const { data } = useStore();
  const state = data.journey;
  if (!welcomed(state) || !state.avatar) return null;
  const today = todayISO();
  const s = journeyStats(data, today);
  const w = wallet(data, state, today);
  const cls = classOf(w.attrs, recentAttributes(data, today));
  const look = state.avatar;
  const flame = visitStats(data.settings.visitDays, today).streak;
  const e = state.equipped;
  return (
    <div className="jn-hud">
      <div className="jn-hud-row">
        <button type="button" className="jn-hud-face" aria-label="Ver o personagem" onClick={() => go('jornada')}>
          <img alt="" src={avatarIcon(look, { elmo: e.elmo, armadura: e.armadura, botas: e.botas, colar: e.colar })} />
        </button>
        <div className="jn-hud-who">
          <strong>{look.name || cls[look.gender]}</strong>
          <span>
            <b className="jn-px">LV {s.level}</b> · {cls[look.gender]}
          </span>
        </div>
        <div className="jn-hud-purse">
          <span className="f" aria-label={`${flame} ${flame === 1 ? 'dia seguido' : 'dias seguidos'} abrindo o app`}>
            <img alt="" src={PX.flame} />
            <b>{flame}</b>
          </span>
          <span className="g" aria-label={`${fmt(w.gold)} de ouro`}>
            <img alt="" src={COIN_ICON} />
            <b>{fmt(w.gold)}</b>
          </span>
          <span className="c" aria-label={`${fmt(w.crystals)} ${w.crystals === 1 ? 'cristal' : 'cristais'}`}>
            <img alt="" src={GEM_ICON} />
            <b>{fmt(w.crystals)}</b>
          </span>
        </div>
      </div>
      <div className="jn-hud-xp">
        <span className="tabular">
          {fmt(s.xpInLevel)}/{fmt(s.xpForNext)} XP
        </span>
        <div className="jn-hud-bar" role="progressbar" aria-label="XP do nível" aria-valuenow={Math.round((s.xpInLevel / s.xpForNext) * 100)} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${Math.min(100, (s.xpInLevel / s.xpForNext) * 100)}%` }} />
        </div>
        <span>LV {s.level + 1}</span>
      </div>
    </div>
  );
}

/** Avisos da tela principal: baús esperando, o que o atributo/nível liberou ("Pegar") e o místico pronto ("Forjar"). */
export function Notices() {
  const { data, update } = useStore();
  const today = todayISO();
  const state = data.journey;
  const level = journeyStats(data, today).level;
  const chests = pendingChests(data, state, today, level);
  const ctx = shopContext(data, state, today);
  const freeItems = ITEMS.filter((it) => !it.campaign && it.rarity !== 'mistico' && availability(it, state, ctx).status === 'liberar');
  const freePlaces = [...PETS.map((p) => ({ kind: 'pet' as const, id: p.id, name: p.name })), ...HOMES.map((h) => ({ kind: 'morada' as const, id: h.id, name: h.name }))].filter((p) => placeAvailability(p.kind, p.id, state, ctx).status === 'liberar');
  const forge = ITEMS.filter((it) => it.rarity === 'mistico' && !it.campaign && (() => { const a = availability(it, state, ctx); return a.status === 'forja' && a.ready; })());
  if (!chests.length && !freeItems.length && !freePlaces.length && !forge.length) return null;

  const run = (fn: (d: typeof data) => ReturnType<typeof acquire>, done: string) =>
    update((d) => {
      const r = fn(d);
      if (typeof r === 'string') {
        notify('Não deu', r);
        return d;
      }
      notify(done);
      return { ...d, journey: r };
    });

  return (
    <div className="jn-notices">
      {chests.length > 1 ? (
        <div className="jn-notice">
          <img className="chest" alt="" src={chestIcon(chests[chests.length - 1].kind, false)} />
          <div>
            <strong>{chests.length} baús esperando</strong>
            <span className="muted small">{chests.slice(-2).map((c) => c.reason).join(' · ')}</span>
          </div>
          <button type="button" className="btn primary small" onClick={() => go('jornada/baus')}>
            Ver baús
          </button>
        </div>
      ) : (
        chests.map((c) => (
          <div key={c.key} className={`jn-notice${c.kind === 'cristal' ? ' gem' : ''}`}>
            <img className="chest" alt="" src={chestIcon(c.kind, false)} />
            <div>
              <strong>Baú {c.kind === 'bronze' ? 'de bronze' : c.kind === 'prata' ? 'de prata' : c.kind === 'dourado' ? 'dourado' : 'de cristal'}</strong>
              <span className="muted small">{c.reason}</span>
            </div>
            <button type="button" className="btn primary small" onClick={() => go('jornada/baus')}>
              Abrir
            </button>
          </div>
        ))
      )}
      {freeItems.map((it) => {
        const [code, need] = Object.entries(it.attrUnlock ?? {})[0] ?? ['', 0];
        return (
          <div key={it.id} className="jn-notice green">
            <img alt="" src={itemIcon(it)} />
            <div>
              <strong>Liberado: {it.name}</strong>
              <span className="muted small">Você chegou a {code} {need}. É seu, de graça.</span>
            </div>
            <button type="button" className="btn primary small" onClick={() => run((d) => acquire(d.journey, it.id, shopContext(d, d.journey, today)), `${it.name} é seu! Está no Arsenal.`)}>
              Pegar
            </button>
          </div>
        );
      })}
      {freePlaces.map((p) => (
        <div key={p.id} className="jn-notice green">
          <img alt="" src={p.kind === 'pet' ? petIcon(p.id) : homeIcon(p.id)} />
          <div>
            <strong>Liberado: {p.name}</strong>
            <span className="muted small">{p.kind === 'pet' ? 'Novo pet liberado.' : 'Nova casa liberada.'}</span>
          </div>
          <button type="button" className="btn primary small" onClick={() => run((d) => acquirePlace(p.kind, p.id, d.journey, shopContext(d, d.journey, today)), `${p.name} é seu!`)}>
            Pegar
          </button>
        </div>
      ))}
      {forge.map((it) => (
        <div key={it.id} className="jn-notice">
          <img alt="" src={itemIcon(it)} />
          <div>
            <strong>{it.name}: pronta para forjar</strong>
            <span className="muted small">Você treinou o suficiente. Custa {it.crystals} cristais.</span>
          </div>
          <button type="button" className="btn primary small" onClick={() => run((d) => acquire(d.journey, it.id, shopContext(d, d.journey, today)), `${it.name} forjada! Está no Arsenal.`)}>
            Forjar
          </button>
        </div>
      ))}
    </div>
  );
}

/** Três números da prévia: dias seguidos, estrelas no céu e missões de hoje. */
export function Stats3() {
  const { data } = useStore();
  const today = todayISO();
  const n = dayNumbers(data, today);
  return (
    <div className="jn-stats3">
      <div>
        <strong className="jn-px" style={{ color: '#fb923c' }}>
          {streakDays(data.settings.activeDays, today)}
        </strong>
        <span>dias seguidos</span>
      </div>
      <div>
        <strong className="jn-px" style={{ color: '#fde68a' }}>
          {starsTonight(data.settings.activeDays, today)}
        </strong>
        <span>estrelas no céu</span>
      </div>
      <div>
        <strong className="jn-px" style={{ color: 'var(--green-text)' }}>
          {n.done}/{n.total}
        </strong>
        <span>missões hoje</span>
      </div>
    </div>
  );
}

/** "Quase lá": o que vem a seguir, com barra na cor de cada coisa. */
export function QuaseLa() {
  const { data } = useStore();
  const list = quaseLa(data, data.journey, todayISO());
  const icon = (g: (typeof list)[number]['icon']) =>
    g.kind === 'estrela' ? PX.star : g.kind === 'bau' ? chestIcon(g.chest, false) : g.kind === 'medalha' ? medalIcon(g.index, true) : itemIcon(itemById(g.id)!);
  return (
    <section className="card">
      <div className="card-head">
        <h2>Quase lá</h2>
        <button type="button" className="jn-link small" onClick={() => go('jornada/codex')}>
          o que vem a seguir
        </button>
      </div>
      <ul className="jn-goals">
        {list.map((g) => (
          <li key={g.id}>
            <img alt="" src={icon(g.icon)} />
            <div>
              <div className="jn-goal-row">
                <span>{g.title}</span>
                <span>{g.label}</span>
              </div>
              <div className="jn-near-bar">
                <i style={{ width: `${Math.min(100, (g.have / g.need) * 100)}%`, background: g.color }} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
