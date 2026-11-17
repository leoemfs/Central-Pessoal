/**
 * Bichinho virtual (N2.18b), seguindo a prévia 2: cartão no Fliperama e tela cheia no estilo da tela
 * cheia do personagem. O quarto segue a moradia da Jornada; o gatinho tem mais pixels. Lugares:
 * Quarto (agora), Banheiro, Lá fora e Loja (próximas partes). O ✕ volta para o Fliperama.
 */
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { Fullscreen, notify } from '../ui';
import { sprite } from '../jornada/art';
import { FICHA_ICON, homeIcon, MOON_ICON, PETS, petIcon, sunIcon, treeIcon } from '../jornada/catalog';
import { PET_SPRITES } from '../jornada/petsData';
import { PX } from '../jornada/px';
import { fichas } from '../jornada/games';
import { buyPetItem, CAT_HD, CAT_HD_BACK, CAT_HD_SIDE, catHdPalette, PET_SHOP, SHOP_CATS, type ShopCat, moodNow, petAction, petWish, roomOf, SNACK_PRICE, type PetAction } from '../jornada/bichinho';

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
  tub: sprite(['O..................O', 'OWWWWWWWWWWWWWWWWWWO', 'OWBBBBBBBBBBBBBBBBWO', 'OWWWWWWWWWWWWWWWWWWO', '.OWWWWWWWWWWWWWWWWO.', '..OO............OO..'], { W: '#f1f5f9', B: '#7dd3fc' }, 20),
  towel: sprite(['OOOOOO', 'OPPPPO', 'OPWPPO', 'OPPPPO', 'OPPWPO', 'OPPPPO', 'OOOOOO'], { P: '#f472b6', W: '#ffffff' }, 6),
  soap: sprite(['.OOOOO.', 'OPPPPPO', 'OPWPPPO', 'OPPPPPO', '.OOOOO.'], { P: '#a78bfa', W: '#ede9fe' }, 7),
  tooth: sprite(['.OOO.', 'OWWWO', 'OWWWO', '.OPO.', '.OPO.', '.OPO.', '.OOO.'], { W: '#ffffff', P: '#60a5fa' }, 5),
  duck: sprite(['..OOO...', '.OYYYO..', '.OYEYOOO', '..OYYYOR', 'OOOYYYO.', 'OYYYYYO.', '.OOOOO..'], { Y: '#facc15', E: '#111111', R: '#f97316' }, 8),
  sun: sunIcon('#fde047'),
  moon: MOON_ICON,
  flower: sprite(['.P.P.', 'PYPYP', '.PPP.', '..G..', '.GG..', '..G..'], { P: '#f472b6', Y: '#facc15', G: '#16a34a' }, 5),
  bed2: sprite(['..OOOOOOOOOOOOOOOO..', '.OPPPPPPPPPPPPPPPPO.', 'OPLLLLWLLLLLLWLLLLPO', 'OPLLLLLLLLLLLLLLLLPO', 'OPPPPPPPPPPPPPPPPPPO', 'OYYYYYYYYYYYYYYYYYYO', '.OOOOOOOOOOOOOOOOOO.'], { P: '#a855f7', L: '#e9d5ff', W: '#ffffff', Y: '#facc15' }, 20),
  mouse: sprite(['........OO', '..OOOOOOGO', '.OGGGGGGGO', 'OGGEGGGGGO', 'OGGGGGGGO.', '.OOOOOOO..'], { G: '#a1a1aa', E: '#111111' }, 10),
  yarn: sprite(['..OOOO...', '.ORRrRO..', 'ORrRRrRO.', 'ORRrRRRO.', '.ORRrRO.O', '..OOOO.OO'], { R: '#f472b6', r: '#be185d' }, 9),
  rug: sprite(['.OOOOOOOOOOOOOOOOOOOOOO.', 'OGYGYGYGYGYGYGYGYGYGYGYO', 'OYGGGGGGGGGGGGGGGGGGGGYO', 'OGYGYGYGYGYGYGYGYGYGYGYO', '.OOOOOOOOOOOOOOOOOOOOOO.'], { G: '#16a34a', Y: '#facc15' }, 24),
  frame: sprite(['OOOOOOOOOO', 'OYYYYYYYYO', 'OYSSSSSSYO', 'OYSSMMSSYO', 'OYSMMMMSYO', 'OYGGGGGGYO', 'OYYYYYYYYO', 'OOOOOOOOOO'], { Y: '#ca8a04', S: '#7dd3fc', M: '#64748b', G: '#22c55e' }, 10),
  bow: sprite(['OO..OO.', 'ORROORO', 'ORRORRO', 'ORROORO', 'OO..OO.'], { R: '#ef4444' }, 7),
  hat: sprite(['...OO...', '..OYYO..', '.OYRYYO.', 'OYYYYRYO', 'OOOOOOOO'], { Y: '#facc15', R: '#ef4444' }, 8),
  scarf: sprite(['OOOOOOOOOOOO', 'OGGGGGGGGGGO', '.OOOOOOOGGO.', '.......OGGO.', '.......OOOO.'], { G: '#22c55e' }, 12),
  doghouse: sprite(['.....OO.....', '....ORRO....', '...ORRRRO...', '..ORRRRRRO..', '.ORRRRRRRRO.', 'OOOOOOOOOOOO', '.OWWWWWWWWO.', '.OWWOOOOWWO.', '.OWWO..OWWO.', '.OOOO..OOOO.'], { R: '#ef4444', W: '#fef3c7' }, 12),
  brush: sprite(['OOOOOO..', 'OWWWWO..', 'OBBBBOOO', '.OOOOOBB', '......OO'], { W: '#e5e7eb', B: '#7c4a2d' }, 8),
};

