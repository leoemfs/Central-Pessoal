import { useRef, useState, type ChangeEvent } from 'react';
import { emptyData, normalize, useStore } from '../store';
import type { Theme } from '../types';
import { todayISO } from '../utils';
import { Card, Icon, PageHeader } from '../ui';

const THEMES: { id: Theme; label: string }[] = [
  { id: 'system', label: 'Automático' },
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Escuro' },
];

export function Ajustes() {
  const { data, update, replace } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  function setTheme(theme: Theme) {
    update((d) => ({ ...d, settings: { ...d.settings, theme } }));
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `central-pessoal-backup-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage({ tone: 'ok', text: 'Backup exportado.' });
  }

  async function importBackup(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const imported = normalize(JSON.parse(await file.text()));
      const n = imported.tasks.length + imported.transactions.length + imported.habits.length + imported.notes.length + imported.events.length;
      if (!confirm(`Importar ${n} item(ns) de "${file.name}"? Isso substitui todos os dados atuais.`)) return;
      replace(imported);
      setMessage({ tone: 'ok', text: `Backup importado: ${n} item(ns).` });
    } catch {
      setMessage({ tone: 'error', text: 'Arquivo inválido. Escolha um backup .json exportado pela Central Pessoal.' });
    }
  }

  function clearAll() {
    if (confirm('Apagar TODOS os dados deste aparelho? Essa ação não pode ser desfeita. Exporte um backup antes, se quiser.')) {
      replace({ ...emptyData(), settings: data.settings });
      setMessage({ tone: 'ok', text: 'Todos os dados foram apagados.' });
    }
  }

  const counts = [
    ['Tarefas', data.tasks.length],
    ['Lançamentos', data.transactions.length],
    ['Hábitos', data.habits.length],
    ['Notas', data.notes.length],
    ['Eventos', data.events.length],
  ] as const;

  return (
    <>
      <PageHeader title="Ajustes" subtitle="Aparência, backup e dados" />

      {message && (
        <div className={`alert ${message.tone}`} role="status">
          {message.text}
        </div>
      )}

      <Card title="Aparência">
        <div className="segmented" role="radiogroup" aria-label="Tema">
          {THEMES.map((t) => (
            <button key={t.id} type="button" role="radio" aria-checked={data.settings.theme === t.id} className={data.settings.theme === t.id ? 'on' : ''} onClick={() => setTheme(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      <Card title="Backup">
        <p className="muted">
          Seus dados ficam salvos só neste navegador. Exporte um backup de vez em quando — e use-o para levar tudo para outro aparelho.
        </p>
        <div className="form-actions start">
          <button type="button" className="btn primary" onClick={exportBackup}>
            <Icon name="download" size={18} /> Exportar backup
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={18} /> Importar backup
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importBackup} />
        </div>
      </Card>

      <Card title="Seus dados">
        <dl className="kv">
          {counts.map(([label, n]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{n}</dd>
            </div>
          ))}
        </dl>
        <div className="card-foot">
          <button type="button" className="btn danger" onClick={clearAll}>
            <Icon name="trash" size={18} /> Apagar todos os dados
          </button>
        </div>
      </Card>

      <p className="muted small center">Central Pessoal · funciona offline · nenhum dado sai do seu aparelho</p>
    </>
  );
}
