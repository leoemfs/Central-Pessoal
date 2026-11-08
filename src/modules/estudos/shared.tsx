import { useState, type ReactNode } from 'react';
import { useStore } from '../../store';
import { go } from '../../router';
import type { SourceKind, StudyData, StudyMap, StudyNotebook, StudySource, StudyStatus } from '../../types';
import { library, newNotebook, SOURCE_KINDS, sourceKind, STATUS_LABEL, touch, trackPath, type Library, type TrackView } from '../../estudos';
import { Field, Icon, MultiChips, notify, Pill, Sheet, type IconName } from '../../ui';
import { uid } from '../../utils';

/** Dados de Estudos + biblioteca montada + atalho para alterar só a parte de estudos. */
export function useStudy() {
  const { data, update } = useStore();
  const study = data.study;
  const lib = library(study);
  const set = (fn: (s: StudyData) => StudyData) => update((d) => ({ ...d, study: fn(d.study) }));
  return { study, lib, set };
}

export const nowISO = () => new Date().toISOString();

/** Caminho de navegação ("Biblioteca › Idiomas › Inglês"): cada parte leva até ela; a última é onde você está. */
export function Path({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav className="st-path" aria-label="Caminho">
      {items.map((it, i) => (
        <span key={i} className="st-path-item">
          {i > 0 && <span className="st-path-sep">›</span>}
          {it.to ? <a href={`#/${it.to}`}>{it.label}</a> : <b aria-current="page">{it.label}</b>}
        </span>
      ))}
    </nav>
  );
}

/** Caminho completo até uma trilha. */
export function trackCrumbs(lib: Library, tr: TrackView): { label: string; to?: string }[] {
  const area = lib.area(tr.areaId);
  const theme = lib.theme(tr.themeId);
  const out: { label: string; to?: string }[] = [{ label: 'Biblioteca', to: 'estudos/biblioteca' }];
  if (area) out.push({ label: area.name, to: `estudos/area/${area.id}` });
  if (theme) out.push({ label: theme.name, to: `estudos/tema/${theme.id}` });
  if (tr.levelId) {
    const l = lib.level(tr.themeId, tr.levelId);
    if (l) out.push({ label: l.name, to: `estudos/nivel/${tr.themeId}/${l.id}` });
  }
  return out;
}

export const STATUS_TONE: Record<StudyStatus, 'gray' | 'orange' | 'green'> = { afazer: 'gray', andando: 'orange', feito: 'green' };
export function StatusPill({ status, children }: { status: StudyStatus; children?: ReactNode }) {
  return (
    <Pill tone={STATUS_TONE[status]}>
      {status === 'feito' && <Icon name="check" size={12} />}
      {children ?? STATUS_LABEL[status]}
    </Pill>
  );
}

/** Barra de progresso de duas cores: concluído (verde) + estudando (laranja). */
export function DualProgress({ done, doing, total }: { done: number; doing: number; total: number }) {
  const p = (n: number) => (total ? (n / total) * 100 : 0);
  return (
    <div className="st-progress" role="img" aria-label={`${done} de ${total} concluídos`}>
      <i className="d" style={{ width: `${p(done)}%` }} />
      <i className="g" style={{ width: `${p(doing)}%` }} />
    </div>
  );
}

export const areaIcon = (icon: string) => icon as IconName;

/** Link externo de uma fonte (ou só o texto, se não tiver endereço). */
export function SourceCard({ s, onEdit, extra }: { s: { title: string; url: string; kind: SourceKind }; onEdit?: () => void; extra?: ReactNode }) {
  const k = sourceKind(s.kind);
  const inner = (
    <>
      <span className="st-res-icon">
        <Icon name={k.icon as IconName} size={18} />
      </span>
      <span className="st-res-text">
        <b>{s.title}</b>
        <small>
          {k.label}
          {s.url ? ` · ${s.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}` : ''}
        </small>
      </span>
    </>
  );
  return (
    <div className="st-res">
      {s.url ? (
        <a className="st-res-main" href={s.url} target="_blank" rel="noopener noreferrer">
          {inner}
          <span className="st-res-go">
            <Icon name="ext" size={16} />
          </span>
        </a>
      ) : (
        <div className="st-res-main">{inner}</div>
      )}
      {extra}
      {onEdit && (
        <button type="button" className="icon-btn st-res-edit" onClick={onEdit} aria-label={`Editar ${s.title}`}>
          <Icon name="edit" size={16} />
        </button>
      )}
    </div>
  );
}

