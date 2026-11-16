/**
 * Bichinho virtual (N2.18b), seguindo a prévia 2: cartão no Fliperama e tela cheia no estilo da tela
 * cheia do personagem. O quarto segue a moradia da Jornada; o gatinho tem mais pixels. Lugares:
 * Quarto (agora), Banheiro, Lá fora e Loja (próximas partes). O ✕ volta para o Fliperama.
 */
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { Fullscreen, notify } from '../ui';
import { sprite } from '../jornada/art';
import { FICHA_ICON, PETS, petIcon } from '../jornada/catalog';
import { PET_SPRITES } from '../jornada/petsData';
import { PX } from '../jornada/px';
import { fichas } from '../jornada/games';
import { CAT_HD, catHdPalette, moodNow, petAction, petWish, roomOf, SNACK_PRICE, type PetAction } from '../jornada/bichinho';

const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const pad = (n: number) => String(n).padStart(2, '0');

const OBJ = {
  bed: sprite(['..OOOOOOOOOOOOOOOO..', '.ORRRRRRRRRRRRRRRRO.', 'ORWWWWWWWWWWWWWWWWRO', 'ORWWWWWWWWWWWWWWWWRO', 'ORRRRRRRRRRRRRRRRRRO', 'OBBBBBBBBBBBBBBBBBBO', '.OOOOOOOOOOOOOOOOOO.'], { R: '#ef4444', W: '#fecaca', B: '#7c2d12' }, 20),
  win: sprite(['OOOOOOOOOOOO', 'OSSSSSOSSSSO', 'OSSWSSOSSSSO', 'OSSSSSOSSSSO', 'OOOOOOOOOOOO', 'OSSSSSOSSSSO', 'OSSSSSOSSSSO', 'OOOOOOOOOOOO', 'BBBBBBBBBBBB'], { S: '#7dd3fc', W: '#ffffff', B: '#7c4a2d' }, 12),
  ball: sprite(['..OOOO..', '.ORRWRO.', 'ORWRRRRO', 'ORRRRWRO', 'OWRRRRRO', 'ORRWRRRO', '.ORRRRO.', '..OOOO..'], { R: '#3b82f6', W: '#fde047' }, 8),
  bowl: sprite(['.OOOOOOOO.', 'OFFFFFFFFO', 'OBBBBBBBBO', '.OBBBBBBO.', '..OOOOOO..'], { F: '#d97706', B: '#ef4444' }, 10),
  bowlE: sprite(['.OOOOOOOO.', 'OBBBBBBBBO', 'OBBBBBBBBO', '.OBBBBBBO.', '..OOOOOO..'], { B: '#ef4444' }, 10),
  banner: sprite(['OOOOOOOO', 'ORRRRRRO', 'ORRYYRRO', 'ORYYYYRO', 'ORRYYRRO', 'ORRRRRRO', 'ORRRRRRO', '.ORRRRO.', '..ORRO..', '...OO...'], { R: '#b91c1c', Y: '#facc15' }, 8),
  torch: sprite(['..Y..', '.YRY.', '.RRR.', '..B..', '..B..', '..B..', '.OOO.'], { Y: '#fde047', R: '#f97316', B: '#7c4a2d' }, 5),
  snack: sprite(['..OOO...', '.OBBBO..', 'OBBWBBO.', 'OBBBBBO.', '.OBBBO..', '..OOO...'], { B: '#d97706', W: '#fde68a' }, 8),
  brush: sprite(['OOOOOO..', 'OWWWWO..', 'OBBBBOOO', '.OOOOOBB', '......OO'], { W: '#e5e7eb', B: '#7c4a2d' }, 8),
};

/** O desenho do pet: o gatinho tem a versão com mais pixels; os outros usam o desenho de sempre, maior. */
function petArt(id: string, variant: string | undefined): { src: string; hd: boolean } {
  if (id === 'gato') {
    const v = PET_SPRITES.gato.variants.find((x) => x.id === variant) ?? PET_SPRITES.gato.variants[0];
    return { src: sprite(CAT_HD, catHdPalette(v.pal as { C: string; E: string; N: string }), 24), hd: true };
  }
  return { src: petIcon(id, variant), hd: false };
}

