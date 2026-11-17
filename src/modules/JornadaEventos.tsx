/**
 * Jornada (N2.17d): novidades na hora, como na "Prévia da Jornada". Quando algo novo acontece
 * (título, item liberado, místico pronto, baú novo), aparece um aviso com botão; título novo ganha
 * uma tela com a medalha. Uma vez por semana, o Resumo da semana em tela cheia.
 */
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { go } from '../router';
import { formatDMY, todayISO } from '../utils';
import { Fullscreen, notify } from '../ui';
import { ATTRIBUTES } from '../habits';
import { chestIcon, COIN_ICON, RARITY, HOMES, homeIcon, itemById, itemIcon, medalIcon, PETS, petIcon, jarIcon, bossIcon } from '../jornada/catalog';
import { journeyNews, newsDiff, showWeekSummary, weekSummary } from '../jornada/home';
import { acquire, acquirePlace, equip, petGoals, shopContext, TITLES, type Chest } from '../jornada/rules';
import { LORE } from '../jornada/lore';
import { PetEditor } from './JornadaPets';
import { BossAppear, ChapterDone } from './JornadaCampanha';
import { campaign } from '../jornada/campaign';
import { weekStart } from '../review';
import { ChestOpen, CHEST_INFO } from './JornadaBaus';
import { confetti } from './jornadaFx';
import { balance } from '../boxes';

const fmt = (n: number) => n.toLocaleString('pt-BR');