// ---------- Mapa mental (desenho) ----------

/** Desenho radial: ideia central, ramos em volta e folhas mais para fora. */
export function MapDrawing({ map, small }: { map: { name: string; center: string; branches: { label: string; leaves: string[] }[] }; small?: boolean }) {
  const W = 400;
  const H = 340;
  const cx = W / 2;
  const cy = H / 2;
  const n = Math.max(1, map.branches.length);
  const lines: ReactNode[] = [];
  const nodes: ReactNode[] = [];
  const cut = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);
  map.branches.forEach((b, i) => {
    const ang = -Math.PI / 2 + (i / n) * Math.PI * 2;
    const x = cx + Math.cos(ang) * 92;
    const y = cy + Math.sin(ang) * 74;
    const leaves = b.leaves.slice(0, 4);
    const spread = Math.min(0.5, (Math.PI * 2) / n / 2.4);
    leaves.forEach((leaf, j) => {
      const a2 = ang + (leaves.length === 1 ? 0 : (j / (leaves.length - 1) - 0.5) * spread * 2);
      const fx = cx + Math.cos(a2) * 168;
      const fy = cy + Math.sin(a2) * 140;
      lines.push(<line key={`l${i}-${j}`} x1={x} y1={y} x2={fx} y2={fy} className="st-map-leafline" />);
      nodes.push(
        <text key={`t${i}-${j}`} x={fx} y={fy + 4} textAnchor="middle" className="st-map-leaf">
          {cut(leaf, 14)}
        </text>,
      );
    });
    lines.push(<line key={`b${i}`} x1={cx} y1={cy} x2={x} y2={y} className="st-map-branchline" />);
    const label = cut(b.label, 14);
    const w = label.length * 7 + 22;
    nodes.push(
      <g key={`n${i}`}>
        <rect x={x - w / 2} y={y - 14} width={w} height={28} rx={14} className="st-map-node" />
        <text x={x} y={y + 4} textAnchor="middle" className="st-map-nodetext">
          {label}
        </text>
      </g>,
    );
  });
  const center = cut(map.center || map.name, 16);
  const cw = center.length * 8 + 34;
  return (
    <svg className={`st-map${small ? ' small' : ''}`} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Mapa mental: ${map.name}`}>
      {lines}
      {nodes}
      <rect x={cx - cw / 2} y={cy - 18} width={cw} height={36} rx={18} className="st-map-center" />
      <text x={cx} y={cy + 5} textAnchor="middle" className="st-map-centertext">
        {center}
      </text>
    </svg>
  );
}

// ---------- Formulários ----------

/** Escolher uma trilha (opcional), agrupada por área. */
export function TrackSelect({ lib, value, onChange, archived }: { lib: Library; value: string; onChange: (v: string) => void; archived: string[] }) {
  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Nenhuma: começar do zero</option>
      {lib.areas
        .filter((a) => !archived.includes(a.id))
        .map((a) => {
          const trs = lib.tracks.filter((t) => t.areaId === a.id);
          if (!trs.length) return null;
          return (
            <optgroup key={a.id} label={a.name}>
              {trs.map((t) => (
                <option key={t.id} value={t.id}>
                  {[...trackPath(lib, t).slice(1), t.name].join(' › ')}
                </option>
              ))}
            </optgroup>
          );
        })}
    </select>
  );
}

export function NotebookSheet({ onClose, notebook, trackId }: { onClose: () => void; notebook?: StudyNotebook; trackId?: string }) {
  const { study, lib, set } = useStudy();
  const [name, setName] = useState(notebook?.name ?? (trackId ? (lib.track(trackId)?.name ?? '') : ''));
  const [track, setTrack] = useState(notebook?.trackId ?? trackId ?? '');
  const [confirm, setConfirm] = useState(false);
  function save() {
    if (!name.trim()) return notify('Dê um nome ao notebook');
    const now = nowISO();
    if (notebook) {
      set((s) => ({ ...s, notebooks: s.notebooks.map((n) => (n.id === notebook.id ? touch({ ...n, name: name.trim(), trackId: track || null }, 'Notebook renomeado', now) : n)) }));
      onClose();
      return;
    }
    const nb = newNotebook(name, track ? (lib.track(track) ?? null) : null, null, now);
    set((s) => ({ ...s, notebooks: [nb, ...s.notebooks] }));
    onClose();
    notify('Notebook criado', track ? 'Cada tópico da trilha virou um assunto.' : undefined);
    go(`estudos/notebook/${nb.id}`);
  }
  function del() {
    if (!notebook) return;
    if (!confirm) return setConfirm(true);
    set((s) => ({
      ...s,
      notebooks: s.notebooks.filter((n) => n.id !== notebook.id),
      cycles: s.cycles.map((c) => (c.notebookId === notebook.id ? { ...c, notebookId: null } : c)),
      sources: s.sources.map((x) => ({ ...x, notebookIds: x.notebookIds.filter((i) => i !== notebook.id) })),
      maps: s.maps.map((m) => (m.notebookId === notebook.id ? { ...m, notebookId: null } : m)),
    }));
    onClose();
    notify('Notebook excluído', 'Fontes, mapas e ciclos continuam guardados.');
    go('estudos/notebooks');
  }
  return (
    <Sheet
      title={notebook ? 'Editar notebook' : 'Novo notebook'}
      onClose={onClose}
      footer={
        <div className="btn-row">
          {notebook && (
            <button type="button" className="btn danger" onClick={del}>
              {confirm ? 'Confirmar exclusão' : 'Excluir'}
            </button>
          )}
          <button type="button" className="btn primary" onClick={save}>
            {notebook ? 'Salvar' : 'Criar'}
          </button>
        </div>
      }
    >
      <div className="form">
        <Field label="Nome">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Inglês A1, Estudos de IA…" autoFocus={!notebook} />
        </Field>
        <Field label="Trilha de referência (opcional)" hint={notebook ? 'Só muda a referência; os assuntos continuam os mesmos.' : 'Com uma trilha, cada tópico vira um assunto do notebook. Sem trilha, você organiza do seu jeito.'}>
          <TrackSelect lib={lib} value={track} onChange={setTrack} archived={study.archived} />
        </Field>
      </div>
    </Sheet>
  );
}

export function SourceSheet({ onClose, source, preset, notebookId }: { onClose: () => void; source?: StudySource; preset?: { title: string; url: string; kind: SourceKind }; notebookId?: string }) {
  const { study, set } = useStudy();
  const [title, setTitle] = useState(source?.title ?? preset?.title ?? '');
  const [url, setUrl] = useState(source?.url ?? preset?.url ?? '');
  const [kind, setKind] = useState<SourceKind>(source?.kind ?? preset?.kind ?? 'site');
  const [note, setNote] = useState(source?.note ?? '');
  const [nbs, setNbs] = useState<string[]>(source?.notebookIds ?? (notebookId ? [notebookId] : []));
  const [confirm, setConfirm] = useState(false);
  function save() {
    if (!title.trim()) return notify('Dê um título à fonte');
    let link = url.trim();
    if (link && !/^https?:\/\//i.test(link) && /\.[a-z]{2,}/i.test(link)) link = `https://${link}`;
    const item: StudySource = { id: source?.id ?? uid(), title: title.trim(), url: link, kind, note: note.trim(), notebookIds: nbs, createdAt: source?.createdAt ?? nowISO() };
    set((s) => ({ ...s, sources: source ? s.sources.map((x) => (x.id === item.id ? item : x)) : [item, ...s.sources] }));
    onClose();
    if (!source) notify('Fonte guardada', nbs.length ? 'Ligada ao notebook.' : 'Está em Estudos › Fontes.');
  }
  function del() {
    if (!source) return;
    if (!confirm) return setConfirm(true);
    set((s) => ({
      ...s,
      sources: s.sources.filter((x) => x.id !== source.id),
      notebooks: s.notebooks.map((n) => ({ ...n, subjects: n.subjects.map((su) => ({ ...su, blocks: su.blocks.map((b) => ({ ...b, sourceIds: b.sourceIds.filter((i) => i !== source.id) })) })) })),
    }));
    onClose();
    notify('Fonte excluída');
  }
  return (
    <Sheet
      title={source ? 'Editar fonte' : 'Nova fonte'}
      onClose={onClose}
      footer={
        <div className="btn-row">
          {source && (
            <button type="button" className="btn danger" onClick={del}>
              {confirm ? 'Confirmar exclusão' : 'Excluir'}
            </button>
          )}
          <button type="button" className="btn primary" onClick={save}>
            {source ? 'Salvar' : 'Guardar'}
          </button>
        </div>
      }
    >
      <div className="form">
        <Field label="Título">
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Canal de pronúncia, Livro de SQL…" autoFocus={!source && !preset} />
        </Field>
        <Field label="Endereço (opcional)" hint="Link do site, vídeo ou documento. Livro físico pode ficar sem.">
          <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" inputMode="url" />
        </Field>
        <div className="field">
          <span className="field-label">Tipo</span>
          <div className="chips" role="radiogroup" aria-label="Tipo da fonte">
            {SOURCE_KINDS.map((k) => (
              <button key={k.value} type="button" role="radio" aria-checked={kind === k.value} className={`chip-btn${kind === k.value ? ' on' : ''}`} onClick={() => setKind(k.value)}>
                {k.label}
              </button>
            ))}
          </div>
        </div>
        <Field label="Observação (opcional)">
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: capítulos 1 a 3, minuto 12…" />
        </Field>
        {study.notebooks.length > 0 && (
          <div className="field">
            <span className="field-label">Usar nos notebooks</span>
            <MultiChips options={study.notebooks.map((n) => [n.id, n.name])} value={nbs} onToggle={(id) => setNbs((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]))} label="Notebooks" />
          </div>
        )}
      </div>
    </Sheet>
  );
}

