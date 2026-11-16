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
import { chestIcon, COIN_ICON, HOMES, homeIcon, itemById, itemIcon, medalIcon, PETS, petIcon } from '../jornada/catalog';
import { journeyNews, newsDiff, showWeekSummary, weekSummary } from '../jornada/home';
import { acquire, acquirePlace, shopContext, TITLES, type Chest } from '../jornada/rules';
import { weekStart } from '../review';
import { ChestOpen, CHEST_INFO } from './JornadaBaus';
import { confetti } from './jornadaFx';

const fmt = (n: number) => n.toLocaleString('pt-BR');

export function JornadaEventos() {
  const { data, update } = useStore();
  const today = todayISO();
  const news = journeyNews(data, data.journey, today);
  const prev = useRef(news);
  const [title, setTitle] = useState<string | null>(null);
  const [opening, setOpening] = useState<Chest | null>(null);
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

  const key = JSON.stringify([news.titles, news.free, news.forge, news.chests.map((c) => c.key)]);
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
    for (const id of diff.free) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const closeWeek = () => {
    setWeek(null);
    update((d) => ({ ...d, journey: { ...d.journey, weekSeen: weekStart(todayISO()) } }));
  };

  return (
    <>
      {title && <TitleScreen id={title} onClose={() => setTitle(null)} />}
      {opening && <ChestOpen chest={opening} onClose={() => setOpening(null)} />}
      {week && ready && !title && <WeekScreen w={week} pending={news.chests.length} onClose={closeWeek} />}
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
