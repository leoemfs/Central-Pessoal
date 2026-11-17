import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../../store';
import { buildExport, defaultOptions, fileName, refLine, statusLabel, type ExportDoc, type ExportOptions, type MapChoice } from '../../exportar';
import { layoutMap } from '../../mapas';
import { pageTree } from '../../estudos';
import { Field, Icon, notify, PageHeader, Toggle } from '../../ui';
import { todayISO } from '../../utils';
import { Missing } from './Biblioteca';
import { MapShapes } from './Mapas';
import { RichView } from './RichView';
import { Path, useStudy } from './shared';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** #/estudos/exportar/:notebook: escolher o que vai e salvar em PDF (M37a). */
export function ExportPage({ id }: { id: string }) {
  const { data } = useStore();
  const { study, lib } = useStudy();
  const nb = study.notebooks.find((n) => n.id === id);
  const [opts, setOpts] = useState<ExportOptions>(() => defaultOptions(data.profile.name ?? ''));
  const doc = useMemo(() => buildExport(study, lib, id, opts, todayISO()), [study, lib, id, opts]);
  const set = <K extends keyof ExportOptions>(k: K, v: ExportOptions[K]) => setOpts((o) => ({ ...o, [k]: v }));
  const tops = nb ? pageTree(nb).filter((x) => x.depth === 0) : [];

  // Durante a impressão, só o documento aparece (o resto do app some).
  useEffect(() => {
    const after = () => document.body.classList.remove('printing');
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('afterprint', after);
      after();
    };
  }, []);

  if (!nb || !doc) return <Missing what="Notebook" />;
  const pending = doc.oversized.length > 0;
  function print() {
    if (pending) return notify('Escolha o que fazer com os mapas grandes', 'Está logo acima do botão.');
    const old = document.title;
    // O nome sugerido do arquivo PDF vem do título da página.
    document.title = fileName(doc!);
    document.body.classList.add('printing');
    window.setTimeout(() => {
      window.print();
      document.title = old;
    }, 50);
  }

  const chk = (k: 'cover' | 'toc' | 'status' | 'maps' | 'refs' | 'emptyPages', label: string, hint?: string) => (
    <div className="toggle-row st-export-opt">
      <span>
        {label}
        {hint && <small className="muted">{hint}</small>}
      </span>
      <Toggle checked={opts[k]} onChange={(v) => set(k, v)} label={label} />
    </div>
  );

  return (
    <>
      <Path items={[{ label: 'Meus notebooks', to: 'estudos/notebooks' }, { label: nb.name, to: `estudos/notebook/${nb.id}` }, { label: 'Exportar' }]} />
      <PageHeader title="Exportar" subtitle="Um documento com capa, sumário, as suas páginas, os mapas e as fontes." />

      <section className="card st-export-form">
        <div className="field">
          <span className="field-label">Formato</span>
          <div className="chips" role="radiogroup" aria-label="Formato">
            <button type="button" role="radio" aria-checked="true" className="chip-btn on">
              PDF
            </button>
            <button type="button" role="radio" aria-checked="false" className="chip-btn" onClick={() => notify('Word em breve', 'É a próxima parte (M37b). Por enquanto, o PDF.')}>
              Word (em breve)
            </button>
          </div>
        </div>
        <Field label="O que exportar">
          <select className="input" value={opts.scope} onChange={(e) => set('scope', e.target.value)}>
            <option value="tudo">O notebook inteiro</option>
            {tops.map(({ page }) => (
              <option key={page.id} value={page.id}>
                Só: {page.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nome na capa" hint={data.profile.name ? undefined : 'Dica: em Você, o seu nome já vem preenchido aqui.'}>
          <input className="input" value={opts.name} onChange={(e) => set('name', e.target.value)} placeholder="Seu nome" />
        </Field>
        <div className="st-export-opts">
          {chk('cover', 'Capa', 'Seu nome, o nome do curso ou notebook e a data')}
          {chk('toc', 'Sumário')}
          {chk('status', 'Situação dos tópicos', 'Estudado, estudando ou a estudar')}
          {chk('maps', 'Mapas mentais (anexos)')}
          {chk('refs', 'Referências (fontes)')}
          {chk('emptyPages', 'Páginas sem anotações')}
        </div>
      </section>

      {pending && (
        <section className="card st-export-warn" role="alert">
          <div className="card-head">
            <h2>
              <Icon name="mindmap" size={18} /> {doc.oversized.length === 1 ? 'Um mapa não cabe numa folha' : `${doc.oversized.length} mapas não cabem numa folha`}
            </h2>
          </div>
          <p className="muted small" style={{ marginTop: 0 }}>
            Mesmo com a folha deitada, a letra ficaria pequena demais para ler. Escolha para cada um: <b>Resumir</b> (só os níveis de cima, até caber legível) ou <b>Deixar fora</b>.
          </p>
          {doc.oversized.map((m) => (
            <div key={m.id} className="st-export-map">
              <b>
                {m.name} <span className="muted small">({plural(m.ideas, 'ideia', 'ideias')})</span>
              </b>
              <div className="chips" role="radiogroup" aria-label={`O que fazer com ${m.name}`}>
                {(
                  [
                    ['nivel2', 'Resumir'],
                    ['fora', 'Deixar fora'],
                  ] as [MapChoice, string][]
                ).map(([v, l]) => (
                  <button key={v} type="button" role="radio" aria-checked={false} className="chip-btn" onClick={() => set('mapChoice', { ...opts.mapChoice, [m.id]: v })}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
      {Object.keys(opts.mapChoice).length > 0 && !pending && (
        <p className="muted small" style={{ margin: 0 }}>
          Mapas grandes: {Object.entries(opts.mapChoice).map(([mid, v]) => `${study.maps.find((x) => x.id === mid)?.name ?? 'mapa'} (${v === 'fora' ? 'fora' : 'resumido'})`).join(', ')}.{' '}
          <button type="button" className="link" onClick={() => set('mapChoice', {})}>
            Mudar
          </button>
        </p>
      )}

      <button type="button" className="btn primary block" onClick={print} disabled={pending}>
        <Icon name="download" size={18} /> Salvar em PDF
      </button>
      <p className="muted small" style={{ margin: 0 }}>
        Abre a tela de imprimir do aparelho: escolha <b>Salvar como PDF</b> (no iPhone, pelo botão Compartilhar).{' '}
        {plural(doc.sections.length, 'seção', 'seções')}, {plural(doc.maps.length, 'mapa', 'mapas')} e {plural(doc.refs.length, 'referência', 'referências')}.
      </p>

      <h2 className="section-title">Como vai ficar</h2>
      <div className="pr-preview" aria-label="Prévia do documento">
        <ExportDocView doc={doc} />
      </div>
      {createPortal(
        <div className="pr-host">
          <ExportDocView doc={doc} />
        </div>,
        document.body,
      )}
    </>
  );
}

/** O documento, igual na prévia e no papel. */
function ExportDocView({ doc }: { doc: ExportDoc }) {
  const o = doc.options;
  return (
    <article className="pr-doc">
      {o.cover && (
        <section className="pr-cover pr-sheet">
          <div className="pr-cover-top">{doc.course ? 'Curso' : 'Notebook'}</div>
          <h1>{doc.course ?? doc.title}</h1>
          {doc.course && doc.title !== doc.course && <p className="pr-cover-sub">{doc.title}</p>}
          {doc.desc && <p className="pr-cover-desc">{doc.desc}</p>}
          <div className="pr-cover-foot">
            {doc.name && <b>{doc.name}</b>}
            <span>{doc.date}</span>
            <span className="pr-app">Central Pessoal · Estudos</span>
          </div>
        </section>
      )}
      {o.toc && doc.sections.length > 0 && (
        <section className="pr-toc pr-sheet">
          <h2>Sumário</h2>
          <ol>
            {doc.sections.map((s) => (
              <li key={s.id} className={`d${s.depth}`}>
                <span className="pr-num">{s.num}</span>
                <span className="pr-toc-title">{s.title}</span>
                {s.status && <span className={`pr-status ${s.status}`}>{statusLabel(s.status)}</span>}
              </li>
            ))}
            {doc.maps.length > 0 && (
              <li className="d1 pr-toc-extra">
                <span className="pr-num" />
                <span className="pr-toc-title">Anexos: mapas mentais</span>
              </li>
            )}
            {doc.refs.length > 0 && (
              <li className="d1 pr-toc-extra">
                <span className="pr-num" />
                <span className="pr-toc-title">Referências</span>
              </li>
            )}
          </ol>
        </section>
      )}
      {doc.sections.map((s, i) => (
        <section key={s.id} className={`pr-section d${s.depth}${s.depth === 1 && (i > 0 || o.cover || o.toc) ? ' pr-break' : ''}`}>
          {s.depth === 1 ? (
            <h2>
              <span className="pr-num">{s.num}</span> {s.title}
            </h2>
          ) : (
            <h3>
              <span className="pr-num">{s.num}</span> {s.title}
            </h3>
          )}
          {(s.origin || s.status) && (
            <p className="pr-meta">
              {s.origin && <>Da Biblioteca: {s.origin}</>}
              {s.origin && s.status && ' · '}
              {s.status && statusLabel(s.status)}
            </p>
          )}
          {s.empty ? <p className="pr-empty">Sem anotações.</p> : <RichView doc={s.doc} />}
        </section>
      ))}
      {doc.maps.map((m, i) => (
        <section key={m.id} className={`pr-map pr-break ${m.orientation}`}>
          {i === 0 && <h2 className="pr-annex">Anexos: mapas mentais</h2>}
          <h3>
            {m.name}
            {m.page && <small> · página {m.page}</small>}
            {m.trimmed && <small> · resumido (no app tem mais ideias)</small>}
          </h3>
          <MapPaper root={m.root} name={m.name} />
        </section>
      ))}
      {doc.refs.length > 0 && (
        <section className="pr-refs pr-break">
          <h2>Referências</h2>
          <ol>
            {doc.refs.map((r) => (
              <li key={r.num}>
                {r.url ? (
                  <>
                    {refLine({ ...r, url: '' }).replace(/\.$/, '')}. Disponível em:{' '}
                    <a href={r.url} target="_blank" rel="noopener noreferrer">
                      {r.url}
                    </a>
                    .
                  </>
                ) : (
                  refLine(r)
                )}
                {r.usedIn.length > 0 && <small> Usada em: {r.usedIn.join('; ')}.</small>}
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}

function MapPaper({ root, name }: { root: ExportDoc['maps'][number]['root']; name: string }) {
  const layout = useMemo(() => layoutMap(root), [root]);
  const pad = 24;
  return (
    <svg className="pr-mapsvg" viewBox={`${layout.minX - pad} ${layout.minY - pad} ${layout.maxX - layout.minX + pad * 2} ${layout.maxY - layout.minY + pad * 2}`} role="img" aria-label={`Mapa mental: ${name}`} preserveAspectRatio="xMidYMid meet">
      <MapShapes layout={layout} />
    </svg>
  );
}
