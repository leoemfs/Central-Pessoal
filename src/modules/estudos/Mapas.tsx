import { useEffect, useMemo, useRef, useState } from 'react';
import { go } from '../../router';
import { SUGGESTED_MAPS } from '../../estudosCatalogo';
import { mapFromSuggestion } from '../../estudos';
import { addChild, addSibling, countNodes, findNode, fromBranches, layoutMap, MAP_COLORS, moveSibling, parentOf, removeNode, reparent, updateNode, validParents, type LaidNode, type MapLayout } from '../../mapas';
import type { MapNode, StudyMap } from '../../types';
import { Field, Icon, notify, PageHeader, Sheet } from '../../ui';
import { Missing } from './Biblioteca';
import { nowISO, Path, useStudy } from './shared';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// ---------- Desenho ----------

/** As ideias e as ligações entre elas. Serve para o mapa aberto e para as miniaturas. */
function MapShapes({ layout, selected, interactive }: { layout: MapLayout; selected?: string | null; interactive?: boolean }) {
  const byId = new Map(layout.nodes.map((n) => [n.id, n]));
  return (
    <>
      {layout.nodes.map((n) => {
        const p = n.parentId ? byId.get(n.parentId) : undefined;
        if (!p) return null;
        const sx = p.x + (n.side * p.w) / 2;
        const ex = n.x - (n.side * n.w) / 2;
        const mx = (sx + ex) / 2;
        return <path key={`e${n.id}`} d={`M${sx} ${p.y} C${mx} ${p.y} ${mx} ${n.y} ${ex} ${n.y}`} fill="none" stroke={n.color} strokeWidth={n.depth === 1 ? 2.6 : 1.8} strokeOpacity={0.75} strokeLinecap="round" />;
      })}
      {layout.nodes.map((n) => {
        const on = selected === n.id;
        const root = n.depth === 0;
        return (
          <g key={n.id} data-node={n.id} className={`mm-node${on ? ' on' : ''}${root ? ' root' : ''}`}>
            <rect
              x={n.x - n.w / 2}
              y={n.y - n.h / 2}
              width={n.w}
              height={n.h}
              rx={n.h / 2}
              className="mm-box"
              style={root ? undefined : { fill: n.color, fillOpacity: n.depth === 1 ? 0.22 : 0.1, stroke: on ? undefined : n.color, strokeOpacity: n.depth === 1 ? 0.9 : 0.45 }}
            />
            <text x={n.x} y={n.y} dy="0.35em" textAnchor="middle" className="mm-text" style={{ fontSize: root ? 15 : n.depth === 1 ? 13.5 : 12.5, fontWeight: n.depth <= 1 ? 700 : 500 }}>
              {n.label}
            </text>
            {!root && n.children > 0 && (interactive || n.collapsed) && <Toggle n={n} interactive={interactive} />}
          </g>
        );
      })}
    </>
  );
}

/** Bolinha na ponta do ramo: recolhe e expande. Recolhido, mostra quantas ideias guarda. */
function Toggle({ n, interactive }: { n: LaidNode; interactive?: boolean }) {
  const cx = n.x + n.side * (n.w / 2 + 13);
  return (
    <g data-toggle={interactive ? n.id : undefined} className="mm-toggle">
      {/* Alvo de toque maior que o desenho. */}
      <circle cx={cx} cy={n.y} r={17} fill="transparent" />
      <circle cx={cx} cy={n.y} r={10} className="mm-toggle-dot" style={{ stroke: n.color }} />
      <text x={cx} y={n.y} dy="0.35em" textAnchor="middle" className="mm-toggle-text">
        {n.collapsed ? n.hidden : '–'}
      </text>
    </g>
  );
}

/** Miniatura parada (listas e sugestões). */
export function MapThumb({ root, name }: { root: MapNode; name: string }) {
  const layout = useMemo(() => layoutMap(root), [root]);
  const pad = 14;
  return (
    <svg className="mm-thumb" viewBox={`${layout.minX - pad} ${layout.minY - pad} ${layout.maxX - layout.minX + pad * 2} ${layout.maxY - layout.minY + pad * 2}`} role="img" aria-label={`Mapa mental: ${name}`} preserveAspectRatio="xMidYMid meet">
      <MapShapes layout={layout} />
    </svg>
  );
}

