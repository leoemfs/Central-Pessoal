import { useState } from 'react';
import { useStore } from '../../store';
import { upsert } from '../../actions';
import { COLORS } from '../../data';
import type { Category } from '../../types';
import { uid } from '../../utils';
import { CATEGORY_ICONS, CategoryBadge, Field, Icon, Sheet } from '../../ui';

/** Cadastro/edição de categoria. Abre por cima de outro formulário sem perder o que já foi preenchido nele. */
export function CategorySheet({ initial, onClose, onSaved }: { initial?: Category; onClose: () => void; onSaved?: (c: Category) => void }) {
  const { data, update } = useStore();
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? 'tag');
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);
  const [error, setError] = useState('');

  function save() {
    const n = name.trim();
    if (!n) return setError('Dê um nome para a categoria.');
    if (data.categories.some((c) => c.id !== initial?.id && c.name.toLowerCase() === n.toLowerCase())) {
      return setError('Já existe uma categoria com esse nome.');
    }
    const cat: Category = { id: initial?.id ?? uid(), name: n, icon, color };
    update(upsert('categories', cat));
    onSaved?.(cat);
    onClose();
  }

  return (
    <Sheet
      title={initial ? 'Editar categoria' : 'Nova categoria'}
      onClose={onClose}
      footer={
        <button type="button" className="btn primary block" onClick={save}>
          Salvar categoria
        </button>
      }
    >
      <div className="card-form-head">
        <CategoryBadge icon={icon} color={color} size={52} />
        <Field label="Nome da categoria">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Pets, Academia…" autoFocus />
        </Field>
      </div>
      <div className="field">
        <span className="field-label">Ícone da categoria</span>
        <div className="icon-grid" role="radiogroup" aria-label="Ícone">
          {CATEGORY_ICONS.map((i) => (
            <button key={i} type="button" role="radio" aria-checked={icon === i} aria-label={i} className={icon === i ? 'on' : ''} onClick={() => setIcon(i)}>
              <Icon name={i} />
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span className="field-label">Cor da categoria</span>
        <div className="swatches" role="radiogroup" aria-label="Cor">
          {COLORS.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={`Cor ${c}`} className={`swatch${color === c ? ' on' : ''}`} style={{ background: c }} onClick={() => setColor(c)}>
              {color === c && <Icon name="check" size={18} />}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
      <p className="muted small">Após salvar, a categoria fica disponível em Ajustes e já vem selecionada na despesa.</p>
    </Sheet>
  );
}
