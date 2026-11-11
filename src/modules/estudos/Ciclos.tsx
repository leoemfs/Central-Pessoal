import { useState } from 'react';
import type { ViewProps } from '../../App';
import { go } from '../../router';
import { addTopicsAsPages, cycleCounts, newNotebook, nextStatus, remainingTopics, setTopicStatus, touch, trackPath } from '../../estudos';
import type { StudyCycle } from '../../types';
import { Field, Icon, notify, PageHeader, Sheet } from '../../ui';
import { formatDMY, todayISO } from '../../utils';
import { Missing } from './Biblioteca';
import { DualProgress, nowISO, Path, StatusPill, useStudy } from './shared';

/** Estudos › Ciclos (barra de baixo): os planos de estudo da pessoa. #/ciclos e #/ciclos/:id */
export function CiclosPage({ route }: ViewProps) {
  if (route.sub) return <CicloPage key={route.sub} id={route.sub} />;
  return <CiclosList />;
}

function CiclosList() {
  const { study, lib } = useStudy();
  const active = study.cycles.filter((c) => !c.finishedAt);
  const done = study.cycles.filter((c) => c.finishedAt).sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''));
  const row = (c: StudyCycle) => {
    const n = cycleCounts(c);
    const tr = lib.track(c.trackId);
    return (
      <li key={c.id}>
        <a className="row st-cycle-row" href={`#/ciclos/${c.id}`}>
          <span className="st-cycle-top">
            <span className="row-title">{c.name}</span>
            {c.finishedAt ? (
              <span className="pill green">Concluído {formatDMY(c.finishedAt)}</span>
            ) : (
              <span className="muted small tabular">
                {n.done}/{n.total}
              </span>
            )}
          </span>
          {!c.finishedAt && <DualProgress done={n.done} doing={n.doing} total={n.total} />}
          <span className="row-meta">
            {tr ? tr.name : 'Trilha removida'} · desde {formatDMY(c.startedAt)}
          </span>
        </a>
      </li>
    );
  };
  return (
    <>
      <PageHeader title="Ciclos" subtitle="Seus planos de estudo: os tópicos que você escolheu, na sua ordem e no seu ritmo." />
      <section className="card">
        <div className="card-head">
          <h2>Em andamento</h2>
        </div>
        {active.length ? (
          <ul className="list">{active.map(row)}</ul>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            Nenhum ciclo em andamento. Abra uma trilha na Biblioteca, marque os tópicos e toque em "Montar ciclo".
          </p>
        )}
      </section>
      <a className="btn soft block" href="#/estudos/biblioteca">
        <Icon name="library" size={18} /> Montar um ciclo pela Biblioteca
      </a>
      {done.length > 0 && (
        <section className="card">
          <div className="card-head">
            <h2>Concluídos</h2>
          </div>
          <ul className="list">{done.map(row)}</ul>
        </section>
      )}
    </>
  );
}

