import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties } from 'react';
import { useStore } from '../store';
import { discardedCount, emptyData, normalize } from '../data';
import { dbGet, dbSet } from '../db';
import type { Theme } from '../types';
import { formatDMY, toISO, todayISO } from '../utils';
import { Icon, notify, PageHeader, Segmented, Toggle, type IconName } from '../ui';
import { favoriteItems } from '../moduleBar';
import { FavoritesSheet } from './Mais';
import { ACCENTS, accentById } from '../theme';
import { fitFavorites, hiddenFrom, MIN_VISIBLE, MODULES, rhythmLabel, toggleModule, visibleFrom } from '../setup';
import { openSetup, openTutorial, RhythmPicker } from './Montagem';
import { GoogleCard } from './ContaGoogle';
import { disconnect, useCloud } from '../cloud';


const UNDO_KEY = 'antesDaImportacao';
interface Snapshot {
  at: string;
  reason: 'importacao' | 'apagar' | 'nuvem';
  data: unknown;
}

export function Ajustes() {
  const { data, update, replace, persisted } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ tone: 'green' | 'red'; text: string } | null>(null);
  const [favPick, setFavPick] = useState(false);
  // C3: cópia dos dados de antes da última importação (ou de "apagar tudo"), para desfazer.
  const [undo, setUndo] = useState<Snapshot | null>(null);
  useEffect(() => {
    dbGet<Snapshot | null>(UNDO_KEY).then((x) => setUndo(x && typeof x.at === 'string' ? x : null)).catch(() => setUndo(null));
  }, []);
  const broken = discardedCount(data);
  const cloud = useCloud();

  async function keepCopy(reason: Snapshot['reason']): Promise<boolean> {
    const snap: Snapshot = { at: new Date().toISOString(), reason, data };
    try {
      await dbSet(UNDO_KEY, snap);
      setUndo(snap);
      return true;
    } catch {
      return false;
    }
  }

  function undoLast() {
    if (!undo) return;
    const what = undo.reason === 'importacao' ? 'a importação' : undo.reason === 'nuvem' ? 'o "usar a cópia da nuvem"' : 'o "apagar tudo"';
    if (!confirm(`Desfazer ${what} de ${formatDMY(toISO(new Date(undo.at)))}? Os dados voltam a ser os de antes, e o que foi feito depois disso se perde.`)) return;
    replace(normalize(undo.data));
    dbSet(UNDO_KEY, null).catch(() => undefined);
    setUndo(null);
    setMessage({ tone: 'green', text: 'Pronto: os dados voltaram a ser os de antes.' });
  }
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
    a.download = `cp-hub-backup-${todayISO()}.json`;
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
      const synced = cloud ? ' Com a conta Google ligada, o backup também vale para os outros aparelhos.' : '';
      if (!confirm(`Importar ${n} item(ns) de "${file.name}"? Isso substitui todos os dados atuais deste aparelho (dá para desfazer depois, aqui em Backup).${synced}`)) return;
      if (!(await keepCopy('importacao')) && !confirm('Não foi possível guardar uma cópia dos dados atuais para desfazer. Importar mesmo assim?')) return;
      replace(imported);
      const bad = discardedCount(imported) - broken;
      setMessage({ tone: 'green', text: `Backup importado: ${n} item(ns).${bad > 0 ? ` ${bad} registro(s) com defeito ficaram guardados à parte.` : ''}` });
    } catch {
      setMessage({ tone: 'red', text: 'Arquivo inválido. Escolha um backup .json exportado pelo CP Hub.' });
    }
  }

  async function clearAll() {
    const synced = cloud ? ' A conta Google será desligada neste aparelho: a cópia no Drive e os outros aparelhos continuam com os dados.' : '';
    if (confirm(`Apagar TODOS os dados deste aparelho? Dá para desfazer em Backup logo depois; mesmo assim, exporte um backup antes, se quiser.${synced}`)) {
      await keepCopy('apagar');
      // Sem isso, "apagar" viraria exclusão em todos os aparelhos na próxima sincronização.
      if (cloud) disconnect();
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
        <p className="muted small">Os ícones da barra de baixo ao lado do Início (4, ou 3 com o botão Mais ligado). Dentro de um módulo, a estrela na ponta da barra mostra os favoritos para trocar de módulo.</p>
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

        <h3 className="pz-title">Módulos à vista</h3>
        <p className="muted small">Desligado vai para Mais › Guardados, sem apagar nada. Pelo menos {MIN_VISIBLE} à vista.</p>
        <div className="chips" role="group" aria-label="Módulos à vista">
          {MODULES.map((m) => {
            const visible = visibleFrom(data.settings.hiddenModules);
            const on = visible.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                className={`chip-btn${on ? ' on' : ''}`}
                aria-pressed={on}
                onClick={() => {
                  const next = toggleModule(visible, m.id);
                  if (next === visible) return notify(`Pelo menos ${MIN_VISIBLE} módulos`, 'Ligue outro antes de desligar este.');
                  update((d) => ({ ...d, settings: { ...d.settings, hiddenModules: hiddenFrom(next), favorites: fitFavorites(d.settings.favorites, next), ...(m.id === 'jornada' ? { journeyWanted: !on } : {}) } }));
                  notify(m.label, on ? 'Foi para Mais › Guardados.' : 'De volta à vista.');
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {!data.settings.hiddenModules.includes('diario') && (
          <>
            <h3 className="pz-title">Ritmo do Diário</h3>
            <p className="muted small">Agora: {rhythmLabel(data.settings.journalRhythm)}. O Início só convida nesse ritmo e nunca conta falta.</p>
            <RhythmPicker value={data.settings.journalRhythm} onChange={(journalRhythm) => setSetting({ journalRhythm })} />
          </>
        )}

        <div className="toggle-row">
          <div>
            <strong>Botão Mais na barra</strong>
            <span className="muted small">Desligado: 4 favoritos no Início, e o Mais abre puxando a barra para cima (ou pelo menu ☰). Ligado: 3 favoritos e o Mais na ponta. Puxar funciona nos dois jeitos.</span>
          </div>
          <Toggle checked={data.settings.moreButton} onChange={(v) => setSetting({ moreButton: v })} label="Botão Mais na barra" />
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
        <h3 className="pz-title">Tela Mais</h3>
        <p className="muted small">Lista mostra o que tem em cada módulo; grade mostra tudo de uma vez, com ícones.</p>
        <Segmented<'lista' | 'grade'>
          label="Tela Mais"
          value={data.settings.moreLayout}
          onChange={(v) => setSetting({ moreLayout: v })}
          options={[
            { value: 'lista', label: 'Lista' },
            { value: 'grade', label: 'Grade' },
          ]}
        />
        <div className="btn-row" style={{ marginTop: 14 }}>
          <button type="button" className="btn soft small" onClick={() => openSetup('convite')}>
            <Icon name="grid" size={16} /> Refazer a montagem do app
          </button>
          <button type="button" className="btn ghost small" onClick={openTutorial}>
            Como usar a barra
          </button>
        </div>
      </section>
      {favPick && <FavoritesSheet onClose={() => setFavPick(false)} />}

      <GoogleCard onMessage={setMessage} />

      <section className="card">
        <div className="card-head">
          <h2>Backup</h2>
          <span className="muted small">{data.settings.lastBackupAt ? `Último: ${formatDMY(toISO(new Date(data.settings.lastBackupAt)))}` : 'Nenhum ainda'}</span>
        </div>
        <p className="muted">{cloud ? 'Além da cópia no Google Drive, você pode exportar um arquivo de backup de vez em quando.' : 'Seus dados ficam só neste aparelho. Exporte um backup de vez em quando — ele também serve para levar tudo para outro aparelho.'}</p>
        <div className="btn-row" style={{ marginTop: 14 }}>
          <button type="button" className="btn primary" onClick={exportBackup}>
            <Icon name="download" size={18} /> Exportar
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={18} /> Importar
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importBackup} />
        {data.journal.some((e) => e.photos.length > 0) && (
          <p className="muted small" style={{ marginTop: 10 }}>
            As fotos do Diário não vão no arquivo de backup: ficam neste aparelho{cloud ? ' e no seu Google Drive' : ' (ligue a conta Google para guardá-las no Drive)'}.
          </p>
        )}
        {undo && (
          <button type="button" className="btn ghost" style={{ marginTop: 10, width: '100%' }} onClick={undoLast}>
            <Icon name="undo" size={18} /> Desfazer {undo.reason === 'importacao' ? 'importação' : undo.reason === 'nuvem' ? '"usar a da nuvem"' : '"apagar tudo"'} de {formatDMY(toISO(new Date(undo.at)))}
          </button>
        )}
        {broken > 0 && (
          <p className="muted small" style={{ marginTop: 10 }}>
            {broken} registro(s) com defeito foram guardados à parte para não travar o app. Eles vão junto no backup.
          </p>
        )}
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

      <p className="muted small center">CP Hub · {cloud ? 'seus dados ficam no aparelho e no seu Google Drive' : 'seus dados não saem do seu aparelho'}</p>

    </>
  );
}
