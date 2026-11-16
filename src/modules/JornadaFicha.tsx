/**
 * Jornada (N2.5): Ficha, Títulos, Forja mística e Classes, seguindo as pranchas
 * "v2 · Atributos do avatar" e "v3 · Títulos, forja mística e classes" da prévia "Jornada RPG".
 */
import { useStore } from '../store';
import { todayISO } from '../utils';
import { notify } from '../ui';
import { ATTRIBUTES } from '../habits';
import { weekStart } from '../review';
import { ATTR_CODES, GEM_ICON, ITEMS, itemIcon, medalIcon, RARITY, type AttrCode } from '../jornada/catalog';
import { acquire, attributes, availability, CLASSES, classOf, HYBRIDS, recentAttributes, shopContext, titleProgress, TITLES, wallet } from '../jornada/rules';

const fmt = (n: number) => n.toLocaleString('pt-BR');
const attr = (c: string) => ATTRIBUTES.find((a) => a.code === c)!;

/** Ficha: cada atributo com o ganho da semana e de onde vem; classe explicada. */
export function AttrsCard({ gender }: { gender: 'f' | 'm' }) {
  const { data } = useStore();
  const today = todayISO();
  const all = attributes(data, today);
  const week = attributes(data, today, weekStart(today));
  const cls = classOf(all, recentAttributes(data, today));
  const max = Math.max(10, ...ATTR_CODES.map((c) => all[c]));
  const from = (code: AttrCode) => {
    const names = data.habits.filter((h) => h.attrs.includes(code) && !h.archivedAt).map((h) => h.name);
    if (code === 'DIS') names.push('contas no prazo', 'revisões');
    if (code === 'SAB') names.push('diário');
    return names.length ? names.slice(0, 4).join(' · ') : 'Nenhum hábito treina este atributo ainda';
  };
  const top = cls.codes[0];
  return (
    <section className="card">
      <div className="card-head">
        <h2>Ficha</h2>
        <span className="jn-px jn-class-tag">CLASSE: {cls[gender].toUpperCase()}</span>
      </div>
      <p className="muted small">
        {cls.codes.length === 0
          ? 'A classe aparece quando os atributos começarem a subir.'
          : cls.codes.length === 2
            ? `${attr(cls.codes[0]).name} e ${attr(cls.codes[1]).name} estão quase empatados: classe híbrida. Ela muda se você mudar a rotina.`
            : `Seu atributo mais alto (${attr(top).name}) define a classe. Ela muda se você mudar a rotina.`}
      </p>
      <ul className="jn-attrs2">
        {ATTR_CODES.map((code) => {
          const a = attr(code);
          return (
            <li key={code}>
              <div className="toggle-row">
                <span>
                  <b className="jn-px" style={{ color: a.color }}>
                    {code}
                  </b>{' '}
                  {a.name}
                </span>
                <span className="small" style={{ color: week[code] ? 'var(--green-text)' : 'var(--faint)' }}>
                  {week[code] ? `+${fmt(week[code])} esta semana` : 'nada esta semana'}
                </span>
              </div>
              <div className="jn-attr-row">
                <span className="jn-attr-bar" aria-hidden="true">
                  <span style={{ width: `${(all[code] / max) * 100}%`, background: a.color }} />
                </span>
                <strong className="tabular">{fmt(all[code])}</strong>
              </div>
              <span className="muted small">{from(code)}</span>
            </li>
          );
        })}
      </ul>
      <p className="muted small">Cada dia cumprido soma pontos nos atributos que o hábito treina. Nunca diminui.</p>
    </section>
  );
}

