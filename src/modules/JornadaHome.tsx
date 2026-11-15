/**
 * Jornada (N2.1): personagem e cena. Aparece depois do desbloqueio, com "Quero a Jornada".
 * Primeiro a pessoa cria o avatar; depois vê a cena (céu pelo horário, estrelas pelos dias
 * de uso, chuva pela data), nível, XP, ouro e a Ficha com os atributos e a classe.
 */
import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { journeyStats } from '../journey';
import { ATTRIBUTES } from '../habits';
import { todayISO } from '../utils';
import { Segmented, Toggle } from '../ui';
import { avatarIcon, homeIcon, treeIcon, skyPalette, ATTR_CODES, type AvatarLook } from '../jornada/catalog';
import { HAIRS, SKINS } from '../jornada/artData';
import { classOf, recentAttributes, TITLES, wallet, type JourneyState } from '../jornada/rules';
import { skyAt, starPositions } from '../jornada/sky';

const fmt = (n: number) => n.toLocaleString('pt-BR');
const SKIN_NAMES: Record<string, string> = { clara: 'Clara', media: 'Média', escura: 'Escura' };
const HAIR_NAMES: Record<string, string> = { castanho: 'Castanho', preto: 'Preto', loiro: 'Loiro', ruivo: 'Ruivo' };

/** Relógio que muda a cada minuto (o céu acompanha a hora). */
function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

export function JourneyScene({ look, state, activeDays, now, tall }: { look: AvatarLook; state: JourneyState; activeDays: string[]; now: Date; tall?: boolean }) {
  const sky = skyAt(now, activeDays, state.weather);
  const phase = sky.rain ? 'chuva' : sky.phase;
  const t = skyPalette(phase);
  const night = sky.phase === 'noite';
  const outfit = { elmo: state.equipped.elmo, armadura: state.equipped.armadura, botas: state.equipped.botas, arma: state.equipped.arma };
  const label = `${night ? 'Noite' : sky.phase === 'tarde' ? 'Fim de tarde' : 'Manhã'}${sky.rain ? ' com chuva' : ''}${sky.rainbow ? ' com arco-íris' : ''}${night ? `, ${sky.stars} ${sky.stars === 1 ? 'estrela' : 'estrelas'}` : ''}`;
  return (
    <div className={`jn-scene${tall ? ' tall' : ''}`} role="img" aria-label={`Cena da Jornada: ${label}`} style={{ background: `linear-gradient(${t.sky1}, ${t.sky2})` }}>
      {night &&
        starPositions(sky.stars).map((s, i) => (
          <span key={i} className={`jn-star${s.big ? ' big' : ''}`} style={{ left: `${s.x}%`, top: `${s.y * 0.7}%`, animationDelay: `${s.delay}s` }} />
        ))}
      {!sky.rain && <span className={`jn-sun${night ? ' moon' : ''}`} style={{ background: t.sun }} />}
      {!night && (
        <>
          <span className="jn-cloud" style={{ background: t.cloud, color: t.cloud, left: '14%', top: '16%' }} />
          <span className="jn-cloud small" style={{ background: t.cloud, color: t.cloud, left: '58%', top: '28%' }} />
        </>
      )}
      {sky.rainbow && <span className="jn-rainbow" />}
      <div className="jn-ground" style={{ background: t.grass, borderTopColor: t.ground }} />
      <img className="jn-home" src={homeIcon(state.equipped.morada, phase)} alt="" />
      <img className="jn-tree" src={treeIcon(phase)} alt="" />
      <img className="jn-avatar" src={avatarIcon(look, outfit)} alt="" />
      {sky.rain && <div className="jn-rain" />}
    </div>
  );
}

