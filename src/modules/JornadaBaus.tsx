/**
 * Jornada (N2.17c): baús como na "Prévia da Jornada". Lista em cartões coloridos, "Abrir todos",
 * "Como ganhar", "Já abertos" e a abertura em tela cheia (faíscas, o que saiu e "Vestir").
 */
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { formatDMY, todayISO } from '../utils';
import { Fullscreen, notify } from '../ui';
import { journeyStats } from '../journey';
import { chestIcon, COIN_ICON, GEM_ICON, itemById, itemIcon, RARITY, RING2_LEVEL, SLOT_NAMES, type Item } from '../jornada/catalog';
import { equip, openChest, openChests, pendingChests, snapshot, wallet, type Chest, type ChestKind, type ChestRecord, type EquipSlot } from '../jornada/rules';

const fmt = (n: number) => n.toLocaleString('pt-BR');
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const CHEST_INFO: Record<ChestKind, { name: string; how: string; gives: string }> = {
  bronze: { name: 'Baú de bronze', how: '7 dias seguidos de rituais ou hábitos · 7º dia do presente do dia', gives: 'ouro e, às vezes, um item comum' },
  prata: { name: 'Baú de prata', how: '30 dias de consistência · revisão semanal com 80% da rotina · 25% do Codex', gives: 'ouro e um item raro' },
  dourado: { name: 'Baú dourado', how: 'A cada 5 níveis · mês com todas as contas em dia · 50% do Codex', gives: 'item raro ou épico garantido' },
  cristal: { name: 'Baú de cristal', how: '7, 14, 30 e 60 dias sem um hábito a abandonar · 75% do Codex', gives: 'épico garantido e cristais' },
};

const SPARKS = { cristal: ['#67e8f9', '#f0abfc', '#ecfeff'], outro: ['#fde047', '#facc15', '#fff7ed'] };

function Sparks({ kind }: { kind: ChestKind }) {
  const colors = kind === 'cristal' ? SPARKS.cristal : SPARKS.outro;
  return (
    <div className="jn-sparks" aria-hidden="true">
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const r = 70 + (i % 3) * 22;
        return <i key={i} style={{ background: colors[i % 3], ['--dx' as string]: `${Math.round(Math.cos(a) * r)}px`, ['--dy' as string]: `${Math.round(Math.sin(a) * r)}px`, animationDelay: `${(i % 4) * 0.03}s` }} />;
      })}
    </div>
  );
}

/** Onde vestir um item que acabou de sair (segundo anel, se o primeiro já estiver ocupado). */
function slotFor(item: Item, eq: Record<string, string | null>, level: number): EquipSlot {
  return item.slot === 'anel' && eq.anel && eq.anel !== item.id && !eq.anel2 && level >= RING2_LEVEL ? 'anel2' : item.slot;
}

