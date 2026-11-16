/**
 * Jornada (N2.1), seguindo a "Prévia da Jornada": desbloqueio animado → criar personagem
 * (passo 1 de 2) → presente de boas-vindas e escolha do pet (passo 2 de 2) → cena com o pet,
 * nível, XP, ouro, cristais e a Ficha com os atributos e a classe.
 */
import '@fontsource/pixelify-sans/latin-600.css';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { journeyStats, unlockProgress, UNLOCK_DAYS, UNLOCK_WINDOW } from '../journey';
import { ATTRIBUTES } from '../habits';
import { formatDMY, todayISO } from '../utils';
import { notify, Segmented, Sheet, Toggle } from '../ui';
import { avatarIcon, chestIcon, COIN_ICON, GEM_ICON, homeIcon, itemById, itemIcon, petIcon, PETS, RARITY, treeIcon, skyPalette, type AvatarLook } from '../jornada/catalog';
import { HAIRS, SKINS } from '../jornada/artData';
import { acquire, availability, equip, shopContext, wardrobeItems, type Availability, type EquipSlot } from '../jornada/rules';
import type { Item, Slot } from '../jornada/catalog';
import { classOf, openChest, pendingChests, recentAttributes, sinceLastVisit, snapshot, TITLES, wallet, welcomed, welcomeState, type Chest, type ChestRecord, type JourneyState, type SinceVisit } from '../jornada/rules';
import { skyAt, starPositions } from '../jornada/sky';
import { MissionsCard, WeekCard } from './JornadaMissoes';
import { go, useRoute } from '../router';
import { journeyTab } from '../jornada/tabs';
import { Entrevista } from './JornadaEntrevista';
import { TelaCheia } from './JornadaTelaCheia';
import { GiftCard, HomesView, PetsView, ShopView } from './JornadaPets';
import { AttrsCard, ClassesView, ForgeView, TitlesView, UnlocksCard } from './JornadaFicha';

type FichaTab = 'ficha' | 'titulos' | 'forja' | 'classes';
import { ChestsReady, DayNumbers, HowToEarn, LevelUpScreen, NearCard } from './JornadaPainel';
import { dayNumbers, streakDays } from '../jornada/home';
import { npcIcon } from '../jornada/catalog';

type Look = { gender: 'f' | 'm'; skin: string; hair: string; name: string };
const fmt = (n: number) => n.toLocaleString('pt-BR');
const SKIN_NAMES: Record<string, string> = { clara: 'Pele clara', media: 'Pele média', escura: 'Pele escura' };
const HAIR_NAMES: Record<string, string> = { castanho: 'Cabelo castanho', preto: 'Cabelo preto', loiro: 'Cabelo loiro', ruivo: 'Cabelo ruivo' };
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const g = (look: { gender: 'f' | 'm' }, f: string, m: string) => (look.gender === 'f' ? f : m);

/** Relógio que muda a cada minuto (o céu acompanha a hora). */
function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

