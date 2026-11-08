import { useState } from 'react';
import { trackPath, trackProgress } from '../../estudos';
import { Icon, PageHeader, Progress, type IconName } from '../../ui';
import { useStudy } from './shared';

/** Estudos › Roadmaps (barra de baixo): todos os roteiros de referência, por área. O plano da pessoa fica em Ciclos. */
export function RoadmapsPage() {
  const { study, lib } = useStudy();
  const areas = lib.areas.filter((a) => !study.archived.includes(a.id) && lib.tracks.some((t) => t.areaId === a.id));
  const [area, setArea] = useState<string>('todas');
  const shown = areas.filter((a) => area === 'todas' || a.id === area);
  return (
    <>
      <PageHeader
        title="Roadmaps"
        subtitle={
          <>
            Todos os roteiros de referência, por área. Aqui é o mapa do caminho; o seu plano fica em{' '}
            <a className="link" href="#/ciclos">
              Ciclos
            </a>
            .
          </>
        }
      />
      <div className="chips st-scroll-chips" role="radiogroup" aria-label="Área">
        {[{ id: 'todas', name: 'Todas' }, ...areas].map((a) => (
          <button key={a.id} type="button" role="radio" aria-checked={area === a.id} className={`chip-btn${area === a.id ? ' on' : ''}`} onClick={() => setArea(a.id)}>
            {a.name}
          </button>
        ))}
      </div>
      {shown.map((a) => (
        <section key={a.id} className="card">
          <div className="card-head">
            <h2 className="st-area-title">
              <Icon name={a.icon as IconName} size={20} />
              {a.name}
            </h2>
            <a className="link" href={`#/estudos/area/${a.id}`}>
              Na Biblioteca
            </a>
          </div>
          <ul className="list">
            {lib.tracks
              .filter((t) => t.areaId === a.id)
              .map((t) => {
                const p = trackProgress(study.cycles, t);
                return (
                  <li key={t.id}>
                    <a className="row st-road-row" href={`#/estudos/trilha/${t.id}`}>
                      <span className="st-cycle-top">
                        <span className="row-title">{t.name}</span>
                        <span className="muted small tabular nowrap">
                          {p.done}/{p.total} estudados
                        </span>
                      </span>
                      <Progress pct={p.total ? (p.done / p.total) * 100 : 0} />
                      <span className="row-meta">{trackPath(lib, t).slice(1).join(' › ')}</span>
                    </a>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </>
  );
}
