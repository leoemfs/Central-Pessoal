/**
 * E14: montagem do app na primeira abertura (entrevista de toque) e tutorial da barra.
 * Quem já usa o app recebe um convite no Início, com tudo já preenchido.
 */
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { go } from '../router';
import { useStore } from '../store';
import type { AppData, JournalRhythm } from '../types';
import { Fullscreen, Icon, notify, type IconName } from '../ui';
import { ACCENTS } from '../theme';
import { barFor, FAVORITABLE } from '../moduleBar';
import { UNLOCK_DAYS, unlockProgress } from '../journey';
import { setProfile } from '../profile';
import { todayISO } from '../utils';
import {
  currentSetup,
  fitFavorites,
  hiddenFrom,
  journalInvite,
  MIN_VISIBLE,
  modulesFromAreas,
  MODULES,
  PROFILE_AREA,
  rhythmLabel,
  SETUP_AREAS,
  tapFavorite,
  toggleModule,
} from '../setup';

// ---------- Abrir de qualquer lugar ----------

type Opener = { setup: Set<(mode: SetupMode) => void>; tutorial: Set<() => void> };
const openers: Opener = { setup: new Set(), tutorial: new Set() };
export type SetupMode = 'novo' | 'convite';
export const openSetup = (mode: SetupMode = 'convite') => openers.setup.forEach((f) => f(mode));
export const openTutorial = () => openers.tutorial.forEach((f) => f());

/** Fica no App: abre a montagem sozinha na primeira abertura, ou quando pedida (Início, Mais, Configurações). */
export function SetupHost() {
  const { data } = useStore();
  const [mode, setMode] = useState<SetupMode | null>(data.settings.setup === 'novo' ? 'novo' : null);
  useEffect(() => {
    const f = (m: SetupMode) => setMode(m);
    openers.setup.add(f);
    return () => void openers.setup.delete(f);
  }, []);
  if (!mode) return null;
  return <Montagem mode={mode} onClose={() => setMode(null)} />;
}

// ---------- Pedaços reaproveitados (Personalização) ----------

const WEEKDAYS: [number, string][] = [[1, 'Seg'], [2, 'Ter'], [3, 'Qua'], [4, 'Qui'], [5, 'Sex'], [6, 'Sáb'], [0, 'Dom']];

export function RhythmPicker({ value, onChange }: { value: JournalRhythm; onChange: (r: JournalRhythm) => void }) {
  const opt = (mode: JournalRhythm['mode'], title: string, hint: string, extra?: ReactNode) => (
    <div className={`option-card${value.mode === mode ? ' on' : ''}`}>
      <button type="button" className="rhythm-pick" role="radio" aria-checked={value.mode === mode} onClick={() => onChange({ ...value, mode, days: mode === 'dias' && value.days.length === 0 ? [2, 4] : value.days })}>
        <strong>{title}</strong>
        <span className="muted small">{hint}</span>
      </button>
      {value.mode === mode && extra}
    </div>
  );
  return (
    <div className="pz-options" role="radiogroup" aria-label="Ritmo do Diário">
      {opt('todo-dia', 'Todo dia', 'O Início convida a escrever até você escrever.')}
      {opt(
        'semana',
        'Algumas vezes na semana',
        'O Início mostra "1 de 3 nesta semana" e para de convidar quando bater a meta.',
        <div className="chips" role="group" aria-label="Vezes por semana">
          {[2, 3, 4, 5].map((n) => (
            <button key={n} type="button" className={`chip-btn${value.perWeek === n ? ' on' : ''}`} aria-pressed={value.perWeek === n} onClick={() => onChange({ ...value, perWeek: n })}>
              {n}x
            </button>
          ))}
        </div>,
      )}
      {opt(
        'dias',
        'Em dias certos',
        'O convite aparece só nesses dias.',
        <div className="chips" role="group" aria-label="Dias da semana">
          {WEEKDAYS.map(([d, l]) => {
            const on = value.days.includes(d);
            return (
              <button
                key={d}
                type="button"
                className={`chip-btn${on ? ' on' : ''}`}
                aria-pressed={on}
                onClick={() => {
                  const days = on ? value.days.filter((x) => x !== d) : [...value.days, d].sort();
                  if (days.length) onChange({ ...value, days });
                }}
              >
                {l}
              </button>
            );
          })}
        </div>,
      )}
      {opt('livre', 'Quando der', 'Sem convite e sem meta. Como sempre foi.')}
    </div>
  );
}

