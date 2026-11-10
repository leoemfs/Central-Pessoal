import { useRef, useState, type ChangeEvent, type CSSProperties } from 'react';
import { useStore } from '../store';
import { emptyData, normalize } from '../data';
import type { Theme } from '../types';
import { formatDMY, toISO, todayISO } from '../utils';
import { Icon, notify, PageHeader, Segmented, Toggle, type IconName } from '../ui';
import { favoriteItems } from '../moduleBar';
import { FavoritesSheet } from './Mais';
import { ACCENTS, accentById } from '../theme';

const BAR_LAYOUTS: { id: 'fixo' | 'lado' | 'centro'; label: string; hint: string; demo: string[] }[] = [
  { id: 'fixo', label: 'Favorito no mesmo lugar', hint: 'O módulo fica onde está nos favoritos (ex.: Agenda em 3º); as ferramentas ocupam os outros espaços.', demo: ['H', 'f', 'f', 'M', '+'] },
  { id: 'lado', label: 'Módulo ao lado do Início', hint: 'O módulo vai para o 1º espaço do meio; as ferramentas ficam à direita.', demo: ['H', 'M', 'f', 'f', '+'] },
  { id: 'centro', label: 'Módulo no centro', hint: 'O módulo vai para o meio; as ferramentas ficam dos lados.', demo: ['H', 'f', 'M', 'f', '+'] },
];

export function Ajustes() {
  const { data, update, replace, persisted } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ tone: 'green' | 'red'; text: string } | null>(null);
  const [favPick, setFavPick] = useState(false);
  function setSetting(patch: Partial<typeof data.settings>) {
    update((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }

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
      <PageHeader title="Configurações" subtitle="Personalização, atalhos de categorias, backup e dados" />

      {message && (
        <div className={`alert ${message.tone}`} role="status">
          {message.text}
        </div>
      )}

      <section className="card">
        <div className="card-head">
          <h2>Personalização</h2>
        </div>
        <h3 className="pz-title">Tema</h3>
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

        <h3 className="pz-title">Favoritos do Início</h3>
        <p className="muted small">Os 3 ícones do meio da barra de baixo quando você está no Início.</p>
        <div className="fav-row">
          {favoriteItems(data.settings.favorites).map((f) => (
            <span key={f.id} className="fav-chip">
              <Icon name={f.icon as IconName} size={18} /> {f.label}
            </span>
          ))}
          <button type="button" className="btn soft small" onClick={() => setFavPick(true)}>
            <Icon name="edit" size={16} /> Trocar
          </button>
        </div>

        <h3 className="pz-title">Barra de baixo dentro de um módulo</h3>
        <div className="pz-options" role="radiogroup" aria-label="Jeito da barra de baixo">
          {BAR_LAYOUTS.map((o) => (
            <button key={o.id} type="button" role="radio" aria-checked={data.settings.barLayout === o.id} className={`option-card${data.settings.barLayout === o.id ? ' on' : ''}`} onClick={() => {
                setSetting({ barLayout: o.id });
                notify('Barra de baixo', o.label);
              }}>
              <strong>{o.label}</strong>
              <span className="muted small">{o.hint}</span>
              <span className="pz-demo" aria-hidden="true">
                {o.demo.map((d, k) => (
                  <i key={k} className={d === 'M' ? 'mod' : d === 'H' ? 'home' : ''}>
                    {d === 'H' ? '⌂' : d === 'M' ? 'Agenda' : d === '+' ? '⋯' : 'ferr.'}
                  </i>
                ))}
              </span>
            </button>
          ))}
        </div>
        <div className="toggle-row">
          <div>
            <strong>Tocar de novo no módulo mostra os favoritos</strong>
            <span className="muted small">Para trocar de módulo sem passar pelo Início.</span>
          </div>
          <Toggle checked={data.settings.tapToFavorites} onChange={(v) => setSetting({ tapToFavorites: v })} label="Tocar de novo mostra os favoritos" />
        </div>
        <div className="toggle-row">
          <div>
            <strong>Esconder as barras ao rolar</strong>
            <span className="muted small">A barra de cima, o mês e as abas e a barra de baixo somem ao rolar para baixo e voltam ao subir.</span>
          </div>
          <Toggle checked={data.settings.hideOnScroll} onChange={(v) => setSetting({ hideOnScroll: v })} label="Esconder as barras ao rolar" />
        </div>
      </section>
      {favPick && <FavoritesSheet onClose={() => setFavPick(false)} />}

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
      <a className="tile" href="#/listas/categorias">
        <span className="tile-icon">
          <Icon name="cart" />
        </span>
        <span className="tile-text">
          <strong>Categorias de Listas</strong>
          <span className="muted">Ficam em Listas, no botão +</span>
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
