/**
 * Jornada (N2.16a): Fliperama, Corrida do pet e Respira com o pet (decididos em 16/11).
 * Partidas curtas; dão fichas (só do bichinho virtual) nos primeiros 30 min do dia; recorde pessoal.
 * A Respira com o pet, completa, conta como prática de respiração 4-7-8 no Núcleo.
 */
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { todayISO } from '../utils';
import { Fullscreen, notify } from '../ui';
import { recordSession } from '../practices';
import { FICHA_ICON, ITEMS, itemById, itemIcon, petIcon } from '../jornada/catalog';
import { sprite } from '../jornada/art';
import { BichinhoCard, BichinhoTelaCheia } from './JornadaBichinho';
import { DAILY_MINUTES, fichas, finishGame, GAMES, minutesLeft, type GameId } from '../jornada/games';

const fmt = (n: number) => n.toLocaleString('pt-BR');
const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function Fliperama() {
  const { data, update } = useStore();
  const today = todayISO();
  const state = data.journey;
  const left = minutesLeft(state, today);
  const [playing, setPlaying] = useState<GameId | null>(null);
  const [petOpen, setPetOpen] = useState(false);
  const started = useRef(0);
  const play = (g: GameId) => {
    started.current = Date.now();
    setPlaying(g);
  };
  const done = (game: GameId, score: number, marks: Record<string, number> = {}) => {
    // Tempo jogado desde o início desta partida (conta para os 30 minutos do dia).
    const secs = (Date.now() - started.current) / 1000;
    started.current = Date.now();
    // O resultado mostrado vem do estado de agora; a gravação refaz a conta sobre o estado mais novo.
    const now = finishGame(state, game, score, secs, todayISO(), marks);
    const msg = { fichas: now.fichas, record: now.record };
    update((d) => {
      const r = finishGame(d.journey, game, score, secs, todayISO(), marks);
      let next = { ...d, journey: r.state };
      if (game === 'respira' && score > 0) next = recordSession({ type: 'respiracao', sub: '478', title: 'Respira com o pet (4-7-8)', minutes: 1 })(next);
      return next;
    });
    return msg;
  };
  const petId = state.equipped.pet ?? 'gato';
  const pet = petIcon(petId, state.petStyle[petId]);
  return (
    <>
      <section className="card jn-arcade-head">
        <span className="jn-px">FLIPERAMA</span>
        <p className="small">Partidas rápidas com o seu pet. Os jogos dão fichas, que servem para o bichinho virtual. Só os primeiros {DAILY_MINUTES} minutos de cada dia dão fichas; depois dá para continuar jogando, por diversão.</p>
        <div className="jn-fichas-row">
          <span className="jn-fichas-pill" aria-label={`${fichas(state)} fichas`}>
            <img alt="" src={FICHA_ICON} />
            <b>{fmt(fichas(state))}</b>
          </span>
          <div className="jn-fichas-time">
            <span className="small">{left > 0 ? `Fichas de hoje: ${DAILY_MINUTES - left} de ${DAILY_MINUTES} min` : `${DAILY_MINUTES} de ${DAILY_MINUTES} min · fichas voltam amanhã`}</span>
            <div className={`jn-fichas-bar${left > 0 ? '' : ' done'}`}>
              <i style={{ width: `${((DAILY_MINUTES - left) / DAILY_MINUTES) * 100}%` }} />
            </div>
          </div>
        </div>
      </section>
      <BichinhoCard onOpen={() => setPetOpen(true)} />
      {petOpen && <BichinhoTelaCheia onClose={() => setPetOpen(false)} />}
      <div className="jn-games">
        {GAMES.map((g) => (
          <button key={g.id} type="button" className={`jn-game${g.ready ? '' : ' locked'}`} onClick={() => (g.ready ? play(g.id) : notify(`${g.name}: em breve`, g.text))}>
            <span className={`jn-game-art ${g.id}`}>
              <img alt="" src={g.id === 'memoria' ? itemIcon(itemById('espada')!) : g.id === 'pescaria' ? fishIcon('raro') : pet} />
            </span>
            <strong>{g.name}</strong>
            <span className="muted small">{g.text}</span>
            <span className="jn-px small" style={{ color: g.ready ? '#f472b6' : 'var(--faint)' }}>
              {g.ready ? (state.games.records[g.id] ? `Recorde: ${fmt(state.games.records[g.id])}${g.id === 'corrida' ? ' m' : g.id === 'respira' ? ' sessões' : ''}` : 'Jogar') : 'EM BREVE'}
            </span>
          </button>
        ))}
      </div>
      {playing === 'corrida' && <Corrida pet={pet} record={state.games.records.corrida ?? 0} onFinish={(s) => done('corrida', s)} onClose={() => setPlaying(null)} />}
      {playing === 'memoria' && <Memoria owned={state.owned} record={state.games.records.memoria ?? 0} onFinish={(sc, marks) => done('memoria', sc, marks)} onClose={() => setPlaying(null)} />}
      {playing === 'pescaria' && <Pescaria pet={pet} record={state.games.records.pescaria ?? 0} onFinish={(sc, marks) => done('pescaria', sc, marks)} onClose={() => setPlaying(null)} />}
      {playing === 'respira' && <Respira pet={pet} onFinish={(ok) => done('respira', ok ? (state.games.records.respira ?? 0) + 1 : 0)} onClose={() => setPlaying(null)} />}
    </>
  );
}