function Bars({ v }: { v: { joy: number; full: number; rest: number; clean: number } }) {
  const rows: [string, number, string][] = [
    ['Alegria', v.joy, '#f472b6'],
    ['Barriga', v.full, '#f59e0b'],
    ['Energia', v.rest, '#a78bfa'],
    ['Limpeza', v.clean, '#38bdf8'],
  ];
  return (
    <div className="jn-vp-moods">
      {rows.map(([n, val, c]) => (
        <span key={n}>
          {n}
          <i role="progressbar" aria-label={n} aria-valuenow={Math.round(val)} aria-valuemin={0} aria-valuemax={100}>
            <b style={{ width: `${val}%`, background: c }} />
          </i>
        </span>
      ))}
    </div>
  );
}

/** Cartão grande no topo do Fliperama. */
export function BichinhoCard({ onOpen }: { onOpen: () => void }) {
  const { data } = useStore();
  const s = data.journey;
  const id = s.equipped.pet ?? 'gato';
  const pet = PETS.find((p) => p.id === id);
  const name = s.petNames[id]?.trim() || pet?.name || 'Seu pet';
  const room = roomOf(s.equipped.morada);
  const art = petArt(id, s.petStyle[id]);
  const v = moodNow(s.vpet, new Date());
  return (
    <button type="button" className="jn-vp-card" onClick={onOpen}>
      <span className="jn-vp-thumb" style={{ background: room.wall }}>
        <span className="jn-vp-thumb-floor" style={{ background: room.floor }} />
        <img alt="" src={art.src} />
      </span>
      <strong>Bichinho virtual</strong>
      <span className="muted small">
        {petWish(v, name)} · <b style={{ color: '#f472b6' }}>toque para entrar</b>
      </span>
    </button>
  );
}

