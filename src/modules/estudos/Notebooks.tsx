import { useEffect, useState } from 'react';
import { go } from '../../router';
import { block, cycleCounts, touch, trackPath } from '../../estudos';
import type { StudyBlock, StudyNotebook, StudySubject } from '../../types';
import { Empty, Field, Icon, MultiChips, notify, PageHeader, Sheet, type IconName } from '../../ui';
import { formatDateTime } from '../../utils';
import { uid } from '../../utils';
import { Missing } from './Biblioteca';
import { DualProgress, NewMapSheet, NotebookSheet, nowISO, Path, SourceCard, SourceSheet, useStudy } from './shared';

export function NotebooksPage() {
  const { study, lib } = useStudy();
  const [nb, setNb] = useState(false);
  const list = [...study.notebooks].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return (
    <>
      <Path items={[{ label: 'Estudos', to: 'estudos' }, { label: 'Meus notebooks' }]} />
      <PageHeader title="Meus notebooks" subtitle="Seus cadernos de estudo. Podem nascer de uma trilha ou do zero." />
      {list.length ? (
        <section className="card">
          <ul className="list">
            {list.map((n) => {
              const tr = n.trackId ? lib.track(n.trackId) : undefined;
              return (
                <li key={n.id}>
                  <a className="row" href={`#/estudos/notebook/${n.id}`}>
                    <span className="tile-icon st-blue">
                      <Icon name="notebook" size={20} />
                    </span>
                    <div className="row-body">
                      <span className="row-title">{n.name}</span>
                      <span className="row-meta">
                        {n.subjects.length} {n.subjects.length === 1 ? 'assunto' : 'assuntos'} · {tr ? tr.name : 'livre'}
                      </span>
                    </div>
                    <Icon name="right" size={18} />
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <section className="card">
          <div className="st-empty">
            <p className="muted">
              Um notebook guarda o que você aprende: anotações, listas de termos, links, vídeos e PDFs, separados por assunto. Pode começar do zero ou a partir de uma trilha.
            </p>
            <button type="button" className="btn primary" onClick={() => setNb(true)}>
              Criar o primeiro notebook
            </button>
          </div>
        </section>
      )}
      {nb && <NotebookSheet onClose={() => setNb(false)} />}
    </>
  );
}

type Edit = { kind: 'block'; block: StudyBlock | null; type: StudyBlock['kind'] } | { kind: 'subject'; subject: StudySubject | null } | { kind: 'notebook' } | { kind: 'source' } | { kind: 'map' };

export function NotebookPage({ id, subjectId, setExtra }: { id: string; subjectId: string; setExtra: (x: { label: string; hint: string; icon: IconName; run: () => void }[] | undefined) => void }) {
  const { study, lib, set } = useStudy();
  const [edit, setEdit] = useState<Edit | null>(null);
  const nb = study.notebooks.find((n) => n.id === id);
  useEffect(() => {
    setExtra([
      { label: 'Novo assunto neste notebook', hint: 'Uma seção nova para anotar', icon: 'plus', run: () => setEdit({ kind: 'subject', subject: null }) },
      { label: 'Anotação neste assunto', hint: 'Texto livre', icon: 'edit', run: () => setEdit({ kind: 'block', block: null, type: 'nota' }) },
    ]);
    return () => setExtra(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!nb) return <Missing what="Notebook" />;
  const idx = Math.max(0, nb.subjects.findIndex((s) => s.id === subjectId));
  const subject = nb.subjects[idx] as StudySubject | undefined;
  const tr = nb.trackId ? lib.track(nb.trackId) : undefined;
  const cycles = study.cycles.filter((c) => c.notebookId === nb.id);
  const maps = study.maps.filter((m) => m.notebookId === nb.id);
  const sources = study.sources.filter((s) => s.notebookIds.includes(nb.id));
  // Trocar de assunto não empilha no "voltar": o voltar sai do notebook.
  const openSubject = (sid: string) => {
    history.replaceState(null, '', `#/estudos/notebook/${nb.id}/${sid}`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  };

  const save = (fn: (n: StudyNotebook) => StudyNotebook) => set((s) => ({ ...s, notebooks: s.notebooks.map((n) => (n.id === nb.id ? fn(n) : n)) }));
  const saveSubject = (sid: string, fn: (s: StudySubject) => StudySubject, log: string) => save((n) => touch({ ...n, subjects: n.subjects.map((s) => (s.id === sid ? fn(s) : s)) }, log, nowISO()));

  return (
    <>
      <Path items={[{ label: 'Meus notebooks', to: 'estudos/notebooks' }, { label: nb.name }]} />
      <PageHeader
        title={nb.name}
        subtitle={
          tr ? (
            <>
              Referência:{' '}
              <a className="link" href={`#/estudos/trilha/${tr.id}`}>
                {[...trackPath(lib, tr), tr.name].join(' › ')}
              </a>
            </>
          ) : (
            'Criado do zero, sem ligação com a Biblioteca.'
          )
        }
      />
      <div className="st-subjects" role="tablist" aria-label="Assuntos">
        {nb.subjects.map((s, i) => (
          <button key={s.id} type="button" role="tab" aria-selected={i === idx} className={`chip-btn${i === idx ? ' on' : ''}`} onClick={() => openSubject(s.id)}>
            {s.name}
          </button>
        ))}
        <button type="button" className="chip-btn" onClick={() => setEdit({ kind: 'subject', subject: null })} aria-label="Novo assunto">
          <Icon name="plus" size={16} /> Assunto
        </button>
      </div>

      {subject ? (
        <section className="card st-subject">
          <div className="card-head">
            <h2>{subject.name}</h2>
            <button type="button" className="icon-btn" onClick={() => setEdit({ kind: 'subject', subject })} aria-label="Editar assunto">
              <Icon name="edit" size={16} />
            </button>
          </div>
          {subject.blocks.length === 0 && <p className="muted small">Assunto vazio. Adicione uma anotação, uma lista de termos ou fontes.</p>}
          {subject.blocks.map((b) => (
            <div key={b.id} className="st-block">
              <div className="st-block-head">
                <h3>
                  <Icon name={b.kind === 'nota' ? 'edit' : b.kind === 'pares' ? 'list' : 'link'} size={14} />
                  {b.title || (b.kind === 'nota' ? 'Anotações' : b.kind === 'pares' ? 'Termos' : 'Fontes')}
                </h3>
                <button type="button" className="icon-btn st-quiet" onClick={() => setEdit({ kind: 'block', block: b, type: b.kind })} aria-label="Editar bloco">
                  <Icon name="edit" size={15} />
                </button>
              </div>
              {b.kind === 'nota' &&
                (b.text ? (
                  <p className="st-note">{b.text}</p>
                ) : (
                  <button type="button" className="st-placeholder" onClick={() => setEdit({ kind: 'block', block: b, type: 'nota' })}>
                    Toque para escrever o que aprendeu…
                  </button>
                ))}
              {b.kind === 'pares' &&
                (b.pairs.length ? (
                  <dl className="st-pairs">
                    {b.pairs.map(([x, y], i) => (
                      <div key={i}>
                        <dt>{x}</dt>
                        <dd>{y}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="muted small">Sem termos ainda.</p>
                ))}
              {b.kind === 'fontes' && (
                <div className="st-res-list">
                  {b.sourceIds.map((sid) => study.sources.find((s) => s.id === sid)).filter((s) => !!s).length ? (
                    b.sourceIds.map((sid) => {
                      const s = study.sources.find((x) => x.id === sid);
                      return s ? <SourceCard key={sid} s={s} /> : null;
                    })
                  ) : (
                    <p className="muted small">Nenhuma fonte escolhida.</p>
                  )}
                </div>
              )}
            </div>
          ))}
          <div className="st-add-row">
            <button type="button" className="btn soft small" onClick={() => setEdit({ kind: 'block', block: null, type: 'nota' })}>
              <Icon name="plus" size={15} /> Anotação
            </button>
            <button type="button" className="btn soft small" onClick={() => setEdit({ kind: 'block', block: null, type: 'pares' })}>
              <Icon name="plus" size={15} /> Termos
            </button>
            <button type="button" className="btn soft small" onClick={() => setEdit({ kind: 'block', block: null, type: 'fontes' })}>
              <Icon name="plus" size={15} /> Fontes
            </button>
          </div>
        </section>
      ) : (
        <section className="card">
          <Empty>Sem assuntos. Crie o primeiro para começar a anotar.</Empty>
        </section>
      )}

      {nb.subjects.length > 1 && (
        <div className="st-pager">
          <button type="button" className="btn soft small" disabled={idx === 0} onClick={() => openSubject(nb.subjects[idx - 1].id)}>
            ‹ {idx > 0 ? nb.subjects[idx - 1].name : 'Anterior'}
          </button>
          <button type="button" className="btn soft small" disabled={idx === nb.subjects.length - 1} onClick={() => openSubject(nb.subjects[idx + 1].id)}>
            {idx < nb.subjects.length - 1 ? nb.subjects[idx + 1].name : 'Próximo'} ›
          </button>
        </div>
      )}

      {cycles.length > 0 && (
        <section className="card">
          <div className="card-head">
            <h2>Ciclos ligados</h2>
          </div>
          <ul className="list">
            {cycles.map((c) => {
              const n = cycleCounts(c);
              return (
                <li key={c.id}>
                  <a className="row st-cycle-row" href={`#/ciclos/${c.id}`}>
                    <span className="st-cycle-top">
                      <span className="row-title">{c.name}</span>
                      <span className="muted small tabular">
                        {n.done}/{n.total}
                      </span>
                    </span>
                    <DualProgress done={n.done} doing={n.doing} total={n.total} />
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="card">
        <div className="card-head">
          <h2>Fontes deste notebook</h2>
          <button type="button" className="link" onClick={() => setEdit({ kind: 'source' })}>
            Nova
          </button>
        </div>
        {sources.length ? (
          <div className="st-res-list">
            {sources.map((s) => (
              <SourceCard key={s.id} s={s} />
            ))}
          </div>
        ) : (
          <p className="muted small" style={{ margin: 0 }}>
            Links, vídeos, livros e PDFs que você usa aqui. A mesma fonte pode servir a outros notebooks.
          </p>
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Mapas mentais</h2>
          <button type="button" className="link" onClick={() => setEdit({ kind: 'map' })}>
            Novo
          </button>
        </div>
        {maps.length ? (
          <ul className="list">
            {maps.map((m) => (
              <li key={m.id}>
                <a className="row" href={`#/estudos/mapa/${m.id}`}>
                  <span className="tile-icon st-green">
                    <Icon name="mindmap" size={18} />
                  </span>
                  <div className="row-body">
                    <span className="row-title">{m.name}</span>
                    <span className="row-meta">{m.branches.length} ramos</span>
                  </div>
                  <Icon name="right" size={18} />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small" style={{ margin: 0 }}>
            Desenhe como os assuntos se ligam.
          </p>
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Histórico</h2>
          <button type="button" className="link" onClick={() => setEdit({ kind: 'notebook' })}>
            Editar notebook
          </button>
        </div>
        <ul className="st-log">
          {nb.log.slice(0, 8).map((l, i) => (
            <li key={i}>
              <time>{formatDateTime(l.at)}</time>
              <span>{l.text}</span>
            </li>
          ))}
        </ul>
      </section>

      {edit?.kind === 'notebook' && <NotebookSheet notebook={nb} onClose={() => setEdit(null)} />}
      {edit?.kind === 'source' && <SourceSheet notebookId={nb.id} onClose={() => setEdit(null)} />}
      {edit?.kind === 'map' && <NewMapSheet notebookId={nb.id} onClose={() => setEdit(null)} />}
      {edit?.kind === 'subject' && (
        <SubjectSheet
          subject={edit.subject}
          onClose={() => setEdit(null)}
          onSave={(name) => {
            if (edit.subject) saveSubject(edit.subject.id, (s) => ({ ...s, name }), `Assunto renomeado: ${name}`);
            else {
              const s: StudySubject = { id: uid(), name, topicId: null, blocks: [block('nota', 'Anotações')] };
              save((n) => touch({ ...n, subjects: [...n.subjects, s] }, `Novo assunto: ${name}`, nowISO()));
              openSubject(s.id);
            }
          }}
          onDelete={
            edit.subject
              ? () => {
                  const sid = edit.subject!.id;
                  save((n) => touch({ ...n, subjects: n.subjects.filter((s) => s.id !== sid) }, `Assunto excluído: ${edit.subject!.name}`, nowISO()));
                  history.replaceState(null, '', `#/estudos/notebook/${nb.id}`);
                }
              : undefined
          }
        />
      )}
      {edit?.kind === 'block' && subject && (
        <BlockSheet
          type={edit.type}
          block={edit.block}
          notebookId={nb.id}
          onClose={() => setEdit(null)}
          onSave={(b) =>
            saveSubject(
              subject.id,
              (s) => ({ ...s, blocks: edit.block ? s.blocks.map((x) => (x.id === b.id ? b : x)) : [...s.blocks, b] }),
              `${edit.block ? 'Editado' : 'Novo bloco'} em ${subject.name}`,
            )
          }
          onDelete={edit.block ? () => saveSubject(subject.id, (s) => ({ ...s, blocks: s.blocks.filter((x) => x.id !== edit.block!.id) }), `Bloco excluído em ${subject.name}`) : undefined}
        />
      )}
    </>
  );
}

function SubjectSheet({ subject, onClose, onSave, onDelete }: { subject: StudySubject | null; onClose: () => void; onSave: (name: string) => void; onDelete?: () => void }) {
  const [name, setName] = useState(subject?.name ?? '');
  const [confirm, setConfirm] = useState(false);
  return (
    <Sheet
      title={subject ? 'Editar assunto' : 'Novo assunto'}
      onClose={onClose}
      footer={
        <div className="btn-row">
          {onDelete && (
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                if (!confirm) return setConfirm(true);
                onDelete();
                onClose();
              }}
            >
              {confirm ? 'Confirmar exclusão' : 'Excluir'}
            </button>
          )}
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              if (!name.trim()) return notify('Dê um nome ao assunto');
              onSave(name.trim());
              onClose();
            }}
          >
            Salvar
          </button>
        </div>
      }
    >
      <Field label="Nome do assunto">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Verbos irregulares, Projeto prático…" autoFocus />
      </Field>
    </Sheet>
  );
}

const pairsToText = (p: [string, string][]) => p.map(([a, b]) => `${a} = ${b}`).join('\n');
const textToPairs = (t: string): [string, string][] =>
  t
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = l.split(/\s*(?:=|–|—|:| - )\s*/);
      return [m[0], m.slice(1).join(' ')] as [string, string];
    });

function BlockSheet({ type, block: b, notebookId, onClose, onSave, onDelete }: { type: StudyBlock['kind']; block: StudyBlock | null; notebookId: string; onClose: () => void; onSave: (b: StudyBlock) => void; onDelete?: () => void }) {
  const { study } = useStudy();
  const [title, setTitle] = useState(b?.title ?? (type === 'nota' ? 'Anotações' : type === 'pares' ? 'Vocabulário' : 'Fontes'));
  const [text, setText] = useState(b?.text ?? '');
  const [pairs, setPairs] = useState(b ? pairsToText(b.pairs) : '');
  const [ids, setIds] = useState<string[]>(b?.sourceIds ?? []);
  const [newSource, setNewSource] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const label = type === 'nota' ? 'Anotação' : type === 'pares' ? 'Lista de termos' : 'Fontes do assunto';
  return (
    <Sheet
      title={b ? `Editar ${label.toLowerCase()}` : label}
      onClose={onClose}
      footer={
        <div className="btn-row">
          {onDelete && (
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                if (!confirm) return setConfirm(true);
                onDelete();
                onClose();
              }}
            >
              {confirm ? 'Confirmar exclusão' : 'Excluir'}
            </button>
          )}
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              onSave({ id: b?.id ?? uid(), kind: type, title: title.trim(), text: text.trim(), pairs: type === 'pares' ? textToPairs(pairs) : [], sourceIds: type === 'fontes' ? ids : [] });
              onClose();
            }}
          >
            Salvar
          </button>
        </div>
      }
    >
      <div className="form">
        <Field label="Título do bloco" hint={type === 'nota' ? 'Ex.: Anotações, Resumo, Projeto prático, Dúvidas.' : type === 'pares' ? 'Ex.: Vocabulário, Exemplos, Comandos.' : undefined}>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        {type === 'nota' && (
          <Field label="Texto">
            <textarea className="input" rows={9} value={text} onChange={(e) => setText(e.target.value)} placeholder="O que você aprendeu, com suas palavras." autoFocus />
          </Field>
        )}
        {type === 'pares' && (
          <Field label="Termos" hint='Um por linha, no formato "termo = significado".'>
            <textarea className="input" rows={8} value={pairs} onChange={(e) => setPairs(e.target.value)} placeholder={'Good morning = Bom dia\nSee you later = Até mais'} autoFocus />
          </Field>
        )}
        {type === 'fontes' && (
          <div className="field">
            <span className="field-label">Escolha as fontes</span>
            {study.sources.length ? (
              <MultiChips options={study.sources.map((s) => [s.id, s.title])} value={ids} onToggle={(id) => setIds((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]))} label="Fontes" />
            ) : (
              <p className="muted small">Você ainda não tem fontes guardadas.</p>
            )}
            <button type="button" className="btn soft small" onClick={() => setNewSource(true)}>
              <Icon name="plus" size={15} /> Nova fonte
            </button>
          </div>
        )}
      </div>
      {newSource && <SourceSheet notebookId={notebookId} onClose={() => setNewSource(false)} />}
    </Sheet>
  );
}

/** Para outras telas abrirem um assunto direto. */
export const openNotebook = (nbId: string, subjectId?: string) => go(`estudos/notebook/${nbId}${subjectId ? `/${subjectId}` : ''}`);
