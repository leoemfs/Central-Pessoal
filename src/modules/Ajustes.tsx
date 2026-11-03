import { useRef, useState, type ChangeEvent } from 'react';
import { useStore } from '../store';
import { remove } from '../actions';
import { emptyData, normalize } from '../data';
import type { Category } from '../types';
import { formatDMY, toISO, todayISO } from '../utils';
import { CategoryBadge, Icon, IconButton, PageHeader } from '../ui';
import { CategorySheet } from './financas/CategorySheet';

export function Ajustes() {
  const { data, update, replace, persisted } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ tone: 'green' | 'red'; text: string } | null>(null);
  const [catSheet, setCatSheet] = useState<Category | 'new' | null>(null);

  const usage = (id: string) => data.expenses.filter((e) => e.categoryId === id).length + data.series.filter((s) => s.categoryId === id).length;

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
      replace(normalize(emptyData()));
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
      <PageHeader title="Ajustes" subtitle="Categorias, backup e dados" />

      {message && (
        <div className={`alert ${message.tone}`} role="status">
          {message.text}
        </div>
      )}

      <section className="card">
        <div className="card-head">
          <h2>Categorias de despesa</h2>
          <button type="button" className="link" onClick={() => setCatSheet('new')}>
            + Nova
          </button>
        </div>
        <ul className="list">
          {data.categories.map((c) => (
            <li key={c.id} className="row">
              <CategoryBadge icon={c.icon} color={c.color} size={36} />
              <div className="row-body">
                <span className="row-title">{c.name}</span>
                <span className="row-meta">{usage(c.id)} lançamento(s)</span>
              </div>
              <div className="row-actions">
                <IconButton icon="edit" label={`Editar ${c.name}`} onClick={() => setCatSheet(c)} />
                <IconButton icon="trash" label={`Excluir ${c.name}`} tone="danger" onClick={() => deleteCategory(c)} />
              </div>
            </li>
          ))}
        </ul>
      </section>

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

      {catSheet && <CategorySheet initial={catSheet === 'new' ? undefined : catSheet} onClose={() => setCatSheet(null)} />}
    </>
  );
}
