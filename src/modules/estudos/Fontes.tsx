import { useState } from 'react';
import { CATALOG } from '../../estudosCatalogo';
import { findSource, SOURCE_KINDS } from '../../estudos';
import type { SourceKind, StudySource } from '../../types';
import { PageHeader } from '../../ui';
import { Path, SourceCard, SourceSheet, useStudy } from './shared';

/** Fontes sugeridas pelo catálogo (todas as trilhas), para quem ainda não guardou nenhuma. */
const SUGGESTED = CATALOG.flatMap((a) => a.themes.flatMap((t) => [...(t.levels ?? []).flatMap((l) => l.tracks), ...(t.tracks ?? [])])).flatMap((tr) => tr.sources);

export function FontesPage() {
  const { study } = useStudy();
  const [filter, setFilter] = useState<SourceKind | 'todas'>('todas');
  const [edit, setEdit] = useState<StudySource | null>(null);
  const [preset, setPreset] = useState<(typeof SUGGESTED)[number] | null>(null);
  const kinds = SOURCE_KINDS.filter((k) => study.sources.some((s) => s.kind === k.value));
  const list = study.sources.filter((s) => filter === 'todas' || s.kind === filter);
  const suggestions = SUGGESTED.filter((s) => !findSource(study, s)).slice(0, study.sources.length ? 4 : 8);
  return (
    <>
      <Path items={[{ label: 'Estudos', to: 'estudos' }, { label: 'Fontes' }]} />
      <PageHeader title="Fontes" subtitle="Sites, vídeos, livros, PDFs e cursos que você usa. Uma fonte pode servir a vários estudos." />
      {study.sources.length > 0 && (
        <>
          {kinds.length > 1 && (
            <div className="chips st-scroll-chips" role="radiogroup" aria-label="Tipo">
              {[{ value: 'todas' as const, label: 'Todas' }, ...kinds].map((k) => (
                <button key={k.value} type="button" role="radio" aria-checked={filter === k.value} className={`chip-btn${filter === k.value ? ' on' : ''}`} onClick={() => setFilter(k.value)}>
                  {k.label}
                </button>
              ))}
            </div>
          )}
          <section className="card">
            <div className="st-res-list">
              {list.map((s) => (
                <div key={s.id} className="st-res-wrap">
                  <SourceCard s={s} onEdit={() => setEdit(s)} />
                  {(s.notebookIds.length > 0 || s.note) && (
                    <div className="st-res-uses">
                      {s.note && <span className="muted small">{s.note}</span>}
                      {s.notebookIds.map((id) => {
                        const n = study.notebooks.find((x) => x.id === id);
                        return n ? (
                          <a key={id} className="pill blue" href={`#/estudos/notebook/${id}`}>
                            {n.name}
                          </a>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
      {!study.sources.length && <p className="muted">Você ainda não guardou fontes. Use o + para cadastrar uma, ou comece por uma destas sugestões da Biblioteca.</p>}
      {suggestions.length > 0 && (
        <section className="card">
          <div className="card-head">
            <h2>Sugestões da Biblioteca</h2>
          </div>
          <div className="st-res-list">
            {suggestions.map((s) => (
              <SourceCard
                key={s.title}
                s={s}
                extra={
                  <button type="button" className="btn soft small" onClick={() => setPreset(s)}>
                    Guardar
                  </button>
                }
              />
            ))}
          </div>
        </section>
      )}
      {edit && <SourceSheet source={edit} onClose={() => setEdit(null)} />}
      {preset && <SourceSheet preset={preset} onClose={() => setPreset(null)} />}
    </>
  );
}