/** O desenho do pet: o gatinho tem a versão com mais pixels; os outros usam o desenho de sempre, maior. */
type View = 'frente' | 'costas' | 'lado';
function petArt(id: string, variant: string | undefined, view: View = 'frente'): { src: string; hd: boolean; cols: number } {
  if (id === 'gato') {
    const v = PET_SPRITES.gato.variants.find((x) => x.id === variant) ?? PET_SPRITES.gato.variants[0];
    const rows = view === 'lado' ? CAT_HD_SIDE : view === 'costas' ? CAT_HD_BACK : CAT_HD;
    return { src: sprite(rows, catHdPalette(v.pal as { C: string; E: string; N: string }), rows[0].length), hd: true, cols: rows[0].length };
  }
  return { src: petIcon(id, variant), hd: false, cols: 0 };
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

type Place = 'quarto' | 'banheiro' | 'fora' | 'loja';
const PLACE_NAME: Record<Place, string> = { quarto: 'QUARTO', banheiro: 'BANHEIRO', fora: 'LÁ FORA', loja: 'LOJA' };
type ObjKey = keyof typeof OBJ;

/** Roupinha no pet, conforme o ângulo (em pixels do desenho). */
function Wear({ wear, view, scale }: { wear: string | null; view: View; scale: number }) {
  if (!wear) return null;
  const side = view === 'lado';
  const p = ({ bow: side ? [23, -1, 7] : [16, -1, 7], hat: side ? [19, -3, 8] : [8, -3, 8], scarf: side ? [16, 8, 12] : [6, 13, 12] } as Record<string, number[]>)[wear];
  if (!p) return null;
  return <img alt="" src={OBJ[wear as ObjKey]} style={{ position: 'absolute', imageRendering: 'pixelated', left: p[0] * scale, top: p[1] * scale, width: p[2] * scale }} />;
}

export function BichinhoTelaCheia({ onClose }: { onClose: () => void }) {
  const { data, update } = useStore();
  const s = data.journey;
  const id = s.equipped.pet ?? 'gato';
  const pet = PETS.find((p) => p.id === id);
  const name = s.petNames[id]?.trim() || pet?.name || 'Seu pet';
  const room = roomOf(s.equipped.morada);
  const [place, setPlace] = useState<Place>('quarto');
  const [lastPlace, setLastPlace] = useState<Exclude<Place, 'loja'>>('quarto');
  const [shopCat, setShopCat] = useState<ShopCat>('brinquedos');
  const scene = place === 'loja' ? lastPlace : place;
  const pr = s.petRoom;
  const has = (i: string) => pr.owned.includes(i);
  const [view, setView] = useState<View>('frente');
  const [walk, setWalk] = useState<{ x: number; flip: boolean } | null>(null);
  const art = petArt(id, s.petStyle[id], view);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(t);
  }, []);
  const v = moodNow(s.vpet, now);
  const [sleeping, setSleeping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hop, setHop] = useState(0);
  const [fx, setFx] = useState<{ id: number; kind: 'heart' | 'bubble' | 'sun' | 'star'; x: number }[]>([]);
  const [toyKick, setToyKick] = useState(0);
  const seq = useRef(0);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const later = (fn: () => void, ms: number) => (reduced() ? fn() : timers.current.push(window.setTimeout(fn, ms)));
  const hour = now.getHours();
  const phase = hour >= 18 || hour < 6 ? 'noite' : hour >= 15 ? 'tarde' : 'manha';
  const night = phase === 'noite';

  const burst = (kind: 'heart' | 'bubble' | 'sun' | 'star', n: number) => {
    if (reduced()) return;
    const items = Array.from({ length: n }, (_, i) => ({ id: ++seq.current, kind, x: 40 + i * 5 }));
    setFx((f) => [...f, ...items]);
    window.setTimeout(() => setFx((f) => f.filter((x) => !items.some((y) => y.id === x.id))), 1400);
  };
  const save = (a: PetAction): boolean => {
    const msg = petAction(s, a, new Date());
    if (typeof msg === 'string') {
      notify('Não deu', msg);
      return false;
    }
    update((d) => {
      const r = petAction(d.journey, a, new Date());
      return typeof r === 'string' ? d : { ...d, journey: r };
    });
    return true;
  };
  const act = (a: PetAction) => {
    if (busy) return;
    if (sleeping && a !== 'dormir') return notify(`Shh, ${name} está dormindo`, 'Toque em Acordar para brincar de novo.');
    if (a === 'dormir' && !sleeping) {
      setSleeping(true);
      setView('costas');
      return;
    }
    if (!save(a)) return;
    if (a === 'dormir') {
      setSleeping(false);
      setView('frente');
    }
    if (a === 'carinho') burst('heart', 3);
    if (a === 'petisco') burst('heart', 1);
    if (a === 'escovar' || a === 'dentes') burst('bubble', 4);
    if (a === 'brincar') setToyKick((k) => k + 1);
    if (a === 'sol') burst(night ? 'star' : 'sun', night ? 3 : 1);
    if (a === 'banho') {
      // No banho ele fica de costas, dentro da banheira, com bolhas.
      setBusy(true);
      setView('costas');
      burst('bubble', 8);
      later(() => {
        setView('frente');
        setBusy(false);
        notify('Cheirosinho!', 'Limpeza no máximo.');
      }, 1600);
      return;
    }
    if (a === 'passear' || a === 'bolinha') {
      // De lado: vai até a ponta do quintal e volta.
      setBusy(true);
      setView('lado');
      if (a === 'bolinha') setToyKick((k) => k + 1);
      setWalk({ x: 50, flip: false });
      later(() => setWalk({ x: 78, flip: false }), 30);
      later(() => setWalk({ x: 78, flip: true }), 1700);
      later(() => setWalk({ x: 50, flip: true }), 1750);
      later(() => {
        setWalk(null);
        setView('frente');
        setBusy(false);
        setHop((h) => h + 1);
      }, 3500);
      return;
    }
    if (a !== 'dormir') setHop((h) => h + 1);
  };
  const go = (p: Place) => {
    if (busy) return;
    if (p !== 'loja') setLastPlace(p);
    setPlace(p);
    setSleeping(false);
    setView('frente');
  };
  const buy = (itemId: string) => {
    const it = PET_SHOP.find((x) => x.id === itemId)!;
    if (itemId === 'snack') {
      setLastPlace('quarto');
      setPlace('quarto');
      return act('petisco');
    }
    const r = buyPetItem(s, itemId);
    if (typeof r === 'string') return notify('Não deu', r);
    const was = has(itemId);
    update((d) => {
      const x = buyPetItem(d.journey, itemId);
      return typeof x === 'string' ? d : { ...d, journey: x };
    });
    setLastPlace(it.place);
    notify(was ? 'Pronto' : `Comprado: ${it.name}`, it.place === 'fora' ? 'Veja lá fora, no quintal.' : it.place === 'banheiro' ? 'Já está no banheiro.' : 'Já está no quarto.', { icon: OBJ[itemId as ObjKey] });
  };
  const scale = 7;
  const width = art.hd ? art.cols * scale : 160;
  const flip = walk?.flip ?? false;

  const ACTS: Record<Exclude<Place, 'loja'>, { id: PetAction; label: string; icon: string; cost?: number }[]> = {
    quarto: [
      { id: 'carinho', label: 'Carinho', icon: PX.heart },
      { id: 'petisco', label: 'Petisco', icon: OBJ.snack, cost: SNACK_PRICE },
      { id: 'brincar', label: 'Brincar', icon: OBJ[pr.toy as ObjKey] },
      { id: 'dormir', label: sleeping ? 'Acordar' : 'Dormir', icon: OBJ[pr.bed as ObjKey] },
      { id: 'escovar', label: 'Escovar', icon: OBJ.brush },
    ],
    banheiro: [
      { id: 'banho', label: 'Banho', icon: OBJ.soap },
      { id: 'dentes', label: 'Dentes', icon: OBJ.tooth },
      { id: 'secar', label: 'Secar', icon: OBJ.towel },
      { id: 'patinho', label: 'Patinho', icon: OBJ.duck },
    ],
    fora: [
      { id: 'passear', label: 'Passear', icon: petArt(id, s.petStyle[id], 'lado').src },
      { id: 'bolinha', label: 'Bolinha', icon: OBJ.ball },
      // À noite, o mesmo descanso vira olhar as estrelas.
      night ? { id: 'sol', label: 'Ver as estrelas', icon: OBJ.moon } : { id: 'sol', label: 'Tomar sol', icon: OBJ.sun },
      { id: 'flores', label: 'Flores', icon: OBJ.flower },
    ],
  };
  const sky = night ? 'linear-gradient(#0b1026, #1e1b4b 62%)' : phase === 'tarde' ? 'linear-gradient(#f59e0b, #fdba74 62%)' : 'linear-gradient(#38bdf8, #bae6fd 62%)';

  return (
    <Fullscreen label={`Bichinho virtual: ${name}`} className="jn-vp" onClose={onClose}>
      <div className="jn-vp-stage">
        {scene === 'quarto' && (
          <>
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
            {has('frame') && <img className="jn-vp-obj" alt="" src={OBJ.frame} style={{ left: '44%', top: '38%', width: 64 }} />}
            {has('rug') && <img className="jn-vp-obj" alt="" src={OBJ.rug} style={{ left: '26%', bottom: '4%', width: 200 }} />}
            <img className="jn-vp-obj" alt="" src={OBJ[pr.bed as ObjKey]} style={{ left: '4%', bottom: '22%', width: 130 }} />
            <img className="jn-vp-obj" alt="" src={v.full > 60 ? OBJ.bowl : OBJ.bowlE} style={{ left: '74%', bottom: '22%', width: 52 }} />
            <img key={`toy${toyKick}`} className={`jn-vp-obj${toyKick ? ' jn-vp-roll' : ''}`} alt="" src={OBJ[pr.toy as ObjKey]} style={{ left: '80%', bottom: '8%', width: 40 }} />
          </>
        )}
        {scene === 'banheiro' && (
          <>
            <div className="jn-vp-wall jn-vp-tiles" />
            <div className="jn-vp-floor jn-vp-bathfloor" />
            <img className="jn-vp-obj" alt="" src={OBJ.towel} style={{ left: '8%', top: '40%', width: 48 }} />
          </>
        )}
        {scene === 'fora' && (
          <>
            <div className="jn-vp-sky" style={{ background: sky }} />
            <img className="jn-vp-obj" alt="" src={night ? OBJ.moon : OBJ.sun} style={{ left: '74%', top: '34%', width: 52 }} />
            <div className="jn-vp-hill" style={{ background: phase === 'tarde' ? '#3f6212' : '#166534' }} />
            <img className="jn-vp-obj" alt="" src={homeIcon(s.equipped.morada, phase)} style={{ left: '4%', bottom: '30%', width: s.equipped.morada === 'castelo' ? 170 : s.equipped.morada === 'torre' ? 70 : 140 }} />
            <img className="jn-vp-obj" alt="" src={treeIcon(phase)} style={{ left: '80%', bottom: '28%', width: 70 }} />
            <div className="jn-vp-grass" />
            <div className="jn-vp-path" />
            {has('doghouse') && <img className="jn-vp-obj" alt="" src={OBJ.doghouse} style={{ left: '2%', bottom: '3%', width: 76 }} />}
            {has('flower') && (
              <>
                <img className="jn-vp-obj" alt="" src={OBJ.flower} style={{ left: '76%', bottom: '4%', width: 30 }} />
                <img className="jn-vp-obj" alt="" src={OBJ.flower} style={{ left: '84%', bottom: '9%', width: 30 }} />
                <img className="jn-vp-obj" alt="" src={OBJ.flower} style={{ left: '91%', bottom: '3%', width: 30 }} />
              </>
            )}
            <img key={`ball${toyKick}`} className={`jn-vp-obj${toyKick ? ' jn-vp-throw' : ''}`} alt="" src={OBJ.ball} style={{ left: '30%', bottom: '6%', width: 34 }} />
          </>
        )}
        <button
          key={`pet${hop}`}
          type="button"
          className={`jn-vp-pet${hop ? ' hop' : ''}${flip ? ' flip' : ''}`}
          aria-label={`Fazer carinho em ${name}`}
          style={{ width, left: walk ? `${walk.x}%` : undefined }}
          onClick={() => act('carinho')}
        >
          <span style={{ position: 'relative', display: 'block' }}>
            <img alt="" src={art.src} style={{ width }} />
            {art.hd && <Wear wear={pr.wear} view={view} scale={scale} />}
          </span>
        </button>
        {scene === 'banheiro' && <img className="jn-vp-obj jn-vp-tub" alt="" src={OBJ.tub} />}
        {scene === 'banheiro' && has('duck') && <img className="jn-vp-obj" alt="" src={OBJ.duck} style={{ left: '66%', bottom: '16%', width: 34, zIndex: 5 }} />}
        {fx.map((f) =>
          f.kind === 'bubble' ? (
            <span key={f.id} className="jn-vp-fx bubble" style={{ left: `${f.x}%` }} aria-hidden="true" />
          ) : (
            <span key={f.id} className="jn-vp-fx heart" style={{ left: `${f.x}%` }} aria-hidden="true">
              {f.kind === 'sun' ? '☀' : f.kind === 'star' ? '✦' : '♥'}
            </span>
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
        {scene === 'fora' && night && <div className="jn-vp-dark" style={{ background: 'rgb(8 10 40 / .25)' }} />}
        <div className="jn-vp-top">
          <button type="button" className="jn-fs-close" aria-label="Fechar e voltar aos mini games" onClick={onClose}>
            ✕
          </button>
          <span className="jn-fs-clock">
            {PLACE_NAME[place]} · {pad(now.getHours())}:{pad(now.getMinutes())}
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
          {(['quarto', 'banheiro', 'fora', 'loja'] as const).map((p) => (
            <button key={p} type="button" aria-pressed={place === p} onClick={() => go(p)}>
              {p === 'quarto' ? 'Quarto' : p === 'banheiro' ? 'Banheiro' : p === 'fora' ? 'Lá fora' : 'Loja'}
            </button>
          ))}
        </div>
        {place === 'loja' ? (
          <>
            <div className="jn-chipset jn-vp-shopcats" role="group" aria-label="Categoria da loja">
              {SHOP_CATS.map((c) => (
                <button key={c.id} type="button" aria-pressed={shopCat === c.id} onClick={() => setShopCat(c.id)}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="jn-vp-shoprow">
              {PET_SHOP.filter((it) => it.cat === shopCat).map((it) => {
                const own = has(it.id);
                const using = own && (pr.toy === it.id || pr.bed === it.id || pr.wear === it.id);
                return (
                  <button key={it.id} type="button" className={`${own ? 'own' : ''}${!own && fichas(s) < it.price ? ' poor' : ''}`} onClick={() => buy(it.id)}>
                    <span className="sq">
                      <img alt="" src={OBJ[it.id as ObjKey]} />
                    </span>
                    {it.name}
                    <small>{own ? (using ? 'Usando' : 'Seu') : `${it.price} fichas`}</small>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="jn-vp-acts">
            {ACTS[place].map((a) => (
              <button key={a.id} type="button" className={a.cost ? 'cost' : undefined} onClick={() => act(a.id)}>
                <span className="sq">
                  <img alt="" src={a.icon} />
                </span>
                {a.label}
                {a.cost ? <small>{a.cost} fichas</small> : null}
              </button>
            ))}
          </div>
        )}
        <span className="jn-fs-hint">{place === 'loja' ? 'O que você compra aparece no cenário · as fichas vêm dos mini games' : `Toque numa ação · toque em ${name} para fazer carinho`}</span>
      </section>
    </Fullscreen>
  );
}
