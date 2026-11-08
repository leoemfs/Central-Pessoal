import { useMemo, useState, type ReactNode } from 'react';
import type { ViewProps } from '../App';
import { useStore } from '../store';
import { go, goReplace, useSubAction } from '../router';
import { useReportTab } from '../barTab';
import { remove, upsert } from '../actions';
import {
  addItemFromText, addListCategory, addPrice, AISLES, bestPrice, categoryOf, deleteListCategory, finishShopping, kindOf, latestPrices, launchBought, LIST_COLORS,
  LIST_ICONS, LIST_KINDS, listEstimate, newItem, newList, perUnit, priceCheck, qtyText, removeItem, scaledQty, sendIngredients, sizeText, toggleItem, uncheckAll,
  updateItem, updateList, updateListCategory, variantLabel, itemCost,
} from '../lists';
import type { ListCategory, ListItem, ListKind, Product, ProductVariant, UserList } from '../types';
import { formatDMY, formatMoney } from '../utils';
import { CategoryBadge, Chips, Empty, Field, Icon, notify, PageHeader, Pill, Progress, Segmented, Sheet, Toggle, type IconName } from '../ui';

const money0 = (v: number) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`;
const parseNum = (t: string) => {
  const n = Number(t.replace(/[^\d,.]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
};
const fmtNum = (n: number | null) => (n === null ? '' : n.toLocaleString('pt-BR', { maximumFractionDigits: 2 }));
const DAY_STORE_KEY = 'central-pessoal:mercado-de-hoje';

export function Listas({ route }: ViewProps) {
  const { data } = useStore();
  const [newOpen, setNewOpen] = useState<string | null>(null);
  useSubAction(route, 'listas', { nova: () => setNewOpen('') });
  const list = data.lists.find((l) => l.id === route.sub);
  const tab = route.sub === 'precos' ? 'precos' : 'listas';
  const recipeCat = data.listCategories.find((c) => c.kind === 'receita')?.id ?? null;
  useReportTab('listas', list ? 'lista' : route.sub === 'receitas' ? 'receitas' : tab);
  if (list) return <ListPage list={list} />;
  return (
    <>
      <PageHeader title="Listas" />
      <Segmented label="Seção" sticky swipe value={tab} onChange={(v) => goReplace(v === 'precos' ? 'listas/precos' : 'listas')} options={[{ value: 'listas', label: 'Listas' }, { value: 'precos', label: 'Preços' }]} />
      {tab === 'precos' ? <Prices /> : <ListsHome key={route.sub} initialFilter={route.sub === 'receitas' && recipeCat ? recipeCat : 'todas'} onNew={(c) => setNewOpen(c)} />}
      {newOpen !== null && <NewListSheet categoryId={newOpen} onClose={() => setNewOpen(null)} />}
    </>
  );
}

// ---------- Início das listas ----------

function listMeta(d: ReturnType<typeof useStore>['data'], l: UserList): string {
  const k = kindOf(d, l);
  const done = l.items.filter((i) => i.done).length;
  if (k === 'receita') return [`${l.items.length} ingredientes`, l.minutes ? `${l.minutes} min` : '', `${l.serves} porções`].filter(Boolean).join(' · ');
  if (k === 'compras') {
    const total = l.items.reduce((a, i) => a + (i.price ?? 0), 0);
    const bought = l.items.filter((i) => i.done).reduce((a, i) => a + (i.price ?? 0), 0);
    return `${done} de ${l.items.length} comprados · ${money0(bought)} de ${money0(total)}`;
  }
  return `${done} de ${l.items.length} itens`;
}

export function ListCard({ l }: { l: UserList }) {
  const { data } = useStore();
  const c = categoryOf(data, l);
  const k = kindOf(data, l);
  const done = l.items.filter((i) => i.done).length;
  const est = k === 'mercado' ? listEstimate(data, l)[0] : undefined;
  return (
    <a className="lcard" href={`#/listas/${l.id}`}>
      <CategoryBadge icon={c?.icon ?? 'tasks'} color={c?.color ?? '#94a3b8'} size={38} />
      <span className="lcard-body">
        <strong>
          {l.name} {l.pinned && <Icon name="pin" size={13} />}
        </strong>
        <span className="muted small">{listMeta(data, l)}</span>
        {k !== 'receita' && l.items.length > 0 && <Progress pct={(done / l.items.length) * 100} />}
        {est && <span className="muted small">Mais barato: {data.stores.find((s) => s.id === est.storeId)?.name} · {money0(est.total)}</span>}
      </span>
      <Icon name="right" size={16} />
    </a>
  );
}

function ListsHome({ onNew, initialFilter = 'todas' }: { onNew: (categoryId: string) => void; initialFilter?: string }) {
  const { data } = useStore();
  const [filter, setFilter] = useState(initialFilter);
  const [cats, setCats] = useState(false);
  const count = (id: string) => data.lists.filter((l) => l.categoryId === id).length;
  const shown = filter === 'todas' ? data.listCategories : data.listCategories.filter((c) => c.id === filter);
  const empty = data.listCategories.filter((c) => !count(c.id));
  return (
    <>
      <div className="chips cat-chips" role="group" aria-label="Categorias">
        <button type="button" aria-pressed={filter === 'todas'} className={`chip-btn${filter === 'todas' ? ' on' : ''}`} onClick={() => setFilter('todas')}>
          Todas <b>{data.lists.length}</b>
        </button>
        {data.listCategories.map((c) => (
          <button key={c.id} type="button" aria-pressed={filter === c.id} className={`chip-btn${filter === c.id ? ' on' : ''}`} onClick={() => setFilter(c.id)}>
            <span style={{ color: c.color, display: 'inline-flex' }}>
              <Icon name={c.icon as IconName} size={15} />
            </span>
            {c.name} <b>{count(c.id)}</b>
          </button>
        ))}
      </div>
      {data.lists.length === 0 && filter === 'todas' && (
        <section className="card">
          <Empty>Listas que se usam e reusam: mercado com preços, compras de roupa ou para a casa, receitas e checklists. Cada categoria tem o seu jeito.</Empty>
        </section>
      )}
      {shown.map((c) => {
        const ls = data.lists.filter((l) => l.categoryId === c.id).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt));
        if (!ls.length && filter === 'todas') return null;
        return (
          <section key={c.id} className="card">
            <div className="card-head">
              <h2 className="cat-title">
                <span className="dot" style={{ background: c.color }} />
                {c.name}
              </h2>
              <span className="muted small">{LIST_KINDS[c.kind].label}</span>
            </div>
            {ls.length ? (
              <div className="lcards">
                {ls.map((l) => (
                  <ListCard key={l.id} l={l} />
                ))}
              </div>
            ) : (
              <Empty>Nenhuma lista em {c.name} ainda.</Empty>
            )}
            {filter !== 'todas' && (
              <button type="button" className="btn soft block" style={{ marginTop: 12 }} onClick={() => onNew(c.id)}>
                <Icon name="plus" size={18} /> <span className="green">Nova lista em {c.name}</span>
              </button>
            )}
          </section>
        );
      })}
      {filter === 'todas' && empty.length > 0 && data.lists.length > 0 && <p className="muted small center">Sem listas ainda: {empty.map((c) => c.name).join(', ')}.</p>}
      <div className="btn-row">
        <button type="button" className="btn" onClick={() => onNew(filter === 'todas' ? '' : filter)}>
          <Icon name="plus" size={18} /> Nova lista
        </button>
        <button type="button" className="btn" onClick={() => setCats(true)}>
          <Icon name="tag" size={18} /> Categorias
        </button>
      </div>
      {cats && <CategoriesSheet onClose={() => setCats(false)} />}
    </>
  );
}