/** Criar (ou mudar) a aparência do avatar, com a cena ao vivo. */
function AvatarEditor({ initial, onSave, onCancel }: { initial: AvatarLook; onSave: (a: AvatarLook) => void; onCancel?: () => void }) {
  const { data } = useStore();
  const now = useNow();
  const [look, setLook] = useState<AvatarLook>(initial);
  return (
    <>
      <section className="card raised journey-hero">
        <JourneyScene look={look} state={data.journey} activeDays={data.settings.activeDays} now={now} />
        <div className="journey-info">
          <div>
            <strong>{onCancel ? 'Mudar aparência' : 'Crie seu personagem'}</strong>
            <p className="muted small">{onCancel ? 'Os itens e o progresso continuam os mesmos.' : 'Ele evolui com o que você já faz no app. Dá para mudar depois.'}</p>
          </div>
          <Segmented
            label="Corpo"
            options={[
              { value: 'f', label: 'Feminino' },
              { value: 'm', label: 'Masculino' },
            ]}
            value={look.gender}
            onChange={(g) => setLook({ ...look, gender: g })}
          />
          <Swatches label="Pele" names={SKIN_NAMES} colors={Object.fromEntries(Object.entries(SKINS).map(([k, v]) => [k, v[0]]))} value={look.skin} onChange={(skin) => setLook({ ...look, skin })} />
          <Swatches label="Cabelo" names={HAIR_NAMES} colors={HAIRS} value={look.hair} onChange={(hair) => setLook({ ...look, hair })} />
          <div className="btn-row">
            {onCancel && (
              <button type="button" className="btn" onClick={onCancel}>
                Cancelar
              </button>
            )}
            <button type="button" className="btn primary" onClick={() => onSave(look)}>
              {onCancel ? 'Salvar' : 'Começar a Jornada'}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

function Swatches({ label, names, colors, value, onChange }: { label: string; names: Record<string, string>; colors: Record<string, string>; value: string; onChange: (v: string) => void }) {
  return (
    <div className="jn-swatches" role="radiogroup" aria-label={label}>
      <span className="small muted">{label}</span>
      <div>
        {Object.keys(colors).map((k) => (
          <button key={k} type="button" role="radio" aria-checked={value === k} aria-label={names[k] ?? k} title={names[k] ?? k} className={`jn-swatch${value === k ? ' on' : ''}`} style={{ background: colors[k] }} onClick={() => onChange(k)} />
        ))}
      </div>
    </div>
  );
}

export function JornadaHome() {
  const { data, update } = useStore();
  const now = useNow();
  const today = todayISO();
  const [editing, setEditing] = useState(false);
  const state = data.journey;
  const saveLook = (a: AvatarLook) => {
    update((d) => ({ ...d, journey: { ...d.journey, avatar: { gender: a.gender, skin: String(a.skin), hair: String(a.hair) } } }));
    setEditing(false);
  };

  if (!state.avatar || editing) {
    return <AvatarEditor initial={state.avatar ?? { gender: 'f', skin: 'media', hair: 'castanho' }} onSave={saveLook} onCancel={state.avatar ? () => setEditing(false) : undefined} />;
  }

  const look = state.avatar;
  const s = journeyStats(data, today);
  const w = wallet(data, state, today);
  const cls = classOf(w.attrs, recentAttributes(data, today));
  const title = TITLES.find((x) => x.id === state.title);
  const top = Math.max(10, ...ATTR_CODES.map((c) => w.attrs[c]));
  const g = look.gender;

  return (
    <>
      <section className="card raised journey-hero">
        <JourneyScene look={look} state={state} activeDays={data.settings.activeDays} now={now} tall />
        <div className="journey-info">
          <div className="toggle-row">
            <div>
              <strong>{cls[g]}</strong>
              <span className="muted small">{title ? title[g] : 'Sem título'}</span>
            </div>
            <span className="pixel-num small-num">LV {s.level}</span>
          </div>
          <div>
            <div className="toggle-row small muted">
              <span>XP</span>
              <span className="tabular">
                {fmt(s.xpInLevel)} / {fmt(s.xpForNext)}
              </span>
            </div>
            <div className="xp-bar">
              <div style={{ width: `${(s.xpInLevel / s.xpForNext) * 100}%` }} />
            </div>
          </div>
          <div className="summary">
            <div className="summary-box">
              <span className="label">Ouro</span>
              <span className="value gold">{fmt(w.gold)}</span>
            </div>
            <div className="summary-box">
              <span className="label">Cristais</span>
              <span className="value crystal">{fmt(w.crystals)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Ficha</h2>
        </div>
        <ul className="jn-attrs">
          {ATTR_CODES.map((code) => {
            const a = ATTRIBUTES.find((x) => x.code === code)!;
            const v = w.attrs[code];
            return (
              <li key={code}>
                <span className="jn-attr-code" style={{ color: a.color }}>
                  {code}
                </span>
                <span className="jn-attr-name">{a.name}</span>
                <span className="jn-attr-bar" aria-hidden="true">
                  <span style={{ width: `${(v / top) * 100}%`, background: a.color }} />
                </span>
                <span className="tabular jn-attr-val">{fmt(v)}</span>
              </li>
            );
          })}
        </ul>
        <p className="muted small" style={{ marginTop: 10 }}>
          {cls.codes.length === 0
            ? 'Sua classe aparece quando os atributos começarem a subir (hábitos com atributo, contas no prazo, diário e revisões).'
            : cls.codes.length === 2
              ? `Classe híbrida: ${cls.codes.join(' e ')} estão quase empatados.`
              : `Classe pelo atributo mais alto: ${ATTRIBUTES.find((x) => x.code === cls.codes[0])!.name}.`}
        </p>
      </section>

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
          <button type="button" className="btn" onClick={() => setEditing(true)}>
            Mudar aparência
          </button>
          <button type="button" className="btn ghost" onClick={() => update((d) => ({ ...d, settings: { ...d.settings, journeyChoice: 'depois' } }))}>
            Pausar a Jornada
          </button>
        </div>
      </section>
    </>
  );
}
