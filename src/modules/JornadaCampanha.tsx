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
import { campaign, clearChapter, type Chapter } from '../jornada/campaign';
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
              <img className={cleared ? undefined : 'silhouette'} alt="" src={PX.boss(ch.boss.id)} />
              <div>
                <b>{cleared ? ch.boss.name : 'Chefe: ???'}</b>
                <span className="muted small">{cleared ? 'Vencido.' : current && v.stage === 'chefe' ? 'Objetivos cumpridos! O chefe chega na próxima versão da Campanha.' : 'Aparece quando os objetivos terminarem.'}</span>
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
  return (
    <button type="button" className="card jn-campcard" onClick={() => go('jornada/campanha')}>
      <img alt="" src={PX.region(ch.id)} />
      <div>
        <span className="jn-boxeye" style={{ color: '#fca5a5' }}>
          Campanha · capítulo {v.current + 1} de {v.chapters.length}
        </span>
        <strong>{ch.name}</strong>
        <span className="muted small">{v.done ? 'Campanha concluída!' : next ? `Próximo: ${next.title.charAt(0).toLowerCase()}${next.title.slice(1)} (${next.have}/${next.need})` : v.stage === 'chefe' ? 'Objetivos cumpridos! O chefe chega em breve.' : 'Pronto para concluir!'}</span>
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
    notify(`${ch.name} concluída!`, 'O baú da região já espera em Baús. A próxima região abriu no mapa.', { icon: chestIcon(ch.reward.chest, false) });
    onClose();
  };
  if (v.stage !== 'pronto') return null;
  return (
    <Fullscreen label="Região concluída" className="jn-open-fs" onClose={finish}>
      <div className="jn-open-center">
        <span className="jn-eyebrow jn-px">REGIÃO CONCLUÍDA!</span>
        <img className="jn-title-medal" alt="" src={PX.region(ch.id)} />
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