function Result({ title, lines, fichas: won, record, onAgain, onClose }: { title: string; lines: string; fichas: number; record: boolean; onAgain: () => void; onClose: () => void }) {
  return (
    <div className="jn-game-over">
      <strong className="jn-px">{title}</strong>
      <span>{lines}</span>
      {record && <span className="jn-px" style={{ color: 'var(--jn-gold)' }}>NOVO RECORDE!</span>}
      <span className="jn-game-prize">
        <img alt="" src={FICHA_ICON} /> {won ? `+${won} ${won === 1 ? 'ficha' : 'fichas'}` : 'Sem fichas nesta partida (os 30 min de hoje acabaram)'}
      </span>
      <div className="btn-row">
        <button type="button" className="btn" onClick={onClose}>
          Sair
        </button>
        <button type="button" className="btn primary" onClick={onAgain}>
          Jogar de novo
        </button>
      </div>
    </div>
  );
}

// ---------- Corrida do pet ----------

interface Obstacle {
  x: number;
  w: number;
  h: number;
  kind: 'tronco' | 'pedra';
}

function Corrida({ pet, record, onFinish, onClose }: { pet: string; record: number; onFinish: (score: number) => { fichas: number; record: boolean }; onClose: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'pronto' | 'jogando' | 'fim'>('pronto');
  const [result, setResult] = useState<{ score: number; fichas: number; record: boolean } | null>(null);
  const [round, setRound] = useState(0);
  const jumpRef = useRef<() => void>(() => {});
  const startRef = useRef<() => void>(() => {});
  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = cv.clientWidth;
    const H = cv.clientHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const img = new Image();
    img.src = pet;
    const ground = Math.round(Math.min(H - 70, H * 0.58));
    const P = { x: 46, y: ground, vy: 0, size: 54 };
    let obs: Obstacle[] = [];
    let speed = 4.2;
    let dist = 0;
    let next = 90;
    let t0 = 0;
    let raf = 0;
    let running = false;
    startRef.current = () => {
      running = true;
      t0 = 0;
    };
    let over = false;
    const jump = () => {
      if (P.y >= ground - 0.5 && running) P.vy = -11.5;
    };
    jumpRef.current = jump;
    const draw = () => {
      // Céu, morro, chão.
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#7dd3fc');
      g.addColorStop(0.7, '#bae6fd');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#86efac';
      for (let i = 0; i < 6; i++) {
        const hx = ((i * 140 - (dist * 0.3) % 140) + W + 140) % (W + 140) - 70;
        ctx.fillRect(hx, ground - 40 + (i % 2) * 12, 90, 60);
      }
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, ground + P.size * 0 + 2, W, 10);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(0, ground + 12, W, H - ground);
      ctx.fillStyle = '#15803d';
      for (let x = -((dist * 1) % 24); x < W; x += 24) ctx.fillRect(x, ground + 22, 8, 4);
      // Obstáculos.
      for (const o of obs) {
        if (o.kind === 'tronco') {
          ctx.fillStyle = '#78350f';
          ctx.fillRect(o.x, ground + 2 - o.h, o.w, o.h);
          ctx.fillStyle = '#a16207';
          ctx.fillRect(o.x + 4, ground + 2 - o.h + 4, o.w - 8, 4);
          ctx.fillRect(o.x + 4, ground + 2 - o.h + 14, o.w - 8, 4);
        } else {
          ctx.fillStyle = '#57534e';
          ctx.fillRect(o.x, ground + 2 - o.h + 6, o.w, o.h - 6);
          ctx.fillRect(o.x + 6, ground + 2 - o.h, o.w - 12, 6);
          ctx.fillStyle = '#a8a29e';
          ctx.fillRect(o.x + 6, ground + 2 - o.h + 8, 8, 6);
        }
      }
      // Pet (com sombra).
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(P.x + 6, ground + 4, P.size - 12, 5);
      if (img.complete) ctx.drawImage(img, P.x, P.y - P.size * 0.82, P.size, P.size * 0.82);
      // Placar.
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(10, 10, 132, 28);
      ctx.fillStyle = '#fde047';
      ctx.font = '600 16px "Pixelify Sans", monospace';
      ctx.fillText(`${Math.floor(dist / 10)} m`, 20, 30);
    };
    const step = (now: number) => {
      if (running && !over && !t0) t0 = now;
      const elapsed = t0 ? (now - t0) / 1000 : 0;
      if (running && !over) {
        speed = 4.2 + elapsed * 0.09;
        dist += speed;
        P.vy += 0.62;
        P.y = Math.min(ground, P.y + P.vy);
        if (P.y >= ground) P.vy = 0;
        next -= speed;
        if (next <= 0) {
          const kind = Math.random() < 0.55 ? 'tronco' : 'pedra';
          obs.push({ x: W + 10, w: kind === 'tronco' ? 22 : 30, h: kind === 'tronco' ? 30 + Math.random() * 14 : 22, kind });
          next = 160 + Math.random() * 180 + speed * 12;
        }
        obs = obs.map((o) => ({ ...o, x: o.x - speed })).filter((o) => o.x + o.w > -10);
        const hit = obs.some((o) => P.x + 12 < o.x + o.w && P.x + P.size - 12 > o.x && P.y - 6 > ground + 2 - o.h);
        if (hit || elapsed >= 60) {
          over = true;
          running = false;
          const score = Math.floor(dist / 10);
          const r = onFinish(score);
          setResult({ score, fichas: r.fichas, record: r.record });
          setPhase('fim');
        }
      }
      draw();
      if (!over) raf = requestAnimationFrame(step);
    };
    img.onload = draw;
    raf = requestAnimationFrame(step);
    const key = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', key);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', key);
    };
  }, [round]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Fullscreen label="Corrida do pet" className="jn-game-fs" onClose={onClose}>
      <div className="jn-game-top">
        <button type="button" className="jn-fs-close" aria-label="Sair do jogo" onClick={onClose}>
          ✕
        </button>
        <strong className="jn-px">CORRIDA DO PET</strong>
        <span className="jn-px small">Recorde {fmt(record)} m</span>
      </div>
      <div className="jn-game-stage" onPointerDown={() => jumpRef.current()}>
        <canvas ref={ref} className="jn-game-canvas" aria-label="Corrida: toque para pular" />
        {phase === 'pronto' && (
          <button
            type="button"
            className="jn-game-start"
            onClick={() => {
              setPhase('jogando');
              startRef.current();
            }}
          >
            <strong className="jn-px">TOQUE PARA COMEÇAR</strong>
            <span>Toque na tela para pular troncos e pedras. Até 60 segundos.</span>
          </button>
        )}
        {phase === 'fim' && result && (
          <Result
            title="FIM DA CORRIDA"
            lines={`${fmt(result.score)} metros`}
            fichas={result.fichas}
            record={result.record}
            onClose={onClose}
            onAgain={() => {
              setResult(null);
              setPhase('pronto');
              setRound((r) => r + 1);
            }}
          />
        )}
      </div>
    </Fullscreen>
  );
}