export function NewMapSheet({ onClose, notebookId }: { onClose: () => void; notebookId?: string }) {
  const { set } = useStudy();
  const [name, setName] = useState('');
  function save() {
    if (!name.trim()) return notify('Dê um nome ao mapa');
    const now = nowISO();
    const m: StudyMap = {
      id: uid(),
      name: name.trim(),
      center: name.trim(),
      branches: ['Ideia 1', 'Ideia 2', 'Ideia 3'].map((label) => ({ id: uid(), label, leaves: [] })),
      notebookId: notebookId ?? null,
      createdAt: now,
      updatedAt: now,
    };
    set((s) => ({ ...s, maps: [m, ...s.maps] }));
    onClose();
    go(`estudos/mapa/${m.id}`);
  }
  return (
    <Sheet
      title="Novo mapa mental"
      onClose={onClose}
      footer={
        <button type="button" className="btn primary block" onClick={save}>
          Criar e editar
        </button>
      }
    >
      <Field label="Ideia central" hint="Depois você troca os ramos e escreve as ideias de cada um.">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Front-end, Verbos irregulares…" autoFocus />
      </Field>
    </Sheet>
  );
}

/** Áreas e temas: as "categorias" da Biblioteca. A pessoa cria as suas; o catálogo do app continua igual. */
export function AreasSheet({ onClose, areaId }: { onClose: () => void; areaId?: string }) {
  const { study, lib, set } = useStudy();
  const [mode, setMode] = useState<'tema' | 'area'>(areaId ? 'tema' : 'area');
  const [name, setName] = useState('');
  const [area, setArea] = useState(areaId ?? lib.areas.find((a) => !study.archived.includes(a.id))?.id ?? '');
  function save() {
    if (!name.trim()) return notify(mode === 'area' ? 'Dê um nome à área' : 'Dê um nome ao tema');
    if (mode === 'area') {
      const a = { id: uid(), name: name.trim(), desc: 'Área criada por você.' };
      const t = { id: uid(), areaId: a.id, name: 'Geral' };
      set((s) => ({ ...s, areas: [...s.areas, a], themes: [...s.themes, t] }));
      onClose();
      notify('Área criada', 'Já tem um tema "Geral". Crie trilhas suas dentro dele.');
      go(`estudos/area/${a.id}`);
    } else {
      const t = { id: uid(), areaId: area, name: name.trim() };
      set((s) => ({ ...s, themes: [...s.themes, t] }));
      onClose();
      notify('Tema criado');
      go(`estudos/tema/${t.id}`);
    }
  }
  return (
    <Sheet
      title="Áreas e temas"
      onClose={onClose}
      footer={
        <button type="button" className="btn primary block" onClick={save}>
          {mode === 'area' ? 'Criar área' : 'Criar tema'}
        </button>
      }
    >
      <div className="form">
        <p className="muted small" style={{ margin: 0 }}>
          Suas áreas e temas ficam junto com os do app, sem mudar o catálogo. Para tirar uma área da vista, use o arquivo na Biblioteca.
        </p>
        <div className="segmented" role="tablist" aria-label="O que criar">
          {(['area', 'tema'] as const).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} className={mode === m ? 'on' : ''} onClick={() => setMode(m)}>
              {m === 'area' ? 'Nova área' : 'Novo tema'}
            </button>
          ))}
        </div>
        {mode === 'tema' && (
          <Field label="Na área">
            <select className="input" value={area} onChange={(e) => setArea(e.target.value)}>
              {lib.areas
                .filter((a) => !study.archived.includes(a.id))
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </Field>
        )}
        <Field label={mode === 'area' ? 'Nome da área' : 'Nome do tema'}>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={mode === 'area' ? 'Ex.: Música, Finanças, Culinária' : 'Ex.: Francês, Excel, Oratória'} />
        </Field>
      </div>
    </Sheet>
  );
}