/** Abertura de um baú em tela cheia: toque, ele treme, abre com faíscas e mostra o que saiu. */
export function ChestOpen({ chest, onClose }: { chest: Chest; onClose: () => void }) {
  const { data, update } = useStore();
  const [phase, setPhase] = useState<'idle' | 'shake' | 'open'>('idle');
  const [rec, setRec] = useState<ChestRecord | null>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const open = () => {
    if (phase !== 'idle') return;
    const today = todayISO();
    let r: ChestRecord | null = null;
    update((d) => {
      if (d.journey.chests.some((x) => x.key === chest.key)) return d;
      const o = openChest(d.journey, chest, today);
      r = o.record;
      const next = { ...d, journey: o.state };
      return { ...next, journey: { ...o.state, lastSeen: snapshot(next, o.state, today) } };
    });
    setRec(r ?? openChest(data.journey, chest, today).record);
    setPhase('shake');
    if (reduced()) return setPhase('open');
    timers.current.push(window.setTimeout(() => setPhase('open'), 650));
  };
  const item = rec?.item ? itemById(rec.item) : null;
  const w = wallet(data, data.journey);
  const wear = () => {
    if (!item) return;
    update((d) => {
      const r = equip(d.journey, slotFor(item, d.journey.equipped, 999), item.id, journeyStats(d, todayISO()).level);
      if (typeof r === 'string') {
        notify('Não deu', r);
        return d;
      }
      notify(`Vestindo: ${item.name}`, 'Veja na cena e na tela cheia.');
      return { ...d, journey: r };
    });
    onClose();
  };
  return (
    <Fullscreen label={CHEST_INFO[chest.kind].name} className="jn-open-fs" onClose={onClose}>
      <div className="jn-open-center">
        <span className="jn-eyebrow jn-px">{CHEST_INFO[chest.kind].name.toUpperCase()}</span>
        <p className="muted">{chest.reason}</p>
        <div className={`jn-chest-stage${phase === 'open' ? ' open' : ''}`}>
          <i className="jn-rays" />
          <button type="button" className={`jn-chest ${phase === 'idle' ? 'idle' : phase === 'shake' ? 'shake' : 'pop'}`} aria-label="Abrir o baú" onClick={open}>
            <img alt="" src={chestIcon(chest.kind, phase === 'open')} />
          </button>
          {phase === 'idle' && <span className="jn-hint jn-px">TOQUE!</span>}
          {phase === 'open' && !reduced() && <Sparks kind={chest.kind} />}
        </div>
        {phase === 'open' && rec && (
          <div className="jn-loot">
            {item && (
              <div className="jn-loot-row">
                <img alt="" src={itemIcon(item)} />
                <div>
                  <strong>{item.name}</strong>
                  <span style={{ color: RARITY[item.rarity].color }}>
                    {RARITY[item.rarity].label} · {SLOT_NAMES[item.slot]}
                    {item.effect ? ` · ${item.effect}` : ''}
                  </span>
                </div>
              </div>
            )}
            <div className="jn-loot-row" style={{ animationDelay: '0.18s' }}>
              <img alt="" src={COIN_ICON} />
              <div>
                <strong>+{fmt(rec.gold)} ouro</strong>
                <span className="muted small">Total: {fmt(w.gold)}</span>
              </div>
            </div>
            {rec.crystals > 0 && (
              <div className="jn-loot-row" style={{ animationDelay: '0.36s' }}>
                <img alt="" src={GEM_ICON} />
                <div>
                  <strong>+{rec.crystals} {rec.crystals === 1 ? 'cristal' : 'cristais'}</strong>
                  <span className="muted small">Total: {fmt(w.crystals)} · use na forja mística</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="jn-open-actions">
        {phase !== 'open' ? (
          <button type="button" className="btn block" onClick={onClose} disabled={phase === 'shake'}>
            Abrir depois
          </button>
        ) : (
          <>
            {item && (
              <button type="button" className="btn primary block" onClick={wear}>
                Vestir {item.name.toLowerCase()}
              </button>
            )}
            <button type="button" className={`btn block${item ? '' : ' primary'}`} onClick={onClose}>
              Continuar
            </button>
          </>
        )}
      </div>
    </Fullscreen>
  );
}

/** "Abrir todos": abre de uma vez e mostra o resumo, com confete. */
export function OpenAll({ chests, onClose }: { chests: Chest[]; onClose: () => void }) {
  const { data, update } = useStore();
  // O conteúdo é sempre o mesmo para o mesmo baú: calcula uma vez e grava (gravar de novo não muda nada).
  const [list] = useState<ChestRecord[]>(() => openChests(data.journey, chests, todayISO()).records);
  useEffect(() => {
    const today = todayISO();
    update((d) => {
      const o = openChests(d.journey, chests, today);
      if (!o.records.length) return d;
      const next = { ...d, journey: o.state };
      return { ...next, journey: { ...o.state, lastSeen: snapshot(next, o.state, today) } };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const items = list.map((r) => (r.item ? itemById(r.item) : null)).filter((x): x is Item => !!x);
  const gold = list.reduce((a, r) => a + r.gold, 0);
  const gems = list.reduce((a, r) => a + r.crystals, 0);
  const w = wallet(data, data.journey);
  return (
    <Fullscreen label="Baús abertos" className="jn-open-fs" onClose={onClose}>
      <div className="jn-open-center top">
        {!reduced() && (
          <div className="jn-confetti" aria-hidden="true">
            {Array.from({ length: 28 }, (_, i) => (
              <i key={i} style={{ left: `${(i * 37) % 100}%`, background: ['#facc15', '#22c55e', '#67e8f9', '#f472b6', '#a78bfa'][i % 5], animationDelay: `${(i % 7) * 0.12}s` }} />
            ))}
          </div>
        )}
        <span className="jn-eyebrow jn-px">{list.length} BAÚS ABERTOS</span>
        <div className="jn-open-chests">
          {list.map((r, i) => (
            <img key={r.key} alt="" src={chestIcon(r.kind, true)} style={{ animationDelay: `${(i * 0.04).toFixed(2)}s` }} />
          ))}
        </div>
        <div className="jn-loot">
          {items.map((it, i) => (
            <div key={it.id} className="jn-loot-row" style={{ animationDelay: `${i * 0.12}s` }}>
              <img alt="" src={itemIcon(it)} />
              <div>
                <strong>{it.name}</strong>
                <span style={{ color: RARITY[it.rarity].color }}>
                  {RARITY[it.rarity].label} · {SLOT_NAMES[it.slot]}
                </span>
              </div>
            </div>
          ))}
          <div className="jn-loot-row" style={{ animationDelay: `${items.length * 0.12}s` }}>
            <img alt="" src={COIN_ICON} />
            <div>
              <strong>+{fmt(gold)} ouro</strong>
              <span className="muted small">Total: {fmt(w.gold)}</span>
            </div>
          </div>
          {gems > 0 && (
            <div className="jn-loot-row" style={{ animationDelay: `${(items.length + 1) * 0.12}s` }}>
              <img alt="" src={GEM_ICON} />
              <div>
                <strong>+{gems} {gems === 1 ? 'cristal' : 'cristais'}</strong>
                <span className="muted small">Total: {fmt(w.crystals)}</span>
              </div>
            </div>
          )}
        </div>
        {items.length > 0 && <p className="muted small center">Os itens já estão no Arsenal.</p>}
      </div>
      <div className="jn-open-actions">
        <button type="button" className="btn primary block" onClick={onClose}>
          Continuar
        </button>
      </div>
    </Fullscreen>
  );
}

/** Cartão de um baú fechado (também usado nos avisos da tela principal). */
export function ChestCard({ chest, onOpen }: { chest: Chest; onOpen: () => void }) {
  return (
    <div className={`jn-notice${chest.kind === 'cristal' ? ' gem' : ''}`}>
      <img className="chest" alt="" src={chestIcon(chest.kind, false)} />
      <div>
        <strong>{CHEST_INFO[chest.kind].name}</strong>
        <span className="muted small">{chest.reason}</span>
      </div>
      <button type="button" className="btn primary small" onClick={onOpen}>
        Abrir
      </button>
    </div>
  );
}

/** Tela Baús. */
export function BausView() {
  const { data } = useStore();
  const today = todayISO();
  const state = data.journey;
  const level = journeyStats(data, today).level;
  const chests = pendingChests(data, state, today, level);
  const [opening, setOpening] = useState<Chest | null>(null);
  const [all, setAll] = useState<Chest[] | null>(null);
  const opened = [...state.chests].reverse().slice(0, 12);
  return (
    <>
      <div className="jn-baus-head">
        <h2 className="jn-px">Baús</h2>
        <p className="muted">Ganhos com a sua rotina. O mesmo baú sempre tem o mesmo conteúdo, então não adianta fechar e abrir de novo.</p>
      </div>
      {chests.length > 1 && (
        <button type="button" className="btn primary block" onClick={() => setAll(chests)}>
          Abrir todos os {chests.length} baús
        </button>
      )}
      {chests.length ? (
        <div className="jn-notices">
          {chests.map((c) => (
            <ChestCard key={c.key} chest={c} onOpen={() => setOpening(c)} />
          ))}
        </div>
      ) : (
        <div className="jn-empty">Nenhum baú fechado agora. O próximo de bronze vem com 7 dias seguidos de rotina, ou no 7º dia do presente do dia.</div>
      )}

      <section className="card">
        <div className="card-head">
          <h2>Como ganhar</h2>
        </div>
        {(Object.keys(CHEST_INFO) as ChestKind[]).map((k) => (
          <div key={k} className="jn-chest-kind">
            <img alt="" src={chestIcon(k, false)} />
            <div>
              <strong>{CHEST_INFO[k].name}</strong>
              <span className="muted small">{CHEST_INFO[k].how}</span>
              <span className="small">Vem: {CHEST_INFO[k].gives}</span>
            </div>
          </div>
        ))}
        <p className="muted small">Abandonar um hábito ruim é o caminho mais difícil, por isso o baú de cristal é o melhor.</p>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Já abertos</h2>
          <span className="muted small">{state.chests.length}</span>
        </div>
        {opened.length ? (
          <ul className="jn-history">
            {opened.map((o) => {
              const it = o.item ? itemById(o.item) : null;
              return (
                <li key={o.key}>
                  <img alt="" src={chestIcon(o.kind, true)} />
                  <span className="grow">
                    {CHEST_INFO[o.kind].name.replace('Baú de ', '').replace('Baú ', '')} · {formatDMY(o.openedAt).slice(0, 5)}
                  </span>
                  <span className="muted small">
                    {it ? `${it.name} · ` : ''}+{fmt(o.gold)} ouro{o.crystals ? ` · +${o.crystals} ◆` : ''}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <span className="muted small">Os baús que você abrir aparecem aqui.</span>
        )}
      </section>

      {opening && <ChestOpen chest={opening} onClose={() => setOpening(null)} />}
      {all && <OpenAll chests={all} onClose={() => setAll(null)} />}
    </>
  );
}
