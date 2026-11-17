/**
 * Jornada (N2.17g2 / N2.10a): Campanha, como na "Prévia da Jornada". Mapa com as regiões da
 * entrevista ligadas por uma trilha; a região atual tem o seu boneco, as concluídas têm bandeira e as
 * próximas ficam com "?". Embaixo, a região escolhida: quem fala, objetivos com o progresso dos seus
 * dados, o chefe (na N2.10b) e as recompensas.
 */
import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { go } from '../router';
import { todayISO } from '../utils';
import { Fullscreen, Icon, notify } from '../ui';
import { avatarIcon, chestIcon, homeIcon, itemById, itemIcon, medalIcon, npcIcon } from '../jornada/catalog';
import { PX } from '../jornada/px';
import { bossDays, bossMax, campaign, clearChapter, startBoss, type Chapter } from '../jornada/campaign';
import { TITLES } from '../jornada/rules';
import { NpcDialog } from './JornadaFala';
import { confetti } from './jornadaFx';

const NPC_NAMES = { lume: 'Mestra Lume', nina: 'Nina, a mercadora', tork: 'Tork, o ferreiro' } as const;
const DECOR: [number, number][] = [[8, 45], [88, 60], [52, 40], [90, 33], [10, 18], [84, 90]];

/** Posições no mapa (de baixo para cima, alternando lados), como na prévia. */
const pos = (i: number, n: number) => ({ x: i === n - 1 ? 44 : i % 2 === 0 ? 24 : 70, y: Math.round(90 - i * (83 / Math.max(1, n - 1))) });

function titleOf(id: string, gender: 'f' | 'm') {
  const i = TITLES.findIndex((t) => t.id === id);
  const t = TITLES[i];
  return { name: t ? (gender === 'm' ? t.m : t.f) : id, icon: medalIcon(Math.max(0, i), true) };
}

function Rewards({ ch, gender }: { ch: Chapter; gender: 'f' | 'm' }) {
  const it = ch.reward.item ? itemById(ch.reward.item) : null;
  const t = titleOf(ch.reward.title, gender);
  const parts = [it?.name, ch.reward.home ? 'Castelo' : null, `título ${t.name}`, `baú ${ch.reward.chest === 'prata' ? 'de prata' : ch.reward.chest === 'cristal' ? 'de cristal' : 'dourado'}`].filter(Boolean);
  return (
    <div className="jn-cp-rewards">
      <span className="muted small">Recompensas</span>
      <div>
        {it && <img alt={it.name} src={itemIcon(it)} />}
        {ch.reward.home && <img alt="Castelo" src={homeIcon(ch.reward.home)} />}
        <img alt="Título" src={t.icon} style={{ width: 22 }} />
        <img alt="Baú" src={chestIcon(ch.reward.chest, false)} />
        <span className="small">{parts.join(' · ')}</span>
      </div>
    </div>
  );
}