export function BichinhoTelaCheia({ onClose }: { onClose: () => void }) {
  const { data, update } = useStore();
  const s = data.journey;
  const id = s.equipped.pet ?? 'gato';
  const pet = PETS.find((p) => p.id === id);
  const name = s.petNames[id]?.trim() || pet?.name || 'Seu pet';
  const room = roomOf(s.equipped.morada);
  const art = petArt(id, s.petStyle[id]);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(t);
  }, []);
  const v = moodNow(s.vpet, now);
  const [sleeping, setSleeping] = useState(false);
  const [hop, setHop] = useState(0);
  const [fx, setFx] = useState<{ id: number; kind: 'heart' | 'bubble'; x: number }[]>([]);
  const [toyKick, setToyKick] = useState(0);
  const seq = useRef(0);
  const night = now.getHours() >= 18 || now.getHours() < 6;

  const burst = (kind: 'heart' | 'bubble', n: number) => {
    if (reduced()) return;
    const items = Array.from({ length: n }, (_, i) => ({ id: ++seq.current, kind, x: 42 + i * 6 }));
    setFx((f) => [...f, ...items]);
    window.setTimeout(() => setFx((f) => f.filter((x) => !items.some((y) => y.id === x.id))), 1300);
  };
  const act = (a: PetAction) => {
    if (sleeping && a !== 'dormir') return notify(`Shh, ${name} está dormindo`, 'Toque em Acordar para brincar de novo.');
    if (a === 'dormir' && !sleeping) {
      setSleeping(true);
      return;
    }
    const msg = petAction(s, a, new Date());
    if (typeof msg === 'string') return notify('Não deu', msg);
    update((d) => {
      const r = petAction(d.journey, a, new Date());
      return typeof r === 'string' ? d : { ...d, journey: r };
    });
    if (a === 'dormir') setSleeping(false);
    if (a === 'carinho') burst('heart', 3);
    if (a === 'petisco') burst('heart', 1);
    if (a === 'escovar') burst('bubble', 4);
    if (a === 'brincar') setToyKick((k) => k + 1);
    if (a !== 'dormir') setHop((h) => h + 1);
  };
  const soon = (what: string) => notify(`${what}: em breve`, 'Chega numa próxima parte do bichinho virtual.');
  const scale = art.hd ? 7 : 12;
  const width = art.hd ? 24 * scale : 160;

  const actions: { id: PetAction; label: string; icon: string; cost?: number }[] = [
    { id: 'carinho', label: 'Carinho', icon: PX.heart },
    { id: 'petisco', label: 'Petisco', icon: OBJ.snack, cost: SNACK_PRICE },
    { id: 'brincar', label: 'Brincar', icon: OBJ.ball },
    { id: 'dormir', label: sleeping ? 'Acordar' : 'Dormir', icon: OBJ.bed },
    { id: 'escovar', label: 'Escovar', icon: OBJ.brush },
  ];

  return (
    <Fullscreen label={`Bichinho virtual: ${name}`} className="jn-vp" onClose={onClose}>
      <div className="jn-vp-stage">
        <div className="jn-vp-wall" style={{ background: room.wall }} />
        <div className="jn-vp-floor" style={{ background: room.floor }} />
        <img className="jn-vp-obj" alt="" src={OBJ.win} style={{ left: '10%', top: '38%', width: 84, filter: night ? 'brightness(.55) hue-rotate(40deg)' : undefined }} />
        {room.extra.includes('banner') && <img className="jn-vp-obj" alt="" src={OBJ.banner} style={{ left: '74%', top: '36%', width: 48 }} />}
        {room.extra.includes('torch') && (
          <>
            <img className="jn-vp-obj" alt="" src={OBJ.torch} style={{ left: '34%', top: '42%', width: 28 }} />
            <img className="jn-vp-obj" alt="" src={OBJ.torch} style={{ left: '62%', top: '42%', width: 28 }} />
          </>
        )}
        <img className="jn-vp-obj" alt="" src={OBJ.bed} style={{ left: '4%', bottom: '22%', width: 130 }} />
        <img className="jn-vp-obj" alt="" src={v.full > 60 ? OBJ.bowl : OBJ.bowlE} style={{ left: '74%', bottom: '22%', width: 52 }} />
        <img key={`toy${toyKick}`} className={`jn-vp-obj${toyKick ? ' jn-vp-roll' : ''}`} alt="" src={OBJ.ball} style={{ left: '80%', bottom: '8%', width: 40 }} />
        <button key={`pet${hop}`} type="button" className={`jn-vp-pet${hop ? ' hop' : ''}`} aria-label={`Fazer carinho em ${name}`} style={{ width }} onClick={() => act('carinho')}>
          <img alt="" src={art.src} style={{ width }} />
        </button>
        {fx.map((f) =>
          f.kind === 'heart' ? (
            <span key={f.id} className="jn-vp-fx heart" style={{ left: `${f.x}%` }} aria-hidden="true">
              ♥
            </span>
          ) : (
            <span key={f.id} className="jn-vp-fx bubble" style={{ left: `${f.x}%` }} aria-hidden="true" />
          ),
        )}
        {sleeping && (
          <>
            <div className="jn-vp-dark" />
            <span className="jn-vp-zz jn-px" aria-hidden="true">
              z z z
            </span>
          </>
        )}
        <div className="jn-vp-top">
          <button type="button" className="jn-fs-close" aria-label="Fechar e voltar aos mini games" onClick={onClose}>
            ✕
          </button>
          <span className="jn-fs-clock">
            QUARTO · {pad(now.getHours())}:{pad(now.getMinutes())}
          </span>
        </div>
        <section className="jn-vp-plate">
          <strong>
            {name} · {pet?.name ?? ''}
          </strong>
          <span className="jn-fichas-pill">
            <img alt="" src={FICHA_ICON} />
            <b>{fichas(s)} fichas</b>
          </span>
          <Bars v={v} />
        </section>
      </div>
      <section className="jn-vp-panel">
        <div className="jn-vp-places" role="group" aria-label="Lugar">
          <button type="button" aria-pressed="true">
            Quarto
          </button>
          <button type="button" aria-pressed="false" onClick={() => soon('Banheiro')}>
            Banheiro
          </button>
          <button type="button" aria-pressed="false" onClick={() => soon('Lá fora')}>
            Lá fora
          </button>
          <button type="button" aria-pressed="false" onClick={() => soon('Loja')}>
            Loja
          </button>
        </div>
        <div className="jn-vp-acts">
          {actions.map((a) => (
            <button key={a.id} type="button" className={a.cost ? 'cost' : undefined} onClick={() => act(a.id)}>
              <span className="sq">
                <img alt="" src={a.icon} />
              </span>
              {a.label}
              {a.cost ? <small>{a.cost} fichas</small> : null}
            </button>
          ))}
        </div>
        <span className="jn-fs-hint">Toque numa ação · toque em {name} para fazer carinho</span>
      </section>
    </Fullscreen>
  );
}