function AccentRow({ value, onChange }: { value: string | null; onChange: (a: string | null) => void }) {
  return (
    <div className="swatches" role="radiogroup" aria-label="Cor de destaque">
      <button type="button" role="radio" aria-checked={value === null} aria-label="Padrão (verde no escuro, azul no claro)" className={`swatch accent-default${value === null ? ' on' : ''}`} onClick={() => onChange(null)}>
        {value === null && <Icon name="check" size={18} />}
      </button>
      {ACCENTS.map((a) => (
        <button
          key={a.id}
          type="button"
          role="radio"
          aria-checked={value === a.id}
          aria-label={a.name}
          className={`swatch accent-swatch${value === a.id ? ' on' : ''}`}
          style={{ '--sw-d': a.dark.fill, '--sw-l': a.light.fill, '--sw-on-d': a.dark.on, '--sw-on-l': a.light.on } as CSSProperties}
          onClick={() => onChange(a.id)}
        >
          {value === a.id && <Icon name="check" size={18} />}
        </button>
      ))}
    </div>
  );
}

/** Barra de baixo em miniatura, mostrando os favoritos ao vivo. */
function MiniBar({ favorites }: { favorites: string[] }) {
  const items = [0, 1, 2, 3].map((i) => FAVORITABLE.find((f) => f.id === favorites[i]));
  return (
    <div className="mini-bar" aria-label="Prévia da barra de baixo">
      <span className="mb-item">
        <Icon name="home" size={22} />
      </span>
      {items.map((it, i) =>
        it ? (
          <span key={it.id} className="mb-item fav">
            <Icon name={it.icon as IconName} size={22} />
            <small>{it.label}</small>
          </span>
        ) : (
          <span key={`v${i}`} className="mb-item empty">
            <small>{i + 1}º</small>
          </span>
        ),
      )}
    </div>
  );
}

// ---------- A montagem ----------

type StepId = 'boas' | 'nome' | 'areas' | 'modulos' | 'favoritos' | 'ritmo' | 'barra' | 'jornada' | 'pronto';