/** Trilha criada pela pessoa (tópicos um por linha). Também serve para editar uma trilha sua. */
export function TrackSheet({ onClose, themeId, trackId }: { onClose: () => void; themeId?: string; trackId?: string }) {
  const { study, lib, set } = useStudy();
  const mine = trackId ? study.tracks.find((t) => t.id === trackId) : undefined;
  const themes = lib.areas.filter((a) => !study.archived.includes(a.id)).flatMap((a) => a.themes.map((t) => ({ id: t.id, label: `${a.name} › ${t.name}` })));
  const [theme, setTheme] = useState(mine?.themeId ?? themeId ?? themes[0]?.id ?? '');
  const [name, setName] = useState(mine?.name ?? '');
  const [desc, setDesc] = useState(mine?.desc ?? '');
  const [topics, setTopics] = useState(mine ? mine.topics.map((t) => t.name).join('\n') : '');
  const [confirm, setConfirm] = useState(false);
  const used = mine ? study.cycles.some((c) => c.trackId === mine.id) : false;
  function save() {
    const lines = topics.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!name.trim()) return notify('Dê um nome à trilha');
    if (!lines.length) return notify('Escreva pelo menos um tópico', 'Um por linha.');
    // Tópicos que já existiam mantêm o id (os ciclos continuam valendo).
    const old = new Map((mine?.topics ?? []).map((t) => [t.name, t.id]));
    const t = { id: mine?.id ?? uid(), themeId: theme, name: name.trim(), desc: desc.trim(), topics: lines.map((l) => ({ id: old.get(l) ?? uid(), name: l })) };
    set((s) => ({ ...s, tracks: mine ? s.tracks.map((x) => (x.id === t.id ? t : x)) : [...s.tracks, t] }));
    onClose();
    if (!mine) {
      notify('Trilha criada');
      go(`estudos/trilha/${t.id}`);
    }
  }
  function del() {
    if (!mine) return;
    if (used) return notify('Esta trilha tem ciclos', 'Exclua os ciclos dela antes, em Ciclos.');
    if (!confirm) return setConfirm(true);
    set((s) => ({ ...s, tracks: s.tracks.filter((x) => x.id !== mine.id), notebooks: s.notebooks.map((n) => (n.trackId === mine.id ? { ...n, trackId: null } : n)) }));
    onClose();
    notify('Trilha excluída');
    go(`estudos/tema/${mine.themeId}`);
  }
  return (
    <Sheet
      title={mine ? 'Editar trilha' : 'Nova trilha sua'}
      onClose={onClose}
      footer={
        <div className="btn-row">
          {mine && (
            <button type="button" className="btn danger" onClick={del}>
              {confirm ? 'Confirmar exclusão' : 'Excluir'}
            </button>
          )}
          <button type="button" className="btn primary" onClick={save}>
            {mine ? 'Salvar' : 'Criar trilha'}
          </button>
        </div>
      }
    >
      <div className="form">
        <Field label="Tema">
          <select className="input" value={theme} onChange={(e) => setTheme(e.target.value)}>
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nome da trilha">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Preparação para a certificação" />
        </Field>
        <Field label="Para que serve (opcional)">
          <input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Uma frase sobre a trilha" />
        </Field>
        <Field label="Tópicos" hint="Um por linha, na ordem que fizer sentido. Depois você escolhe quais estudar em cada ciclo.">
          <textarea className="input" rows={7} value={topics} onChange={(e) => setTopics(e.target.value)} placeholder={'Tópico 1\nTópico 2\nTópico 3'} />
        </Field>
      </div>
    </Sheet>
  );
}