function CategoryChips({ value, onChange, kind }: { value: string; onChange: (id: string) => void; kind?: ListKind }) {
  const { data } = useStore();
  const cats = kind ? data.listCategories.filter((c) => c.kind === kind) : data.listCategories;
  return (
    <div className="chips" role="radiogroup" aria-label="Categoria">
      {cats.map((c) => (
        <button key={c.id} type="button" role="radio" aria-checked={value === c.id} className={`chip-btn${value === c.id ? ' on' : ''}`} onClick={() => onChange(c.id)}>
          <Icon name={c.icon as IconName} size={15} /> {c.name}
        </button>
      ))}
    </div>
  );
}

function NewListSheet({ categoryId, onClose }: { categoryId: string; onClose: () => void }) {
  const { data, update } = useStore();
  const [name, setName] = useState('');
  const [cat, setCat] = useState(categoryId || data.listCategories[0]?.id || '');
  const c = data.listCategories.find((x) => x.id === cat);
  function save() {
    if (!name.trim() || !c) return;
    const l = { ...newList(name, cat), serves: 4, baseServes: 4 };
    update(upsert('lists', l));
    onClose();
    go(`listas/${l.id}`);
  }
  return (
    <Sheet
      title="Nova lista"
      onClose={onClose}
      footer={
        <button type="button" className="btn primary block" disabled={!name.trim() || !c} onClick={save}>
          Criar
        </button>
      }
    >
      <Field label="Nome">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} placeholder="Ex.: Churrasco de sábado" autoFocus />
      </Field>
      <div className="field">
        <span className="field-label">Categoria</span>
        <CategoryChips value={cat} onChange={setCat} />
        {c && <span className="field-hint">{LIST_KINDS[c.kind].hint}.</span>}
      </div>
    </Sheet>
  );
}