/** Número que sobe contando até o valor (sem animação com "menos movimento"). */
function CountUp({ to, delay = 0 }: { to: number; delay?: number }) {
  const [v, setV] = useState(() => (reduced() ? to : 0));
  useEffect(() => {
    if (reduced()) return setV(to);
    let raf = 0;
    const start = window.setTimeout(() => {
      const t0 = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / 1100);
        setV(Math.round(to * (1 - Math.pow(1 - k, 3))));
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => {
      window.clearTimeout(start);
      cancelAnimationFrame(raf);
    };
  }, [to, delay]);
  return <>{fmt(v)}</>;
}

// ---------- Desbloqueio ----------

/** Tela do desbloqueio: os dias de uso acendem, os números sobem contando e a pessoa escolhe. */
export function JornadaUnlock() {
  const { data, update } = useStore();
  const today = todayISO();
  const prog = unlockProgress(data, today);
  const s = journeyStats(data, today);
  const active = prog.days.map((d, i) => (d.active ? i : -1)).filter((i) => i >= 0);
  const [lit, setLit] = useState(() => (reduced() ? active.length : 0));
  const [later, setLater] = useState(false);
  useEffect(() => {
    if (reduced()) return;
    const t = window.setInterval(() => setLit((n) => (n >= active.length ? n : n + 1)), 70);
    return () => window.clearInterval(t);
  }, [active.length]);
  const on = new Set(active.slice(0, lit));
  const choose = (c: 'quero' | 'depois') => update((d) => ({ ...d, settings: { ...d.settings, journeyChoice: c } }));
  return (
    <div className="jn-flow">
      <div className="jn-col">
        <span className="jn-eyebrow">
          {prog.active} de {UNLOCK_WINDOW} dias
        </span>
        <h1 className="jn-px jn-h1">Jornada desbloqueada!</h1>
        <p className="muted">
          Você registrou algo em {prog.active} dos últimos {UNLOCK_WINDOW} dias (eram precisos {UNLOCK_DAYS}). Esse é o seu calendário:
        </p>
      </div>
      <div className="jn-cal" aria-label={`${prog.active} dias com uso nos últimos ${UNLOCK_WINDOW}`}>
        {prog.days.map((d, i) => (
          <i key={d.day} className={on.has(i) ? 'on' : ''} />
        ))}
      </div>
      <section className="card">
        <div className="card-head">
          <h2>Com o que você já fez, {g(data.journey.avatar ?? { gender: 'f' }, 'sua personagem', 'seu personagem')} teria</h2>
        </div>
        <div className="jn-retro">
          <div>
            <strong style={{ color: 'var(--jn-xp)' }}>
              <CountUp to={s.xp} delay={1200} />
            </strong>
            <span>XP</span>
          </div>
          <div>
            <strong style={{ color: 'var(--green)' }}>
              <CountUp to={s.level} delay={1200} />
            </strong>
            <span>nível</span>
          </div>
          <div>
            <strong style={{ color: 'var(--jn-gold)' }}>
              <CountUp to={s.gold} delay={1200} />
            </strong>
            <span>ouro</span>
          </div>
        </div>
        {s.sources.length > 0 && (
          <ul className="jn-sources">
            {s.sources.map((src) => (
              <li key={src.id}>
                <span>
                  {src.label} · {src.count}×
                </span>
                <span>+{fmt(src.xp)} XP</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <ul className="jn-promises">
        <li>Faltar nunca tira XP, ouro ou itens.</li>
        <li>Gastar dinheiro não dá pontos. Pagar conta no prazo, sim.</li>
        <li>Dá para pausar a Jornada quando quiser.</li>
      </ul>
      {later && <p className="muted small">Tudo bem! A Jornada fica aqui quando você quiser. Nada do que você fez se perde.</p>}
      <div className="jn-foot">
        <button type="button" className="btn primary block" onClick={() => choose('quero')}>
          Quero a Jornada
        </button>
        <button
          type="button"
          className="btn ghost block"
          onClick={() => {
            setLater(true);
            choose('depois');
          }}
        >
          Agora não
        </button>
      </div>
    </div>
  );
}

// ---------- Criar personagem ----------

function Swatches({ label, names, colors, value, onChange }: { label: string; names: Record<string, string>; colors: Record<string, string>; value: string; onChange: (v: string) => void }) {
  return (
    <div className="jn-field">
      <span>{label}</span>
      <div className="jn-swatches" role="group" aria-label={label}>
        {Object.keys(colors).map((k) => (
          <button key={k} type="button" aria-pressed={value === k} aria-label={names[k] ?? k} style={{ background: colors[k] }} onClick={() => onChange(k)} />
        ))}
      </div>
    </div>
  );
}

function Steps({ n }: { n: 1 | 2 }) {
  return (
    <div className="jn-steps">
      <span>Passo {n} de 2</span>
      <div className="jn-dots">
        <i className="on" />
        <i className={n === 2 ? 'on' : ''} />
      </div>
    </div>
  );
}

function CreateStep({ look, setLook, step, onNext, nextLabel, onCancel }: { look: Look; setLook: (l: Look) => void; step?: 1; onNext: () => void; nextLabel: string; onCancel?: () => void }) {
  const hero = useRef<HTMLImageElement>(null);
  const change = (l: Look) => {
    setLook(l);
    const el = hero.current;
    if (!el || reduced()) return;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  };
  return (
    <div className="jn-flow">
      {step && <Steps n={1} />}
      <h1 className="jn-px jn-h1">{onCancel ? 'Mudar aparência' : g(look, 'Crie sua personagem', 'Crie seu personagem')}</h1>
      <div className="jn-pedestal">
        <i className="jn-pcloud" style={{ left: '10%', top: '16%', width: 70 }} />
        <i className="jn-pcloud" style={{ left: '62%', top: '30%', width: 90, animationDelay: '-5s' }} />
        <img ref={hero} className="jn-hero" alt="Prévia do avatar" src={avatarIcon(look, {})} />
        {look.name.trim() && <span className="jn-tag">{look.name.trim()}</span>}
      </div>
      <div className="jn-field">
        <span>Corpo</span>
        <div className="jn-seg" role="group" aria-label="Corpo">
          {(['f', 'm'] as const).map((x) => (
            <button key={x} type="button" aria-pressed={look.gender === x} onClick={() => change({ ...look, gender: x })}>
              {x === 'f' ? 'Feminino' : 'Masculino'}
            </button>
          ))}
        </div>
      </div>
      <Swatches label="Pele" names={SKIN_NAMES} colors={Object.fromEntries(Object.entries(SKINS).map(([k, v]) => [k, v[0]]))} value={look.skin} onChange={(skin) => change({ ...look, skin })} />
      <Swatches label="Cabelo" names={HAIR_NAMES} colors={HAIRS} value={look.hair} onChange={(hair) => change({ ...look, hair })} />
      <div className="jn-field">
        <label htmlFor="jn-nome">Nome</label>
        <input id="jn-nome" className="input" maxLength={14} autoComplete="off" placeholder={g(look, 'Como quer ser chamada?', 'Como quer ser chamado?')} value={look.name} onChange={(e) => setLook({ ...look, name: e.target.value })} />
      </div>
      {!onCancel && <p className="muted small">Roupa, armas, pet e casa você conquista usando o app. Dá para mudar o visual depois.</p>}
      <div className="jn-foot">
        <button type="button" className="btn primary block" onClick={onNext}>
          {nextLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn ghost block" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- Presente de boas-vindas e pet ----------

const SPARK_COLORS = ['#fde047', '#facc15', '#fff7ed', '#4ade80'];

function WelcomeStep({ onDone }: { onDone: (pet: 'gato' | 'cao') => void }) {
  const [phase, setPhase] = useState<'idle' | 'shake' | 'open'>('idle');
  const [showPets, setShowPets] = useState(false);
  const [pet, setPet] = useState<'gato' | 'cao' | null>(null);
  const [sparks, setSparks] = useState<{ x: number; y: number; c: string }[]>([]);
  const petsRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const later = (fn: () => void, ms: number) => {
    if (reduced()) return fn();
    timers.current.push(window.setTimeout(fn, ms));
  };
  const open = () => {
    if (phase !== 'idle') return;
    setPhase('shake');
    later(() => {
      setPhase('open');
      if (!reduced())
        setSparks(
          Array.from({ length: 28 }, (_, i) => {
            const a = Math.random() * Math.PI * 2;
            const d = 70 + Math.random() * 110;
            return { x: Math.cos(a) * d, y: Math.sin(a) * d, c: SPARK_COLORS[i % SPARK_COLORS.length] };
          }),
        );
      later(() => setSparks([]), 1000);
      later(() => {
        setShowPets(true);
        later(() => petsRef.current?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' }), 50);
      }, 1300);
    }, 650);
  };
  const boots = itemById('couro')!;
  const petName = (id: string) => PETS.find((p) => p.id === id)!.name;
  return (
    <div className="jn-flow">
      <Steps n={2} />
      <div className="jn-col">
        <h1 className="jn-px jn-h1">Presente de boas-vindas</h1>
        <p className="muted">Toque no baú para abrir.</p>
      </div>
      <div className={`jn-chest-stage${phase === 'open' ? ' open' : ''}`}>
        <i className="jn-rays" />
        <button type="button" className={`jn-chest ${phase === 'idle' ? 'idle' : phase === 'shake' ? 'shake' : 'pop'}`} aria-label="Abrir o baú de boas-vindas" onClick={open}>
          <img alt="" src={chestIcon('dourado', phase === 'open')} />
        </button>
        {phase === 'idle' && <span className="jn-hint jn-px">TOQUE!</span>}
        <div className="jn-sparks">
          {sparks.map((s, i) => (
            <i key={i} style={{ '--x': `${s.x}px`, '--y': `${s.y}px`, '--c': s.c } as React.CSSProperties} />
          ))}
        </div>
      </div>
      {phase === 'open' && (
        <div className="jn-loot">
          <div className="jn-loot-row" style={{ animationDelay: '0s' }}>
            <img alt="" src={itemIcon(boots)} />
            <div>
              <strong>{boots.name}</strong>
              <span style={{ color: RARITY[boots.rarity].color }}>{RARITY[boots.rarity].label}</span>
            </div>
          </div>
          <div className="jn-loot-row" style={{ animationDelay: '0.18s' }}>
            <img alt="" src={COIN_ICON} />
            <div>
              <strong>+50 ouro</strong>
              <span className="muted small">Para gastar na loja</span>
            </div>
          </div>
          <div className="jn-loot-row" style={{ animationDelay: '0.36s' }}>
            <img alt="" src={GEM_ICON} />
            <div>
              <strong>+1 cristal</strong>
              <span className="muted small">Moeda da forja mística</span>
            </div>
          </div>
        </div>
      )}
      {showPets && (
        <div ref={petsRef} className="jn-col">
          <h2 className="jn-px" style={{ fontSize: 22 }}>
            Escolha seu pet
          </h2>
          <p className="muted small">Ele passeia na sua cena e fica feliz nos dias em que você registra algo. Nunca fica triste nem some.</p>
          <div className="jn-pet-pick">
            {(['gato', 'cao'] as const).map((id) => (
              <button key={id} type="button" aria-pressed={pet === id} onClick={() => setPet(id)}>
                <span className="jn-meadow">
                  <img alt="" src={petIcon(id)} />
                </span>
                <strong>{petName(id)}</strong>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="jn-foot">
        <button type="button" className="btn primary block" disabled={!pet} onClick={() => pet && onDone(pet)}>
          {pet ? `Começar a Jornada com o ${petName(pet).toLowerCase()}` : phase === 'open' ? 'Escolha um pet' : 'Abra o baú'}
        </button>
      </div>
    </div>
  );
}

// ---------- Cena ----------

export function JourneyScene({ look, state, activeDays, now }: { look: AvatarLook; state: JourneyState; activeDays: string[]; now: Date }) {
  const sky = skyAt(now, activeDays, state.weather);
  const phase = sky.rain ? 'chuva' : sky.phase;
  const t = skyPalette(phase);
  const night = sky.phase === 'noite';
  const outfit = { elmo: state.equipped.elmo, armadura: state.equipped.armadura, botas: state.equipped.botas, arma: state.equipped.arma };
  const label = `${night ? 'Noite' : sky.phase === 'tarde' ? 'Fim de tarde' : 'Manhã'}${sky.rain ? ' com chuva' : ''}${sky.rainbow ? ' com arco-íris' : ''}${night ? `, ${sky.stars} ${sky.stars === 1 ? 'estrela' : 'estrelas'}` : ''}`;
  return (
    <div className="jn-scene" role="img" aria-label={`Cena da Jornada: ${label}`} style={{ background: `linear-gradient(${t.sky1}, ${t.sky2})` }}>
      {night &&
        starPositions(sky.stars).map((s, i) => (
          <span key={i} className={`jn-star${s.big ? ' big' : ''}`} style={{ left: `${s.x}%`, top: `${s.y * 0.7}%`, animationDelay: `${s.delay}s` }} />
        ))}
      {!sky.rain && <span className={`jn-sun${night ? ' moon' : ''}`} style={{ background: t.sun }} />}
      {!night && (
        <>
          <i className="jn-pcloud" style={{ background: t.cloud, left: '12%', top: '14%', width: 60 }} />
          <i className="jn-pcloud" style={{ background: t.cloud, left: '56%', top: '26%', width: 80, animationDelay: '-5s' }} />
        </>
      )}
      {sky.rainbow && <span className="jn-rainbow" />}
      <div className="jn-ground" style={{ background: t.ground, borderTopColor: t.grass }} />
      <img className="jn-home" src={homeIcon(state.equipped.morada, phase)} alt="" />
      <img className="jn-tree" src={treeIcon(phase)} alt="" />
      <img className="jn-avatar" src={avatarIcon(look, outfit)} alt="" />
      {state.equipped.pet && <img className="jn-pet" src={petIcon(state.equipped.pet, state.petStyle[state.equipped.pet])} alt="" />}
      {sky.rain && <div className="jn-rain" />}
    </div>
  );
}

// ---------- Jornada ----------

export function JornadaHome() {
  const { data, update } = useStore();
  const now = useNow();
  const today = todayISO();
  const state = data.journey;
  const [draft, setDraft] = useState<Look>(() => state.avatar ?? { gender: 'f', skin: 'media', hair: 'castanho', name: '' });
  const [step, setStep] = useState<'create' | 'welcome'>('create');
  const [editing, setEditing] = useState(false);
  const [interviewing, setInterviewing] = useState(false);
  const [fichaTab, setFichaTab] = useState<FichaTab>('ficha');
  const top = () => window.scrollTo({ top: 0 });
  // N2.3: o resumo usa o retrato da visita anterior; logo ao entrar, o retrato passa a ser o de agora.
  const [since, setSince] = useState<SinceVisit | null>(() => (welcomed(state) ? sinceLastVisit(state.lastSeen, snapshot(data, state, today)) : null));
  const [opening, setOpening] = useState<Chest | null>(null);
  const [slot, setSlot] = useState<Slot>('armadura');
  const [trying, setTrying] = useState<Item | null>(null);
  const [full, setFull] = useState(false);
  const route = useRoute();
  const tab = journeyTab(route.sub);
  const arsenalRef = useRef<HTMLElement>(null);
  const chestsRef = useRef<HTMLElement>(null);
  const isWelcomed = welcomed(state);
  useEffect(() => {
    if (isWelcomed) update((d) => ({ ...d, journey: { ...d.journey, lastSeen: snapshot(d, d.journey, todayISO()) } }));
  }, [isWelcomed]); // eslint-disable-line react-hooks/exhaustive-deps
  // N2.13: o primeiro nível visto é marcado em silêncio; depois, cada subida ganha a tela de festa.
  const lvNow = isWelcomed ? journeyStats(data, today).level : 0;
  useEffect(() => {
    if (isWelcomed && state.levelSeen === 0 && lvNow > 0) update((d) => ({ ...d, journey: { ...d.journey, levelSeen: lvNow } }));
  }, [isWelcomed, lvNow, state.levelSeen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!welcomed(state)) {
    if (step === 'create')
      return (
        <CreateStep
          look={draft}
          setLook={setDraft}
          step={1}
          nextLabel="Continuar"
          onNext={() => {
            setStep('welcome');
            top();
          }}
        />
      );
    return (
      <WelcomeStep
        onDone={(pet) => {
          update((d) => ({ ...d, journey: welcomeState(d.journey, draft, pet, today) }));
          top();
        }}
      />
    );
  }

  const look = state.avatar!;
  if (interviewing)
    return (
      <Entrevista
        onDone={() => {
          setInterviewing(false);
          top();
        }}
        onCancel={() => {
          setInterviewing(false);
          top();
        }}
      />
    );

  if (editing)
    return (
      <CreateStep
        look={draft}
        setLook={setDraft}
        nextLabel="Salvar"
        onNext={() => {
          update((d) => ({ ...d, journey: { ...d.journey, avatar: { ...draft, name: draft.name.trim().slice(0, 14) } } }));
          setEditing(false);
          top();
        }}
        onCancel={() => {
          setEditing(false);
          top();
        }}
      />
    );

  const s = journeyStats(data, today);
  const w = wallet(data, state, today);
  const cls = classOf(w.attrs, recentAttributes(data, today));
  const title = TITLES.find((x) => x.id === state.title);
  const gk = look.gender;
  const chests = pendingChests(data, state, today, s.level);
  const streak = streakDays(data.settings.activeDays, today);
  const todayXp = dayNumbers(data, today).xp;
  const levelUp = state.levelSeen > 0 && s.level > state.levelSeen;

  return (
    <>
      {tab === 'inicio' && (<>
      {since && (
        <SinceCard
          n={since}
          onChests={() => go('jornada/baus')}
          onClose={() => setSince(null)}
        />
      )}
      <section className="card raised journey-hero">
        <button type="button" className="jn-scene-btn" aria-label="Ver o personagem em tela cheia" onClick={() => setFull(true)}>
          <JourneyScene look={look} state={state} activeDays={data.settings.activeDays} now={now} />
        </button>
        <div className="journey-info">
          <div className="toggle-row">
            <div>
              <strong className="jn-px jn-name">{look.name || cls[gk]}</strong>
              <span className="muted small">
                {look.name ? `${cls[gk]} · ` : ''}
                {title ? title[gk] : 'Sem título'}
              </span>
            </div>
            <span className="jn-px jn-level">LV {s.level}</span>
          </div>
          {streak > 0 && (
            <span className="jn-streak">
              <b className="jn-px">{streak}</b> {streak === 1 ? 'dia' : 'dias'} de sequência
            </span>
          )}
          <div>
            <div className="toggle-row small muted">
              <span>
                XP{todayXp > 0 && <span className="jn-today"> · +{fmt(todayXp)} hoje</span>}
              </span>
              <span className="tabular">
                {fmt(s.xpInLevel)} / {fmt(s.xpForNext)}
              </span>
            </div>
            <div className="xp-bar">
              <div style={{ width: `${(s.xpInLevel / s.xpForNext) * 100}%` }} />
            </div>
          </div>
          <div className="jn-purse">
            <span>
              <img alt="" src={COIN_ICON} />
              <strong className="jn-px" style={{ color: 'var(--jn-gold)' }}>
                {fmt(w.gold)}
              </strong>
              <small className="muted">ouro</small>
            </span>
            <span>
              <img alt="" src={GEM_ICON} />
              <strong className="jn-px" style={{ color: 'var(--jn-crystal)' }}>
                {fmt(w.crystals)}
              </strong>
              <small className="muted">{w.crystals === 1 ? 'cristal' : 'cristais'}</small>
            </span>
          </div>
        </div>
      </section>

      <GiftCard />
      <ChestsReady chests={chests} />

      {!state.profile && (
        <section className="card jn-invite">
          <div className="jn-npc">
            <img alt="" src={npcIcon('lume')} />
            <div>
              <b>Mestra Lume</b>
              <span>Antes de partir, quero te conhecer. Me conta o que você quer melhorar e eu monto as suas missões. Leva 1 minuto.</span>
            </div>
          </div>
          <button
            type="button"
            className="btn primary block"
            onClick={() => {
              setInterviewing(true);
              top();
            }}
          >
            Conversar com a Mestra Lume
          </button>
        </section>
      )}
      <DayNumbers />
      <MissionsCard />
      <WeekCard />
      <NearCard state={state} level={s.level} />
      </>)}

      {tab === 'baus' && (<>
      <section className="card" ref={chestsRef}>
        <div className="card-head">
          <h2>Baús</h2>
          {chests.length > 0 && <span className="pill green">{chests.length}</span>}
        </div>
        {chests.length === 0 ? (
          <p className="muted small">Nenhum baú esperando. Eles chegam com 7 dias seguidos de rotina, 30 dias de consistência, revisão com 80% da rotina, mês com as contas em dia, a cada 5 níveis e nos dias sem um hábito a abandonar.</p>
        ) : (
          <ul className="list jn-chest-list">
            {chests.map((c) => (
              <li key={c.key}>
                <button type="button" className="row jn-chest-row" onClick={() => setOpening(c)}>
                  <img alt="" src={chestIcon(c.kind, false)} />
                  <span className="row-body">
                    <span className="row-title">{CHEST_NAMES[c.kind]}</span>
                    <span className="row-meta">
                      {c.reason} · {formatDMY(c.date)}
                    </span>
                  </span>
                  <span className="btn soft small">Abrir</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      </>)}

      {tab === 'arsenal' && (<>
      <section className="card" ref={arsenalRef}>
        <div className="card-head">
          <h2>Arsenal</h2>
          <span className="muted small">
            <img alt="" src={COIN_ICON} className="jn-inline-icon" /> {fmt(w.gold)}
          </span>
        </div>
        <Segmented<Slot> label="Espaço" value={slot} onChange={setSlot} options={SLOTS.map((x) => ({ value: x, label: SLOT_NAMES[x] }))} />
        <div className="jn-arsenal">
          {wardrobeItems(slot, state, shopContext(data, state, today)).map(({ item: it, isNew }) => {
            const on = Object.values(state.equipped).includes(it.id);
            return (
              <button key={it.id} type="button" className={`jn-item${on ? ' on' : ''}${isNew ? ' new' : ''}`} onClick={() => setTrying(it)}>
                <img alt="" src={itemIcon(it)} />
                <strong>{it.name}</strong>
                <span style={{ color: RARITY[it.rarity].color }}>{RARITY[it.rarity].label}</span>
                <span className="jn-item-status">{on ? 'Vestindo' : isNew ? 'Novo! Pegar' : 'Seu'}</span>
              </button>
            );
          })}
        </div>
        <p className="muted small" style={{ marginTop: 10 }}>
          Aqui ficam só os seus. Para comprar, vá à <button type="button" className="jn-link" onClick={() => go('jornada/loja')}>Loja</button>; para ver tudo o que existe, o Codex (em breve).
        </p>
        {slot === 'artefato' && <p className="muted small" style={{ marginTop: 10 }}>Cada artefato dá +10% de XP nos hábitos do seu atributo. O segundo espaço de artefato abre no nível 20.</p>}
      </section>
      </>)}
      {tab === 'pet' && <PetsView mine />}
      {tab === 'casa' && <HomesView mine />}
      {tab === 'loja' && <ShopView onTry={setTrying} />}

      {trying && (
        <TrySheet
          item={trying}
          look={look}
          state={state}
          avail={availability(trying, state, shopContext(data, state, today))}
          level={s.level}
          gold={w.gold}
          onAct={(fn) => {
            let msg: string | null = null;
            update((d) => {
              const r = fn(d.journey, shopContext(d, d.journey, todayISO()), journeyStats(d, todayISO()).level);
              if (typeof r === 'string') {
                msg = r;
                return d;
              }
              return { ...d, journey: r };
            });
            if (msg) notify('Não deu', msg);
            else setTrying(null);
          }}
          onClose={() => setTrying(null)}
        />
      )}

      {levelUp && !since && (
        <LevelUpScreen
          look={look}
          outfit={{ elmo: state.equipped.elmo, armadura: state.equipped.armadura, botas: state.equipped.botas, arma: state.equipped.arma }}
          level={s.level}
          xp={s.xp}
          toNext={s.xpForNext - s.xpInLevel}
          onClose={() => update((d) => ({ ...d, journey: { ...d.journey, levelSeen: s.level } }))}
        />
      )}

      {full && (
        <TelaCheia
          look={look}
          state={state}
          activeDays={data.settings.activeDays}
          now={now}
          level={s.level}
          title={title ? title[gk] : null}
          cls={cls}
          onSlot={(x) => {
            setFull(false);
            if (x === 'pet') go('jornada/pet');
            else if (x === 'morada') go('jornada/casa');
            else {
              setSlot(x);
              go('jornada/arsenal');
            }
          }}
          onClose={() => setFull(false)}
        />
      )}

      {opening && (
        <ChestSheet
          chest={opening}
          onOpen={(c) => {
            let rec: ChestRecord | null = null;
            update((d) => {
              if (d.journey.chests.some((x) => x.key === c.key)) return d;
              const r = openChest(d.journey, c, todayISO());
              rec = r.record;
              const next = { ...d, journey: r.state };
              return { ...next, journey: { ...r.state, lastSeen: snapshot(next, r.state, todayISO()) } };
            });
            return rec ?? openChest(state, c, today).record;
          }}
          onClose={() => setOpening(null)}
        />
      )}

      {tab === 'ficha' && (<>
      <Segmented<FichaTab> label="Ficha" value={fichaTab} onChange={setFichaTab} options={[{ value: 'ficha', label: 'Ficha' }, { value: 'titulos', label: 'Títulos' }, { value: 'forja', label: 'Forja' }, { value: 'classes', label: 'Classes' }]} />
      {fichaTab === 'titulos' && <TitlesView gender={gk} />}
      {fichaTab === 'forja' && <ForgeView />}
      {fichaTab === 'classes' && <ClassesView gender={gk} />}
      {fichaTab === 'ficha' && (<>
      <AttrsCard gender={gk} />
      <UnlocksCard />

      <section className="card">
        <div className="card-head">
          <h2>De onde veio o XP</h2>
        </div>
        {s.sources.length === 0 ? (
          <p className="empty">Ainda sem registros que rendam XP.</p>
        ) : (
          <ul className="list">
            {s.sources.map((src) => (
              <li key={src.id} className="row">
                <div className="row-body">
                  <span className="row-title">{src.label}</span>
                  <span className="row-meta">
                    {src.count}× · {src.rule}
                  </span>
                </div>
                <span className="pixel-num tiny-num">+{fmt(src.xp)} XP</span>
              </li>
            ))}
          </ul>
        )}
        <p className="muted small" style={{ marginTop: 10 }}>
          Sem punição: faltar nunca tira XP. Gastar dinheiro não rende nada — pagar no prazo, sim.
        </p>
      </section>

      <HowToEarn />

      <section className="card">
        <div className="card-head">
          <h2>Personagem</h2>
        </div>
        <div className="toggle-row">
          <div>
            <strong>Chuva de vez em quando</strong>
            <span className="muted small">Desligado, o céu fica sempre limpo.</span>
          </div>
          <Toggle checked={state.weather === 'aleatorio'} label="Chuva de vez em quando" onChange={(on) => update((d) => ({ ...d, journey: { ...d.journey, weather: on ? 'aleatorio' : 'limpo' } }))} />
        </div>
        <div className="btn-row" style={{ marginTop: 14 }}>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setDraft(look);
              setEditing(true);
              top();
            }}
          >
            Mudar aparência
          </button>
          {state.profile && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setInterviewing(true);
                top();
              }}
            >
              Refazer a entrevista
            </button>
          )}
          <button type="button" className="btn ghost" onClick={() => update((d) => ({ ...d, settings: { ...d.settings, journeyChoice: 'depois' } }))}>
            Pausar a Jornada
          </button>
        </div>
      </section>
      </>)}
      </>)}
    </>
  );
}

// ---------- N2.3: baús e "Desde a sua última visita" ----------

const CHEST_NAMES: Record<Chest['kind'], string> = { bronze: 'Baú de bronze', prata: 'Baú de prata', dourado: 'Baú dourado', cristal: 'Baú de cristal' };

function SinceCard({ n, onChests, onClose }: { n: SinceVisit; onChests: () => void; onClose: () => void }) {
  const when = n.days === 0 ? 'Desde a sua última visita, hoje' : n.days === 1 ? 'Desde ontem' : `Desde a sua última visita, há ${n.days} dias`;
  const rows: { key: string; icon?: string; text: React.ReactNode; color?: string }[] = [];
  if (n.levels) rows.push({ key: 'nivel', text: <strong className="jn-px">{n.levels === 1 ? 'Subiu de nível!' : `Subiu ${n.levels} níveis!`}</strong> });
  if (n.xp) rows.push({ key: 'xp', text: <><strong className="jn-px">+<CountUp to={n.xp} /></strong> XP</> });
  if (n.gold) rows.push({ key: 'ouro', icon: COIN_ICON, text: <><strong className="jn-px" style={{ color: 'var(--jn-gold)' }}>+<CountUp to={n.gold} delay={150} /></strong> ouro</> });
  if (n.crystals) rows.push({ key: 'cristal', icon: GEM_ICON, text: <><strong className="jn-px" style={{ color: 'var(--jn-crystal)' }}>+<CountUp to={n.crystals} delay={300} /></strong> {n.crystals === 1 ? 'cristal' : 'cristais'}</> });
  return (
    <section className="card raised jn-since" aria-live="polite">
      <div className="card-head">
        <h2>{when}</h2>
      </div>
      <div className="jn-loot">
        {rows.map((r, i) => (
          <div key={r.key} className="jn-loot-row" style={{ animationDelay: `${i * 0.15}s` }}>
            {r.icon ? <img alt="" src={r.icon} /> : <span className="jn-since-dot" aria-hidden="true" />}
            <div>
              <span>{r.text}</span>
            </div>
          </div>
        ))}
      </div>
      {n.attrs.length > 0 && (
        <div className="jn-since-attrs">
          {n.attrs.map((a) => {
            const at = ATTRIBUTES.find((x) => x.code === a.code)!;
            return (
              <span key={a.code} className="jn-since-attr" style={{ borderColor: at.color }}>
                <strong style={{ color: at.color }}>{a.code}</strong> +{fmt(a.gain)}
              </span>
            );
          })}
        </div>
      )}
      <div className="btn-row" style={{ marginTop: 14 }}>
        {n.chests > 0 && (
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              onClose();
              onChests();
            }}
          >
            {n.chests === 1 ? 'Ver o baú novo' : `Ver os ${n.chests} baús novos`}
          </button>
        )}
        <button type="button" className={`btn${n.chests > 0 ? ' ghost' : ' primary'}`} onClick={onClose}>
          Continuar
        </button>
      </div>
    </section>
  );
}

function ChestSheet({ chest, onOpen, onClose }: { chest: Chest; onOpen: (c: Chest) => ChestRecord; onClose: () => void }) {
  const [phase, setPhase] = useState<'idle' | 'shake' | 'open'>('idle');
  const [rec, setRec] = useState<ChestRecord | null>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const open = () => {
    if (phase !== 'idle') return;
    const r = onOpen(chest);
    setRec(r);
    setPhase('shake');
    if (reduced()) return setPhase('open');
    timers.current.push(window.setTimeout(() => setPhase('open'), 650));
  };
  const item = rec?.item ? itemById(rec.item) : null;
  return (
    <Sheet
      title={CHEST_NAMES[chest.kind]}
      onClose={onClose}
      footer={
        <button type="button" className="btn primary block" onClick={phase === 'open' ? onClose : open} disabled={phase === 'shake'}>
          {phase === 'open' ? 'Guardar' : 'Abrir o baú'}
        </button>
      }
    >
      <p className="muted small center">{chest.reason}</p>
      <div className={`jn-chest-stage${phase === 'open' ? ' open' : ''}`}>
        <i className="jn-rays" />
        <button type="button" className={`jn-chest ${phase === 'idle' ? 'idle' : phase === 'shake' ? 'shake' : 'pop'}`} aria-label={`Abrir o ${CHEST_NAMES[chest.kind].toLowerCase()}`} onClick={open}>
          <img alt="" src={chestIcon(chest.kind, phase === 'open')} />
        </button>
        {phase === 'idle' && <span className="jn-hint jn-px">TOQUE!</span>}
      </div>
      {phase === 'open' && rec && (
        <div className="jn-loot">
          {item && (
            <div className="jn-loot-row">
              <img alt="" src={itemIcon(item)} />
              <div>
                <strong>{item.name}</strong>
                <span style={{ color: RARITY[item.rarity].color }}>{RARITY[item.rarity].label} · já está no seu arsenal</span>
              </div>
            </div>
          )}
          <div className="jn-loot-row" style={{ animationDelay: '0.18s' }}>
            <img alt="" src={COIN_ICON} />
            <div>
              <strong>+{fmt(rec.gold)} ouro</strong>
              <span className="muted small">Para gastar na loja</span>
            </div>
          </div>
          {rec.crystals > 0 && (
            <div className="jn-loot-row" style={{ animationDelay: '0.36s' }}>
              <img alt="" src={GEM_ICON} />
              <div>
                <strong>+{rec.crystals} {rec.crystals === 1 ? 'cristal' : 'cristais'}</strong>
                <span className="muted small">Moeda da forja mística</span>
              </div>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}

// ---------- N2.4: Arsenal, provador e loja ----------

const SLOTS: Slot[] = ['elmo', 'armadura', 'botas', 'arma', 'artefato'];
const SLOT_NAMES: Record<Slot, string> = { elmo: 'Elmo', armadura: 'Roupa', botas: 'Botas', arma: 'Arma', artefato: 'Artefato' };

function reqText(a: Extract<Availability, { status: 'bau' }>): string {
  const miss = a.unlock.filter((r) => !r.ok);
  return miss.length ? `Vem em baús ou com ${miss.map((r) => `${r.code} ${r.need}`).join(' e ')}` : 'Vem em baús';
}


type Act = (state: JourneyState, c: ReturnType<typeof shopContext>, level: number) => JourneyState | string;

function TrySheet({ item, look, state, avail, level, gold, onAct, onClose }: { item: Item; look: AvatarLook; state: JourneyState; avail: Availability; level: number; gold: number; onAct: (fn: Act) => void; onClose: () => void }) {
  const isArtifact = item.slot === 'artefato';
  const target: EquipSlot = isArtifact && state.equipped.artefato && state.equipped.artefato !== item.id && level >= 20 && !state.equipped.artefato2 ? 'artefato2' : item.slot;
  const wearing = Object.entries(state.equipped).find(([, v]) => v === item.id)?.[0] as EquipSlot | undefined;
  const outfit = { elmo: state.equipped.elmo, armadura: state.equipped.armadura, botas: state.equipped.botas, arma: state.equipped.arma };
  const tried = isArtifact ? outfit : { ...outfit, [item.slot]: item.id };
  const canRemove = wearing && wearing !== 'armadura' && wearing !== 'botas';
  let action: { label: string; fn: Act; disabled?: boolean } | null = null;
  if (avail.status === 'tem') action = wearing ? (canRemove ? { label: 'Tirar', fn: (st) => equip(st, wearing!, null, level) } : null) : { label: 'Vestir', fn: (st, _c, lv) => equip(st, target, item.id, lv) };
  else if (avail.status === 'comprar')
    action = { label: avail.canAfford ? `Comprar por ${fmt(avail.price)} ouro` : `Faltam ${fmt(avail.price - gold)} de ouro`, fn: (st, c) => acquire(st, item.id, c), disabled: !avail.canAfford };
  else if (avail.status === 'liberar') action = { label: 'Pegar (liberado pelo atributo)', fn: (st, c) => acquire(st, item.id, c) };
  return (
    <Sheet
      title={item.name}
      onClose={onClose}
      footer={
        action ? (
          <button type="button" className="btn primary block" disabled={action.disabled} onClick={() => onAct(action!.fn)}>
            {action.label}
          </button>
        ) : (
          <button type="button" className="btn block" onClick={onClose}>
            Fechar
          </button>
        )
      }
    >
      <div className="jn-try">
        <div className="jn-try-stage">
          <img className="jn-try-avatar" alt={`Provador: ${item.name}`} src={avatarIcon(look, tried)} />
          {isArtifact && <img className="jn-try-artifact" alt="" src={itemIcon(item)} />}
        </div>
        <p>
          <strong style={{ color: RARITY[item.rarity].color }}>{RARITY[item.rarity].label}</strong>
          {' · '}
          {SLOT_NAMES[item.slot]}
          {item.weapon ? ` (${item.weapon})` : ''}
        </p>
        {item.boosts && <p className="muted small">+10% de XP nos hábitos de {ATTRIBUTES.find((a) => a.code === item.boosts)!.name}.</p>}
        {avail.status === 'bau' && <p className="muted small">{reqText(avail)}.</p>}
        {avail.status === 'comprar' && !avail.canAfford && <p className="muted small">Junte mais ouro com a rotina e os baús. O provador deixa ver como fica antes.</p>}
        {avail.status === 'tem' && !wearing && <p className="muted small">Você já tem. Vestir troca o que está no espaço {SLOT_NAMES[item.slot].toLowerCase()}.</p>}
      </div>
    </Sheet>
  );
}