// ---------- Respira com o pet ----------

const BREATH: [string, number][] = [
  ['Inspire', 4],
  ['Segure', 7],
  ['Expire', 8],
];
const CYCLES = 3;

function Respira({ pet, onFinish, onClose }: { pet: string; onFinish: (ok: boolean) => { fichas: number; record: boolean }; onClose: () => void }) {
  const [phase, setPhase] = useState<'pronto' | 'respirando' | 'fim'>('pronto');
  const [tick, setTick] = useState(0);
  const [result, setResult] = useState<{ fichas: number } | null>(null);
  const total = BREATH.reduce((a, b) => a + b[1], 0);
  useEffect(() => {
    if (phase !== 'respirando') return;
    const t = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => window.clearInterval(t);
  }, [phase]);
  useEffect(() => {
    if (phase === 'respirando' && tick >= total * CYCLES) {
      const r = onFinish(true);
      setResult({ fichas: r.fichas });
      setPhase('fim');
    }
  }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const inCycle = tick % total;
  const cycle = Math.min(CYCLES, Math.floor(tick / total) + 1);
  let acc = 0;
  let cur = BREATH[0];
  let into = 0;
  for (const b of BREATH) {
    if (inCycle < acc + b[1]) {
      cur = b;
      into = inCycle - acc;
      break;
    }
    acc += b[1];
  }
  const scale = phase !== 'respirando' ? 1 : cur[0] === 'Inspire' ? 1 + (0.45 * (into + 1)) / cur[1] : cur[0] === 'Segure' ? 1.45 : 1.45 - (0.45 * (into + 1)) / cur[1];
  return (
    <Fullscreen label="Respira com o pet" className="jn-game-fs jn-breath-fs" onClose={onClose}>
      <div className="jn-game-top">
        <button type="button" className="jn-fs-close" aria-label="Sair" onClick={onClose}>
          ✕
        </button>
        <strong className="jn-px">RESPIRA COM O PET</strong>
        <span className="jn-px small">{phase === 'respirando' ? `${cycle} de ${CYCLES}` : '4-7-8'}</span>
      </div>
      <div className="jn-breath">
        <div className="jn-breath-ring" style={{ transform: `scale(${scale})`, transitionDuration: reduced() ? '0s' : '1s' }}>
          <img alt="" src={pet} />
        </div>
        {phase === 'pronto' && (
          <>
            <p>Acompanhe o pet: ele cresce quando você inspira, para quando você segura e murcha quando você solta o ar. São 3 respirações, menos de 1 minuto.</p>
            <button type="button" className="btn primary" onClick={() => setPhase('respirando')}>
              Começar
            </button>
          </>
        )}
        {phase === 'respirando' && (
          <>
            <strong className="jn-px jn-breath-word">{cur[0]}</strong>
            <span className="jn-px jn-breath-count">{cur[1] - into}</span>
          </>
        )}
        {phase === 'fim' && result && (
          <Result
            title="MUITO BEM"
            lines="3 respirações 4-7-8. Ficou registrado como prática de Mente no Núcleo."
            fichas={result.fichas}
            record={false}
            onClose={onClose}
            onAgain={() => {
              setResult(null);
              setTick(0);
              setPhase('pronto');
            }}
          />
        )}
      </div>
    </Fullscreen>
  );
}


// ---------- Memória do Arsenal (N2.16b) ----------

const MEM_SECONDS = 60;

/** 8 itens para os pares: primeiro os seus, depois outros do Arsenal, embaralhados a cada partida. */
function memoryDeck(owned: string[]): string[] {
  const mine = ITEMS.filter((i) => owned.includes(i.id)).map((i) => i.id);
  const rest = ITEMS.filter((i) => !owned.includes(i.id) && !i.campaign).map((i) => i.id);
  const shuffle = <T,>(a: T[]) => a.map((x) => [Math.random(), x] as const).sort((p, q) => p[0] - q[0]).map((x) => x[1]);
  const pick = [...shuffle(mine), ...shuffle(rest)].slice(0, 8);
  return shuffle([...pick, ...pick]);
}

function Memoria({ owned, record, onFinish, onClose }: { owned: string[]; record: number; onFinish: (score: number, marks: Record<string, number>) => { fichas: number; record: boolean }; onClose: () => void }) {
  const [deck, setDeck] = useState(() => memoryDeck(owned));
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<number[]>([]);
  const [phase, setPhase] = useState<'pronto' | 'jogando' | 'fim'>('pronto');
  const [left, setLeft] = useState(MEM_SECONDS);
  const [result, setResult] = useState<{ score: number; pairs: number; fichas: number; record: boolean } | null>(null);
  const lock = useRef(false);
  useEffect(() => {
    if (phase !== 'jogando') return;
    const t = window.setInterval(() => setLeft((x) => x - 1), 1000);
    return () => window.clearInterval(t);
  }, [phase]);
  const finish = (pairs: number, secs: number) => {
    const all = pairs === 8;
    const score = pairs * 10 + (all ? secs : 0);
    const r = onFinish(score, { memoria_pares: pairs, memoria_sobra: all ? secs : 0 });
    setResult({ score, pairs, fichas: r.fichas, record: r.record });
    setPhase('fim');
  };
  useEffect(() => {
    if (phase === 'jogando' && left <= 0) finish(found.length / 2, 0);
  }, [left]); // eslint-disable-line react-hooks/exhaustive-deps
  const flip = (i: number) => {
    if (phase !== 'jogando' || lock.current || open.includes(i) || found.includes(i)) return;
    const now = [...open, i];
    setOpen(now);
    if (now.length < 2) return;
    lock.current = true;
    const [a, b] = now;
    const match = deck[a] === deck[b];
    window.setTimeout(
      () => {
        lock.current = false;
        setOpen([]);
        if (!match) return;
        const f = [...found, a, b];
        setFound(f);
        if (f.length === deck.length) finish(8, left);
      },
      match ? 250 : reduced() ? 400 : 750,
    );
  };
  const again = () => {
    setDeck(memoryDeck(owned));
    setOpen([]);
    setFound([]);
    setLeft(MEM_SECONDS);
    setResult(null);
    setPhase('pronto');
  };
  return (
    <Fullscreen label="Memória do Arsenal" className="jn-game-fs jn-mem-fs" onClose={onClose}>
      <div className="jn-game-top">
        <button type="button" className="jn-fs-close" aria-label="Sair" onClick={onClose}>
          ✕
        </button>
        <strong className="jn-px">MEMÓRIA</strong>
        <span className="jn-px small">{phase === 'jogando' ? `${left} s · ${found.length / 2}/8` : `Recorde: ${record}`}</span>
      </div>
      <div className="jn-mem">
        <div className="jn-mem-grid" role="group" aria-label="Cartas">
          {deck.map((id, i) => {
            const up = open.includes(i) || found.includes(i) || phase === 'fim';
            const it = itemById(id)!;
            return (
              <button key={i} type="button" className={`jn-mem-card${up ? ' up' : ''}${found.includes(i) ? ' found' : ''}`} aria-label={up ? it.name : `Carta ${i + 1}`} onClick={() => flip(i)}>
                <span className="back jn-px">?</span>
                <span className="face">
                  <img alt="" src={itemIcon(it)} />
                </span>
              </button>
            );
          })}
        </div>
        {phase === 'pronto' && (
          <div className="jn-game-over">
            <strong className="jn-px">MEMÓRIA DO ARSENAL</strong>
            <span>Vire duas cartas por vez e ache os 8 pares de itens em {MEM_SECONDS} segundos. Cada par vale 10 pontos; terminar antes soma os segundos que sobraram.</span>
            <div className="btn-row">
              <button type="button" className="btn primary" onClick={() => setPhase('jogando')}>
                Começar
              </button>
            </div>
          </div>
        )}
        {phase === 'fim' && result && (
          <Result
            title={result.pairs === 8 ? 'TODOS OS PARES!' : 'O TEMPO ACABOU'}
            lines={`${result.pairs} de 8 pares · ${result.score} pontos`}
            fichas={result.fichas}
            record={result.record}
            onClose={onClose}
            onAgain={again}
          />
        )}
      </div>
    </Fullscreen>
  );
}

// ---------- Pescaria (N2.16b; peixes com o dobro de pixels) ----------

const FISH = [
  '..........OOOO..........', '......OOOOFFFFOO.....OO.', '....OOFFFFFFFFFFOO..OFFO', '..OOFFWOFFFFFFFFFFOOFFFO',
  '..OFFFOOFFFFFFFFFFFFFFO.', '.OFFFFFFFFFFLLFFFFFFFFO.', '.OFFFFFFFFFLLLFFFFFOOFFO', '..OOFFFFFFFFFFFFFOO..OFO',
  '....OOFFFFFFFFFOO.....OO', '......OOOOOOOOO.........',
];
const FISH_PAL = {
  comum: { F: '#60a5fa', L: '#bfdbfe', W: '#ffffff' },
  raro: { F: '#a855f7', L: '#e9d5ff', W: '#ffffff' },
  dourado: { F: '#facc15', L: '#fef9c3', W: '#ffffff' },
} as const;
type FishKind = keyof typeof FISH_PAL;
const FISH_POINTS: Record<FishKind, number> = { comum: 1, raro: 3, dourado: 6 };
export const fishIcon = (k: FishKind) => sprite(FISH, FISH_PAL[k], 24);
const FISH_SECONDS = 40;

function Pescaria({ pet, record, onFinish, onClose }: { pet: string; record: number; onFinish: (score: number, marks: Record<string, number>) => { fichas: number; record: boolean }; onClose: () => void }) {
  const [phase, setPhase] = useState<'pronto' | 'jogando' | 'fim'>('pronto');
  const [left, setLeft] = useState(FISH_SECONDS);
  const [points, setPoints] = useState(0);
  const [golds, setGolds] = useState(0);
  const [zone, setZone] = useState({ at: 40, w: 22 });
  const [needle, setNeedle] = useState(0);
  const [catchKind, setCatch] = useState<FishKind | 'escapou' | null>(null);
  const [result, setResult] = useState<{ score: number; fichas: number; record: boolean } | null>(null);
  const t0 = useRef(0);
  const speed = useRef(70);
  const paused = useRef(false);
  useEffect(() => {
    if (phase !== 'jogando') return;
    const timer = window.setInterval(() => setLeft((x) => x - 1), 1000);
    let raf = 0;
    const step = (now: number) => {
      if (!paused.current) {
        if (!t0.current) t0.current = now;
        const p = (((now - t0.current) / 1000) * speed.current) % 200;
        setNeedle(p <= 100 ? p : 200 - p);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      window.clearInterval(timer);
      cancelAnimationFrame(raf);
    };
  }, [phase]);
  useEffect(() => {
    if (phase === 'jogando' && left <= 0) {
      const r = onFinish(points, { pescaria_dourado: golds });
      setResult({ score: points, fichas: r.fichas, record: r.record });
      setPhase('fim');
    }
  }, [left]); // eslint-disable-line react-hooks/exhaustive-deps
  const newCast = () => {
    const w = 14 + Math.random() * 14;
    setZone({ at: 10 + Math.random() * (80 - w), w });
    speed.current = 60 + Math.random() * 50;
    t0.current = 0;
    paused.current = false;
    setCatch(null);
  };
  const pull = () => {
    if (phase !== 'jogando' || paused.current) return;
    paused.current = true;
    const inZone = needle >= zone.at && needle <= zone.at + zone.w;
    let k: FishKind | 'escapou' = 'escapou';
    if (inZone) {
      const center = Math.abs(needle - (zone.at + zone.w / 2)) <= zone.w * 0.12;
      k = center ? 'dourado' : Math.random() < 0.3 ? 'raro' : 'comum';
      setPoints((x) => x + FISH_POINTS[k as FishKind]);
      if (k === 'dourado') setGolds((g) => g + 1);
    }
    setCatch(k);
    window.setTimeout(newCast, reduced() ? 300 : 900);
  };
  const again = () => {
    setLeft(FISH_SECONDS);
    setPoints(0);
    setGolds(0);
    setResult(null);
    setCatch(null);
    paused.current = false;
    t0.current = 0;
    setPhase('pronto');
  };
  return (
    <Fullscreen label="Pescaria" className="jn-game-fs jn-fish-fs" onClose={onClose}>
      <div className="jn-game-top">
        <button type="button" className="jn-fs-close" aria-label="Sair" onClick={onClose}>
          ✕
        </button>
        <strong className="jn-px">PESCARIA</strong>
        <span className="jn-px small">{phase === 'jogando' ? `${left} s · ${points} pts` : `Recorde: ${record}`}</span>
      </div>
      <button type="button" className="jn-fish-lake" aria-label="Puxar a linha" onClick={pull}>
        <span className="jn-fish-sky" />
        <span className="jn-fish-water" />
        <span className="jn-fish-pier" aria-hidden="true" />
        <img className="jn-fish-pet" alt="" src={pet} />
        <span className="jn-fish-line" />
        <span className={`jn-fish-bob${catchKind ? ' pulled' : ''}`} />
        {catchKind && catchKind !== 'escapou' && <img className="jn-fish-catch" alt="" src={fishIcon(catchKind)} />}
        {catchKind && (
          <span className="jn-fish-msg jn-px">{catchKind === 'escapou' ? 'ESCAPOU!' : `+${FISH_POINTS[catchKind]} ${catchKind === 'dourado' ? 'DOURADO!' : catchKind === 'raro' ? 'RARO!' : ''}`}</span>
        )}
      </button>
      <div className="jn-fish-panel">
        <div className="jn-fish-meter" aria-hidden="true">
          <i className="zone" style={{ left: `${zone.at}%`, width: `${zone.w}%` }} />
          <i className="gold" style={{ left: `${zone.at + zone.w * 0.38}%`, width: `${zone.w * 0.24}%` }} />
          <b style={{ left: `${needle}%` }} />
        </div>
        <button type="button" className="btn primary block" onClick={pull} disabled={phase !== 'jogando'}>
          Puxar!
        </button>
        <span className="jn-fs-hint">Toque quando o ponteiro estiver no verde · no meio dourado, peixe dourado</span>
      </div>
      {phase === 'pronto' && (
        <div className="jn-fish-over">
        <div className="jn-game-over">
          <strong className="jn-px">PESCARIA</strong>
          <span>{FISH_SECONDS} segundos para pescar. Toque em Puxar quando o ponteiro passar pelo verde. Comum vale 1, raro 3 e dourado 6.</span>
          <div className="btn-row">
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                newCast();
                setPhase('jogando');
              }}
            >
              Começar
            </button>
          </div>
        </div>
        </div>
      )}
      {phase === 'fim' && result && (
        <div className="jn-fish-over">
          <Result title="FIM DA PESCARIA" lines={`${result.score} pontos${golds ? ` · ${golds} dourado${golds > 1 ? 's' : ''}` : ''}`} fichas={result.fichas} record={result.record} onClose={onClose} onAgain={again} />
        </div>
      )}
    </Fullscreen>
  );
}