export function JornadaEventos() {
  const { data, update } = useStore();
  const today = todayISO();
  const news = journeyNews(data, data.journey, today);
  // Caixinhas: guardar e realizar acontecem em Finanças; o que ainda não foi comemorado aparece ao voltar.
  const seen = data.journey.boxSeen;
  const prev = useRef({ ...news, boxGoals: news.boxGoals.filter((id) => seen.includes(`meta:${id}`)), realized: news.realized.filter((id) => seen.includes(`real:${id}`)) });
  const [title, setTitle] = useState<string | null>(null);
  const [opening, setOpening] = useState<Chest | null>(null);
  const [petNew, setPetNew] = useState<string | null>(null);
  const [petEdit, setPetEdit] = useState<string | null>(null);
  const [boxEv, setBoxEv] = useState<{ kind: 'meta' | 'realizado'; id: string } | null>(null);
  const [week, setWeek] = useState(() => (showWeekSummary(data.journey, today) ? weekSummary(data, today) : null));

  // Mostra o resumo depois da entrada (portal) e da arrumação da página, para não ser fechado por ela.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 1200);
    return () => window.clearTimeout(t);
  }, []);

  // Semana sem nada para resumir: marca como vista, sem mostrar.
  useEffect(() => {
    if (!week && showWeekSummary(data.journey, today)) update((d) => ({ ...d, journey: { ...d.journey, weekSeen: weekStart(todayISO()) } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const key = JSON.stringify([news.titles, news.free, news.forge, news.chests.map((c) => c.key), news.boxGoals, news.realized]);
  useEffect(() => {
    const diff = newsDiff(prev.current, news);
    prev.current = news;
    const take = (fn: (d: typeof data) => ReturnType<typeof acquire>, ok: string) =>
      update((d) => {
        const r = fn(d);
        if (typeof r === 'string') {
          notify('Não deu', r);
          return d;
        }
        notify(ok);
        return { ...d, journey: r };
      });
    // Pet novo: tela "Novo companheiro!" (os outros liberados viram aviso com "Pegar").
    const newPet = diff.free.find((id) => PETS.some((p) => p.id === id));
    if (newPet) setPetNew(newPet);
    for (const id of diff.free) {
      if (id === newPet) continue;
      const it = itemById(id);
      const pet = PETS.find((p) => p.id === id);
      const home = HOMES.find((h) => h.id === id);
      const name = it?.name ?? pet?.name ?? home?.name ?? id;
      const icon = it ? itemIcon(it) : pet ? petIcon(pet.id) : homeIcon(id);
      const why = it?.attrUnlock ? `Você chegou a ${Object.entries(it.attrUnlock).map(([k, v]) => `${k} ${v}`).join(' e ')}. É seu, de graça.` : 'Liberado pelo nível.';
      notify(`Liberado: ${name}`, why, {
        icon,
        action: { label: 'Pegar', fn: () => take((d) => (it ? acquire(d.journey, id, shopContext(d, d.journey, todayISO())) : acquirePlace(pet ? 'pet' : 'morada', id, d.journey, shopContext(d, d.journey, todayISO()))), `${name} é seu!`) },
      });
    }
    for (const id of diff.forge) {
      const it = itemById(id)!;
      notify(`${it.name} pronta para forjar!`, `Seus atributos chegaram lá. Custa ${it.crystals} cristais.`, {
        icon: itemIcon(it),
        action: { label: 'Forjar', fn: () => take((d) => acquire(d.journey, id, shopContext(d, d.journey, todayISO())), `${it.name} forjada! Está no Arsenal.`) },
      });
    }
    for (const c of diff.chests)
      notify(`Novo baú: ${CHEST_INFO[c.kind].name.replace('Baú de ', '').replace('Baú ', '')}`, c.reason, { icon: chestIcon(c.kind, false), action: { label: 'Abrir', fn: () => setOpening(c) } });
    if (diff.titles.length) setTitle(diff.titles[0]);
    if (diff.realized.length || diff.boxGoals.length) {
      if (diff.realized.length) setBoxEv({ kind: 'realizado', id: diff.realized[0] });
      else setBoxEv({ kind: 'meta', id: diff.boxGoals[0] });
      const add = [...diff.boxGoals.map((id) => `meta:${id}`), ...diff.realized.map((id) => `real:${id}`)];
      update((d) => ({ ...d, journey: { ...d.journey, boxSeen: [...new Set([...d.journey.boxSeen, ...add])] } }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Campanha: região sem chefe com os objetivos cumpridos → tela de região concluída.
  const camp = campaign(data, data.journey, today);
  const campReady = camp.stage === 'pronto';
  const [campShown, setCampShown] = useState(false);
  const bossSoon = camp.stage === 'aparece';
  const [bossShown, setBossShown] = useState(false);
  // Fugiu? Avisa uma vez por fuga (ele volta com a vida cheia; nada se perde).
  const fled = camp.boss?.fled ?? 0;
  useEffect(() => {
    const b = data.journey.camp.boss;
    if (!b || fled <= b.seen) return;
    const ch = camp.chapters[camp.current];
    if (ch.boss) notify(`${ch.boss.name} fugiu`, 'Ele voltou com a vida cheia para uma nova tentativa. Nada do que você ganhou se perde.', { icon: bossIcon(ch.boss.id) });
    update((d) => (d.journey.camp.boss ? { ...d, journey: { ...d.journey, camp: { ...d.journey.camp, boss: { ...d.journey.camp.boss, seen: fled } } } } : d));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fled]);

  const closeWeek = () => {
    setWeek(null);
    update((d) => ({ ...d, journey: { ...d.journey, weekSeen: weekStart(todayISO()) } }));
  };

  return (
    <>
      {petNew && !boxEv && <PetScreen id={petNew} onClose={() => setPetNew(null)} onEdit={(id) => { setPetNew(null); window.setTimeout(() => setPetEdit(id), 250); }} />}
      {petEdit && <PetEditor id={petEdit} onClose={() => setPetEdit(null)} />}
      {bossSoon && ready && !bossShown && !boxEv && !petNew && !title && <BossAppear onClose={() => setBossShown(true)} />}
      {campReady && ready && !campShown && !boxEv && !petNew && !title && <ChapterDone onClose={() => setCampShown(true)} />}
      {boxEv && ready && <BoxScreen ev={boxEv} onClose={() => setBoxEv(null)} />}
      {title && !boxEv && !petNew && <TitleScreen id={title} onClose={() => setTitle(null)} />}
      {opening && <ChestOpen chest={opening} onClose={() => setOpening(null)} />}
      {week && ready && !title && !boxEv && !(campReady && !campShown) && !(bossSoon && !bossShown) && <WeekScreen w={week} pending={news.chests.length} onClose={closeWeek} />}
    </>
  );
}

function TitleScreen({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, update } = useStore();
  const idx = TITLES.findIndex((t) => t.id === id);
  const t = TITLES[idx];
  useEffect(() => confetti(), []);
  if (!t) return null;
  const g = data.journey.avatar?.gender === 'm' ? t.m : t.f;
  const using = data.journey.title === id;
  return (
    <Fullscreen label={`Novo título: ${g}`} className="jn-open-fs" onClose={onClose}>
      <div className="jn-open-center">
        <span className="jn-eyebrow jn-px">NOVO TÍTULO</span>
        <img className="jn-title-medal" alt="" src={medalIcon(idx, true)} />
        <h2 className="jn-px jn-title-name">{g.toUpperCase()}</h2>
        <p className="muted">{t.rule}</p>
        <p className="jn-title-gem">+1 cristal para a forja</p>
      </div>
      <div className="jn-open-actions">
        {!using && (
          <button
            type="button"
            className="btn primary block"
            onClick={() => {
              update((d) => ({ ...d, journey: { ...d.journey, title: id } }));
              notify('Título trocado', `${g} agora aparece embaixo do seu nome.`, { icon: medalIcon(idx, true) });
              onClose();
            }}
          >
            Usar este título
          </button>
        )}
        <button type="button" className={`btn block${using ? ' primary' : ''}`} onClick={onClose}>
          Continuar
        </button>
      </div>
    </Fullscreen>
  );
}

function WeekScreen({ w, pending, onClose }: { w: NonNullable<ReturnType<typeof weekSummary>>; pending: number; onClose: () => void }) {
  useEffect(() => confetti(), []);
  const up = w.levelTo > w.levelFrom;
  return (
    <Fullscreen label="Resumo da semana" className="jn-open-fs" onClose={onClose}>
      <div className="jn-open-center top">
        <span className="jn-eyebrow jn-px">RESUMO DA SEMANA</span>
        <h2 className="jn-week-h">{up ? 'Que semana!' : 'Sua semana'}</h2>
        <p className="muted">
          {formatDMY(w.start).slice(0, 5)} a {formatDMY(w.end).slice(0, 5)} · foi isso que a Jornada guardou:
        </p>
        <div className="jn-week-grid">
          <div>
            <strong className="jn-px" style={{ color: 'var(--jn-xp)' }}>
              +{fmt(w.xp)}
            </strong>
            <span>XP</span>
          </div>
          <div>
            <strong className="jn-px" style={{ color: 'var(--green-text)' }}>
              {up ? `${w.levelFrom} → ${w.levelTo}` : `LV ${w.levelTo}`}
            </strong>
            <span>nível</span>
          </div>
          <div>
            <strong className="jn-px" style={{ color: 'var(--jn-gold)' }}>
              <img alt="" src={COIN_ICON} className="jn-inline-icon" /> +{fmt(w.gold)}
            </strong>
            <span>ouro</span>
          </div>
          <div>
            <strong className="jn-px">{fmt(w.missions)}</strong>
            <span>missões cumpridas</span>
          </div>
        </div>
        {w.attrs.length > 0 && (
          <div className="jn-week-attrs">
            <span className="muted small">Atributos treinados</span>
            <div>
              {w.attrs.map((a) => {
                const at = ATTRIBUTES.find((x) => x.code === a.code)!;
                return (
                  <span key={a.code} className="jn-chip" style={{ color: at.color }}>
                    +{a.gain} {a.code}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        {w.chests > 0 && (
          <div className="jn-loot-row">
            <img alt="" src={chestIcon('dourado', false)} />
            <div>
              <strong>{w.chests === 1 ? '1 baú ganho' : `${w.chests} baús ganhos`}</strong>
              <span className="muted small">{pending ? `${pending} esperando para abrir` : 'Já abertos'}</span>
            </div>
          </div>
        )}
      </div>
      <div className="jn-open-actions">
        <button
          type="button"
          className="btn primary block"
          onClick={() => {
            onClose();
            if (pending) go('jornada/baus');
          }}
        >
          {pending ? 'Abrir os baús' : 'Continuar'}
        </button>
      </div>
    </Fullscreen>
  );
}

/** Caixinha: meta atingida ou objetivo realizado (dinheiro de verdade, fora do jogo). */
function BoxScreen({ ev, onClose }: { ev: { kind: 'meta' | 'realizado'; id: string }; onClose: () => void }) {
  const { data } = useStore();
  const b = data.boxes.find((x) => x.id === ev.id);
  useEffect(() => confetti(), []);
  if (!b) return null;
  const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const meta = ev.kind === 'meta';
  const tIdx = TITLES.findIndex((t) => t.id === (meta ? 'poupadora' : 'realizadora'));
  const t = TITLES[tIdx];
  const g = data.journey.avatar?.gender === 'm' ? t.m : t.f;
  const saved = meta ? balance(b) : b.moves.filter((m) => m.kind === 'retirada' && m.reason === 'realizei').reduce((a, m) => a + m.amount, 0);
  return (
    <Fullscreen label={meta ? 'Meta atingida' : 'Objetivo realizado'} className="jn-open-fs" onClose={onClose}>
      <div className="jn-open-center">
        <span className="jn-eyebrow jn-px">{meta ? 'META ATINGIDA!' : 'OBJETIVO REALIZADO!'}</span>
        <img className="jn-title-medal" alt="" src={meta ? jarIcon(1) : medalIcon(tIdx, true)} />
        <h2 className="jn-week-h">{meta ? b.name : `Você realizou: ${b.name}`}</h2>
        <p className="muted">
          {meta ? (
            <>
              Você juntou <b style={{ color: 'var(--jn-gold)' }}>{money(saved)}</b> de verdade. Isso é seu, fora do jogo.
            </>
          ) : (
            'Juntar para usar é exatamente o objetivo. Essa conquista fica guardada para sempre, mesmo com a caixinha vazia.'
          )}
        </p>
        <div className="jn-loot">
          <div className="jn-loot-row">
            <img alt="" src={meta ? chestIcon('dourado', false) : COIN_ICON} />
            <div>
              <strong>{meta ? 'Baú dourado' : '+200 ouro'}</strong>
              <span className="muted small">{meta ? 'Já espera em Baús' : 'Por realizar o objetivo'}</span>
            </div>
          </div>
          <div className="jn-loot-row" style={{ animationDelay: '0.18s' }}>
            <img alt="" src={medalIcon(tIdx, true)} />
            <div>
              <strong>Título: {g}</strong>
              <span className="muted small">{t.rule} · +1 cristal</span>
            </div>
          </div>
        </div>
      </div>
      <div className="jn-open-actions">
        {!meta && (
          <button
            type="button"
            className="btn primary block"
            onClick={() => {
              onClose();
              go('financas/nova-caixinha');
            }}
          >
            Começar outra caixinha
          </button>
        )}
        <button type="button" className={`btn block${meta ? ' primary' : ''}`} onClick={onClose}>
          Continuar
        </button>
      </div>
    </Fullscreen>
  );
}

/** Pet novo: "Novo companheiro!" com confete. Levar para passear (pega e põe na cena), dar um nome ou deixar para depois. */
function PetScreen({ id, onClose, onEdit }: { id: string; onClose: () => void; onEdit: (id: string) => void }) {
  const { data, update } = useStore();
  const pet = PETS.find((p) => p.id === id);
  useEffect(() => confetti(), []);
  if (!pet) return null;
  const take = () =>
    update((d) => {
      const got = acquirePlace('pet', id, d.journey, shopContext(d, d.journey, todayISO()));
      const j = typeof got === 'string' ? d.journey : got;
      const r = equip(j, 'pet', id, 1);
      return { ...d, journey: typeof r === 'string' ? j : r };
    });
  const lore = LORE[id];
  const goal = petGoals(data, todayISO())[id];
  return (
    <Fullscreen label="Novo companheiro" className="jn-open-fs" onClose={onClose}>
      <div className="jn-open-center">
        <span className="jn-eyebrow jn-px">NOVO COMPANHEIRO!</span>
        <img className="jn-title-medal jn-pet-new" alt="" src={petIcon(id)} />
        <h2 className="jn-week-h">{pet.name}</h2>
        <span style={{ color: RARITY[pet.rarity].color, fontWeight: 700 }}>{RARITY[pet.rarity].label}</span>
        {lore && <p className="muted" style={{ fontStyle: 'italic' }}>“{lore}”</p>}
        {goal?.hint && <p className="muted small">Conquistado por: {goal.hint.charAt(0).toLowerCase() + goal.hint.slice(1)}</p>}
      </div>
      <div className="jn-open-actions">
        <button
          type="button"
          className="btn primary block"
          onClick={() => {
            take();
            notify(`${pet.name} está na cena`, 'Seu novo companheiro já passeia com você.', { icon: petIcon(id) });
            onClose();
          }}
        >
          Levar para passear
        </button>
        <button
          type="button"
          className="btn block"
          onClick={() => {
            take();
            onEdit(id);
          }}
        >
          Dar um nome
        </button>
        <button type="button" className="btn ghost block" onClick={onClose}>
          Depois
        </button>
      </div>
    </Fullscreen>
  );
}