// ---------- Botão + ----------

export type CreateAction = 'ciclo' | 'notebook' | 'fonte' | 'mapa' | 'trilha' | 'areas';
const CREATE: { id: CreateAction; label: string; hint: string; icon: IconName }[] = [
  { id: 'ciclo', label: 'Novo ciclo', hint: 'Escolha tópicos de uma trilha', icon: 'repeat' },
  { id: 'notebook', label: 'Novo notebook', hint: 'Caderno de anotações e materiais', icon: 'notebook' },
  { id: 'fonte', label: 'Nova fonte', hint: 'Site, vídeo, livro, PDF…', icon: 'link' },
  { id: 'mapa', label: 'Novo mapa mental', hint: 'Ideias ligadas em volta de um tema', icon: 'mindmap' },
  { id: 'trilha', label: 'Nova trilha sua', hint: 'Seu próprio roteiro de tópicos', icon: 'route' },
];

/** Menu do + em Estudos. `extra` = ações da tela aberta (ex.: novo assunto no notebook). Por último, separado: áreas e temas. */
export function CreateMenu({ onClose, onPick, extra }: { onClose: () => void; onPick: (a: CreateAction) => void; extra?: { label: string; hint: string; icon: IconName; run: () => void }[] }) {
  const tile = (key: string, label: string, hint: string, icon: IconName, run: () => void) => (
    <button
      key={key}
      type="button"
      className="tile"
      onClick={() => {
        onClose();
        run();
      }}
    >
      <span className="tile-icon">
        <Icon name={icon} />
      </span>
      <span className="tile-text">
        <strong>{label}</strong>
        <span className="muted">{hint}</span>
      </span>
      <Icon name="right" size={18} />
    </button>
  );
  return (
    <Sheet title="Criar em Estudos" onClose={onClose}>
      <div className="quick-list">
        {extra?.map((e) => tile(e.label, e.label, e.hint, e.icon, e.run))}
        {CREATE.map((c) => tile(c.id, c.label, c.hint, c.icon, () => onPick(c.id)))}
        <hr className="st-sep" />
        {tile('areas', 'Áreas e temas', 'As categorias da sua biblioteca', 'tag', () => onPick('areas'))}
      </div>
    </Sheet>
  );
}

/** Abre a ficha certa para cada item do +. */
export function useCreate() {
  const [open, setOpen] = useState<CreateAction | null>(null);
  const pick = (a: CreateAction) => {
    if (a === 'ciclo') {
      notify('Escolha uma trilha', 'Marque os tópicos e toque em "Montar ciclo".');
      go('estudos/biblioteca');
    } else setOpen(a);
  };
  const sheet =
    open === 'notebook' ? (
      <NotebookSheet onClose={() => setOpen(null)} />
    ) : open === 'fonte' ? (
      <SourceSheet onClose={() => setOpen(null)} />
    ) : open === 'mapa' ? (
      <NewMapSheet onClose={() => setOpen(null)} />
    ) : open === 'trilha' ? (
      <TrackSheet onClose={() => setOpen(null)} />
    ) : open === 'areas' ? (
      <AreasSheet onClose={() => setOpen(null)} />
    ) : null;
  return { pick, sheet };
}
