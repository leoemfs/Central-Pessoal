import { useRef, useState, type ChangeEvent, type CSSProperties } from 'react';
import { useStore } from '../store';
import { emptyData, normalize } from '../data';
import type { Theme } from '../types';
import { formatDMY, toISO, todayISO } from '../utils';
import { Icon, PageHeader, Segmented } from '../ui';
import { ACCENTS, accentById } from '../theme';

export function Ajustes() {
  const { data, update, replace, persisted } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ tone: 'green' | 'red'; text: string } | null>(null);
  function setAccent(accent: string | null) {
    update((d) => ({ ...d, settings: { ...d.settings, accent } }));
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
          <h2>Temas</h2>
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
        <div className="field" style={{ marginTop: 14 }}>
          <span className="field-label">Cor de destaque</span>
          <div className="swatches" role="radiogroup" aria-label="Cor de destaque">
            <button
              type="button"
              role="radio"
              aria-checked={data.settings.accent === null}
              aria-label="Padrão (verde no escuro, azul no claro)"
              className={`swatch accent-default${data.settings.accent === null ? ' on' : ''}`}
              onClick={() => setAccent(null)}
            >
              {data.settings.accent === null && <Icon name="check" size={18} />}
            </button>
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={data.settings.accent === a.id}
                aria-label={a.name}
                className={`swatch accent-swatch${data.settings.accent === a.id ? ' on' : ''}`}
                style={{ '--sw-d': a.dark.fill, '--sw-l': a.light.fill, '--sw-on-d': a.dark.on, '--sw-on-l': a.light.on } as CSSProperties}
                onClick={() => setAccent(a.id)}
              >
                {data.settings.accent === a.id && <Icon name="check" size={18} />}
              </button>
            ))}
          </div>
          <p className="muted small" style={{ marginTop: 8 }}>
            {data.settings.accent ? `${accentById(data.settings.accent)?.name}, nos dois temas.` : 'Padrão: verde no tema escuro e azul no claro.'} Muda botões, abas e destaques. As cores de situação não mudam: pago é verde, pendente é laranja e atrasado é vermelho.
          </p>
        </div>
      </section>

      <a className="tile" href="#/financas/categorias">
        <span className="tile-icon">
          <Icon name="wallet" />
        </span>
        <span className="tile-text">
          <strong>Categorias de Finanças</strong>
          <span className="muted">Agora ficam em Finanças, no botão +</span>
        </span>
        <Icon name="right" size={18} />
      </a>

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

    </>
  );
}