/** Itens liberados de graça quando o atributo chega ao valor. */
export function UnlocksCard() {
  const { data, update } = useStore();
  const today = todayISO();
  const all = attributes(data, today);
  const state = data.journey;
  const rows = ITEMS.filter((it) => it.attrUnlock && it.rarity !== 'mistico')
    .map((it) => {
      const [code, need] = Object.entries(it.attrUnlock!)[0] as [AttrCode, number];
      return { it, code, need, have: all[code], owned: state.owned.includes(it.id) };
    })
    .sort((a, b) => Number(a.owned) - Number(b.owned) || b.have / b.need - a.have / a.need);
  const take = (id: string) =>
    update((d) => {
      const r = acquire(d.journey, id, shopContext(d, d.journey, todayISO()));
      if (typeof r === 'string') {
        notify('Não deu', r);
        return d;
      }
      notify('Liberado!', 'O item foi para o seu Arsenal.');
      return { ...d, journey: r };
    });
  return (
    <section className="card">
      <div className="card-head">
        <h2>Desbloqueios por atributo</h2>
      </div>
      <ul className="jn-unlocks">
        {rows.map((r) => {
          const a = attr(r.code);
          const ready = !r.owned && r.have >= r.need;
          return (
            <li key={r.it.id}>
              <img alt="" src={itemIcon(r.it)} />
              <div>
                <span>
                  <b className="jn-px" style={{ color: a.color }}>
                    {r.code} {r.need}
                  </b>{' '}
                  → {r.it.name}
                </span>
                {!r.owned && !ready && (
                  <span className="jn-near-bar">
                    <i style={{ width: `${Math.min(100, (r.have / r.need) * 100)}%`, background: a.color }} />
                  </span>
                )}
              </div>
              {r.owned ? (
                <span className="small" style={{ color: 'var(--green-text)' }}>
                  Seu
                </span>
              ) : ready ? (
                <button type="button" className="btn primary small" onClick={() => take(r.it.id)}>
                  Pegar
                </button>
              ) : (
                <span className="muted small tabular">
                  {fmt(r.have)}/{r.need}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function TitlesView({ gender }: { gender: 'f' | 'm' }) {
  const { data, update } = useStore();
  const today = todayISO();
  const list = titleProgress({ d: data, today, attrs: attributes(data, today) });
  const current = data.journey.title;
  const cur = TITLES.find((t) => t.id === current);
  const idx = (id: string) => TITLES.findIndex((t) => t.id === id);
  const earned = list.filter((t) => t.earned).length;
  return (
    <>
      <section className="card jn-title-now">
        <img alt="" src={medalIcon(Math.max(0, idx(current ?? '')), !!cur)} />
        <div>
          <span className="muted small">Título em uso (aparece embaixo do nome)</span>
          <span className="jn-px jn-fs-title">{cur ? cur[gender].toUpperCase() : 'NENHUM'}</span>
        </div>
      </section>
      <section className="card">
        <div className="card-head">
          <h2>Títulos</h2>
          <span className="muted small">
            {earned} de {list.length} conquistados
          </span>
        </div>
        <ul className="jn-titles">
          {list
            .slice()
            .sort((a, b) => Number(b.earned) - Number(a.earned) || b.have / b.need - a.have / a.need)
            .map((t) => (
              <li key={t.id} className={t.earned ? 'earned' : ''}>
                <img alt="" src={medalIcon(idx(t.id), t.earned)} />
                <div>
                  <strong>{t[gender]}</strong>
                  <span className="muted small">{t.rule}</span>
                  {!t.earned && (
                    <span className="jn-near-bar">
                      <i style={{ width: `${Math.min(100, (t.have / t.need) * 100)}%`, background: 'var(--jn-xp)' }} />
                    </span>
                  )}
                </div>
                {t.earned ? (
                  <button type="button" className={`btn small${current === t.id ? '' : ' primary'}`} disabled={current === t.id} onClick={() => update((d) => ({ ...d, journey: { ...d.journey, title: t.id } }))}>
                    {current === t.id ? 'Em uso' : 'Usar'}
                  </button>
                ) : (
                  <span className="muted small tabular">
                    {fmt(Math.min(t.have, t.need))}/{fmt(t.need)}
                  </span>
                )}
              </li>
            ))}
        </ul>
        <p className="muted small">Cada título conquistado também vale 1 cristal para a forja.</p>
      </section>
    </>
  );
}

const REQ_NAME = (code: string) => (code === 'cristais' ? 'cristais' : code === 'limpo' ? 'dias limpos depois de uma recaída' : code);

export function ForgeView() {
  const { data, update } = useStore();
  const today = todayISO();
  const ctx = shopContext(data, data.journey, today);
  const items = ITEMS.filter((i) => i.rarity === 'mistico');
  const forge = (id: string) =>
    update((d) => {
      const r = acquire(d.journey, id, shopContext(d, d.journey, todayISO()));
      if (typeof r === 'string') {
        notify('Ainda não', r);
        return d;
      }
      notify('Forjado!', 'O item místico foi para o seu Arsenal.');
      return { ...d, journey: r };
    });
  return (
    <>
      <section className="card jn-forge-head">
        <span className="jn-px">FORJA MÍSTICA</span>
        <p className="small">Itens místicos não se compram: você treina os atributos até o nível pedido e forja com cristais. Cristais vêm dos baús de cristal (hábitos a abandonar) e dos títulos conquistados.</p>
        <span className="jn-px jn-forge-gems">
          <img alt="" src={GEM_ICON} /> {fmt(ctx.crystals)} {ctx.crystals === 1 ? 'cristal' : 'cristais'}
        </span>
      </section>
      {items.map((it) => {
        const a = availability(it, data.journey, ctx);
        const owned = a.status === 'tem';
        const reqs = a.status === 'forja' ? a.reqs : [];
        const ready = a.status === 'forja' && a.ready;
        return (
          <article key={it.id} className={`card jn-forge${owned ? ' owned' : ready ? ' ready' : ''}`}>
            <img alt="" src={itemIcon(it)} style={{ filter: owned || ready ? `drop-shadow(0 0 8px ${RARITY.mistico.color})` : 'grayscale(0.7) brightness(0.7)' }} />
            <div>
              <div className="toggle-row">
                <strong>{it.name}</strong>
                <span className="small" style={{ color: owned ? 'var(--green-text)' : ready ? 'var(--jn-gold)' : 'var(--muted)' }}>
                  {owned ? 'Forjado' : ready ? 'Pronto para forjar' : 'Treinando'}
                </span>
              </div>
              {!owned && (
                <div className="jn-reqs">
                  {reqs.map((r) => (
                    <span key={r.code} className={r.ok ? 'ok' : ''} style={r.ok ? undefined : { color: ATTRIBUTES.find((x) => x.code === r.code)?.color ?? 'var(--jn-crystal)' }}>
                      {r.ok ? '✓ ' : ''}
                      {REQ_NAME(r.code)} {fmt(r.have)}/{fmt(r.need)}
                    </span>
                  ))}
                </div>
              )}
              <span className="muted small">✦ {it.effect}</span>
              {ready && (
                <button type="button" className="btn primary small" onClick={() => forge(it.id)}>
                  Forjar por {it.crystals} cristais
                </button>
              )}
            </div>
          </article>
        );
      })}
    </>
  );
}

const CLASS_DESC: Record<AttrCode, string> = {
  FOR: 'treinos de força',
  AGI: 'caminhar, correr, alongar, esportes',
  INT: 'ler, estudar, cursos',
  RES: 'água, sono, comer bem',
  SAB: 'meditar, diário, gratidão',
  DIS: 'rituais, contas no prazo, revisões',
};

export function ClassesView({ gender }: { gender: 'f' | 'm' }) {
  const { data } = useStore();
  const today = todayISO();
  const all = wallet(data, data.journey, today).attrs;
  const cls = classOf(all, recentAttributes(data, today));
  const g = gender === 'f' ? 0 : 1;
  return (
    <>
      <section className="card">
        <p className="small" style={{ margin: 0 }}>
          A classe vem do seu <strong>atributo mais alto</strong> e muda sozinha se a sua rotina mudar. Quando os dois mais altos ficam a menos de 10% um do outro, nasce uma <strong>classe híbrida</strong>.
        </p>
      </section>
      <section className="card">
        <ul className="jn-classes">
          {ATTR_CODES.map((code) => {
            const on = cls.codes.includes(code);
            return (
              <li key={code} className={on ? 'on' : ''}>
                <b className="jn-px" style={{ color: attr(code).color }}>
                  {code}
                </b>
                <div>
                  <strong>{CLASSES[code][g]}</strong>
                  <span className="muted small">{CLASS_DESC[code]}</span>
                </div>
                <span className="tabular">{fmt(all[code])}</span>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="card">
        <p className="small" style={{ margin: 0 }}>
          <strong>Híbridas:</strong>{' '}
          {HYBRIDS.map((h) => `${attr(h.codes[0]).name} + ${attr(h.codes[1]).name} = ${gender === 'f' ? h.f : h.m}`).join(' · ')}.
        </p>
        {cls.codes.length === 2 && <p className="small" style={{ margin: '8px 0 0', color: 'var(--green-text)' }}>Você agora é {cls[gender]}.</p>}
      </section>
    </>
  );
}