function CicloPage({ id }: { id: string }) {
  const { study, lib, set } = useStudy();
  const [edit, setEdit] = useState(false);
  const c = study.cycles.find((x) => x.id === id);
  if (!c) return <Missing what="Ciclo" />;
  const tr = lib.track(c.trackId);
  const n = cycleCounts(c);
  const nb = c.notebookId ? study.notebooks.find((x) => x.id === c.notebookId) : undefined;
  const free = tr ? remainingTopics(tr, study.cycles) : [];
  const save = (fn: (x: StudyCycle) => StudyCycle) => set((s) => ({ ...s, cycles: s.cycles.map((x) => (x.id === c.id ? fn(x) : x)) }));
  function cycleStatus(topicId: string) {
    const cur = c!.topics.find((t) => t.id === topicId)!.status;
    save((x) => setTopicStatus(x, topicId, nextStatus(cur), todayISO()));
  }
  function finish() {
    save((x) => ({ ...x, finishedAt: todayISO() }));
    notify('Ciclo concluído', free.length ? 'Os tópicos que faltam continuam na trilha para o próximo ciclo.' : 'Parabéns! Trilha inteira estudada.');
  }
  function linkNotebook() {
    if (!tr) return;
    const now = nowISO();
    const topics = c!.topics.map((t) => lib.topic(t.id)!).filter(Boolean);
    const ids = c!.topics.map((t) => t.id);
    const existing = study.notebooks.find((x) => x.pages.some((p) => p.topicId && ids.includes(p.topicId))) ?? study.notebooks.find((x) => x.trackId === tr.id);
    if (existing) {
      set((s) => ({ ...s, cycles: s.cycles.map((x) => (x.id === c!.id ? { ...x, notebookId: existing.id } : x)), notebooks: s.notebooks.map((x) => (x.id === existing.id ? touch(addTopicsAsPages(x, topics), `Ciclo "${c!.name}" ligado`, now) : x)) }));
      notify('Ciclo ligado ao notebook', existing.name);
    } else {
      const path = trackPath(lib, tr);
      const created = newNotebook(tr.levelId ? `${path[1]} ${path[2]}` : tr.name, tr, c!.topics.map((t) => t.id), now);
      set((s) => ({ ...s, cycles: s.cycles.map((x) => (x.id === c!.id ? { ...x, notebookId: created.id } : x)), notebooks: [created, ...s.notebooks] }));
      notify('Notebook criado', 'Cada tópico do ciclo virou uma página.');
    }
  }
  return (
    <>
      <Path items={[{ label: 'Ciclos', to: 'ciclos' }, { label: c.name }]} />
      <PageHeader
        title={c.name}
        subtitle={
          tr ? (
            <>
              {trackPath(lib, tr).join(' › ')} · trilha{' '}
              <a className="link" href={`#/estudos/trilha/${tr.id}`}>
                {tr.name}
              </a>
            </>
          ) : (
            'A trilha deste ciclo foi removida.'
          )
        }
      />
      <div className="st-stats">
        <div>
          <b className="tabular">{n.done}</b>
          <small>concluídos</small>
        </div>
        <div>
          <b className="tabular">{n.doing}</b>
          <small>estudando</small>
        </div>
        <div>
          <b className="tabular">{n.todo}</b>
          <small>a estudar</small>
        </div>
      </div>
      <div className="st-progress-block">
        <DualProgress done={n.done} doing={n.doing} total={n.total} />
        <div className="st-legend">
          <span>
            <i className="d" />
            Concluído
          </span>
          <span>
            <i className="g" />
            Estudando
          </span>
          <span className="tabular">
            Início {formatDMY(c.startedAt)}
            {c.finishedAt && ` · Fim ${formatDMY(c.finishedAt)}`}
          </span>
        </div>
      </div>
      <section className="card st-cycle-topics">
        <ul className="list">
          {c.topics.map((t, i) => {
            const tp = lib.topic(t.id);
            const sub = nb?.pages.find((s) => s.topicId === t.id);
            return (
              <li key={t.id} className="row">
                <span className="st-num tabular">{i + 1}</span>
                <div className="row-body">
                  <span className="st-topic-name">{tp?.name ?? 'Tópico removido'}</span>
                  {sub && (
                    <a className="st-tag-link" href={`#/estudos/notebook/${nb!.id}/${sub.id}`}>
                      <Icon name="notebook" size={13} /> Anotações
                    </a>
                  )}
                </div>
                <button type="button" className="st-state-btn" onClick={() => cycleStatus(t.id)} aria-label={`Mudar situação de ${tp?.name}`}>
                  <StatusPill status={t.status} />
                </button>
              </li>
            );
          })}
        </ul>
      </section>
      <p className="muted small" style={{ margin: 0 }}>
        Toque na situação para mudar: a estudar → estudando → concluído.
      </p>

      {nb ? (
        <a className="tile" href={`#/estudos/notebook/${nb.id}`}>
          <span className="tile-icon st-blue">
            <Icon name="notebook" />
          </span>
          <span className="tile-text">
            <strong>{nb.name}</strong>
            <span className="muted">Notebook deste ciclo</span>
          </span>
          <Icon name="right" size={18} />
        </a>
      ) : (
        tr && (
          <button type="button" className="btn soft" onClick={linkNotebook}>
            <Icon name="notebook" size={18} /> Anotar num notebook
          </button>
        )
      )}

      {!c.finishedAt && n.done === n.total && n.total > 0 && (
        <section className="card st-done-card">
          <div className="card-head">
            <h2>Tudo concluído!</h2>
          </div>
          <p className="muted small">Finalize para guardar este ciclo. {free.length ? `Ainda há ${free.length} tópicos livres nesta trilha.` : ''}</p>
          <div className="btn-row">
            <button type="button" className="btn primary" onClick={finish}>
              Finalizar ciclo
            </button>
          </div>
        </section>
      )}
      {c.finishedAt && tr && (
        <a className="btn soft block" href={`#/estudos/trilha/${tr.id}`}>
          {free.length ? `Montar o próximo ciclo (${free.length} tópicos livres)` : 'Rever a trilha'}
        </a>
      )}
      {!c.finishedAt && n.done < n.total && (
        <button type="button" className="btn ghost" onClick={() => setEdit(true)}>
          Renomear, encerrar ou excluir
        </button>
      )}
      {c.finishedAt && (
        <button type="button" className="btn ghost" onClick={() => setEdit(true)}>
          Editar ciclo
        </button>
      )}
      {edit && <CycleEdit cycle={c} onClose={() => setEdit(false)} />}
    </>
  );
}

function CycleEdit({ cycle, onClose }: { cycle: StudyCycle; onClose: () => void }) {
  const { set } = useStudy();
  const [name, setName] = useState(cycle.name);
  const [confirm, setConfirm] = useState(false);
  const save = (patch: Partial<StudyCycle>) => set((s) => ({ ...s, cycles: s.cycles.map((x) => (x.id === cycle.id ? { ...x, ...patch } : x)) }));
  return (
    <Sheet
      title="Editar ciclo"
      onClose={onClose}
      footer={
        <button
          type="button"
          className="btn primary block"
          onClick={() => {
            save({ name: name.trim() || cycle.name });
            onClose();
          }}
        >
          Salvar
        </button>
      }
    >
      <div className="form">
        <Field label="Nome do ciclo">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        {cycle.finishedAt ? (
          <button
            type="button"
            className="btn soft"
            onClick={() => {
              save({ finishedAt: null });
              onClose();
              notify('Ciclo reaberto');
            }}
          >
            Reabrir ciclo
          </button>
        ) : (
          <button
            type="button"
            className="btn soft"
            onClick={() => {
              save({ finishedAt: todayISO() });
              onClose();
              notify('Ciclo encerrado', 'O que não foi concluído volta a ficar livre na trilha.');
            }}
          >
            Encerrar agora (mesmo sem terminar)
          </button>
        )}
        <button
          type="button"
          className="btn danger"
          onClick={() => {
            if (!confirm) return setConfirm(true);
            set((s) => ({ ...s, cycles: s.cycles.filter((x) => x.id !== cycle.id) }));
            onClose();
            notify('Ciclo excluído', 'A trilha e o notebook continuam iguais.');
            go('ciclos');
          }}
        >
          {confirm ? 'Confirmar exclusão' : 'Excluir ciclo'}
        </button>
      </div>
    </Sheet>
  );
}