function Montagem({ mode, onClose }: { mode: SetupMode; onClose: () => void }) {
  const { data, update } = useStore();
  const now = useMemo(() => currentSetup(data), []); // eslint-disable-line react-hooks/exhaustive-deps
  const fresh = mode === 'novo';
  const [name, setName] = useState(now.name);
  const [areas, setAreas] = useState<string[]>(now.areas);
  const [visible, setVisible] = useState<string[]>(fresh ? modulesFromAreas([]) : now.visible.filter((m) => m !== 'jornada'));
  const [picked, setPicked] = useState<string[]>(fresh ? [] : now.favorites);
  const [rhythm, setRhythm] = useState<JournalRhythm>(now.rhythm);
  const [accent, setAccent] = useState<string | null>(now.accent);
  const [journey, setJourney] = useState<boolean | null>(fresh ? null : data.settings.journeyWanted ?? !data.settings.hiddenModules.includes('jornada'));
  const [touchedModules, setTouchedModules] = useState(!fresh);

  const steps: StepId[] = ['boas', 'nome', 'areas', 'modulos', 'favoritos', ...(visible.includes('diario') ? (['ritmo'] as StepId[]) : []), 'barra', 'jornada', 'pronto'];
  const [at, setAt] = useState<StepId>('boas');
  const idx = steps.indexOf(at);
  const asked = steps.length - 2; // sem boas-vindas e "pronto"

  const finalVisible = journey === false ? visible.filter((m) => m !== 'jornada') : [...visible.filter((m) => m !== 'jornada'), 'jornada'];
  const favChoices = FAVORITABLE.filter((f) => finalVisible.includes(f.id));
  const favorites = fitFavorites(picked, finalVisible);

  function next() {
    if (at === 'areas' && !touchedModules) setVisible(modulesFromAreas(areas));
    if (at === 'modulos') setPicked((p) => p.filter((f) => visible.includes(f) || f === 'jornada'));
    setAt(steps[Math.min(idx + 1, steps.length - 1)]);
  }
  const back = () => (idx > 0 ? setAt(steps[idx - 1]) : skip());

  function apply(d: AppData): AppData {
    const profileAreas = [...new Set([...d.profile.areas, ...areas.map((a) => PROFILE_AREA[a]).filter(Boolean)])];
    const withProfile = setProfile((p) => ({
      ...p,
      name: name.trim().slice(0, 30),
      areas: profileAreas,
      onboarding: { ...p.onboarding, state: p.onboarding.state === 'novo' ? 'pulou' : p.onboarding.state },
    }))(d);
    return {
      ...withProfile,
      settings: {
        ...withProfile.settings,
        hiddenModules: hiddenFrom(finalVisible),
        favorites,
        journalRhythm: finalVisible.includes('diario') ? rhythm : d.settings.journalRhythm,
        barLayout: 'centro',
        accent,
        setupAreas: areas,
        journeyWanted: journey,
        setup: 'feito',
      },
    };
  }

  function finish(tutorial: boolean) {
    update(apply);
    onClose();
    if (location.hash !== '#/inicio' && location.hash !== '') go('inicio');
    if (tutorial) window.setTimeout(openTutorial, 250);
  }

  /** Pular: quem é novo fica com o padrão (tudo à vista); quem já usa fica como estava. */
  function skip() {
    update((d) => ({
      ...setProfile((p) => ({ ...p, onboarding: { ...p.onboarding, state: p.onboarding.state === 'novo' ? 'pulou' : p.onboarding.state } }))(d),
      settings: { ...d.settings, setup: 'feito' },
    }));
    onClose();
    notify('Tudo certo', 'Dá para montar o app quando quiser, em Configurações › Personalização.');
  }

  if (at === 'boas') {
    return (
      <Fullscreen onClose={skip} label="Montar o app" className="iv">
        <div className="iv-center">
          <span className="iv-logo">
            <Icon name="grid" size={32} />
          </span>
          <h2>{fresh ? 'Vamos montar o app do seu jeito' : 'Monte o app do seu jeito'}</h2>
          <p className="muted">{fresh ? 'Uns 2 minutos, só com toques. Você escolhe o que quer ver, os 4 favoritos da barra e a cor.' : 'Já está tudo preenchido com o que você usa hoje. É só ajustar.'}</p>
          <ul className="iv-points">
            <li>
              <Icon name="lock" size={18} /> Módulo desligado fica em Mais › Guardados. Nada é apagado.
            </li>
            <li>
              <Icon name="right" size={18} /> Dá para pular a qualquer momento.
            </li>
            <li>
              <Icon name="settings" size={18} /> Tudo muda depois em Configurações › Personalização.
            </li>
          </ul>
        </div>
        <div className="iv-foot col">
          <button type="button" className="btn primary" onClick={next}>
            Começar
          </button>
          <button type="button" className="btn ghost" onClick={skip}>
            {fresh ? 'Pular e usar o app' : 'Agora não'}
          </button>
        </div>
      </Fullscreen>
    );
  }

  if (at === 'pronto') {
    const favNames = favorites.map((f) => FAVORITABLE.find((x) => x.id === f)?.label).join(', ');
    const hidden = MODULES.filter((m) => !finalVisible.includes(m.id)).map((m) => m.label);
    return (
      <Fullscreen onClose={() => finish(false)} label="Pronto" className="iv">
        <div className="iv-center">
          <span className="iv-logo">
            <Icon name="check" size={32} />
          </span>
          <h2>Pronto{name.trim() ? `, ${name.trim()}` : ''}!</h2>
          <ul className="list iv-sum">
            <li className="row">
              <div className="row-body">
                <span className="row-title">Favoritos da barra</span>
                <span className="row-meta">{favNames}</span>
              </div>
            </li>
            <li className="row">
              <div className="row-body">
                <span className="row-title">Guardados no Mais</span>
                <span className="row-meta">{hidden.length ? hidden.join(', ') : 'Nenhum: tudo à vista'}</span>
              </div>
            </li>
            {finalVisible.includes('diario') && (
              <li className="row">
                <div className="row-body">
                  <span className="row-title">Diário</span>
                  <span className="row-meta">{rhythmLabel(rhythm)}</span>
                </div>
              </li>
            )}
            <li className="row">
              <div className="row-body">
                <span className="row-title">Jornada</span>
                <span className="row-meta">{journey === false ? 'Agora não (liga depois em Personalização)' : 'Quero: libera com 14 dias de uso'}</span>
              </div>
            </li>
          </ul>
        </div>
        <div className="iv-foot col">
          <button type="button" className="btn primary" onClick={() => finish(true)}>
            Ver como usar a barra (1 min)
          </button>
          <button type="button" className="btn ghost" onClick={() => finish(false)}>
            Ir para o Início
          </button>
        </div>
      </Fullscreen>
    );
  }

  let title = '';
  let sub = '';
  let body: ReactNode = null;
  let canGo = true;
  if (at === 'nome') {
    title = 'Como quer ser chamado(a)?';
    sub = 'Opcional. Aparece no "Bom dia" do Início.';
    body = <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" maxLength={30} autoComplete="given-name" aria-label="Seu nome" />;
  } else if (at === 'areas') {
    title = 'O que você quer organizar?';
    sub = 'Pode marcar várias. Os módulos certos já vêm marcados no próximo passo.';
    body = (
      <div className="setup-grid">
        {SETUP_AREAS.map((a) => {
          const on = areas.includes(a.id);
          return (
            <button key={a.id} type="button" className={`setup-tile${on ? ' on' : ''}`} aria-pressed={on} onClick={() => setAreas((x) => (on ? x.filter((y) => y !== a.id) : [...x, a.id]))}>
              <Icon name={a.icon as IconName} size={24} />
              <span>{a.label}</span>
            </button>
          );
        })}
      </div>
    );
  } else if (at === 'modulos') {
    title = 'Seus módulos';
    sub = `Toque para ligar ou desligar (pelo menos ${MIN_VISIBLE}). Os desligados ficam guardados no Mais, sem apagar nada.`;
    body = (
      <ul className="list setup-mods">
        {MODULES.filter((m) => m.id !== 'jornada').map((m) => {
          const on = visible.includes(m.id);
          return (
            <li key={m.id}>
              <button
                type="button"
                className={`row fav-pick${on ? ' on' : ''}`}
                aria-pressed={on}
                onClick={() => {
                  setTouchedModules(true);
                  const nextVis = toggleModule(visible, m.id);
                  if (nextVis === visible && on) notify(`Pelo menos ${MIN_VISIBLE} módulos`, 'Ligue outro antes de desligar este.');
                  setVisible(nextVis);
                }}
              >
                <span className="tile-icon">
                  <Icon name={m.icon as IconName} />
                </span>
                <div className="row-body">
                  <span className="row-title">{m.label}</span>
                  <span className="row-meta">{on ? m.hint : 'Vai para Mais › Guardados'}</span>
                </div>
                <span className={`setup-switch${on ? ' on' : ''}`} aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    );
  } else if (at === 'favoritos') {
    title = 'Seus 4 favoritos';
    sub = 'Toque na ordem em que quer ver na barra de baixo. Eles ficam no meio, entre o Início e o Mais.';
    canGo = picked.filter((f) => favChoices.some((c) => c.id === f)).length === 3;
    body = (
      <>
        <MiniBar favorites={picked.filter((f) => favChoices.some((c) => c.id === f))} />
        <div className="setup-grid">
          {favChoices.map((f) => {
            const n = picked.indexOf(f.id);
            return (
              <button key={f.id} type="button" className={`setup-tile${n >= 0 ? ' on' : ''}`} aria-pressed={n >= 0} onClick={() => setPicked((p) => tapFavorite(p.filter((x) => favChoices.some((c) => c.id === x)), f.id))}>
                {n >= 0 && <b className="setup-num">{n + 1}</b>}
                <Icon name={f.icon as IconName} size={24} />
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>
      </>
    );
  } else if (at === 'ritmo') {
    title = 'Com que frequência quer escrever no Diário?';
    sub = 'O app só convida nesse ritmo. Nunca conta como falta.';
    body = <RhythmPicker value={rhythm} onChange={setRhythm} />;
  } else if (at === 'barra') {
    title = 'Cor';
    sub = 'A cor de destaque do app. Dá para trocar depois em Personalização.';
    body = (
      <>
        <span className="field-label" style={{ marginTop: 16, display: 'block' }}>
          Cor de destaque
        </span>
        <AccentRow value={accent} onChange={setAccent} />
      </>
    );
  } else if (at === 'jornada') {
    title = 'Jornada: quer o modo jogo?';
    sub = 'É opcional, e dá para mudar depois.';
    body = (
      <>
        <div className="card setup-journey">
          <Icon name="sword" size={28} />
          <ul>
            <li>Cada hábito cumprido, conta paga no prazo ou registro no Diário vira XP e ouro.</li>
            <li>Seu personagem sobe de nível, ganha itens e pets e enfrenta chefes semanais.</li>
            <li>Nunca tira pontos. Libera depois de {UNLOCK_DAYS} dias de uso.</li>
          </ul>
        </div>
        <div className="pz-options" role="radiogroup" aria-label="Jornada">
          <button type="button" role="radio" aria-checked={journey === true} className={`option-card${journey === true ? ' on' : ''}`} onClick={() => setJourney(true)}>
            <strong>Quero a Jornada</strong>
            <span className="muted small">{(() => {
              const left = UNLOCK_DAYS - unlockProgress(data, todayISO()).active;
              return left > 0 ? `Faltam ${left} dias de uso. O app avisa quando liberar.` : 'Já está liberada!';
            })()}</span>
          </button>
          <button type="button" role="radio" aria-checked={journey === false} className={`option-card${journey === false ? ' on' : ''}`} onClick={() => setJourney(false)}>
            <strong>Agora não</strong>
            <span className="muted small">O app fica sem jogo. A Jornada fica em Mais › Guardados e liga depois em Personalização.</span>
          </button>
        </div>
      </>
    );
    canGo = journey !== null;
  }

  return (
    <Fullscreen onClose={skip} label="Montar o app" className="iv">
      <div className="iv-top">
        <button type="button" className="icon-btn" aria-label="Voltar" onClick={back}>
          <Icon name="left" />
        </button>
        <div className="progress" role="progressbar" aria-valuenow={idx} aria-valuemin={1} aria-valuemax={asked}>
          <div className="green" style={{ width: `${(idx / asked) * 100}%` }} />
        </div>
        <button type="button" className="btn ghost small" onClick={skip}>
          Pular
        </button>
      </div>
      <div className="iv-body" key={at}>
        <span className="iv-step">
          {idx} de {asked}
        </span>
        <h2>{title}</h2>
        <p className="muted">{sub}</p>
        {body}
      </div>
      <div className="iv-foot">
        <button type="button" className="btn primary" disabled={!canGo} onClick={next}>
          {canGo ? 'Continuar' : at === 'favoritos' ? `Escolha ${3 - picked.filter((f) => favChoices.some((c) => c.id === f)).length}` : 'Escolha uma opção'}
        </button>
      </div>
    </Fullscreen>
  );
}

// ---------- Convite para quem já usa ----------

export function SetupInvite() {
  const { data, update } = useStore();
  if (data.settings.setup !== 'convite') return null;
  const close = (tutorial: boolean) => {
    update((d) => ({ ...d, settings: { ...d.settings, setup: 'feito' } }));
    if (tutorial) openTutorial();
    else notify('Tudo bem', 'Dá para montar quando quiser, em Configurações › Personalização.');
  };
  return (
    <section className="card raised setup-invite">
      <div className="card-head">
        <h2>Monte o app do seu jeito</h2>
        <button type="button" className="icon-btn" aria-label="Agora não" onClick={() => close(false)}>
          <Icon name="x" size={18} />
        </button>
      </div>
      <p className="muted small">2 minutos. Escolha os módulos à vista, os favoritos, o ritmo do Diário e a Jornada. Já vem preenchido com o que você usa hoje.</p>
      <div className="btn-row">
        <button type="button" className="btn primary small" onClick={() => openSetup('convite')}>
          Fazer agora
        </button>
        <button type="button" className="btn ghost small" onClick={() => close(true)}>
          Só o tutorial da barra
        </button>
      </div>
    </section>
  );
}

// ---------- Convite do Diário (ritmo) ----------

export function JournalRhythmCard() {
  const { data } = useStore();
  const today = todayISO();
  const days = useMemo(() => data.journal.map((j) => j.createdAt.slice(0, 10)), [data.journal]);
  if (data.settings.hiddenModules.includes('diario')) return null;
  const inv = journalInvite(data.settings.journalRhythm, days, today);
  if (!inv) return null;
  return (
    <a className={`card rhythm-card${inv.invite ? '' : ' done'}`} href={inv.invite ? '#/diario/nova' : '#/diario'}>
      <Icon name={inv.invite ? 'journal' : 'check'} size={22} />
      <span>
        <strong>{inv.text}</strong>
        {inv.goal > 1 && (
          <span className="rhythm-dots" aria-hidden="true">
            {Array.from({ length: inv.goal }, (_, i) => (
              <i key={i} className={i < inv.done ? 'on' : ''} />
            ))}
          </span>
        )}
        {inv.invite && <span className="muted small">Toque para escrever.</span>}
      </span>
      <Icon name="right" size={18} />
    </a>
  );
}

// ---------- Tutorial da barra ----------

const TUTORIAL: { title: string; text: string; focus: string }[] = [
  { title: 'Estes são seus 4 favoritos', text: 'Os ícones ao lado do Início levam aos módulos que você mais usa. Toque em um.', focus: 'favs' },
  { title: 'A barra virou a do módulo', text: 'Dentro de um módulo, a barra mostra as ferramentas dele. O ícone com contorno é a casa do módulo. Toque numa ferramenta ao lado.', focus: 'tools' },
  { title: 'Voltar leva ao módulo', text: 'Use o voltar do celular (ou toque na casa, com contorno). Você volta para a casa do módulo, não para o começo.', focus: 'home' },
  { title: 'Trocar de módulo direto', text: 'Toque na estrela, na ponta da barra: aparecem os favoritos, e dá para pular para outro módulo sem passar pelo Início.', focus: 'favbtn' },
  { title: 'Segure para ver o nome', text: 'Não lembra o que é um ícone? Segure o dedo em cima dele por um instante.', focus: 'all' },
  { title: 'Puxe a barra para cima', text: 'Arraste a barra de baixo para cima: abre o Mais, com todos os módulos (e os guardados). Ele também fica no menu ☰. Os favoritos e a cor mudam em Configurações › Personalização.', focus: 'all' },
];

/** Fica no App. Avança sozinho quando a pessoa faz o passo de verdade; "Próximo" sempre funciona também. */
export function BarTutorial({ path, nav, showFavs }: { path: string; nav: string; showFavs: boolean }) {
  const { update } = useStore();
  const [step, setStep] = useState<number | null>(null);
  const [mod, setMod] = useState<string | null>(null);
  const [hash, setHash] = useState('');

  useEffect(() => {
    const f = () => {
      if (location.hash !== '#/inicio') go('inicio');
      setStep(0);
    };
    openers.tutorial.add(f);
    return () => void openers.tutorial.delete(f);
  }, []);

  const bar = barFor(path);
  useEffect(() => {
    if (step === null) return;
    const h = location.hash;
    if (step === 0 && bar) {
      setMod(bar.id);
      setHash(h);
      setStep(1);
    } else if (step === 1 && bar && bar.id === mod && h !== hash) {
      setStep(path === bar.items[1].section && !h.includes('/hoje') ? 1 : 2);
    } else if (step === 2 && bar && path === bar.items[1].section && !h.includes('/hoje')) {
      setStep(3);
    } else if (step === 3 && (showFavs || (bar && bar.id !== mod) || path === 'inicio')) {
      setStep(4);
    }
  }, [nav, showFavs, step]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.body.classList.toggle('tutorial-on', step !== null);
    if (step !== null) document.body.dataset.coach = TUTORIAL[step].focus;
    else delete document.body.dataset.coach;
  }, [step]);

  if (step === null) return null;
  const s = TUTORIAL[step];
  const end = () => {
    setStep(null);
    update((d) => ({ ...d, settings: { ...d.settings, tutorialSeen: true } }));
  };
  return (
    <div className="coach" role="dialog" aria-label="Como usar a barra">
      <span className="coach-step">
        {step + 1} de {TUTORIAL.length}
      </span>
      <strong>{s.title}</strong>
      <p>{s.text}</p>
      <div className="coach-actions">
        <button type="button" className="btn ghost small" onClick={end}>
          Pular tutorial
        </button>
        <button type="button" className="btn primary small" onClick={() => (step + 1 < TUTORIAL.length ? setStep(step + 1) : end())}>
          {step + 1 < TUTORIAL.length ? 'Próximo' : 'Concluir'}
        </button>
      </div>
    </div>
  );
}
