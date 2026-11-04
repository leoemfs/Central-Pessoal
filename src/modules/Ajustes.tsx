import { useRef, useState, type ChangeEvent } from 'react';
import { useStore } from '../store';
import { remove } from '../actions';
import { emptyData, normalize } from '../data';
import type { Category, Theme } from '../types';
import { formatDMY, toISO, todayISO } from '../utils';
import { CategoryBadge, Icon, IconButton, PageHeader, Segmented } from '../ui';
import { CategorySheet } from './financas/CategorySheet';

export function Ajustes() {
  const { data, update, replace, persisted } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ tone: 'green' | 'red'; text: string } | null>(null);
  const [catSheet, setCatSheet] = useState<{ collection: 'categories' | 'incomeSources'; item: Category | null } | null>(null);

  const usage = (id: string) => data.expenses.filter((e) => e.categoryId === id).length + data.series.filter((s) => s.categoryId === id).length;

  const sourceUsage = (id: string) => data.incomes.filter((i) => i.sourceId === id).length + data.incomeSeries.filter((s) => s.sourceId === id).length;

  function deleteSource(c: Category) {
    const n = sourceUsage(c.id);
    if (n > 0) return setMessage({ tone: 'red', text: `"${c.name}" está em uso por ${n} receita(s). Altere essas receitas antes de excluir.` });
    if (confirm(`Excluir a fonte "${c.name}"?`)) update(remove('incomeSources', c.id));
  }

  function deleteCategory(c: Category) {
    const n = usage(c.id);
    if (n > 0) return setMessage({ tone: 'red', text: `"${c.name}" está em uso por ${n} lançamento(s). Altere esses lançamentos antes de excluir.` });
    if (confirm(`Excluir a categoria "${c.name}"?`)) update(remove('categories', c.id));
  }

  function exportBackup() {
    const stamp = new Date().toISOString();
    const blob = new Blob([JSON.stringify({ ...data, settings: { ...data.settings, lastBackupAt: stamp } }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `central-pessoal-backup-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    update((d) => ({ ...d, settings: { ...d.settings, lastBackupAt: stamp } }));
    setMessage({ tone: 'green', text: 'Backup exportado. Guarde o arquivo em um lugar seguro (ex.: Google Drive).' });
  }

  async function importBackup(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const imported = normalize(JSON.parse(await file.text()));
      const n = imported.expenses.length + imported.journal.length + imported.tasks.length + imported.events.length + imported.notes.length + imported.habits.length;
      if (!confirm(`Importar ${n} item(ns) de "${file.name}"? Isso substitui todos os dados atuais deste aparelho.`)) return;
      replace(imported);
      setMessage({ tone: 'green', text: `Backup importado: ${n} item(ns).` });
    } catch {
      setMessage({ tone: 'red', text: 'Arquivo inválido. Escolha um backup .json exportado pela Central Pessoal.' });
    }
  }

  function clearAll() {
    if (confirm('Apagar TODOS os dados deste aparelho? Isso não pode ser desfeito. Exporte um backup antes, se quiser.')) {
      replace({ ...normalize(emptyData()), settings: { ...normalize(emptyData()).settings, theme: data.settings.theme } });
      setMessage({ tone: 'green', text: 'Todos os dados foram apagados.' });
    }
  }

  const counts: [string, number][] = [
    ['Despesas', data.expenses.length],
    ['Cartões', data.cards.length],
    ['Diário', data.journal.length],
    ['Compromissos', data.events.length],
    ['Tarefas', data.tasks.length],
    ['Hábitos', data.habits.length],
    ['Anotações', data.notes.length],
  ];

  return (
    <>
      <PageHeader title="Configurações" subtitle="Aparência, categorias, backup e dados" />

      {message && (
        <div className={`alert ${message.tone}`} role="status">
          {message.text}
        </div>
      )}

      <section className="card">
        <div className="card-head">
          <h2>Aparência</h2>
        </div>
        <Segmented<Theme>
          label="Tema"
          value={data.settings.theme}
          onChange={(theme) => update((d) => ({ ...d, settings: { ...d.settings, theme } }))}
          options={[
            { value: 'dark', label: 'Escuro' },
            { value: 'light', label: 'Claro' },
            { value: 'system', label: 'Automático' },
          ]}
        />
        <p className="muted small" style={{ marginTop: 10 }}>
          {data.settings.theme === 'system' ? 'Segue o tema do celular ou computador.' : 'Vale para todas as telas do app.'}
        </p>
      </section>

      <CategoryGroup
        title="Categorias de despesa"
        items={data.categories}
        usage={usage}
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

      <section className="card">
        <div className="card-head">
          <h2>Backup</h2>
          <span className="muted small">{data.settings.lastBackupAt ? `Último: ${formatDMY(toISO(new Date(data.settings.lastBackupAt)))}` : 'Nenhum ainda'}</span>
        </div>
        <p className="muted">Seus dados ficam só neste aparelho. Exporte um backup de vez em quando — ele também serve para levar tudo para outro aparelho.</p>
        <div className="btn-row" style={{ marginTop: 14 }}>
          <button type="button" className="btn primary" onClick={exportBackup}>
            <Icon name="download" size={18} /> Exportar
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={18} /> Importar
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importBackup} />
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Armazenamento</h2>
        </div>
        <div className="info-box">
          <Icon name={persisted ? 'shield' : 'info'} />
          <div>
            <strong>{persisted ? 'Protegido contra limpeza automática' : 'Proteção não garantida'}</strong>
            {persisted
              ? 'O navegador confirmou que não vai apagar os dados sozinho.'
              : 'Instale o app na tela inicial (menu do navegador → "Adicionar à tela inicial") para o navegador não apagar os dados sozinho, e faça backups.'}
          </div>
        </div>
        <dl className="detail-rows" style={{ marginTop: 8 }}>
          {counts.map(([label, n]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{n}</dd>
            </div>
          ))}
        </dl>
        <button type="button" className="btn danger block" style={{ marginTop: 12 }} onClick={clearAll}>
          <Icon name="trash" size={18} /> Apagar todos os dados
        </button>
      </section>

      <p className="muted small center">Central Pessoal · seus dados não saem do seu aparelho</p>

      {catSheet && <CategorySheet collection={catSheet.collection} initial={catSheet.item ?? undefined} onClose={() => setCatSheet(null)} />}
    </>
  );
}

/** Lista de categorias que abre e fecha, para não empurrar o resto da tela. */
function CategoryGroup({
  title,
  items,
  usage,
  onNew,
  onEdit,
  onDelete,
}: {
  title: string;
  items: Category[];
  usage: (id: string) => number;
  onNew: () => void;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}) {
  const [open, setOpen] = useState(false);
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
