import { useState } from 'react';
import { useStore } from '../../store';
import { upsert } from '../../actions';
import { COLORS } from '../../data';
import type { Category } from '../../types';
import { uid } from '../../utils';
import { CATEGORY_ICONS, CategoryBadge, Field, Icon, Sheet } from '../../ui';

/** Cadastro/edição de categoria. Abre por cima de outro formulário sem perder o que já foi preenchido nele. */
export function CategorySheet({
  initial,
  onClose,
  onSaved,
  collection = 'categories',
}: {
  initial?: Category;
  onClose: () => void;
  onSaved?: (c: Category) => void;
  /** Categorias de despesa ou fontes de receita. */
  collection?: 'categories' | 'incomeSources';
}) {
  const isIncome = collection === 'incomeSources';
  const { data, update } = useStore();
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? 'tag');
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);
  const [error, setError] = useState('');

  function save() {
    const n = name.trim();
    if (!n) return setError(isIncome ? 'Dê um nome para a fonte.' : 'Dê um nome para a categoria.');
    if (data[collection].some((c) => c.id !== initial?.id && c.name.toLowerCase() === n.toLowerCase())) {
      return setError(isIncome ? 'Já existe uma fonte com esse nome.' : 'Já existe uma categoria com esse nome.');
    }
    const cat: Category = { id: initial?.id ?? uid(), name: n, icon, color };
    update(upsert(collection, cat));
    onSaved?.(cat);
    onClose();
  }

  return (
    <Sheet
      title={isIncome ? (initial ? 'Editar fonte de receita' : 'Nova fonte de receita') : initial ? 'Editar categoria' : 'Nova categoria'}
      onClose={onClose}
      footer={
        <button type="button" className="btn primary block" onClick={save}>
          {isIncome ? 'Salvar fonte' : 'Salvar categoria'}
        </button>
      }
    >
      <div className="card-form-head">
        <CategoryBadge icon={icon} color={color} size={52} />
        <Field label={isIncome ? 'Nome da fonte' : 'Nome da categoria'}>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={isIncome ? 'Ex.: Aluguel recebido, Vendas…' : 'Ex.: Pets, Academia…'} autoFocus />
        </Field>
      </div>
      <div className="field">
        <span className="field-label">Ícone</span>
        <div className="icon-grid" role="radiogroup" aria-label="Ícone">
          {CATEGORY_ICONS.map((i) => (
            <button key={i} type="button" role="radio" aria-checked={icon === i} aria-label={i} className={icon === i ? 'on' : ''} onClick={() => setIcon(i)}>
              <Icon name={i} />
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span className="field-label">Cor</span>
        <div className="swatches" role="radiogroup" aria-label="Cor">
          {COLORS.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={`Cor ${c}`} className={`swatch${color === c ? ' on' : ''}`} style={{ background: c }} onClick={() => setColor(c)}>
              {color === c && <Icon name="check" size={18} />}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
      <p className="muted small">{isIncome ? 'Após salvar, a fonte fica disponível em Configurações e já vem selecionada na receita.' : 'Após salvar, a categoria fica disponível em Configurações e já vem selecionada na despesa.'}</p>
    </Sheet>
  );
}
