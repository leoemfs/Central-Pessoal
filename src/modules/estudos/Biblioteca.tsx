import { useState } from 'react';
import { go } from '../../router';
import { addTopicsAsPages, defaultCycleName, findSource, missingBefore, moveItem, newCycle, newNotebook, remainingTopics, topicState, touch, trackPath, trackProgress, type TrackView } from '../../estudos';
import type { StudySource } from '../../types';
import { Empty, Field, Icon, notify, PageHeader, Sheet, type IconName } from '../../ui';
import { todayISO, uid } from '../../utils';
import { AreasSheet, NotebookSheet, nowISO, Path, SourceCard, StatusPill, TrackSheet, trackCrumbs, useStudy } from './shared';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function BibliotecaPage() {
  const { study, lib, set } = useStudy();
  const [areas, setAreas] = useState(false);
  const visible = lib.areas.filter((a) => !study.archived.includes(a.id));
  const archived = lib.areas.filter((a) => study.archived.includes(a.id));
  const archive = (id: string, on: boolean) => {
    set((s) => ({ ...s, archived: on ? [...s.archived, id] : s.archived.filter((x) => x !== id) }));
    const name = lib.area(id)?.name ?? '';
    notify(on ? `${name} arquivada` : `${name} voltou para a biblioteca`, on ? 'Nada foi apagado. Ela fica em "Arquivadas".' : undefined);
  };
  const row = (a: (typeof visible)[number], isArchived: boolean) => {
    const trs = lib.tracks.filter((t) => t.areaId === a.id);
    const done = trs.reduce((n, t) => n + trackProgress(study.cycles, t).done, 0);
    return (
      <li key={a.id} className="row">
        {isArchived ? (
          <div className="st-row-main dim">
            <span className="tile-icon">
              <Icon name={a.icon as IconName} size={20} />
            </span>
            <div className="row-body">
              <span className="row-title">{a.name}</span>
              <span className="row-meta">{plural(a.themes.length, 'tema', 'temas')}</span>
            </div>
          </div>
        ) : (
          <a className="st-row-main" href={`#/estudos/area/${a.id}`}>
            <span className="tile-icon st-green">
              <Icon name={a.icon as IconName} size={20} />
            </span>
            <div className="row-body">
              <span className="row-title">{a.name}</span>
              <span className="row-meta">
                {plural(a.themes.length, 'tema', 'temas')} · {plural(trs.length, 'trilha', 'trilhas')}
                {done > 0 && ` · ${plural(done, 'tópico estudado', 'tópicos estudados')}`}
                {a.mine && ' · criada por você'}
              </span>
            </div>
          </a>
        )}
        <button type="button" className="icon-btn st-quiet" onClick={() => archive(a.id, !isArchived)} aria-label={isArchived ? `Trazer ${a.name} de volta` : `Arquivar ${a.name}`} title={isArchived ? 'Trazer de volta' : 'Arquivar'}>
          <Icon name={isArchived ? 'restore' : 'archive'} size={18} />
        </button>
      </li>
    );
  };
  return (
    <>
      <Path items={[{ label: 'Estudos', to: 'estudos' }, { label: 'Biblioteca' }]} />
      <PageHeader title="Biblioteca" subtitle="Roteiros de referência para explorar. Escolher algo daqui não muda o catálogo." />
      <section className="card">
        <ul className="list">{visible.map((a) => row(a, false))}</ul>
      </section>
      <button type="button" className="btn soft" onClick={() => setAreas(true)}>
        <Icon name="plus" size={18} /> Criar área ou tema
      </button>
      {archived.length > 0 && (
        <>
          <div>
            <h2 className="section-title">Arquivadas</h2>
            <p className="muted small">Fora da sua biblioteca, mas tudo continua guardado.</p>
          </div>
          <section className="card">
            <ul className="list">{archived.map((a) => row(a, true))}</ul>
          </section>
        </>
      )}
      {areas && <AreasSheet onClose={() => setAreas(false)} />}
    </>
  );
}