function CategoriesSheet({ onClose }: { onClose: () => void }) {
  const { data } = useStore();
  const [edit, setEdit] = useState<ListCategory | 'new' | null>(null);
  if (edit) return <CategorySheet cat={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />;
  return (
    <Sheet title="Categorias de listas" onClose={onClose} footer={<button type="button" className="btn primary block" onClick={() => setEdit('new')}><Icon name="plus" size={18} /> Nova categoria</button>}>
      <p className="muted small">Organize do seu jeito. Cada categoria tem um jeito de funcionar: mercado, compras, receita ou checklist.</p>
      <ul className="list">
        {data.listCategories.map((c) => {
          const n = data.lists.filter((l) => l.categoryId === c.id).length;
          return (
            <li key={c.id}>
              <button type="button" className="row budget-row" onClick={() => setEdit(c)}>
                <CategoryBadge icon={c.icon} color={c.color} size={36} />
                <div className="row-body">
                  <span className="row-title">{c.name}</span>
                  <span className="row-meta">
                    {LIST_KINDS[c.kind].label} · {n} {n === 1 ? 'lista' : 'listas'}
                  </span>
                </div>
                <span className="muted small">Editar</span>
              </button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

function CategorySheet({ cat, onClose }: { cat: ListCategory | null; onClose: () => void }) {
  const { data, update } = useStore();
  const n = cat ? data.lists.filter((l) => l.categoryId === cat.id).length : 0;
  const [name, setName] = useState(cat?.name ?? '');
  const [kind, setKind] = useState<ListKind>(cat?.kind ?? 'checklist');
  const [icon, setIcon] = useState(cat?.icon ?? 'gift');
  const [color, setColor] = useState(cat?.color ?? LIST_COLORS[data.listCategories.length % LIST_COLORS.length]);
  function save() {
    if (!name.trim()) return;
    if (cat) update(updateListCategory(cat.id, { name: name.trim(), kind, icon, color }));
    else update(addListCategory({ name: name.trim(), kind, icon, color }));
    notify(cat ? 'Categoria salva' : 'Categoria criada', `${name.trim()} · ${LIST_KINDS[kind].label}`);
    onClose();
  }
  return (
    <Sheet
      title={cat ? 'Editar categoria' : 'Nova categoria'}
      onClose={onClose}
      footer={
        <div className="btn-row">
          {cat && (
            <button
              type="button"
              className="btn danger"
              disabled={n > 0}
              onClick={() => {
                update(deleteListCategory(cat.id));
                onClose();
              }}
            >
              Excluir
            </button>
          )}
          <button type="button" className="btn primary" disabled={!name.trim()} onClick={save}>
            Salvar
          </button>
        </div>
      }
    >
      <Field label="Nome">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Presentes, Pet, Escola" autoFocus={!cat} />
      </Field>
      <div className="field">
        <span className="field-label">Como funciona</span>
        <div className="kind-list">
          {(Object.keys(LIST_KINDS) as ListKind[]).map((k) => (
            <button key={k} type="button" aria-pressed={kind === k} className={kind === k ? 'on' : ''} disabled={n > 0 && k !== kind} onClick={() => setKind(k)}>
              <b>{LIST_KINDS[k].label}</b>
              <small>{LIST_KINDS[k].hint}</small>
            </button>
          ))}
        </div>
        {n > 0 && <span className="field-hint">Com listas dentro, o jeito de funcionar não muda.</span>}
      </div>
      <div className="field">
        <span className="field-label">Ícone</span>
        <div className="icon-grid" role="radiogroup" aria-label="Ícone">
          {LIST_ICONS.map((ic) => (
            <button key={ic} type="button" role="radio" aria-checked={icon === ic} className={icon === ic ? 'on' : ''} onClick={() => setIcon(ic)} aria-label={ic}>
              <Icon name={ic as IconName} size={18} />
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span className="field-label">Cor</span>
        <div className="swatches" role="radiogroup" aria-label="Cor">
          {LIST_COLORS.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={`Cor ${c}`} className={`swatch${color === c ? ' on' : ''}`} style={{ background: c }} onClick={() => setColor(c)}>
              {color === c && <Icon name="check" size={18} />}
            </button>
          ))}
        </div>
      </div>
      {cat && n > 0 && <p className="muted small">Para excluir, mova ou apague as {n} listas desta categoria.</p>}
    </Sheet>
  );
}

// ---------- Uma lista ----------

function ListPage({ list: l }: { list: UserList }) {
  const { data, update } = useStore();
  const k = kindOf(data, l);
  const c = categoryOf(data, l);
  const [menu, setMenu] = useState(false);
  return (
    <>
      <div className="list-head">
        <button type="button" className="icon-btn" aria-label="Voltar para as listas" onClick={() => (history.length > 1 ? history.back() : goReplace('listas'))}>
          <Icon name="left" />
        </button>
        <div className="list-head-title">
          <h2>{l.name}</h2>
          {c && (
            <span className="muted small">
              {c.name}
              {c.name !== LIST_KINDS[k].label ? ` · ${LIST_KINDS[k].label}` : ''}
            </span>
          )}
        </div>
        <>
            <button type="button" className={`icon-btn${l.pinned ? ' active' : ''}`} aria-pressed={l.pinned} aria-label={l.pinned ? 'Tirar do Início' : 'Fixar no Início'} title={l.pinned ? 'Fixada no Início' : 'Fixar no Início'} onClick={() => update(updateList(l.id, { pinned: !l.pinned }))}>
              <Icon name="pin" size={18} />
            </button>
            <button type="button" className="icon-btn" aria-label="Editar lista" onClick={() => setMenu(true)}>
              <Icon name="edit" size={18} />
            </button>
        </>
      </div>
      {k === 'mercado' && <MarketList l={l} />}
      {k === 'compras' && <ShoppingList l={l} />}
      {k === 'receita' && <RecipeList l={l} />}
      {k === 'checklist' && <Checklist l={l} />}
      {menu && <ListEditSheet l={l} onClose={() => setMenu(false)} />}
    </>
  );
}

function ListEditSheet({ l, onClose }: { l: UserList; onClose: () => void }) {
  const { data, update } = useStore();
  const k = kindOf(data, l);
  const [name, setName] = useState(l.name);
  const [cat, setCat] = useState(l.categoryId);
  return (
    <Sheet
      title="Editar lista"
      onClose={onClose}
      footer={
        <div className="btn-row">
          <button
            type="button"
            className="btn danger"
            onClick={() => {
              if (!confirm(`Excluir a lista "${l.name}"?`)) return;
              update(remove('lists', l.id));
              onClose();
              goReplace('listas');
            }}
          >
            <Icon name="trash" size={18} /> Excluir
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={!name.trim()}
            onClick={() => {
              update(updateList(l.id, { name: name.trim(), categoryId: cat }));
              onClose();
            }}
          >
            Salvar
          </button>
        </div>
      }
    >
      <Field label="Nome">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <div className="field">
        <span className="field-label">Categoria</span>
        <CategoryChips value={cat} onChange={setCat} kind={k} />
        <span className="field-hint">Dá para mover para outra categoria do mesmo tipo ({LIST_KINDS[k].label}).</span>
      </div>
    </Sheet>
  );
}

function AddRow({ placeholder, onAdd, withValue }: { placeholder: string; onAdd: (text: string, value: number | null) => void; withValue?: boolean }) {
  const [text, setText] = useState('');
  const [value, setValue] = useState('');
  const add = () => {
    if (!text.trim()) return;
    onAdd(text.trim(), withValue ? parseNum(value) : null);
    setText('');
    setValue('');
  };
  return (
    <div className="add-row">
      <input className="input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder={placeholder} aria-label="Novo item" />
      {withValue && <input className="input value-input" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="R$" aria-label="Valor" />}
      <button type="button" className="btn" onClick={add} aria-label="Adicionar">
        <Icon name="plus" size={18} />
      </button>
    </div>
  );
}

function CheckRow({ l, it, meta, end, onOpen }: { l: UserList; it: ListItem; meta?: string; end?: ReactNode; onOpen: () => void }) {
  const { update } = useStore();
  return (
    <li className={`row check-row${it.done ? ' done' : ''}`}>
      <button type="button" className={`check round${it.done ? ' on' : ''}`} aria-pressed={it.done} aria-label={`Marcar ${it.text}`} onClick={() => update(toggleItem(l.id, it.id))}>
        {it.done && <Icon name="check" size={14} />}
      </button>
      <button type="button" className="row-body link-row" onClick={onOpen}>
        <span className="row-title">
          {it.text}
          {it.qty !== null && it.unit !== 'R$' && <span className="muted"> · {fmtNum(it.qty)} {it.unit}</span>}
        </span>
        {meta && <span className="row-meta">{meta}</span>}
      </button>
      {end}
    </li>
  );
}

function ItemSheet({ l, it, onClose }: { l: UserList; it: ListItem; onClose: () => void }) {
  const { data, update } = useStore();
  const k = kindOf(data, l);
  const [text, setText] = useState(it.text);
  const [qty, setQty] = useState(fmtNum(it.qty));
  const [unit, setUnit] = useState(it.unit);
  const [aisle, setAisle] = useState(it.aisle || 'Outros');
  const [price, setPrice] = useState(fmtNum(it.price));
  const [store, setStore] = useState(it.store);
  return (
    <Sheet
      title="Item"
      onClose={onClose}
      footer={
        <div className="btn-row">
          <button
            type="button"
            className="btn danger"
            onClick={() => {
              update(removeItem(l.id, it.id));
              onClose();
            }}
          >
            Remover
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              update(updateItem(l.id, it.id, { text: text.trim() || it.text, qty: k === 'mercado' || k === 'receita' ? parseNum(qty) : it.qty, unit, aisle: k === 'mercado' ? aisle : it.aisle, price: k === 'compras' ? parseNum(price) : it.price, store }));
              onClose();
            }}
          >
            Salvar
          </button>
        </div>
      }
    >
      <Field label="Item">
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
      {(k === 'mercado' || k === 'receita') && (
        <div className="form-row">
          <Field label="Quantidade">
            <input className="input" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="1" />
          </Field>
          <Field label="Unidade">
            <input className="input" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder={k === 'receita' ? 'xícara, colher, un' : 'kg, L, un, pacote'} />
          </Field>
        </div>
      )}
      {k === 'mercado' && (
        <div className="field">
          <span className="field-label">Corredor</span>
          <Chips label="Corredor" value={aisle} onChange={setAisle} options={AISLES.map((a) => ({ value: a, label: a }))} />
        </div>
      )}
      {k === 'compras' && (
        <div className="form-row">
          <Field label="Valor">
            <input className="input" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" />
          </Field>
          <Field label="Loja (opcional)">
            <input className="input" value={store} onChange={(e) => setStore(e.target.value)} />
          </Field>
        </div>
      )}
    </Sheet>
  );
}

function ListFooter({ l, children }: { l: UserList; children?: ReactNode }) {
  const { update } = useStore();
  return (
    <div className="btn-row">
      <button
        type="button"
        className="btn"
        disabled={!l.items.some((i) => i.done)}
        onClick={() => {
          update(uncheckAll(l.id));
          notify('Pronta para usar de novo');
        }}
      >
        <Icon name="undo" size={18} /> Desmarcar tudo
      </button>
      {children}
    </div>
  );
}

function MarketList({ l }: { l: UserList }) {
  const { data, update } = useStore();
  const [item, setItem] = useState<ListItem | null>(null);
  const [product, setProduct] = useState<string | null>(null);
  const [finish, setFinish] = useState(false);
  const latest = useMemo(() => latestPrices(data), [data]);
  const est = listEstimate(data, l);
  const storeName = (id: string) => data.stores.find((s) => s.id === id)?.name ?? '';
  const aisles = [...new Set(l.items.map((i) => i.aisle || 'Outros'))];
  return (
    <>
      {est.length > 0 && (
        <section className="card raised">
          <div className="card-head">
            <h2>Quanto vai sair</h2>
            <span className="muted small">pelos seus preços</span>
          </div>
          <ul className="list">
            {est.map((e, i) => (
              <li key={e.storeId} className="row">
                <Icon name="store" size={18} />
                <div className="row-body">
                  <span className="row-title">{storeName(e.storeId)}</span>
                  <span className="row-meta">{e.missing ? `${e.missing} ${e.missing === 1 ? 'item sem preço' : 'itens sem preço'} aqui` : 'todos os itens com preço'}</span>
                </div>
                <strong className={`tabular${i === 0 ? ' green' : ''}`}>{formatMoney(e.total)}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}
      {l.items.length === 0 ? (
        <section className="card">
          <Empty>Adicione itens como "2 kg tomate" ou "leite". Os itens com preço anotado mostram onde sai mais barato.</Empty>
        </section>
      ) : (
        aisles.map((a) => (
          <section key={a} className="card">
            <div className="card-head">
              <h2>{a}</h2>
            </div>
            <ul className="list">
              {l.items
                .filter((i) => (i.aisle || 'Outros') === a)
                .sort((x, y) => Number(x.done) - Number(y.done))
                .map((it) => {
                  const b = it.productId ? bestPrice(data, it.productId, undefined, latest) : null;
                  const prod = data.products.find((p) => p.id === it.productId);
                  return (
                    <CheckRow
                      key={it.id}
                      l={l}
                      it={it}
                      onOpen={() => setItem(it)}
                      meta={b ? `Melhor: ${formatMoney(itemCost(it, b, prod))}${b.variant.brand ? ` ${b.variant.brand}` : ''} no ${storeName(b.storeId)}` : 'Sem preço anotado'}
                      end={
                        it.productId ? (
                          <button type="button" className="icon-btn" aria-label={`Preços de ${it.text}`} onClick={() => setProduct(it.productId)}>
                            <Icon name="tag" size={16} />
                          </button>
                        ) : undefined
                      }
                    />
                  );
                })}
            </ul>
          </section>
        ))
      )}
      <AddRow placeholder='Ex.: "2 kg tomate"' onAdd={(t) => update(addItemFromText(l.id, t))} />
      <ListFooter l={l}>
        <button type="button" className="btn primary" disabled={!l.items.some((i) => i.done)} onClick={() => setFinish(true)}>
          <Icon name="check" size={18} /> Concluir compra
        </button>
      </ListFooter>
      {item && <ItemSheet l={l} it={item} onClose={() => setItem(null)} />}
      {product && <ProductSheet productId={product} onClose={() => setProduct(null)} />}
      {finish && <FinishSheet l={l} onClose={() => setFinish(false)} />}
    </>
  );
}

function ExpenseCategoryChips({ value, onChange }: { value: string | null; onChange: (id: string) => void }) {
  const { data } = useStore();
  return <Chips label="Categoria da despesa" value={value} onChange={onChange} options={data.categories.map((c) => ({ value: c.id, label: c.name }))} />;
}
const findCat = (cats: { id: string; name: string }[], names: string[]) => cats.find((c) => names.some((n) => c.name.toLowerCase().includes(n)))?.id ?? cats[0]?.id ?? null;

function FinishSheet({ l, onClose }: { l: UserList; onClose: () => void }) {
  const { data, update } = useStore();
  const est = listEstimate(data, l, true);
  const [store, setStore] = useState(est[0]?.storeId ?? data.stores[0]?.id ?? '');
  const [newStore, setNewStore] = useState('');
  const estFor = (id: string) => est.find((e) => e.storeId === id)?.total ?? 0;
  const [total, setTotal] = useState(fmtNum(estFor(store) || null));
  const [launch, setLaunch] = useState(true);
  const [reset, setReset] = useState(true);
  const [cat, setCat] = useState<string | null>(findCat(data.categories, ['mercado', 'aliment', 'supermerc']));
  const [pay, setPay] = useState(data.vouchers[0]?.id ?? '');
  const done = l.items.filter((i) => i.done).length;
  function save() {
    const v = parseNum(total) ?? 0;
    const name = data.stores.find((s) => s.id === store)?.name ?? (newStore.trim() || 'Mercado');
    const voucherId = launch && pay ? pay : null;
    update(finishShopping(l.id, { total: v, storeName: name, categoryId: launch ? cat : null, reset, voucherId }));
    notify('Compra concluída', launch && v ? `${formatMoney(v)} lançado em Finanças${voucherId ? ` · pago com ${data.vouchers.find((x) => x.id === voucherId)?.name}` : ''}.` : 'Lista pronta para a próxima.');
    onClose();
  }
  return (
    <Sheet title="Concluir compra" onClose={onClose} footer={<button type="button" className="btn primary block" onClick={save}><Icon name="check" /> Concluir</button>}>
      <p className="muted small">
        {done} de {l.items.length} itens marcados.
      </p>
      <div className="field">
        <span className="field-label">Onde comprou?</span>
        <Chips
          label="Mercado"
          value={store}
          onChange={(id) => {
            setStore(id);
            setTotal(fmtNum(estFor(id) || null));
          }}
          options={[...data.stores.map((s) => ({ value: s.id, label: s.name })), { value: '', label: 'Outro' }]}
        />
        {!store && <input className="input" value={newStore} onChange={(e) => setNewStore(e.target.value)} placeholder="Nome do mercado" />}
      </div>
      <Field label="Total pago">
        <input className="input money large" inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="0,00" />
      </Field>
      <div className="toggle-row">
        <div>
          <strong>Lançar em Finanças</strong>
          <span className="muted small">Vira uma despesa paga hoje.</span>
        </div>
        <Toggle checked={launch} onChange={setLaunch} label="Lançar em Finanças" />
      </div>
      {launch && <ExpenseCategoryChips value={cat} onChange={setCat} />}
      {launch && data.vouchers.length > 0 && (
        <div className="field">
          <span className="field-label">Pago com</span>
          <Chips label="Pago com" value={pay} onChange={setPay} options={[...data.vouchers.map((x) => ({ value: x.id, label: x.name })), { value: '', label: 'Outro (Pix, débito…)' }]} />
        </div>
      )}
      <div className="toggle-row">
        <div>
          <strong>Desmarcar tudo</strong>
          <span className="muted small">A lista fica pronta para a próxima compra.</span>
        </div>
        <Toggle checked={reset} onChange={setReset} label="Desmarcar tudo" />
      </div>
    </Sheet>
  );
}

function ShoppingList({ l }: { l: UserList }) {
  const { data, update } = useStore();
  const [item, setItem] = useState<ListItem | null>(null);
  const [launch, setLaunch] = useState(false);
  const c = categoryOf(data, l);
  const total = l.items.reduce((a, i) => a + (i.price ?? 0), 0);
  const bought = l.items.filter((i) => i.done).reduce((a, i) => a + (i.price ?? 0), 0);
  const pending = l.items.filter((i) => i.done && !i.launched && (i.price ?? 0) > 0);
  return (
    <>
      <section className="card raised">
        <div className="card-head">
          <h2>{c?.name}</h2>
          <span className="muted small">
            {l.items.filter((i) => i.done).length} de {l.items.length} comprados
          </span>
        </div>
        <div className="big-line">
          <span className="big-value">{money0(bought)}</span>
          <span className="muted">de {money0(total)} planejados</span>
        </div>
        <Progress pct={total ? (bought / total) * 100 : 0} />
        <span className="muted small">Falta comprar: {formatMoney(total - bought)}</span>
      </section>
      <section className="card">
        {l.items.length === 0 ? (
          <Empty>Adicione o que quer comprar, com o valor que espera pagar.</Empty>
        ) : (
          <ul className="list">
            {[...l.items]
              .sort((a, b) => Number(a.done) - Number(b.done))
              .map((it) => (
                <CheckRow key={it.id} l={l} it={it} onOpen={() => setItem(it)} meta={[it.store, it.launched ? 'lançado em Finanças' : it.done ? 'comprado' : 'toque para editar'].filter(Boolean).join(' · ')} end={<strong className="tabular">{it.price ? formatMoney(it.price) : '—'}</strong>} />
              ))}
          </ul>
        )}
      </section>
      <AddRow placeholder="Ex.: tênis de corrida" withValue onAdd={(t, v) => update(upsert('lists', { ...l, items: [...l.items, newItem({ text: t.charAt(0).toUpperCase() + t.slice(1), price: v })] }))} />
      <ListFooter l={l}>
        {pending.length > 0 && (
          <button type="button" className="btn primary" onClick={() => setLaunch(true)}>
            Lançar {pending.length} em Finanças
          </button>
        )}
      </ListFooter>
      <p className="muted small center">Cada item comprado vira uma despesa paga hoje, na categoria que você escolher.</p>
      {item && <ItemSheet l={l} it={item} onClose={() => setItem(null)} />}
      {launch && <LaunchSheet l={l} count={pending.length} value={pending.reduce((a, i) => a + (i.price ?? 0), 0)} onClose={() => setLaunch(false)} />}
    </>
  );
}

function LaunchSheet({ l, count, value, onClose }: { l: UserList; count: number; value: number; onClose: () => void }) {
  const { data, update } = useStore();
  const c = categoryOf(data, l);
  const [cat, setCat] = useState<string | null>(findCat(data.categories, [c?.name.toLowerCase() ?? '', 'compras', 'outros']));
  return (
    <Sheet
      title={`Lançar ${count} em Finanças`}
      onClose={onClose}
      footer={
        <button
          type="button"
          className="btn primary block"
          disabled={!cat}
          onClick={() => {
            update(launchBought(l.id, cat!));
            notify(count === 1 ? 'Compra lançada' : `${count} compras lançadas`, `${formatMoney(value)} em Finanças.`);
            onClose();
          }}
        >
          Lançar {formatMoney(value)}
        </button>
      }
    >
      <div className="field">
        <span className="field-label">Categoria da despesa</span>
        <ExpenseCategoryChips value={cat} onChange={setCat} />
      </div>
    </Sheet>
  );
}

function RecipeList({ l }: { l: UserList }) {
  const { update } = useStore();
  const [item, setItem] = useState<ListItem | null>(null);
  const [edit, setEdit] = useState(false);
  const [send, setSend] = useState(false);
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('');
  const [text, setText] = useState('');
  const f = l.serves / (l.baseServes || 1);
  const addIng = () => {
    if (!text.trim()) return;
    update(upsert('lists', { ...l, items: [...l.items, newItem({ text: text.trim().charAt(0).toUpperCase() + text.trim().slice(1), qty: parseNum(qty), unit: unit.trim() })] }));
    setQty('');
    setUnit('');
    setText('');
  };
  return (
    <>
      <section className="card raised">
        <div className="tags-row">
          {l.minutes && (
            <Pill tone="blue">
              <Icon name="clock" size={12} /> {l.minutes} min
            </Pill>
          )}
          {l.tags.map((t) => (
            <Pill key={t}>{t}</Pill>
          ))}
          <button type="button" className="link" onClick={() => setEdit(true)}>
            Editar tempo, porções e preparo
          </button>
        </div>
        <div className="spread" style={{ marginTop: 12, alignItems: 'center' }}>
          <strong>Porções</strong>
          <div className="stepper">
            <button type="button" aria-label="Menos porções" onClick={() => update(updateList(l.id, { serves: Math.max(1, l.serves - 1) }))}>
              −
            </button>
            <b className="tabular">{l.serves}</b>
            <button type="button" aria-label="Mais porções" onClick={() => update(updateList(l.id, { serves: l.serves + 1 }))}>
              +
            </button>
          </div>
        </div>
        {f !== 1 && (
          <span className="muted small">
            Quantidades para {l.serves} porções (a receita é para {l.baseServes}).
          </span>
        )}
      </section>
      <section className="card">
        <div className="card-head">
          <h2>Ingredientes</h2>
        </div>
        {l.items.length === 0 ? (
          <Empty>Adicione os ingredientes com quantidade e unidade.</Empty>
        ) : (
          <ul className="list">
            {l.items.map((it) => (
              <li key={it.id}>
                <button type="button" className="row budget-row" onClick={() => setItem(it)}>
                  <span className="dot" style={{ background: 'var(--blue)' }} />
                  <div className="row-body">
                    <span className="row-title">{it.text}</span>
                  </div>
                  <span className="tabular">{it.qty ? `${qtyText(scaledQty(it.qty, it.unit, f))} ${it.unit}` : it.unit}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="add-row recipe-add">
          <input className="input value-input" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Qtd" aria-label="Quantidade" />
          <input className="input value-input" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="xícara" aria-label="Unidade" />
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addIng()} placeholder="Ingrediente" aria-label="Ingrediente" />
          <button type="button" className="btn" onClick={addIng} aria-label="Adicionar ingrediente">
            <Icon name="plus" size={18} />
          </button>
        </div>
        {l.items.length > 0 && (
          <button type="button" className="btn soft block" style={{ marginTop: 12 }} onClick={() => setSend(true)}>
            <Icon name="cart" size={18} /> <span className="green">Mandar para a lista de mercado</span>
          </button>
        )}
      </section>
      <section className="card">
        <div className="card-head">
          <h2>Modo de preparo</h2>
        </div>
        {l.steps.length ? (
          <ol className="steps">
            {l.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        ) : (
          <Empty>Toque em "Editar tempo, porções e preparo" para escrever os passos.</Empty>
        )}
      </section>
      {item && <ItemSheet l={l} it={item} onClose={() => setItem(null)} />}
      {edit && <RecipeEditSheet l={l} onClose={() => setEdit(false)} />}
      {send && <SendSheet l={l} onClose={() => setSend(false)} />}
    </>
  );
}

function RecipeEditSheet({ l, onClose }: { l: UserList; onClose: () => void }) {
  const { update } = useStore();
  const [minutes, setMinutes] = useState(l.minutes ? String(l.minutes) : '');
  const [base, setBase] = useState(String(l.baseServes));
  const [tags, setTags] = useState(l.tags.join(', '));
  const [steps, setSteps] = useState(l.steps.join('\n'));
  return (
    <Sheet
      title="Receita"
      onClose={onClose}
      footer={
        <button
          type="button"
          className="btn primary block"
          onClick={() => {
            const b = Math.max(1, Math.round(parseNum(base) ?? l.baseServes));
            update(updateList(l.id, { minutes: parseNum(minutes), baseServes: b, serves: l.serves === l.baseServes ? b : l.serves, tags: tags.split(',').map((t) => t.trim()).filter(Boolean), steps: steps.split('\n').map((s) => s.trim()).filter(Boolean) }));
            onClose();
          }}
        >
          Salvar
        </button>
      }
    >
      <div className="form-row">
        <Field label="Tempo (min)">
          <input className="input" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="50" />
        </Field>
        <Field label="Rende (porções)">
          <input className="input" inputMode="numeric" value={base} onChange={(e) => setBase(e.target.value)} />
        </Field>
      </div>
      <Field label="Etiquetas" hint="Separe com vírgula: doce, lanche, rápido.">
        <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} />
      </Field>
      <Field label="Modo de preparo" hint="Um passo por linha.">
        <textarea className="input" rows={7} value={steps} onChange={(e) => setSteps(e.target.value)} />
      </Field>
    </Sheet>
  );
}

function SendSheet({ l, onClose }: { l: UserList; onClose: () => void }) {
  const { data, update } = useStore();
  const markets = data.lists.filter((x) => kindOf(data, x) === 'mercado');
  const [target, setTarget] = useState(markets[0]?.id ?? '');
  const [picked, setPicked] = useState<string[]>(l.items.map((i) => i.id));
  const marketCat = data.listCategories.find((c) => c.kind === 'mercado');
  function send() {
    let to = target;
    let next = (d: typeof data) => d;
    if (!to) {
      const nl = newList('Mercado', marketCat?.id ?? data.listCategories[0].id);
      to = nl.id;
      next = (d) => ({ ...d, lists: [...d.lists, nl] });
    }
    const dest = to;
    update((d) => sendIngredients(l.id, dest, picked)(next(d)));
    notify(`${picked.length} ${picked.length === 1 ? 'ingrediente adicionado' : 'ingredientes adicionados'}`, `Em "${data.lists.find((x) => x.id === dest)?.name ?? 'Mercado'}".`);
    onClose();
  }
  return (
    <Sheet title="O que está faltando?" onClose={onClose} footer={<button type="button" className="btn primary block" disabled={!picked.length || !marketCat} onClick={send}>Adicionar à lista</button>}>
      {markets.length > 1 && (
        <div className="field">
          <span className="field-label">Para qual lista?</span>
          <Chips label="Lista de mercado" value={target} onChange={setTarget} options={markets.map((m) => ({ value: m.id, label: m.name }))} />
        </div>
      )}
      {markets.length === 0 && <p className="muted small">Ainda não há lista de mercado: o app cria uma chamada "Mercado".</p>}
      <ul className="list">
        {l.items.map((it) => (
          <li key={it.id} className="row">
            <label className="check-line">
              <input type="checkbox" checked={picked.includes(it.id)} onChange={() => setPicked((p) => (p.includes(it.id) ? p.filter((x) => x !== it.id) : [...p, it.id]))} />
              <span>{it.text}</span>
            </label>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

function Checklist({ l }: { l: UserList }) {
  const { update } = useStore();
  const [item, setItem] = useState<ListItem | null>(null);
  return (
    <>
      <section className="card">
        {l.items.length === 0 ? (
          <Empty>Lista vazia. Adicione o primeiro item abaixo.</Empty>
        ) : (
          <ul className="list">
            {l.items.map((it) => (
              <CheckRow key={it.id} l={l} it={it} onOpen={() => setItem(it)} />
            ))}
          </ul>
        )}
      </section>
      <AddRow placeholder="Novo item" onAdd={(t) => update(upsert('lists', { ...l, items: [...l.items, newItem({ text: t.charAt(0).toUpperCase() + t.slice(1) })] }))} />
      <ListFooter l={l} />
      {item && <ItemSheet l={l} it={item} onClose={() => setItem(null)} />}
    </>
  );
}

// ---------- Preços ----------

function readDayStore(): string {
  try {
    return localStorage.getItem(DAY_STORE_KEY) ?? '';
  } catch {
    return '';
  }
}

function Prices() {
  const { data } = useStore();
  const [dayStore, setDayStoreState] = useState(readDayStore);
  const [entry, setEntry] = useState(false);
  const [product, setProduct] = useState<string | null>(null);
  const latest = useMemo(() => latestPrices(data), [data]);
  const setDayStore = (id: string) => {
    setDayStoreState(id);
    try {
      localStorage.setItem(DAY_STORE_KEY, id);
    } catch {
      /* ignora */
    }
  };
  const storeName = (id: string) => data.stores.find((s) => s.id === id)?.name ?? '';
  const products = [...data.products].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <section className="card raised">
        <div className="card-head">
          <h2>Mercado de hoje</h2>
          <span className="muted small">os preços entram aqui</span>
        </div>
        {data.stores.length > 0 && <Chips label="Mercado de hoje" value={dayStore} onChange={setDayStore} options={data.stores.map((s) => ({ value: s.id, label: s.name }))} />}
        <button type="button" className="btn primary block" style={{ marginTop: 12 }} onClick={() => setEntry(true)}>
          <Icon name="plus" size={18} /> Anotar preço
        </button>
      </section>
      <section className="card">
        <div className="card-head">
          <h2>Produtos</h2>
          <span className="muted small">{products.length}</span>
        </div>
        {products.length === 0 ? (
          <Empty>Anote preços no mercado: o app compara por kg, litro ou unidade e mostra onde e qual marca sai mais barato.</Empty>
        ) : (
          <ul className="list">
            {products.map((p) => {
              const b = bestPrice(data, p.id, undefined, latest);
              const n = data.prices.filter((x) => data.variants.some((v) => v.id === x.variantId && v.productId === p.id)).length;
              return (
                <li key={p.id}>
                  <button type="button" className="row budget-row" onClick={() => setProduct(p.id)}>
                    <Icon name="tag" size={18} />
                    <div className="row-body">
                      <span className="row-title">{p.name}</span>
                      <span className="row-meta">{b ? `Mais barato: ${b.variant.brand ? `${b.variant.brand} ` : ''}no ${storeName(b.storeId)} · ${n} ${n === 1 ? 'preço' : 'preços'}` : 'Sem preço'}</span>
                    </div>
                    {b && (
                      <span className="price-col">
                        <strong className="tabular">{formatMoney(b.perUnit)}</strong>
                        <small>/{p.unit}</small>
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <p className="muted small center">Os preços são comparados por unidade (R$/kg, R$/L, R$/un), para comparar embalagens diferentes.</p>
      {entry && <PriceSheet dayStore={dayStore} onDayStore={setDayStore} onClose={() => setEntry(false)} />}
      {product && <ProductSheet productId={product} onClose={() => setProduct(null)} />}
    </>
  );
}

function ProductSheet({ productId, onClose }: { productId: string; onClose: () => void }) {
  const { data } = useStore();
  const p = data.products.find((x) => x.id === productId);
  const latest = useMemo(() => latestPrices(data), [data]);
  if (!p) return null;
  const vars = data.variants.filter((v) => v.productId === p.id);
  const stores = data.stores.filter((s) => vars.some((v) => latest.has(`${v.id}|${s.id}`)));
  const best = bestPrice(data, p.id, undefined, latest);
  const byBrand = vars
    .map((v) => ({ v, b: bestPrice({ prices: data.prices, variants: [v] }, p.id, undefined, latest) }))
    .filter((x) => x.b)
    .sort((a, b) => a.b!.perUnit - b.b!.perUnit);
  const hist = best ? data.prices.filter((x) => x.variantId === best.variant.id).sort((a, b) => a.date.localeCompare(b.date)).slice(-8) : [];
  const max = Math.max(...hist.map((h) => h.price), 0);
  const min = Math.min(...hist.map((h) => h.price), max);
  return (
    <Sheet title={p.name} onClose={onClose}>
      {best ? (
        <>
          <div className="best-box">
            <span className="muted small">Menor preço</span>
            <strong>{formatMoney(best.price)}</strong>
            <span>
              {variantLabel(best.variant)} · {data.stores.find((s) => s.id === best.storeId)?.name} · <b>{formatMoney(best.perUnit)}/{p.unit}</b>
            </span>
          </div>
          {byBrand.length > 1 && byBrand[0].v.brand !== byBrand[1].v.brand && (
            <p className="tip">
              <Icon name="bolt" size={16} />
              <span>
                <b>{byBrand[0].v.brand || variantLabel(byBrand[0].v)}</b> sai {formatMoney(byBrand[1].b!.perUnit - byBrand[0].b!.perUnit)}/{p.unit} mais barato que {byBrand[1].v.brand || variantLabel(byBrand[1].v)}.
              </span>
            </p>
          )}
          <div className="ptable" role="table" aria-label="Preços por marca e mercado" style={{ gridTemplateColumns: `1.3fr repeat(${stores.length}, 1fr)` }}>
            <span role="columnheader" className="ph">Marca</span>
            {stores.map((s) => (
              <span key={s.id} role="columnheader" className="ph">
                {s.name}
              </span>
            ))}
            {vars.map((v) => (
              <PriceRow key={v.id} v={v} p={p} stores={stores.map((s) => s.id)} latest={latest} best={best} />
            ))}
          </div>
          {hist.length > 1 && (
            <div className="field">
              <span className="field-label">Como o preço mudou · {variantLabel(best.variant)}</span>
              <div className="spark" role="img" aria-label="Evolução do preço">
                {hist.map((h) => (
                  <i key={h.id} style={{ height: `${max === min ? 60 : 25 + ((h.price - min) / (max - min)) * 75}%` }} title={`${formatDMY(h.date)}: ${formatMoney(h.price)}`}>
                    <small>{h.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</small>
                  </i>
                ))}
              </div>
              <span className="muted small">
                {hist[hist.length - 1].price >= hist[0].price ? 'Subiu' : 'Caiu'} {Math.abs(Math.round((hist[hist.length - 1].price / hist[0].price - 1) * 100))}% desde {formatDMY(hist[0].date)}.
              </span>
            </div>
          )}
        </>
      ) : (
        <Empty>Ainda sem preço anotado.</Empty>
      )}
    </Sheet>
  );
}

function PriceRow({ v, p, stores, latest, best }: { v: ProductVariant; p: Product; stores: string[]; latest: Map<string, { price: number; date: string }>; best: { variant: ProductVariant; storeId: string } }) {
  const old = (date: string) => date < new Date(Date.now() - 60 * 864e5).toISOString().slice(0, 10);
  return (
    <>
      <span role="cell" className="pc">
        <b>{v.brand || p.name}</b>
        <small>{sizeText(v)}</small>
      </span>
      {stores.map((s) => {
        const e = latest.get(`${v.id}|${s}`);
        const win = best.variant.id === v.id && best.storeId === s;
        return (
          <span key={s} role="cell" className={`pc${win ? ' win' : ''}${e && old(e.date) ? ' old' : ''}`} title={e ? formatDMY(e.date) : undefined}>
            {e ? (
              <>
                {formatMoney(e.price)}
                <small>
                  {formatMoney(perUnit(v, e.price))}/{p.unit}
                </small>
              </>
            ) : (
              <small className="muted">—</small>
            )}
          </span>
        );
      })}
    </>
  );
}

function PriceSheet({ dayStore, onDayStore, onClose }: { dayStore: string; onDayStore: (id: string) => void; onClose: () => void }) {
  const { data, update } = useStore();
  const [store, setStore] = useState(dayStore || data.stores[0]?.id || '');
  const [storeName, setStoreName] = useState('');
  const [q, setQ] = useState('');
  const [prod, setProd] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [variant, setVariant] = useState<string>('');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('1');
  const [sizeUnit, setSizeUnit] = useState<ProductVariant['sizeUnit']>('kg');
  const [aisle, setAisle] = useState('Mercearia');
  const [unit, setUnit] = useState<Product['unit']>('kg');
  const [price, setPrice] = useState('');
  const [promo, setPromo] = useState(false);
  const vars = prod ? data.variants.filter((v) => v.productId === prod.id) : [];
  const matches = q.trim() && !prod ? data.products.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 6) : [];
  const v = parseNum(price);
  const check = prod && variant && v ? priceCheck(data, variant, v) : null;
  const last = prod && variant && store ? latestPrices(data).get(`${variant}|${store}`) : undefined;
  const storeLabel = (id: string) => data.stores.find((s) => s.id === id)?.name ?? storeName;

  function reset() {
    setQ('');
    setProd(null);
    setIsNew(false);
    setVariant('');
    setBrand('');
    setSize('1');
    setPrice('');
    setPromo(false);
  }
  function save() {
    if (!v || (!prod && !isNew) || (!store && !storeName.trim())) return;
    const newVariant = !variant;
    update(
      addPrice({
        storeId: store || undefined,
        storeName: store ? undefined : storeName.trim(),
        productId: prod?.id,
        productName: prod ? undefined : q.trim().charAt(0).toUpperCase() + q.trim().slice(1),
        aisle,
        unit,
        variantId: variant || undefined,
        brand: newVariant ? brand : undefined,
        size: newVariant ? parseNum(size) ?? 1 : undefined,
        sizeUnit: newVariant ? sizeUnit : undefined,
        price: v,
        promo,
      }),
    );
    if (store) onDayStore(store);
    notify('Preço anotado', `${prod?.name ?? q.trim()}: ${formatMoney(v)} no ${storeLabel(store)}${promo ? ' (promoção)' : ''}`);
    reset();
  }
  const pick = (p: Product) => {
    setProd(p);
    setQ(p.name);
    setIsNew(false);
    const vs = data.variants.filter((x) => x.productId === p.id);
    setVariant(vs[0]?.id ?? '');
    setSizeUnit(p.unit === 'L' ? 'ml' : p.unit === 'kg' ? 'kg' : 'un');
  };
  return (
    <Sheet
      title="Anotar preço"
      onClose={onClose}
      footer={
        <div className="btn-row">
          <button type="button" className="btn" onClick={onClose}>
            Fechar
          </button>
          <button type="button" className="btn primary" disabled={!v || (!prod && !isNew) || (!store && !storeName.trim())} onClick={save}>
            Salvar e próximo
          </button>
        </div>
      }
    >
      <div className="field">
        <span className="field-label">Mercado</span>
        <Chips label="Mercado" value={store} onChange={setStore} options={[...data.stores.map((s) => ({ value: s.id, label: s.name })), { value: '', label: '+ Novo' }]} />
        {!store && <input className="input" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Nome do mercado" />}
      </div>
      <Field label="Produto">
        <input
          className="input"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setProd(null);
            setIsNew(false);
            setVariant('');
          }}
          placeholder="Comece a digitar: arr…"
          autoComplete="off"
          autoFocus
        />
      </Field>
      {(matches.length > 0 || (q.trim() && !prod && !isNew)) && (
        <div className="sugbox">
          {matches.map((p) => (
            <button key={p.id} type="button" onClick={() => pick(p)}>
              {p.name} <small>{p.aisle}</small>
            </button>
          ))}
          {!matches.some((p) => p.name.toLowerCase() === q.trim().toLowerCase()) && (
            <button type="button" onClick={() => setIsNew(true)}>
              + Novo produto: "{q.trim()}"
            </button>
          )}
        </div>
      )}
      {isNew && (
        <>
          <div className="field">
            <span className="field-label">Corredor</span>
            <Chips label="Corredor" value={aisle} onChange={setAisle} options={AISLES.map((a) => ({ value: a, label: a }))} />
          </div>
          <div className="field">
            <span className="field-label">Comparar por</span>
            <Chips
              label="Comparar por"
              value={unit}
              onChange={(u) => {
                setUnit(u);
                setSizeUnit(u === 'L' ? 'ml' : u === 'kg' ? 'kg' : 'un');
              }}
              options={[
                { value: 'kg', label: 'R$/kg' },
                { value: 'L', label: 'R$/litro' },
                { value: 'un', label: 'R$/unidade' },
              ]}
            />
          </div>
        </>
      )}
      {prod && vars.length > 0 && (
        <div className="field">
          <span className="field-label">Marca e tamanho</span>
          <Chips label="Marca e tamanho" value={variant} onChange={setVariant} options={[...vars.map((x) => ({ value: x.id, label: variantLabel(x) })), { value: '', label: '+ Outra' }]} />
        </div>
      )}
      {(isNew || (prod && !variant)) && (
        <div className="form-row three">
          <Field label="Marca (opcional)">
            <input className="input" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Camil" />
          </Field>
          <Field label="Tamanho">
            <input className="input" inputMode="decimal" value={size} onChange={(e) => setSize(e.target.value)} />
          </Field>
          <Field label="Unidade">
            <select className="input" value={sizeUnit} onChange={(e) => setSizeUnit(e.target.value as ProductVariant['sizeUnit'])}>
              {(['g', 'kg', 'ml', 'L', 'un'] as const).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}
      <Field label="Preço">
        <input className="input money large" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" />
      </Field>
      {last && <p className="muted small">Da última vez no {storeLabel(store)}: {formatMoney(last.price)} ({formatDMY(last.date)}).</p>}
      {check?.best && check.diff > 0.05 && (
        <p className="tip warn">
          <Icon name="alert" size={16} />
          <span>
            Este preço está <b>{Math.round(check.diff * 100)}% acima</b> do seu menor registro ({formatMoney(check.best.price)} {check.best.variant.brand} no {data.stores.find((s) => s.id === check.best!.storeId)?.name}).
          </span>
        </p>
      )}
      {check?.best && check.diff < -0.001 && (
        <p className="tip">
          <Icon name="bolt" size={16} />
          <span>
            É o <b>menor preço</b> que você já anotou para {prod?.name}.
          </span>
        </p>
      )}
      <div className="toggle-row">
        <strong>Está em promoção</strong>
        <Toggle checked={promo} onChange={setPromo} label="Está em promoção" />
      </div>
    </Sheet>
  );
}

/** Início: listas fixadas. */
export function PinnedLists() {
  const { data } = useStore();
  const pinned = data.lists.filter((l) => l.pinned);
  if (!pinned.length) return null;
  return (
    <section className="card">
      <div className="card-head">
        <h2>Listas fixadas</h2>
        <a className="link" href="#/listas">
          Listas
        </a>
      </div>
      <div className="lcards">
        {pinned.map((l) => (
          <ListCard key={l.id} l={l} />
        ))}
      </div>
    </section>
  );
}