export function CampanhaView() {
  const { data, update } = useStore();
  const state = data.journey;
  const today = todayISO();
  const v = campaign(data, state, today);
  const [sel, setSel] = useState(v.current);
  const look = state.avatar!;
  const n = v.chapters.length;
  const cur = v.chapters[v.current];
  const heard = state.camp.intro.includes(cur.id);
  const [talk, setTalk] = useState<{ npc: Chapter['npc']; lines: string[] } | null>(null);
  useEffect(() => {
    if (!v.done && !heard) setTalk({ npc: cur.npc, lines: cur.intro });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur.id]);
  const closeTalk = () => {
    setTalk(null);
    if (!heard) update((d) => ({ ...d, journey: { ...d.journey, camp: { ...d.journey.camp, intro: [...new Set([...d.journey.camp.intro, cur.id])] } } }));
  };
  const ch = v.chapters[sel] ?? cur;
  const cleared = state.camp.cleared.some((c) => c.id === ch.id);
  const current = sel === v.current && !v.done;
  const locked = !cleared && !current;
  const goals = cleared ? ch.goals.map((g) => ({ ...g, have: g.need })) : v.goals;
  const path: { x: number; y: number; done: boolean }[] = [];
  for (let i = 0; i < n - 1; i++) {
    const a = pos(i, n);
    const b = pos(i + 1, n);
    const done = state.camp.cleared.some((c) => c.id === v.chapters[i].id);
    for (let k = 1; k < 9; k++) {
      const t = k / 9;
      path.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t + Math.sin(t * Math.PI) * 4, done });
    }
  }
  const tree = PX.svg(PX.tree(PX.TIMES.manha));
  return (
    <>
      <div className="jn-cp-map" role="group" aria-label="Mapa da campanha">
        <span className="jn-cp-lake" aria-hidden="true" />
        {DECOR.map(([x, y], i) => (
          <img key={i} className="jn-cp-decor" alt="" src={tree} style={{ left: `${x}%`, top: `${y}%` }} />
        ))}
        {path.map((s, i) => (
          <i key={i} className={`jn-cp-step${s.done ? ' done' : ''}`} style={{ left: `${s.x.toFixed(1)}%`, top: `${s.y.toFixed(1)}%` }} />
        ))}
        {v.chapters.map((c, i) => {
          const p = pos(i, n);
          const isDone = state.camp.cleared.some((x) => x.id === c.id);
          const isCur = i === v.current && !v.done;
          const isLocked = !isDone && !isCur;
          return (
            <button
              key={c.id}
              type="button"
              className={`jn-cp-node${isLocked ? ' locked' : ''}${isCur ? ' current' : ''}`}
              aria-pressed={i === sel}
              aria-label={`Capítulo ${i + 1}: ${isLocked ? 'bloqueado' : c.name}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              onClick={() => setSel(i)}
            >
              <span className="pic">
                <img alt="" src={PX.region(c.id)} />
                {isDone && <img className="flag" alt="" src={PX.flag} />}
                {isCur && <img className="me" alt="" src={avatarIcon(look, { elmo: state.equipped.elmo, armadura: state.equipped.armadura, botas: state.equipped.botas, colar: state.equipped.colar })} />}
                {isLocked && <span className="q">?</span>}
              </span>
              <span className="lbl jn-px">{isLocked ? `Capítulo ${i + 1}` : c.name}</span>
            </button>
          );
        })}
      </div>

      {locked ? (
        <section className="card">
          <div className="card-head">
            <h2>Capítulo {sel + 1}</h2>
            <span className="muted small">bloqueado</span>
          </div>
          <p className="muted">Termine {v.chapters[Math.max(0, sel - 1)].name} para abrir esta região. O que tem aqui, só vendo de perto.</p>
          {ch.boss && (
            <div className="jn-cp-boss">
              <img className="silhouette" alt="" src={PX.boss(ch.boss.id)} />
              <span className="muted small">Um chefe espera por você aqui.</span>
            </div>
          )}
        </section>
      ) : (
        <section className="card">
          <div className="card-head">
            <h2>
              {sel + 1}. {ch.name}
            </h2>
            <span className="small" style={{ color: cleared ? 'var(--green-text)' : '#fca5a5', fontWeight: 700 }}>
              {cleared ? 'Concluído' : v.stage === 'chefe' ? 'Chefe' : 'Em andamento'}
            </span>
          </div>
          <span className="muted small">{ch.theme}</span>
          <button type="button" className="jn-npc jn-npc-btn" onClick={() => setTalk({ npc: ch.npc, lines: ch.intro })} aria-label={`Ouvir ${NPC_NAMES[ch.npc]} de novo`}>
            <img alt="" src={npcIcon(ch.npc)} />
            <div>
              <b>{NPC_NAMES[ch.npc]}</b>
              <span>“{ch.intro[ch.intro.length - 1]}”</span>
            </div>
          </button>
          <ul className="jn-goals">
            {goals.map((g) => {
              const ok = g.have >= g.need;
              return (
                <li key={g.key}>
                  <span className={`jn-cp-tick${ok ? ' ok' : ''}`}>{ok && <Icon name="check" size={14} />}</span>
                  <div>
                    <div className="jn-goal-row">
                      <span>{g.title}</span>
                      <span>
                        {g.have}/{g.need}
                      </span>
                    </div>
                    <div className="jn-near-bar">
                      <i style={{ width: `${(g.have / g.need) * 100}%`, background: ok ? 'var(--green)' : '#ef4444' }} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          {ch.boss && (
            <div className="jn-cp-boss">
              <img className={cleared || (current && v.stage === 'chefe') ? undefined : 'silhouette'} alt="" src={PX.boss(ch.boss.id)} />
              <div>
                <b>{cleared || (current && (v.stage === 'chefe' || v.stage === 'aparece')) ? ch.boss.name : 'Chefe: ???'}</b>
                <span className="muted small">
                  {cleared
                    ? 'Vencido.'
                    : current && v.stage === 'chefe' && v.boss
                      ? `Lutando agora: ${v.boss.hp}/${v.boss.max} de vida · ${v.boss.daysLeft <= 1 ? 'último dia' : `${v.boss.daysLeft} dias`}${v.boss.fled ? ` · já fugiu ${v.boss.fled}×` : ''}.`
                      : current && v.stage === 'aparece'
                        ? 'Objetivos cumpridos! Ele aparece quando você abrir a Jornada.'
                        : 'Aparece quando os objetivos terminarem.'}
                </span>
              </div>
            </div>
          )}
          <Rewards ch={ch} gender={look.gender} />
          <p className="muted small">Os objetivos contam o que você faz no app desde que a região abriu.</p>
        </section>
      )}
      {talk && <NpcDialog npc={talk.npc} lines={talk.lines} onDone={closeTalk} />}
    </>
  );
}

/** Cartão da Campanha na tela principal: região atual e o próximo objetivo. */
export function CampCard() {
  const { data } = useStore();
  const v = campaign(data, data.journey, todayISO());
  const ch = v.chapters[v.current];
  const next = v.goals.find((g) => g.have < g.need);
  const done = v.goals.filter((g) => g.have >= g.need).length;
  if (v.stage === 'chefe' && v.boss && ch.boss) {
    const b = v.boss;
    return (
      <button type="button" className="card jn-campcard jn-bosscard" id="jn-bosscard" onClick={() => go('jornada/campanha')}>
        <img className="jn-boss-img" alt={ch.boss.name} src={PX.boss(ch.boss.id)} />
        <div>
          <span className="jn-boxeye" style={{ color: '#fca5a5' }}>
            Chefe · {ch.name}
          </span>
          <strong>{ch.boss.name}</strong>
          <div className="jn-boss-hp" role="progressbar" aria-label="Vida do chefe" aria-valuemin={0} aria-valuemax={b.max} aria-valuenow={b.hp}>
            <i style={{ width: `${(b.hp / b.max) * 100}%` }} />
          </div>
          <span className="small" style={{ color: '#fecaca' }}>
            <b className="tabular">
              {b.hp}/{b.max}
            </b>{' '}
            de vida · cada missão é um golpe · {b.daysLeft <= 1 ? 'último dia' : `${b.daysLeft} dias`}
          </span>
        </div>
      </button>
    );
  }
  return (
    <button type="button" className="card jn-campcard" onClick={() => go('jornada/campanha')}>
      <img alt="" src={PX.region(ch.id)} />
      <div>
        <span className="jn-boxeye" style={{ color: '#fca5a5' }}>
          Campanha · capítulo {v.current + 1} de {v.chapters.length}
        </span>
        <strong>{ch.name}</strong>
        <span className="muted small">{v.done ? 'Campanha concluída!' : next ? `Próximo: ${next.title.charAt(0).toLowerCase()}${next.title.slice(1)} (${next.have}/${next.need})` : v.stage === 'aparece' ? 'Objetivos cumpridos! Um chefe vai aparecer.' : 'Pronto para concluir!'}</span>
        <div className="jn-near-bar">
          <i style={{ width: `${(done / Math.max(1, v.goals.length)) * 100}%`, background: '#ef4444' }} />
        </div>
      </div>
    </button>
  );
}

/** Região concluída (sem chefe): fala de despedida, recompensas e confete. Fica gravada ao fechar. */
export function ChapterDone({ onClose }: { onClose: () => void }) {
  const { data, update } = useStore();
  const v = campaign(data, data.journey, todayISO());
  const ch = v.chapters[v.current];
  const look = data.journey.avatar!;
  useEffect(() => confetti(), []);
  const finish = () => {
    update((d) => {
      const vv = campaign(d, d.journey, todayISO());
      return { ...d, journey: clearChapter(d.journey, vv, todayISO()) };
    });
    notify(`${ch.name} concluída!`, `O baú da região já espera em Baús${ch.reward.item ? ' e o item exclusivo está no Arsenal' : ''}. A próxima região abriu no mapa.`, { icon: chestIcon(ch.reward.chest, false) });
    onClose();
  };
  if (v.stage !== 'pronto') return null;
  return (
    <Fullscreen label="Região concluída" className="jn-open-fs" onClose={finish}>
      <div className="jn-open-center">
        <span className="jn-eyebrow jn-px">{ch.boss ? 'VITÓRIA!' : 'REGIÃO CONCLUÍDA!'}</span>
        <img className={`jn-title-medal${ch.boss ? ' jn-boss-down' : ''}`} alt="" src={ch.boss ? PX.boss(ch.boss.id) : PX.region(ch.id)} />
        {ch.boss && <p className="muted">Você venceu {ch.boss.name}!</p>}
        <h2 className="jn-week-h">{ch.name}</h2>
        <div className="jn-npc">
          <img alt="" src={npcIcon(ch.npc)} />
          <div>
            <b>{NPC_NAMES[ch.npc]}</b>
            <span>{ch.outro.join(' ')}</span>
          </div>
        </div>
        <Rewards ch={ch} gender={look.gender} />
      </div>
      <div className="jn-open-actions">
        <button type="button" className="btn primary block" onClick={finish}>
          Seguir viagem
        </button>
      </div>
    </Fullscreen>
  );
}

/** "Um chefe apareceu!": fala dele e as regras; Enfrentar começa a luta hoje. */
export function BossAppear({ onClose }: { onClose: () => void }) {
  const { data, update } = useStore();
  const today = todayISO();
  const v = campaign(data, data.journey, today);
  const ch = v.chapters[v.current];
  const days = bossDays(ch.id);
  const max = bossMax(data, today, days, data.journey.profile?.pace);
  if (v.stage !== 'aparece' || !ch.boss) return null;
  const fight = () => {
    update((d) => ({ ...d, journey: startBoss(d, d.journey, todayISO()) }));
    onClose();
  };
  return (
    <Fullscreen label="Um chefe apareceu" className="jn-open-fs jn-boss-fs" onClose={fight}>
      <div className="jn-open-center">
        <span className="jn-eyebrow jn-px" style={{ color: '#fca5a5' }}>
          UM CHEFE APARECEU!
        </span>
        <img className="jn-boss-big" alt="" src={PX.boss(ch.boss.id)} />
        <h2 className="jn-week-h">{ch.boss.name}</h2>
        <p className="jn-boss-taunt">“{ch.boss.taunt}”</p>
        <div className="jn-boss-rules">
          <div>
            <b className="jn-px">{max}</b>
            <span>de vida</span>
          </div>
          <div>
            <b className="jn-px">−1</b>
            <span>por missão cumprida</span>
          </div>
          <div>
            <b className="jn-px">{days}</b>
            <span>dias para vencer</span>
          </div>
        </div>
        <p className="muted small">Se o prazo acabar, ele foge e volta com a vida cheia. Você não perde nada.</p>
      </div>
      <div className="jn-open-actions">
        <button type="button" className="btn primary block" onClick={fight}>
          Enfrentar
        </button>
      </div>
    </Fullscreen>
  );
}
