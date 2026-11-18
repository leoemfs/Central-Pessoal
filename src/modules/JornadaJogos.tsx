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
import { OUTLINE, sprite, toSvg, type Grid } from '../jornada/art';
import { conflicts, isSolved, makeSudoku, SUDOKU_LEVELS, type SudokuLevel } from '../jornada/sudoku';
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
              <img alt="" src={g.id === 'memoria' ? itemIcon(itemById('espada')!) : g.id === 'pescaria' ? fishIcon('raro') : g.id === 'sudoku' ? SUDOKU_ICON : g.id === 'pulo' ? PULO_ICON : pet} />
            </span>
            <strong>{g.name}</strong>
            <span className="muted small">{g.text}</span>
            <span className="jn-px small" style={{ color: g.ready ? '#f472b6' : 'var(--faint)' }}>
              {g.ready ? (g.id === 'pulo' && state.games.records.pulo ? `Recorde: ${fmt(state.games.records.pulo)} m` : g.id === 'sudoku' ? ((state.games.sudokuDays ?? []).includes(today) ? 'Resolvido hoje ✓' : 'Desafio de hoje') : state.games.records[g.id] ? `Recorde: ${fmt(state.games.records[g.id])}${g.id === 'corrida' ? ' m' : g.id === 'respira' ? ' sessões' : ''}` : 'Jogar') : 'EM BREVE'}
            </span>
          </button>
        ))}
      </div>
      {playing === 'corrida' && <Corrida pet={pet} record={state.games.records.corrida ?? 0} onFinish={(s) => done('corrida', s)} onClose={() => setPlaying(null)} />}
      {playing === 'memoria' && <Memoria owned={state.owned} record={state.games.records.memoria ?? 0} onFinish={(sc, marks) => done('memoria', sc, marks)} onClose={() => setPlaying(null)} />}
      {playing === 'pescaria' && <Pescaria pet={pet} record={state.games.records.pescaria ?? 0} onFinish={(sc, marks) => done('pescaria', sc, marks)} onClose={() => setPlaying(null)} />}
      {playing === 'pulo' && <Pulo pet={pet} record={state.games.records.pulo ?? 0} onFinish={(sc, marks) => done('pulo', sc, marks)} onClose={() => setPlaying(null)} />}
      {playing === 'sudoku' && <Sudoku solvedToday={(state.games.sudokuDays ?? []).includes(today)} onFinish={(sc, marks) => done('sudoku', sc, marks)} onClose={() => setPlaying(null)} />}
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

// ---------- Sudoku (18/11): 6×6, um desafio por dia, +2 de Inteligência por dia resolvido ----------

/** Ícone do Sudoku, 24 pixels (arte nova já com o dobro de pixels). */
const SUDOKU_ICON = (() => {
  const g: Grid = Array.from({ length: 24 }, () => Array<string | null>(24).fill(null));
  for (let y = 2; y < 22; y++)
    for (let x = 2; x < 22; x++) {
      const edge = x === 2 || y === 2 || x === 21 || y === 21;
      const thick = x === 11 || y === 8 || y === 15;
      const thin = (x - 2) % 3 === 0 || (y - 2) % 3 === 0 || x === 20 || y === 20;
      g[y][x] = edge ? OUTLINE : thick ? '#57534e' : thin ? '#d6d3d1' : '#fafaf9';
    }
  const dots: [number, number, string][] = [[3, 3, '#7c3aed'], [6, 9, '#7c3aed'], [12, 3, '#22c55e'], [15, 12, '#7c3aed'], [18, 18, '#22c55e'], [9, 16, '#7c3aed'], [3, 12, '#22c55e'], [18, 6, '#7c3aed']];
  for (const [x, y, c] of dots) {
    g[y][x] = c;
    g[y][x + 1] = c;
    g[y + 1][x] = c;
    g[y + 1][x + 1] = c;
  }
  return toSvg(g, 2);
})();

