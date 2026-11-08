import { useState } from 'react';
import { useStore } from '../../store';
import { remove } from '../../actions';
import type { Category } from '../../types';
import { CategoryBadge, Icon, IconButton, notify, Sheet } from '../../ui';
import { CategorySheet } from './CategorySheet';

/** Categorias de despesa e fontes de receita, dentro de Finanças. */
export function FinanceCategoriesSheet({ onClose }: { onClose: () => void }) {
  const { data, update } = useStore();
  const [catSheet, setCatSheet] = useState<{ collection: 'categories' | 'incomeSources'; item: Category | null } | null>(null);

  const usage = (id: string) => data.expenses.filter((e) => e.categoryId === id).length + data.series.filter((s) => s.categoryId === id).length;
  const sourceUsage = (id: string) => data.incomes.filter((i) => i.sourceId === id).length + data.incomeSeries.filter((s) => s.sourceId === id).length;

  function deleteCategory(c: Category) {
    const n = usage(c.id);
    if (n > 0) return notify('Categoria em uso', `"${c.name}" está em ${n} lançamento(s). Altere esses lançamentos antes de excluir.`);
    if (confirm(`Excluir a categoria "${c.name}"?`)) update(remove('categories', c.id));
  }

  function deleteSource(c: Category) {
    const n = sourceUsage(c.id);
    if (n > 0) return notify('Fonte em uso', `"${c.name}" está em ${n} receita(s). Altere essas receitas antes de excluir.`);
    if (confirm(`Excluir a fonte "${c.name}"?`)) update(remove('incomeSources', c.id));
  }

  return (
    <Sheet title="Categorias" onClose={onClose}>
      <CategoryGroup
        title="Categorias de despesa"
        items={data.categories}
        usage={usage}
        defaultOpen
        onNew={() => setCatSheet({ collection: 'categories', item: null })}
        onEdit={(c) => setCatSheet({ collection: 'categories', item: c })}
        onDelete={deleteCategory}
      />
      <CategoryGroup
        title="Fontes de receita"
        items={data.incomeSources}
        usage={sourceUsage}
        onNew={() => setCatSheet({ collection: 'incomeSources', item: null })}
        onEdit={(c) => setCatSheet({ collection: 'incomeSources', item: c })}
        onDelete={deleteSource}
      />
      {catSheet && <CategorySheet collection={catSheet.collection} initial={catSheet.item ?? undefined} onClose={() => setCatSheet(null)} />}
    </Sheet>
  );
}

/** Lista de categorias que abre e fecha, para não empurrar o resto da tela. */
function CategoryGroup({
  title,
  items,
  usage,
  defaultOpen = false,
  onNew,
  onEdit,
  onDelete,
}: {
  title: string;
  items: Category[];
  usage: (id: string) => number;
  defaultOpen?: boolean;
  onNew: () => void;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="card">
      <button type="button" className="collapse-head" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <h2>{title}</h2>
        <span className="muted small">{items.length}</span>
        <Icon name={open ? 'up' : 'down'} size={18} />
      </button>
      {open && (
        <>
          <ul className="list" style={{ marginTop: 8 }}>
            {items.map((c) => (
              <li key={c.id} className="row">
                <CategoryBadge icon={c.icon} color={c.color} size={36} />
                <div className="row-body">
                  <span className="row-title">{c.name}</span>
                  <span className="row-meta">{usage(c.id)} lançamento(s)</span>
                </div>
                <div className="row-actions">
                  <IconButton icon="edit" label={`Editar ${c.name}`} onClick={() => onEdit(c)} />
                  <IconButton icon="trash" label={`Excluir ${c.name}`} tone="danger" onClick={() => onDelete(c)} />
                </div>
              </li>
            ))}
          </ul>
          <button type="button" className="btn soft small block" style={{ marginTop: 8 }} onClick={onNew}>
            <Icon name="plus" size={16} /> Nova
          </button>
        </>
      )}
    </section>
  );
}