interface View {
  x: number;
  y: number;
  k: number;
}
const clampK = (k: number) => Math.min(2.5, Math.max(0.25, k));

/**
 * Mapa aberto: arrastar move, dois dedos (ou a rodinha do mouse) aproximam, tocar numa ideia seleciona.
 * O toque é resolvido aqui (e não em cada ideia) para arrastar e tocar não se confundirem.
 */
function MapCanvas({ layout, selected, onPick, onToggle, onKey }: { layout: MapLayout; selected: string; onPick: (id: string) => void; onToggle: (id: string) => void; onKey: (e: React.KeyboardEvent) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [view, setView] = useState<View | null>(null);
  const viewRef = useRef<View | null>(null);
  viewRef.current = view;
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ moved: boolean; target: { node?: string; toggle?: string }; dist: number; k: number; x: number; y: number; mx: number; my: number } | null>(null);

  const fitView = (s: { w: number; h: number }): View => {
    const pad = 30;
    const bw = layout.maxX - layout.minX;
    const bh = layout.maxY - layout.minY;
    const k = Math.min(1.2, Math.max(0.25, Math.min((s.w - pad * 2) / bw, (s.h - pad * 2) / bh)));
    return { k, x: s.w / 2 - (k * (layout.minX + layout.maxX)) / 2, y: s.h / 2 - (k * (layout.minY + layout.maxY)) / 2 };
  };

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Primeira vez: o mapa inteiro, se couber legível; senão, tamanho de leitura centrado na ideia central.
  useEffect(() => {
    if (!size || view) return;
    const fit = fitView(size);
    if (fit.k >= 0.7) return setView(fit);
    const root = layout.nodes[0];
    const k = 0.8;
    setView({ k, x: size.w / 2 - k * root.x, y: size.h / 2 - k * root.y });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  // A ideia selecionada (ex.: recém-criada) sempre fica à vista.
  useEffect(() => {
    const v = viewRef.current;
    const n = layout.nodes.find((x) => x.id === selected);
    if (!v || !n || !size) return;
    const sx = v.x + v.k * n.x;
    const sy = v.y + v.k * n.y;
    const mx = Math.min(70, size.w / 4);
    if (sx < mx || sx > size.w - mx || sy < 36 || sy > size.h - 36) setView({ ...v, x: v.x + (size.w / 2 - sx), y: v.y + (size.h / 2 - sy) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, layout]);

  const zoomAt = (factor: number, px: number, py: number) =>
    setView((v) => {
      if (!v) return v;
      const k = clampK(v.k * factor);
      return { k, x: px - ((px - v.x) * k) / v.k, y: py - ((py - v.y) * k) / v.k };
    });

  // Rodinha do mouse (precisa de um ouvinte "não passivo" para não rolar a página junto).
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0016), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const local = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function down(e: React.PointerEvent) {
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    const t = e.target as Element;
    const v = viewRef.current;
    if (!v) return;
    if (pointers.current.size === 1) {
      gesture.current = { moved: false, target: { node: t.closest('[data-node]')?.getAttribute('data-node') ?? undefined, toggle: t.closest('[data-toggle]')?.getAttribute('data-toggle') ?? undefined }, dist: 0, k: v.k, x: v.x, y: v.y, mx: p.x, my: p.y };
    } else if (pointers.current.size === 2 && gesture.current) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = { ...gesture.current, moved: true, dist: Math.hypot(a.x - b.x, a.y - b.y), k: v.k, x: v.x, y: v.y, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
    }
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }
  function move(e: React.PointerEvent) {
    const g = gesture.current;
    if (!g || !pointers.current.has(e.pointerId)) return;
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    if (pointers.current.size >= 2 && g.dist > 0) {
      const [a, b] = [...pointers.current.values()];
      const k = clampK((g.k * Math.hypot(a.x - b.x, a.y - b.y)) / g.dist);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      // Aproxima em volta do ponto entre os dedos e acompanha o movimento deles.
      setView({ k, x: mx - ((g.mx - g.x) * k) / g.k, y: my - ((g.my - g.y) * k) / g.k });
      return;
    }
    const dx = p.x - g.mx;
    const dy = p.y - g.my;
    if (!g.moved && Math.hypot(dx, dy) < 6) return;
    g.moved = true;
    setView({ k: g.k, x: g.x + dx, y: g.y + dy });
  }
  function up(e: React.PointerEvent) {
    const g = gesture.current;
    pointers.current.delete(e.pointerId);
    if (!g) return;
    if (pointers.current.size === 0) {
      gesture.current = null;
      if (!g.moved) {
        if (g.target.toggle) onToggle(g.target.toggle);
        else if (g.target.node) onPick(g.target.node);
      }
    } else {
      // Sobrou um dedo depois da pinça: continua arrastando a partir daqui.
      const v = viewRef.current!;
      const [a] = [...pointers.current.values()];
      gesture.current = { ...g, moved: true, dist: 0, k: v.k, x: v.x, y: v.y, mx: a.x, my: a.y };
    }
  }

  return (
    <div className="mm-canvas" ref={box} tabIndex={0} onKeyDown={onKey} aria-label="Mapa mental. Enter cria uma ideia ao lado, Tab cria dentro, Delete exclui.">
      <svg width="100%" height="100%" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} role="img" aria-label="Desenho do mapa">
        {view && (
          <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
            <MapShapes layout={layout} selected={selected} interactive />
          </g>
        )}
      </svg>
      <div className="mm-zoom">
        <button type="button" onClick={() => size && zoomAt(1 / 1.3, size.w / 2, size.h / 2)} aria-label="Afastar">
          −
        </button>
        <button type="button" onClick={() => size && zoomAt(1.3, size.w / 2, size.h / 2)} aria-label="Aproximar">
          +
        </button>
        <button type="button" className="wide" onClick={() => size && setView(fitView(size))}>
          Ajustar
        </button>
      </div>
    </div>
  );
}

// ---------- Telas ----------

export function MapasPage() {
  const { study, lib, set } = useStudy();
  const suggestions = useMemo(() => SUGGESTED_MAPS.map((s) => ({ s, root: fromBranches(s.center, s.branches.map(([label, leaves]) => ({ label, leaves }))) })), []);
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
      <PageHeader title="Mapas mentais" subtitle="Veja como as ideias se ligam: uma ideia no centro, ramos em volta e sub-ramos dentro de cada um." />
      {study.maps.length > 0 ? (
        <div className="st-map-grid">
          {study.maps.map((m) => {
            const nb = m.notebookId ? study.notebooks.find((n) => n.id === m.notebookId) : undefined;
            return (
              <a key={m.id} className="st-map-card" href={`#/estudos/mapa/${m.id}`}>
                <MapThumb root={m.root} name={m.name} />
                <span className="st-map-card-text">
                  <strong>{m.name}</strong>
                  <small className="muted">{nb ? nb.name : plural(countNodes(m.root) - 1, 'ideia', 'ideias')}</small>
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
        {suggestions.map(({ s, root }) => (
          <button key={s.id} type="button" className="st-map-card" onClick={() => use(s.id)}>
            <MapThumb root={root} name={s.name} />
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
  const m = study.maps.find((x) => x.id === id);
  const [sel, setSel] = useState(m?.root.id ?? '');
  const [settings, setSettings] = useState(false);
  const [moving, setMoving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  // Depois de criar uma ideia, o cursor vai para o texto dela, já selecionado para digitar por cima.
  const [focusTick, setFocusTick] = useState(0);
  useEffect(() => {
    if (!focusTick) return;
    input.current?.focus({ preventScroll: true });
    input.current?.select();
  }, [focusTick]);
  useEffect(() => setConfirm(false), [sel]);
  const layout = useMemo(() => (m ? layoutMap(m.root) : null), [m?.root]);
  if (!m || !layout) return <Missing what="Mapa" />;

  const node = findNode(m.root, sel) ?? m.root;
  const isRoot = node.id === m.root.id;
  const parent = parentOf(m.root, node.id);
  const sibs = parent?.children ?? [];
  const at = sibs.findIndex((c) => c.id === node.id);
  const laid = layout.nodes.find((n) => n.id === node.id);
  const nb = m.notebookId ? study.notebooks.find((n) => n.id === m.notebookId) : undefined;
  const page = nb && m.pageId ? nb.pages.find((p) => p.id === m.pageId) : undefined;

  // Salva na hora: cada mudança já fica guardada.
  const apply = (root: MapNode) => {
    if (root !== m.root) set((s) => ({ ...s, maps: s.maps.map((x) => (x.id === m.id ? { ...x, root, updatedAt: nowISO() } : x)) }));
  };
  function add(kind: 'child' | 'sibling') {
    const r = kind === 'child' || isRoot ? addChild(m!.root, node.id) : addSibling(m!.root, node.id);
    if (!r.id) return notify('Este ramo já está bem fundo', 'Crie a ideia ao lado ou num ramo mais perto do centro.');
    apply(r.root);
    setSel(r.id);
    setFocusTick((t) => t + 1);
  }
  function del() {
    if (isRoot) return;
    if (node.children.length && !confirm) return setConfirm(true);
    const next = sibs[at + 1] ?? sibs[at - 1] ?? parent!;
    apply(removeNode(m!.root, node.id));
    setSel(next.id);
  }
  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Tab') {
      e.preventDefault();
      add('child');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      add('sibling');
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && e.target === e.currentTarget) {
      e.preventDefault();
      del();
    }
  }

  return (
    <>
      <Path items={[{ label: 'Mapas mentais', to: 'estudos/mapas' }, { label: m.name }]} />
      <PageHeader
        title={m.name}
        subtitle={
          nb ? (
            <>
              Do notebook{' '}
              <a className="link" href={`#/estudos/notebook/${nb.id}${page ? `/${page.id}` : ''}`}>
                {page ? `${nb.name} › ${page.name}` : nb.name}
              </a>
            </>
          ) : undefined
        }
      />
      <MapCanvas layout={layout} selected={node.id} onPick={setSel} onToggle={(nid) => apply(updateNode(m.root, nid, { collapsed: !findNode(m.root, nid)?.collapsed }))} onKey={onKey} />

      <section className="card mm-panel">
        <label className="field">
          <span className="field-label">{isRoot ? 'Ideia central' : `Ideia selecionada${parent ? ` (dentro de ${parent.text || 'ideia'})` : ''}`}</span>
          <input ref={input} className="input" value={node.text} onChange={(e) => apply(updateNode(m.root, node.id, { text: e.target.value }))} onKeyDown={onKey} placeholder="Escreva a ideia" enterKeyHint="next" />
        </label>
        <div className="mm-actions">
          <button type="button" className="btn primary small" onClick={() => add('child')}>
            <Icon name="plus" size={16} /> {isRoot ? 'Ramo' : 'Dentro'}
          </button>
          {!isRoot && (
            <button type="button" className="btn soft small" onClick={() => add('sibling')}>
              <Icon name="plus" size={16} /> Ao lado
            </button>
          )}
          {!isRoot && node.children.length > 0 && (
            <button type="button" className="btn soft small" onClick={() => apply(updateNode(m.root, node.id, { collapsed: !node.collapsed }))}>
              {node.collapsed ? `Expandir (${laid?.hidden ?? 0})` : 'Recolher'}
            </button>
          )}
        </div>
        {!isRoot && (
          <>
            <div className="mm-actions">
              <button type="button" className="btn soft small" disabled={at <= 0} onClick={() => apply(moveSibling(m.root, node.id, -1))}>
                <Icon name="up" size={16} /> Subir
              </button>
              <button type="button" className="btn soft small" disabled={at >= sibs.length - 1} onClick={() => apply(moveSibling(m.root, node.id, 1))}>
                <Icon name="down" size={16} /> Descer
              </button>
              <button type="button" className="btn soft small" onClick={() => setMoving(true)}>
                Mudar de ramo
              </button>
              <button type="button" className="btn danger small" onClick={del}>
                {confirm ? `Excluir com ${plural(countNodes(node) - 1, 'ideia', 'ideias')} dentro` : 'Excluir'}
              </button>
            </div>
            <div className="mm-colors" role="group" aria-label="Cor da ideia">
              <button type="button" className={`mm-swatch auto${node.color ? '' : ' on'}`} onClick={() => apply(updateNode(m.root, node.id, { color: null }))} aria-label="Cor do ramo" title="Cor do ramo">
                A
              </button>
              {MAP_COLORS.map((c) => (
                <button key={c} type="button" className={`mm-swatch${node.color === c ? ' on' : ''}`} style={{ background: c }} onClick={() => apply(updateNode(m.root, node.id, { color: c }))} aria-label={`Cor ${c}`} />
              ))}
            </div>
          </>
        )}
        <p className="muted small mm-tip">
          Toque numa ideia para escolher. Arraste para mover o mapa e use dois dedos (ou a rodinha do mouse) para aproximar. No teclado: Enter cria ao lado, Tab cria dentro.
        </p>
      </section>

      <button type="button" className="btn ghost" onClick={() => setSettings(true)}>
        <Icon name="edit" size={16} /> Nome, notebook ou excluir o mapa
      </button>

      {moving && (
        <MoveSheet
          root={m.root}
          node={node}
          onClose={() => setMoving(false)}
          onMove={(pid) => {
            apply(reparent(m.root, node.id, pid));
            notify('Ideia mudou de ramo');
          }}
        />
      )}
      {settings && <MapSettings map={m} onClose={() => setSettings(false)} />}
    </>
  );
}

/** Levar a ideia (com tudo o que tem dentro) para outro ramo. */
function MoveSheet({ root, node, onClose, onMove }: { root: MapNode; node: MapNode; onClose: () => void; onMove: (parentId: string) => void }) {
  const targets = validParents(root, node.id);
  return (
    <Sheet title="Mudar de ramo" onClose={onClose}>
      <p className="muted small" style={{ marginTop: 0 }}>
        Para onde vai "{node.text || 'ideia'}"{node.children.length ? `, com ${plural(countNodes(node) - 1, 'ideia', 'ideias')} dentro` : ''}?
      </p>
      {targets.length ? (
        <ul className="list">
          {targets.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className="row"
                style={{ paddingLeft: t.depth * 16 }}
                onClick={() => {
                  onMove(t.id);
                  onClose();
                }}
              >
                <span className="row-body">
                  <span className="row-title">{t.text || (t.depth ? 'Ideia' : 'Ideia central')}</span>
                  {t.depth === 0 && <span className="row-meta">Vira um ramo principal</span>}
                </span>
                <Icon name="right" size={18} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">Não há outro lugar para esta ideia.</p>
      )}
    </Sheet>
  );
}

function MapSettings({ map, onClose }: { map: StudyMap; onClose: () => void }) {
  const { study, set } = useStudy();
  const [name, setName] = useState(map.name);
  const [nb, setNb] = useState(map.notebookId ?? '');
  const [page, setPage] = useState(map.pageId ?? '');
  const [confirm, setConfirm] = useState(false);
  const pages = study.notebooks.find((n) => n.id === nb)?.pages ?? [];
  function save() {
    if (!name.trim()) return notify('Dê um nome ao mapa');
    set((s) => ({ ...s, maps: s.maps.map((x) => (x.id === map.id ? { ...x, name: name.trim(), notebookId: nb || null, pageId: nb && pages.some((p) => p.id === page) ? page : null, updatedAt: nowISO() } : x)) }));
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
              set((s) => ({ ...s, maps: s.maps.filter((x) => x.id !== map.id) }));
              notify('Mapa excluído');
              go('estudos/mapas');
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
        {study.notebooks.length > 0 && (
          <Field label="Notebook (opcional)">
            <select
              className="input"
              value={nb}
              onChange={(e) => {
                setNb(e.target.value);
                setPage('');
              }}
            >
              <option value="">Nenhum</option>
              {study.notebooks.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {nb && pages.length > 0 && (
          <Field label="Página (opcional)" hint="O mapa aparece dentro desta página.">
            <select className="input" value={page} onChange={(e) => setPage(e.target.value)}>
              <option value="">O notebook inteiro</option>
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.parentId ? '— ' : ''}
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>
    </Sheet>
  );
}
