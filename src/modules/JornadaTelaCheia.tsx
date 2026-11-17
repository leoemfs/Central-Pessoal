/**
 * Jornada (N2.12): personagem em tela cheia, seguindo a prancha "v3 · Avatar em tela cheia"
 * da prévia "Jornada RPG". A cena ocupa a tela toda; por cima, nome · nível, título em placa,
 * classe e estrelas; embaixo, o céu para escolher e os 7 espaços (moldura na cor da raridade).
 */
import { useRef, useState } from 'react';
import { useStore } from '../store';
import { todayISO } from '../utils';
import { Fullscreen } from '../ui';
import { ATTRIBUTES } from '../habits';
import { avatarIcon, homeIcon, HOMES, itemById, itemIcon, PETS, petIcon, RARITY, skyPalette, treeIcon, sunIcon, MOON_ICON, type AvatarLook, type Slot } from '../jornada/catalog';
import { classOf, equip, nextInSlot, type JourneyState } from '../jornada/rules';
import { hash01 } from '../jornada/rules';
import { skyAt, starPositions, starsTonight } from '../jornada/sky';

type Sky = 'auto' | 'manha' | 'tarde' | 'noite' | 'chuva';
const SKY_NAMES: Record<Exclude<Sky, 'auto'>, string> = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite', chuva: 'Chuva' };
const SLOTS: { id: Slot | 'pet' | 'morada'; label: string }[] = [
  { id: 'elmo', label: 'Elmo' },
  { id: 'armadura', label: 'Roupa' },
  { id: 'botas', label: 'Botas' },
  { id: 'arma', label: 'Arma' },
  { id: 'anel', label: 'Anel' },
  { id: 'colar', label: 'Colar' },
  { id: 'magico', label: 'Mágico' },
  { id: 'pet', label: 'Pet' },
  { id: 'morada', label: 'Casa' },
];
const pad = (n: number) => String(n).padStart(2, '0');