function Sudoku({ solvedToday, onFinish, onClose }: { solvedToday: boolean; onFinish: (score: number, marks: Record<string, number>) => { fichas: number; record: boolean }; onClose: () => void }) {
  const today = todayISO();
  const [level, setLevel] = useState<SudokuLevel>('facil');
  const [game, setGame] = useState(() => makeSudoku(today, 'facil'));
  const [grid, setGrid] = useState<number[]>(game.puzzle);
  const [sel, setSel] = useState<number | null>(null);
  const [errors, setErrors] = useState(0);
  const [phase, setPhase] = useState<'pronto' | 'jogando' | 'fim'>('pronto');
  const [result, setResult] = useState<{ fichas: number; record: boolean; first: boolean } | null>(null);
  const bad = conflicts(grid);
  const start = (lv: SudokuLevel) => {
    const g = makeSudoku(today, lv);
    setLevel(lv);
    setGame(g);
    setGrid(g.puzzle);
    setSel(null);
    setErrors(0);
    setResult(null);
    setPhase('jogando');
  };
  const put = (v: number) => {
    if (phase !== 'jogando' || sel === null || game.puzzle[sel]) return;
    const next = [...grid];
    next[sel] = v;
    let errs = errors;
    if (v && conflicts(next).has(sel)) errs++;
    setErrors(errs);
    setGrid(next);
    if (isSolved(next)) {
      const lv = SUDOKU_LEVELS.find((l) => l.id === level)!;
      const r = onFinish(lv.points, { sudoku: lv.points, sudoku_limpo: level === 'dificil' && errs === 0 ? 1 : 0 });
      setResult({ ...r, first: !solvedToday });
      setPhase('fim');
    }
  };
  const lvName = SUDOKU_LEVELS.find((l) => l.id === level)!.label;
  return (
    <Fullscreen label="Sudoku" className="jn-game-fs jn-sdk-fs" onClose={onClose}>
      <div className="jn-game-top">
        <button type="button" className="jn-fs-close" aria-label="Sair" onClick={onClose}>
          ✕
        </button>
        <strong className="jn-px">SUDOKU</strong>
        <span className="jn-px small">{phase === 'pronto' ? '6×6' : `${lvName} · ${errors} ${errors === 1 ? 'erro' : 'erros'}`}</span>
      </div>
      <div className="jn-sdk">
        <div className="jn-sdk-grid" role="grid" aria-label="Tabuleiro">
          {grid.map((v, i) => {
            const given = !!game.puzzle[i];
            const r = Math.floor(i / 6);
            const c = i % 6;
            const same = sel !== null && (Math.floor(sel / 6) === r || sel % 6 === c);
            return (
              <button
                key={i}
                type="button"
                role="gridcell"
                aria-label={`Linha ${r + 1}, coluna ${c + 1}${v ? `: ${v}` : ', vazia'}`}
                className={`jn-sdk-cell${given ? ' given' : ''}${sel === i ? ' sel' : same ? ' line' : ''}${bad.has(i) && !given ? ' bad' : ''}${c === 2 ? ' br' : ''}${r === 1 || r === 3 ? ' bb' : ''}`}
                onClick={() => setSel(i)}
              >
                {v || ''}
              </button>
            );
          })}
        </div>
        <div className="jn-sdk-pad" role="group" aria-label="Números">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button key={n} type="button" onClick={() => put(n)}>
              {n}
            </button>
          ))}
          <button type="button" className="erase" onClick={() => put(0)}>
            Apagar
          </button>
        </div>
        {phase === 'pronto' && (
          <div className="jn-game-over">
            <strong className="jn-px">SUDOKU DO DIA</strong>
            <span>Complete o tabuleiro com os números de 1 a 6, sem repetir na linha, na coluna nem na caixa de 2×3. {solvedToday ? 'Você já resolveu hoje: o +2 de Inteligência do dia já contou; dá para jogar de novo por diversão.' : 'Resolver dá +2 de Inteligência (uma vez por dia) e fichas.'}</span>
            <div className="btn-row">
              {SUDOKU_LEVELS.map((l) => (
                <button key={l.id} type="button" className={`btn${l.id === 'facil' ? ' primary' : ''}`} onClick={() => start(l.id)}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {phase === 'fim' && result && (
          <Result
            title="RESOLVIDO!"
            lines={`${lvName} · ${errors} ${errors === 1 ? 'erro' : 'erros'}${result.first ? ' · +2 de Inteligência' : ' · a Inteligência de hoje já tinha contado'}`}
            fichas={result.fichas}
            record={false}
            onAgain={() => setPhase('pronto')}
            onClose={onClose}
          />
        )}
      </div>
    </Fullscreen>
  );
}

// ---------- Pulo nas nuvens (18/11): o pet pula sozinho; setas ← → levam para os lados ----------

/** Plataforma do jogo (arte nova com o dobro de pixels): galho, pedra, nuvem ou nuvem que some. */
type PlatKind = 'galho' | 'pedra' | 'nuvem' | 'some';
const PLAT_PAL: Record<PlatKind, [string, string, string]> = { galho: ['#92400e', '#78350f', '#b45309'], pedra: ['#a8a29e', '#78716c', '#d6d3d1'], nuvem: ['#f1f5f9', '#cbd5e1', '#ffffff'], some: ['#f9a8d4', '#ec4899', '#fdf2f8'] };
function platGrid(kind: PlatKind, w: number): Grid {
  const [a, b, c] = PLAT_PAL[kind];
  const g: Grid = Array.from({ length: 6 }, () => Array<string | null>(w).fill(null));
  for (let y = 0; y < 6; y++)
    for (let x = 0; x < w; x++) {
      const corner = (y === 0 || y === 5) && (x === 0 || x === w - 1);
      if (corner) continue;
      const edge = y === 0 || y === 5 || x === 0 || x === w - 1;
      g[y][x] = edge ? OUTLINE : y === 1 ? c : y === 4 ? b : a;
    }
  if (kind === 'galho') for (let x = 4; x < w - 3; x += 7) g[0][x] = g[0][x + 1] = '#16a34a';
  return g;
}
const PULO_COIN = sprite(['..OOOO..', '.OYYYYO.', 'OYWYYyYO', 'OYYYYyYO', 'OYYYYyYO', 'OYyyyyYO', '.OYYYYO.', '..OOOO..'], { Y: '#facc15', y: '#ca8a04', W: '#fff7ed' }, 8);
const PULO_SPRING = sprite(['.OOOOOO.', 'OSSSSSSO', '.OOOOOO.', '..OGGO..', '.OGOOGO.', '..OGGO..', '.OGOOGO.', 'OOOOOOOO'], { S: '#ef4444', G: '#cbd5e1' }, 8);
/** Ícone do jogo: plataformas subindo e uma mola (24 pixels). */
const PULO_ICON = (() => {
  const g: Grid = Array.from({ length: 24 }, () => Array<string | null>(24).fill(null));
  const put = (src: Grid, ox: number, oy: number) => src.forEach((r, y) => r.forEach((c, x) => c && (g[oy + y][ox + x] = c)));
  put(platGrid('galho', 12), 1, 17);
  put(platGrid('pedra', 10), 12, 10);
  put(platGrid('nuvem', 10), 3, 3);
  for (const [x, y] of [[15, 7], [16, 7], [17, 7], [18, 7], [16, 8], [17, 8], [15, 9], [18, 9]]) g[y][x] = y === 7 ? '#ef4444' : '#cbd5e1';
  return toSvg(g, 2);
})();

function Pulo({ pet, record, onFinish, onClose }: { pet: string; record: number; onFinish: (score: number, marks: Record<string, number>) => { fichas: number; record: boolean }; onClose: () => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const keys = useRef({ left: false, right: false });
  const [phase, setPhase] = useState<'pronto' | 'jogando' | 'fim'>('pronto');
  const [hud, setHud] = useState({ m: 0, coins: 0 });
  const [result, setResult] = useState<{ m: number; coins: number; fichas: number; record: boolean } | null>(null);
  const [held, setHeld] = useState<'' | 'l' | 'r'>('');
  useEffect(() => {
    if (phase !== 'jogando') return;
    const W = 180;
    const H = 300;
    const canvas = cv.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    const img = (src: string) => Object.assign(new Image(), { src });
    const petImg = img(pet);
    const coinImg = img(PULO_COIN);
    const springImg = img(PULO_SPRING);
    const platImgs = new Map<string, HTMLImageElement>();
    const platImg = (k: PlatKind, w: number) => {
      const key = `${k}:${w}`;
      if (!platImgs.has(key)) platImgs.set(key, img(toSvg(platGrid(k, w))));
      return platImgs.get(key)!;
    };
    interface P { x: number; y: number; w: number; kind: PlatKind; mv: number; gone?: boolean }
    interface It { kind: 'mola' | 'moeda'; p?: P; dx: number; x: number; y: number; taken?: boolean; used?: number }
    const S = { x: W / 2 - 12, y: H - 60, vx: 0, vy: -5.2, cam: 0, top: 0, coins: 0, face: 1, plats: [] as P[], items: [] as It[] };
    const addPlat = (y: number) => {
      const alt = Math.max(0, (S.cam + H - y) / 10);
      const hard = Math.min(1, alt / 600);
      const kind: PlatKind = Math.random() < 0.12 + hard * 0.15 && alt > 30 ? 'some' : alt < 120 ? 'galho' : alt < 300 ? 'pedra' : 'nuvem';
      const w = Math.max(22, 30 - Math.floor(hard * 6));
      const p: P = { x: Math.random() * (W - w), y, w, kind, mv: alt > 200 && Math.random() < 0.2 ? (Math.random() < 0.5 ? -0.5 : 0.5) : 0 };
      S.plats.push(p);
      if (kind !== 'some' && Math.random() < 0.1) S.items.push({ kind: 'mola', p, dx: Math.floor(Math.random() * (w - 8)), x: 0, y: 0 });
      else if (Math.random() < 0.28) S.items.push({ kind: 'moeda', dx: 0, x: Math.random() * (W - 8), y: y - 16 - Math.random() * 12 });
    };
    let y0 = H - 20;
    S.plats.push({ x: W / 2 - 15, y: y0, w: 30, kind: 'galho', mv: 0 });
    while (y0 > -H) {
      y0 -= 30 + Math.random() * 12;
      addPlat(y0);
    }
    const SKIES: [number, string, string][] = [[0, '#7dd3fc', '#e0f2fe'], [150, '#fb923c', '#fde68a'], [300, '#4c1d95', '#f472b6'], [450, '#0b1026', '#1e1b4b']];
    const mixC = (a: string, b: string, k: number) => {
      const x = parseInt(a.slice(1), 16);
      const z = parseInt(b.slice(1), 16);
      const c = (s: number) => Math.round(((x >> s) & 255) * (1 - k) + ((z >> s) & 255) * k);
      return `rgb(${c(16)} ${c(8)} ${c(0)})`;
    };
    const sky = (alt: number) => {
      for (let i = SKIES.length - 1; i >= 0; i--)
        if (alt >= SKIES[i][0]) {
          const a = SKIES[i];
          const b = SKIES[i + 1] ?? a;
          const k = b === a ? 0 : Math.min(1, (alt - a[0]) / (b[0] - a[0]));
          return [mixC(a[1], b[1], k), mixC(a[2], b[2], k)];
        }
      return ['#7dd3fc', '#e0f2fe'];
    };
    const stars = Array.from({ length: 40 }, () => [Math.random() * W, Math.random() * H, Math.random() < 0.2 ? 2 : 1]);
    let raf = 0;
    let last = performance.now();
    let alive = true;
    const end = () => {
      alive = false;
      const r = onFinish(S.top, { pulo_moedas: S.coins });
      setResult({ m: S.top, coins: S.coins, fichas: r.fichas, record: r.record });
      setPhase('fim');
    };
    const step = (dt: number) => {
      const k = keys.current;
      if (k.left) {
        S.vx = Math.max(-2.6, S.vx - 0.22);
        S.face = -1;
      } else if (k.right) {
        S.vx = Math.min(2.6, S.vx + 0.22);
        S.face = 1;
      } else S.vx *= 0.85;
      S.x += S.vx * dt;
      S.vy += 0.16 * dt;
      S.y += S.vy * dt;
      if (S.x > W) S.x = -24;
      if (S.x < -24) S.x = W;
      for (const p of S.plats)
        if (p.mv) {
          p.x += p.mv * dt;
          if (p.x < 0 || p.x + p.w > W) p.mv *= -1;
        }
      if (S.vy > 0)
        for (const p of S.plats) {
          if (p.gone) continue;
          const feet = S.y + 20;
          if (S.x + 18 > p.x && S.x + 6 < p.x + p.w && feet >= p.y && feet <= p.y + 6 + S.vy * dt) {
            const mola = S.items.find((it) => it.kind === 'mola' && it.p === p && S.x + 14 > p.x + it.dx && S.x + 10 < p.x + it.dx + 8);
            S.vy = mola ? -8.6 : -5.2;
            S.y = p.y - 20;
            if (p.kind === 'some') p.gone = true;
            if (mola) mola.used = 6;
            break;
          }
        }
      for (const it of S.items) {
        if (it.used) it.used--;
        if (it.kind === 'moeda' && !it.taken && Math.abs(S.x + 12 - (it.x + 4)) < 12 && Math.abs(S.y + 10 - (it.y + 4)) < 12) {
          it.taken = true;
          S.coins++;
        }
      }
      const line = H * 0.38;
      if (S.y < line) {
        const d = line - S.y;
        S.y = line;
        S.cam += d;
        for (const p of S.plats) p.y += d;
        for (const it of S.items) if (it.kind === 'moeda') it.y += d;
        for (const st of stars) st[1] = (st[1] + d * 0.3) % H;
      }
      S.top = Math.max(S.top, Math.floor(S.cam / 10));
      S.plats = S.plats.filter((p) => p.y < H + 10);
      S.items = S.items.filter((it) => (it.kind === 'mola' ? S.plats.includes(it.p!) : it.y < H + 10 && !it.taken));
      let minY = Math.min(...S.plats.map((p) => p.y));
      while (minY > -20) {
        minY -= 34 + Math.random() * (14 + Math.min(18, S.top / 25));
        addPlat(minY);
      }
      if (S.y > H + 10) end();
    };
    const draw = () => {
      const [c1, c2] = sky(S.top);
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, c1);
      grad.addColorStop(1, c2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      if (S.top > 330) {
        ctx.fillStyle = '#fef9c3';
        ctx.globalAlpha = Math.min(1, (S.top - 330) / 120);
        for (const [x, y, z] of stars) ctx.fillRect(Math.round(x), Math.round(y), z, z);
        ctx.globalAlpha = 1;
      }
      for (const p of S.plats) if (!p.gone) ctx.drawImage(platImg(p.kind, p.w), Math.round(p.x), Math.round(p.y));
      for (const it of S.items) {
        if (it.kind === 'mola' && it.p) ctx.drawImage(springImg, Math.round(it.p.x + it.dx), Math.round(it.p.y - (it.used ? 10 : 7)), 8, 8);
        else if (!it.taken) ctx.drawImage(coinImg, Math.round(it.x), Math.round(it.y), 8, 8);
      }
      // Pet com 24 de largura (a altura segue o desenho).
      const ph = petImg.naturalWidth ? Math.round((24 * petImg.naturalHeight) / petImg.naturalWidth) : 20;
      const px = Math.round(S.x);
      const py = Math.round(S.y + 20 - ph);
      ctx.save();
      if (S.face < 0) {
        ctx.translate(px + 24, py);
        ctx.scale(-1, 1);
        ctx.drawImage(petImg, 0, 0, 24, ph);
      } else ctx.drawImage(petImg, px, py, 24, ph);
      ctx.restore();
    };
    let lastHud = 0;
    const loop = (t: number) => {
      if (!alive) return;
      const dt = Math.min(3, (t - last) / 16.67 || 1);
      last = t;
      step(dt);
      if (!alive) return;
      draw();
      if (t - lastHud > 120) {
        lastHud = t;
        setHud({ m: S.top, coins: S.coins });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const kd = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keys.current.left = true;
      if (e.key === 'ArrowRight') keys.current.right = true;
    };
    const ku = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keys.current.left = false;
      if (e.key === 'ArrowRight') keys.current.right = false;
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps
  const press = (side: 'l' | 'r', on: boolean) => {
    keys.current = { left: on && side === 'l', right: on && side === 'r' };
    setHeld(on ? side : '');
  };
  const arrow = (side: 'l' | 'r') => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      press(side, true);
    },
    onPointerUp: () => press(side, false),
    onPointerCancel: () => press(side, false),
    onPointerLeave: () => press(side, false),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });
  return (
    <Fullscreen label="Pulo nas nuvens" className="jn-game-fs jn-pulo-fs" onClose={onClose}>
      <div className="jn-game-top">
        <button type="button" className="jn-fs-close" aria-label="Sair" onClick={onClose}>
          ✕
        </button>
        <strong className="jn-px">PULO NAS NUVENS</strong>
        <span className="jn-px small">{phase === 'jogando' ? `${hud.m} m · ● ${hud.coins}` : `Recorde: ${record} m`}</span>
      </div>
      <div className="jn-pulo">
        <div className="jn-pulo-stage">
          <canvas ref={cv} width={180} height={300} aria-label="Pulo nas nuvens" />
          {phase === 'pronto' && (
            <div className="jn-game-over">
              <strong className="jn-px">PULO NAS NUVENS</strong>
              <span>O pet pula sozinho. Segure ← ou → para ir para os lados; sair por um lado volta pelo outro. A mola dá pulo alto e a nuvem rosa some depois de um pulo. A altura vira fichas.</span>
              <div className="btn-row">
                <button type="button" className="btn primary" onClick={() => setPhase('jogando')}>
                  Começar
                </button>
              </div>
            </div>
          )}
          {phase === 'fim' && result && (
            <Result title="CAIU!" lines={`${result.m} m · ${result.coins} ${result.coins === 1 ? 'moedinha' : 'moedinhas'}`} fichas={result.fichas} record={result.record} onAgain={() => setPhase('pronto')} onClose={onClose} />
          )}
        </div>
        <div className="jn-pulo-pad">
          <button type="button" aria-label="Esquerda" className={held === 'l' ? 'on' : ''} {...arrow('l')}>
            ←
          </button>
          <button type="button" aria-label="Direita" className={held === 'r' ? 'on' : ''} {...arrow('r')}>
            →
          </button>
        </div>
      </div>
    </Fullscreen>
  );
}
