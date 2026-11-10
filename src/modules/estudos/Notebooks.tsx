import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { go } from '../../router';
import { cycleCounts, docIsEmpty, movePage, newPage, pageTree, removePage, setPageParent, topicState, touch, trackPath } from '../../estudos';
import type { RichNode, StudyNotebook, StudyPage } from '../../types';
import { Empty, Field, Icon, MultiChips, notify, PageHeader, Sheet, type IconName } from '../../ui';
import { formatDateTime } from '../../utils';
import { Missing } from './Biblioteca';
import { DualProgress, NewMapSheet, NotebookSheet, nowISO, Path, SourceCard, SourceSheet, StatusPill, trackCrumbs, useStudy } from './shared';

// O editor é pesado: só é baixado quando uma página é aberta.
const RichEditor = lazy(() => import('./Editor'));

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function NotebooksPage() {
  const { study } = useStudy();
  const [nb, setNb] = useState(false);
  const list = [...study.notebooks].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return (
    <>
      <Path items={[{ label: 'Estudos', to: 'estudos' }, { label: 'Meus notebooks' }]} />
      <PageHeader title="Meus notebooks" subtitle="Seus cadernos de estudo. Podem nascer de tópicos da Biblioteca ou do zero." />
      {list.length ? (
        <section className="card">
          <ul className="list">
            {list.map((n) => (
              <li key={n.id}>
                <a className="row" href={`#/estudos/notebook/${n.id}`}>
                  <span className="tile-icon st-blue">
                    <Icon name="notebook" size={20} />
                  </span>
                  <div className="row-body">
                    <span className="row-title">{n.name}</span>
                    <span className="row-meta">
                      {plural(n.pages.length, 'página', 'páginas')}
                      {n.desc && ` · ${n.desc}`}
                    </span>
                  </div>
                  <Icon name="right" size={18} />
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="card">
          <div className="st-empty">
            <p className="muted">
              Um notebook é o seu caderno: páginas e subpáginas com anotações, listas de termos e fontes. A Biblioteca é a referência do app; o notebook é seu. Comece do zero ou leve tópicos da Biblioteca para ele.
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

type Extra = { label: string; hint: string; icon: IconName; run: () => void }[];
type Edit = { kind: 'sources' } | { kind: 'page'; page: StudyPage | null; parentId: string | null } | { kind: 'notebook' } | { kind: 'source' } | { kind: 'map' };

/** #/estudos/notebook/:id (capa: páginas, fontes, mapas…) e #/estudos/notebook/:id/:pagina (uma página). */
export function NotebookPage({ id, pageId, setExtra }: { id: string; pageId: string; setExtra: (x: Extra | undefined) => void }) {
  const { study, lib, set } = useStudy();
  const [edit, setEdit] = useState<Edit | null>(null);
  const [sorting, setSorting] = useState(false);
  const logged = useRef('');
  const nb = study.notebooks.find((n) => n.id === id);
  const page = nb?.pages.find((p) => p.id === pageId);
  useEffect(() => {
    const extra: Extra = [{ label: 'Nova página neste notebook', hint: 'Um espaço novo para anotar', icon: 'plus', run: () => setEdit({ kind: 'page', page: null, parentId: null }) }];
    if (page && !page.parentId) extra.push({ label: 'Subpágina aqui', hint: 'Uma parte menor desta página', icon: 'note', run: () => setEdit({ kind: 'page', page: null, parentId: page.id }) });
    setExtra(extra);
    return () => setExtra(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page?.id]);
  if (!nb) return <Missing what="Notebook" />;

  const tree = pageTree(nb);
  const save = (fn: (n: StudyNotebook) => StudyNotebook) => set((s) => ({ ...s, notebooks: s.notebooks.map((n) => (n.id === nb.id ? fn(n) : n)) }));
  const savePage = (pid: string, fn: (p: StudyPage) => StudyPage, log: string) => {
    const now = nowISO();
    save((n) => touch({ ...n, pages: n.pages.map((p) => (p.id === pid ? { ...fn(p), updatedAt: now } : p)) }, log, now));
  };
  // Digitar salva sem encher o histórico: uma linha por página a cada visita.
  const saveDoc = (pid: string, name: string, doc: RichNode) => {
    const now = nowISO();
    const first = logged.current !== pid;
    logged.current = pid;
    save((n) => {
      const next = { ...n, updatedAt: now, pages: n.pages.map((p) => (p.id === pid ? { ...p, doc, updatedAt: now } : p)) };
      return first ? touch(next, `Anotações em ${name}`, now) : next;
    });
  };
  const href = (pid?: string) => `#/estudos/notebook/${nb.id}${pid ? `/${pid}` : ''}`;

  const sheets = (
    <>
      {edit?.kind === 'notebook' && <NotebookSheet notebook={nb} onClose={() => setEdit(null)} />}
      {edit?.kind === 'source' && <SourceSheet notebookId={nb.id} onClose={() => setEdit(null)} />}
      {edit?.kind === 'map' && <NewMapSheet notebookId={nb.id} onClose={() => setEdit(null)} />}
      {edit?.kind === 'page' && (
        <PageSheet
          notebook={nb}
          page={edit.page}
          parentId={edit.parentId}
          onClose={() => setEdit(null)}
          onSave={(name, parentId) => {
            const now = nowISO();
            if (edit.page) {
              const pid = edit.page.id;
              save((n) => touch(setPageParent({ ...n, pages: n.pages.map((p) => (p.id === pid ? { ...p, name, updatedAt: now } : p)) }, pid, parentId), `Página editada: ${name}`, now));
            } else {
              const p = newPage(name, null, parentId, now);
              save((n) => touch({ ...n, pages: [...n.pages, p] }, `${parentId ? 'Nova subpágina' : 'Nova página'}: ${p.name}`, now));
              go(`estudos/notebook/${nb.id}/${p.id}`);
            }
          }}
          onDelete={
            edit.page
              ? () => {
                  const gone = edit.page!;
                  save((n) => touch(removePage(n, gone.id), `Página excluída: ${gone.name}`, nowISO()));
                  if (page && (page.id === gone.id || page.parentId === gone.id)) go(`estudos/notebook/${nb.id}${gone.parentId ? `/${gone.parentId}` : ''}`);
                }
              : undefined
          }
        />
      )}
      {edit?.kind === 'sources' && page && (
        <PageSources notebookId={nb.id} value={page.sourceIds} onClose={() => setEdit(null)} onSave={(ids) => savePage(page.id, (x) => ({ ...x, sourceIds: ids }), `Fontes de ${page.name}`)} />
      )}
    </>
  );

  // ---------- Uma página ----------
  if (page) {
    const parent = page.parentId ? nb.pages.find((p) => p.id === page.parentId) : undefined;
    const children = nb.pages.filter((p) => p.parentId === page.id);
    const topic = page.topicId ? lib.topic(page.topicId) : undefined;
    const origin = topic ? lib.track(topic.trackId) : undefined;
    const state = page.topicId ? topicState(study.cycles, page.topicId) : null;
    const i = tree.findIndex((x) => x.page.id === page.id);
    const prev = tree[i - 1]?.page;
    const next = tree[i + 1]?.page;
    const pageSources = page.sourceIds.map((sid) => study.sources.find((x) => x.id === sid)).filter((x): x is NonNullable<typeof x> => !!x);
    return (
      <>
        <Path items={[{ label: 'Meus notebooks', to: 'estudos/notebooks' }, { label: nb.name, to: `estudos/notebook/${nb.id}` }, ...(parent ? [{ label: parent.name, to: `estudos/notebook/${nb.id}/${parent.id}` }] : []), { label: page.name }]} />
        <PageHeader title={page.name} />
        {origin && topic && (
          <div className="st-origin">
            <Icon name="library" size={16} />
            <span>
              Da Biblioteca:{' '}
              <a className="link" href={`#/estudos/trilha/${origin.id}`}>
                {[...trackCrumbs(lib, origin).slice(1).map((c) => c.label), origin.name].join(' › ')}
              </a>
            </span>
            {state && <StatusPill status={state.status} />}
          </div>
        )}
        <section className="card st-page">
          <div className="card-head">
            <h2>{page.name}</h2>
            <button type="button" className="icon-btn" onClick={() => setEdit({ kind: 'page', page, parentId: page.parentId })} aria-label="Editar página">
              <Icon name="edit" size={16} />
            </button>
          </div>
          <Suspense fallback={<p className="muted small">Abrindo o editor…</p>}>
            <RichEditor key={page.id} doc={page.doc} onChange={(doc) => saveDoc(page.id, page.name, doc)} />
          </Suspense>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Fontes desta página</h2>
            <button type="button" className="link" onClick={() => setEdit({ kind: 'sources' })}>
              Escolher
            </button>
          </div>
          {pageSources.length ? (
            <div className="st-res-list">
              {pageSources.map((x) => (
                <SourceCard key={x.id} s={x} />
              ))}
            </div>
          ) : (
            <p className="muted small" style={{ margin: 0 }}>
              Ligue aqui os sites, vídeos e livros que você usou nesta página.
            </p>
          )}
        </section>

        {!page.parentId && (
          <section className="card">
            <div className="card-head">
              <h2>Subpáginas</h2>
              <button type="button" className="link" onClick={() => setEdit({ kind: 'page', page: null, parentId: page.id })}>
                Nova
              </button>
            </div>
            {children.length ? (
              <ul className="list">
                {children.map((c) => (
                  <li key={c.id}>
                    <a className="row" href={href(c.id)}>
                      <span className="tile-icon small">
                        <Icon name="note" size={16} />
                      </span>
                      <div className="row-body">
                        <span className="row-title">{c.name}</span>
                      </div>
                      <Icon name="right" size={18} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted small" style={{ margin: 0 }}>
                Divida esta página em partes menores, como exemplos, exercícios ou um projeto.
              </p>
            )}
          </section>
        )}

        {(prev || next) && (
          <div className="st-pager">
            {prev ? (
              <a className="btn soft small" href={href(prev.id)}>
                ‹ {prev.name}
              </a>
            ) : (
              <span />
            )}
            {next ? (
              <a className="btn soft small" href={href(next.id)}>
                {next.name} ›
              </a>
            ) : (
              <span />
            )}
          </div>
        )}
        {sheets}
      </>
    );
  }

  // ---------- Capa do notebook ----------
  const cycles = study.cycles.filter((c) => c.notebookId === nb.id);
  const maps = study.maps.filter((m) => m.notebookId === nb.id);
  const sources = study.sources.filter((s) => s.notebookIds.includes(nb.id));
  const tr = nb.trackId ? lib.track(nb.trackId) : undefined;
  const areas = [...new Set(nb.pages.map((p) => (p.topicId ? lib.topic(p.topicId) : undefined)).map((t) => (t ? lib.area(lib.track(t.trackId)?.areaId ?? '')?.name : undefined)).filter((x): x is string => !!x))];
  return (
    <>
      <Path items={[{ label: 'Meus notebooks', to: 'estudos/notebooks' }, { label: nb.name }]} />
      <PageHeader title={nb.name} subtitle={nb.desc || undefined} />
      <div className="st-origin">
        <Icon name="library" size={16} />
        <span>
          {areas.length ? (
            <>Reúne tópicos de {areas.join(', ')}.</>
          ) : tr ? (
            <>
              Referência:{' '}
              <a className="link" href={`#/estudos/trilha/${tr.id}`}>
                {[...trackPath(lib, tr), tr.name].join(' › ')}
              </a>
            </>
          ) : (
            <>Notebook livre, sem tópicos da Biblioteca.</>
          )}{' '}
          <a className="link" href="#/estudos/biblioteca">
            Adicionar da Biblioteca
          </a>
        </span>
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Páginas</h2>
          <span className="st-head-actions">
            {nb.pages.length > 1 && (
              <button type="button" className="link" onClick={() => setSorting((v) => !v)}>
                {sorting ? 'Pronto' : 'Organizar'}
              </button>
            )}
            <button type="button" className="btn soft small" onClick={() => setEdit({ kind: 'page', page: null, parentId: null })}>
              <Icon name="plus" size={15} /> Página
            </button>
          </span>
        </div>
        {tree.length ? (
          <ul className="list">
            {tree.map(({ page: p, depth }) => {
              const sibs = nb.pages.filter((x) => x.parentId === p.parentId);
              const k = sibs.indexOf(p);
              const st = p.topicId ? topicState(study.cycles, p.topicId) : null;
              const filled = !docIsEmpty(p.doc) || p.sourceIds.length > 0;
              const body = (
                <>
                  <span className={`tile-icon small${depth ? '' : ' st-blue'}`}>
                    <Icon name="note" size={16} />
                  </span>
                  <div className="row-body">
                    <span className="row-title">{p.name}</span>
                    {(p.topicId || !filled) && (
                      <span className="row-meta">
                        {p.topicId && 'Da Biblioteca'}
                        {p.topicId && !filled && ' · '}
                        {!filled && 'sem anotações'}
                      </span>
                    )}
                  </div>
                </>
              );
              return (
                <li key={p.id} className={depth ? 'st-subpage' : undefined}>
                  {sorting ? (
                    <div className="row">
                      {body}
                      <span className="st-order-btns">
                        <button type="button" className="icon-btn" disabled={k === 0} onClick={() => save((n) => movePage(n, p.id, -1))} aria-label={`Subir ${p.name}`}>
                          <Icon name="up" size={16} />
                        </button>
                        <button type="button" className="icon-btn" disabled={k === sibs.length - 1} onClick={() => save((n) => movePage(n, p.id, 1))} aria-label={`Descer ${p.name}`}>
                          <Icon name="down" size={16} />
                        </button>
                        <button type="button" className="icon-btn" onClick={() => setEdit({ kind: 'page', page: p, parentId: p.parentId })} aria-label={`Editar ${p.name}`}>
                          <Icon name="edit" size={16} />
                        </button>
                      </span>
                    </div>
                  ) : (
                    <a className="row" href={href(p.id)}>
                      {body}
                      {st && <StatusPill status={st.status} />}
                      <Icon name="right" size={18} />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>Sem páginas. Crie a primeira ou traga tópicos da Biblioteca.</Empty>
        )}
      </section>

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
          {nb.log.slice(0, 8).map((l, k) => (
            <li key={k}>
              <time>{formatDateTime(l.at)}</time>
              <span>{l.text}</span>
            </li>
          ))}
        </ul>
      </section>
      {sheets}
    </>
  );
}

/** Criar ou editar uma página: nome, onde fica (principal ou dentro de outra) e excluir. */
function PageSheet({ notebook, page, parentId, onClose, onSave, onDelete }: { notebook: StudyNotebook; page: StudyPage | null; parentId: string | null; onClose: () => void; onSave: (name: string, parentId: string | null) => void; onDelete?: () => void }) {
  const [name, setName] = useState(page?.name ?? '');
  const [parent, setParent] = useState(parentId ?? '');
  const [confirm, setConfirm] = useState(false);
  const kids = page ? notebook.pages.filter((p) => p.parentId === page.id).length : 0;
  const tops = notebook.pages.filter((p) => !p.parentId && p.id !== page?.id);
  return (
    <Sheet
      title={page ? 'Editar página' : parentId ? 'Nova subpágina' : 'Nova página'}
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
              {confirm ? (kids ? `Excluir com ${plural(kids, 'subpágina', 'subpáginas')}` : 'Confirmar exclusão') : 'Excluir'}
            </button>
          )}
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              if (!name.trim()) return notify('Dê um nome à página');
              onSave(name.trim(), parent || null);
              onClose();
            }}
          >
            Salvar
          </button>
        </div>
      }
    >
      <div className="form">
        <Field label="Nome da página">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Verbos irregulares, Projeto prático…" autoFocus />
        </Field>
        {tops.length > 0 && (
          <Field label="Onde fica" hint={kids ? 'Esta página tem subpáginas, por isso fica como página principal.' : 'Uma subpágina fica dentro de uma página principal.'}>
            <select className="input" value={parent} disabled={kids > 0} onChange={(e) => setParent(e.target.value)}>
              <option value="">Página principal</option>
              {tops.map((p) => (
                <option key={p.id} value={p.id}>
                  Dentro de: {p.name}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>
    </Sheet>
  );
}

/** Escolher as fontes ligadas à página (e cadastrar uma nova sem sair). */
function PageSources({ notebookId, value, onClose, onSave }: { notebookId: string; value: string[]; onClose: () => void; onSave: (ids: string[]) => void }) {
  const { study } = useStudy();
  const [ids, setIds] = useState(value);
  const [newSource, setNewSource] = useState(false);
  return (
    <Sheet
      title="Fontes desta página"
      onClose={onClose}
      footer={
        <button
          type="button"
          className="btn primary block"
          onClick={() => {
            onSave(ids.filter((i) => study.sources.some((s) => s.id === i)));
            onClose();
          }}
        >
          Salvar
        </button>
      }
    >
      <div className="form">
        {study.sources.length ? (
          <MultiChips options={study.sources.map((s) => [s.id, s.title])} value={ids} onToggle={(id) => setIds((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]))} label="Fontes" />
        ) : (
          <p className="muted small" style={{ margin: 0 }}>
            Você ainda não tem fontes guardadas.
          </p>
        )}
        <button type="button" className="btn soft small" onClick={() => setNewSource(true)}>
          <Icon name="plus" size={15} /> Nova fonte
        </button>
      </div>
      {newSource && <SourceSheet notebookId={notebookId} onClose={() => setNewSource(false)} />}
    </Sheet>
  );
}