export function TelaCheia({
  look,
  state,
  activeDays,
  now,
  level,
  title,
  cls,
  onSlot,
  onClose,
}: {
  look: AvatarLook & { name: string };
  state: JourneyState;
  activeDays: string[];
  now: Date;
  level: number;
  title: string | null;
  cls: ReturnType<typeof classOf>;
  onSlot: (s: Slot | 'pet' | 'morada') => void;
  onClose: () => void;
}) {
  const [sky, setSky] = useState<Sky>('auto');
  const { update } = useStore();
  const timer = useRef<number | undefined>(undefined);
  const held = useRef(false);
  const holdStart = (id: Slot | 'pet' | 'morada') => {
    held.current = false;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      held.current = true;
      onSlot(id);
    }, 550);
  };
  const holdEnd = () => window.clearTimeout(timer.current);
  // Tocar troca na hora: passa pelos itens que você tem e, quando o espaço pode, fica sem nada.
  const cycle = (id: Slot | 'pet' | 'morada') =>
    update((d) => {
      const next = nextInSlot(d.journey, id);
      const r = equip(d.journey, id, next, 999);
      return typeof r === 'string' ? d : { ...d, journey: r };
    });
  const [hearts, setHearts] = useState(0);
  const [jump, setJump] = useState(0);
  const real = skyAt(now, activeDays, state.weather);
  const phase = sky === 'auto' ? (real.rain ? 'chuva' : real.phase) : sky;
  const t = skyPalette(phase);
  const night = phase === 'noite';
  const rain = phase === 'chuva';
  const stars = night ? starsTonight(activeDays, todayISO()) : 0;
  const g = look.gender;
  const who = `${look.name || cls[g]} · LV ${level}`;
  const top = cls.codes[0] ? ATTRIBUTES.find((a) => a.code === cls.codes[0]) : null;
  const classLine = cls.codes.length === 2 ? `Classe: ${cls[g]} (${cls.codes.join(' e ')} quase empatados)` : top ? `Classe: ${cls[g]} (${top.name} é o seu atributo mais alto)` : 'A classe aparece quando os atributos começarem a subir';
  const clock = `${sky === 'auto' ? (real.rain ? 'CHUVA' : SKY_NAMES[real.phase].toUpperCase()) : SKY_NAMES[sky].toUpperCase()} · ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  // O item mágico flutua ao lado do personagem (sem mágico, o anel).
  const floatId = state.equipped.magico ?? state.equipped.anel;
  const artifact = floatId ? itemById(floatId) : null;
  const pet = state.equipped.pet ? PETS.find((p) => p.id === state.equipped.pet) : null;
  const home = HOMES.find((h) => h.id === state.equipped.morada) ?? HOMES[0];
  const outfit = { elmo: state.equipped.elmo, armadura: state.equipped.armadura, botas: state.equipped.botas, arma: state.equipped.arma, colar: state.equipped.colar };
  const drops = rain ? Array.from({ length: 46 }, (_, i) => ({ x: Math.round(hash01(`gota:${i}`, 1) * 100), d: (0.6 + hash01(`gota:${i}`, 2) * 0.6).toFixed(2), w: (hash01(`gota:${i}`, 3) * 1.2).toFixed(2) })) : [];

  return (
    <Fullscreen label="Personagem em tela cheia" className="jn-fs" onClose={onClose}>
      <div className={`jn-fs-stage${rain ? ' rain' : ''}`} style={{ background: `linear-gradient(${t.sky1} 0%, ${t.sky2} 62%)` }}>
        {night &&
          starPositions(stars).map((s, i) => (
            <span key={i} className={`jn-fs-star${s.big ? ' big' : ''}`} style={{ left: `${s.x}%`, top: `${s.y * 0.55}%`, animationDelay: `${s.delay}s` }} />
          ))}
        {night && <img className="jn-fs-moon" alt="" src={MOON_ICON} />}
        {night && <span className="jn-fs-shoot" />}
        {!night && !rain && <img className="jn-fs-sun" alt="" src={sunIcon(t.sun)} style={{ top: phase === 'tarde' ? '40%' : '33%' }} />}
        {!night && (
          <>
            <i className="jn-fs-cloud" style={{ background: t.cloud, left: '8%', top: '14%', width: 84 }} />
            <i className="jn-fs-cloud" style={{ background: t.cloud, left: '58%', top: '24%', width: 64, animationDelay: '-6s' }} />
            <i className="jn-fs-cloud" style={{ background: t.cloud, left: '30%', top: '36%', width: 72, animationDelay: '-3s' }} />
          </>
        )}
        <div className="jn-fs-hill" style={{ background: t.leafShade }} />
        <img className={`jn-fs-home${home.id === 'torre' ? ' tall' : ''}`} src={homeIcon(home.id, phase)} alt={home.name} />
        <img className="jn-fs-tree" src={treeIcon(phase)} alt="" />
        <div className="jn-fs-ground" style={{ background: t.ground, borderTopColor: t.grass }} />
        <div className="jn-fs-path" style={{ background: t.path }} />
        {pet && (
          <button type="button" className="jn-fs-pet" aria-label={`Fazer carinho em ${state.petNames[pet.id] || pet.name.toLowerCase()}`} onClick={() => setHearts((h) => h + 1)}>
            <img src={petIcon(pet.id, state.petStyle[pet.id])} alt="" />
            {hearts > 0 && (
              <span key={hearts} className="jn-fs-heart" aria-hidden="true">
                ♥
              </span>
            )}
          </button>
        )}
        {artifact && <img className="jn-fs-artifact" src={itemIcon(artifact)} alt={artifact.name} style={{ filter: `drop-shadow(0 0 10px ${RARITY[artifact.rarity].color})` }} />}
        <button type="button" className={`jn-fs-hero${jump ? ' jump' : ''}`} key={jump} aria-label={`${look.name || 'Personagem'}: tocar para pular`} onClick={() => setJump((j) => j + 1)}>
          <img src={avatarIcon(look, outfit)} alt="" />
        </button>
        {rain && (
          <div className="jn-fs-rain" aria-hidden="true">
            {drops.map((d, i) => (
              <i key={i} style={{ left: `${d.x}%`, animationDuration: `${d.d}s`, animationDelay: `${d.w}s` }} />
            ))}
          </div>
        )}

        <div className="jn-fs-top">
          <button type="button" className="jn-fs-close" aria-label="Fechar tela cheia" onClick={onClose}>
            ✕
          </button>
          <span className="jn-fs-clock">{clock}</span>
        </div>
        <section className="jn-fs-plate">
          <strong>{who}</strong>
          {title && <span className="jn-fs-title jn-px">{title.toUpperCase()}</span>}
          <span className="jn-fs-class">{classLine}</span>
          {night && <span className="jn-fs-stars">{stars} {stars === 1 ? 'estrela' : 'estrelas'} · uma por dia registrado no último mês</span>}
        </section>
      </div>

      <section className="jn-fs-panel">
        <div className="jn-fs-skies" role="group" aria-label="Céu">
          {(['manha', 'tarde', 'noite', 'chuva'] as const).map((k) => (
            <button key={k} type="button" aria-pressed={phase === k && sky !== 'auto'} className={phase === k ? 'on' : ''} onClick={() => setSky(sky === k ? 'auto' : k)}>
              {SKY_NAMES[k]}
            </button>
          ))}
        </div>
        <div className="jn-fs-slots" role="group" aria-label="Equipamentos">
          {SLOTS.map((s) => {
            const id = s.id === 'pet' ? state.equipped.pet : s.id === 'morada' ? state.equipped.morada : state.equipped[s.id];
            const it = s.id === 'pet' || s.id === 'morada' ? null : id ? itemById(id) : null;
            const rarity = s.id === 'pet' ? pet?.rarity : s.id === 'morada' ? home.rarity : it?.rarity;
            const icon = s.id === 'pet' ? (pet ? petIcon(pet.id, state.petStyle[pet.id]) : null) : s.id === 'morada' ? homeIcon(home.id, 'manha') : it ? itemIcon(it) : null;
            const name = s.id === 'pet' ? (pet ? state.petNames[pet.id] || pet.name : undefined) : s.id === 'morada' ? home.name : it?.name;
            return (
              <button
                key={s.id}
                type="button"
                aria-label={`${s.label}: ${name ?? 'vazio'}. Toque para trocar; segure para abrir o Arsenal`}
                onPointerDown={() => holdStart(s.id)}
                onPointerUp={holdEnd}
                onPointerLeave={holdEnd}
                onPointerCancel={holdEnd}
                onContextMenu={(e) => e.preventDefault()}
                onClick={() => (held.current ? (held.current = false) : cycle(s.id))}
              >
                <span className="jn-fs-slot" style={{ borderColor: rarity ? RARITY[rarity].color : '#3f3f46' }}>
                  {icon ? <img src={icon} alt="" /> : <b aria-hidden="true">+</b>}
                </span>
                <small>{s.label}</small>
              </button>
            );
          })}
        </div>
        <span className="jn-fs-hint">Toque num espaço para trocar · segure para abrir o Arsenal</span>
      </section>
    </Fullscreen>
  );
}