export function AreaPage({ id }: { id: string }) {
  const { study, lib } = useStudy();
  const [newTheme, setNewTheme] = useState(false);
  const area = lib.area(id);
  if (!area) return <Missing what="Área" />;
  const active = new Set(study.cycles.filter((c) => !c.finishedAt).map((c) => lib.track(c.trackId)?.themeId));
  return (
    <>
      <Path items={[{ label: 'Biblioteca', to: 'estudos/biblioteca' }, { label: area.name }]} />
      <PageHeader title={area.name} subtitle={area.desc} />
      {study.archived.includes(area.id) && <div className="alert orange">Esta área está arquivada. Traga de volta na Biblioteca para ela aparecer na lista.</div>}
      <section className="card">
        {area.themes.length ? (
          <ul className="list">
            {area.themes.map((t) => {
              const trs = [...(t.levels ?? []).flatMap((l) => l.tracks), ...t.tracks];
              const done = trs.reduce((n, x) => n + trackProgress(study.cycles, x).done, 0);
              const info = t.levels ? plural(t.levels.length, 'nível', 'níveis') : trs.length ? plural(trs.length, 'trilha', 'trilhas') : 'Sem trilhas ainda';
              return (
                <li key={t.id}>
                  <a className="row" href={`#/estudos/tema/${t.id}`}>
                    <div className="row-body">
                      <span className="row-title">{t.name}</span>
                      <span className="row-meta">
                        {info}
                        {done > 0 && ` · ${plural(done, 'tópico estudado', 'tópicos estudados')}`}
                        {t.mine && ' · seu'}
                      </span>
                    </div>
                    {active.has(t.id) && <span className="pill orange">Estudando</span>}
                    <Icon name="right" size={18} />
                  </a>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>Nenhum tema ainda.</Empty>
        )}
      </section>
      <button type="button" className="btn soft" onClick={() => setNewTheme(true)}>
        <Icon name="plus" size={18} /> Novo tema em {area.name}
      </button>
      {newTheme && <AreasSheet areaId={area.id} onClose={() => setNewTheme(false)} />}
    </>
  );
}

export function TemaPage({ id }: { id: string }) {
  const { lib } = useStudy();
  const [newTrack, setNewTrack] = useState(false);
  const theme = lib.theme(id);
  if (!theme) return <Missing what="Tema" />;
  const area = lib.area(theme.areaId)!;
  return (
    <>
      <Path items={[{ label: 'Biblioteca', to: 'estudos/biblioteca' }, { label: area.name, to: `estudos/area/${area.id}` }, { label: theme.name }]} />
      <PageHeader title={theme.name} subtitle={theme.levels ? 'Níveis de referência. Comece por onde fizer sentido para você.' : 'Trilhas deste tema.'} />
      {theme.levels && (
        <section className="card">
          <ul className="list">
            {theme.levels.map((l) => (
              <li key={l.id}>
                <a className="row" href={`#/estudos/nivel/${theme.id}/${l.id}`}>
                  <span className="tile-icon st-level">{l.name}</span>
                  <div className="row-body">
                    <span className="row-title">{l.title}</span>
                    <span className="row-meta">{l.desc}</span>
                  </div>
                  <span className="muted small nowrap">{plural(l.tracks.length, 'trilha', 'trilhas')}</span>
                  <Icon name="right" size={18} />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      {(!theme.levels || theme.tracks.length > 0) && <TrackList tracks={theme.tracks} title={theme.levels ? 'Suas trilhas neste tema' : undefined} />}
      <button type="button" className="btn soft" onClick={() => setNewTrack(true)}>
        <Icon name="plus" size={18} /> Criar uma trilha sua aqui
      </button>
      {newTrack && <TrackSheet themeId={theme.id} onClose={() => setNewTrack(false)} />}
    </>
  );
}

export function NivelPage({ themeId, id }: { themeId: string; id: string }) {
  const { lib } = useStudy();
  const theme = lib.theme(themeId);
  const level = lib.level(themeId, id);
  if (!theme || !level) return <Missing what="Nível" />;
  const area = lib.area(theme.areaId)!;
  return (
    <>
      <Path
        items={[
          { label: 'Biblioteca', to: 'estudos/biblioteca' },
          { label: area.name, to: `estudos/area/${area.id}` },
          { label: theme.name, to: `estudos/tema/${theme.id}` },
          { label: level.name },
        ]}
      />
      <PageHeader title={`${level.name} · ${level.title}`} subtitle={level.desc} />
      <TrackList tracks={level.tracks} />
    </>
  );
}

function TrackList({ tracks, title }: { tracks: TrackView[]; title?: string }) {
  const { study } = useStudy();
  if (!tracks.length)
    return (
      <section className="card">
        <Empty>Ainda não há trilhas aqui. Crie uma sua ou comece um notebook livre sobre o tema.</Empty>
      </section>
    );
  return (
    <section className="card">
      {title && (
        <div className="card-head">
          <h2>{title}</h2>
        </div>
      )}
      <p className="muted small" style={{ marginTop: 0 }}>
        Trilhas são roteiros de referência. Você escolhe só os tópicos que quiser para montar um ciclo.
      </p>
      <ul className="list">
        {tracks.map((t) => {
          const p = trackProgress(study.cycles, t);
          return (
            <li key={t.id}>
              <a className="row" href={`#/estudos/trilha/${t.id}`}>
                <span className="tile-icon">
                  <Icon name="route" size={18} />
                </span>
                <div className="row-body">
                  <span className="row-title">{t.name}</span>
                  <span className="row-meta">
                    {t.desc || plural(t.topics.length, 'tópico', 'tópicos')}
                    {t.mine && ' · sua'}
                  </span>
                </div>
                <span className="muted small tabular nowrap">{p.done ? `${p.done}/${p.total}` : p.total}</span>
                <Icon name="right" size={18} />
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function TrilhaPage({ id }: { id: string }) {
  const { study, lib, set } = useStudy();
  const [sel, setSel] = useState<string[]>([]);
  const [build, setBuild] = useState(false);
  const [edit, setEdit] = useState(false);
  const [nb, setNb] = useState(false);
  const [toNb, setToNb] = useState(false);
  const tr = lib.track(id);
  if (!tr) return <Missing what="Trilha" />;
  const prog = trackProgress(study.cycles, tr);
  const missing = missingBefore(tr, sel, study.cycles);
  const toggle = (tid: string) => setSel((v) => (v.includes(tid) ? v.filter((x) => x !== tid) : [...v, tid]));
  const free = remainingTopics(tr, study.cycles);
  const notebooks = study.notebooks.filter((n) => n.trackId === tr.id);
  function saveSource(s: { title: string; url: string; kind: StudySource['kind'] }) {
    if (findSource(study, s)) return notify('Essa fonte já está guardada', 'Veja em Estudos › Fontes.');
    set((st) => ({ ...st, sources: [{ id: uid(), title: s.title, url: s.url, kind: s.kind, note: `Sugerida na trilha ${tr!.name}`, notebookIds: notebooks.map((n) => n.id), createdAt: nowISO() }, ...st.sources] }));
    notify('Fonte guardada', 'Está em Estudos › Fontes.');
  }
  return (
    <>
      <Path items={[...trackCrumbs(lib, tr), { label: tr.name }]} />
      <PageHeader title={tr.name} subtitle={tr.desc || undefined} />
      <div className="info-box">
        <Icon name="info" size={18} />
        <span>
          <strong>Trilha de referência</strong>
          Marque os tópicos que te interessam. Depois, leve para um <b>notebook</b> (para anotar) ou monte um <b>ciclo</b> (para acompanhar o progresso). A trilha continua inteira e na mesma ordem.
        </span>
      </div>
      {prog.done > 0 && (
        <p className="muted small tabular" style={{ margin: 0 }}>
          Você já estudou {prog.done} de {prog.total} tópicos desta trilha.
        </p>
      )}
      <section className="card st-topics">
        <div className="card-head">
          <h2>{plural(tr.topics.length, 'tópico', 'tópicos')}</h2>
          {free.length > 0 && (
            <button type="button" className="link" onClick={() => setSel(sel.length === free.length ? [] : free.map((t) => t.id))}>
              {sel.length === free.length ? 'Desmarcar' : 'Marcar os livres'}
            </button>
          )}
        </div>
        <ol className="st-topic-list">
          {tr.topics.map((tp, i) => {
            const on = sel.includes(tp.id);
            const st = topicState(study.cycles, tp.id);
            const warn = missing.find((m) => m.topicId === tp.id);
            const before = tp.before ? lib.topic(tp.before) : undefined;
            return (
              <li key={tp.id} className={`st-topic${on ? ' on' : ''}`}>
                <span className="st-num tabular">{i + 1}</span>
                <div className="st-topic-body">
                  <span className="st-topic-name">{tp.name}</span>
                  {st && (
                    <span className="st-tags">
                      <StatusPill status={st.status}>{st.status === 'feito' ? 'Estudado' : st.status === 'andando' ? 'Estudando' : 'No ciclo'}</StatusPill>
                      <a className="st-tag-link" href={`#/ciclos/${st.cycle.id}`}>
                        {st.cycle.name}
                      </a>
                    </span>
                  )}
                  {before && !on && !st && <span className="muted small">Recomendado antes: {before.name}</span>}
                  {warn && (
                    <span className="st-hint">
                      <Icon name="info" size={14} /> {warn.why || `Recomendado antes: ${before?.name}`}
                      <button type="button" onClick={() => setSel((v) => [...v, warn.beforeId])}>
                        Incluir {lib.topic(warn.beforeId)?.name}
                      </button>
                    </span>
                  )}
                </div>
                <button type="button" className={`check st-check${on ? ' on' : ''}`} onClick={() => toggle(tp.id)} aria-pressed={on} aria-label={`Escolher ${tp.name}`}>
                  {on && <Icon name="check" size={16} />}
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      {tr.sources.length > 0 && (
        <section className="card">
          <div className="card-head">
            <h2>Fontes sugeridas</h2>
          </div>
          <div className="st-res-list">
            {tr.sources.map((s) => {
              const saved = !!findSource(study, s);
              return (
                <SourceCard
                  key={s.title}
                  s={s}
                  extra={
                    <button type="button" className={`btn small ${saved ? 'ghost' : 'soft'}`} disabled={saved} onClick={() => saveSource(s)}>
                      {saved ? 'Guardada' : 'Guardar'}
                    </button>
                  }
                />
              );
            })}
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-head">
          <h2>Notebooks desta trilha</h2>
          <button type="button" className="link" onClick={() => setNb(true)}>
            Novo
          </button>
        </div>
        {notebooks.length ? (
          <ul className="list">
            {notebooks.map((n) => (
              <li key={n.id}>
                <a className="row" href={`#/estudos/notebook/${n.id}`}>
                  <span className="tile-icon st-blue">
                    <Icon name="notebook" size={18} />
                  </span>
                  <div className="row-body">
                    <span className="row-title">{n.name}</span>
                    <span className="row-meta">{plural(n.pages.length, 'página', 'páginas')}</span>
                  </div>
                  <Icon name="right" size={18} />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small" style={{ margin: 0 }}>
            Nenhum ainda. Um notebook guarda suas anotações; não é obrigatório.
          </p>
        )}
      </section>

      {tr.mine && (
        <button type="button" className="btn soft" onClick={() => setEdit(true)}>
          <Icon name="edit" size={18} /> Editar esta trilha
        </button>
      )}

      <div className="st-actionbar">
        <div className="st-actionbar-text">
          <b>{sel.length ? plural(sel.length, 'tópico escolhido', 'tópicos escolhidos') : 'Nenhum tópico escolhido'}</b>
          <span className="muted small">{sel.length ? tr.topics.filter((t) => sel.includes(t.id)).map((t) => t.name).join(', ') : 'Toque nos quadrados para escolher'}</span>
        </div>
        {sel.length > 0 && (
          <button type="button" className="icon-btn st-quiet" onClick={() => setSel([])} aria-label="Limpar a escolha" title="Limpar">
            <Icon name="x" size={18} />
          </button>
        )}
        <div className="st-actionbar-btns">
          <button type="button" className="btn soft" disabled={!sel.length} onClick={() => setToNb(true)}>
            <Icon name="notebook" size={16} /> Notebook
          </button>
          <button type="button" className="btn primary" disabled={!sel.length} onClick={() => setBuild(true)}>
            Montar ciclo
          </button>
        </div>
      </div>

      {toNb && <AddToNotebook track={tr} topicIds={tr.topics.filter((t) => sel.includes(t.id)).map((t) => t.id)} onClose={() => setToNb(false)} />}

      {build && <CycleBuilder track={tr} selected={tr.topics.filter((t) => sel.includes(t.id)).map((t) => t.id)} onClose={() => setBuild(false)} />}
      {edit && <TrackSheet trackId={tr.id} onClose={() => setEdit(false)} />}
      {nb && <NotebookSheet trackId={tr.id} onClose={() => setNb(false)} />}
    </>
  );
}

/** Levar os tópicos escolhidos para um notebook (existente ou novo). A Biblioteca não muda; a página guarda a origem. */
function AddToNotebook({ track, topicIds, onClose }: { track: TrackView; topicIds: string[]; onClose: () => void }) {
  const { study, lib, set } = useStudy();
  const recent = [...study.notebooks].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const [choice, setChoice] = useState<string>(recent.find((n) => n.trackId === track.id)?.id ?? recent[0]?.id ?? 'novo');
  const path = trackPath(lib, track);
  const [name, setName] = useState(track.levelId ? `${path[1]} ${path[2]}` : path[1] ?? track.name);
  const topics = topicIds.map((id) => lib.topic(id)!).filter(Boolean);
  const target = study.notebooks.find((n) => n.id === choice);
  const already = target ? topics.filter((t) => target.pages.some((p) => p.topicId === t.id)).length : 0;
  function add() {
    const now = nowISO();
    if (choice === 'novo') {
      if (!name.trim()) return notify('Dê um nome ao notebook');
      const nb = newNotebook(name, track, topicIds, now);
      set((s) => ({ ...s, notebooks: [nb, ...s.notebooks] }));
      onClose();
      notify('Notebook criado', `${plural(topics.length, 'página nova', 'páginas novas')}, uma por tópico.`);
      go(`estudos/notebook/${nb.id}`);
      return;
    }
    const added = topics.length - already;
    if (added > 0) set((s) => ({ ...s, notebooks: s.notebooks.map((n) => (n.id === choice ? touch(addTopicsAsPages(n, topics, now), `${plural(added, 'tópico adicionado', 'tópicos adicionados')} de ${track.name}`, now) : n)) }));
    onClose();
    notify(added > 0 ? `${plural(added, 'página nova', 'páginas novas')} em ${target?.name}` : 'Esses tópicos já estavam no notebook');
    go(`estudos/notebook/${choice}`);
  }
  return (
    <Sheet
      title="Adicionar ao notebook"
      onClose={onClose}
      footer={
        <button type="button" className="btn primary block" onClick={add}>
          {choice === 'novo' ? 'Criar notebook' : 'Adicionar'}
        </button>
      }
    >
      <div className="form">
        <p className="muted small" style={{ margin: 0 }}>
          Cada tópico vira uma página sua para anotar. Um notebook pode juntar tópicos de várias trilhas e áreas. Na Biblioteca, nada muda.
        </p>
        <div className="field">
          <span className="field-label">{plural(topics.length, 'tópico', 'tópicos')}</span>
          <span className="muted small">{topics.map((t) => t.name).join(' · ')}</span>
        </div>
        <Field label="Para qual notebook?">
          <select className="input" value={choice} onChange={(e) => setChoice(e.target.value)}>
            {recent.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
            <option value="novo">Criar um notebook novo</option>
          </select>
        </Field>
        {choice === 'novo' && (
          <Field label="Nome do notebook">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        )}
        {already > 0 && <span className="field-hint">{plural(already, 'tópico já está', 'tópicos já estão')} neste notebook e não será repetido.</span>}
      </div>
    </Sheet>
  );
}

/** Montar o ciclo: nome, ordem e (opcional) notebook. */
function CycleBuilder({ track, selected, onClose }: { track: TrackView; selected: string[]; onClose: () => void }) {
  const { study, lib, set } = useStudy();
  const [name, setName] = useState(() => defaultCycleName(study.cycles, track, lib));
  const [order, setOrder] = useState(selected);
  // Sugere o notebook que já tem páginas destes tópicos; senão, um da mesma trilha.
  const related = study.notebooks.find((n) => n.pages.some((p) => p.topicId && selected.includes(p.topicId))) ?? study.notebooks.find((n) => n.trackId === track.id);
  const [nbChoice, setNbChoice] = useState<string>(related?.id ?? 'nenhum');
  function create() {
    const now = nowISO();
    const topics = order.map((id) => lib.topic(id)!).filter(Boolean);
    let notebookId: string | null = null;
    let notebooks = study.notebooks;
    if (nbChoice === 'novo') {
      const path = trackPath(lib, track);
      const nb = newNotebook(track.levelId ? `${path[1]} ${path[2]}` : track.name, track, order, now);
      notebooks = [nb, ...notebooks];
      notebookId = nb.id;
    } else if (nbChoice !== 'nenhum') {
      notebookId = nbChoice;
      notebooks = notebooks.map((n) => (n.id === nbChoice ? touch(addTopicsAsPages(n, topics), `Ciclo "${name.trim()}" ligado`, now) : n));
    }
    const c = newCycle({ trackId: track.id, topicIds: order, name, notebookId, today: todayISO(), now });
    set((s) => ({ ...s, cycles: [c, ...s.cycles], notebooks }));
    onClose();
    notify('Ciclo criado', 'A trilha original continua igual.');
    go(`ciclos/${c.id}`);
  }
  return (
    <Sheet
      title="Montar ciclo"
      onClose={onClose}
      footer={
        <button type="button" className="btn primary block" onClick={create}>
          Criar ciclo
        </button>
      }
    >
      <div className="form">
        <Field label="Nome do ciclo">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="field">
          <span className="field-label">Ordem de estudo</span>
          <ol className="st-order">
            {order.map((id, i) => (
              <li key={id}>
                <span className="st-num tabular">{i + 1}</span>
                <span className="st-order-name">{lib.topic(id)?.name}</span>
                <span className="st-order-btns">
                  <button type="button" className="icon-btn" disabled={i === 0} onClick={() => setOrder((o) => moveItem(o, i, -1))} aria-label="Subir">
                    <Icon name="up" size={16} />
                  </button>
                  <button type="button" className="icon-btn" disabled={i === order.length - 1} onClick={() => setOrder((o) => moveItem(o, i, 1))} aria-label="Descer">
                    <Icon name="down" size={16} />
                  </button>
                </span>
              </li>
            ))}
          </ol>
          <span className="field-hint">A ordem é sua. Na trilha, nada muda.</span>
        </div>
        <Field label="Notebook (opcional)" hint="Com notebook, cada tópico do ciclo vira uma página para anotar.">
          <select className="input" value={nbChoice} onChange={(e) => setNbChoice(e.target.value)}>
            <option value="nenhum">Sem notebook</option>
            <option value="novo">Criar um notebook para este ciclo</option>
            {study.notebooks.map((n) => (
              <option key={n.id} value={n.id}>
                Usar: {n.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </Sheet>
  );
}

export function Missing({ what }: { what: string }) {
  return (
    <section className="card">
      <Empty>{what} não encontrado(a). Pode ter sido excluído(a).</Empty>
      <a className="btn soft block" href="#/estudos">
        Voltar para Estudos
      </a>
    </section>
  );
}
