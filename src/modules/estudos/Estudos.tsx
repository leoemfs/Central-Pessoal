import { useState } from 'react';
import type { ViewProps } from '../../App';
import { cycleCounts, trackPath } from '../../estudos';
import { Icon, PageHeader, type IconName } from '../../ui';
import { formatDateTime } from '../../utils';
import { AreaPage, BibliotecaPage, NivelPage, TemaPage, TrilhaPage } from './Biblioteca';
import { NotebookPage, NotebooksPage } from './Notebooks';
import { FontesPage } from './Fontes';
import { MapaPage, MapasPage } from './Mapas';
import { CreateMenu, DualProgress, useCreate, useStudy } from './shared';

/** Trilhas sugeridas para começar (uma de cada área). */
const START = ['en-a1-contatos', 'ia-prompts', 'prod-semana', 'car-cv', 'dev-logica'];

/**
 * Estudos. Endereços:
 * #/estudos · /biblioteca · /area/:id · /tema/:id · /nivel/:tema/:id · /trilha/:id
 * /notebooks · /notebook/:id[/:assunto] · /fontes · /mapas · /mapa/:id
 * Ciclos e Roadmaps têm telas próprias (#/ciclos, #/roadmaps), na barra de baixo.
 */
export function Estudos({ route }: ViewProps) {
  const [menu, setMenu] = useState(false);
  const create = useCreate();
  const [extra, setExtra] = useState<{ label: string; hint: string; icon: IconName; run: () => void }[] | undefined>();
  const [kind, a = '', b = ''] = route.sub.split('/');
  const k = route.sub;
  let page;
  let fab = true;
  switch (kind) {
    case 'biblioteca':
      page = <BibliotecaPage />;
      break;
    case 'area':
      page = <AreaPage key={k} id={a} />;
      break;
    case 'tema':
      page = <TemaPage key={k} id={a} />;
      break;
    case 'nivel':
      page = <NivelPage key={k} themeId={a} id={b} />;
      break;
    case 'trilha':
      page = <TrilhaPage key={a} id={a} />;
      fab = false;
      break;
    case 'notebooks':
      page = <NotebooksPage />;
      break;
    case 'notebook':
      page = <NotebookPage key={a} id={a} pageId={b} setExtra={setExtra} />;
      break;
    case 'fontes':
      page = <FontesPage />;
      break;
    case 'mapas':
      page = <MapasPage />;
      break;
    case 'mapa':
      page = <MapaPage key={a} id={a} />;
      break;
    default:
      page = <Home />;
  }
  return (
    <>
      {page}
      {fab && (
        <button type="button" className="fab" onClick={() => setMenu(true)} aria-label="Criar em Estudos">
          <Icon name="plus" size={26} />
        </button>
      )}
      {menu && <CreateMenu onClose={() => setMenu(false)} onPick={create.pick} extra={kind === 'notebook' ? extra : undefined} />}
      {create.sheet}
    </>
  );
}

