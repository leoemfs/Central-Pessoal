import { useState } from 'react';
import { go } from '../../router';
import { SUGGESTED_MAPS } from '../../estudosCatalogo';
import { mapFromSuggestion } from '../../estudos';
import type { StudyMap } from '../../types';
import { Field, Icon, notify, PageHeader, Sheet } from '../../ui';
import { uid } from '../../utils';
import { Missing } from './Biblioteca';
import { MapDrawing, nowISO, Path, useStudy } from './shared';

export function MapasPage() {
  const { study, lib, set } = useStudy();
  function use(id: string) {
    const s = SUGGESTED_MAPS.find((m) => m.id === id)!;
    const m = mapFromSuggestion(s, nowISO());
    set((st) => ({ ...st, maps: [m, ...st.maps] }));
    notify('Mapa copiado para você', 'Agora é seu: mude o que quiser.');
    go(`estudos/mapa/${m.id}`);
  }
  return (
    <>
      <Path items={[{ label: 'Estudos', to: 'estudos' }, { label: 'Mapas mentais' }]} />
      <PageHeader title="Mapas mentais" subtitle="Veja como as ideias se ligam: um tema no centro, ramos em volta e detalhes nas pontas." />
      {study.maps.length > 0 ? (
        <div className="st-map-grid">
          {study.maps.map((m) => {
            const nb = m.notebookId ? study.notebooks.find((n) => n.id === m.notebookId) : undefined;
            return (
              <a key={m.id} className="st-map-card" href={`#/estudos/mapa/${m.id}`}>
                <MapDrawing map={m} small />
                <span className="st-map-card-text">
                  <strong>{m.name}</strong>
                  <small className="muted">{nb ? nb.name : `${m.branches.length} ramos`}</small>
                </span>
              </a>
            );
          })}
        </div>
      ) : (
        <p className="muted">Nenhum mapa seu ainda. Crie um pelo + ou use uma das sugestões abaixo como ponto de partida.</p>
      )}
      <h2 className="section-title">Sugestões para copiar</h2>
      <div className="st-map-grid">
        {SUGGESTED_MAPS.map((s) => (
          <button key={s.id} type="button" className="st-map-card" onClick={() => use(s.id)}>
            <MapDrawing map={{ name: s.name, center: s.center, branches: s.branches.map(([label, leaves]) => ({ label, leaves })) }} small />
            <span className="st-map-card-text">
              <strong>{s.name}</strong>
              <small className="muted">{lib.area(s.areaId)?.name} · toque para usar</small>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

export function MapaPage({ id }: { id: string }) {
  const { study, set } = useStudy();
  const [edit, setEdit] = useState(false);
  const m = study.maps.find((x) => x.id === id);
  if (!m) return <Missing what="Mapa" />;
  const nb = m.notebookId ? study.notebooks.find((n) => n.id === m.notebookId) : undefined;
  return (
    <>
      <Path items={[{ label: 'Mapas mentais', to: 'estudos/mapas' }, { label: m.name }]} />
      <PageHeader
        title={m.name}
        subtitle={
          nb ? (
            <>
              Do notebook{' '}
              <a className="link" href={`#/estudos/notebook/${nb.id}`}>
                {nb.name}
              </a>
            </>
          ) : undefined
        }
      />
      <div className="st-map-wrap">
        <MapDrawing map={m} />
      </div>
      <section className="card">
        <div className="card-head">
          <h2>Ramos</h2>
          <button type="button" className="btn soft small" onClick={() => setEdit(true)}>
            <Icon name="edit" size={15} /> Editar
          </button>
        </div>
        <ul className="st-branches">
          {m.branches.map((b) => (
            <li key={b.id}>
              <b>{b.label}</b>
              <span className="muted">{b.leaves.join(' · ') || 'sem detalhes'}</span>
            </li>
          ))}
        </ul>
      </section>
      {edit && (
        <MapEditor
          map={m}
          onClose={() => setEdit(false)}
          onSave={(next) => set((s) => ({ ...s, maps: s.maps.map((x) => (x.id === next.id ? next : x)) }))}
          onDelete={() => {
            set((s) => ({ ...s, maps: s.maps.filter((x) => x.id !== m.id) }));
            notify('Mapa excluído');
            go('estudos/mapas');
          }}
        />
      )}
    </>
  );
}

function MapEditor({ map, onClose, onSave, onDelete }: { map: StudyMap; onClose: () => void; onSave: (m: StudyMap) => void; onDelete: () => void }) {
  const { study } = useStudy();
  const [name, setName] = useState(map.name);
  const [center, setCenter] = useState(map.center);
  const [nb, setNb] = useState(map.notebookId ?? '');
  const [branches, setBranches] = useState(map.branches.map((b) => ({ ...b, text: b.leaves.join(', ') })));
  const [confirm, setConfirm] = useState(false);
  const change = (i: number, patch: Partial<(typeof branches)[number]>) => setBranches((bs) => bs.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  function save() {
    if (!name.trim()) return notify('Dê um nome ao mapa');
    onSave({
      ...map,
      name: name.trim(),
      center: center.trim() || name.trim(),
      notebookId: nb || null,
      branches: branches.filter((b) => b.label.trim()).map((b) => ({ id: b.id, label: b.label.trim(), leaves: b.text.split(',').map((x) => x.trim()).filter(Boolean) })),
      updatedAt: nowISO(),
    });
    onClose();
  }
  return (
    <Sheet
      title="Editar mapa"
      onClose={onClose}
      footer={
        <div className="btn-row">
          <button
            type="button"
            className="btn danger"
            onClick={() => {
              if (!confirm) return setConfirm(true);
              onClose();
              onDelete();
            }}
          >
            {confirm ? 'Confirmar exclusão' : 'Excluir'}
          </button>
          <button type="button" className="btn primary" onClick={save}>
            Salvar
          </button>
        </div>
      }
    >
      <div className="form">
        <Field label="Nome do mapa">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Ideia central" hint="Aparece no meio do desenho. Curta funciona melhor.">
          <input className="input" value={center} onChange={(e) => setCenter(e.target.value)} />
        </Field>
        <div className="field">
          <span className="field-label">Ramos</span>
          <div className="st-branch-edit">
            {branches.map((b, i) => (
              <div key={b.id} className="st-branch-row">
                <input className="input" value={b.label} onChange={(e) => change(i, { label: e.target.value })} placeholder="Ramo" aria-label={`Ramo ${i + 1}`} />
                <input className="input" value={b.text} onChange={(e) => change(i, { text: e.target.value })} placeholder="Detalhes, separados por vírgula" aria-label={`Detalhes do ramo ${i + 1}`} />
                <button type="button" className="icon-btn danger" onClick={() => setBranches((bs) => bs.filter((_, j) => j !== i))} aria-label={`Tirar ramo ${i + 1}`}>
                  <Icon name="trash" size={16} />
                </button>
              </div>
            ))}
          </div>
          {branches.length < 8 && (
            <button type="button" className="btn soft small" onClick={() => setBranches((bs) => [...bs, { id: uid(), label: '', leaves: [], text: '' }])}>
              <Icon name="plus" size={15} /> Ramo
            </button>
          )}
          <span className="field-hint">Até 8 ramos; o desenho mostra até 4 detalhes por ramo.</span>
        </div>
        {study.notebooks.length > 0 && (
          <Field label="Notebook (opcional)">
            <select className="input" value={nb} onChange={(e) => setNb(e.target.value)}>
              <option value="">Nenhum</option>
              {study.notebooks.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>
    </Sheet>
  );
}