function Home() {
  const { study, lib } = useStudy();
  const visibleAreas = lib.areas.filter((x) => !study.archived.includes(x.id));
  const trackCount = lib.tracks.filter((t) => !study.archived.includes(t.areaId)).length;
  const active = study.cycles.filter((c) => !c.finishedAt);
  const lastNb = [...study.notebooks].sort((x, y) => y.updatedAt.localeCompare(x.updatedAt))[0];
  const firstTime = study.cycles.length === 0 && study.notebooks.length === 0;
  return (
    <>
      <PageHeader title="Estudos" subtitle="Seu espaço para explorar, planejar e guardar o que aprende." />

      {/* Bloco principal (fixo): Biblioteca e Meus notebooks + Fontes e Mapas mentais */}
      <div className="st-main-block">
        <div className="st-hero-pair">
          <a className="st-hero" href="#/estudos/biblioteca">
            <span className="st-hero-icon green">
              <Icon name="library" size={24} />
            </span>
            <strong>Biblioteca</strong>
            <span className="muted">Áreas, trilhas e tópicos recomendados para explorar.</span>
            <span className="st-hero-meta tabular">
              {visibleAreas.length} áreas · {trackCount} trilhas
            </span>
          </a>
          <a className="st-hero" href="#/estudos/notebooks">
            <span className="st-hero-icon blue">
              <Icon name="notebook" size={24} />
            </span>
            <strong>Meus notebooks</strong>
            <span className="muted">Suas anotações, materiais e projetos.</span>
            <span className="st-hero-meta tabular">
              {study.notebooks.length ? `${study.notebooks.length} ${study.notebooks.length === 1 ? 'notebook' : 'notebooks'}` : 'Nenhum ainda'}
            </span>
          </a>
        </div>
        <div className="st-shortcuts">
          <a className="st-shortcut" href="#/estudos/fontes">
            <Icon name="link" size={22} />
            <span>
              <strong>Fontes</strong>
              <small>{study.sources.length ? `${study.sources.length} ${study.sources.length === 1 ? 'referência' : 'referências'}` : 'Sites, vídeos, livros'}</small>
            </span>
          </a>
          <a className="st-shortcut" href="#/estudos/mapas">
            <Icon name="mindmap" size={22} />
            <span>
              <strong>Mapas mentais</strong>
              <small>{study.maps.length ? `${study.maps.length} ${study.maps.length === 1 ? 'mapa' : 'mapas'}` : 'Ideias ligadas'}</small>
            </span>
          </a>
        </div>
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Estudando agora</h2>
          <a className="link" href="#/ciclos">
            Ciclos
          </a>
        </div>
        {active.length ? (
          <ul className="list">
            {active.map((c) => {
              const n = cycleCounts(c);
              const tr = lib.track(c.trackId);
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
                    <span className="row-meta">{tr ? `${trackPath(lib, tr).join(' › ')} · ${tr.name}` : 'Trilha removida'}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="st-empty">
            <p className="muted">Nenhum ciclo em andamento. Um ciclo é um punhado de tópicos que você escolhe estudar agora, no seu ritmo.</p>
            <a className="btn soft" href="#/estudos/biblioteca">
              Escolher tópicos na Biblioteca
            </a>
          </div>
        )}
      </section>

      {lastNb && (
        <a className="tile" href={`#/estudos/notebook/${lastNb.id}`}>
          <span className="tile-icon st-blue">
            <Icon name="notebook" />
          </span>
          <span className="tile-text">
            <strong>Continuar: {lastNb.name}</strong>
            <span className="muted">Editado em {formatDateTime(lastNb.updatedAt)}</span>
          </span>
          <Icon name="right" size={18} />
        </a>
      )}

      {firstTime && (
        <>
          <section className="card">
            <div className="card-head">
              <h2>Como funciona</h2>
            </div>
            <ol className="st-how">
              <li>
                <b>Explore a Biblioteca.</b> Áreas, temas e trilhas são roteiros de referência, nunca obrigatórios.
              </li>
              <li>
                <b>Monte um ciclo.</b> Marque só os tópicos que quer estudar agora e escolha a ordem.
              </li>
              <li>
                <b>Anote num notebook.</b> Anotações, vocabulário, links e vídeos de cada assunto.
              </li>
              <li>
                <b>Guarde fontes e mapas.</b> Uma fonte pode servir a vários estudos.
              </li>
            </ol>
            <p className="muted small">Também dá para começar direto por um notebook, sem trilha nenhuma.</p>
          </section>
          <section className="card">
            <div className="card-head">
              <h2>Sugestões para começar</h2>
            </div>
            <ul className="list">
              {START.map((id) => lib.track(id))
                .filter((t): t is NonNullable<typeof t> => !!t && !study.archived.includes(t.areaId))
                .map((t) => (
                  <li key={t.id}>
                    <a className="row" href={`#/estudos/trilha/${t.id}`}>
                      <span className="tile-icon">
                        <Icon name={(lib.area(t.areaId)?.icon ?? 'folder') as IconName} size={18} />
                      </span>
                      <div className="row-body">
                        <span className="row-title">{t.name}</span>
                        <span className="row-meta">{trackPath(lib, t).join(' › ')}</span>
                      </div>
                      <Icon name="right" size={18} />
                    </a>
                  </li>
                ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}
